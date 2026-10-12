import { NSDR_AUDIO, NSDR_DURATIONS, NSDR_SCRIPT, stepAt, stepStarts } from '../nsdr';
import { LIBRARY, PROTOCOL_COUNT, normalize } from '../protocols';
import { formatClock, formatDuration, formatTime, toMinutes } from '../time';

describe('NSDR', () => {
  it('reparte los pasos en toda la sesión', () => {
    const starts = stepStarts(600);
    expect(starts).toHaveLength(NSDR_SCRIPT.length);
    expect(starts[0]).toBe(0);
    expect(stepAt(starts, 0)).toBe(0);
    expect(stepAt(starts, 599)).toBe(NSDR_SCRIPT.length - 1);
  });

  it('cada duración tiene su audio', () => {
    for (const m of NSDR_DURATIONS) {
      expect(NSDR_AUDIO[m].url).toMatch(/^https:\/\/open\.spotify\.com\/track\//);
    }
    expect(new Set(NSDR_DURATIONS.map((m) => NSDR_AUDIO[m].url)).size).toBe(3);
  });
});

describe('biblioteca', () => {
  it('contiene los 47 protocolos en 7 categorías', () => {
    expect(LIBRARY).toHaveLength(7);
    expect(PROTOCOL_COUNT).toBe(47);
  });

  it('busca sin tildes', () => {
    expect(normalize('Cafeína')).toBe('cafeina');
  });
});

describe('tiempo', () => {
  it('convierte y formatea', () => {
    expect(toMinutes('07:30')).toBe(450);
    expect(toMinutes('basura')).toBe(0);
    expect(formatTime(-60)).toBe('23:00');
    expect(formatDuration(95)).toBe('1 h 35 min');
    expect(formatClock(125.7)).toBe('2:05');
  });
});
