import { useMemo, useState } from 'react';
import { LIBRARY, PROTOCOL_COUNT, normalize } from '../lib/protocols';
import { KEYS, readJSON, writeJSON } from '../lib/storage';
import type { LibCategoryId } from '../types';

type Filter = LibCategoryId | 'todas';

export function BibliotecaPage(): JSX.Element {
  const [filter, setFilter] = useState<Filter>(() => readJSON<Filter>(KEYS.libCategory, 'todas'));
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return LIBRARY.filter((c) => filter === 'todas' || c.id === filter).flatMap((cat) =>
      cat.protocols
        .map((p, i) => ({ cat, p, n: i + 1 }))
        .filter(({ p }) => !q || normalize(`${p.title} ${p.points.join(' ')} ${cat.name}`).includes(q)),
    );
  }, [filter, query]);

  function choose(f: Filter): void {
    setFilter(f);
    writeJSON(KEYS.libCategory, f);
  }

  return (
    <>
      <div className="section-head">
        <h1>Los {PROTOCOL_COUNT} protocolos</h1>
        <p className="muted">
          {results.length} de {PROTOCOL_COUNT}
        </p>
      </div>
      <div className="lib-tools">
        <input
          type="search"
          id="q"
          placeholder="Buscar: cafeína, frío, proteína…"
          aria-label="Buscar protocolos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Filtrar por categoría">
          <button type="button" className="chip" aria-pressed={filter === 'todas'} onClick={() => choose('todas')}>
            Todas
          </button>
          {LIBRARY.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={filter === c.id}
              onClick={() => choose(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      {results.length === 0 ? (
        <p className="empty">No hay protocolos con «{query}». Prueba con otra palabra.</p>
      ) : (
        <div className="lib">
          {results.map(({ cat, p, n }) => (
            <details key={`${cat.id}-${n}`} className={`p cat-${cat.id}`}>
              <summary>
                <span className="code">
                  {cat.name.split(' ')[0]?.toUpperCase()} {String(n).padStart(2, '0')}
                </span>
                <span className="ti">{p.title}</span>
              </summary>
              <ul>
                {p.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
