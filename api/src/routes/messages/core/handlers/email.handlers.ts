import { Request, Response } from "express";
import { emailsService } from "../services/email.service.js";
import {
  sendCustomEmailSchema,
  sendTestEmailSchema,
  sendTemplateEmailSchema,
  sendWelcomeEmailSchema,
  sendValidationEmailSchema,
  recoverUserIdSchema,
  confirmEmailSchema,
  messageHistorySchema,
  emailStatsSchema,
} from "@clubmanager/types/validators";
import { z } from "zod";
import {
  ValidationError,
  NotFoundError,
  EmailError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour envoyer un email de bienvenue
 *
 * @route POST /api/messages/emails/welcome
 * @access Protected
 */
export const sendWelcomeEmail = async (req: Request, res: Response) => {
  try {
    console.log("📧 [EmailHandler] Envoi email de bienvenue");

    const validatedData = sendWelcomeEmailSchema.parse(req.body);

    const result = await emailsService.sendWelcomeEmail(
      validatedData.email,
      validatedData.firstName,
      validatedData.lastName,
      validatedData.userId,
      validatedData.utilisateurId,
    );

    if (!result.success) {
      throw new EmailError(
        result.message || "Erreur lors de l'envoi de l'email de bienvenue",
      );
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur sendWelcomeEmail:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Données invalides",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError(
      "Erreur lors de l'envoi de l'email de bienvenue",
    );
  }
};

/**
 * Handler pour envoyer un email de validation
 *
 * @route POST /api/messages/emails/validation
 * @access Protected
 */
export const sendValidationEmail = async (req: Request, res: Response) => {
  try {
    console.log("📧 [EmailHandler] Envoi email de validation");

    const validatedData = sendValidationEmailSchema.parse(req.body);

    const result = await emailsService.sendValidationEmail(
      validatedData.email,
      validatedData.firstName,
      validatedData.userId,
      validatedData.utilisateurId,
    );

    if (!result.success) {
      throw new EmailError(
        result.message || "Erreur lors de l'envoi de l'email de validation",
      );
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur sendValidationEmail:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Données invalides",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError(
      "Erreur lors de l'envoi de l'email de validation",
    );
  }
};

/**
 * Handler pour récupérer l'userId par email
 *
 * @route POST /api/messages/emails/recover-userid
 * @access Public
 */
export const recoverUserId = async (req: Request, res: Response) => {
  try {
    console.log("🔍 [EmailHandler] Récupération userId");

    const validatedData = recoverUserIdSchema.parse(req.body);

    const result = await emailsService.recoverUserId(validatedData.email);

    if (!result.success) {
      throw new NotFoundError(result.message || "Utilisateur non trouvé");
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur recoverUserId:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Email invalide",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError("Erreur lors de la récupération de l'userId");
  }
};

/**
 * Handler pour confirmer un email via token
 *
 * @route GET /api/messages/emails/confirm-email/:token
 * @access Public
 */
export const confirmEmail = async (req: Request, res: Response) => {
  try {
    console.log("✅ [EmailHandler] Confirmation email");

    const validatedData = confirmEmailSchema.parse(req.params);

    const result = await emailsService.confirmEmail(validatedData.token);

    if (!result.success) {
      throw new ValidationError(result.message || "Token invalide ou expiré");
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur confirmEmail:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Token invalide",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError("Erreur lors de la confirmation de l'email");
  }
};

/**
 * Handler pour envoyer un email personnalisé
 *
 * @route POST /api/messages/emails/send-custom
 * @access Protected
 */
export const sendCustomEmail = async (req: Request, res: Response) => {
  try {
    console.log("📧 [EmailHandler] Envoi email personnalisé");

    const validatedData = sendCustomEmailSchema.parse(req.body);

    const result = await emailsService.sendCustomEmail(validatedData);

    if (!result.success) {
      throw new EmailError(
        result.message || "Erreur lors de l'envoi de l'email personnalisé",
      );
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur sendCustomEmail:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Données invalides",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError(
      "Erreur lors de l'envoi de l'email personnalisé",
    );
  }
};

/**
 * Handler pour envoyer un email de test
 *
 * @route POST /api/messages/emails/send-test
 * @access Protected
 */
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    console.log("🧪 [EmailHandler] Envoi email de test");

    const validatedData = sendTestEmailSchema.parse(req.body);

    const result = await emailsService.sendTestEmail(validatedData.email);

    if (!result.success) {
      throw new EmailError(
        result.message || "Erreur lors de l'envoi de l'email de test",
      );
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur sendTestEmail:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Email invalide",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError("Erreur lors de l'envoi de l'email de test");
  }
};

/**
 * Handler pour obtenir tous les templates
 *
 * @route GET /api/messages/emails/templates
 * @access Protected
 */
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    console.log("📋 [EmailHandler] Récupération des templates");

    const result = await emailsService.getAllTemplates();

    if (!result.success) {
      throw new InternalServerError(
        result.message || "Erreur lors de la récupération des templates",
      );
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur getAllTemplates:", error);

    throw new InternalServerError(
      "Erreur lors de la récupération des templates",
    );
  }
};

/**
 * Handler pour envoyer un email avec template
 *
 * @route POST /api/messages/emails/send-template
 * @access Protected
 */
export const sendTemplateEmail = async (req: Request, res: Response) => {
  try {
    console.log("📧 [EmailHandler] Envoi email avec template");

    const validatedData = sendTemplateEmailSchema.parse(req.body);

    const result = await emailsService.sendTemplateEmail(validatedData);

    if (!result.success) {
      throw new EmailError(
        result.message || "Erreur lors de l'envoi de l'email avec template",
      );
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur sendTemplateEmail:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Données invalides",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError(
      "Erreur lors de l'envoi de l'email avec template",
    );
  }
};

/**
 * Handler pour obtenir l'historique des messages d'un utilisateur
 *
 * @route GET /api/messages/emails/history/:utilisateurId
 * @access Protected
 */
export const getMessageHistory = async (req: Request, res: Response) => {
  try {
    console.log("📚 [EmailHandler] Récupération historique messages");

    const validatedData = messageHistorySchema.parse({
      utilisateurId: req.params.utilisateurId,
      limit: req.query.limit as string,
    });

    const result = await emailsService.getMessageHistory(
      validatedData.utilisateurId,
      parseInt(validatedData.limit as any),
    );

    if (!result.success) {
      throw new NotFoundError(result.message || "Historique non trouvé");
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur getMessageHistory:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Paramètres invalides",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError(
      "Erreur lors de la récupération de l'historique",
    );
  }
};

/**
 * Handler pour obtenir les statistiques d'emails d'un utilisateur
 *
 * @route GET /api/messages/emails/stats/:utilisateurId
 * @access Protected
 */
export const getEmailStats = async (req: Request, res: Response) => {
  try {
    console.log("📊 [EmailHandler] Récupération statistiques emails");

    const validatedData = emailStatsSchema.parse({
      utilisateurId: req.params.utilisateurId,
      limit: req.query.limit as string,
    });

    const result = await emailsService.getEmailStats(
      validatedData.utilisateurId,
      parseInt(validatedData.limit as any),
    );

    if (!result.success) {
      throw new NotFoundError(result.message || "Statistiques non trouvées");
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur getEmailStats:", error);

    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Paramètres invalides",
        formatZodErrors(error.errors),
      );
    }

    throw new InternalServerError(
      "Erreur lors de la récupération des statistiques",
    );
  }
};

/**
 * Handler pour nettoyer les tokens expirés
 *
 * @route DELETE /api/messages/emails/cleanup-expired-tokens
 * @access Protected
 */
export const cleanupExpiredTokens = async (req: Request, res: Response) => {
  try {
    console.log("🧹 [EmailHandler] Nettoyage tokens expirés");

    const result = await emailsService.cleanupExpiredTokens();

    if (!result.success) {
      throw new InternalServerError(
        result.message || "Erreur lors du nettoyage des tokens",
      );
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur cleanupExpiredTokens:", error);

    throw new InternalServerError("Erreur lors du nettoyage des tokens");
  }
};

/**
 * Handler pour tester la configuration email
 *
 * @route GET /api/messages/emails/test-config
 * @access Protected
 */
export const testConfiguration = async (req: Request, res: Response) => {
  try {
    console.log("🔧 [EmailHandler] Test configuration email");

    const result = await emailsService.testConfiguration();

    if (!result.success) {
      throw new InternalServerError(
        result.message || "Erreur lors du test de configuration",
      );
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [EmailHandler] Erreur testConfiguration:", error);

    throw new InternalServerError("Erreur lors du test de configuration");
  }
};
