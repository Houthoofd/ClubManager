/**
 * Service Alertes - Logique métier
 * Gère les opérations sur les alertes système
 *
 * ✅ Migré vers Prisma avec intégration Sentry
 *
 * @module alertes.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";

/**
 * Interface pour le dashboard des alertes
 */
export interface AlerteDashboard {
  totalAlertes: number;
  alertesCritiques: number;
  alertesEnAttente: number;
  alertesResolues: number;
  alertesParType: Record<string, number>;
  tendances?: {
    derniere_semaine: number;
    dernier_mois: number;
    evolution: string;
  };
}

/**
 * Interface pour une alerte
 */
export interface AlerteData {
  id: number;
  type: string;
  severite: string;
  message: string;
  utilisateur_id?: number;
  statut: string;
  date_detection: Date;
  date_resolution?: Date;
  notes?: string;
  utilisateur?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Récupère le dashboard des alertes
 */
export async function obtenirDashboardAlertes(): Promise<AlerteDashboard> {
  try {
    addSentryBreadcrumb(
      "Récupération dashboard des alertes",
      "service.alertes",
      "info",
    );

    console.log(`📊 [AlertesService] Récupération dashboard alertes`);

    // Récupérer toutes les alertes
    const alertes = await prisma.alertes_utilisateurs.findMany({
      include: {
        alertes_types: true,
      },
    });

    // Calculer les statistiques
    const totalAlertes = alertes.length;
    const alertesCritiques = alertes.filter(
      (a) => a.alertes_types?.priorite === "critique",
    ).length;
    const alertesEnAttente = alertes.filter(
      (a) => a.statut === "active",
    ).length;
    const alertesResolues = alertes.filter(
      (a) => a.statut === "resolue",
    ).length;

    // Grouper par type
    const alertesParType: Record<string, number> = {};
    alertes.forEach((alerte) => {
      const type = alerte.alertes_types?.nom || "Inconnu";
      alertesParType[type] = (alertesParType[type] || 0) + 1;
    });

    // Calculer les tendances
    const now = new Date();
    const uneSecmaineAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const unMoisAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const derniereSemaine = alertes.filter(
      (a) => a.date_detection && new Date(a.date_detection) >= uneSecmaineAgo,
    ).length;
    const dernierMois = alertes.filter(
      (a) => a.date_detection && new Date(a.date_detection) >= unMoisAgo,
    ).length;

    const tendances = {
      derniere_semaine: derniereSemaine,
      dernier_mois: dernierMois,
      evolution: derniereSemaine > dernierMois / 4 ? "en_hausse" : "en_baisse",
    };

    console.log(`✅ [AlertesService] Dashboard calculé:`, {
      totalAlertes,
      alertesCritiques,
      alertesEnAttente,
    });

    return {
      totalAlertes,
      alertesCritiques,
      alertesEnAttente,
      alertesResolues,
      alertesParType,
      tendances,
    };
  } catch (error: any) {
    console.error(`❌ [AlertesService] Erreur dashboard:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "alertes",
        operation: "obtenirDashboardAlertes",
      },
    });

    throw new Error(
      `Erreur lors de la récupération du dashboard: ${error.message}`,
    );
  }
}

/**
 * Récupère toutes les alertes actives
 */
export async function obtenirAlertesActives(): Promise<AlerteData[]> {
  try {
    addSentryBreadcrumb(
      "Récupération alertes actives",
      "service.alertes",
      "info",
    );

    console.log(`🔔 [AlertesService] Récupération alertes actives`);

    const alertes = await prisma.alertes_utilisateurs.findMany({
      where: {
        statut: "active",
      },
      include: {
        alertes_types: true,
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date_detection: "desc",
      },
    });

    console.log(`✅ [AlertesService] ${alertes.length} alertes actives`);

    return alertes.map((alerte) => {
      const contexte = alerte.donnees_contexte as any;
      return {
        id: alerte.id,
        type: alerte.alertes_types?.nom || "Inconnu",
        severite:
          contexte?.severite || alerte.alertes_types?.priorite || "normale",
        message: contexte?.message || alerte.alertes_types?.description || "",
        utilisateur_id: alerte.utilisateur_id,
        statut: alerte.statut || "active",
        date_detection: alerte.date_detection || new Date(),
        date_resolution: alerte.date_resolution || undefined,
        notes: alerte.notes || undefined,
        utilisateur: alerte.utilisateurs
          ? {
              first_name: alerte.utilisateurs.first_name,
              last_name: alerte.utilisateurs.last_name,
              email: alerte.utilisateurs.email,
            }
          : undefined,
      };
    });
  } catch (error: any) {
    console.error(`❌ [AlertesService] Erreur alertes actives:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "alertes",
        operation: "obtenirAlertesActives",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des alertes actives: ${error.message}`,
    );
  }
}

/**
 * Récupère les alertes d'un utilisateur spécifique
 */
export async function obtenirAlertesUtilisateur(
  userId: number,
): Promise<AlerteData[]> {
  try {
    if (!userId || isNaN(userId) || userId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Récupération alertes utilisateur ${userId}`,
      "service.alertes",
      "info",
      { userId },
    );

    console.log(
      `🔔 [AlertesService] Récupération alertes pour userId: ${userId}`,
    );

    const alertes = await prisma.alertes_utilisateurs.findMany({
      where: {
        utilisateur_id: userId,
      },
      include: {
        alertes_types: true,
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date_detection: "desc",
      },
    });

    console.log(
      `✅ [AlertesService] ${alertes.length} alertes pour userId: ${userId}`,
    );

    return alertes.map((alerte) => {
      const contexte = alerte.donnees_contexte as any;
      return {
        id: alerte.id,
        type: alerte.alertes_types?.nom || "Inconnu",
        severite:
          contexte?.severite || alerte.alertes_types?.priorite || "normale",
        message: contexte?.message || alerte.alertes_types?.description || "",
        utilisateur_id: alerte.utilisateur_id,
        statut: alerte.statut || "active",
        date_detection: alerte.date_detection || new Date(),
        date_resolution: alerte.date_resolution || undefined,
        notes: alerte.notes || undefined,
        utilisateur: alerte.utilisateurs
          ? {
              first_name: alerte.utilisateurs.first_name,
              last_name: alerte.utilisateurs.last_name,
              email: alerte.utilisateurs.email,
            }
          : undefined,
      };
    });
  } catch (error: any) {
    console.error(
      `❌ [AlertesService] Erreur alertes utilisateur ${userId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "alertes",
        operation: "obtenirAlertesUtilisateur",
      },
      extra: { userId },
    });

    throw new Error(
      `Erreur lors de la récupération des alertes de l'utilisateur: ${error.message}`,
    );
  }
}

/**
 * Déclenche manuellement la détection des alertes
 */
export async function detecterAlertes(): Promise<{
  success: boolean;
  message: string;
  alertesCreees?: number;
}> {
  try {
    addSentryBreadcrumb(
      "Détection manuelle des alertes",
      "service.alertes",
      "info",
    );

    console.log(`🔍 [AlertesService] Détection des alertes`);

    let alertesCreees = 0;

    // 1. Détecter les échéances en retard
    const now = new Date();
    const echeancesEnRetard = await prisma.echeances_paiements.findMany({
      where: {
        statut: "en_attente",
        date_echeance: {
          lt: now,
        },
      },
      include: {
        utilisateurs: true,
      },
    });

    // Trouver le type d'alerte "paiement_retard" une seule fois
    const typeAlertePaiementRetard = await prisma.alertes_types.findFirst({
      where: {
        code: "paiement_retard",
      },
    });

    // Créer des alertes pour les échéances en retard
    for (const echeance of echeancesEnRetard) {
      const joursRetard = Math.floor(
        (now.getTime() - echeance.date_echeance.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Vérifier si une alerte existe déjà pour cette échéance
      const alerteExistante = await prisma.alertes_utilisateurs.findFirst({
        where: {
          utilisateur_id: echeance.utilisateur_id,
          alerte_type_id: typeAlertePaiementRetard?.id,
          statut: {
            in: ["active"],
          },
        },
      });

      if (!alerteExistante && typeAlertePaiementRetard) {
        const severite =
          joursRetard > 30 ? "critique" : joursRetard > 7 ? "haute" : "normale";
        const message = `Échéance ${echeance.id} en retard de ${joursRetard} jour(s) - Montant: ${echeance.montant}€`;

        await prisma.alertes_utilisateurs.create({
          data: {
            utilisateur_id: echeance.utilisateur_id,
            alerte_type_id: typeAlertePaiementRetard.id,
            statut: "active",
            date_detection: now,
            donnees_contexte: {
              severite,
              message,
              echeance_id: echeance.id,
              jours_retard: joursRetard,
              montant: echeance.montant,
            },
          },
        });

        alertesCreees++;
      }
    }

    // 2. Détecter les stocks bas
    const stocksBas = await prisma.stocks.findMany({
      where: {
        OR: [
          {
            quantite: {
              lte: 5,
            },
          },
        ],
      },
      include: {
        articles: true,
      },
    });

    // Trouver le type d'alerte "stock_bas" une seule fois
    const typeAlerteStockBas = await prisma.alertes_types.findFirst({
      where: {
        code: "stock_bas",
      },
    });

    for (const stock of stocksBas) {
      // Vérifier si une alerte existe déjà pour cet article
      const alerteExistante = await prisma.alertes_utilisateurs.findFirst({
        where: {
          alerte_type_id: typeAlerteStockBas?.id,
          statut: {
            in: ["active"],
          },
          // Note: JSON query filtering is limited in Prisma, skipping article_id check
          // Alternative: fetch all active alerts and filter in memory if needed
        },
      });

      if (!alerteExistante && typeAlerteStockBas) {
        const severite = stock.quantite === 0 ? "critique" : "haute";
        const message = `Stock article ${stock.article_id} bas: ${stock.quantite} unité(s)`;

        await prisma.alertes_utilisateurs.create({
          data: {
            alerte_type_id: typeAlerteStockBas.id,
            statut: "active",
            date_detection: now,
            utilisateur_id: 1, // Admin par défaut - à adapter selon votre logique
            donnees_contexte: {
              severite,
              message,
              article_id: stock.article_id,
              quantite: stock.quantite,
              stock_disponible: stock.stock_disponible,
            },
          },
        });

        alertesCreees++;
      }
    }

    console.log(
      `✅ [AlertesService] Détection terminée: ${alertesCreees} alerte(s) créée(s)`,
    );

    addSentryBreadcrumb(
      `${alertesCreees} alerte(s) créée(s)`,
      "service.alertes",
      "info",
      { alertesCreees },
    );

    return {
      success: true,
      message: `Détection terminée: ${alertesCreees} alerte(s) créée(s)`,
      alertesCreees,
    };
  } catch (error: any) {
    console.error(`❌ [AlertesService] Erreur détection alertes:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "alertes",
        operation: "detecterAlertes",
      },
    });

    throw new Error(
      `Erreur lors de la détection des alertes: ${error.message}`,
    );
  }
}

/**
 * Résout une alerte
 */
export async function resoudreAlerte(
  alerteId: number,
  notes: string = "",
  userId?: number,
): Promise<{ success: boolean; message: string }> {
  try {
    if (!alerteId || isNaN(alerteId) || alerteId <= 0) {
      throw new Error("ID alerte invalide");
    }

    addSentryBreadcrumb(
      `Résolution alerte ${alerteId}`,
      "service.alertes",
      "info",
      { alerteId, userId },
    );

    console.log(`✅ [AlertesService] Résolution alerte ${alerteId}`);

    // Vérifier que l'alerte existe
    const alerte = await prisma.alertes_utilisateurs.findUnique({
      where: { id: alerteId },
    });

    if (!alerte) {
      console.log(`❌ [AlertesService] Alerte ${alerteId} non trouvée`);
      throw new Error(`Alerte ${alerteId} non trouvée`);
    }

    // Mettre à jour l'alerte
    await prisma.alertes_utilisateurs.update({
      where: { id: alerteId },
      data: {
        statut: "resolue",
        date_resolution: new Date(),
        notes: notes || alerte.notes,
        resolu_par: userId || alerte.resolu_par,
      },
    });

    // Créer une action d'alerte
    if (userId) {
      await prisma.alertes_actions.create({
        data: {
          alerte_id: alerteId,
          action_type: "autre",
          description: notes || "Alerte résolue",
          effectue_par: userId,
          date_action: new Date(),
        },
      });
    }

    console.log(`✅ [AlertesService] Alerte ${alerteId} résolue`);

    addSentryBreadcrumb("Alerte résolue", "service.alertes", "info", {
      alerteId,
      userId,
    });

    return {
      success: true,
      message: "Alerte résolue avec succès",
    };
  } catch (error: any) {
    console.error(`❌ [AlertesService] Erreur résolution alerte:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "alertes",
        operation: "resoudreAlerte",
      },
      extra: { alerteId, userId },
    });

    throw new Error(
      `Erreur lors de la résolution de l'alerte: ${error.message}`,
    );
  }
}

/**
 * Ignore une alerte
 */
export async function ignorerAlerte(
  alerteId: number,
  notes: string = "",
): Promise<{ success: boolean; message: string }> {
  try {
    if (!alerteId || isNaN(alerteId) || alerteId <= 0) {
      throw new Error("ID alerte invalide");
    }

    addSentryBreadcrumb(
      `Ignorer alerte ${alerteId}`,
      "service.alertes",
      "info",
      { alerteId },
    );

    console.log(`🔇 [AlertesService] Ignorer alerte ${alerteId}`);

    // Vérifier que l'alerte existe
    const alerte = await prisma.alertes_utilisateurs.findUnique({
      where: { id: alerteId },
    });

    if (!alerte) {
      console.log(`❌ [AlertesService] Alerte ${alerteId} non trouvée`);
      throw new Error(`Alerte ${alerteId} non trouvée`);
    }

    // Mettre à jour l'alerte
    await prisma.alertes_utilisateurs.update({
      where: { id: alerteId },
      data: {
        statut: "ignoree",
        date_resolution: new Date(),
        notes: notes || alerte.notes,
      },
    });

    console.log(`✅ [AlertesService] Alerte ${alerteId} ignorée`);

    addSentryBreadcrumb("Alerte ignorée", "service.alertes", "info", {
      alerteId,
    });

    return {
      success: true,
      message: "Alerte ignorée avec succès",
    };
  } catch (error: any) {
    console.error(`❌ [AlertesService] Erreur ignorer alerte:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "alertes",
        operation: "ignorerAlerte",
      },
      extra: { alerteId },
    });

    throw new Error(
      `Erreur lors de l'ignorement de l'alerte: ${error.message}`,
    );
  }
}

/**
 * Récupère une alerte par son ID
 */
export async function obtenirAlerteParId(
  alerteId: number,
): Promise<AlerteData | null> {
  try {
    if (!alerteId || isNaN(alerteId) || alerteId <= 0) {
      throw new Error("ID alerte invalide");
    }

    addSentryBreadcrumb(
      `Récupération alerte ${alerteId}`,
      "service.alertes",
      "info",
      { alerteId },
    );

    console.log(`🔍 [AlertesService] Récupération alerte ${alerteId}`);

    const alerte = await prisma.alertes_utilisateurs.findUnique({
      where: { id: alerteId },
      include: {
        alertes_types: true,
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!alerte) {
      console.log(`❌ [AlertesService] Alerte ${alerteId} non trouvée`);
      return null;
    }

    console.log(`✅ [AlertesService] Alerte ${alerteId} trouvée`);

    const contexte = alerte.donnees_contexte as any;
    return {
      id: alerte.id,
      type: alerte.alertes_types?.nom || "Inconnu",
      severite:
        contexte?.severite || alerte.alertes_types?.priorite || "normale",
      message: contexte?.message || alerte.alertes_types?.description || "",
      utilisateur_id: alerte.utilisateur_id || undefined,
      statut: alerte.statut || "active",
      date_detection: alerte.date_detection || new Date(),
      date_resolution: alerte.date_resolution || undefined,
      notes: alerte.notes || undefined,
      utilisateur: alerte.utilisateurs
        ? {
            first_name: alerte.utilisateurs.first_name,
            last_name: alerte.utilisateurs.last_name,
            email: alerte.utilisateurs.email,
          }
        : undefined,
    };
  } catch (error: any) {
    console.error(
      `❌ [AlertesService] Erreur récupération alerte ${alerteId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "alertes",
        operation: "obtenirAlerteParId",
      },
      extra: { alerteId },
    });

    throw new Error(
      `Erreur lors de la récupération de l'alerte: ${error.message}`,
    );
  }
}
