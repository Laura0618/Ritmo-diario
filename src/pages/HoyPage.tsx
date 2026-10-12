import { useMemo } from 'react';
import { Dial, DialLegend } from '../components/Dial';
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

  const items = useMemo(() => buildDayItems(settings, now), [settings, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const nowMin = minuteOfDay(now);
  const next = nextItem(items, checks, nowMin, settings.wake);
  const done = items.filter((i) => checks[i.id]).length;

  const W = toMinutes(settings.wake);
  const untilNext = next ? since(next.t, W) - since(nowMin, W) : 0;

  return (
    <div className="grid-today">
      <section className="panel" aria-labelledby="h-reloj">
        <h2 id="h-reloj" className="sr-only">
          Tu reloj de hoy
        </h2>
        <Dial wake={settings.wake} bed={settings.bed} sunset={settings.sunset} now={nowMin}>
          <div className="now">{formatTime(nowMin)}</div>
          <div className="next">
            {next ? (
              <>
                <b>{next.what}</b>
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
          Mantén el mismo horario ±30 min de 6 a 7 noches por semana. El punto en la franja de sueño marca tu mínimo de
          temperatura, unas 2 h antes de despertar.
        </p>
      </section>

      <section className="panel" aria-labelledby="h-plan">
        <div className="progress-head">
          <h2 id="h-plan">Plan de hoy</h2>
          <span className="mono muted">
            {done}/{items.length}
          </span>
          <div className="bar" aria-hidden="true">
            <i style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
        </div>
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
                  id={`c-${item.id}`}
                  checked={isDone}
                  onChange={(e) => toggle(item.id, e.target.checked)}
                  aria-label={`Hecho: ${item.what}`}
                />
                <label htmlFor={`c-${item.id}`} className="item-body">
                  <span className="what">{item.what}</span>
                  <span className={`tag ${item.tag}`}>{TAG_LABEL[item.tag]}</span>
                  <span className="how">{item.how}</span>
                </label>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
