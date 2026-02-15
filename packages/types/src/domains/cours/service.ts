/**
 * Types pour le service des cours
 * Gère les cours, inscriptions, validations et professeurs
 */

/**
 * Informations complètes d'un cours avec relations
 */
export interface CoursInfo {
  id: number;
  date_cours: Date;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  cours_recurrent_id?: number | null;
  coursRecurrent?: CoursRecurrentInfo | null;
  inscriptions?: InscriptionInfo[];
  professeurs?: string; // GROUP_CONCAT des noms
}

/**
 * Informations d'un cours récurrent
 */
export interface CoursRecurrentInfo {
  id: number;
  type_cours: string;
  jour_semaine: number; // 1-7 (Lundi-Dimanche)
  heure_debut: string;
  heure_fin: string;
  professeurs?: ProfesseurInfo[];
}

/**
 * Informations d'un professeur
 */
export interface ProfesseurInfo {
  id: number;
  nom: string;
  prenom: string;
  status_id: number;
}

/**
 * Informations d'une inscription avec utilisateur
 */
export interface InscriptionInfo {
  id: number;
  cours_id: number;
  utilisateur_id: number;
  is_present?: boolean | null;
  is_validate?: boolean | null;
  utilisateur?: {
    id: number;
    first_name: string;
    last_name: string;
    nom_utilisateur?: string;
    genre_id?: number;
  };
}

/**
 * Jour de cours avec liste des professeurs
 */
export interface JourCoursRecurrent {
  id: number;
  type_cours: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  professeurs: string; // GROUP_CONCAT ou liste séparée par virgules
}

/**
 * Utilisateur avec statut de présence pour un cours
 */
export interface UtilisateurAvecPresence {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur?: string;
  genre_id?: number;
  is_present?: boolean | null;
  is_validate?: boolean | null;
  inscription_id?: number;
}

/**
 * Résultat de vérification d'inscription
 */
export interface VerificationInscriptionResult {
  isBooked: boolean;
  message: string;
  cours?: CoursInfo;
}

/**
 * Statistiques de présence pour un cours
 */
export interface StatistiquesPresenceCours {
  cours_id: number;
  total_inscrits: number;
  total_presents: number;
  total_absents: number;
  taux_presence: number;
}

/**
 * Statistiques de présence pour un utilisateur
 */
export interface StatistiquesPresenceUtilisateur {
  utilisateur_id: number;
  total_cours_inscrits: number;
  total_presents: number;
  total_absents: number;
  taux_presence: number;
}

/**
 * Données pour ajouter un cours récurrent avec professeurs
 */
export interface AjoutCoursRecurrent {
  type_cours: string;
  jour_semaine: string; // "lundi", "mardi", etc.
  heure_debut: string; // Format HH:MM
  heure_fin: string; // Format HH:MM
  professeurs?: string[]; // Liste des noms complets "Prenom Nom"
}

/**
 * Données pour modifier un cours récurrent
 */
export interface ModificationCoursRecurrent {
  cours_recurrent_id: number;
  type_cours?: string;
  jour_semaine?: string;
  heure_debut?: string;
  heure_fin?: string;
  professeurs?: string[]; // Liste des noms complets à mettre à jour
}

/**
 * Données pour inscrire un utilisateur
 */
export interface InscriptionUtilisateur {
  cours_id: number;
  utilisateur_id: number;
}

/**
 * Données pour valider/annuler la présence
 */
export interface ValidationPresence {
  cours_id: number;
  utilisateur_id: number;
}

/**
 * Contexte du cours pour filtrage (optionnel)
 */
export interface CoursContext {
  type_cours?: string;
  heure_debut?: string;
  heure_fin?: string;
}

/**
 * Données pour suppression de professeurs
 */
export interface SuppressionProfesseurs {
  professeurs_noms: string[];
  jour: string;
  cours_context?: CoursContext;
}

/**
 * Résultat d'une opération (générique)
 */
export interface CoursOperationResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Utilisateurs participants pour un cours (complet)
 */
export interface UtilisateursParCoursResult {
  cours_id: number;
  utilisateurs: UtilisateurAvecPresence[];
}

/**
 * Cours avec liste complète des utilisateurs
 */
export interface CoursAvecUtilisateurs extends CoursInfo {
  utilisateurs: UtilisateurAvecPresence[];
}
