import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useNow } from '../hooks/useNow';
import { usePlan } from '../hooks/usePlan';
import { docStore, useDocsVersion } from '../lib/docs';
import { changeKind, waterForSession, waterPerInterval } from '../lib/plan';
import { WEEKDAYS, dateKey } from '../lib/time';
import { useSettings } from '../store/SettingsProvider';
import type { WeekDay, WorkoutKind } from '../types';

const KIND_LABEL: Record<WorkoutKind, string> = { cardio: 'Cardio', fuerza: 'Fuerza', descanso: 'Descanso' };
const KINDS: readonly WorkoutKind[] = ['cardio', 'fuerza', 'descanso'];
/** Habito de Hoy que se marca al completar la sesion. */
const KIND_HABIT: Partial<Record<WorkoutKind, string>> = { cardio: 'lib-ejercicio-3', fuerza: 'lib-ejercicio-2' };
const SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function SemanaPage(): JSX.Element {
  const { settings, update } = useSettings();
  const now = useNow();
  useDocsVersion();
  const { config } = useHabits();
  const { plan, setDay, reset, customized } = usePlan();
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState(false);

  const date = new Date(now);
  date.setDate(now.getDate() + offset);
  const weekday = date.getDay();
  const day = plan.days[weekday] ?? plan.days[0]!;
  const isToday = offset === 0;

  const perInterval = waterPerInterval(settings.kg);
  const total = waterForSession(settings.kg, day.minutes);

  const habitId = KIND_HABIT[day.kind];
  const hasHabit = habitId ? config.list.some((h) => h.id === habitId) : false;
  const doneKey = habitId ? `check:${dateKey(now)}:${habitId}` : '';
  const done = habitId ? docStore.get(doneKey, false) : false;

  const edit = (next: WeekDay): void => setDay(weekday, next);

  return (
    <>
      <div className="section-head">
        <h1>Semana</h1>
        <p className="muted">Una guía, no una obligación: si un día no encaja, cámbialo.</p>
      </div>

      <div className="week-strip" role="tablist" aria-label="Días de la semana">
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() + i);
          const pd = plan.days[d.getDay()];
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={offset === i}
              className={`day-pill${offset === i ? ' on' : ''}`}
              onClick={() => {
                setOffset(i);
                setEditing(false);
              }}
              aria-label={`${i === 0 ? 'Hoy, ' : ''}${WEEKDAYS[d.getDay()]}: ${pd?.title ?? ''}`}
            >
              <span className="day-pill-name">{i === 0 ? 'Hoy' : SHORT[d.getDay()]}</span>
              <span className={`day-dot ${pd?.kind ?? 'descanso'}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <article className="panel workout" aria-live="polite">
        <div className="workout-head">
          <p className="eyebrow">{isToday ? `Hoy, ${WEEKDAYS[weekday]}` : cap(WEEKDAYS[weekday] ?? '')}</p>
          <button type="button" className="text-btn" onClick={() => setEditing(!editing)} aria-expanded={editing}>
            {editing ? 'Listo' : 'Editar'}
          </button>
        </div>

        {editing ? (
          <div className="day-editor">
            <div className="seg full" role="group" aria-label="Tipo de sesión">
              {KINDS.map((k) => (
                <button key={k} type="button" aria-pressed={day.kind === k} onClick={() => edit(changeKind(day, k))}>
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
            <label className="field" htmlFor="wd-title">
              Nombre
              <input
                id="wd-title"
                type="text"
                value={day.title}
                maxLength={60}
                onChange={(e) => edit({ ...day, title: e.target.value })}
              />
            </label>
            {day.kind !== 'descanso' && (
              <label className="field" htmlFor="wd-min">
                Duración (min)
                <input
                  id="wd-min"
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={240}
                  step={5}
                  value={day.minutes || ''}
                  onChange={(e) => edit({ ...day, minutes: Math.max(0, Math.min(240, Number(e.target.value) || 0)) })}
                />
              </label>
            )}
            <label className="field" htmlFor="wd-note">
              Nota (opcional)
              <input
                id="wd-note"
                type="text"
                value={day.effort}
                maxLength={160}
                placeholder="Ej.: suave, puedes hablar"
                onChange={(e) => edit({ ...day, effort: e.target.value })}
              />
            </label>
            <p className="note">Cada {WEEKDAYS[weekday]} será así a partir de ahora.</p>
          </div>
        ) : (
          <>
            <div className="workout-title">
              <h2>{day.title || KIND_LABEL[day.kind]}</h2>
              <span className={`kind ${day.kind}`}>
                {KIND_LABEL[day.kind]}
                {day.minutes > 0 && ` · ${day.minutes} min`}
              </span>
            </div>
            {day.effort && <p className="effort">{day.effort}</p>}

            {day.minutes > 0 ? (
              <div className="water">
                <p className="eyebrow">Agua durante la sesión</p>
                <p>
                  <b>{perInterval ? `${perInterval} ml` : '–'}</b> cada 15–20 min · <b>{total ? `${total} ml` : '–'}</b>{' '}
                  en total
                </p>
              </div>
            ) : (
              <div className="water">
                <p className="eyebrow">Agua</p>
                <p>Sin sesión: con tus 2,4 L de las primeras 10 h basta.</p>
              </div>
            )}

            {isToday && habitId && (
              <div className="btn-row">
                {hasHabit ? (
                  <button
                    type="button"
                    className={`btn${done ? ' ghost' : ''}`}
                    aria-pressed={done}
                    onClick={() => docStore.set(doneKey, !done)}
                  >
                    {done ? '✓ Hecho hoy' : 'Marcar como hecho'}
                  </button>
                ) : (
                  <p className="small muted">
                    Añade «{KIND_LABEL[day.kind]} 3 veces por semana» en <Link to="/">Hoy</Link> para llevar la cuenta.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </article>

      <p className="note spaced">
        Cada día: camina 7.000–10.000 pasos. Movilidad (muñecas, espalda, rodillas, caderas y hombros) de 2 a 4 veces
        por semana.
      </p>

      <details className="panel plan-settings spaced">
        <summary>Ajustes del plan</summary>
        <div className="fields">
          <label className="field" htmlFor="kg">
            Tu peso (kg)
            <input
              type="number"
              id="kg"
              min={30}
              max={200}
              inputMode="numeric"
              value={settings.kg || ''}
              onChange={(e) => update({ kg: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
        <p className="small muted">
          El agua sale de la fórmula de Andy Galpin que cita el libro: peso en libras ÷ 30 = onzas cada 15–20 min.
        </p>
        {customized && (
          <button type="button" className="text-btn spaced-sm" onClick={reset}>
            Volver al plan del libro
          </button>
        )}
      </details>
    </>
  );
}
