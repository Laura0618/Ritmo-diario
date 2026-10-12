import { useNow } from '../hooks/useNow';
import { WEEK, maxHeartRate, planIndexFor, waterForSession, waterPerInterval, zoneBpm } from '../lib/plan';
import { WEEKDAYS } from '../lib/time';
import { useSettings } from '../store/SettingsProvider';
import type { Sex, WorkoutKind } from '../types';

const KIND_LABEL: Record<WorkoutKind, string> = { cardio: 'Cardio', fuerza: 'Fuerza', descanso: 'Descanso' };
const DAY1_OPTIONS = [1, 2, 3, 4, 5, 6, 0] as const;

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function SemanaPage(): JSX.Element {
  const { settings, update } = useSettings();
  const now = useNow();
  const todayIdx = planIndexFor(now, settings.day1);
  const maxHr = maxHeartRate(settings.age, settings.sex);
  const perInterval = waterPerInterval(settings.kg);
  const total = waterForSession(settings.kg, settings.mins);

  return (
    <>
      <div className="section-head">
        <h1>Plan base de ejercicio</h1>
        <label className="field inline" htmlFor="day1">
          Empieza el
          <select
            id="day1"
            className="select-inline"
            value={settings.day1}
            onChange={(e) => update({ day1: Number(e.target.value) })}
          >
            {DAY1_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {WEEKDAYS[d]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="week">
        {WEEK.map((day, i) => {
          const wd = (settings.day1 + i) % 7;
          const bpm = day.zone ? zoneBpm(maxHr, day.zone) : null;
          return (
            <div key={day.title} className={`day${i === todayIdx ? ' today' : ''}`}>
              <div className="dn">
                <span className="eyebrow">Día {i + 1}</span>
                <span className="eyebrow">{i === todayIdx ? 'Hoy' : WEEKDAYS[wd]?.slice(0, 3)}</span>
              </div>
              <span className={`kind ${day.kind}`}>{KIND_LABEL[day.kind]}</span>
              <h3>{day.title}</h3>
              {bpm && (
                <span className="zone">
                  {bpm[0]}–{bpm[1]} ppm
                </span>
              )}
              <p>{day.desc}</p>
            </div>
          );
        })}
      </div>
      <p className="note spaced">
        Además: camina entre 7.000 y 10.000 pasos al día, 5–10 min después de las comidas y 5 min por cada 30 sentada.
        Añade movilidad (muñecas, espalda, rodillas, caderas y hombros) de 2 a 4 veces por semana.
      </p>

      <div className="calc">
        <section className="panel" aria-labelledby="h-zonas">
          <h2 id="h-zonas">Tus zonas de frecuencia cardiaca</h2>
          <div className="fields">
            <label className="field" htmlFor="age">
              Edad
              <input
                type="number"
                id="age"
                min={14}
                max={99}
                inputMode="numeric"
                value={settings.age || ''}
                onChange={(e) => update({ age: toNumber(e.target.value) })}
              />
            </label>
            <label className="field" htmlFor="sex">
              Fórmula
              <select id="sex" value={settings.sex} onChange={(e) => update({ sex: e.target.value as Sex })}>
                <option value="f">Mujer</option>
                <option value="m">Hombre</option>
              </select>
            </label>
          </div>
          <p className="small muted">
            FC máxima estimada: <b className="mono">{Math.round(maxHr)}</b> ppm
          </p>
          <div className="table-scroll">
            <table className="zones">
              <thead>
                <tr>
                  <th>Sesión</th>
                  <th>Intensidad</th>
                  <th>Pulsaciones</th>
                </tr>
              </thead>
              <tbody>
                {WEEK.filter((w) => w.zone).map((w) => {
                  const zone = w.zone!;
                  const [lo, hi] = zoneBpm(maxHr, zone);
                  return (
                    <tr key={w.title}>
                      <td>{w.title}</td>
                      <td className="mono">
                        {Math.round(zone[0] * 100)}–{Math.round(zone[1] * 100)} %
                      </td>
                      <td className="mono">
                        {lo}–{hi} ppm
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="note spaced">
            Referencia práctica para la sesión larga: el ritmo más alto al que todavía puedes respirar solo por la nariz.
          </p>
        </section>

        <section className="panel" aria-labelledby="h-agua">
          <h2 id="h-agua">Agua durante el ejercicio</h2>
          <div className="fields">
            <label className="field" htmlFor="kg">
              Peso (kg)
              <input
                type="number"
                id="kg"
                min={30}
                max={200}
                inputMode="numeric"
                value={settings.kg || ''}
                onChange={(e) => update({ kg: toNumber(e.target.value) })}
              />
            </label>
            <label className="field" htmlFor="mins">
              Duración (min)
              <input
                type="number"
                id="mins"
                min={10}
                max={300}
                inputMode="numeric"
                value={settings.mins || ''}
                onChange={(e) => update({ mins: toNumber(e.target.value) })}
              />
            </label>
          </div>
          <p className="small muted">Cada 15–20 minutos</p>
          <p className="big">{perInterval ? `${perInterval} ml` : '–'}</p>
          <p className="small muted spaced-sm">
            Total aproximado de la sesión: <b className="mono">{total ? `${total} ml` : '–'}</b>
          </p>
          <p className="note spaced">
            Basado en la fórmula de Andy Galpin que cita el libro: peso en libras ÷ 30 = onzas cada 15–20 min.
          </p>
        </section>
      </div>
    </>
  );
}
