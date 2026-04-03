import { Request, Response } from "express";
import { Auth } from "../../../../db/clients/auth/auth.js";
import { generateToken } from "../../../../middleware/auth.js";

/**
 * Handler pour la connexion
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "UserId et mot de passe requis",
      });
      return;
    }

    const authClient = new Auth();
    const result = await authClient.authentifierUtilisateur(email, password);

    if (!result.success) {
      res.status(401).json({
        success: false,
        message: result.message || "Email ou mot de passe incorrect",
      });
      return;
    }

    if (!result.user) {
      res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }

    // Générer le token JWT
    const token = generateToken({
      id: result.user.id,
      email: result.user.email,
      first_name: result.user.first_name,
      last_name: result.user.last_name,
      status_id: result.user.status_id,
      role: result.user.status,
      status: result.user.status,
    });

    // Définir le cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? "clubmanagment.com"
          : "localhost",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        user: result.user,
        token,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
}
