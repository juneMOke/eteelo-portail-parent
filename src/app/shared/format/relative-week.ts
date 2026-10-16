/**
 * Position d'une semaine par rapport à la semaine en cours, en entier (grand écran) et abrégée
 * (téléphone, une seule ligne) : « semaine passée », « il y a 2 sem. ».
 */
export interface RelativeWeek {
  readonly long: string;
  readonly short: string;
}

export function relativeWeek(offset: number): RelativeWeek {
  if (offset === 0) return { long: 'cette semaine', short: 'cette sem.' };
  if (offset === 1) return { long: 'semaine prochaine', short: 'sem. prochaine' };
  if (offset === -1) return { long: 'semaine passée', short: 'sem. passée' };
  if (offset > 1) return { long: `dans ${offset} semaines`, short: `dans ${offset} sem.` };
  return { long: `il y a ${-offset} semaines`, short: `il y a ${-offset} sem.` };
}
