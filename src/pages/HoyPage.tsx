import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dial, DialLegend } from '../components/Dial';
import { AddHabitSheet } from '../components/habits/AddHabitSheet';
import { HabitList } from '../components/habits/HabitList';
import { useHabits } from '../hooks/useHabits';
import { useNow } from '../hooks/useNow';
import { docStore, useDocsVersion } from '../lib/docs';
import { buildToday, nextTimed, todayProgress } from '../lib/habits';
import { dateKey, formatDuration, formatTime, minuteOfDay, toMinutes, wrap } from '../lib/time';
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
  const marks = useMemo(
    () => items.filter((i) => i.t !== null).map((i) => ({ t: i.t as number, tag: i.habit.tag })),
    [items],
  );
  const untilNext = next?.t != null ? wrap(next.t - toMinutes(settings.wake)) - wrap(nowMin - toMinutes(settings.wake)) : 0;
  const existingIds = useMemo(() => new Set(config.list.map((h) => h.id)), [config]);

  return (
    <div className="grid-today">
      <section className="panel" aria-labelledby="h-reloj">
        <h2 id="h-reloj" className="sr-only">
          Tu reloj de hoy
        </h2>
        <Dial wake={settings.wake} bed={settings.bed} sunset={settings.sunset} now={nowMin} marks={marks}>
          <div className="now">{formatTime(nowMin)}</div>
          <div className="next">
            {next ? (
              <>
                <b>{next.habit.what}</b>
                {untilNext > 0 ? `en ${formatDuration(untilNext)}` : 'ahora'}
              </>
            ) : total > 0 && done === total ? (
              <>
                <b>Todo hecho</b>buen descanso
              </>
            ) : (
              <>
                <b>
                  {done} de {total}
                </b>
                hábitos hechos hoy
              </>
            )}
          </div>
        </Dial>
        <DialLegend />
        <div className="settings">
          <label htmlFor="wake">
            Despertar
            <input type="time" id="wake" value={settings.wake} onChange={(e) => e.target.value && update({ wake: e.target.value })} />
          </label>
          <label htmlFor="bed">
            Dormir
            <input type="time" id="bed" value={settings.bed} onChange={(e) => e.target.value && update({ bed: e.target.value })} />
          </label>
          <label htmlFor="sunset">
            Puesta de sol
            <input
              type="time"
              id="sunset"
              value={settings.sunset}
              onChange={(e) => e.target.value && update({ sunset: e.target.value })}
            />
          </label>
        </div>
        <p className="note spaced">Mantén el mismo horario ±30 min de 6 a 7 noches por semana.</p>
      </section>

      <section className="panel" aria-labelledby="h-plan">
        <div className="progress-head">
          <h2 id="h-plan">{editing ? 'Ordena tus hábitos' : 'Plan de hoy'}</h2>
          {!editing && (
            <span className="mono muted">
              {done}/{total}
            </span>
          )}
          <button type="button" className={`btn small-btn${editing ? '' : ' ghost'}`} onClick={() => setEditing(!editing)}>
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
            Arrastra desde los puntos o usa las flechas para cambiar el orden. «Ajustar» cambia la frecuencia y la hora.
          </p>
        )}

        {config.list.length === 0 ? (
          <p className="lede">No tienes hábitos. Pulsa «+ Añadir hábito» para elegir alguno del libro o crear uno tuyo.</p>
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
      </section>

      {adding && (
        <AddHabitSheet existingIds={existingIds} settings={settings} onAdd={add} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}
