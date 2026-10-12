import { useEffect, useRef, useState } from 'react';
import { Segmented } from '../Segmented';
import { beep, keepScreenOn } from '../../lib/device';
import { docStore, useDocsVersion } from '../../lib/docs';
import { formatClock, weekStart } from '../../lib/time';

type Target = 1 | 2 | 3;
const TARGETS: readonly Target[] = [1, 2, 3];
const CIRC = 2 * Math.PI * 88;

const COLD_PREFIX = 'log:cold:';

/** Sesiones de frio de esta semana (de lunes a domingo), en cualquier dispositivo. */
function sessionsThisWeek(): number {
  const ws = weekStart(new Date());
  return docStore.keys(COLD_PREFIX).filter((k) => Number(k.slice(COLD_PREFIX.length)) >= ws).length;
}

export function ColdTool(): JSX.Element {
  const [target, setTarget] = useState<Target>(2);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [walls, setWalls] = useState(0);
  const interval = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const beeped = useRef(false);

  useEffect(
    () => () => {
      if (interval.current) window.clearInterval(interval.current);
      void keepScreenOn(false);
    },
    [],
  );

  function stop(): void {
    if (interval.current) window.clearInterval(interval.current);
    interval.current = null;
    if (elapsedRef.current >= 30) {
      docStore.set(`${COLD_PREFIX}${Date.now()}`, { s: Math.round(elapsedRef.current) });
    }
    void keepScreenOn(false);
    setRunning(false);
  }

  function start(): void {
    const goal = target * 60;
    const t0 = Date.now();
    elapsedRef.current = 0;
    beeped.current = false;
    setElapsed(0);
    setWalls(0);
    setRunning(true);
    void keepScreenOn(true);
    beep(660, 150);
    interval.current = window.setInterval(() => {
      const e = (Date.now() - t0) / 1000;
      elapsedRef.current = e;
      setElapsed(e);
      if (!beeped.current && e >= goal) {
        beeped.current = true;
        beep(880, 250);
        window.setTimeout(() => beep(880, 250), 350);
      }
    }, 250);
  }

  useDocsVersion();
  const week = sessionsThisWeek();
  const goal = target * 60;
  const ratio = Math.min(1, elapsed / goal);
  const reached = elapsed >= goal;

  return (
    <article className="panel tool" aria-labelledby="t-cold">
      <div>
        <p className="eyebrow">Estrés · 1–3 min</p>
        <h3 id="t-cold">Exposición al frío</h3>
        <p className="lede">
          Ducha fría o baño de agua incómodamente fría (orientativo: 4–10 °C), de 3 a 7 veces por semana. Cada vez que
          quieras salir y te quedes, has superado un muro.
        </p>
      </div>
      <div className="stage">
        <svg className="cold-ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="88" fill="none" stroke="var(--line)" strokeWidth="8" />
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke={reached ? 'var(--ok)' : 'var(--blue)'}
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - ratio)}
          />
        </svg>
        <div className="cold-inner">
          <div className="cold-time">{formatClock(elapsed)}</div>
          <div className="walls">
            {walls} {walls === 1 ? 'muro' : 'muros'}
          </div>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn" type="button" onClick={() => (running ? stop() : start())}>
          {running ? 'Terminar' : 'Empezar'}
        </button>
        <button
          className="btn ghost"
          type="button"
          disabled={!running}
          onClick={() => {
            setWalls((w) => w + 1);
            beep(500, 120);
          }}
        >
          Muro superado
        </button>
        <Segmented
          label="Objetivo"
          options={TARGETS}
          value={target}
          disabled={running}
          onChange={setTarget}
          format={(v) => `${v}′`}
        />
      </div>
      <p className="note">
        Esta semana: {week} {week === 1 ? 'sesión' : 'sesiones'} (objetivo: 3–7).
      </p>
      <p className="note">
        Hazlo antes del entrenamiento de fuerza, no después. Si el agua quema o da dolor de cabeza, está demasiado fría.
        Consulta a tu médico si tienes problemas cardiovasculares.
      </p>
    </article>
  );
}
