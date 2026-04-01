/**
 * Domain Types - Reservation
 * Basé sur la table `reservations` de la DB
 */

/**
 * Interface principale Reservation
 * Correspond à la structure de la table `reservations`
 */
export interface Reservation {
  // Identifiants
  id: number;

  // Relations (Foreign Keys)
  utilisateur_id: number;
  cours_id: number;

  // Informations
  date_reservation: Date;

  // Statut
  annule: boolean;

  // Note: Pas de timestamps created_at/updated_at dans la table
}

/**
 * Reservation avec relations chargées
 */
export interface ReservationWithRelations extends Reservation {
  // Utilisateur qui a réservé
  utilisateur: {
    id: number;
    userId: string;
    first_name: string;
    last_name: string;
    email: string;
    telephone?: string;
    photo_url?: string;
  };

  // Cours réservé
  cours: {
    id: number;
    date_cours: Date;
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
    annule: boolean;
    nombre_places_restantes?: number;
  };
}

/**
 * Reservation pour l'affichage public
 */
export interface ReservationPublic {
  id: number;
  cours_id: number;
  date_reservation: Date;
  annule: boolean;
}

/**
 * Reservation avec noms lisibles
 */
export interface ReservationWithNames extends Reservation {
  utilisateur_nom_complet: string; // Ex: "John Doe"
  cours_type: string;
  cours_date: Date;
  cours_heure: string; // Ex: "18:00 - 19:30"
}

/**
 * Reservation minimal (pour références)
 */
export interface ReservationBasic {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  annule: boolean;
}

/**
 * Reservation pour liste/tableau
 */
export interface ReservationListItem {
  id: number;
  utilisateur_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  cours_id: number;
  cours_type: string;
  cours_date: Date;
  cours_heure_debut: string;
  cours_heure_fin: string;
  date_reservation: Date;
  annule: boolean;
  cours_annule: boolean;
}

/**
 * Reservation pour planning utilisateur
 */
export interface ReservationUserPlanning {
  id: number;
  cours_id: number;
  cours_type: string;
  cours_date: Date;
  heure_debut: string;
  heure_fin: string;
  date_reservation: Date;
  annule: boolean;
  peut_annuler: boolean; // Si la date limite d'annulation n'est pas dépassée
}

/**
 * Statistiques de réservation
 */
export interface ReservationStats {
  total_reservations: number;
  reservations_actives: number;
  reservations_annulees: number;
  taux_annulation: number; // Pourcentage (0-100)
}

/**
 * Reservation avec information de disponibilité
 */
export interface ReservationWithAvailability extends Reservation {
  cours_complet: boolean;
  position_liste_attente?: number; // Si liste d'attente activée
}
