import { Request, Response } from "express";
import { Compte } from "../../../../db/clients/compte/compte.js";
import {
  hashPassword,
  verifyPassword,
} from "../../../../shared/utils/password.helpers.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour créer un mot de passe (si le compte n'en a pas)
 */
export async function createPassword(
  req: Request,
  res: Response,
  compteClient?: Compte,
): Promise<void> {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      throw new ValidationError("L'id et le mot de passe sont requis.");
    }

    // Hash du mot de passe
    const hash = await hashPassword(password);

    const client = compteClient || new Compte();
    const result = await client.mettreAJourMotDePasse(id, hash, true); // true = création

    if (result.isConfirm) {
      res.status(200).json({
        success: true,
        message: "Mot de passe créé avec succès.",
      });
    } else {
      throw new ValidationError("Échec de la création du mot de passe.");
    }
  } catch (error) {
    console.error("❌ [Create Password] Erreur:", error);

    // Re-throw si c'est déjà une erreur applicative
    if (error instanceof ValidationError) {
      throw error;
    }

    // Sinon, wrapper dans InternalServerError
    throw new InternalServerError(
      "Erreur serveur lors de la création du mot de passe",
      error instanceof Error ? error : undefined,
    );
  }
}
