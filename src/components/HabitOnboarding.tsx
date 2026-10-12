import { useState } from 'react';
import { BOOK_HABITS, TIER_LABEL, describeTime } from '../lib/habits';
import type { HabitConfig, HabitTier } from '../types';

const TIERS: readonly HabitTier[] = ['esencial', 'recomendado', 'opcional'];
const TIER_HINT: Record<HabitTier, string> = {
  esencial: 'La base del libro para dormir y tener energía. Empieza por aquí.',
  recomendado: 'Añádelos cuando los esenciales te salgan solos.',
  opcional: 'Útiles en días concretos.',
};

interface Props {
  config: HabitConfig;
  onDone: (next: HabitConfig) => void;
}

/** Primera eleccion de habitos. Los esenciales vienen marcados. */
export function HabitOnboarding({ config, onDone }: Props): JSX.Element {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(config.enabled);
  const count = BOOK_HABITS.filter((h) => enabled[h.id]).length + config.custom.length;

  return (
    <section className="onboarding" aria-labelledby="h-elige">
      <h2 id="h-elige">Elige con qué empiezas</h2>
      <p className="lede">
        Pocos hábitos que haces de verdad funcionan mejor que muchos a medias. Puedes cambiarlos cuando quieras desde
        «Editar hábitos».
      </p>
      {TIERS.map((tier) => (
        <fieldset key={tier} className="habit-group">
          <legend>
            {TIER_LABEL[tier]} <span className="muted small">· {TIER_HINT[tier]}</span>
          </legend>
          {BOOK_HABITS.filter((h) => h.tier === tier).map((h) => (
            <label key={h.id} className="habit-pick" htmlFor={`pick-${h.id}`}>
              <input
                type="checkbox"
                className="check"
                id={`pick-${h.id}`}
                checked={Boolean(enabled[h.id])}
                onChange={(e) => setEnabled((prev) => ({ ...prev, [h.id]: e.target.checked }))}
              />
              <span className="habit-pick-text">
                <span className="what">{h.what}</span>
                <span className="small muted">
                  {describeTime(h.time)} · {h.source}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      ))}
      <div className="btn-row">
        <button
          type="button"
          className="btn"
          disabled={count === 0}
          onClick={() => onDone({ ...config, onboarded: true, enabled })}
        >
          Empezar con {count} {count === 1 ? 'hábito' : 'hábitos'}
        </button>
      </div>
    </section>
  );
}
