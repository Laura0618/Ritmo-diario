import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dial, DialLegend } from '../components/Dial';
import { HabitOnboarding } from '../components/HabitOnboarding';
import { useHabits } from '../hooks/useHabits';
import { useDayChecks } from '../hooks/useDayChecks';
import { useNow } from '../hooks/useNow';
import { buildDayItems, nextItem } from '../lib/plan';
import { dateKey, formatDuration, formatTime, minuteOfDay, since, toMinutes } from '../lib/time';
import { useSettings } from '../store/SettingsProvider';
import type { Tag } from '../types';

const TAG_LABEL: Record<Tag, string> = { sueno: 'Sueño', luz: 'Luz', estres: 'Estrés', cuerpo: 'Cuerpo' };

export function HoyPage(): JSX.Element {
  const { settings, update } = useSettings();
  const now = useNow();
  const today = dateKey(now);
  const [checks, toggle] = useDayChecks(today);
  const { config, save } = useHabits();

  const items = useMemo(() => buildDayItems(settings, now, config), [settings, config, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const marks = useMemo(
    () => items.filter((i) => i.id.startsWith('c-')).map((i) => ({ t: i.t, tag: i.tag })),
    [items],
  );
  const nowMin = minuteOfDay(now);
  const next = nextItem(items, checks, nowMin, settings.wake);
  const done = items.filter((i) => checks[i.id]).length;
  const visibleNext = config.onboarded ? next : null;

  const W = toMinutes(settings.wake);
  const untilNext = next ? since(next.t, W) - since(nowMin, W) : 0;

  return (
    <div className="grid-today">
      <section className="panel" aria-labelledby="h-reloj">
        <h2 id="h-reloj" className="sr-only">
          Tu reloj de hoy
        </h2>
        <Dial wake={settings.wake} bed={settings.bed} sunset={settings.sunset} now={nowMin} marks={marks}>
          <div className="now">{formatTime(nowMin)}</div>
          <div className="next">
            {!config.onboarded ? (
              <>
                <b>Elige tus hábitos</b>para ver tu plan
              </>
            ) : visibleNext ? (
              <>
                <b>{visibleNext.what}</b>
                {untilNext > 0 ? `en ${formatDuration(untilNext)}` : 'ahora'}
              </>
            ) : (
              <>
                <b>Todo hecho</b>buen descanso
              </>
            )}
          </div>
        </Dial>
        <DialLegend />
        <div className="settings">
          <label htmlFor="wake">
            Despertar
            <input
              type="time"
              id="wake"
              value={settings.wake}
              onChange={(e) => e.target.value && update({ wake: e.target.value })}
            />
          </label>
          <label htmlFor="bed">
            Dormir
            <input
              type="time"
              id="bed"
              value={settings.bed}
              onChange={(e) => e.target.value && update({ bed: e.target.value })}
            />
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
        <p className="note spaced">
          Mantén el mismo horario ±30 min de 6 a 7 noches por semana.
        </p>
      </section>

      <section className="panel" aria-labelledby={config.onboarded ? 'h-plan' : 'h-elige'}>
        {!config.onboarded ? (
          <HabitOnboarding config={config} onDone={save} />
        ) : (
          <>
            <div className="progress-head">
              <h2 id="h-plan">Plan de hoy</h2>
              <span className="mono muted">
                {done}/{items.length}
              </span>
              <Link to="/habitos" className="edit-link">
                Editar hábitos
              </Link>
              <div className="bar" aria-hidden="true">
                <i style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
              </div>
            </div>
            {items.length === 0 && (
              <p className="lede">
                No tienes hábitos activos. <Link to="/habitos">Elige alguno</Link> para ver tu plan de hoy.
              </p>
            )}
            <ol className="timeline">
              {items.map((item) => {
                const isDone = Boolean(checks[item.id]);
                const classes = [isDone ? 'done' : '', next?.id === item.id ? 'is-next' : ''].filter(Boolean).join(' ');
                return (
                  <li key={item.id} className={classes || undefined}>
                    <span className="t">{formatTime(item.t)}</span>
                    <input
                      type="checkbox"
                      className="check"
                      id={`chk-${item.id}`}
                      checked={isDone}
                      onChange={(e) => toggle(item.id, e.target.checked)}
                      aria-label={`Hecho: ${item.what}`}
                    />
                    <label htmlFor={`chk-${item.id}`} className="item-body">
                      <span className="what">{item.what}</span>
                      <span className={`tag ${item.tag}`}>{TAG_LABEL[item.tag]}</span>
                      <span className="how">{item.how}</span>
                    </label>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
