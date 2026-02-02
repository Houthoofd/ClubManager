import MysqlConnector from '../../connector/mysqlconnector.js';
import { CommandeStore as Commande, CreateCommandeData, UpdateCommandeData } from '@clubmanager/types';

export class CommandesClient {
  private static mysqlConnector = MysqlConnector.getInstance();

  /**
   * Récupérer toutes les commandes avec informations utilisateur
   */
  static async findAll(): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.commande_id,
          c.utilisateur_id,
          c.statut,
          c.total,
          c.articles,
          c.date_commande,
          c.updated_at,
          c.payment_intent_id,
          u.nom_utilisateur,
          u.email
        FROM commandes c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        ORDER BY c.date_commande DESC
      `;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          const commandes = results.map((row: any) => ({
            ...row,
            articles: typeof row.articles === 'string' ? JSON.parse(row.articles) : row.articles
          }));
          resolve(commandes);
        }
      });
    });
  }

  /**
   * Récupérer une commande par son ID
   */
  static async findById(commandeId: string): Promise<Commande | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.commande_id,
          c.utilisateur_id,
          c.statut,
          c.total,
          c.articles,
          c.date_commande,
          c.updated_at,
          c.payment_intent_id,
          u.nom_utilisateur,
          u.email
        FROM commandes c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        WHERE c.commande_id = ?
      `;

      this.mysqlConnector.query(sql, [commandeId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          if (results.length === 0) {
            resolve(null);
          } else {
            const commande = results[0];
            resolve({
              ...commande,
              articles: typeof commande.articles === 'string' ? JSON.parse(commande.articles) : commande.articles
            });
          }
        }
      });
    });
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  static async findByUserId(utilisateurId: number): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.commande_id,
          c.utilisateur_id,
          c.statut,
          c.total,
          c.articles,
          c.date_commande,
          c.updated_at,
          c.payment_intent_id,
          u.nom_utilisateur,
          u.email
        FROM commandes c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        WHERE c.utilisateur_id = ?
        ORDER BY c.date_commande DESC
      `;

      this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          const commandes = results.map((row: any) => ({
            ...row,
            articles: typeof row.articles === 'string' ? JSON.parse(row.articles) : row.articles
          }));
          resolve(commandes);
        }
      });
    });
  }

  /**
   * Récupérer les commandes par statut
   */
  static async findByStatut(statut: string): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.commande_id,
          c.utilisateur_id,
          c.statut,
          c.total,
          c.articles,
          c.date_commande,
          c.updated_at,
          c.payment_intent_id,
          u.nom_utilisateur,
          u.email
        FROM commandes c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        WHERE c.statut = ?
        ORDER BY c.date_commande DESC
      `;

      this.mysqlConnector.query(sql, [statut], (error, results) => {
        if (error) {
          reject(error);
        } else {
          const commandes = results.map((row: any) => ({
            ...row,
            articles: typeof row.articles === 'string' ? JSON.parse(row.articles) : row.articles
          }));
          resolve(commandes);
        }
      });
    });
  }

  /**
   * Créer une nouvelle commande
   */
  static async create(data: CreateCommandeData): Promise<string> {
    return new Promise((resolve, reject) => {
      const articlesJson = JSON.stringify(data.articles);
      
      const sql = `
        INSERT INTO commandes (
          commande_id, 
          utilisateur_id, 
          statut, 
          total, 
          articles, 
          payment_intent_id,
          date_commande
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      const values = [
        data.commande_id,
        data.utilisateur_id,
        data.statut || 'en_attente',
        data.total,
        articlesJson,
        data.payment_intent_id || null
      ];

      this.mysqlConnector.query(sql, values, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(data.commande_id);
        }
      });
    });
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  static async updateStatut(commandeId: string, nouveauStatut: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE commandes 
        SET statut = ?, updated_at = NOW() 
        WHERE commande_id = ?
      `;

      this.mysqlConnector.query(sql, [nouveauStatut, commandeId], (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  /**
   * Mettre à jour une commande
   */
  static async update(commandeId: string, data: UpdateCommandeData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.statut !== undefined) {
        updates.push('statut = ?');
        values.push(data.statut);
      }

      if (data.total !== undefined) {
        updates.push('total = ?');
        values.push(data.total);
      }

      if (data.articles !== undefined) {
        updates.push('articles = ?');
        values.push(JSON.stringify(data.articles));
      }

      if (data.payment_intent_id !== undefined) {
        updates.push('payment_intent_id = ?');
        values.push(data.payment_intent_id);
      }

      if (updates.length === 0) {
        resolve(false);
        return;
      }

      updates.push('updated_at = NOW()');
      values.push(commandeId);

      const sql = `UPDATE commandes SET ${updates.join(', ')} WHERE commande_id = ?`;

      this.mysqlConnector.query(sql, values, (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  /**
   * Supprimer une commande
   */
  static async delete(commandeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM commandes WHERE commande_id = ?`;

      this.mysqlConnector.query(sql, [commandeId], (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  /**
   * Récupérer les statistiques des commandes
   */
  static async getStatistiques(): Promise<{
    total_commandes: number;
    commandes_en_attente: number;
    commandes_confirmees: number;
    commandes_livrees: number;
    commandes_annulees: number;
    chiffre_affaires_total: number;
    chiffre_affaires_mois: number;
  }> {
    return new Promise((resolve, reject) => {
      const sql1 = `
        SELECT 
          COUNT(*) as total_commandes,
          SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as commandes_en_attente,
          SUM(CASE WHEN statut = 'confirmee' THEN 1 ELSE 0 END) as commandes_confirmees,
          SUM(CASE WHEN statut = 'livree' THEN 1 ELSE 0 END) as commandes_livrees,
          SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) as commandes_annulees,
          SUM(CASE WHEN statut != 'annulee' THEN total ELSE 0 END) as chiffre_affaires_total
        FROM commandes
      `;

      this.mysqlConnector.query(sql1, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          const stats = results[0];

          const sql2 = `
            SELECT 
              SUM(CASE WHEN statut != 'annulee' THEN total ELSE 0 END) as chiffre_affaires_mois
            FROM commandes 
            WHERE YEAR(date_commande) = YEAR(CURDATE()) 
              AND MONTH(date_commande) = MONTH(CURDATE())
          `;

          this.mysqlConnector.query(sql2, [], (error2, results2) => {
            if (error2) {
              reject(error2);
            } else {
              const chiffreMois = results2[0];

              resolve({
                total_commandes: Number(stats.total_commandes || 0),
                commandes_en_attente: Number(stats.commandes_en_attente || 0),
                commandes_confirmees: Number(stats.commandes_confirmees || 0),
                commandes_livrees: Number(stats.commandes_livrees || 0),
                commandes_annulees: Number(stats.commandes_annulees || 0),
                chiffre_affaires_total: Number(stats.chiffre_affaires_total || 0),
                chiffre_affaires_mois: Number(chiffreMois.chiffre_affaires_mois || 0)
              });
            }
          });
        }
      });
    });
  }

  /**
   * Rechercher des commandes avec filtres
   */
  static async search(filters: {
    statut?: string;
    utilisateur_id?: number;
    date_debut?: string;
    date_fin?: string;
    search?: string;
  }): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          c.commande_id,
          c.utilisateur_id,
          c.statut,
          c.total,
          c.articles,
          c.date_commande,
          c.updated_at,
          c.payment_intent_id,
          u.nom_utilisateur,
          u.email
        FROM commandes c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (filters.statut) {
        sql += ' AND c.statut = ?';
        params.push(filters.statut);
      }

      if (filters.utilisateur_id) {
        sql += ' AND c.utilisateur_id = ?';
        params.push(filters.utilisateur_id);
      }

      if (filters.date_debut) {
        sql += ' AND DATE(c.date_commande) >= ?';
        params.push(filters.date_debut);
      }

      if (filters.date_fin) {
        sql += ' AND DATE(c.date_commande) <= ?';
        params.push(filters.date_fin);
      }

      if (filters.search) {
        sql += ' AND (c.commande_id LIKE ? OR u.nom_utilisateur LIKE ? OR u.email LIKE ?)';

        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      sql += ' ORDER BY c.date_commande DESC';

      this.mysqlConnector.query(sql, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          const commandes = results.map((row: any) => ({
            ...row,
            articles: typeof row.articles === 'string' ? JSON.parse(row.articles) : row.articles
          }));
          resolve(commandes);
        }
      });
    });
  }

  /**
   * Compter les commandes par statut
   */
  static async countByStatut(): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT statut, COUNT(*) as count 
        FROM commandes 
        GROUP BY statut
      `;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          const counts: Record<string, number> = {};
          results.forEach((row: any) => {
            counts[row.statut] = Number(row.count);
          });
          resolve(counts);
        }
      });
    });
  }
}
