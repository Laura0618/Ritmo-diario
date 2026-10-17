import { useState } from 'react';
import { DEFAULT_PLACE } from '../lib/sun';
import type { Settings } from '../types';

interface Props {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

type GeoState = 'idle' | 'asking' | 'denied' | 'unavailable';

/** «Tu horario»: despertar, dormir y sol (automático por ubicación o a mano). */
export function SchedulePanel({ settings, update }: Props): JSX.Element {
  const [geo, setGeo] = useState<GeoState>('idle');
  const usingOwnPlace = settings.lat !== null && settings.lon !== null;

  function locate(): void {
    if (!('geolocation' in navigator)) {
      setGeo('unavailable');
      return;
    }
    setGeo('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Dos decimales (~1 km): suficiente para el sol y no guarda una ubicación exacta.
        const round = (v: number) => Math.round(v * 100) / 100;
        update({ sunAuto: true, lat: round(pos.coords.latitude), lon: round(pos.coords.longitude) });
        setGeo('idle');
      },
      (err) => setGeo(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { maximumAge: 6 * 3600_000, timeout: 15_000 },
    );
  }

  return (
    <details className="schedule">
      <summary>
        Tu horario
        <span className="val">
          {settings.wake}–{settings.bed}
        </span>
      </summary>

      <div className="settings two">
        <label htmlFor="wake">
          Despertar
          <input
            type="time"
            id="wake"
            value={settings.wake}
            onChange={(e) => e.target.value && update({ wake: e.target.value })}
          />
        </label>
        <label htmlFor="bed">
          Dormir
          <input
            type="time"
            id="bed"
            value={settings.bed}
            onChange={(e) => e.target.value && update({ bed: e.target.value })}
          />
        </label>
      </div>

      <div className="sun-block">
        <div className="sun-head">
          <span>Sol</span>
          <div className="seg" role="group" aria-label="Cómo calcular el sol">
            <button type="button" aria-pressed={settings.sunAuto} onClick={() => update({ sunAuto: true })}>
              Automático
            </button>
            <button
              type="button"
              aria-pressed={!settings.sunAuto}
              onClick={() => update({ sunAuto: false, sunrise: settings.sunrise, sunset: settings.sunset })}
            >
              Manual
            </button>
          </div>
        </div>

        {settings.sunAuto ? (
          <>
            <dl className="sun-times">
              <div>
                <dt>Salida del sol</dt>
                <dd>{settings.sunrise}</dd>
              </div>
              <div>
                <dt>Puesta de sol</dt>
                <dd>{settings.sunset}</dd>
              </div>
            </dl>
            <p className="note">
              {usingOwnPlace
                ? 'Calculado cada día para tu ubicación.'
                : `Calculado cada día para ${DEFAULT_PLACE.name}.`}{' '}
              <button type="button" className="link-btn" onClick={locate} disabled={geo === 'asking'}>
                {geo === 'asking' ? 'Buscando…' : usingOwnPlace ? 'Actualizar ubicación' : 'Usar mi ubicación'}
              </button>
            </p>
            {geo === 'denied' && (
              <p className="note" role="status">
                No hay permiso de ubicación. Actívalo en Ajustes del iPhone › Privacidad › Localización, o pon las horas
                en Manual.
              </p>
            )}
            {geo === 'unavailable' && (
              <p className="note" role="status">
                No se pudo obtener la ubicación. Inténtalo de nuevo o pon las horas en Manual.
              </p>
            )}
          </>
        ) : (
          <div className="settings two">
            <label htmlFor="sunrise">
              Salida del sol
              <input
                type="time"
                id="sunrise"
                value={settings.sunrise}
                onChange={(e) => e.target.value && update({ sunrise: e.target.value })}
              />
            </label>
            <label htmlFor="sunset">
              Puesta de sol
              <input
                type="time"
                id="sunset"
                value={settings.sunset}
                onChange={(e) => e.target.value && update({ sunset: e.target.value })}
              />
            </label>
          </div>
        )}
      </div>

      <p className="note">Mantén el mismo horario ±30 min de 6 a 7 noches por semana.</p>
    </details>
  );
}
