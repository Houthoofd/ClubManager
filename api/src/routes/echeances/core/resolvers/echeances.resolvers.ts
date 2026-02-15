/**
 * Resolvers GraphQL pour le module Echéances
 * Gère les requêtes et mutations pour les échéances de paiement
 *
 * @module echeances.resolvers
 */

import type { GraphQLContext } from "@/shared/types/context.types.js";
import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "@/shared/errors/GraphQLErrors.js";

/**
 * Mapper les valeurs d'enum user-facing vers les valeurs Prisma
 */
function mapStatutToPrisma(
  statut?: "en attente" | "payé" | "échu",
): "en_attente" | "pay_" | "chu" | undefined {
  if (!statut) return undefined;
  const mapping: Record<string, "en_attente" | "pay_" | "chu"> = {
    "en attente": "en_attente",
    payé: "pay_",
    échu: "chu",
  };
  return mapping[statut];
}

/**
 * Mapper les valeurs Prisma vers les valeurs user-facing
 */
function mapStatutFromPrisma(
  statut?: "en_attente" | "pay_" | "chu",
): "en attente" | "payé" | "échu" | undefined {
  if (!statut) return undefined;
  const mapping: Record<string, "en attente" | "payé" | "échu"> = {
    en_attente: "en attente",
    pay_: "payé",
    chu: "échu",
  };
  return mapping[statut];
}
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
} from '@clubmanager/types/domains/paiements/echeances.validators';
import { validateInput } from "@/shared/middleware/validation.middleware.js";
import { combineMiddlewares } from "@/shared/middleware/auth.middleware.js";
import {
  requireAuth,
  requireAdmin,
} from "@/shared/middleware/auth.middleware.js";
import { withSentry } from "@/shared/middleware/sentry.middleware.js";
import {
  creerEcheance,
  obtenirEcheancesUtilisateur,
  obtenirDetailEcheance,
  modifierEcheance,
  supprimerEcheance,
  obtenirStatistiquesUtilisateur,
  obtenirDiagnosticEcheance,
} from "../services/echeances.service.js";
import type { EcheanceAvecDetails } from "../services/echeances.service.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calcule le nombre de jours de retard d'une échéance
 */
function calculateRetardJours(echeance: EcheanceAvecDetails): number {
  if (echeance.statut === "pay_" || !echeance.date_echeance) {
    return 0;
  }

  const today = new Date();
  const dateEcheance = new Date(echeance.date_echeance);

  if (today <= dateEcheance) {
    return 0;
  }

  const diffTime = today.getTime() - dateEcheance.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Mappe le statut de la DB vers le format GraphQL
 */
function mapStatutToGraphQL(statut: string): string {
  const statusMap: Record<string, string> = {
    en_attente: "EN_ATTENTE",
    pay_: "PAYEE",
    chu: "ECHU",
  };
  return statusMap[statut] || statut.toUpperCase();
}

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
  if (context.user?.id !== utilisateurId && context.user?.status_id !== 1) {
    // 1 = admin
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
      context.user?.status_id !== 1 // 1 = admin
    ) {
      throw new ValidationError("Non autorisé à consulter cette échéance", [
        { field: "echeanceId", message: "Accès refusé" },
      ]);
    }

    console.log("✅ [EcheanceDetail] Échéance trouvée:", echeance.id);

    return {
      id: echeance.id,
      utilisateur_id: echeance.utilisateur_id,
      utilisateur_nom: echeance.utilisateur?.last_name || "",
      utilisateur_prenom: echeance.utilisateur?.first_name || "",
      utilisateur_email: echeance.utilisateur?.email || "",
      abonnement_id: echeance.abonnement_id,
      abonnement_nom: echeance.plan?.nom_plan || "",
      montant: echeance.montant,
      date_echeance: echeance.date_echeance,
      date_paiement: echeance.date_paiement,
      statut: mapStatutToGraphQL(echeance.statut),
      description: echeance.description,
      created_at: new Date(),
      updated_at: new Date(),
      retard_jours: calculateRetardJours(echeance),
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
  if (context.user?.id !== utilisateurId && context.user?.status_id !== 1) {
    // 1 = admin
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
      total_echeances: stats.statistiques.total_echeances || 0,
      total_montant: stats.statistiques.montant_total_du || 0,
      echeances_payees: stats.statistiques.payees || 0,
      montant_paye: 0, // Non disponible dans le service
      echeances_en_attente: stats.statistiques.en_attente || 0,
      montant_en_attente: 0, // Non disponible dans le service
      echeances_echues: stats.statistiques.echues || 0,
      montant_echu: 0, // Non disponible dans le service
      taux_paiement:
        stats.statistiques.payees / (stats.statistiques.total_echeances || 1),
      prochain_paiement: null, // Non disponible dans le service
      prochain_montant: null, // Non disponible dans le service
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
    const diagnostic = await obtenirDiagnosticEcheance(
      echeanceId,
      _context.user?.id ?? 0,
    );

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
      abonnement_id: validatedInput.abonnement_id ?? null,
      montant: validatedInput.montant,
      date_echeance: validatedInput.date_echeance,
      description: validatedInput.description,
      statut: mapStatutToPrisma(validatedInput.statut as any),
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
        statut: mapStatutFromPrisma(echeance.statut),
        description: echeance.description,
        created_at: new Date(),
        updated_at: new Date(),
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
  args: { echeanceId: number; input: UpdateEcheanceData },
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
    // Extraire echeanceId de validatedInput et passer le reste au service
    const { echeanceId: _, ...updateData } = validatedInput;

    // Mapper le statut si présent et convertir date_paiement null en undefined
    const mappedUpdateData: any = {
      montant: updateData.montant,
      date_echeance: updateData.date_echeance,
      description: updateData.description,
      statut: updateData.statut
        ? mapStatutToPrisma(updateData.statut as any)
        : undefined,
      date_paiement:
        updateData.date_paiement === null
          ? undefined
          : updateData.date_paiement,
      stripe_payment_intent_id: updateData.stripe_payment_intent_id,
    };

    const echeance = await modifierEcheance(echeanceId, mappedUpdateData);

    if (!echeance) {
      throw new NotFoundError(`Échéance non trouvée: ${echeanceId}`);
    }

    console.log("✅ [ModifierEcheance] Échéance modifiée:", echeance.id);

    return {
      success: true,
      message: "Échéance modifiée avec succès",
      echeance: {
        id: echeance!.id,
        utilisateur_id: echeance!.utilisateur_id,
        abonnement_id: echeance!.abonnement_id,
        montant: echeance!.montant,
        date_echeance: echeance!.date_echeance,
        date_paiement: echeance!.date_paiement,
        statut: mapStatutToGraphQL(echeance!.statut),
        description: echeance!.description,
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
      statut: "pay_",
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
        statut: mapStatutFromPrisma(echeance.statut),
        description: echeance.description,
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
