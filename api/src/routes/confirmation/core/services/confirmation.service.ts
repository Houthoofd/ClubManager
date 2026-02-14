/**
 * Service Confirmation - Logique métier
 * Gère les opérations de confirmation d'inscriptions et réservations
 *
 * @module confirmation.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";

/**
 * Interface pour les données d'inscription
 */
export interface InscriptionData {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  date_inscription: Date;
  status_id: boolean | null;
  utilisateurs?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  cours?: {
    date_cours: Date;
    type_cours: string;
  };
}

/**
 * Interface pour les données de réservation
 */
export interface ReservationData {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  utilisateurs?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  cours?: {
    date_cours: Date;
    type_cours: string;
  };
}

/**
 * Récupère une inscription par son ID
 */
export async function obtenirInscriptionParId(
  inscriptionId: number,
): Promise<InscriptionData | null> {
  try {
    if (!inscriptionId || isNaN(inscriptionId) || inscriptionId <= 0) {
      throw new Error("ID inscription invalide");
    }

    addSentryBreadcrumb(
      `Récupération inscription ${inscriptionId}`,
      "service.confirmation",
      "info",
      { inscriptionId },
    );

    console.log(
      `📋 [ConfirmationService] Récupération inscription ${inscriptionId}`,
    );

    const inscription = await prisma.inscriptions.findUnique({
      where: { id: inscriptionId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        cours: {
          select: {
            date_cours: true,
            type_cours: true,
          },
        },
      },
    });

    if (!inscription) {
      console.log(
        `❌ [ConfirmationService] Inscription ${inscriptionId} non trouvée`,
      );
      return null;
    }

    console.log(
      `✅ [ConfirmationService] Inscription ${inscriptionId} trouvée`,
    );

    return inscription as InscriptionData;
  } catch (error: any) {
    console.error(
      `❌ [ConfirmationService] Erreur récupération inscription ${inscriptionId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "obtenirInscriptionParId",
      },
      extra: { inscriptionId },
    });

    throw new Error(
      `Erreur lors de la récupération de l'inscription: ${error.message}`,
    );
  }
}

/**
 * Récupère une réservation par son ID
 */
export async function obtenirReservationParId(
  reservationId: number,
): Promise<ReservationData | null> {
  try {
    if (!reservationId || isNaN(reservationId) || reservationId <= 0) {
      throw new Error("ID réservation invalide");
    }

    addSentryBreadcrumb(
      `Récupération réservation ${reservationId}`,
      "service.confirmation",
      "info",
      { reservationId },
    );

    console.log(
      `📋 [ConfirmationService] Récupération réservation ${reservationId}`,
    );

    const reservation = await prisma.reservations.findUnique({
      where: { id: reservationId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        cours: {
          select: {
            date_cours: true,
            type_cours: true,
          },
        },
      },
    });

    if (!reservation) {
      console.log(
        `❌ [ConfirmationService] Réservation ${reservationId} non trouvée`,
      );
      return null;
    }

    console.log(
      `✅ [ConfirmationService] Réservation ${reservationId} trouvée`,
    );

    return reservation as ReservationData;
  } catch (error: any) {
    console.error(
      `❌ [ConfirmationService] Erreur récupération réservation ${reservationId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "obtenirReservationParId",
      },
      extra: { reservationId },
    });

    throw new Error(
      `Erreur lors de la récupération de la réservation: ${error.message}`,
    );
  }
}

/**
 * Créer une inscription
 */
export async function creerInscription(
  utilisateurId: number,
  coursId: number,
): Promise<InscriptionData> {
  try {
    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    if (!coursId || isNaN(coursId) || coursId <= 0) {
      throw new Error("ID cours invalide");
    }

    addSentryBreadcrumb(
      `Création inscription utilisateur ${utilisateurId} pour cours ${coursId}`,
      "service.confirmation",
      "info",
      { utilisateurId, coursId },
    );

    console.log(
      `➕ [ConfirmationService] Création inscription utilisateur ${utilisateurId} pour cours ${coursId}`,
    );

    const inscription = await prisma.inscriptions.create({
      data: {
        utilisateur_id: utilisateurId,
        cours_id: coursId,
        status_id: true,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        cours: {
          select: {
            date_cours: true,
            type_cours: true,
          },
        },
      },
    });

    console.log(
      `✅ [ConfirmationService] Inscription créée: ${inscription.id}`,
    );

    return inscription as InscriptionData;
  } catch (error: any) {
    console.error(
      "❌ [ConfirmationService] Erreur création inscription:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "creerInscription",
      },
      extra: { utilisateurId, coursId },
    });

    throw new Error(
      `Erreur lors de la création de l'inscription: ${error.message}`,
    );
  }
}

/**
 * Créer une réservation
 */
export async function creerReservation(
  utilisateurId: number,
  coursId: number,
): Promise<ReservationData> {
  try {
    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    if (!coursId || isNaN(coursId) || coursId <= 0) {
      throw new Error("ID cours invalide");
    }

    addSentryBreadcrumb(
      `Création réservation utilisateur ${utilisateurId} pour cours ${coursId}`,
      "service.confirmation",
      "info",
      { utilisateurId, coursId },
    );

    console.log(
      `➕ [ConfirmationService] Création réservation utilisateur ${utilisateurId} pour cours ${coursId}`,
    );

    const reservation = await prisma.reservations.create({
      data: {
        utilisateur_id: utilisateurId,
        cours_id: coursId,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        cours: {
          select: {
            date_cours: true,
            type_cours: true,
          },
        },
      },
    });

    console.log(
      `✅ [ConfirmationService] Réservation créée: ${reservation.id}`,
    );

    return reservation as ReservationData;
  } catch (error: any) {
    console.error(
      "❌ [ConfirmationService] Erreur création réservation:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "creerReservation",
      },
      extra: { utilisateurId, coursId },
    });

    throw new Error(
      `Erreur lors de la création de la réservation: ${error.message}`,
    );
  }
}

/**
 * Supprimer une inscription
 */
export async function supprimerInscription(
  inscriptionId: number,
): Promise<boolean> {
  try {
    if (!inscriptionId || isNaN(inscriptionId) || inscriptionId <= 0) {
      throw new Error("ID inscription invalide");
    }

    addSentryBreadcrumb(
      `Suppression inscription ${inscriptionId}`,
      "service.confirmation",
      "warning",
      { inscriptionId },
    );

    console.log(
      `🗑️ [ConfirmationService] Suppression inscription ${inscriptionId}`,
    );

    await prisma.inscriptions.delete({
      where: { id: inscriptionId },
    });

    console.log(
      `✅ [ConfirmationService] Inscription ${inscriptionId} supprimée`,
    );

    return true;
  } catch (error: any) {
    console.error(
      `❌ [ConfirmationService] Erreur suppression inscription ${inscriptionId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "supprimerInscription",
      },
      extra: { inscriptionId },
    });

    if (error.code === "P2025") {
      return false;
    }

    throw new Error(
      `Erreur lors de la suppression de l'inscription: ${error.message}`,
    );
  }
}

/**
 * Supprimer une réservation
 */
export async function supprimerReservation(
  reservationId: number,
): Promise<boolean> {
  try {
    if (!reservationId || isNaN(reservationId) || reservationId <= 0) {
      throw new Error("ID réservation invalide");
    }

    addSentryBreadcrumb(
      `Suppression réservation ${reservationId}`,
      "service.confirmation",
      "warning",
      { reservationId },
    );

    console.log(
      `🗑️ [ConfirmationService] Suppression réservation ${reservationId}`,
    );

    await prisma.reservations.delete({
      where: { id: reservationId },
    });

    console.log(
      `✅ [ConfirmationService] Réservation ${reservationId} supprimée`,
    );

    return true;
  } catch (error: any) {
    console.error(
      `❌ [ConfirmationService] Erreur suppression réservation ${reservationId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "supprimerReservation",
      },
      extra: { reservationId },
    });

    if (error.code === "P2025") {
      return false;
    }

    throw new Error(
      `Erreur lors de la suppression de la réservation: ${error.message}`,
    );
  }
}

/**
 * Récupère toutes les inscriptions d'un utilisateur
 */
export async function obtenirInscriptionsUtilisateur(
  utilisateurId: number,
): Promise<InscriptionData[]> {
  try {
    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Récupération inscriptions utilisateur ${utilisateurId}`,
      "service.confirmation",
      "info",
      { utilisateurId },
    );

    console.log(
      `📋 [ConfirmationService] Récupération inscriptions utilisateur ${utilisateurId}`,
    );

    const inscriptions = await prisma.inscriptions.findMany({
      where: {
        utilisateur_id: utilisateurId,
      },
      include: {
        cours: {
          select: {
            date_cours: true,
            type_cours: true,
          },
        },
      },
      orderBy: {
        date_inscription: "desc",
      },
    });

    console.log(
      `✅ [ConfirmationService] ${inscriptions.length} inscriptions trouvées`,
    );

    return inscriptions as InscriptionData[];
  } catch (error: any) {
    console.error(
      `❌ [ConfirmationService] Erreur récupération inscriptions utilisateur:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "obtenirInscriptionsUtilisateur",
      },
      extra: { utilisateurId },
    });

    throw new Error(
      `Erreur lors de la récupération des inscriptions: ${error.message}`,
    );
  }
}

/**
 * Récupère toutes les réservations d'un utilisateur
 */
export async function obtenirReservationsUtilisateur(
  utilisateurId: number,
): Promise<ReservationData[]> {
  try {
    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Récupération réservations utilisateur ${utilisateurId}`,
      "service.confirmation",
      "info",
      { utilisateurId },
    );

    console.log(
      `📋 [ConfirmationService] Récupération réservations utilisateur ${utilisateurId}`,
    );

    const reservations = await prisma.reservations.findMany({
      where: {
        utilisateur_id: utilisateurId,
      },
      include: {
        cours: {
          select: {
            date_cours: true,
            type_cours: true,
          },
        },
      },
    });

    console.log(
      `✅ [ConfirmationService] ${reservations.length} réservations trouvées`,
    );

    return reservations as ReservationData[];
  } catch (error: any) {
    console.error(
      `❌ [ConfirmationService] Erreur récupération réservations utilisateur:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "obtenirReservationsUtilisateur",
      },
      extra: { utilisateurId },
    });

    throw new Error(
      `Erreur lors de la récupération des réservations: ${error.message}`,
    );
  }
}

/**
 * Activer/désactiver le statut d'une inscription
 */
export async function modifierStatutInscription(
  inscriptionId: number,
  statusId: boolean,
): Promise<InscriptionData | null> {
  try {
    if (!inscriptionId || isNaN(inscriptionId) || inscriptionId <= 0) {
      throw new Error("ID inscription invalide");
    }

    addSentryBreadcrumb(
      `Modification statut inscription ${inscriptionId}`,
      "service.confirmation",
      "info",
      { inscriptionId, statusId },
    );

    console.log(
      `🔄 [ConfirmationService] Modification statut inscription ${inscriptionId}`,
    );

    const inscription = await prisma.inscriptions.update({
      where: { id: inscriptionId },
      data: {
        status_id: statusId,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        cours: {
          select: {
            date_cours: true,
            type_cours: true,
          },
        },
      },
    });

    console.log(
      `✅ [ConfirmationService] Statut inscription ${inscriptionId} modifié`,
    );

    return inscription as InscriptionData;
  } catch (error: any) {
    console.error(
      `❌ [ConfirmationService] Erreur modification statut inscription ${inscriptionId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "confirmation",
        operation: "modifierStatutInscription",
      },
      extra: { inscriptionId, statusId },
    });

    if (error.code === "P2025") {
      return null;
    }

    throw new Error(
      `Erreur lors de la modification du statut de l'inscription: ${error.message}`,
    );
  }
}

/**
 * Classe ConfirmationService
 */
export class ConfirmationService {
  async obtenirInscriptionParId(inscriptionId: number) {
    return obtenirInscriptionParId(inscriptionId);
  }

  async obtenirReservationParId(reservationId: number) {
    return obtenirReservationParId(reservationId);
  }

  async creerInscription(utilisateurId: number, coursId: number) {
    return creerInscription(utilisateurId, coursId);
  }

  async creerReservation(utilisateurId: number, coursId: number) {
    return creerReservation(utilisateurId, coursId);
  }

  async supprimerInscription(inscriptionId: number) {
    return supprimerInscription(inscriptionId);
  }

  async supprimerReservation(reservationId: number) {
    return supprimerReservation(reservationId);
  }

  async obtenirInscriptionsUtilisateur(utilisateurId: number) {
    return obtenirInscriptionsUtilisateur(utilisateurId);
  }

  async obtenirReservationsUtilisateur(utilisateurId: number) {
    return obtenirReservationsUtilisateur(utilisateurId);
  }

  async modifierStatutInscription(inscriptionId: number, statusId: boolean) {
    return modifierStatutInscription(inscriptionId, statusId);
  }
}

// Instance singleton
export const confirmationService = new ConfirmationService();
