import { parseSyncPush } from '../validate';
import { signSession, verifySession } from '../session';

const ok = (key: string, extra: Record<string, unknown> = {}) => ({
  key,
  value: true,
  updatedAt: '2026-10-12T10:00:00.000Z',
  ...extra,
});

describe('validación de /api/sync', () => {
  it('acepta documentos válidos', () => {
    const r = parseSyncPush({ docs: [ok('settings'), ok('check:2026-10-12:luz'), ok('log:cold:1760000000000')] });
    expect(r.ok).toBe(true);
  });

  it('rechaza claves, fechas y tamaños inválidos', () => {
    expect(parseSyncPush({ docs: 'x' }).ok).toBe(false);
    expect(parseSyncPush({ docs: [ok('Settings')] }).ok).toBe(false);
    expect(parseSyncPush({ docs: [ok('check:../x')] }).ok).toBe(false);
    expect(parseSyncPush({ docs: [ok('settings', { updatedAt: '2026-10-12' })] }).ok).toBe(false);
    expect(parseSyncPush({ docs: [ok('settings', { updatedAt: '2999-01-01T00:00:00.000Z' })] }).ok).toBe(false);
    expect(parseSyncPush({ docs: [ok('settings'), ok('settings')] }).ok).toBe(false);
    expect(parseSyncPush({ docs: [ok('settings', { value: 'x'.repeat(30_000) })] }).ok).toBe(false);
  });

  it('un borrado no guarda valor', () => {
    const r = parseSyncPush({ docs: [ok('log:cold:1', { deleted: true, value: { s: 1 } })] });
    expect(r.ok && r.value[0]?.value).toBeNull();
  });
});

describe('sesión firmada', () => {
  it('verifica la firma y la caducidad', async () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = await signSession({ uid: 'u1', exp }, 'secreto');
    expect(await verifySession(token, 'secreto')).toEqual({ uid: 'u1', exp });
    expect(await verifySession(token, 'otro')).toBeNull();
    expect(await verifySession(`${token}x`, 'secreto')).toBeNull();
    const old = await signSession({ uid: 'u1', exp: 1 }, 'secreto');
    expect(await verifySession(old, 'secreto')).toBeNull();
  });
});
