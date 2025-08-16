// Types spécifiques de réponse API
import type { CoursData, Utilisateur } from './cours.js'; // à adapter selon ton arborescence

// Résultat d'insertion dans la DB
export interface InsertResult {
  insertId: number;
  affectedRows: number;
}

// Résultat de vérification simple (sans données)
export interface VerifyResult {
  isFind: boolean;
  message: string;
}

// Résultat de vérification avec des données typées
export interface VerifyResultWithData<T = any> extends VerifyResult {
  data: T;
}

// Résultat de réservation (générique également)
export interface Book<T = any> {
  isBooked: boolean;
  message: string;
  data: T;
}

// Book + Verify combinés
export type BookResult<T = any> = Book<T> & VerifyResult;

// Résultat de confirmation
export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
}


export type CoursApiResponse = {
  success: boolean;
  data: {
    Cours: CoursData;  // correspond à ta structure complète incluant utilisateurs
  };
  message: string;
};


export type UtilisateurApiResponse = VerifyResultWithData<{ utilisateurs: Utilisateur[] }>;