import { Request, Response } from "express";
import { z } from "zod";
import { obtenirTailles } from "../services/index.js";
import { getTaillesSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { InternalServerError } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer toutes les tailles disponibles
 * GET /api/magasin/tailles
 */
export async function getTailles(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("📋 [Handler Tailles] Récupération de toutes les tailles");

    const tailles = await obtenirTailles(paiementsClient);

    console.log(`✅ [Handler Tailles] ${tailles.length} tailles récupérées`);

    res.status(200).json(tailles);
  } catch (error) {
    console.error("❌ [Handler Tailles] Erreur récupération tailles:", error);
    throw new InternalServerError("Erreur lors de la récupération des tailles");
  }
}
