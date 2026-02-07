import MysqlConnector from "../../../../db/connector/mysqlconnector.js";

/**
 * Service pour gérer la promotion du statut utilisateur
 * Gère la promotion automatique visiteur → utilisateur sur premier paiement
 */

export interface StatusUpgradeResult {
  upgraded: boolean;
  ancien_statut?: string;
  nouveau_statut?: string;
  message: string;
}

export class StatusUpgradeServiceClass {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
    console.log("✅ [Service Status Upgrade] Service initialisé");
  }

  /**
   * Promouvoir un utilisateur si nécessaire (visiteur → utilisateur)
   */
  async upgraderStatutUtilisateur(
    userId: number,
    estPremierPaiement: boolean,
  ): Promise<StatusUpgradeResult> {
    if (!estPremierPaiement) {
      return {
        upgraded: false,
        message: "Pas de promotion nécessaire (pas le premier paiement)",
      };
    }

    console.log(
      `🔄 [Service Status Upgrade] Vérification promotion utilisateur ${userId}`,
    );

    try {
      // Récupérer le statut actuel
      const utilisateur = await this.obtenirUtilisateur(userId);

      if (!utilisateur) {
        return {
          upgraded: false,
          message: "Utilisateur introuvable",
        };
      }

      const statusActuel = utilisateur.status_nom || "";

      // Statuts privilégiés à préserver
      const statutsPrivilegies = ["professeur", "administrateur"];
      if (statutsPrivilegies.includes(statusActuel.toLowerCase())) {
        return {
          upgraded: false,
          ancien_statut: statusActuel,
          message: "Statut privilégié préservé",
        };
      }

      // Promouvoir uniquement si visiteur
      if (statusActuel.toLowerCase() !== "visiteur") {
        return {
          upgraded: false,
          ancien_statut: statusActuel,
          message: "Pas de promotion nécessaire",
        };
      }

      // Obtenir l'ID du statut utilisateur
      const nouveauStatutId = await this.obtenirIdStatut("utilisateur");

      if (!nouveauStatutId) {
        throw new Error("Statut utilisateur introuvable dans la table status");
      }

      // Mettre à jour le statut
      await this.mettreAJourStatut(userId, nouveauStatutId);

      console.log(
        `✅ [Service Status Upgrade] Utilisateur ${userId} promu: visiteur → utilisateur`,
      );

      return {
        upgraded: true,
        ancien_statut: "visiteur",
        nouveau_statut: "utilisateur",
        message: "Statut promu avec succès",
      };
    } catch (error) {
      console.error(`❌ [Service Status Upgrade] Erreur promotion:`, error);
      return {
        upgraded: false,
        message: "Erreur lors de la promotion",
      };
    }
  }

  /**
   * Obtenir les informations d'un utilisateur
   */
  private obtenirUtilisateur(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.status_id, s.nom_role as status_nom
        FROM utilisateurs u
        LEFT JOIN status s ON u.status_id = s.id
        WHERE u.id = ?
      `;

      this.mysqlConnector.query(query, [userId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0] || null);
        }
      });
    });
  }

  /**
   * Obtenir l'ID d'un statut par son nom
   */
  private obtenirIdStatut(nomStatut: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id FROM status WHERE nom_role = ? LIMIT 1
      `;

      this.mysqlConnector.query(query, [nomStatut], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.id || null);
        }
      });
    });
  }

  /**
   * Mettre à jour le statut d'un utilisateur
   */
  private mettreAJourStatut(userId: number, statusId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE utilisateurs
        SET status_id = ?, date_modification = NOW()
        WHERE id = ?
      `;

      this.mysqlConnector.query(query, [statusId, userId], (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

// Export class et singleton
export { StatusUpgradeServiceClass as StatusUpgradeService };

let statusUpgradeServiceInstance: StatusUpgradeServiceClass | null = null;

export function getStatusUpgradeService(): StatusUpgradeServiceClass {
  if (!statusUpgradeServiceInstance) {
    statusUpgradeServiceInstance = new StatusUpgradeServiceClass();
  }
  return statusUpgradeServiceInstance;
}

// Méthode getInstance pour compatibilité
StatusUpgradeServiceClass.getInstance = function (): StatusUpgradeServiceClass {
  return getStatusUpgradeService();
};

export default getStatusUpgradeService;
