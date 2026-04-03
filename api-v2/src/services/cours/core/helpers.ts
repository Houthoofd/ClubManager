/**
 * Fonctions utilitaires pour le service cours
 * Helpers pour dates, semaines, jours, etc.
 */

/**
 * Mapping des jours de la semaine (français -> numéro 1-7)
 */
export const joursSemaineMap: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 7
};

/**
 * Mapping inverse (numéro -> français)
 */
export const joursNumerosMap: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche'
};

/**
 * Obtenir le numéro de semaine ISO d'une date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Obtenir la date du premier jour d'une semaine ISO
 */
export function getDateOfISOWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

/**
 * Convertir un jour (français) en numéro
 */
export function jourVersNumero(jour: string): number | null {
  return joursSemaineMap[jour.toLowerCase()] ?? null;
}

/**
 * Convertir un numéro en jour (français)
 */
export function numeroVersJour(numero: number): string | null {
  return joursNumerosMap[numero] ?? null;
}

/**
 * Calculer la date de début pour un cours récurrent
 * (Premier jour de ce jour de la semaine à partir de 2024-01-01)
 */
export function calculerDateDebut(jourSemaine: number): Date {
  const start_date = new Date('2024-01-01');
  const dayOfWeek = start_date.getDay();
  const daysUntilTargetDay = (jourSemaine - dayOfWeek + 7) % 7;
  start_date.setDate(start_date.getDate() + daysUntilTargetDay);
  return start_date;
}

/**
 * Calculer la date de fin pour un cours récurrent
 * (Un an après la date de début)
 */
export function calculerDateFin(dateDebut: Date): Date {
  const end_date = new Date(dateDebut);
  end_date.setFullYear(dateDebut.getFullYear() + 1);
  end_date.setDate(31);
  return end_date;
}

/**
 * Formater l'heure en HH:MM
 */
export function formaterHeure(heure: string): string {
  if (heure.length === 5 && heure.includes(':')) {
    return heure;
  }
  // Si format TIME de MySQL (HH:MM:SS), prendre seulement HH:MM
  if (heure.length >= 5) {
    return heure.substring(0, 5);
  }
  return heure;
}
