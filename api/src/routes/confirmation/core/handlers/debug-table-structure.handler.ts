/**
 * Handler pour le debug de la structure de table
 */

import { Request, Response } from "express";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Vérifie et retourne la structure de la table commandes
 */
export async function debugTableStructure(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const paiements = new Paiements();

    // Vérifier la structure de la table commandes
    const describeQuery = "DESCRIBE commandes";
    const tableStructure = await paiements.queryAsync(describeQuery, []);

    console.log(
      "🔍 [DebugTableStructure] Structure réelle table commandes:",
      tableStructure
    );

    res.json({
      table: "commandes",
      columns: tableStructure.map((col: any) => ({
        field: col.Field,
        type: col.Type,
        null: col.Null,
        key: col.Key,
        default: col.Default,
        extra: col.Extra,
      })),
      structure_connue: {
        colonnes_disponibles: [
          "id (INT AUTO_INCREMENT PRIMARY KEY)",
          "unique_id (VARCHAR(255) NULL)",
          "numero_commande (VARCHAR(100) NULL)",
          "utilisateur_id (INT NOT NULL)",
          "total (DECIMAL(10, 2) NOT NULL DEFAULT 0.00)",
          "date_commande (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
          "statut (ENUM: en attente, payée, expédiée, annulée)",
          "ip_address (VARCHAR(45) NULL)",
          "user_agent (TEXT NULL)",
          "created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        ],
        statut_enum: ["en attente", "payée", "expédiée", "annulée"],
        indexes: [
          "idx_utilisateur_statut (utilisateur_id, statut)",
          "idx_unique_id (unique_id)",
          "idx_numero_commande (numero_commande)",
          "idx_created_at (created_at)",
        ],
      },
      hasDatePaiement: tableStructure.some(
        (col: any) => col.Field === "date_paiement"
      ),
      solution_implementee: {
        pour_tracer_paiement: "Utiliser table paiements avec date_paiement",
        statut_commande: "Mettre à jour statut = 'payée'",
        colonnes_utilisees: ["statut"],
        pas_de_modification_table: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(
      "❌ [DebugTableStructure] Erreur vérification structure:",
      error
    );
    res.status(500).json({
      error: "Erreur lors de la vérification de la structure",
      details: error.message,
    });
  }
}
