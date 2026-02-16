/**
 * Types pour le module Utilisateurs
 * Les schémas Zod sont dans validators.ts
 *
 * @module utilisateurs/types
 */

export interface UserDataSession {
  isFind: boolean;
  message: string;
  dataToStore: {
    id: number | null;
    userId?: string; // Ajouter le userId optionnel
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    email: string;
    date_naissance: string;
    status_id: number;
    grade_id: number | null;
    abonnement_id: number | null;
  };
}

export type Professeur = {
  id: string;
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  genre_id: number;
  date_naissance: string;
  grade_id: number;
};

export type UserDataLogin = {
  email: string;
  password: string;
};

export type Abonnement = {
  id: number;
  nom_plan: string;
};

export type Grade = {
  id: number;
  grade_id: string;
};

export type Genres = {
  id: number;
  genre_name: string;
};

export type Status = {
  id: number;
  status_name: string;
};

export type UserDataInscription = {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  date: string;
  abonnement: string | number;
  genre: string | number;
};

export type UserDataAjout = {
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  date_of_birth: string;
  genres: number;
  grades: number;
  abonnement: number;
  status: number;
};

export type UtilisateurInscriptionPayload = {
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  password: string;
  genre_id: number;
  abonnement_id: number;
  date_naissance: string;
  date_inscription: string;
  status_id: number;
  grade_id: number;
};

export type UserSearchByEmail = {
  email: string;
};

export interface AvailableUserForLogin {
  userId: string;
  prenom: string;
  nom: string;
  date_naissance: string;
  nom_utilisateur: string;
  age: number;
  initiales: string;
  relation_familiale?: string;
  est_responsable?: boolean;
}

export interface UserData {
  id?: number;
  userId?: string;
  prenom?: string;
  nom?: string;
  first_name?: string;
  last_name?: string;
  nom_utilisateur?: string;
  email?: string;
  genre_id?: number | null;
  date_of_birth?: string;
  date_naissance?: string;
  password?: string;
  status_id?: number;
  active?: boolean;
  grade_id?: number | null;
  abonnement_id?: number | null;
  date_inscription?: string;
}

export type UserDataLoginByUserId = {
  userId: string;
  password: string;
};
