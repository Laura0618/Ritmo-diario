import type { Tag } from '../types';

export const TAG_LABEL: Record<Tag, string> = {
  sueno: 'Sueño',
  luz: 'Luz',
  estres: 'Estrés',
  cuerpo: 'Cuerpo',
  mente: 'Mente',
};

export const TAG_ORDER: readonly Tag[] = ['sueno', 'luz', 'estres', 'cuerpo', 'mente'];

export const TAG_COLOR: Record<Tag, string> = {
  sueno: 'var(--blue)',
  luz: 'var(--orange)',
  estres: 'var(--red)',
  cuerpo: 'var(--yellow)',
  mente: 'var(--muted)',
};
