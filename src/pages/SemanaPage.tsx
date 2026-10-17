import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useNow } from '../hooks/useNow';
import { docStore, useDocsVersion } from '../lib/docs';
import { WEEK, planIndexFor, waterForSession, waterPerInterval } from '../lib/plan';
import { WEEKDAYS, dateKey } from '../lib/time';
import { useSettings } from '../store/SettingsProvider';
import type { WorkoutKind } from '../types';

const KIND_LABEL: Record<WorkoutKind, string> = { cardio: 'Cardio', fuerza: 'Fuerza', descanso: 'Descanso' };
/** Habito de Hoy que se marca al completar la sesion. */
const KIND_HABIT: Partial<Record<WorkoutKind, string>> = { cardio: 'lib-ejercicio-3', fuerza: 'lib-ejercicio-2' };
const DAY1_OPTIONS = [1, 2, 3, 4, 5, 6, 0] as const;
const SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;

export function SemanaPage(): JSX.Element {
  const { settings, update } = useSettings();
  const now = useNow();
  useDocsVersion();
  const { config } = useHabits();
  const todayIdx = planIndexFor(now, settings.day1);
  const [selected, setSelected] = useState(todayIdx);
  const day = WEEK[selected] ?? WEEK[0]!;
  const isToday = selected === todayIdx;

  // Fecha del dia elegido dentro de los proximos 7 dias (hoy incluido).
  const offset = (selected - todayIdx + 7) % 7;
  const date = new Date(now);
  date.setDate(now.getDate() + offset);
  const weekday = WEEKDAYS[date.getDay()] ?? '';

  const minutes = day.minutes;
  const perInterval = waterPerInterval(settings.kg);
  const total = waterForSession(settings.kg, minutes);

  const habitId = KIND_HABIT[day.kind];
  const hasHabit = habitId ? config.list.some((h) => h.id === habitId) : false;
  const doneKey = habitId ? `check:${dateKey(now)}:${habitId}` : '';
  const done = habitId ? docStore.get(doneKey, false) : false;

  return (
    <>
      <div className="section-head">
        <h1>Ejercicio</h1>
        <p className="muted">Una guía, no una obligación: si hoy no encaja, haz otro día.</p>
      </div>

      <div className="week-strip" role="tablist" aria-label="Días de la semana">
        {Array.from({ length: 7 }, (_, i) => {
          const idx = (todayIdx + i) % 7;
          const d = new Date(now);
          d.setDate(now.getDate() + i);
          const kind = WEEK[idx]?.kind ?? 'descanso';
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={selected === idx}
              className={`day-pill${selected === idx ? ' on' : ''}`}
              onClick={() => setSelected(idx)}
              aria-label={`${i === 0 ? 'Hoy, ' : ''}${WEEKDAYS[d.getDay()]}: ${WEEK[idx]?.title}`}
            >
              <span className="day-pill-name">{i === 0 ? 'Hoy' : SHORT[d.getDay()]}</span>
              <span className={`day-dot ${kind}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <article className="panel workout" aria-live="polite">
        <div className="workout-head">
          <p className="eyebrow">{isToday ? `Hoy · ${weekday}` : weekday}</p>
          <span className={`kind ${day.kind}`}>{KIND_LABEL[day.kind]}</span>
        </div>
        <h2>{day.title}</h2>
        <p className="lede">{day.desc}</p>
        <p className="effort">{day.effort}</p>

        {minutes > 0 ? (
          <div className="water">
            <p className="eyebrow">Agua durante la sesión · ~{minutes} min</p>
            <p>
              <b className="mono">{perInterval ? `${perInterval} ml` : '–'}</b> cada 15–20 min ·{' '}
              <b className="mono">{total ? `${total} ml` : '–'}</b> en total
            </p>
          </div>
        ) : (
          <div className="water">
            <p className="eyebrow">Agua</p>
            <p>Sin sesión hoy: con tus 2,4 L de las primeras 10 h basta.</p>
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
      </article>

      <p className="note spaced">
        Cada día: camina 7.000–10.000 pasos. Movilidad (muñecas, espalda, rodillas, caderas y hombros) de 2 a 4 veces por
        semana.
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
          <label className="field" htmlFor="day1">
            El día 1 (cardio largo) es el
            <select id="day1" value={settings.day1} onChange={(e) => update({ day1: Number(e.target.value) })}>
              {DAY1_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {WEEKDAYS[d]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="small muted">El agua sale de la fórmula de Andy Galpin que cita el libro: peso en libras ÷ 30 = onzas cada 15–20 min.</p>
      </details>
    </>
  );
}
