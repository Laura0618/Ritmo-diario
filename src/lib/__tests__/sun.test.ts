import { DEFAULT_PLACE, sunTimes } from '../sun';

// Las pruebas corren con TZ=Europe/Madrid (scripts de package.json).

describe('salida y puesta de sol', () => {
  it('Barcelona en el solsticio de verano (horario de verano)', () => {
    const { sunrise, sunset } = sunTimes(new Date(2026, 5, 21), DEFAULT_PLACE.lat, DEFAULT_PLACE.lon);
    // Referencia: 06:18 y 21:28 aprox.
    expect(Math.abs(sunrise! - (6 * 60 + 18))).toBeLessThanOrEqual(4);
    expect(Math.abs(sunset! - (21 * 60 + 28))).toBeLessThanOrEqual(4);
  });

  it('Barcelona en el solsticio de invierno', () => {
    const { sunrise, sunset } = sunTimes(new Date(2026, 11, 21), DEFAULT_PLACE.lat, DEFAULT_PLACE.lon);
    // Referencia: 08:15 y 17:25 aprox.
    expect(Math.abs(sunrise! - (8 * 60 + 15))).toBeLessThanOrEqual(4);
    expect(Math.abs(sunset! - (17 * 60 + 25))).toBeLessThanOrEqual(4);
  });

  it('noche polar: el sol no sale', () => {
    expect(sunTimes(new Date(2026, 11, 21), 78.2, 15.6).sunrise).toBeNull();
  });
});
