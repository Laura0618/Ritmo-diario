import { useEffect, useMemo, useRef, useState } from 'react';
import { HabitForm } from './HabitForm';
import { LIBRARY, normalize } from '../../lib/protocols';
import { LIBRARY_HABITS, describeFreq, describeTime, fromLibrary, newCustomHabit } from '../../lib/habits';
import type { Habit, LibCategoryId, Settings } from '../../types';

interface Props {
  existingIds: ReadonlySet<string>;
  settings: Settings;
  onAdd: (habit: Habit) => void;
  onClose: () => void;
}

type Tab = 'libro' | 'propio';

/** Panel del boton «+»: elegir un protocolo del libro o crear un habito propio. */
export function AddHabitSheet({ existingIds, settings, onAdd, onClose }: Props): JSX.Element {
  const [tab, setTab] = useState<Tab>('libro');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<LibCategoryId | 'todas'>('todas');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return LIBRARY_HABITS.filter(
      (h) =>
        (cat === 'todas' || h.category === cat) &&
        (!q || normalize(`${h.what} ${h.how} ${h.categoryName}`).includes(q)),
    );
  }, [query, cat]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2 id="sheet-title">Añadir hábito</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="seg sheet-tabs" role="tablist" aria-label="Origen del hábito">
          <button type="button" role="tab" aria-selected={tab === 'libro'} aria-pressed={tab === 'libro'} onClick={() => setTab('libro')}>
            Del libro
          </button>
          <button type="button" role="tab" aria-selected={tab === 'propio'} aria-pressed={tab === 'propio'} onClick={() => setTab('propio')}>
            Propio
          </button>
        </div>

        {tab === 'libro' ? (
          <div className="sheet-body">
            <input
              type="search"
              className="sheet-search"
              placeholder="Buscar: luz, frío, proteína…"
              aria-label="Buscar protocolos"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="chips" role="group" aria-label="Categoría">
              <button type="button" className="chip" aria-pressed={cat === 'todas'} onClick={() => setCat('todas')}>
                Todas
              </button>
              {LIBRARY.map((c) => (
                <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
            <ul className="lib-pick">
              {results.map((h) => {
                const added = existingIds.has(h.id);
                return (
                  <li key={h.id}>
                    <div className="lib-pick-text">
                      <p className="what">{h.what}</p>
                      <p className="small muted">
                        {h.categoryName} · {describeFreq(h.freq)}
                        {h.time ? ` · ${describeTime(h.time)}` : ''}
                      </p>
                      <p className="small">{h.how}</p>
                    </div>
                    {added ? (
                      <span className="added" aria-live="polite">
                        {justAdded === h.id ? 'Añadido' : 'Ya lo tienes'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn small-btn"
                        onClick={() => {
                          const habit = fromLibrary(h.id);
                          if (habit) onAdd(habit);
                          setJustAdded(h.id);
                        }}
                        aria-label={`Añadir ${h.what}`}
                      >
                        + Añadir
                      </button>
                    )}
                  </li>
                );
              })}
              {results.length === 0 && <li className="empty">Ningún protocolo con «{query}».</li>}
            </ul>
          </div>
        ) : (
          <div className="sheet-body">
            <p className="lede">Lo que quieras seguir: estiramientos, vitaminas, leer 10 páginas…</p>
            <HabitForm
              idPrefix="new"
              initial={{ what: '', how: '', tag: 'cuerpo', freq: { per: 'day' }, time: null }}
              editableText
              settings={settings}
              submitLabel="Añadir hábito"
              onSubmit={(draft) => {
                onAdd(newCustomHabit(draft));
                onClose();
              }}
              onCancel={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
