/**
 * Types pour les statistiques
 * Les schémas Zod sont dans validators.ts
 *
 * @module statistiques/types
 */

export type FrequentationParCours = {
  cours_id: number;
  titre: string;
  frequentation: number;
};

export type FrequentationParMois = {
  mois: string;
  frequentation: number;
};

export type StatistiquesFrequentation = {
  totalFrequentation: number;
  frequentationParCours: FrequentationParCours[];
  frequentationParMois: FrequentationParMois[];
};

export type ProgressionParCours = {
  cours_id: number;
  titre: string;
  progression: number;
};

export type StatistiquesProgressionUtilisateur = {
  utilisateur_id: number;
  coursSuivis: number;
  progressionParCours: ProgressionParCours[];
  niveauActuel: string;
};
