import { ANCHOR_OPTIONS, resolveTime } from '../lib/habits';
import { formatTime, toMinutes } from '../lib/time';
import type { Anchor, HabitTime, Settings } from '../types';

interface Props {
  idPrefix: string;
  value: HabitTime;
  settings: Settings;
  onChange: (next: HabitTime) => void;
}

/** Hora de un habito: fija o relativa a despertar, dormir o la puesta de sol. */
export function TimeEditor({ idPrefix, value, settings, onChange }: Props): JSX.Element {
  const isFixed = value.anchor === 'fixed';
  const minutes = Math.abs(value.offset);
  const direction = value.offset < 0 ? -1 : 1;

  function setAnchor(anchor: Anchor): void {
    if (anchor === 'fixed') onChange({ anchor, offset: resolveTime(value, settings) });
    else onChange({ anchor, offset: value.anchor === 'fixed' ? 0 : value.offset });
  }

  return (
    <div className="time-editor">
      <label className="field" htmlFor={`${idPrefix}-anchor`}>
        Referencia
        <select id={`${idPrefix}-anchor`} value={value.anchor} onChange={(e) => setAnchor(e.target.value as Anchor)}>
          {ANCHOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {isFixed ? (
        <label className="field" htmlFor={`${idPrefix}-fixed`}>
          Hora
          <input
            type="time"
            id={`${idPrefix}-fixed`}
            value={formatTime(value.offset)}
            onChange={(e) => e.target.value && onChange({ anchor: 'fixed', offset: toMinutes(e.target.value) })}
          />
        </label>
      ) : (
        <>
          <label className="field" htmlFor={`${idPrefix}-min`}>
            Minutos
            <input
              type="number"
              id={`${idPrefix}-min`}
              inputMode="numeric"
              min={0}
              max={720}
              step={5}
              value={minutes}
              onChange={(e) => {
                const n = Math.min(720, Math.max(0, Math.round(Number(e.target.value) || 0)));
                onChange({ anchor: value.anchor, offset: n * direction });
              }}
            />
          </label>
          <label className="field" htmlFor={`${idPrefix}-dir`}>
            Cuándo
            <select
              id={`${idPrefix}-dir`}
              value={direction}
              onChange={(e) => onChange({ anchor: value.anchor, offset: minutes * Number(e.target.value) })}
            >
              <option value={-1}>Antes</option>
              <option value={1}>Después</option>
            </select>
          </label>
        </>
      )}
      <p className="small muted time-preview">
        Hoy: <b className="mono">{formatTime(resolveTime(value, settings))}</b>
      </p>
    </div>
  );
}
