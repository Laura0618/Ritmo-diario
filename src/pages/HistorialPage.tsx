import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Segmented } from '../components/Segmented';
import { useHabits } from '../hooks/useHabits';
import { useNow } from '../hooks/useNow';
import { docStore, useDocsVersion } from '../lib/docs';
import { habitHistory, lastDays } from '../lib/history';
import { TAG_LABEL } from '../lib/tags';

type Range = 7 | 30;
const RANGES: readonly Range[] = [7, 30];
const isChecked = (day: string, id: string): boolean => docStore.get(`check:${day}:${id}`, false);

export function HistorialPage(): JSX.Element {
  const now = useNow();
  const version = useDocsVersion();
  const { config } = useHabits();
  const [range, setRange] = useState<Range>(7);

  const days = useMemo(() => lastDays(now, range), [now, range]);
  const rows = useMemo(
    () => config.list.map((h) => ({ habit: h, ...habitHistory(h, days, now, isChecked) })),
    [config, days, now, version], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const daily = rows.filter((r) => r.habit.freq.per === 'day');
  const dailyDone = daily.reduce((n, r) => n + r.doneDays, 0);
  const dailyPct = daily.length ? Math.round((dailyDone / (daily.length * days.length)) * 100) : null;

  return (
    <>
      <div className="section-head">
        <h1>Historial</h1>
        <Segmented label="Periodo" options={RANGES} value={range} onChange={setRange} format={(v) => `${v} días`} />
      </div>

      {rows.length === 0 ? (
        <p className="lede">
          Todavía no tienes hábitos. <Link to="/">Añade alguno en Hoy</Link> y aquí verás tu avance.
        </p>
      ) : (
        <section className="panel" aria-labelledby="h-hist">
          <h2 id="h-hist" className="sr-only">
            Avance por hábito
          </h2>
          {dailyPct !== null && (
            <p className="hist-summary">
              <b className="big">{dailyPct}&nbsp;%</b>
              <span className="muted"> de tus hábitos diarios hechos en los últimos {range} días</span>
            </p>
          )}
          <ul className="hist-list">
            {rows.map(({ habit, cells, doneDays, weeks }) => (
              <li key={habit.id}>
                <div className="hist-head">
                  <span className="what">{habit.what}</span>
                  <span className={`tag ${habit.tag}`}>{TAG_LABEL[habit.tag]}</span>
                </div>
                <p className="small muted">
                  {habit.freq.per === 'day'
                    ? `${doneDays} de ${days.length} días`
                    : `${weeks.current}/${habit.freq.times} esta semana · ${weeks.met} de ${weeks.total} ${weeks.total === 1 ? 'semana cumplida' : 'semanas cumplidas'}`}
                </p>
                <div className={`hist-cells${range === 7 ? ' labeled' : ''}`} style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
                  {cells.map((c) => (
                    <span
                      key={c.day}
                      className={`cell${c.done ? ' on' : ''}${c.today ? ' today' : ''}`}
                      title={`${c.label}: ${c.done ? 'hecho' : 'sin hacer'}`}
                    >
                      {range === 7 ? c.initial : null}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="small muted hist-foot">
            Cada casilla es un día, de más antiguo a hoy. Las casillas se reinician a medianoche y lo marcado queda guardado
            aquí.
          </p>
        </section>
      )}
    </>
  );
}
