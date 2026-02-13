/**
 * Resolvers GraphQL pour le module Inscription
 * Gestion de l'inscription des nouveaux utilisateurs
 *
 * Sécurité & Fonctionnalités :
 * - ✅ withSentry - Observabilité et monitoring
 * - ✅ Validation stricte inputs Zod
 * - ✅ Vérification email disponible
 * - ✅ Hashage sécurisé des mots de passe
 * - ✅ Validation de l'âge (5-120 ans)
 * - ✅ Évaluation force du mot de passe
 * - ⚠️ PAS d'authentification requise (endpoints publics)
 *
 * @module inscription/resolvers
 */

import { GraphQLError } from "graphql";
import {
  inscriptionService,
  InscriptionService,
} from "../services/inscription.service.js";
import { validateInput } from '@/shared/middleware/validation.middleware.js';
import { withSentry } from '@/shared/middleware/sentry.middleware.js';
import {
  verificationEmailSchema,
  inscriptionSchema,
  evaluerMotDePasseInputSchema,
  type VerificationEmailData,
  type InscriptionData,
  type EvaluerMotDePasseInput,
} from "@clubmanager/types/validators";
import type {
  EmailVerificationResult,
  InscriptionUtilisateurResult,
  PasswordStrength,
} from "@clubmanager/types";

// ============================================
// TYPES POUR LES RESOLVERS
// ============================================

interface VerificationEmailArgs {
  input: VerificationEmailData;
}

interface InscriptionArgs {
  input: InscriptionData;
}

interface EvaluerMotDePasseArgs {
  input: EvaluerMotDePasseInput;
}

// ============================================
// QUERY RESOLVERS
// ============================================

/**
 * Query: verifierEmail
 * Vérifie si un email est déjà utilisé dans le système
 * Public (pas d'auth requise)
 * Middleware: Validation + Sentry
 */
const verifierEmailResolver = async (
  _: unknown,
  args: VerificationEmailArgs,
  context: any,
): Promise<EmailVerificationResult> => {
  try {
    // Validation de l'input
    const validatedInput = await validateInput(
      verificationEmailSchema,
      args.input,
    );

    console.log(
      `🔍 [InscriptionResolver] Vérification email: ${validatedInput.email}`,
    );

    const result = await inscriptionService.verifierEmail(
      validatedInput.email,
    );

    console.log(
      `✅ [InscriptionResolver] Email ${validatedInput.email} - existe: ${result.exists}`,
    );

    return result;
  } catch (error: any) {
    console.error(
      "❌ [InscriptionResolver] Erreur verifierEmail:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de la vérification de l'email: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Query: evaluerForceMotDePasse
 * Évalue la force d'un mot de passe (score 0-4)
 * Public (pas d'auth requise)
 * Middleware: Validation + Sentry
 */
const evaluerForceMotDePasseResolver = async (
  _: unknown,
  args: EvaluerMotDePasseArgs,
  context: any,
): Promise<PasswordStrength> => {
  try {
    // Validation de l'input
    const validatedInput = await validateInput(
      evaluerMotDePasseInputSchema,
      args.input,
    );

    console.log(
      `🔐 [InscriptionResolver] Évaluation force mot de passe`,
    );

    const score = inscriptionService.evaluerForceMotDePasse(
      validatedInput.password,
    );

    // Générer un feedback selon le score
    let feedback: string;
    switch (score) {
      case 0:
        feedback = "Très faible - Mot de passe insuffisant";
        break;
      case 1:
        feedback = "Faible - Ajoutez des caractères variés";
        break;
      case 2:
        feedback = "Moyen - Améliorable";
        break;
      case 3:
        feedback = "Bon - Mot de passe acceptable";
        break;
      case 4:
        feedback = "Excellent - Mot de passe très sécurisé";
        break;
      default:
        feedback = "Indéterminé";
    }

    console.log(
      `✅ [InscriptionResolver] Score mot de passe: ${score}/4`,
    );

    return {
      score,
      feedback,
    };
  } catch (error: any) {
    console.error(
      "❌ [InscriptionResolver] Erreur evaluerForceMotDePasse:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de l'évaluation du mot de passe: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

// ============================================
// MUTATION RESOLVERS
// ============================================

/**
 * Mutation: inscrireUtilisateur
 * Inscrit un nouvel utilisateur dans le système
 * Public (pas d'auth requise)
 * Middleware: Validation + Sentry
 */
const inscrireUtilisateurResolver = async (
  _: unknown,
  args: InscriptionArgs,
  context: any,
): Promise<InscriptionUtilisateurResult> => {
  try {
    // Validation de l'input
    const validatedInput = await validateInput(inscriptionSchema, args.input);

    console.log(
      `📝 [InscriptionResolver] Tentative d'inscription: ${validatedInput.email}`,
    );

    // Appel du service pour l'inscription
    const result = await inscriptionService.inscrireUtilisateur(validatedInput);

    if (!result.success) {
      // L'erreur peut être un conflit (email existe déjà) ou une validation
      if (result.message.includes("existe déjà")) {
        throw new GraphQLError(result.message, {
          extensions: { code: "CONFLICT" },
        });
      } else {
        throw new GraphQLError(result.message, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
    }

    console.log(
      `✅ [InscriptionResolver] Inscription réussie: ${validatedInput.email} (ID: ${result.userId})`,
    );

    return result;
  } catch (error: any) {
    console.error(
      "❌ [InscriptionResolver] Erreur inscrireUtilisateur:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de l'inscription: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

// ============================================
// EXPORT DES RESOLVERS AVEC MIDDLEWARES
// ============================================

export const inscriptionResolvers = {
  Query: {
    // Vérification email (Public + Sentry)
    verifierEmail: withSentry(verifierEmailResolver),

    // Évaluation force mot de passe (Public + Sentry)
    evaluerForceMotDePasse: withSentry(evaluerForceMotDePasseResolver),
  },

  Mutation: {
    // Inscription utilisateur (Public + Sentry)
    inscrireUtilisateur: withSentry(inscrireUtilisateurResolver),
  },
};
