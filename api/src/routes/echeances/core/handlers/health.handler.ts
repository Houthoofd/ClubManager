import { Request, Response } from "express";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Handler pour le health check du module échéances
 * GET /api/echeances/health
 *
 * Vérifie que le module est opérationnel et que la connexion à la base de données fonctionne
 */
export async function healthCheck(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("🏥 [Handler Échéances] Health check en cours...");

    const client = paiementsClient || new Paiements();

    // Test de connexion à la base de données
    const testQuery = "SELECT 1 as test";
    const result = await client.queryAsync(testQuery, []);

    const isDbConnected = result && result.length > 0 && result[0].test === 1;

    // Vérifier la structure de la table echeances_paiements
    let tableExists = false;
    try {
      const tableCheck = await client.queryAsync(
        "SHOW TABLES LIKE 'echeances_paiements'",
        [],
      );
      tableExists = tableCheck && tableCheck.length > 0;
    } catch (error) {
      console.warn(
        "⚠️ [Handler Échéances] Impossible de vérifier la table:",
        error,
      );
    }

    const health = {
      status: isDbConnected && tableExists ? "healthy" : "degraded",
      module: "echeances",
      version: "2.0.0",
      architecture: "handlers/services/validators",
      database: {
        connected: isDbConnected,
        table_echeances_paiements: tableExists,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("✅ [Handler Échéances] Health check:", health);

    const statusCode = health.status === "healthy" ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === "healthy",
      ...health,
    });
  } catch (error) {
    console.error("❌ [Handler Échéances] Erreur health check:", error);

    res.status(503).json({
      success: false,
      status: "unhealthy",
      module: "echeances",
      error: error instanceof Error ? error.message : "Erreur inconnue",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler pour obtenir un diagnostic détaillé de la table echeances_paiements
 * GET /api/echeances/diagnostic
 *
 * Fournit des informations détaillées sur la structure de la table et les contraintes
 */
export async function getDiagnostic(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("🔍 [Handler Échéances] Diagnostic détaillé en cours...");

    const client = paiementsClient || new Paiements();

    // 1. Vérifier la structure de la table
    const describeQuery = "DESCRIBE echeances_paiements";
    const tableStructure = await client.queryAsync(describeQuery, []);

    // 2. Vérifier les contraintes
    const constraintsQuery = `
      SELECT
        CONSTRAINT_NAME,
        CONSTRAINT_TYPE,
        TABLE_NAME,
        COLUMN_NAME
      FROM information_schema.TABLE_CONSTRAINTS tc
      LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
        AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
      WHERE tc.TABLE_NAME = 'echeances_paiements'
        AND tc.TABLE_SCHEMA = DATABASE()
    `;
    const constraints = await client.queryAsync(constraintsQuery, []);

    // 3. Vérifier les index
    const indexQuery = "SHOW INDEX FROM echeances_paiements";
    const indexes = await client.queryAsync(indexQuery, []);

    // 4. Vérifier s'il y a une contrainte problématique
    const constrainteProblematique = constraints.find(
      (c: any) =>
        c.CONSTRAINT_NAME &&
        c.CONSTRAINT_NAME.includes("utilisateur_periode_abonnement"),
    );

    // 5. Compter le nombre d'échéances par statut
    const statsQuery = `
      SELECT
        statut,
        COUNT(*) as count,
        SUM(montant) as total_montant
      FROM echeances_paiements
      GROUP BY statut
    `;
    const stats = await client.queryAsync(statsQuery, []);

    // 6. Compter le nombre total d'échéances
    const totalQuery = "SELECT COUNT(*) as total FROM echeances_paiements";
    const totalResult = await client.queryAsync(totalQuery, []);
    const totalEcheances = totalResult[0]?.total || 0;

    const diagnostic = {
      table: "echeances_paiements",
      structure_attendue: {
        colonnes: [
          "id (INT AUTO_INCREMENT PRIMARY KEY)",
          "utilisateur_id (INT NOT NULL)",
          "abonnement_id (INT)",
          "date_echeance (DATE NOT NULL)",
          "montant (DECIMAL(10, 2) NOT NULL)",
          "statut (ENUM: 'en attente', 'payé', 'échu')",
          "date_creation (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
          "date_paiement (DATE)",
          "stripe_payment_intent_id (VARCHAR(255))",
          "description (VARCHAR(255))",
        ],
        contraintes_attendues: [
          "PRIMARY KEY (id)",
          "FOREIGN KEY (utilisateur_id) → utilisateurs(id)",
          "FOREIGN KEY (abonnement_id) → plans_tarifaires(id)",
        ],
        contraintes_NON_attendues: [
          "uk_utilisateur_periode_abonnement (cette contrainte est pour la table paiements)",
        ],
      },
      structure_reelle: {
        colonnes: tableStructure.map((col: any) => ({
          Field: col.Field,
          Type: col.Type,
          Null: col.Null,
          Key: col.Key,
          Default: col.Default,
          Extra: col.Extra,
        })),
        contraintes: constraints.map((c: any) => ({
          name: c.CONSTRAINT_NAME,
          type: c.CONSTRAINT_TYPE,
          column: c.COLUMN_NAME,
        })),
        indexes: indexes.map((idx: any) => ({
          name: idx.Key_name,
          column: idx.Column_name,
          unique: idx.Non_unique === 0,
        })),
      },
      statistiques: {
        total_echeances: totalEcheances,
        par_statut: stats.map((s: any) => ({
          statut: s.statut,
          count: s.count,
          total_montant: parseFloat(s.total_montant || 0),
        })),
      },
      probleme_detecte: !!constrainteProblematique,
      contrainte_problematique: constrainteProblematique
        ? {
            name: constrainteProblematique.CONSTRAINT_NAME,
            type: constrainteProblematique.CONSTRAINT_TYPE,
            column: constrainteProblematique.COLUMN_NAME,
          }
        : null,
      solution: constrainteProblematique
        ? "Supprimer la contrainte uk_utilisateur_periode_abonnement de cette table car elle appartient à la table paiements"
        : "Structure normale détectée",
      commande_fix: constrainteProblematique
        ? `ALTER TABLE echeances_paiements DROP INDEX ${constrainteProblematique.CONSTRAINT_NAME};`
        : null,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ [Handler Échéances] Diagnostic effectué");

    res.status(200).json({
      success: true,
      diagnostic,
      message: constrainteProblematique
        ? "⚠️ PROBLÈME DÉTECTÉ: Contrainte inappropriée sur la table echeances_paiements"
        : "✅ Structure de table normale",
    });
  } catch (error) {
    console.error("❌ [Handler Échéances] Erreur diagnostic:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors du diagnostic",
      error: error instanceof Error ? error.message : "Erreur inconnue",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler pour le diagnostic des contraintes de la table
 * GET /api/echeances/debug/table-constraints
 *
 * Alias pour getDiagnostic pour compatibilité avec l'ancien système
 */
export async function getTableConstraints(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  // Réutiliser la fonction getDiagnostic
  return getDiagnostic(req, res, paiementsClient);
}
