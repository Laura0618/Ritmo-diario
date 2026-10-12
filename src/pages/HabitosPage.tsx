import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TimeEditor } from '../components/TimeEditor';
import { useHabits } from '../hooks/useHabits';
import { BOOK_HABITS, TIER_LABEL, bookTimeFor, describeTime, newCustomHabit, resolveTime } from '../lib/habits';
import { formatTime } from '../lib/time';
import { useSettings } from '../store/SettingsProvider';
import type { CustomHabit, HabitTier, Tag } from '../types';

const TIERS: readonly HabitTier[] = ['esencial', 'recomendado', 'opcional'];
const TAG_OPTIONS: readonly { value: Tag; label: string }[] = [
  { value: 'sueno', label: 'Sueño' },
  { value: 'luz', label: 'Luz' },
  { value: 'estres', label: 'Estrés' },
  { value: 'cuerpo', label: 'Cuerpo' },
];

const EMPTY_DRAFT: Omit<CustomHabit, 'id'> = {
  what: '',
  how: '',
  tag: 'cuerpo',
  time: { anchor: 'wake', offset: 30 },
};

export function HabitosPage(): JSX.Element {
  const { settings } = useSettings();
  const { config, setEnabled, setTime, upsertCustom, removeCustom } = useHabits();
  const [openTime, setOpenTime] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<CustomHabit, 'id'> & { id?: string }>(EMPTY_DRAFT);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const active = BOOK_HABITS.filter((h) => config.enabled[h.id]).length + config.custom.length;

  function saveDraft(): void {
    const what = draft.what.trim();
    if (!what) return;
    const base = { what, how: draft.how.trim(), tag: draft.tag, time: draft.time };
    upsertCustom(draft.id ? { ...base, id: draft.id } : newCustomHabit(base));
    setDraft(EMPTY_DRAFT);
    setFormOpen(false);
  }

  return (
    <>
      <div className="section-head">
        <h1>Tus hábitos</h1>
        <p className="muted">
          {active} {active === 1 ? 'activo' : 'activos'} · <Link to="/">Volver a hoy</Link>
        </p>
      </div>

      <div className="habits-layout">
        {TIERS.map((tier) => (
          <section key={tier} className="panel" aria-labelledby={`h-${tier}`}>
            <h2 id={`h-${tier}`}>{TIER_LABEL[tier]}</h2>
            <ul className="habit-list">
              {BOOK_HABITS.filter((h) => h.tier === tier).map((h) => {
                const time = bookTimeFor(h, config);
                const changed = Boolean(config.times[h.id]);
                return (
                  <li key={h.id} className={config.enabled[h.id] ? 'on' : undefined}>
                    <div className="habit-row">
                      <label className="switch" htmlFor={`on-${h.id}`}>
                        <input
                          type="checkbox"
                          role="switch"
                          id={`on-${h.id}`}
                          checked={Boolean(config.enabled[h.id])}
                          onChange={(e) => setEnabled(h.id, e.target.checked)}
                        />
                        <span className="track" aria-hidden="true" />
                        <span className="sr-only">Activar {h.what}</span>
                      </label>
                      <div className="habit-text">
                        <p className="what">{h.what}</p>
                        <p className="small muted">
                          <span className="mono">{formatTime(resolveTime(time, settings))}</span> · {describeTime(time)}
                          {changed ? ' (cambiada)' : ''}
                        </p>
                        <p className="small muted">{h.source}</p>
                      </div>
                      <button
                        type="button"
                        className="btn ghost small-btn"
                        aria-expanded={openTime === h.id}
                        onClick={() => setOpenTime(openTime === h.id ? null : h.id)}
                      >
                        Hora
                      </button>
                    </div>
                    {openTime === h.id && (
                      <div className="habit-time">
                        <TimeEditor idPrefix={h.id} value={time} settings={settings} onChange={(t) => setTime(h.id, t)} />
                        {changed && (
                          <button type="button" className="link-btn" onClick={() => setTime(h.id, null)}>
                            Volver a la hora del libro ({describeTime(h.time)})
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section className="panel" aria-labelledby="h-propios">
          <h2 id="h-propios">Tus propios hábitos</h2>
          {config.custom.length === 0 && !formOpen && (
            <p className="lede">Añade lo que quieras seguir cada día: estiramientos, vitaminas, leer 10 páginas…</p>
          )}
          <ul className="habit-list">
            {config.custom.map((c) => (
              <li key={c.id} className="on">
                <div className="habit-row">
                  <span className={`tag ${c.tag}`}>{TAG_OPTIONS.find((t) => t.value === c.tag)?.label}</span>
                  <div className="habit-text">
                    <p className="what">{c.what}</p>
                    <p className="small muted">
                      <span className="mono">{formatTime(resolveTime(c.time, settings))}</span> · {describeTime(c.time)}
                      {c.how ? ` · ${c.how}` : ''}
                    </p>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn ghost small-btn"
                      onClick={() => {
                        setDraft(c);
                        setFormOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    {confirmDelete === c.id ? (
                      <button
                        type="button"
                        className="btn danger small-btn"
                        onClick={() => {
                          removeCustom(c.id);
                          setConfirmDelete(null);
                        }}
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button type="button" className="btn ghost small-btn" onClick={() => setConfirmDelete(c.id)}>
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {formOpen ? (
            <form
              className="custom-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveDraft();
              }}
            >
              <div className="fields">
                <label className="field" htmlFor="c-what">
                  Hábito
                  <input
                    id="c-what"
                    type="text"
                    maxLength={60}
                    placeholder="Estiramientos 10 min"
                    value={draft.what}
                    onChange={(e) => setDraft({ ...draft, what: e.target.value })}
                    required
                  />
                </label>
                <label className="field" htmlFor="c-tag">
                  Categoría
                  <select id="c-tag" value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value as Tag })}>
                    {TAG_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field" htmlFor="c-how">
                Nota (opcional)
                <input
                  id="c-how"
                  type="text"
                  maxLength={140}
                  placeholder="Cadera, isquios y espalda"
                  value={draft.how}
                  onChange={(e) => setDraft({ ...draft, how: e.target.value })}
                />
              </label>
              <TimeEditor idPrefix="c" value={draft.time} settings={settings} onChange={(t) => setDraft({ ...draft, time: t })} />
              <div className="btn-row">
                <button type="submit" className="btn" disabled={!draft.what.trim()}>
                  {draft.id ? 'Guardar cambios' : 'Añadir hábito'}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setDraft(EMPTY_DRAFT);
                    setFormOpen(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="btn-row">
              <button type="button" className="btn ghost" onClick={() => setFormOpen(true)}>
                + Añadir un hábito propio
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
