import { useState } from 'react';
import { TimeEditor } from '../TimeEditor';
import { TAG_LABEL, TAG_ORDER } from '../../lib/tags';
import type { Habit, HabitFreq, HabitTime, Settings, Tag } from '../../types';

export type HabitDraft = Omit<Habit, 'id' | 'source'>;

interface Props {
  idPrefix: string;
  initial: HabitDraft;
  /** Los habitos del libro no cambian de nombre ni de categoria. */
  editableText: boolean;
  settings: Settings;
  submitLabel: string;
  onSubmit: (draft: HabitDraft) => void;
  onCancel: () => void;
}

const DEFAULT_TIME: HabitTime = { anchor: 'wake', offset: 30 };

/** Nombre, nota, categoria, frecuencia y hora (opcional) de un habito. */
export function HabitForm({ idPrefix, initial, editableText, settings, submitLabel, onSubmit, onCancel }: Props): JSX.Element {
  const [draft, setDraft] = useState<HabitDraft>(initial);
  const weekly = draft.freq.per === 'week';
  const times = draft.freq.per === 'week' ? draft.freq.times : 3;

  function setFreq(freq: HabitFreq): void {
    setDraft({ ...draft, freq });
  }

  return (
    <form
      className="habit-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.what.trim()) return;
        onSubmit({ ...draft, what: draft.what.trim(), how: draft.how.trim() });
      }}
    >
      {editableText && (
        <>
          <div className="fields">
            <label className="field" htmlFor={`${idPrefix}-what`}>
              Hábito
              <input
                id={`${idPrefix}-what`}
                type="text"
                maxLength={60}
                placeholder="Estiramientos 10 min"
                value={draft.what}
                onChange={(e) => setDraft({ ...draft, what: e.target.value })}
                required
              />
            </label>
            <label className="field" htmlFor={`${idPrefix}-tag`}>
              Categoría
              <select id={`${idPrefix}-tag`} value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value as Tag })}>
                {TAG_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {TAG_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field" htmlFor={`${idPrefix}-how`}>
            Nota (opcional)
            <input
              id={`${idPrefix}-how`}
              type="text"
              maxLength={140}
              placeholder="Cadera, isquios y espalda"
              value={draft.how}
              onChange={(e) => setDraft({ ...draft, how: e.target.value })}
            />
          </label>
        </>
      )}

      <div className="fields">
        <label className="field" htmlFor={`${idPrefix}-freq`}>
          Frecuencia
          <select
            id={`${idPrefix}-freq`}
            value={weekly ? 'week' : 'day'}
            onChange={(e) => setFreq(e.target.value === 'week' ? { per: 'week', times } : { per: 'day' })}
          >
            <option value="day">Cada día</option>
            <option value="week">Veces por semana</option>
          </select>
        </label>
        {weekly && (
          <label className="field" htmlFor={`${idPrefix}-times`}>
            Veces
            <select
              id={`${idPrefix}-times`}
              value={times}
              onChange={(e) => setFreq({ per: 'week', times: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="toggle" htmlFor={`${idPrefix}-hastime`}>
        <input
          type="checkbox"
          id={`${idPrefix}-hastime`}
          checked={draft.time !== null}
          onChange={(e) => setDraft({ ...draft, time: e.target.checked ? (initial.time ?? DEFAULT_TIME) : null })}
        />
        A una hora concreta
      </label>
      {draft.time && (
        <TimeEditor idPrefix={idPrefix} value={draft.time} settings={settings} onChange={(t) => setDraft({ ...draft, time: t })} />
      )}

      <div className="btn-row">
        <button type="submit" className="btn" disabled={!draft.what.trim()}>
          {submitLabel}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
