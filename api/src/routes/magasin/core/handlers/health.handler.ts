import { Request, Response } from "express";
import { z } from "zod";
import { calculerStatistiquesMagasin } from "../services/index.js";
import { getStatistiquesMagasinSchema } from "../validators/index.js";
import { Magasin } from "../../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Handler pour le health check du module magasin
 * GET /api/magasin/health
 */
export async function healthCheck(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("🏥 [Handler Health] Health check du module magasin");

    const health = {
      status: "healthy",
      module: "magasin",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      features: {
        articles: true,
        categories: true,
        commandes: true,
        paiements: true,
        tailles: true,
        statistiques: true,
      },
    };

    console.log("✅ [Handler Health] Module magasin en bonne santé");

    res.status(200).json(health);
  } catch (error) {
    console.error("❌ [Handler Health] Erreur health check:", error);
    res.status(500).json({
      status: "unhealthy",
      module: "magasin",
      error: error instanceof Error ? error.message : "Erreur inconnue",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler pour récupérer les statistiques du magasin
 * GET /api/magasin/statistiques
 */
export async function getStatistiquesMagasin(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log(
      "📊 [Handler Statistiques] Récupération des statistiques du magasin",
    );

    // Validation des paramètres optionnels
    const validatedQuery = getStatistiquesMagasinSchema.parse(req.query);

    const statistiques = await calculerStatistiquesMagasin(
      validatedQuery.dateDebut,
      validatedQuery.dateFin,
      paiementsClient,
    );

    console.log(
      "✅ [Handler Statistiques] Statistiques récupérées avec succès",
    );

    res.status(200).json({
      success: true,
      data: statistiques,
      periode: {
        debut: validatedQuery.dateDebut || "Tout",
        fin: validatedQuery.dateFin || "Tout",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "❌ [Handler Statistiques] Erreur de validation:",
        error.errors,
      );
      res.status(400).json({
        message: "Erreur de validation des paramètres",
        errors: error.errors,
      });
      return;
    }

    console.error(
      "❌ [Handler Statistiques] Erreur récupération statistiques:",
      error,
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour le diagnostic détaillé du module magasin
 * GET /api/magasin/diagnostic
 */
export async function getDiagnostic(
  req: Request,
  res: Response,
  magasinClient?: Magasin,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("🔍 [Handler Diagnostic] Diagnostic du module magasin");

    const { default: MysqlConnector } =
      await import("../../../../db/connector/mysqlconnector.js");
    const mysqlConnector = MysqlConnector.getInstance();

    // Vérifier la structure de la table articles
    const articlesStructureQuery = `DESCRIBE articles`;
    const articlesStructure = await new Promise((resolve, reject) => {
      mysqlConnector.query(
        articlesStructureQuery,
        [],
        (error: any, results: any) => {
          if (error) reject(error);
          else resolve(results);
        },
      );
    });

    // Vérifier la structure de la table commandes
    const commandesStructureQuery = `DESCRIBE commandes`;
    const commandesStructure = await new Promise((resolve, reject) => {
      mysqlConnector.query(
        commandesStructureQuery,
        [],
        (error: any, results: any) => {
          if (error) reject(error);
          else resolve(results);
        },
      );
    });

    // Vérifier la structure de la table tailles
    const taillesStructureQuery = `DESCRIBE tailles`;
    const taillesStructure = await new Promise((resolve, reject) => {
      mysqlConnector.query(
        taillesStructureQuery,
        [],
        (error: any, results: any) => {
          if (error) reject(error);
          else resolve(results);
        },
      );
    });

    // Compter les articles
    const articlesCountQuery = `SELECT COUNT(*) as count FROM articles`;
    const articlesCount = await new Promise((resolve, reject) => {
      mysqlConnector.query(
        articlesCountQuery,
        [],
        (error: any, results: any) => {
          if (error) reject(error);
          else resolve(results[0].count);
        },
      );
    });

    // Compter les commandes
    const commandesCountQuery = `SELECT COUNT(*) as count FROM commandes`;
    const commandesCount = await new Promise((resolve, reject) => {
      mysqlConnector.query(
        commandesCountQuery,
        [],
        (error: any, results: any) => {
          if (error) reject(error);
          else resolve(results[0].count);
        },
      );
    });

    // Compter les tailles
    const taillesCountQuery = `SELECT COUNT(*) as count FROM tailles`;
    const taillesCount = await new Promise((resolve, reject) => {
      mysqlConnector.query(
        taillesCountQuery,
        [],
        (error: any, results: any) => {
          if (error) reject(error);
          else resolve(results[0].count);
        },
      );
    });

    console.log("✅ [Handler Diagnostic] Diagnostic complété avec succès");

    res.status(200).json({
      status: "success",
      module: "magasin",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        tables: {
          articles: {
            exists: true,
            structure: articlesStructure,
            count: articlesCount,
          },
          commandes: {
            exists: true,
            structure: commandesStructure,
            count: commandesCount,
          },
          tailles: {
            exists: true,
            structure: taillesStructure,
            count: taillesCount,
          },
        },
      },
      recommendations: [
        "Vérifier régulièrement le stock des articles",
        "Surveiller les commandes en attente",
        "Mettre à jour les tailles disponibles si nécessaire",
      ],
    });
  } catch (error) {
    console.error("❌ [Handler Diagnostic] Erreur diagnostic:", error);
    res.status(500).json({
      status: "error",
      module: "magasin",
      message: "Erreur lors du diagnostic",
      error: error instanceof Error ? error.message : "Erreur inconnue",
      timestamp: new Date().toISOString(),
    });
  }
}
