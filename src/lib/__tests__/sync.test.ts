import { DocStore } from '../docs';
import { syncOnce, type SyncTransport } from '../syncEngine';
import type { SyncDoc } from '../syncTypes';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

/** Servidor en memoria con la misma regla que el Worker: gana el updatedAt mayor. */
class FakeServer implements SyncTransport {
  rows = new Map<string, SyncDoc & { syncedAt: number }>();
  clock = 1_000_000;

  push = async (docs: SyncDoc[]) => {
    const now = (this.clock += 10);
    for (const d of docs) {
      const cur = this.rows.get(d.key);
      if (!cur || d.updatedAt > cur.updatedAt) this.rows.set(d.key, { ...d, syncedAt: now });
    }
    return { accepted: docs.length, serverTime: now };
  };

  pull = async (since: number) => {
    const serverTime = (this.clock += 10);
    const docs = [...this.rows.values()].filter((r) => r.syncedAt > since).map(({ syncedAt: _s, ...d }) => d);
    return { docs, serverTime, hasMore: false, nextSince: serverTime };
  };
}

describe('DocStore', () => {
  it('guarda, marca pendiente y persiste', () => {
    const storage = new MemoryStorage();
    const a = new DocStore(storage);
    a.set('settings', { wake: '06:30' });
    expect(a.hasPending()).toBe(true);
    const b = new DocStore(storage);
    expect(b.get('settings', {})).toEqual({ wake: '06:30' });
    expect(b.dirtyDocs()).toHaveLength(1);
  });

  it('migra los datos de la primera versión', () => {
    const storage = new MemoryStorage();
    storage.setItem('ritmo-diario:v1:settings', JSON.stringify({ wake: '06:00' }));
    storage.setItem('ritmo-diario:v1:checks:2026-10-12', JSON.stringify({ luz: true, cafe: false }));
    storage.setItem('ritmo-diario:v1:coldLog', JSON.stringify([1760000000000]));
    const s = new DocStore(storage);
    expect(s.get('settings', {})).toEqual({ wake: '06:00' });
    expect(s.get('check:2026-10-12:luz', false)).toBe(true);
    expect(s.keys('check:2026-10-12:')).toEqual(['check:2026-10-12:luz']);
    expect(s.keys('log:cold:')).toHaveLength(1);
  });

  it('el dato remoto más reciente gana y el antiguo no pisa', () => {
    const s = new DocStore(new MemoryStorage());
    s.set('settings', { wake: '07:00' });
    const localStamp = s.dirtyDocs()[0]!.updatedAt;
    s.applyRemote([{ key: 'settings', value: { wake: '05:00' }, updatedAt: '2000-01-01T00:00:00.000Z', deleted: false }]);
    expect(s.get('settings', {})).toEqual({ wake: '07:00' });
    expect(s.hasPending()).toBe(true);
    const later = new Date(Date.parse(localStamp) + 1000).toISOString();
    s.applyRemote([{ key: 'settings', value: { wake: '08:00' }, updatedAt: later, deleted: false }]);
    expect(s.get('settings', {})).toEqual({ wake: '08:00' });
    expect(s.hasPending()).toBe(false);
  });

  it('no da por subido un documento que cambió durante el envío', () => {
    const s = new DocStore(new MemoryStorage());
    s.set('check:2026-10-12:luz', true);
    const sent = s.dirtyDocs();
    s.set('check:2026-10-12:luz', false);
    s.ackPushed(sent);
    expect(s.hasPending()).toBe(true);
  });
});

describe('sincronización entre dos dispositivos', () => {
  it('lo marcado en el móvil aparece en el ordenador y viceversa', async () => {
    const server = new FakeServer();
    const phone = new DocStore(new MemoryStorage());
    const laptop = new DocStore(new MemoryStorage());
    phone.linkAccount('u1');
    laptop.linkAccount('u1');

    phone.set('check:2026-10-12:luz', true);
    laptop.set('check:2026-10-12:cafe', true);
    await syncOnce(phone, server);
    await syncOnce(laptop, server);
    await syncOnce(phone, server);

    for (const d of [phone, laptop]) {
      expect(d.get('check:2026-10-12:luz', false)).toBe(true);
      expect(d.get('check:2026-10-12:cafe', false)).toBe(true);
      expect(d.hasPending()).toBe(false);
    }
  });

  it('al vincular una cuenta se suben los datos que ya había en el dispositivo', async () => {
    const server = new FakeServer();
    const storage = new MemoryStorage();
    const before = new DocStore(storage);
    before.set('settings', { wake: '06:15' });
    await before.ackPushed(before.dirtyDocs());
    expect(before.hasPending()).toBe(false);

    before.linkAccount('u1');
    await syncOnce(before, server);
    expect(server.rows.get('settings')?.value).toEqual({ wake: '06:15' });
  });

  it('propaga los borrados', async () => {
    const server = new FakeServer();
    const a = new DocStore(new MemoryStorage());
    const b = new DocStore(new MemoryStorage());
    a.set('log:cold:1', { s: 90 });
    await syncOnce(a, server);
    await syncOnce(b, server);
    expect(b.keys('log:cold:')).toEqual(['log:cold:1']);
    a.remove('log:cold:1');
    await syncOnce(a, server);
    await syncOnce(b, server);
    expect(b.keys('log:cold:')).toEqual([]);
  });
});
