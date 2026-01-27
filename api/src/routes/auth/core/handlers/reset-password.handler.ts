import { Request, Response } from "express";
import { Auth } from "../../../../db/clients/auth/auth.js";

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
      res.status(400).json({ error: "Token et nouveau mot de passe requis" });
      return;
    }

    console.log(
      "🔄 [Auth] Réinitialisation mot de passe avec token:",
      token.substring(0, 10) + "...",
    );

    const authClient = new Auth();

    // Vérifier que le token est valide
    const tokenData = await authClient.verifierTokenRecuperation(token);

    if (!tokenData) {
      res.status(400).json({ error: "Token invalide ou expiré" });
      return;
    }

    // Valider le nouveau mot de passe
    const validation = Auth.validerMotDePasse(newPassword);
    if (!validation.valid) {
      res.status(400).json({
        error: "Mot de passe invalide",
        details: validation.errors,
      });
      return;
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await Auth.hasherMotDePasse(newPassword);

    // Réinitialiser le mot de passe avec le token
    const result = await authClient.reinitialiserMotDePasseAvecToken(
      token,
      hashedPassword,
    );

    if (!result.isConfirm) {
      res
        .status(500)
        .json({
          error: result.message || "Erreur lors de la réinitialisation",
        });
      return;
    }

    console.log(
      "✅ [Auth] Mot de passe réinitialisé pour l'utilisateur ID:",
      tokenData.user_id,
    );

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error: any) {
    console.error("❌ [Auth] Erreur reset-password:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
