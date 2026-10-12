import type { ReactNode } from 'react';
import { toMinutes } from '../lib/time';
import type { Tag } from '../types';

const TAG_COLOR: Record<Tag, string> = {
  sueno: 'var(--blue)',
  luz: 'var(--orange)',
  estres: 'var(--red)',
  cuerpo: 'var(--yellow)',
};

const C = 160; // centro del viewBox 320x320
const RING_R = 122;
const RING_W = 18;

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
  sunset: string;
  now: number;
  /** Habitos propios: un punto en el borde interior del reloj. */
  marks?: readonly { t: number; tag: Tag }[];
  children?: ReactNode;
}

/** Reloj de 24 h con sueño, ventanas de luz, luz tenue, cafeina y minimo de temperatura. */
export function Dial({ wake, bed, sunset, now, marks = [], children }: DialProps): JSX.Element {
  const W = toMinutes(wake);
  const B = toMinutes(bed);
  const SS = toMinutes(sunset);
  const [tx, ty] = polar(W - 120, RING_R);
  const [hx, hy] = polar(now, 140);
  const [bx, by] = polar(now, 92);

  return (
    <div className="dial-wrap">
      <svg viewBox="0 0 320 320" role="img" aria-label="Reloj de 24 horas con tus ventanas de sueño, luz y cafeína">
        <circle cx={C} cy={C} r={RING_R} fill="none" stroke="var(--surface-2)" strokeWidth={RING_W} />
        <circle cx={C} cy={C} r={RING_R + RING_W / 2} fill="none" stroke="var(--line)" strokeWidth={1} />
        <circle cx={C} cy={C} r={RING_R - RING_W / 2} fill="none" stroke="var(--line)" strokeWidth={1} />
        {Array.from({ length: 24 }, (_, h) => {
          const [x1, y1] = polar(h * 60, 136);
          const [x2, y2] = polar(h * 60, h % 6 === 0 ? 144 : 140);
          return (
            <line
              key={h}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--muted)"
              strokeWidth={h % 6 === 0 ? 1.6 : 0.8}
            />
          );
        })}
        {[0, 6, 12, 18].map((h) => {
          const [x, y] = polar(h * 60, 153);
          return (
            <text
              key={h}
              x={x}
              y={y + 3.5}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize={10}
              fill="var(--muted)"
            >
              {String(h).padStart(2, '0')}
            </text>
          );
        })}
        <path d={arc(B, W, RING_R)} fill="none" stroke="var(--blue)" strokeWidth={RING_W} />
        <path d={arc(B - 60, B, RING_R)} fill="none" stroke="var(--red)" strokeWidth={RING_W} />
        <path d={arc(W, W + 60, RING_R)} fill="none" stroke="var(--orange)" strokeWidth={RING_W} />
        <path d={arc(SS - 60, SS, RING_R)} fill="none" stroke="var(--orange)" strokeWidth={RING_W} opacity={0.7} />
        <path d={arc(W + 30, B - 600, 100)} fill="none" stroke="var(--yellow)" strokeWidth={4} strokeLinecap="round" />
        {marks.map((m, i) => {
          const [mx, my] = polar(m.t, 108);
          return <circle key={i} cx={mx} cy={my} r={3.5} fill={TAG_COLOR[m.tag]} stroke="var(--surface)" strokeWidth={1.5} />;
        })}
        <circle cx={tx} cy={ty} r={4.5} fill="var(--surface)" stroke="var(--blue)" strokeWidth={2}>
          <title>Mínimo de temperatura</title>
        </circle>
        <line x1={bx} y1={by} x2={hx} y2={hy} stroke="var(--ink)" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={4} fill="var(--ink)" />
      </svg>
      <div className="dial-center">{children}</div>
    </div>
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
        <i style={{ background: 'var(--orange)' }} />
        Luz natural
      </span>
      <span>
        <i style={{ background: 'var(--red)' }} />
        Luz tenue
      </span>
      <span>
        <i style={{ background: 'var(--yellow)' }} />
        Cafeína
      </span>
    </div>
  );
}
