import type { ReactNode } from 'react';
import { toMinutes } from '../lib/time';

const C = 160; // centro del viewBox 320x320
const RING_R = 122;
const RING_W = 10;

function polar(minutes: number, r: number): [number, number] {
  const a = (minutes / 1440) * 2 * Math.PI;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
}

/** Arco en sentido horario de `m1` a `m2` (minutos del dia). */
function arc(m1: number, m2: number, r: number): string {
  const span = (((m2 - m1) % 1440) + 1440) % 1440;
  if (!span) return '';
  const [x1, y1] = polar(m1, r);
  const [x2, y2] = polar(m1 + span, r);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${span > 720 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

interface DialProps {
  wake: string;
  bed: string;
  sunrise: string;
  sunset: string;
  now: number;
  children?: ReactNode;
}

/** Reloj de 24 h: sueño, ventanas de luz, cafeína, ejercicio y la salida y puesta de sol. */
export function Dial({ wake, bed, sunrise, sunset, now, children }: DialProps): JSX.Element {
  const W = toMinutes(wake);
  const B = toMinutes(bed);
  const SR = toMinutes(sunrise);
  const SS = toMinutes(sunset);
  const [srx, sry] = polar(SR, 109);
  const [ssx, ssy] = polar(SS, 109);
  // Ventana de ejercicio: desde que te despiertas hasta las 13:00.
  const EX_END = 13 * 60;
  const showExercise = W < EX_END;
  const [hx, hy] = polar(now, 143);
  const [bx, by] = polar(now, 92);

  return (
    <div className="dial-wrap">
      <svg
        viewBox="0 0 320 320"
        role="img"
        aria-label={`Reloj de 24 horas. Amanece a las ${sunrise} y anochece a las ${sunset}; duermes de ${bed} a ${wake}.`}
      >
        <circle cx={C} cy={C} r={RING_R} fill="none" stroke="var(--surface-2)" strokeWidth={RING_W} />
        {Array.from({ length: 24 }, (_, h) => {
          const [x1, y1] = polar(h * 60, 139);
          const [x2, y2] = polar(h * 60, h % 6 === 0 ? 145 : 141);
          return (
            <line
              key={h}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--muted)"
              strokeWidth={h % 6 === 0 ? 1.2 : 0.6}
              opacity={h % 6 === 0 ? 1 : 0.6}
            />
          );
        })}
        {[0, 6, 12, 18].map((h) => {
          const [x, y] = polar(h * 60, 153.5);
          return (
            <text
              key={h}
              x={x}
              y={y + 3.5}
              textAnchor="middle"
              fontFamily="-apple-system, BlinkMacSystemFont, system-ui, sans-serif"
              fontSize={9.5}
              fill="var(--muted)"
            >
              {String(h).padStart(2, '0')}
            </text>
          );
        })}
        {showExercise && (
          <path
            d={arc(W, EX_END, RING_R + 11)}
            fill="none"
            stroke="var(--c-mente)"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.85}
          />
        )}
        <path d={arc(B, W, RING_R)} fill="none" stroke="var(--blue)" strokeWidth={RING_W} />
        <path d={arc(B - 60, B, RING_R)} fill="none" stroke="var(--red)" strokeWidth={RING_W} />
        <path d={arc(W, W + 60, RING_R)} fill="none" stroke="var(--orange)" strokeWidth={RING_W} />
        <path d={arc(SS - 60, SS, RING_R)} fill="none" stroke="var(--orange)" strokeWidth={RING_W} opacity={0.7} />
        <path
          d={arc(W + 30, B - 600, 100)}
          fill="none"
          stroke="var(--c-luz)"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.75}
        />
        <SunGlyph x={srx} y={sry} />
        <MoonGlyph x={ssx} y={ssy} />
        <line x1={bx} y1={by} x2={hx} y2={hy} stroke="var(--ink)" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={3.5} fill="var(--ink)" />
      </svg>
      <div className="dial-center">{children}</div>
    </div>
  );
}

/** Sol pequeño: marca la salida del sol. */
function SunGlyph({ x, y }: { x: number; y: number }): JSX.Element {
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} aria-hidden="true">
      <circle r={2.6} fill="var(--orange)" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={Math.cos(a) * 4}
            y1={Math.sin(a) * 4}
            x2={Math.cos(a) * 5.6}
            y2={Math.sin(a) * 5.6}
            stroke="var(--orange)"
            strokeWidth={1.1}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

/** Luna creciente pequeña: marca la puesta de sol. */
function MoonGlyph({ x, y }: { x: number; y: number }): JSX.Element {
  return (
    <path
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
      d="M1.6 -4.2 A4.5 4.5 0 1 0 1.6 4.2 A3.6 3.6 0 0 1 1.6 -4.2 Z"
      fill="var(--ink-2)"
      aria-hidden="true"
    />
  );
}

export function DialLegend(): JSX.Element {
  return (
    <div className="legend">
      <span>
        <i style={{ background: 'var(--blue)' }} />
        Sueño
      </span>
      <span>
        <i className="legend-line" />
        Cafeína
      </span>
      <span>
        <i className="legend-line exercise" />
        Ejercicio
      </span>
    </div>
  );
}
