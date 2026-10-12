import { useEffect, useRef, useState } from 'react';
import { Segmented } from '../Segmented';
import { beep, keepScreenOn, speak, stopSpeaking } from '../../lib/device';
import { NSDR_AUDIO, NSDR_DURATIONS, NSDR_SCRIPT, stepAt, stepStarts, type NsdrMinutes } from '../../lib/nsdr';
import { KEYS, readJSON, writeJSON } from '../../lib/storage';
import { formatClock } from '../../lib/time';

const IDLE_TEXT = 'Elige la duración y pulsa empezar. Activa la voz si vas a cerrar los ojos.';

export function NsdrTool(): JSX.Element {
  const [minutes, setMinutes] = useState<NsdrMinutes>(10);
  const [voice, setVoice] = useState(true);
  const [running, setRunning] = useState(false);
  const [text, setText] = useState(IDLE_TEXT);
  const [step, setStep] = useState(-1);
  const [left, setLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const interval = useRef<number | null>(null);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  useEffect(
    () => () => {
      if (interval.current) window.clearInterval(interval.current);
      stopSpeaking();
      void keepScreenOn(false);
    },
    [],
  );

  function stop(completed: boolean): void {
    if (interval.current) window.clearInterval(interval.current);
    interval.current = null;
    stopSpeaking();
    void keepScreenOn(false);
    setRunning(false);
    setStep(-1);
    setLeft(0);
    setProgress(completed ? 100 : 0);
    setText(
      completed
        ? 'Sesión completada. Vuelve a tu día con calma.'
        : 'Sesión detenida. Puedes empezar otra cuando quieras.',
    );
    if (completed) {
      beep(440, 700);
      writeJSON(KEYS.nsdrCount, readJSON<number>(KEYS.nsdrCount, 0) + 1);
    }
  }

  function start(): void {
    const total = minutes * 60;
    const starts = stepStarts(total);
    const t0 = Date.now();
    let current = -1;
    setRunning(true);
    void keepScreenOn(true);

    const tick = (): void => {
      const elapsed = (Date.now() - t0) / 1000;
      if (elapsed >= total) {
        stop(true);
        return;
      }
      const i = stepAt(starts, elapsed);
      if (i !== current) {
        current = i;
        const line = NSDR_SCRIPT[i]?.[1] ?? '';
        setStep(i);
        setText(line);
        if (voiceRef.current) speak(line);
      }
      setLeft(total - elapsed);
      setProgress((elapsed / total) * 100);
    };
    tick();
    interval.current = window.setInterval(tick, 500);
  }

  const audio = NSDR_AUDIO[minutes];

  return (
    <article className="panel tool" aria-labelledby="t-nsdr">
      <div>
        <p className="eyebrow">Sueño y estrés · 10–30 min</p>
        <h3 id="t-nsdr">NSDR guiado</h3>
        <p className="lede">
          Descanso profundo sin dormir. Túmbate, cierra los ojos y sigue las indicaciones. Respiración con exhalaciones
          largas y atención que se mueve por el cuerpo y el entorno.
        </p>
      </div>
      <div className="stage">
        <div className="nsdr-bar" style={{ width: `${progress}%` }} />
        <p className="nsdr-text" aria-live="polite">
          {text}
        </p>
        <div className="nsdr-meta">
          <span>{step >= 0 ? `${step + 1}/${NSDR_SCRIPT.length}` : ''}</span>
          <span>{running ? formatClock(left) : ''}</span>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn" type="button" onClick={() => (running ? stop(false) : start())}>
          {running ? 'Parar' : 'Empezar'}
        </button>
        <Segmented
          label="Duración"
          options={NSDR_DURATIONS}
          value={minutes}
          disabled={running}
          onChange={setMinutes}
          format={(v) => `${v}′`}
        />
        <label className="toggle" htmlFor="nsdrVoice">
          <input type="checkbox" id="nsdrVoice" checked={voice} onChange={(e) => setVoice(e.target.checked)} /> Voz
        </label>
      </div>
      <a className="ext" href={audio.url} target="_blank" rel="noopener noreferrer">
        <span className="ext-ico" aria-hidden="true">
          ▶
        </span>
        <span className="ext-t">
          <b>Escuchar el NSDR de {minutes} min en Spotify</b>
          <br />
          <span className="muted">Audio grabado en inglés</span>
        </span>
        <span className="mono muted">{audio.length}</span>
      </a>
    </article>
  );
}
