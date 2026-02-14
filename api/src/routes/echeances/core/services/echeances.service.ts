import { prisma } from "@/infrastructure/database/prisma-client.js";
import type { echeances_paiements_statut } from "@prisma/client";

/**
 * Service de gestion des échéances
 * Contient la logique métier pour les opérations sur les échéances
 */

/**
 * Interface pour une échéance
 */
export interface Echeance {
  id: number;
  utilisateur_id: number;
  abonnement_id?: number;
  montant: number;
  date_echeance: string;
  statut: "en_attente" | "pay_" | "chu";
  date_creation?: string;
  date_paiement?: string;
  stripe_payment_intent_id?: string;
  description?: string;
}

/**
 * Interface pour une échéance avec détails utilisateur
 */
export interface EcheanceAvecDetails extends Echeance {
  utilisateur?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  plan?: {
    nom_plan: string;
    prix: number;
  };
  statut_calcule?: string;
}

/**
 * Interface pour les statistiques d'échéances
 */
export interface StatistiquesEcheances {
  total_echeances: number;
  en_attente: number;
  payees: number;
  echues: number;
  montant_total_du: number;
}

/**
 * Récupérer toutes les échéances d'un utilisateur
 */
export async function obtenirEcheancesUtilisateur(
  userId: number,
  _paiementsClient?: any,
): Promise<Echeance[]> {
  console.log(
    `🔍 [Service Échéances] Récupération échéances utilisateur ${userId}`,
  );

  try {
    const echeances = await prisma.echeances_paiements.findMany({
      where: { utilisateur_id: userId },
      orderBy: { date_echeance: "desc" },
    });

    console.log(
      `✅ [Service Échéances] ${echeances.length} échéances trouvées`,
    );

    return echeances.map((e) => ({
      id: e.id,
      utilisateur_id: e.utilisateur_id,
      abonnement_id: e.abonnement_id,
      montant: Number(e.montant),
      date_echeance: e.date_echeance.toISOString(),
      statut: e.statut || "en_attente",
      date_paiement: e.date_paiement?.toISOString(),
    }));
  } catch (error) {
    console.error(
      `❌ [Service Échéances] Erreur récupération échéances:`,
      error,
    );
    throw new Error(
      `Impossible de récupérer les échéances de l'utilisateur ${userId}`,
    );
  }
}

/**
 * Récupérer les détails d'une échéance spécifique avec vérification de sécurité
 */
export async function obtenirDetailEcheance(
  echeanceId: number,
  userId?: number,
  _paiementsClient?: any,
): Promise<EcheanceAvecDetails | null> {
  console.log(
    `🔍 [Service Échéances] Récupération détail échéance ${echeanceId}`,
    {
      userId: userId || "non spécifié",
    },
  );

  try {
    const echeance = await prisma.echeances_paiements.findUnique({
      where: { id: echeanceId },
      include: {
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        plans_tarifaires: {
          select: {
            nom_plan: true,
            prix: true,
          },
        },
      },
    });

    if (!echeance) {
      console.log(`⚠️ [Service Échéances] Échéance ${echeanceId} non trouvée`);
      return null;
    }

    // Vérifier si l'échéance appartient à l'utilisateur demandé
    if (userId && echeance.utilisateur_id !== userId) {
      console.log(
        `⚠️ [Service Échéances] Échéance ${echeanceId} n'appartient pas à l'utilisateur ${userId}`,
      );
      return null;
    }

    // Calculer le statut (en_retard si date passée et non payé)
    const now = new Date();
    const statutBase = echeance.statut || "en_attente";
    const statutCalcule =
      echeance.date_echeance < now && echeance.statut !== "pay_"
        ? "en_retard"
        : statutBase;

    // Formater la réponse
    const echeanceFormatee: EcheanceAvecDetails = {
      id: echeance.id,
      utilisateur_id: echeance.utilisateur_id,
      abonnement_id: echeance.abonnement_id,
      montant: Number(echeance.montant),
      date_echeance: echeance.date_echeance.toISOString(),
      statut: statutBase,
      statut_calcule: statutCalcule,
      date_paiement: echeance.date_paiement?.toISOString(),
      utilisateur: {
        first_name: echeance.utilisateurs.first_name || "",
        last_name: echeance.utilisateurs.last_name || "",
        email: echeance.utilisateurs.email,
      },
    };

    if (echeance.plans_tarifaires) {
      echeanceFormatee.plan = {
        nom_plan: echeance.plans_tarifaires.nom_plan,
        prix: Number(echeance.plans_tarifaires.prix),
      };
    }

    console.log(`✅ [Service Échéances] Échéance ${echeanceId} récupérée`);

    return echeanceFormatee;
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur récupération détail:`, error);
    throw new Error(
      `Impossible de récupérer les détails de l'échéance ${echeanceId}`,
    );
  }
}

/**
 * Créer une nouvelle échéance
 */
export async function creerEcheance(
  data: {
    utilisateur_id: number;
    abonnement_id?: number | null;
    montant: number;
    date_echeance: string;
    description?: string;
    statut?: "en_attente" | "pay_" | "chu";
  },
  _paiementsClient?: any,
): Promise<Echeance> {
  console.log(`📝 [Service Échéances] Création nouvelle échéance:`, data);

  try {
    const echeance = await prisma.echeances_paiements.create({
      data: {
        utilisateur_id: data.utilisateur_id,
        abonnement_id: data.abonnement_id || 0,
        date_echeance: new Date(data.date_echeance),
        montant: data.montant,
        statut: data.statut || "en_attente",
      },
    });

    console.log(
      `✅ [Service Échéances] Échéance ${echeance.id} créée avec succès`,
    );

    return {
      id: echeance.id,
      utilisateur_id: echeance.utilisateur_id,
      abonnement_id: echeance.abonnement_id,
      montant: Number(echeance.montant),
      date_echeance: echeance.date_echeance.toISOString(),
      statut: echeance.statut || "en_attente",
      date_paiement: echeance.date_paiement?.toISOString(),
    };
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur création échéance:`, error);
    throw new Error("Impossible de créer l'échéance");
  }
}

/**
 * Mettre à jour une échéance
 */
export async function modifierEcheance(
  echeanceId: number,
  updates: {
    montant?: number;
    date_echeance?: string;
    description?: string;
    statut?: "en_attente" | "pay_" | "chu";
    date_paiement?: string;
    stripe_payment_intent_id?: string;
  },
  _paiementsClient?: any,
): Promise<Echeance | null> {
  console.log(
    `📝 [Service Échéances] Mise à jour échéance ${echeanceId}:`,
    updates,
  );

  try {
    // Vérifier que l'échéance existe
    const existingEcheance = await prisma.echeances_paiements.findUnique({
      where: { id: echeanceId },
    });

    if (!existingEcheance) {
      console.log(`⚠️ [Service Échéances] Échéance ${echeanceId} non trouvée`);
      return null;
    }

    // Construire l'objet de mise à jour
    const updateData: any = {};

    if (updates.montant !== undefined) updateData.montant = updates.montant;
    if (updates.date_echeance !== undefined)
      updateData.date_echeance = new Date(updates.date_echeance);
    if (updates.statut !== undefined) updateData.statut = updates.statut;
    if (updates.date_paiement !== undefined)
      updateData.date_paiement = new Date(updates.date_paiement);

    if (Object.keys(updateData).length === 0) {
      console.log(`⚠️ [Service Échéances] Aucun champ à mettre à jour`);
      return {
        id: existingEcheance.id,
        utilisateur_id: existingEcheance.utilisateur_id,
        abonnement_id: existingEcheance.abonnement_id,
        montant: Number(existingEcheance.montant),
        date_echeance: existingEcheance.date_echeance.toISOString(),
        statut: existingEcheance.statut || "en_attente",
        date_paiement: existingEcheance.date_paiement?.toISOString(),
      };
    }

    const echeanceMiseAJour = await prisma.echeances_paiements.update({
      where: { id: echeanceId },
      data: updateData,
    });

    console.log(`✅ [Service Échéances] Échéance ${echeanceId} mise à jour`);

    return {
      id: echeanceMiseAJour.id,
      utilisateur_id: echeanceMiseAJour.utilisateur_id,
      abonnement_id: echeanceMiseAJour.abonnement_id,
      montant: Number(echeanceMiseAJour.montant),
      date_echeance: echeanceMiseAJour.date_echeance.toISOString(),
      statut: echeanceMiseAJour.statut || "en_attente",
      date_paiement: echeanceMiseAJour.date_paiement?.toISOString(),
    };
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur mise à jour échéance:`, error);
    throw new Error(`Impossible de mettre à jour l'échéance ${echeanceId}`);
  }
}

/**
 * Supprimer une échéance
 */
export async function supprimerEcheance(
  echeanceId: number,
  _paiementsClient?: any,
): Promise<boolean> {
  console.log(`🗑️ [Service Échéances] Suppression échéance ${echeanceId}`);

  try {
    // Vérifier que l'échéance existe
    const existingEcheance = await prisma.echeances_paiements.findUnique({
      where: { id: echeanceId },
    });

    if (!existingEcheance) {
      console.log(`⚠️ [Service Échéances] Échéance ${echeanceId} non trouvée`);
      return false;
    }

    // Supprimer l'échéance
    await prisma.echeances_paiements.delete({
      where: { id: echeanceId },
    });

    console.log(`✅ [Service Échéances] Échéance ${echeanceId} supprimée`);

    return true;
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur suppression échéance:`, error);
    throw new Error(`Impossible de supprimer l'échéance ${echeanceId}`);
  }
}

/**
 * Obtenir les statistiques des échéances d'un utilisateur
 */
export async function obtenirStatistiquesUtilisateur(
  userId: number,
  _paiementsClient?: any,
): Promise<{
  statistiques: StatistiquesEcheances;
  echeances: EcheanceAvecDetails[];
}> {
  console.log(
    `📊 [Service Échéances] Récupération statistiques utilisateur ${userId}`,
  );

  try {
    const echeancesDetaillees = await prisma.echeances_paiements.findMany({
      where: { utilisateur_id: userId },
      include: {
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        plans_tarifaires: {
          select: {
            nom_plan: true,
            prix: true,
          },
        },
      },
      orderBy: { date_echeance: "desc" },
    });

    const now = new Date();

    // Calculer les statistiques
    const stats: StatistiquesEcheances = {
      total_echeances: echeancesDetaillees.length,
      en_attente: echeancesDetaillees.filter((e) => e.statut === "en_attente")
        .length,
      payees: echeancesDetaillees.filter((e) => e.statut === "pay_").length,
      echues: echeancesDetaillees.filter(
        (e) => e.statut === "en_attente" && e.date_echeance < now,
      ).length,
      montant_total_du: echeancesDetaillees
        .filter((e) => e.statut === "en_attente")
        .reduce((sum, e) => sum + Number(e.montant), 0),
    };

    console.log(`✅ [Service Échéances] Statistiques calculées:`, stats);

    // Formater les échéances
    const echeancesFormatees = echeancesDetaillees.map((e) => ({
      id: e.id,
      utilisateur_id: e.utilisateur_id,
      abonnement_id: e.abonnement_id,
      montant: Number(e.montant),
      date_echeance: e.date_echeance.toISOString(),
      statut: e.statut || "en_attente",
      date_paiement: e.date_paiement?.toISOString(),
      utilisateur: {
        first_name: e.utilisateurs.first_name || "",
        last_name: e.utilisateurs.last_name || "",
        email: e.utilisateurs.email,
      },
      plan: e.plans_tarifaires
        ? {
            nom_plan: e.plans_tarifaires.nom_plan,
            prix: Number(e.plans_tarifaires.prix),
          }
        : undefined,
    }));

    return {
      statistiques: stats,
      echeances: echeancesFormatees,
    };
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur statistiques:`, error);
    throw new Error(
      `Impossible de récupérer les statistiques de l'utilisateur ${userId}`,
    );
  }
}

/**
 * Diagnostic d'une échéance pour un utilisateur
 */
export async function obtenirDiagnosticEcheance(
  echeanceId: number,
  userId: number,
  _paiementsClient?: any,
): Promise<any> {
  console.log(
    `🔍 [Service Échéances] Diagnostic échéance ${echeanceId} pour utilisateur ${userId}`,
  );

  try {
    // 1. Vérifier si l'échéance existe
    const echeanceExiste = await prisma.echeances_paiements.findUnique({
      where: { id: echeanceId },
    });

    // 2. Vérifier si l'utilisateur existe
    const userExiste = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    // 3. Récupérer toutes les échéances de cet utilisateur
    const toutesEcheances = await prisma.echeances_paiements.findMany({
      where: { utilisateur_id: userId },
    });

    const diagnostic = {
      echeance_recherchee: {
        id: echeanceId,
        existe: !!echeanceExiste,
        details: echeanceExiste || null,
        appartient_utilisateur:
          !!echeanceExiste && echeanceExiste.utilisateur_id === userId,
      },
      utilisateur: {
        id: userId,
        existe: !!userExiste,
        details: userExiste || null,
      },
      echeances_utilisateur: {
        total: toutesEcheances.length,
        liste: toutesEcheances.map((e) => ({
          id: e.id,
          montant: Number(e.montant),
          statut: e.statut,
          date_echeance: e.date_echeance.toISOString(),
        })),
      },
    };

    console.log(`✅ [Service Échéances] Diagnostic effectué`);

    return diagnostic;
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur diagnostic:`, error);
    throw new Error("Impossible d'effectuer le diagnostic");
  }
}
