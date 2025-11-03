import { z } from 'zod';
import type { Professeur } from './utilisateurs.js';

// === Types principaux ===

export type CoursData = {
  id: number;
  date_cours: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  utilisateurs?: Utilisateur[];
};

export type Utilisateur = {
  nom: string;
  prenom: string;
  presence: number;
};

export type UtilisateursParCours = CoursData & {
  utilisateurs: Utilisateur[];
};

export type DataReservation = {
  cours_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export type DataAnnulation = {
  cours_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export type DataValidation = {
  cours_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export type DataInscription = {
  cours_id: number;
  utilisateur_id: number;
  status_id: number;
};

export type JourCours = {
  jour: string;
  type_cours: string;
  heure_debut: string | null;
  heure_fin: string | null;
  professeurs: string[];
};

export type AjoutCours = {
  nom: string;
  heure_debut: string | null;
  heure_fin: string | null;
  jour_semaine: string;
  type_cours: string;
  professeurs: string[];
};

// Nouveau type pour les données du planning professeur
export type PlanningCoursProfesseur = {
  cours_recurrent_id: number;
  type_cours: string;
  jour_semaine: number | string;
  heure_debut: string;
  heure_fin: string;
  est_recurrent_actif: boolean | number;
  professeur_id: number;
  professeur_nom: string;
  professeur_prenom: string;
};

// === Schémas Zod ===

export const coursdataSchema = z.object({
  id: z.number().positive("L'ID du cours doit être un nombre positif"),
  date_cours: z.string().min(1, "La date du cours doit être requis"),
  type_cours: z.string().min(1, "Le type de cours doit être requis"),
  heure_debut: z.string().min(1, "L'heure de début du cours doit être requis"),
  heure_fin: z.string().min(1, "L'heure de fin du cours doit être requis")
});

export const datareservationSchema = z.object({
  cours_id: z.preprocess(
    (val) => Number(val),
    z.number().positive("L'ID du cours doit être un nombre positif")
  ),
  utilisateur_nom: z.string().min(1, "Le nom de l'utilisateur est requis"),
  utilisateur_prenom: z.string().min(1, "Le prenom de l'utilisateur est requis")
});

export const datannulationSchema = z.object({
  cours_id: z.preprocess(
    (val) => Number(val),
    z.number().positive("L'ID du cours doit être un nombre positif")
  ),
  utilisateur_nom: z.string().min(1, "Le nom de l'utilisateur est requis"),
  utilisateur_prenom: z.string().min(1, "Le prenom de l'utilisateur est requis")
});

export const datavalidationSchema = z.object({
  cours_id: z.preprocess(
    (val) => Number(val),
    z.number().positive("L'ID du cours doit être un nombre positif")
  ),
  utilisateur_nom: z.string().min(1, "Le nom de l'utilisateur est requis"),
  utilisateur_prenom: z.string().min(1, "Le prenom de l'utilisateur est requis")
});

// Nouveau schéma Zod pour la validation du planning professeur
export const planningCoursProfesseurSchema = z.object({
  cours_recurrent_id: z.number().positive("L'ID du cours récurrent doit être un nombre positif"),
  type_cours: z.string().min(1, "Le type de cours est requis"),
  jour_semaine: z.union([
    z.number().min(1).max(7),
    z.string().min(1)
  ]),
  heure_debut: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "L'heure de début doit être au format HH:MM:SS"),
  heure_fin: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "L'heure de fin doit être au format HH:MM:SS"),
  est_recurrent_actif: z.union([
    z.boolean(),
    z.number().min(0).max(1)
  ]),
  professeur_id: z.number().positive("L'ID du professeur doit être un nombre positif"),
  professeur_nom: z.string().min(1, "Le nom du professeur est requis"),
  professeur_prenom: z.string().min(1, "Le prénom du professeur est requis")
});

// === Types inférés depuis les schémas ===

export type CoursDataValidated = z.infer<typeof coursdataSchema>;
export type DataReservationValidated = z.infer<typeof datareservationSchema>;
export type DataAnnulationValidated = z.infer<typeof datannulationSchema>;
export type DataValidationValidated = z.infer<typeof datavalidationSchema>;
export type PlanningCoursProfesseurValidated = z.infer<typeof planningCoursProfesseurSchema>;


