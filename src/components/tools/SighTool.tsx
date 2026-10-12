import { useEffect, useRef, useState } from 'react';
import { Segmented } from '../Segmented';
import { beep } from '../../lib/device';

type Cycles = 1 | 2 | 3;
const CYCLE_OPTIONS: readonly Cycles[] = [1, 2, 3];

/** Fases de un ciclo: [texto, duracion ms, escala de la esfera]. */
const PHASES: readonly (readonly [string, number, number])[] = [
  ['Inhala por la nariz', 2200, 0.82],
  ['Otra inhalación corta', 900, 1],
  ['Exhala despacio por la boca', 5500, 0.45],
  ['', 900, 0.45],
];

export function SighTool(): JSX.Element {
  const [cycles, setCycles] = useState<Cycles>(3);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('Preparada');
  const [counter, setCounter] = useState('3 ciclos');
  const [scale, setScale] = useState(0.45);
  const [duration, setDuration] = useState(1200);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function stop(message = 'Preparada'): void {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setRunning(false);
    setDuration(1200);
    setScale(0.45);
    setPhase(message);
    setCounter(`${cycles} ${cycles === 1 ? 'ciclo' : 'ciclos'}`);
  }

  function start(): void {
    setRunning(true);
    let cycle = 0;
    const run = (i: number): void => {
      let idx = i;
      if (idx >= PHASES.length) {
        cycle++;
        if (cycle >= cycles) {
          beep(520, 400);
          stop('Hecho. Respira normal.');
          return;
        }
        idx = 0;
      }
      if (idx === 0) setCounter(`Ciclo ${cycle + 1} de ${cycles}`);
      const [label, ms, sc] = PHASES[idx]!;
      setPhase(label || '·');
      setDuration(ms);
      setScale(sc);
      timer.current = window.setTimeout(() => run(idx + 1), ms);
    };
    run(0);
  }

  return (
    <article className="panel tool" aria-labelledby="t-sigh">
      <div>
        <p className="eyebrow">Estrés · 30 segundos</p>
        <h3 id="t-sigh">Suspiro fisiológico</h3>
        <p className="lede">
          Dos inhalaciones por la nariz (la segunda corta, para llenar del todo) y una exhalación larga por la boca. Entre
          1 y 3 veces. Es la forma más rápida de bajar la activación.
        </p>
      </div>
      <div className="stage">
        <div className="lung-phase" aria-live="polite">
          {phase}
        </div>
        <div className="lung" style={{ transform: `scale(${scale})`, transitionDuration: `${duration}ms` }} />
        <div className="lung-label">{counter}</div>
      </div>
      <div className="btn-row">
        <button className="btn" type="button" onClick={() => (running ? stop() : start())}>
          {running ? 'Parar' : 'Empezar'}
        </button>
        <Segmented
          label="Número de ciclos"
          options={CYCLE_OPTIONS}
          value={cycles}
          disabled={running}
          onChange={(v) => {
            setCycles(v);
            setCounter(`${v} ${v === 1 ? 'ciclo' : 'ciclos'}`);
          }}
        />
      </div>
    </article>
  );
}
