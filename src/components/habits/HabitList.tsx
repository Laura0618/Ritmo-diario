import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { HabitForm } from './HabitForm';
import { describeFreq, describeTime, type TodayHabit } from '../../lib/habits';
import { TAG_LABEL } from '../../lib/tags';
import { formatTime } from '../../lib/time';
import type { Habit, Settings } from '../../types';

interface Props {
  items: readonly TodayHabit[];
  editing: boolean;
  settings: Settings;
  nextId: string | null;
  onToggle: (id: string, done: boolean) => void;
  onMove: (from: number, to: number) => void;
  onUpdate: (habit: Habit) => void;
  onRemove: (id: string) => void;
}

/** Lista de habitos de hoy. En modo edicion: arrastrar o flechas para ordenar, ajustar y quitar. */
export function HabitList({ items, editing, settings, nextId, onToggle, onMove, onUpdate, onRemove }: Props): JSX.Element {
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; from: number; to: number } | null>(null);
  const rows = useRef<Map<string, HTMLLIElement>>(new Map());

  // Orden mostrado mientras se arrastra (sin guardar hasta soltar).
  const shown = drag ? reorder(items, drag.from, drag.to) : items;

  function startDrag(e: ReactPointerEvent<HTMLButtonElement>, id: string, index: number): void {
    e.preventDefault();
    setDrag({ id, from: index, to: index });
  }

  // Durante el arrastre se escucha en la ventana: al mover la fila en el DOM el boton
  // pierde la captura del puntero y dejaria de recibir eventos.
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent): void => {
      const d = dragRef.current;
      if (!d) return;
      // Posicion final = cuantas filas (sin contar la arrastrada) quedan por encima del puntero.
      let target = 0;
      for (const item of items) {
        if (item.habit.id === d.id) continue;
        const r = rows.current.get(item.habit.id)?.getBoundingClientRect();
        if (r && e.clientY > r.top + r.height / 2) target++;
      }
      if (target !== d.to) setDrag({ ...d, to: target });
    };
    const handleUp = (): void => {
      const d = dragRef.current;
      if (d && d.to !== d.from) onMove(d.from, d.to);
      setDrag(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging, items, onMove]);

  return (
    <ol className={`habit-today${editing ? ' editing' : ''}`}>
      {shown.map((item) => {
        const { habit } = item;
        const index = items.findIndex((i) => i.habit.id === habit.id);
        const weekly = habit.freq.per === 'week';
        const classes = [
          item.doneToday ? 'done' : '',
          item.weekMet ? 'met' : '',
          !editing && nextId === habit.id ? 'is-next' : '',
          drag?.id === habit.id ? 'dragging' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li
            key={habit.id}
            className={classes || undefined}
            ref={(el) => {
              if (el) rows.current.set(habit.id, el);
              else rows.current.delete(habit.id);
            }}
          >
            <div className="habit-line">
              {editing ? (
                <button
                  type="button"
                  className="drag-handle"
                  aria-label={`Arrastrar para ordenar: ${habit.what}`}
                  onPointerDown={(e) => startDrag(e, habit.id, index)}
                >
                  <svg width="14" height="20" viewBox="0 0 14 20" aria-hidden="true">
                    {[4, 10, 16].flatMap((y) => [3, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />))}
                  </svg>
                </button>
              ) : (
                <input
                  type="checkbox"
                  className="check"
                  id={`chk-${habit.id}`}
                  checked={item.doneToday}
                  onChange={(e) => onToggle(habit.id, e.target.checked)}
                  aria-label={`Hecho hoy: ${habit.what}`}
                />
              )}

              <label htmlFor={editing ? undefined : `chk-${habit.id}`} className="item-body">
                <span className="what">{habit.what}</span>
                <span className={`tag ${habit.tag}`}>{TAG_LABEL[habit.tag]}</span>
                {habit.how && <span className="how">{habit.how}</span>}
              </label>

              {editing ? (
                <div className="row-actions">
                  <button type="button" className="icon-btn" aria-label="Subir" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Bajar"
                    disabled={index === items.length - 1}
                    onClick={() => onMove(index, index + 1)}
                  >
                    ↓
                  </button>
                </div>
              ) : (
                <div className="habit-meta">
                  {item.t !== null && <span className="mono">{formatTime(item.t)}</span>}
                  {weekly && habit.freq.per === 'week' && (
                    <span className={`week-count${item.weekDone >= habit.freq.times ? ' ok' : ''}`}>
                      {item.weekDone}/{habit.freq.times}
                      <span className="sr-only"> esta semana</span>
                      <span aria-hidden="true"> sem</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {editing && (
              <div className="habit-edit">
                <p className="small muted">
                  {describeFreq(habit.freq)}
                  {habit.time ? ` · ${describeTime(habit.time)}` : ' · sin hora'}
                  {habit.source === 'libro' ? ' · del libro' : ''}
                </p>
                <div className="btn-row">
                  <button
                    type="button"
                    className="link-btn"
                    aria-expanded={adjusting === habit.id}
                    onClick={() => setAdjusting(adjusting === habit.id ? null : habit.id)}
                  >
                    Ajustar
                  </button>
                  {confirmRemove === habit.id ? (
                    <>
                      <button
                        type="button"
                        className="btn danger small-btn"
                        onClick={() => {
                          onRemove(habit.id);
                          setConfirmRemove(null);
                        }}
                      >
                        Quitar
                      </button>
                      <button type="button" className="link-btn" onClick={() => setConfirmRemove(null)}>
                        No
                      </button>
                    </>
                  ) : (
                    <button type="button" className="link-btn danger-link" onClick={() => setConfirmRemove(habit.id)}>
                      Quitar
                    </button>
                  )}
                </div>
                {adjusting === habit.id && (
                  <HabitForm
                    idPrefix={`adj-${habit.id}`}
                    initial={{ what: habit.what, how: habit.how, tag: habit.tag, freq: habit.freq, time: habit.time }}
                    editableText={habit.source === 'propio'}
                    settings={settings}
                    submitLabel="Guardar"
                    onSubmit={(draft) => {
                      onUpdate({ ...habit, ...draft });
                      setAdjusting(null);
                    }}
                    onCancel={() => setAdjusting(null)}
                  />
                )}
              </div>
            )}

            {!editing && item.weekMet && <p className="small muted met-note">Objetivo de la semana cumplido</p>}
          </li>
        );
      })}
    </ol>
  );
}

function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}
