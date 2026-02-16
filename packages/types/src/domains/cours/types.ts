/**
 * Types pour le module Cours
 * Les schémas Zod sont dans validators.ts
 *
 * @module cours/types
 */

import type { Professeur } from "../utilisateurs/types.js";

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
