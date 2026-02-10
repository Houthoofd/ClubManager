/**
 * Handler GET /api/upload/health
 * Health check du module Upload
 */

import { Request, Response } from "express";
import {
  getUploadDirectoryStats,
  ensureUploadDirectory,
} from "../services/upload.service.js";
import path from "path";
import { fileURLToPath } from "url";
import { InternalServerError } from "../../../../shared/errors/GraphQLErrors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handler pour le health check du module Upload
 * GET /api/upload/health
 *
 * @returns 200 - Service opérationnel
 * @returns 503 - Service dégradé ou non opérationnel
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    console.log("🏥 [Handler Upload] GET /health - Vérification de santé");

    const uploadsDir = path.join(__dirname, "../../../../public/uploads");

    const checks = {
      directory: false,
      writable: false,
      stats: false,
    };

    let directoryStats;

    // Vérifier que le dossier existe ou peut être créé
    const dirCheck = ensureUploadDirectory(uploadsDir);
    checks.directory = dirCheck.success;

    // Vérifier qu'on peut obtenir les statistiques
    if (checks.directory) {
      const statsResult = getUploadDirectoryStats(uploadsDir);
      checks.stats = statsResult.success;
      if (statsResult.success) {
        directoryStats = statsResult.stats;
      }
    }

    // Vérifier les permissions d'écriture
    try {
      const testFile = path.join(uploadsDir, ".health-check");
      const fs = await import("fs");
      fs.writeFileSync(testFile, "health check", "utf8");
      fs.unlinkSync(testFile);
      checks.writable = true;
    } catch (writeError) {
      console.warn("⚠️ [Handler Upload] Erreur d'écriture:", writeError);
      checks.writable = false;
    }

    const healthyCount = Object.values(checks).filter(Boolean).length;

    if (healthyCount === 3) {
      console.log("✅ [Handler Upload] Service opérationnel");
      res.status(200).json({
        status: "healthy",
        checks,
        message: "Service d'upload opérationnel",
        data: {
          uploadDirectory: uploadsDir,
          stats: directoryStats,
        },
      });
    } else if (healthyCount >= 1) {
      console.warn("⚠️ [Handler Upload] Service dégradé");
      res.status(200).json({
        status: "degraded",
        checks,
        message: `${healthyCount}/3 vérifications réussies`,
        data: {
          uploadDirectory: uploadsDir,
          stats: directoryStats,
        },
      });
    } else {
      console.error("❌ [Handler Upload] Service non opérationnel");
      res.status(503).json({
        status: "unhealthy",
        checks,
        message: "Service d'upload non opérationnel",
        data: {
          uploadDirectory: uploadsDir,
        },
      });
    }
  } catch (error: any) {
    console.error("❌ [Handler Upload] Erreur lors du health check:", error);

    throw new InternalServerError(
      "Erreur lors du health check du module Upload",
      error,
    );
  }
}
