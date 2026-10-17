import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useNow } from '../hooks/useNow';
import { docStore, useDocsVersion } from '../lib/docs';
import {
  type DayStatus,
  type IsChecked,
  addDays,
  daysOfWeek,
  habitStreak,
  monthGrid,
  monthScore,
  startOfDay,
  trackingStart,
  weekCount,
  weekSummary,
} from '../lib/history';
import { TAG_COLOR } from '../lib/tags';
import { MONTHS, WEEKDAYS, dateKey, weekStart } from '../lib/time';
import type { Habit } from '../types';

const isChecked: IsChecked = (day, id) => docStore.get(`check:${day}:${id}`, false);
const INITIAL = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;
const HEAD = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const WEEK_MS = 7 * 86_400_000;

function weekLabel(ws: number, thisWeek: number): string {
  if (ws === thisWeek) return 'Esta semana';
  if (ws === thisWeek - WEEK_MS) return 'Semana pasada';
  const a = new Date(ws);
  const b = addDays(a, 6);
  const m = (d: Date) => MONTHS[d.getMonth()]?.slice(0, 3) ?? '';
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${m(b)}`
    : `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}`;
}

function plural(n: number, unit: 'día' | 'semana'): string {
  if (unit === 'día') return n === 1 ? '1 día' : `${n} días`;
  return n === 1 ? '1 semana' : `${n} semanas`;
}

function Ring({ done, total, size = 36 }: { done: number; total: number; size?: number }): JSX.Element {
  const r = size / 2 - 3.5;
  const c = 2 * Math.PI * r;
  const p = total ? done / total : 0;
  return (
    <svg className={`ring${total && done === total ? ' full' : ''}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} />
      {p > 0 && (
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeDasharray={`${c * p} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  );
}

export function HistorialPage(): JSX.Element {
  const now = useNow();
  const version = useDocsVersion();
  const { config } = useHabits();
  const habits = config.list;
  const today = startOfDay(now);
  const todayKey = dateKey(today);
  const thisWeek = weekStart(today);

  const start = useMemo(() => trackingStart(docStore.keys('check:'), today), [todayKey, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstWeek = weekStart(start);

  const [ws, setWs] = useState(thisWeek);
  const [dayKey, setDayKey] = useState(todayKey);
  const [open, setOpen] = useState<string | null>(null);
  const [month, setMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const week = useMemo(() => weekSummary(habits, ws, today, start, isChecked), [habits, ws, todayKey, start, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const prev = useMemo(() => weekSummary(habits, ws - WEEK_MS, today, start, isChecked), [habits, ws, todayKey, start, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const delta = week.pct !== null && prev.pct !== null && ws - WEEK_MS >= firstWeek ? week.pct - prev.pct : null;

  const selected: DayStatus = week.days.find((d) => d.key === dayKey) ?? week.days.find((d) => d.key === todayKey) ?? week.days[0]!;

  const goWeek = (next: number): void => {
    setWs(next);
    const days = daysOfWeek(next).filter((d) => d <= today);
    const last = days[days.length - 1];
    setDayKey(last ? dateKey(last) : dateKey(new Date(next)));
  };

  if (habits.length === 0) {
    return (
      <>
        <div className="section-head">
          <h1>Historial</h1>
        </div>
        <p className="lede">
          Todavía no tienes hábitos. <Link to="/">Añade alguno en Hoy</Link> y aquí verás tu avance.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="section-head">
        <h1>Historial</h1>
        <p className="muted">Lo que marcas cada día se guarda aquí, aunque las casillas se reinicien a medianoche.</p>
      </div>

      <div className="hist-grid">
        <section className="panel hist-week" aria-labelledby="h-week">
          <div className="hist-week-head">
            <button
              type="button"
              className="icon-btn"
              aria-label="Semana anterior"
              disabled={ws <= firstWeek}
              onClick={() => goWeek(ws - WEEK_MS)}
            >
              ‹
            </button>
            <div className="hist-week-title">
              <h2 id="h-week" className="eyebrow">
                {weekLabel(ws, thisWeek)}
              </h2>
              <p className="hist-pct">
                {week.pct === null ? '–' : `${week.pct} %`}
                <span className="muted"> cumplido</span>
              </p>
              {delta !== null && delta !== 0 && (
                <p className={`hist-delta ${delta > 0 ? 'up' : 'down'}`}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} {Math.abs(delta) === 1 ? 'punto' : 'puntos'} {delta > 0 ? 'más' : 'menos'} que la semana anterior
                </p>
              )}
              {delta === 0 && <p className="hist-delta">Igual que la semana anterior</p>}
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Semana siguiente"
              disabled={ws >= thisWeek}
              onClick={() => goWeek(ws + WEEK_MS)}
            >
              ›
            </button>
          </div>

          <div className="ring-row" role="group" aria-label="Días de la semana">
            {week.days.map((d) => {
              const off = d.future || d.beforeStart;
              return (
                <button
                  key={d.key}
                  type="button"
                  className={`ring-day${d.key === selected.key ? ' on' : ''}${d.key === todayKey ? ' today' : ''}`}
                  disabled={d.future}
                  aria-pressed={d.key === selected.key}
                  aria-label={`${WEEKDAYS[d.date.getDay()]} ${d.date.getDate()}: ${d.done} de ${d.total} hábitos diarios`}
                  onClick={() => setDayKey(d.key)}
                >
                  <span className="ring-day-name">{INITIAL[d.date.getDay()]}</span>
                  <span className={`ring-wrap${off ? ' off' : ''}`}>
                    <Ring done={off ? 0 : d.done} total={d.total} />
                    <span className="ring-num">{d.date.getDate()}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="day-detail">
            <p className="eyebrow">
              {selected.key === todayKey ? 'Hoy' : `${WEEKDAYS[selected.date.getDay()]} ${selected.date.getDate()} ${MONTHS[selected.date.getMonth()]}`}
              {selected.total > 0 && ` · ${selected.done} de ${selected.total} diarios`}
            </p>
            <ul>
              {habits.map((h) => {
                const done = isChecked(selected.key, h.id);
                return (
                  <li key={h.id} className={done ? 'done' : ''}>
                    <span className="mark" aria-hidden="true">
                      {done ? '✓' : ''}
                    </span>
                    <span className="sr-only">{done ? 'Hecho: ' : 'Sin hacer: '}</span>
                    <span className="dd-name">{h.what}</span>
                    {h.freq.per === 'week' && <span className="dd-week">semanal</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="panel" aria-labelledby="h-habits">
          <h2 id="h-habits" className="hist-h2">
            Por hábito
          </h2>
          <ul className="hstats">
            {habits.map((h) => (
              <HabitStat
                key={h.id}
                habit={h}
                ws={ws}
                today={today}
                start={start}
                open={open === h.id}
                onToggle={() => setOpen(open === h.id ? null : h.id)}
                month={month}
                onMonth={setMonth}
                version={version}
              />
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

interface HabitStatProps {
  habit: Habit;
  ws: number;
  today: Date;
  start: Date;
  open: boolean;
  onToggle: () => void;
  month: { y: number; m: number };
  onMonth: (m: { y: number; m: number }) => void;
  version: number;
}

function HabitStat({ habit, ws, today, start, open, onToggle, month, onMonth }: HabitStatProps): JSX.Element {
  const streak = habitStreak(habit, today, start, isChecked);
  const days = daysOfWeek(ws);
  const weekly = habit.freq.per === 'week' ? habit.freq.times : 0;
  const count = weekly ? weekCount(habit, ws, isChecked) : 0;
  const panelId = `hs-${habit.id}`;

  return (
    <li className={open ? 'open' : ''}>
      <button type="button" className="hs-row" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className="hs-dot" style={{ background: TAG_COLOR[habit.tag] }} aria-hidden="true" />
        <span className="hs-main">
          <span className="hs-name">{habit.what}</span>
          <span className="hs-streak small muted">
            {streak.current > 0 ? (
              <>
                <b className="hs-flame">{plural(streak.current, streak.unit)}</b>{' '}
                {`seguid${streak.unit === 'día' ? 'o' : 'a'}${streak.current === 1 ? '' : 's'}`}
              </>
            ) : (
              'Sin racha ahora'
            )}
            {streak.best > streak.current && ` · récord ${plural(streak.best, streak.unit)}`}
          </span>
        </span>
        <span className="hs-week" aria-label={weekly ? `${count} de ${weekly} esta semana` : undefined}>
          {weekly ? (
            <>
              <span className="segs" aria-hidden="true">
                {Array.from({ length: weekly }, (_, i) => (
                  <i key={i} className={i < count ? 'on' : ''} />
                ))}
              </span>
              <span className="mono small">
                {count}/{weekly}
              </span>
            </>
          ) : (
            <span className="segs days" aria-hidden="true">
              {days.map((d) => {
                const k = dateKey(d);
                const cls = d > today || d < start ? 'off' : isChecked(k, habit.id) ? 'on' : '';
                return <i key={k} className={cls} />;
              })}
            </span>
          )}
        </span>
        <span className="hs-chev" aria-hidden="true">
          ›
        </span>
      </button>

      {open && <MonthView id={panelId} habit={habit} today={today} start={start} month={month} onMonth={onMonth} />}
    </li>
  );
}

function MonthView({
  id,
  habit,
  today,
  start,
  month,
  onMonth,
}: {
  id: string;
  habit: Habit;
  today: Date;
  start: Date;
  month: { y: number; m: number };
  onMonth: (m: { y: number; m: number }) => void;
}): JSX.Element {
  const cells = monthGrid(month.y, month.m);
  const score = monthScore(habit, month.y, month.m, today, start, isChecked);
  const shift = (n: number) => {
    const d = new Date(month.y, month.m + n, 1);
    onMonth({ y: d.getFullYear(), m: d.getMonth() });
  };
  const isCurrent = month.y === today.getFullYear() && month.m === today.getMonth();
  const beforeFirst = new Date(month.y, month.m, 1) <= new Date(start.getFullYear(), start.getMonth(), 1);
  const todayKey = dateKey(today);

  return (
    <div className="month" id={id}>
      <div className="month-head">
        <button type="button" className="icon-btn" aria-label="Mes anterior" disabled={beforeFirst} onClick={() => shift(-1)}>
          ‹
        </button>
        <p>
          <b>
            {MONTHS[month.m]} {month.y}
          </b>
          <span className="small muted">
            {' '}
            · {score.done} de {score.total} días
          </span>
        </p>
        <button type="button" className="icon-btn" aria-label="Mes siguiente" disabled={isCurrent} onClick={() => shift(1)}>
          ›
        </button>
      </div>
      <div className="month-grid" role="grid" aria-label={`${habit.what}, ${MONTHS[month.m]} ${month.y}`}>
        {HEAD.map((h) => (
          <span key={h} className="mh" aria-hidden="true">
            {h}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} className="mc empty" />;
          const k = dateKey(d);
          const off = d > today || d < start;
          const done = !off && isChecked(k, habit.id);
          return (
            <span
              key={k}
              role="gridcell"
              className={`mc${done ? ' on' : ''}${off ? ' off' : ''}${k === todayKey ? ' today' : ''}`}
              aria-label={`${d.getDate()}: ${off ? 'sin datos' : done ? 'hecho' : 'sin hacer'}`}
            >
              {d.getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
