/**
 * DTOs Reservation pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer une réservation
 */
export interface CreateReservationDto {
  utilisateur_id: number;
  cours_id: number;
}

/**
 * DTO pour annuler une réservation
 */
export interface CancelReservationDto {
  id: number;
  raison_annulation?: string;
}

/**
 * DTO pour la réponse Reservation
 */
export interface ReservationResponseDto {
  id: number;
  date_reservation: string; // ISO 8601

  // Relation avec l'utilisateur
  utilisateur: {
    id: number;
    userId: string;
    first_name: string;
    last_name: string;
    nom_utilisateur: string;
    email: string;
    telephone?: string;
    photo_url?: string;
    grade?: {
      id: number;
      nom: string;
      couleur?: string;
    };
  };

  // Relation avec le cours
  cours: {
    id: number;
    date_cours: string; // ISO 8601
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
    duree_minutes: number;
    jour_semaine_nom: string;
    annule: boolean;
    raison_annulation?: string;

    // Professeurs du cours
    professeurs: {
      id: number;
      nom: string;
      prenom: string;
      nom_complet: string;
      photo_url?: string;
    }[];

    // Disponibilité
    nombre_inscriptions: number;
    nombre_reservations: number;
    places_disponibles?: number;
    capacite_max?: number;
  };

  // Statut de la réservation
  annule: boolean;
  raison_annulation?: string;

  created_at: string; // ISO 8601
  updated_at?: string;
}

/**
 * DTO pour liste de réservations (simplifié)
 */
export interface ReservationListItemDto {
  id: number;
  date_reservation: string; // ISO 8601
  annule: boolean;

  // Utilisateur (simplifié)
  utilisateur_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_nom_complet: string;
  utilisateur_photo_url?: string;

  // Cours (simplifié)
  cours_id: number;
  cours_date: string; // ISO 8601
  cours_type: string;
  cours_heure_debut: string;
  cours_heure_fin: string;
  cours_annule: boolean;
  cours_professeurs_noms: string[];
}

/**
 * DTO pour recherche/filtre de réservations
 */
export interface SearchReservationDto {
  utilisateur_id?: number;
  cours_id?: number;
  date_debut?: string; // Format YYYY-MM-DD
  date_fin?: string; // Format YYYY-MM-DD
  annule?: boolean;
}

/**
 * DTO pour vérifier la disponibilité d'un cours
 */
export interface ReservationAvailabilityDto {
  cours_id: number;
  disponible: boolean;
  places_disponibles: number;
  capacite_max?: number;
  nombre_reservations_actuelles: number;
  nombre_inscriptions_actuelles: number;
  cours_annule: boolean;
  message?: string; // Message explicatif si non disponible
}

/**
 * DTO pour vérifier si un utilisateur peut réserver
 */
export interface CheckUserReservationDto {
  utilisateur_id: number;
  cours_id: number;
}

/**
 * DTO pour la réponse de vérification de réservation
 */
export interface CheckUserReservationResponseDto {
  peut_reserver: boolean;
  raison?: string; // Raison si l'utilisateur ne peut pas réserver
  reservation_existante?: {
    id: number;
    date_reservation: string;
    annule: boolean;
  };
}

/**
 * DTO pour statistiques de réservations
 */
export interface ReservationStatsDto {
  total_reservations: number;
  reservations_actives: number;
  reservations_annulees: number;
  taux_annulation: number; // Pourcentage
  utilisateurs_uniques: number;
  cours_uniques: number;
  moyenne_reservations_par_cours: number;
  moyenne_reservations_par_utilisateur: number;
}

/**
 * DTO pour les réservations d'un utilisateur
 */
export interface UserReservationsDto {
  utilisateur_id: number;
  utilisateur_nom_complet: string;
  reservations_actives: ReservationListItemDto[];
  reservations_passees: ReservationListItemDto[];
  reservations_annulees: ReservationListItemDto[];
  total_reservations: number;
}

/**
 * DTO pour les réservations d'un cours
 */
export interface CourseReservationsDto {
  cours_id: number;
  cours_date: string;
  cours_type: string;
  cours_heure_debut: string;
  cours_heure_fin: string;
  reservations: ReservationListItemDto[];
  nombre_reservations: number;
  places_disponibles?: number;
  capacite_max?: number;
}

/**
 * DTO pour annuler plusieurs réservations (bulk)
 */
export interface BulkCancelReservationsDto {
  reservation_ids: number[];
  raison_annulation?: string;
}

/**
 * DTO pour la réponse d'annulation en masse
 */
export interface BulkCancelReservationsResponseDto {
  success_count: number;
  failed_count: number;
  results: {
    reservation_id: number;
    success: boolean;
    error?: string;
  }[];
}
