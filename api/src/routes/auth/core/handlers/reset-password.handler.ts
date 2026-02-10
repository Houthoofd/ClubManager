import { Request, Response } from "express";
import { Auth } from "../../../../db/clients/auth/auth.js";
import {
  ValidationError,
  AuthenticationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour réinitialiser le mot de passe
 */
export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError("Token et nouveau mot de passe requis");
    }

    console.log(
      "🔄 [Auth] Réinitialisation mot de passe avec token:",
      token.substring(0, 10) + "...",
    );

    const authClient = new Auth();

    // Vérifier que le token est valide
    const tokenData = await authClient.verifierTokenRecuperation(token);

    if (!tokenData) {
      throw new AuthenticationError("Token invalide ou expiré");
    }

    // Valider le nouveau mot de passe
    const validation = Auth.validerMotDePasse(newPassword);
    if (!validation.valid) {
      throw new ValidationError("Mot de passe invalide", validation.errors);
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await Auth.hasherMotDePasse(newPassword);

    // Réinitialiser le mot de passe avec le token
    const result = await authClient.reinitialiserMotDePasseAvecToken(
      token,
      hashedPassword,
    );

    if (!result.isConfirm) {
      throw new InternalServerError(
        result.message || "Erreur lors de la réinitialisation",
      );
    }

    console.log(
      "✅ [Auth] Mot de passe réinitialisé pour l'utilisateur ID:",
      tokenData.user_id,
    );

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error: any) {
    console.error("❌ [Auth] Erreur reset-password:", error);

    // Re-throw si c'est déjà une erreur applicative
    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError ||
      error instanceof InternalServerError
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
