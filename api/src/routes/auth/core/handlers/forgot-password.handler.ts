import { Request, Response } from "express";
import { Auth } from "../../../../db/clients/auth/auth.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  EmailError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour la demande de réinitialisation de mot de passe
 */
export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("Email requis");
    }

    console.log("🔄 [Auth] Demande réinitialisation mot de passe pour:", email);

    const authClient = new Auth();

    // Vérifier si l'utilisateur existe
    const userExists = await authClient.emailExiste(email);

    if (!userExists) {
      // Ne pas révéler que l'email n'existe pas pour des raisons de sécurité
      res.json({
        message:
          "Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.",
      });
      return;
    }

    // Rechercher l'utilisateur
    const user = await authClient.rechercherUtilisateurParEmail(email);

    if (!user) {
      res.json({
        message:
          "Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.",
      });
      return;
    }

    // Générer et créer le token de récupération
    const resetToken = Auth.genererTokenSecurise();
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure
    const tokenResult = await authClient.creerTokenRecuperation(
      user.id,
      resetToken,
      expiresAt,
    );

    if (!tokenResult.isConfirm) {
      console.error("❌ [Auth] Erreur création token:", tokenResult.message);
      throw new Error(
        "Erreur lors de la création du token de réinitialisation",
      );
    }

    console.log("✅ [Auth] Token de réinitialisation créé");

    // Envoyer l'email de réinitialisation
    try {
      const { EmailClient } =
        await import("../../../../db/clients/messagerie/emailClient.js");
      const emailClient = EmailClient.getInstance();

      await emailClient.envoyerResetPassword(
        user.email,
        user.first_name,
        resetToken,
      );

      console.log("✅ [Auth] Email de réinitialisation envoyé à:", email);
    } catch (emailError) {
      console.error("❌ [Auth] Erreur envoi email:", emailError);
      throw new EmailError(
        "Impossible d'envoyer l'email de réinitialisation",
        emailError instanceof Error ? emailError : undefined,
      );
    }

    res.json({
      message:
        "Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.",
    });
  } catch (error: any) {
    console.error("❌ [Auth] Erreur forgot-password:", error);

    // Re-throw si c'est déjà une erreur applicative
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof EmailError
    ) {
      throw error;
    }

    // Sinon, wrapper dans InternalServerError
    throw new InternalServerError(
      "Erreur serveur lors de la réinitialisation du mot de passe",
      error instanceof Error ? error : undefined,
    );
  }
}
