import { Request, Response } from "express";
import {
  ajouterProfesseur,
  extraireIdsUtilisateurs,
} from "../services/index.js";
import { ajouterProfesseurSchema } from "@clubmanager/types/validators";
import { emailClient } from "../../../../clients/emailClient.js";
import { Professeurs } from "../../../../db/clients/professeurs/professeurs.js";
import type { EmailClient } from "../../../../clients/emailClient.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";
import { z } from "zod";

/**
 * Handler pour ajouter/promouvoir un ou plusieurs professeurs
 * POST /api/professeurs/ajouter
 */
export async function ajouterProfesseurHandler(
  req: Request,
  res: Response,
  professeursClient?: Professeurs,
  emailClientInstance?: EmailClient,
) {
  console.log(
    "📝 [Handler] POST /api/professeurs/ajouter - Promotion de professeur(s)",
  );

  try {
    const data = req.body;

    console.log("📋 [Handler] Données reçues:", JSON.stringify(data, null, 2));

    // Validation avec Zod
    try {
      ajouterProfesseurSchema.parse(data);
    } catch (validationError: any) {
      console.log("⚠️ [Handler] Erreur de validation:", validationError.errors);
      if (validationError instanceof z.ZodError) {
        throw new ValidationError(
          "Données invalides",
          formatZodErrors(validationError.errors),
        );
      }
      throw validationError;
    }

    // Ajouter/promouvoir le(s) professeur(s)
    const result = await ajouterProfesseur(data, professeursClient);

    console.log("📊 [Handler] Résultat promotion:", result);

    // Si la promotion a réussi, envoyer les emails
    if (result.isConfirm || result.success) {
      console.log("✅ [Handler] Promotion réussie, envoi des emails...");

      try {
        // Extraire les IDs des utilisateurs
        const userIds = extraireIdsUtilisateurs(data);

        console.log(
          `📝 [Handler] ${userIds.length} IDs utilisateurs extraits pour l'envoi d'emails:`,
          userIds,
        );

        const client = professeursClient || new Professeurs();
        const emailClientToUse = emailClientInstance || emailClient;

        // Envoyer un email à chaque utilisateur promu
        for (const userId of userIds) {
          try {
            console.log(
              `🔍 [Handler] Traitement de l'utilisateur ID: ${userId}`,
            );

            // Récupérer les données complètes de l'utilisateur depuis la base
            const utilisateurComplet =
              await client.obtenirUtilisateurParId(userId);

            if (utilisateurComplet) {
              console.log(
                `📧 [Handler] Envoi email de promotion à ${utilisateurComplet.email} (ID: ${userId})`,
              );

              // Utiliser EmailClient pour envoyer l'email
              const emailResult = await emailClientToUse.sendPromotionEmail(
                utilisateurComplet,
                {
                  templateName: "promotion-professeur",
                  variables: {
                    customMessage: "Bienvenue dans l'équipe des professeurs !",
                    supportEmail:
                      process.env.SUPPORT_EMAIL || "support@clubmanager.com",
                  },
                },
              );

              if (emailResult.success) {
                console.log(
                  `✅ [Handler] Email de promotion envoyé avec succès à ${utilisateurComplet.email}`,
                );
              } else {
                console.error(
                  `❌ [Handler] Erreur envoi email à ${utilisateurComplet.email}:`,
                  emailResult.error,
                );
              }
            } else {
              console.warn(
                `⚠️ [Handler] Utilisateur avec ID ${userId} non trouvé pour l'envoi d'email`,
              );
            }
          } catch (emailError) {
            console.error(
              `❌ [Handler] Erreur envoi email pour utilisateur ID ${userId}:`,
              emailError,
            );
            // On ne fait pas échouer la promotion pour une erreur d'email
          }
        }

        console.log("📧 [Handler] Processus d'envoi des emails terminé");
      } catch (emailError) {
        console.error(
          "❌ [Handler] Erreur générale lors de l'envoi des emails:",
          emailError,
        );
        // On ne fait pas échouer la promotion pour une erreur d'email
      }
    }

    return res.status(200).json({
      success: result.isConfirm || result.success,
      message: result.message || "Professeur(s) promu(s) avec succès",
      data: result.data || result,
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur lors de l'ajout/promotion:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la promotion des professeurs",
      error instanceof Error ? error : undefined,
    );
  }
}
