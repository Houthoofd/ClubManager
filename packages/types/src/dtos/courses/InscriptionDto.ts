/**
 * DTOs Inscription pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer une inscription
 */
export interface CreateInscriptionDto {
  utilisateur_id: number;
  cours_id: number;
  status_id?: number | null; // NULL=absent, 1=présent
  commentaire?: string;
}

/**
 * DTO pour mettre à jour une inscription
 */
export interface UpdateInscriptionDto {
  id: number;
  status_id?: number | null; // NULL=absent, 1=présent
  commentaire?: string;
}

/**
 * DTO pour la réponse Inscription complète
 */
export interface InscriptionResponseDto {
  id: number;
  date_inscription: string; // ISO 8601

  // Utilisateur inscrit
  utilisateur: {
    id: number;
    userId: string;
    nom: string;
    prenom: string;
    nom_complet: string;
    email?: string;
    telephone?: string;
    photo_url?: string;
    grade?: {
      id: number;
      nom: string;
      couleur?: string;
    };
  };

  // Cours
  cours: {
    id: number;
    date_cours: string; // ISO 8601
    type_cours: string;
    heure_debut: string; // HH:MM:SS
    heure_fin: string; // HH:MM:SS
    annule: boolean;
    professeurs?: {
      id: number;
      nom: string;
      prenom: string;
      nom_complet: string;
    }[];
  };

  // Statut de présence
  status?: {
    id: number;
    nom: string; // "présent", "absent", etc.
  } | null;

  commentaire?: string;
}

/**
 * DTO pour liste d'inscriptions (feuille de présence)
 */
export interface InscriptionListItemDto {
  id: number;
  utilisateur_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_nom_complet: string;
  grade_nom?: string;
  grade_couleur?: string;
  status_id?: number | null; // NULL=absent, 1=présent
  status_nom?: string;
  date_inscription: string;
  commentaire?: string;
}

/**
 * DTO pour créer plusieurs inscriptions en une fois
 */
export interface BulkCreateInscriptionDto {
  cours_id: number;
  utilisateur_ids: number[];
  status_id?: number | null;
  commentaire?: string;
}

/**
 * DTO pour réponse de création en masse
 */
export interface BulkCreateInscriptionResponseDto {
  success: boolean;
  inscriptions_created: number;
  inscriptions: InscriptionResponseDto[];
  errors?: {
    utilisateur_id: number;
    error: string;
  }[];
}

/**
 * DTO pour mettre à jour la présence
 */
export interface UpdatePresenceDto {
  inscription_id: number;
  status_id: number | null; // 1=présent, NULL=absent
}

/**
 * DTO pour mettre à jour plusieurs présences
 */
export interface BulkUpdatePresenceDto {
  updates: {
    inscription_id: number;
    status_id: number | null;
  }[];
}

/**
 * DTO pour recherche/filtre d'inscriptions
 */
export interface SearchInscriptionDto {
  utilisateur_id?: number;
  cours_id?: number;
  date_debut?: string; // Format: YYYY-MM-DD
  date_fin?: string; // Format: YYYY-MM-DD
  status_id?: number | null;
  type_cours?: string;
  limit?: number;
  offset?: number;
}

/**
 * DTO pour feuille de présence (affichage/impression)
 */
export interface AttendanceSheetDto {
  cours: {
    id: number;
    date_cours: string;
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
    jour_semaine_nom: string; // Ex: "Lundi"
  };

  professeurs: {
    id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
  }[];

  inscriptions: {
    id: number;
    utilisateur_id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
    grade?: {
      nom: string;
      couleur?: string;
    };
    status_id?: number | null;
    status_nom?: string; // "présent", "absent"
    commentaire?: string;
  }[];

  statistiques: {
    total_inscrits: number;
    nombre_presents: number;
    nombre_absents: number;
    taux_presence: number; // Pourcentage
  };

  generated_at: string; // ISO 8601
}

/**
 * DTO pour statistiques de présence d'un utilisateur
 */
export interface UserAttendanceStatsDto {
  utilisateur_id: number;
  utilisateur_nom_complet: string;
  periode: {
    date_debut: string;
    date_fin: string;
  };
  total_cours: number;
  nombre_presents: number;
  nombre_absents: number;
  taux_presence: number; // Pourcentage
  derniere_presence?: string; // ISO 8601
}

/**
 * DTO pour statistiques de présence d'un cours
 */
export interface CourseAttendanceStatsDto {
  cours_id: number;
  type_cours: string;
  date_cours: string;
  total_inscrits: number;
  nombre_presents: number;
  nombre_absents: number;
  taux_presence: number; // Pourcentage
}

/**
 * DTO pour historique des inscriptions d'un utilisateur
 */
export interface UserInscriptionHistoryDto {
  utilisateur_id: number;
  utilisateur_nom_complet: string;
  inscriptions: {
    id: number;
    cours_id: number;
    type_cours: string;
    date_cours: string;
    heure_debut: string;
    heure_fin: string;
    date_inscription: string;
    status_id?: number | null;
    status_nom?: string;
    commentaire?: string;
  }[];
  total: number;
}

/**
 * DTO pour annuler une inscription
 */
export interface CancelInscriptionDto {
  id: number;
  raison?: string; // Raison de l'annulation
}
