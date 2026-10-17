import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Dial, DialLegend } from '../components/Dial';
import { SchedulePanel } from '../components/SchedulePanel';
import { AddHabitSheet } from '../components/habits/AddHabitSheet';
import { HabitList } from '../components/habits/HabitList';
import { useHabits } from '../hooks/useHabits';
import { useNow } from '../hooks/useNow';
import { docStore, useDocsVersion } from '../lib/docs';
import { buildToday, nextTimed, todayProgress } from '../lib/habits';
import { dateKey, formatTime, longDate, minuteOfDay } from '../lib/time';
import { useSettings } from '../store/SettingsProvider';

const isChecked = (day: string, id: string): boolean => docStore.get(`check:${day}:${id}`, false);

export function HoyPage(): JSX.Element {
  const { settings, update } = useSettings();
  const now = useNow();
  const today = dateKey(now);
  const version = useDocsVersion();
  const { config, add, update: updateHabit, remove, move } = useHabits();
  const [params, setParams] = useSearchParams();
  const [editing, setEditingState] = useState(params.get('editar') === '1');
  const [adding, setAdding] = useState(false);

  const setEditing = useCallback(
    (on: boolean) => {
      setEditingState(on);
      if (params.has('editar')) setParams({}, { replace: true });
    },
    [params, setParams],
  );

  const items = useMemo(
    () => buildToday(config, settings, now, isChecked),
    [config, settings, today, version], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const nowMin = minuteOfDay(now);
  const next = nextTimed(items, nowMin, settings.wake);
  const { done, total } = todayProgress(items);
  const existingIds = useMemo(() => new Set(config.list.map((h) => h.id)), [config]);

  return (
    <>
      <div className="grid-today">
        <section className="panel clock-panel" aria-labelledby="h-reloj">
          <h1 id="h-reloj" className="sr-only">
            Hoy
          </h1>
          <Dial
            wake={settings.wake}
            bed={settings.bed}
            sunrise={settings.sunrise}
            sunset={settings.sunset}
            now={nowMin}
          >
            <div className="now">{formatTime(nowMin)}</div>
            <div className="date">{longDate(now)}</div>
          </Dial>
          <DialLegend />
          <SchedulePanel settings={settings} update={update} />
        </section>

        <section className="panel" aria-labelledby="h-plan">
          <div className="progress-head">
            <h2 id="h-plan">{editing ? 'Ordena tus hábitos' : 'Plan de hoy'}</h2>
            {!editing && (
              <span className="mono muted">
                {done}/{total}
              </span>
            )}
            <button type="button" className="text-btn" onClick={() => setEditing(!editing)}>
              {editing ? 'Listo' : 'Editar'}
            </button>
            {!editing && (
              <div className="bar" aria-hidden="true">
                <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </div>
            )}
          </div>

          {editing && (
            <p className="small muted edit-hint">
              Arrastra desde los puntos o usa las flechas para cambiar el orden. «Ajustar» cambia la frecuencia y la
              hora.
            </p>
          )}

          {config.list.length === 0 ? (
            <p className="lede">
              No tienes hábitos. Pulsa «+ Añadir hábito» para elegir alguno del libro o crear uno tuyo.
            </p>
          ) : (
            <HabitList
              items={items}
              editing={editing}
              settings={settings}
              nextId={next?.habit.id ?? null}
              onToggle={(id, on) => docStore.set(`check:${today}:${id}`, on)}
              onMove={move}
              onUpdate={updateHabit}
              onRemove={remove}
            />
          )}

          <button type="button" className="add-habit" onClick={() => setAdding(true)}>
            <span aria-hidden="true">+</span> Añadir hábito
          </button>
          {!editing && (
            <p className="plan-foot muted">
              Las casillas se reinician a medianoche. <Link to="/historial">Ver tu historial</Link>
            </p>
          )}
        </section>

        {adding && (
          <AddHabitSheet existingIds={existingIds} settings={settings} onAdd={add} onClose={() => setAdding(false)} />
        )}
      </div>
    </>
  );
}
