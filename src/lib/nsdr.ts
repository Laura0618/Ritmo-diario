/** Guion propio de NSDR. El peso de cada paso reparte la duracion total de la sesion. */
export const NSDR_SCRIPT: readonly (readonly [number, string])[] = [
  [1, 'Túmbate boca arriba con los brazos a los lados. Cierra los ojos. Si temes dormirte, pon una alarma.'],
  [2, 'Inhala por la nariz llenando el abdomen. Exhala por la boca, despacio, el doble de largo que la inhalación.'],
  [2, 'Sigue así: inhalación corta, exhalación larga. Deja que el cuerpo pese contra el suelo.'],
  [1.5, 'Lleva la atención a los dedos del pie derecho. Solo nota lo que sientes, sin cambiar nada.'],
  [1.5, 'Sube por la planta, el tobillo y la pantorrilla derecha.'],
  [1.5, 'Ahora el pie izquierdo. El tobillo. La pantorrilla izquierda.'],
  [1.5, 'Rodillas y muslos. Nota el peso de las piernas.'],
  [1.5, 'Caderas, zona lumbar y abdomen. Deja que el abdomen suba y baje solo.'],
  [1.5, 'Pecho y parte alta de la espalda. Los hombros se sueltan.'],
  [1.5, 'Mano derecha: dedos, palma, muñeca, antebrazo, brazo.'],
  [1.5, 'Mano izquierda: dedos, palma, muñeca, antebrazo, brazo.'],
  [1.5, 'Cuello. Mandíbula suelta. Lengua relajada. Ojos y frente.'],
  [1.5, 'Saca la atención fuera del cuerpo. Escucha los sonidos de la habitación.'],
  [1.5, 'Ahora los sonidos más lejanos, fuera del edificio.'],
  [1.5, 'Vuelve al cuerpo. Nota el contacto de la espalda con el suelo.'],
  [2, 'Alterna con calma: un sonido lejano. La punta de la nariz. Un sonido lejano. Las manos.'],
  [1.5, 'Si aparece un pensamiento, déjalo pasar y vuelve a una sensación.'],
  [6, 'Quédate aquí. Sin hacer nada. Solo sentir. Exhalaciones largas.'],
  [1, 'Respira un poco más hondo. Mueve despacio los dedos de las manos y de los pies.'],
  [1, 'Cuando quieras, abre los ojos. Quédate un momento antes de levantarte.'],
];

export type NsdrMinutes = 10 | 20 | 30;
export const NSDR_DURATIONS: readonly NsdrMinutes[] = [10, 20, 30];

/** Audios grabados (Dr. Andrew Huberman, en ingles) que corresponden a cada duracion. */
export const NSDR_AUDIO: Record<NsdrMinutes, { url: string; length: string }> = {
  10: { url: 'https://open.spotify.com/track/1ZUjVHrZWEg5a9j89QL5aE', length: '10:38' },
  20: { url: 'https://open.spotify.com/track/4jomG2TtGLGcbUxwjpS6q4', length: '20:39' },
  30: { url: 'https://open.spotify.com/track/59ySCm8HziTqjoQpUaRFYD', length: '27:54' },
};

/** Segundo en el que empieza cada paso para una sesion de `totalSeconds`. */
export function stepStarts(totalSeconds: number): number[] {
  const weightSum = NSDR_SCRIPT.reduce((a, [w]) => a + w, 0);
  const scale = totalSeconds / weightSum;
  const starts: number[] = [];
  let acc = 0;
  for (const [w] of NSDR_SCRIPT) {
    starts.push(acc);
    acc += w * scale;
  }
  return starts;
}

/** Indice del paso activo en el segundo `elapsed`. */
export function stepAt(starts: readonly number[], elapsed: number): number {
  let i = 0;
  while (i + 1 < starts.length && elapsed >= (starts[i + 1] ?? Infinity)) i++;
  return i;
}
