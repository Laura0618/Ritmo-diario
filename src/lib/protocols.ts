import type { LibCategory } from '../types';

/**
 * Los 47 protocolos del libro, resumidos con palabras propias (no son citas).
 * Fuente: "Protocols: An Operating Manual for the Human Body", Andrew D. Huberman (2026).
 */
export const LIBRARY: readonly LibCategory[] = [
  {
    id: 'sueno',
    name: 'Sueño',
    protocols: [
      { title: 'Luz solar nada más despertar', points: ['5–10 min en los primeros 30–60 min del día.', 'Sin gafas de sol, gorra ni cristal de por medio. Las gafas graduadas sirven.', 'Con nubes también funciona: es incluso más importante. No mires el sol fijamente.'] },
      { title: 'Luz al final de la tarde', points: ['10–15 min fuera antes de la puesta de sol, mejor mirando al oeste.', 'No hace falta ver el sol ponerse: basta con la luz ambiental.'] },
      { title: 'Poca luz en la última hora', points: ['Atenúa las luces de casa al anochecer.', 'Usa luz cálida, ámbar o roja, o velas.', 'Si necesitas pantallas, gafas que bloqueen luz azul y verde.'] },
      { title: 'Horario según tu cronotipo', points: ['Prueba una semana acostándote hacia las 20:30–21:30 para descubrir tu ritmo natural.', 'Después, mismo horario ±30 min de 6 a 7 noches por semana.', 'Es normal un pico de alerta 1–3 h antes de dormir: déjalo pasar.'] },
      { title: 'Baja la temperatura por la noche', points: ['Dormitorio a 18–20 °C (21 como máximo).', 'Ducha o baño caliente antes de dormir.', 'Pies y manos fuera de la manta; sin calcetines si te despiertas de noche.'] },
      { title: 'Sube la temperatura antes de despertar', points: ['Programa la calefacción 1–2 °C más alta 1–2 h antes de tu hora.', 'Si te despiertas pronto, abrígate y vuelve a dormir: favorece el sueño REM.'] },
      { title: 'Siestas bien hechas', points: ['15–20 min para recuperar energía y foco.', 'Nunca más de 90 min y no demasiado tarde.', 'Si te cuesta dormir de noche, mejor NSDR.'] },
      { title: 'NSDR para compensar el sueño', points: ['10–30 min tumbada siguiendo una guía.', 'Por la mañana si dormiste mal; de noche si no consigues dormirte o volver a dormirte.'] },
      { title: 'Suplementos con cautela', points: ['Primero los hábitos: ningún suplemento compensa una mala higiene de sueño.', 'Los que cita: magnesio L-treonato o bisglicinato (145–250 mg), apigenina (50 mg), teanina (100–200 mg; evítala si tienes pesadillas o sonambulismo), melatonina en dosis bajas (0,5–1,5 mg).', 'Pruébalos uno a uno y consulta antes con tu médico.'] },
      { title: 'Fármacos para dormir, el último recurso', points: ['Si los problemas siguen, habla con tu médico. La terapia cognitivo-conductual para el insomnio tiene buena evidencia.', 'Los somníferos pueden alterar la arquitectura del sueño y crear dependencia.'] },
      { title: 'Ajusta la cafeína', points: ['Nada de cafeína en las 8–10 h antes de dormir (12 h si eres sensible).', 'Retrasa la primera 30–90 min tras despertar si tienes bajón por la tarde.'] },
      { title: 'Sin alcohol 8 h antes de dormir', points: ['El alcohol reduce el sueño profundo y el REM aunque te ayude a dormirte.', 'De 0 a 2 copas por semana como máximo; cero es mejor.'] },
      { title: 'Nada de cannabis para dormir', points: ['Reduce mucho el sueño REM.', 'El CBD puede ayudar por su efecto sobre la ansiedad; a dosis altas es sedante.'] },
      { title: 'Pantallas fuera antes de dormir', points: ['Nada de pantallas en la última hora ni en el dormitorio.', 'Si las usas, brillo al mínimo o filtro rojo.'] },
      { title: 'Evitar el jet lag', points: ['Hacia el este: 2 días antes, adelanta 30–45 min el despertar, la luz, la cafeína y el ejercicio.', 'Hacia el oeste: retrásalo todo 30–45 min y busca luz 1–2 h después de anochecer.', 'Al llegar: horario de comidas local. Luz después de tu mínimo de temperatura adelanta el reloj; antes, lo retrasa.', 'Viajes de menos de 2 días: mantén tu horario de casa.'] },
    ],
  },
  {
    id: 'ejercicio',
    name: 'Ejercicio',
    protocols: [
      { title: 'Camina todo lo que puedas', points: ['7.000 pasos al día como objetivo; 10.000 mejor.', '5–10 min después de cada comida.', '5 min de movimiento por cada 30 sentada.'] },
      { title: 'Fuerza 3 veces por semana', points: ['Piernas, torso, y hombros con brazos en días separados.', 'Consulta el plan en la pestaña Semana.'] },
      { title: 'Cardio 3 veces por semana', points: ['Largo: 45–75 min al 60–70 % de la FC máxima.', 'Medio: 25–30 min al 75–85 %.', 'Intenso: 6–17 min al 90–95 % (intervalos, 4×4 noruego, Cooper, milla).'] },
      { title: 'Movilidad 2–4 veces por semana', points: ['Sesiones breves para muñecas, espalda, rodillas, caderas y hombros, las zonas que más se lesionan.'] },
    ],
  },
  {
    id: 'estres',
    name: 'Estrés',
    protocols: [
      { title: 'Suspiro fisiológico', points: ['Dos inhalaciones por la nariz y una exhalación larga por la boca.', 'Entre 1 y 3 veces seguidas. Lo tienes guiado en Herramientas.'] },
      { title: 'Frío deliberado', points: ['3–7 veces por semana, 1–3 min en agua incómodamente fría.', 'O cuenta muros: cada impulso de salir que superas.', 'Mejor antes de la fuerza que después.'] },
      { title: 'NSDR contra el estrés', points: ['10–30 min, idealmente a diario en épocas de mucha carga.', 'Funciona desde la primera vez.'] },
      { title: 'Micromeditación al despertar', points: ['5 min en la cama antes de levantarte.', 'No se trata de dejar la mente en blanco, sino de tolerar la incomodidad.'] },
      { title: 'Refuerza el pico de cortisol matinal', points: ['Combina 3–4 de estos por la mañana: luz, agua más cafeína (100–400 mg), ejercicio, frío o respiración cíclica.', 'Respiración cíclica: 25–30 inhalaciones profundas con exhalación pasiva y retención de 30–60 s. Nunca cerca del agua ni conduciendo.', 'Evita estos estímulos por la noche.'] },
      { title: 'Suplementos para épocas duras', points: ['Los que cita: ashwagandha (200–300 mg, tarde o noche), L-teanina (100–200 mg), fosfatidilserina (400–800 mg, después de las 16:00), rhodiola (200 mg).', 'La base es el comportamiento y el sueño. Consulta a tu médico.'] },
    ],
  },
  {
    id: 'nutricion',
    name: 'Nutrición',
    protocols: [
      { title: 'Al menos un 90 % sin procesar', points: ['Alimentos de un solo ingrediente: carne, pescado, huevos, verduras, fruta, arroz, legumbres, avena, aceite de oliva.', 'Evita salsas y comida envasada con azúcar añadido.', 'Lácteos enteros y naturales; frutos secos y cremas con moderación.'] },
      { title: 'Hidrátate', points: ['0,5–0,7 L al despertar, antes del café.', 'Unos 2,4 L en las primeras 10 h del día.', 'En el ejercicio, unos 2 ml por kg cada 15–20 min (calculadora en Semana).'] },
      { title: 'Proteína en cada comida', points: ['30–50 g por comida, de fuentes con buena relación entre proteína y calorías.', 'Objetivo diario de unos 2,2 g por kg de peso.', 'Si tiendes a comer de más: proteína primero, luego almidones y verdura al final.'] },
      { title: 'Verdura y fruta como carbohidratos principales', points: ['Verduras fibrosas como base y algo de fruta.', 'Fibra: al menos 25 g al día (mujeres) o 35 g (hombres).'] },
      { title: 'Grasas saludables', points: ['Sobre todo insaturadas: aceite de oliva, aceitunas, aguacate.', 'Más omega-3.'] },
      { title: 'Fermentados bajos en azúcar', points: ['2–4 raciones al día: kéfir, chucrut, kimchi, encurtidos en salmuera, miso, natto.'] },
      { title: 'Pescado azul u omega-3', points: ['Salmón con piel, sardinas, caballa o arenque 1–2 veces por semana.', 'Suplemento: unos 1.000 mg de EPA al día (aceite de alga si eres vegana).'] },
    ],
  },
  {
    id: 'luz',
    name: 'Luz',
    protocols: [
      { title: 'Luz brillante en la primera hora', points: ['10–30 min de luz natural; con 5 ya ayuda.', 'Antes del amanecer, una lámpara de 10.000 lux.'] },
      { title: 'Sol al atardecer', points: ['5–30 min de luz natural al final del día.', 'Aquí no uses la lámpara de 10.000 lux: es demasiado intensa.'] },
      { title: 'Evita la luz brillante 1 h antes de dormir', points: ['Solo la luz imprescindible hasta la mañana.', 'Ojo con el LED blanco, los fluorescentes y las pantallas.'] },
      { title: 'Sol en la piel', points: ['20–30 min con algo de piel al descubierto, al menos 3 veces por semana.', 'Sin gorra durante ese rato.'] },
      { title: 'Luz roja e infrarroja', points: ['10–30 min de 3 a 7 días por semana con un dispositivo de luz de onda larga.', 'Para energía, piel y recuperación.'] },
    ],
  },
  {
    id: 'aprendizaje',
    name: 'Foco y aprendizaje',
    protocols: [
      { title: 'Entra en estado de alerta y foco', points: ['Base: sueño, NSDR y control del estrés.', 'Conductual: 13 min de meditación enfocada; el móvil fuera de la habitación.', 'Farmacológico: la cafeína es la herramienta más común.'] },
      { title: 'Contraste mental', points: ['Imagina tu objetivo y después los obstáculos reales que te separan de él.', 'El objetivo es sentir urgencia, más fiable que la motivación.'] },
      { title: 'Busca el error', points: ['Trabaja justo por encima de tu nivel actual.', 'Un 15 % de errores en tareas cognitivas y un 30 % en motoras es la zona ideal.', 'No falles a propósito: el error debe venir de un intento real.'] },
      { title: 'Duerme bien la noche después', points: ['El cambio en el cerebro se consolida durmiendo.', '10–30 min de NSDR tras la sesión también ayudan.'] },
      { title: 'Microdescansos', points: ['Pausas de 5–30 s sin hacer nada en habilidades motoras.', 'Pausas de 5–10 min en tareas cognitivas. Sin móvil.'] },
      { title: 'Repaso mental', points: ['1–5 min al terminar para ponerte a prueba: qué recuerdas y qué no.', 'En lo motor, piensa dónde fallaste.'] },
    ],
  },
  {
    id: 'crecimiento',
    name: 'Crecimiento personal',
    protocols: [
      { title: 'Ancla la atención al presente', points: ['Pregúntate a menudo si tus pensamientos están aquí o en el pasado o futuro.', 'Para volver, haz preguntas que solo se responden aquí: temperatura, olores, lo que ves.'] },
      { title: 'La guía de James Hollis', points: ['Shut up, suit up, show up: gratitud diaria, cambio deliberado entre tus roles y cumplir con ellos.', 'Reserva tiempo sin objetivo (dibujar, leer, mirar el cielo) para que tus prioridades salgan a la luz.'] },
      { title: 'Escritura expresiva', points: ['15–20 min sobre una experiencia difícil, 4 días seguidos.', 'Qué pasó, qué sentiste, qué sientes ahora y qué consecuencias tuvo.', 'Para al sonar el temporizador. Nadie lo va a leer.'] },
      { title: 'Atravesar el duelo', points: ['El duelo es la ausencia de una recompensa que el cerebro sigue esperando.', '10–30 min al día para sentir el vínculo plenamente.', 'Evita los «y si…».'] },
    ],
  },
];

export const PROTOCOL_COUNT = LIBRARY.reduce((n, c) => n + c.protocols.length, 0);

/** Normaliza para buscar sin tildes ni mayusculas. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
