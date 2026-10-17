/**
 * Salida y puesta de sol a partir de la fecha y las coordenadas.
 * Algoritmo del Almanac for Computers (1990), con el cenit oficial de 90,833°.
 * Precisión de ±2 minutos, de sobra para planificar la luz del día.
 */

/** Ubicación por defecto mientras no se use la del dispositivo. */
export const DEFAULT_PLACE = { lat: 41.39, lon: 2.17, name: 'Barcelona' } as const;

const RAD = Math.PI / 180;
const ZENITH = 90.833;

const norm = (v: number, max: number): number => ((v % max) + max) % max;

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86_400_000);
}

/** Minuto del día local (0–1439) o null si ese día el sol no sale o no se pone. */
function event(date: Date, lat: number, lon: number, rising: boolean): number | null {
  const N = dayOfYear(date);
  const lngHour = lon / 15;
  const t = N + ((rising ? 6 : 18) - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  const L = norm(M + 1.916 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 282.634, 360);
  let RA = norm(Math.atan(0.91764 * Math.tan(L * RAD)) / RAD, 360);
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
  const sinDec = 0.39782 * Math.sin(L * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(ZENITH * RAD) - sinDec * Math.sin(lat * RAD)) / (cosDec * Math.cos(lat * RAD));
  if (cosH > 1 || cosH < -1) return null;
  const H = (rising ? 360 - Math.acos(cosH) / RAD : Math.acos(cosH) / RAD) / 15;
  const T = H + RA - 0.06571 * t - 6.622;
  const UT = norm(T - lngHour, 24);
  // Desfase horario de ese día en concreto (tiene en cuenta el horario de verano).
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const offsetH = -noon.getTimezoneOffset() / 60;
  return Math.round(norm(UT + offsetH, 24) * 60) % 1440;
}

export function sunTimes(date: Date, lat: number, lon: number): { sunrise: number | null; sunset: number | null } {
  return { sunrise: event(date, lat, lon, true), sunset: event(date, lat, lon, false) };
}
