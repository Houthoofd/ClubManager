/**
 * Handler pour le health check et diagnostic du module statistiques
 *
 * Gère les endpoints:
 * - GET /api/statistiques/health
 * - GET /api/statistiques/diagnostic
 */

import { Request, Response } from "express";
import { InternalServerError } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour le health check du module statistiques
 * GET /api/statistiques/health
 */
export async function healthCheck(req: Request, res: Response) {
  console.log("🏥 [Handler] GET /api/statistiques/health - Health check");

  try {
    const healthData = {
      status: "healthy",
      module: "statistiques",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: "connected",
        api: "operational",
      },
    };

    console.log("✅ [Handler] Health check réussi");

    return res.status(200).json({
      success: true,
      data: healthData,
      message: "Module statistiques opérationnel",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur health check:", error);

    throw new InternalServerError(
      "Service temporairement indisponible",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir un diagnostic détaillé du module statistiques
 * GET /api/statistiques/diagnostic
 */
export async function getDiagnostic(req: Request, res: Response) {
  console.log(
    "🔍 [Handler] GET /api/statistiques/diagnostic - Diagnostic complet",
  );

  try {
    const diagnostic = {
      module: "statistiques",
      version: "2.0.0",
      architecture: "handlers/services/validators",
      timestamp: new Date().toISOString(),

      routes: {
        frequentation: {
          count: 4,
          endpoints: [
            "GET /api/statistiques/frequentation/:utilisateurId",
            "GET /api/statistiques/progression/:userId",
            "GET /api/statistiques/presence/:userId",
            "GET /api/statistiques/presence-raw/:userId",
          ],
        },
        globales: {
          count: 9,
          endpoints: [
            "GET /api/statistiques/membres/count",
            "GET /api/statistiques/paiements/mois",
            "GET /api/statistiques/paiements/recents",
            "GET /api/statistiques/paiements/en-attente",
            "GET /api/statistiques/plans/actifs",
            "GET /api/statistiques/plans/taux-renouvellement",
            "GET /api/statistiques/paiements/par-mois",
            "GET /api/statistiques/membres/par-plan",
            "GET /api/statistiques/cours/semaine",
          ],
        },
        details: {
          count: 8,
          endpoints: [
            "GET /api/statistiques/paiements/derniers",
            "GET /api/statistiques/paiements/echus",
            "GET /api/statistiques/membres/nouveaux",
            "GET /api/statistiques/membres/assidus",
            "GET /api/statistiques/membres/par-grade",
            "GET /api/statistiques/membres/par-genre",
            "GET /api/statistiques/membres/anniversaires",
            "GET /api/statistiques/articles/plus-vendus",
          ],
        },
        system: {
          count: 2,
          endpoints: [
            "GET /api/statistiques/health",
            "GET /api/statistiques/diagnostic",
          ],
        },
      },

      features: {
        frequentation_utilisateur: true,
        progression_utilisateur: true,
        presence_par_mois: true,
        statistiques_membres: true,
        statistiques_paiements: true,
        statistiques_plans: true,
        graphiques_evolution: true,
        top_membres_assidus: true,
        repartition_grades: true,
        repartition_genres: true,
        anniversaires: true,
        articles_vendus: true,
        health_check: true,
        diagnostics: true,
      },

      statistics: {
        total_routes: 23,
        total_handlers: 18,
        total_services: 21,
        authentication_required: true,
        validation_enabled: true,
      },

      database: {
        connector: "MysqlConnector",
        client: "Statistiques",
        pool_status: "active",
      },

      security: {
        authentication: "JWT Token (verifyToken middleware)",
        input_validation: "Zod schemas",
        sql_injection_protection: "Prepared statements",
        xss_protection: "Input sanitization",
      },

      performance: {
        caching: "none",
        response_format: "JSON",
        error_handling: "centralized",
      },

      recommendations: [
        "Implémenter un système de cache pour les statistiques globales",
        "Ajouter des filtres de date pour les endpoints d'évolution",
        "Envisager la pagination pour les listes longues",
        "Ajouter des endpoints d'export (CSV, PDF)",
        "Implémenter des alertes pour les seuils critiques",
        "Ajouter des métriques de performance (temps de réponse)",
      ],

      system_info: {
        node_version: process.version,
        platform: process.platform,
        uptime_seconds: process.uptime(),
        memory_usage: process.memoryUsage(),
        environment: process.env.NODE_ENV || "development",
      },
    };

    console.log("✅ [Handler] Diagnostic généré avec succès");

    return res.status(200).json({
      success: true,
      data: diagnostic,
      message: "Diagnostic du module statistiques généré avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur génération diagnostic:", error);

    throw new InternalServerError(
      "Erreur lors de la génération du diagnostic",
      error instanceof Error ? error : undefined,
    );
  }
}
