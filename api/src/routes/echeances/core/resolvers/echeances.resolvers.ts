/**
 * Resolvers GraphQL pour le module Écheances
 * ✅ Pattern standardisé avec middlewares partagés
 *
 * @module echeances.resolvers
 */

import type { GraphQLContext } from '@/shared/types/context.types.js';
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from '@/shared/errors/GraphQLErrors.js';
import {
  createEcheanceSchema,
  updateEcheanceSchema,
  echeancesUtilisateurIdSchema,
  echeanceIdSchema,
  marquerEcheancePayeeSchema,
  type CreateEcheanceData,
  type UpdateEcheanceData,
  type EcheancesUtilisateurIdInput,
  type EcheanceIdInput,
  type MarquerEcheancePayeeInput,
  type EcheancesFiltersInput,
} from "@clubmanager/types/validators";
import { validateInput } from '@/shared/middleware/validation.middleware.js';
import { combineMiddlewares } from '@/shared/middleware/auth.middleware.js';
import {
  requireAuth,
  requireAdmin,
} from '@/shared/middleware/auth.middleware.js';
import { withSentry } from '@/shared/middleware/sentry.middleware.js';
import {
  creerEcheance,
  obtenirEcheancesUtilisateur,
  obtenirDetailEcheance,
  modifierEcheance,
  supprimerEcheance,
  obtenirStatistiquesUtilisateur,
  obtenirDiagnosticEcheance,
} from "../services/echeances.service.js";

// ============================================
// QUERY RESOLVERS
// ============================================

/**
 * Obtenir les échéances d'un utilisateur
 */
const echeancesUtilisateurResolver = async (
  _parent: unknown,
  args: { utilisateurId: number; filters?: EcheancesFiltersInput },
  context: GraphQLContext,
) => {
  const { utilisateurId, filters } = args;

  // Vérifier que l'utilisateur connecté est celui demandé ou admin
  if (context.user?.id !== utilisateurId && context.user?.role !== "admin") {
    throw new ValidationError(
      "Non autorisé à consulter les échéances de cet utilisateur",
      [{ field: "utilisateurId", message: "Accès refusé" }],
    );
  }

  console.log("📋 [EcheancesUtilisateur] Récupération échéances:", {
    utilisateurId,
    filters,
  });

  try {
    // Récupérer les échéances
    const echeances = await obtenirEcheancesUtilisateur(utilisateurId);

    // Appliquer les filtres si fournis
    let echeancesFiltrees = echeances;

    if (filters) {
      if (filters.statut) {
        const statutMap: { [key: string]: string } = {
          EN_ATTENTE: "en attente",
          PAYE: "payé",
          ECHU: "échu",
          ANNULE: "annulé",
        };
        const statutRecherche = statutMap[filters.statut] || filters.statut;
        echeancesFiltrees = echeancesFiltrees.filter(
          (e: any) => e.statut === statutRecherche,
        );
      }

      if (filters.date_debut) {
        const dateDebut = new Date(filters.date_debut);
        echeancesFiltrees = echeancesFiltrees.filter(
          (e: any) => new Date(e.date_echeance) >= dateDebut,
        );
      }

      if (filters.date_fin) {
        const dateFin = new Date(filters.date_fin);
        echeancesFiltrees = echeancesFiltrees.filter(
          (e: any) => new Date(e.date_echeance) <= dateFin,
        );
      }

      if (filters.montant_min) {
        echeancesFiltrees = echeancesFiltrees.filter(
          (e: any) => e.montant >= filters.montant_min!,
        );
      }

      if (filters.montant_max) {
        echeancesFiltrees = echeancesFiltrees.filter(
          (e: any) => e.montant <= filters.montant_max!,
        );
      }
    }

    console.log(
      `✅ [EcheancesUtilisateur] ${echeancesFiltrees.length} échéances trouvées`,
    );

    // Mapper au format GraphQL
    return echeancesFiltrees.map((e: any) => ({
      id: e.id,
      utilisateur_id: e.utilisateur_id,
      utilisateur_nom: e.utilisateur_nom,
      utilisateur_prenom: e.utilisateur_prenom,
      utilisateur_email: e.utilisateur_email,
      abonnement_id: e.abonnement_id,
      abonnement_nom: e.abonnement_nom,
      montant: e.montant,
      date_echeance: e.date_echeance,
      date_paiement: e.date_paiement,
      statut: mapStatutToGraphQL(e.statut),
      description: e.description,
      created_at: e.created_at,
      updated_at: e.updated_at,
      retard_jours: e.retard_jours || 0,
    }));
  } catch (error: any) {
    console.error("❌ [EcheancesUtilisateur] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la récupération des échéances",
      error,
    );
  }
};

/**
 * Obtenir le détail d'une échéance
 */
const echeanceDetailResolver = async (
  _parent: unknown,
  args: { echeanceId: number },
  context: GraphQLContext,
) => {
  const { echeanceId } = args;

  console.log("🔍 [EcheanceDetail] Récupération détail échéance:", echeanceId);

  try {
    const echeance = await obtenirDetailEcheance(echeanceId);

    if (!echeance) {
      throw new NotFoundError(`Échéance non trouvée: ${echeanceId}`);
    }

    // Vérifier que l'utilisateur connecté est le propriétaire ou admin
    if (
      context.user?.id !== echeance.utilisateur_id &&
      context.user?.role !== "admin"
    ) {
      throw new ValidationError("Non autorisé à consulter cette échéance", [
        { field: "echeanceId", message: "Accès refusé" },
      ]);
    }

    console.log("✅ [EcheanceDetail] Échéance trouvée:", echeance.id);

    return {
      id: echeance.id,
      utilisateur_id: echeance.utilisateur_id,
      utilisateur_nom: echeance.utilisateur_nom,
      utilisateur_prenom: echeance.utilisateur_prenom,
      utilisateur_email: echeance.utilisateur_email,
      abonnement_id: echeance.abonnement_id,
      abonnement_nom: echeance.abonnement_nom,
      montant: echeance.montant,
      date_echeance: echeance.date_echeance,
      date_paiement: echeance.date_paiement,
      statut: mapStatutToGraphQL(echeance.statut),
      description: echeance.description,
      created_at: echeance.created_at,
      updated_at: echeance.updated_at,
      retard_jours: echeance.retard_jours || 0,
    };
  } catch (error: any) {
    console.error("❌ [EcheanceDetail] Erreur:", error);

    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur lors de la récupération du détail de l'échéance",
      error,
    );
  }
};

/**
 * Obtenir les statistiques des échéances d'un utilisateur
 */
const statistiquesEcheancesResolver = async (
  _parent: unknown,
  args: { utilisateurId: number },
  context: GraphQLContext,
) => {
  const { utilisateurId } = args;

  // Vérifier que l'utilisateur connecté est celui demandé ou admin
  if (context.user?.id !== utilisateurId && context.user?.role !== "admin") {
    throw new ValidationError(
      "Non autorisé à consulter les statistiques de cet utilisateur",
      [{ field: "utilisateurId", message: "Accès refusé" }],
    );
  }

  console.log(
    "📊 [StatistiquesEcheances] Récupération statistiques:",
    utilisateurId,
  );

  try {
    // Récupérer les statistiques
    const stats = await obtenirStatistiquesUtilisateur(utilisateurId);

    console.log("✅ [StatistiquesEcheances] Statistiques récupérées");

    return {
      utilisateur_id: utilisateurId,
      total_echeances: stats.total_echeances || 0,
      total_montant: stats.total_montant || 0,
      echeances_payees: stats.echeances_payees || 0,
      montant_paye: stats.montant_paye || 0,
      echeances_en_attente: stats.echeances_en_attente || 0,
      montant_en_attente: stats.montant_en_attente || 0,
      echeances_echues: stats.echeances_echues || 0,
      montant_echu: stats.montant_echu || 0,
      taux_paiement: stats.taux_paiement || 0,
      prochain_paiement: stats.prochain_paiement,
      prochain_montant: stats.prochain_montant,
    };
  } catch (error: any) {
    console.error("❌ [StatistiquesEcheances] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la récupération des statistiques",
      error,
    );
  }
};

/**
 * Diagnostic d'une échéance (admin uniquement)
 */
const diagnosticEcheanceResolver = async (
  _parent: unknown,
  args: { echeanceId: number },
  _context: GraphQLContext,
) => {
  const { echeanceId } = args;

  console.log("🔧 [DiagnosticEcheance] Diagnostic échéance:", echeanceId);

  try {
    const diagnostic = await obtenirDiagnosticEcheance(echeanceId, userId);

    console.log("✅ [DiagnosticEcheance] Diagnostic effectué");

    return {
      echeance_id: echeanceId,
      existe: diagnostic.existe,
      statut: diagnostic.statut,
      jours_retard: diagnostic.jours_retard || 0,
      montant: diagnostic.montant,
      utilisateur_id: diagnostic.utilisateur_id,
      problemes: diagnostic.problemes || [],
      recommandations: diagnostic.recommandations || [],
    };
  } catch (error: any) {
    console.error("❌ [DiagnosticEcheance] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors du diagnostic de l'échéance",
      error,
    );
  }
};

/**
 * Health check du service échéances
 */
const echeancesHealthResolver = async (
  _parent: unknown,
  _args: unknown,
  _context: GraphQLContext,
) => {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "echeances",
  };
};

// ============================================
// MUTATION RESOLVERS
// ============================================

/**
 * Créer une nouvelle échéance
 */
const creerEcheanceResolver = async (
  _parent: unknown,
  args: { input: CreateEcheanceData },
  _context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(createEcheanceSchema, input);

  console.log("📝 [CreerEcheance] Création échéance:", validatedInput);

  try {
    const echeance = await creerEcheance({
      utilisateur_id: validatedInput.utilisateur_id,
      abonnement_id: validatedInput.abonnement_id,
      montant: validatedInput.montant,
      date_echeance: validatedInput.date_echeance,
      description: validatedInput.description,
      statut: validatedInput.statut,
    });

    console.log("✅ [CreerEcheance] Échéance créée:", echeance.id);

    return {
      success: true,
      message: "Échéance créée avec succès",
      echeance: {
        id: echeance.id,
        utilisateur_id: echeance.utilisateur_id,
        abonnement_id: echeance.abonnement_id,
        montant: echeance.montant,
        date_echeance: echeance.date_echeance,
        date_paiement: echeance.date_paiement,
        statut: mapStatutToGraphQL(echeance.statut),
        description: echeance.description,
        created_at: echeance.created_at,
        updated_at: echeance.updated_at,
      },
    };
  } catch (error: any) {
    console.error("❌ [CreerEcheance] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la création de l'échéance",
      error,
    );
  }
};

/**
 * Modifier une échéance
 */
const modifierEcheanceResolver = async (
  _parent: unknown,
  args: { echeanceId: number; input: Partial<UpdateEcheanceData> },
  _context: GraphQLContext,
) => {
  const { echeanceId, input } = args;
  // Validation Zod
  const validatedInput = validateInput(updateEcheanceSchema, input);

  console.log("✏️ [ModifierEcheance] Modification échéance:", {
    echeanceId,
    input: validatedInput,
  });

  try {
    const echeance = await modifierEcheance(echeanceId, validatedInput);

    console.log("✅ [ModifierEcheance] Échéance modifiée:", echeance.id);

    return {
      success: true,
      message: "Échéance modifiée avec succès",
      echeance: {
        id: echeance.id,
        utilisateur_id: echeance.utilisateur_id,
        abonnement_id: echeance.abonnement_id,
        montant: echeance.montant,
        date_echeance: echeance.date_echeance,
        date_paiement: echeance.date_paiement,
        statut: mapStatutToGraphQL(echeance.statut),
        description: echeance.description,
        created_at: echeance.created_at,
        updated_at: echeance.updated_at,
      },
    };
  } catch (error: any) {
    console.error("❌ [ModifierEcheance] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la modification de l'échéance",
      error,
    );
  }
};

/**
 * Supprimer une échéance
 */
const supprimerEcheanceResolver = async (
  _parent: unknown,
  args: { echeanceId: number },
  _context: GraphQLContext,
) => {
  const { echeanceId } = args;

  console.log("🗑️ [SupprimerEcheance] Suppression échéance:", echeanceId);

  try {
    const success = await supprimerEcheance(echeanceId);

    if (!success) {
      throw new NotFoundError(`Échéance non trouvée: ${echeanceId}`);
    }

    console.log("✅ [SupprimerEcheance] Échéance supprimée:", echeanceId);

    return {
      success: true,
      message: "Échéance supprimée avec succès",
      echeance_id: echeanceId,
    };
  } catch (error: any) {
    console.error("❌ [SupprimerEcheance] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la suppression de l'échéance",
      error,
    );
  }
};

/**
 * Marquer une échéance comme payée
 */
const marquerEcheancePayeeResolver = async (
  _parent: unknown,
  args: { echeanceId: number },
  _context: GraphQLContext,
) => {
  const { echeanceId } = args;

  console.log(
    "✅ [MarquerEcheancePayee] Marquer échéance comme payée:",
    echeanceId,
  );

  try {
    const echeance = await modifierEcheance(echeanceId, {
      statut: "payé",
      date_paiement: new Date().toISOString(),
    });

    if (!echeance) {
      throw new NotFoundError(`Échéance non trouvée: ${echeanceId}`);
    }

    console.log(
      "✅ [MarquerEcheancePayee] Échéance marquée payée:",
      echeance.id,
    );

    return {
      success: true,
      message: "Échéance marquée comme payée",
      echeance: {
        id: echeance.id,
        utilisateur_id: echeance.utilisateur_id,
        abonnement_id: echeance.abonnement_id,
        montant: echeance.montant,
        date_echeance: echeance.date_echeance,
        date_paiement: echeance.date_paiement,
        statut: echeance.statut,
        updated_at: echeance.updated_at,
      },
    };
  } catch (error: any) {
    console.error("❌ [MarquerEcheancePayee] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors du marquage de l'échéance comme payée",
      error,
    );
  }
};

// ============================================
// HELPERS
// ============================================

/**
 * Mapper le statut DB vers le format GraphQL enum
 */
function mapStatutToGraphQL(statut: string): string {
  const statutMap: { [key: string]: string } = {
    "en attente": "EN_ATTENTE",
    payé: "PAYE",
    échu: "ECHU",
    annulé: "ANNULE",
  };
  return statutMap[statut] || statut.toUpperCase().replace(/ /g, "_");
}

// ============================================
// EXPORTS AVEC MIDDLEWARES
// ============================================

export const echeancesResolvers = {
  Query: {
    echeancesUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry,
    )(echeancesUtilisateurResolver),

    echeanceDetail: combineMiddlewares(
      requireAuth,
      withSentry,
    )(echeanceDetailResolver),

    statistiquesEcheances: combineMiddlewares(
      requireAuth,
      withSentry,
    )(statistiquesEcheancesResolver),

    diagnosticEcheance: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(diagnosticEcheanceResolver),

    echeancesHealth: echeancesHealthResolver,
  },

  Mutation: {
    creerEcheance: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(creerEcheanceResolver),

    modifierEcheance: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(modifierEcheanceResolver),

    supprimerEcheance: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(supprimerEcheanceResolver),

    marquerEcheancePayee: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(marquerEcheancePayeeResolver),
  },
};
