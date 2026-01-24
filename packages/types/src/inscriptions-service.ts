/**
 * Types pour le service Inscriptions
 */

/**
 * Inscription à un cours
 */
export interface Inscription {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  date_inscription: Date;
  status_id: boolean | null;
  // Relations optionnelles
  utilisateur?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  cours?: {
    id: number;
    date_cours: Date;
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
  };
}

/**
 * Input pour créer une inscription
 */
export interface InscriptionInput {
  utilisateur_id: number;
  cours_id: number;
  status_id?: boolean | null;
}

/**
 * Input pour mettre à jour une inscription
 */
export interface InscriptionUpdateInput {
  status_id?: boolean | null;
}

/**
 * Résultat d'une opération sur une inscription
 */
export interface InscriptionResult {
  success: boolean;
  message: string;
  data?: Inscription;
}

/**
 * Statistiques des inscriptions
 */
export interface InscriptionStats {
  totalInscriptions: number;
  inscriptionsActives: number;
  inscriptionsEnAttente: number;
  tauxPresence: number;
  inscriptionsParCours: Array<{
    cours_id: number;
    type_cours: string;
    count: number;
  }>;
  inscriptionsParUtilisateur: Array<{
    utilisateur_id: number;
    nom_complet: string;
    count: number;
  }>;
}

/**
 * Validation de disponibilité pour une inscription
 */
export interface InscriptionValidation {
  disponible: boolean;
  raison?: string;
  conflits?: Array<{
    cours_id: number;
    date_cours: Date;
    type_cours: string;
  }>;
}

/**
 * Filtre pour rechercher des inscriptions
 */
export interface InscriptionFiltre {
  utilisateur_id?: number;
  cours_id?: number;
  status_id?: boolean | null;
  date_debut?: Date;
  date_fin?: Date;
}
