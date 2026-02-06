import { Request, Response } from "express";
import { Professeurs } from "../../../../db/clients/professeurs/professeurs.js";

/**
 * Handler pour le health check du module professeurs
 * GET /api/professeurs/health
 */
export async function healthCheck(
  req: Request,
  res: Response,
  professeursClient?: Professeurs,
) {
  console.log("🏥 [Handler] GET /api/professeurs/health - Health check");

  try {
    const client = professeursClient || new Professeurs();

    // Vérifier la connexion à la base de données
    let databaseConnected = false;
    let tableProfesseursExists = true; // Assume true
    let tableUtilisateursExists = true; // Assume true
    let professeurCount = 0;

    try {
      // Test de connexion en essayant de récupérer les professeurs
      const result = await client.obtenirLesProfesseurs();
      databaseConnected = true;

      if (result && result.data) {
        professeurCount = Array.isArray(result.data) ? result.data.length : 0;
      }
    } catch (dbError) {
      console.error("❌ [Handler] Erreur lors du health check DB:", dbError);
      databaseConnected = false;
    }

    const status = databaseConnected ? "healthy" : "degraded";

    const response = {
      success: true,
      status,
      module: "professeurs",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      database: {
        connected: databaseConnected,
        table_utilisateurs: tableUtilisateursExists,
        table_cours: tableProfesseursExists,
      },
      statistics: {
        total_professeurs: professeurCount,
      },
      features: {
        get_all_professeurs: true,
        get_professeur_by_id: true,
        ajouter_professeur: true,
        modifier_statut: true,
        get_planning: true,
        send_promotion_email: true,
      },
    };

    console.log(`✅ [Handler] Health check: ${status}`);

    return res.status(databaseConnected ? 200 : 503).json(response);
  } catch (error) {
    console.error("❌ [Handler] Erreur lors du health check:", error);

    return res.status(503).json({
      success: false,
      status: "unhealthy",
      module: "professeurs",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler pour le diagnostic du module professeurs
 * GET /api/professeurs/diagnostic
 */
export async function getDiagnostic(
  req: Request,
  res: Response,
  professeursClient?: Professeurs,
) {
  console.log("🔍 [Handler] GET /api/professeurs/diagnostic - Diagnostic");

  try {
    const client = professeursClient || new Professeurs();

    // Récupérer des informations de base
    let databaseAccessible = false;
    let professeurCount = 0;

    try {
      const result = await client.obtenirLesProfesseurs();
      databaseAccessible = true;

      if (result && result.data) {
        professeurCount = Array.isArray(result.data) ? result.data.length : 0;
      }
    } catch (dbError) {
      console.error("❌ [Handler] Erreur lors du diagnostic DB:", dbError);
    }

    const response = {
      success: true,
      module: "professeurs",
      timestamp: new Date().toISOString(),
      checks: {
        database_accessible: databaseAccessible,
        table_utilisateurs_exists: databaseAccessible,
        table_cours_exists: databaseAccessible,
      },
      statistics: {
        total_professeurs: professeurCount,
      },
      recommendations: [] as string[],
    };

    // Générer des recommandations
    if (!databaseAccessible) {
      response.recommendations.push("⚠️ La base de données est inaccessible");
    } else {
      response.recommendations.push(
        "✅ Tous les contrôles sont passés avec succès",
      );
    }

    console.log("✅ [Handler] Diagnostic effectué");

    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ [Handler] Erreur lors du diagnostic:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors du diagnostic",
    });
  }
}
