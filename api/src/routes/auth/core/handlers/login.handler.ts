import { Request, Response } from "express";
import { Auth } from "../../../../db/clients/auth/auth.js";
import { generateToken } from "../../../../middleware/auth.js";
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour la connexion
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Email et mot de passe requis");
    }

    const authClient = new Auth();
    const result = await authClient.authentifierUtilisateur(email, password);

    if (!result.success) {
      throw new AuthenticationError(
        result.message || "Email ou mot de passe incorrect",
      );
    }

    if (!result.user) {
      throw new NotFoundError("Utilisateur non trouvé");
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

    // Re-throw si c'est déjà une erreur applicative
    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }

    // Sinon, wrapper dans InternalServerError
    throw new InternalServerError(
      "Erreur serveur lors de la connexion",
      error instanceof Error ? error : undefined,
    );
  }
}
