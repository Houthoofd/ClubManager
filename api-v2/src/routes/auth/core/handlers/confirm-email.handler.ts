import { Request, Response } from "express";
import { Auth } from "../../../../db/clients/auth/auth.js";

/**
 * Handler pour confirmer l'email
 * TODO: Implémenter la validation d'email avec le système de tokens
 */
export async function confirmEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token, userId } = req.query;

    if (!token || !userId) {
      res.status(400).json({
        success: false,
        error: "Token et userId requis dans les paramètres de requête",
      });
      return;
    }

    console.log("🔍 [Auth] Validation token email:", {
      token: (token as string).substring(0, 8) + "...",
      userId,
    });

    // TODO: Implémenter la vérification du token email
    // Pour l'instant, on accepte tous les tokens pour permettre le développement
    const authClient = new Auth();

    try {
      // Marquer l'email comme vérifié dans la base de données
      await authClient.queryAsync(
        "UPDATE utilisateurs SET email_verified = 1 WHERE id = ?",
        [parseInt(userId as string)],
      );

      console.log(
        "✅ [Auth] Email confirmé avec succès pour l'utilisateur:",
        userId,
      );

      const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/pages/connexion?verified=true&message=${encodeURIComponent("Email vérifié avec succès")}`;

      res.redirect(redirectUrl);
    } catch (dbError) {
      console.error("❌ [Auth] Erreur lors de la mise à jour:", dbError);

      const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/pages/connexion?error=invalid_token&message=${encodeURIComponent("Erreur lors de la validation")}`;

      res.redirect(redirectUrl);
    }
  } catch (error: any) {
    console.error("❌ [Auth] Erreur confirmation email:", error);

    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/pages/connexion?error=server_error&message=${encodeURIComponent("Erreur serveur lors de la validation")}`;

    res.redirect(redirectUrl);
  }
}
