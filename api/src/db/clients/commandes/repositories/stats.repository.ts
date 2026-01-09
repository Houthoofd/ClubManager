/**
 * Repository de STATISTIQUES pour le module Commandes
 * Responsabilité: Opérations de calcul de statistiques uniquement
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  CommandeStatistiques,
  StatistiquesRow,
  ChiffreAffairesMoisRow,
  CountByStatutRow,
  CommandeStatsPeriode,
  StatsPeriodeRow,
  TopProduit,
} from '../types.js';
import * as queries from '../queries/index.js';
import { toNumber, toInt } from '../utils/index.js';

/**
 * Repository pour les opérations de statistiques sur les commandes
 */
export class CommandesStatsRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  /**
   * Récupérer les statistiques globales des commandes
   */
  async getStatistiques(): Promise<CommandeStatistiques> {
    return new Promise((resolve, reject) => {
      // Première requête : statistiques globales
      this.mysqlConnector.query(
        queries.SELECT_STATISTIQUES_GLOBALES,
        [],
        (error, results: StatistiquesRow[]) => {
          if (error) {
            reject(error);
            return;
          }

          const stats = results[0];

          // Deuxième requête : chiffre d'affaires du mois
          this.mysqlConnector.query(
            queries.SELECT_CHIFFRE_AFFAIRES_MOIS,
            [],
            (error2, results2: ChiffreAffairesMoisRow[]) => {
              if (error2) {
                reject(error2);
                return;
              }

              const chiffreMois = results2[0];
              const totalCommandes = toNumber(stats.total_commandes);
              const caTotal = toNumber(stats.chiffre_affaires_total);

              resolve({
                total_commandes: totalCommandes,
                commandes_en_attente: toNumber(stats.commandes_en_attente),
                commandes_confirmees: toNumber(stats.commandes_confirmees),
                commandes_en_preparation: toNumber(stats.commandes_en_preparation),
                commandes_expedie: toNumber(stats.commandes_expedie),
                commandes_livrees: toNumber(stats.commandes_livrees),
                commandes_annulees: toNumber(stats.commandes_annulees),
                commandes_remboursees: toNumber(stats.commandes_remboursees),
                chiffre_affaires_total: caTotal,
                chiffre_affaires_mois: toNumber(chiffreMois.chiffre_affaires_mois),
                panier_moyen: totalCommandes > 0 ? caTotal / totalCommandes : 0,
              });
            }
          );
        }
      );
    });
  }

  /**
   * Compter les commandes par statut
   */
  async countByStatut(): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_COMMANDES_BY_STATUT,
        [],
        (error, results: CountByStatutRow[]) => {
          if (error) {
            reject(error);
          } else {
            const counts: Record<string, number> = {};
            results.forEach((row) => {
              counts[row.statut] = toNumber(row.count);
            });
            resolve(counts);
          }
        }
      );
    });
  }

  /**
   * Obtenir les statistiques par période
   */
  async getStatsByPeriod(
    period: 'day' | 'week' | 'month',
    duration: number
  ): Promise<CommandeStatsPeriode[]> {
    return new Promise((resolve, reject) => {
      let query: string;
      switch (period) {
        case 'day':
          query = queries.SELECT_STATS_PAR_JOUR;
          break;
        case 'week':
          query = queries.SELECT_STATS_PAR_SEMAINE;
          break;
        case 'month':
          query = queries.SELECT_STATS_PAR_MOIS;
          break;
        default:
          reject(new Error(`Période invalide: ${period}`));
          return;
      }

      this.mysqlConnector.query(query, [duration], (error, results: StatsPeriodeRow[]) => {
        if (error) {
          reject(error);
        } else {
          const stats: CommandeStatsPeriode[] = results.map((row) => ({
            periode: row.periode,
            nombre_commandes: toInt(row.nombre_commandes),
            chiffre_affaires: toNumber(row.chiffre_affaires),
            panier_moyen: toNumber(row.panier_moyen),
          }));
          resolve(stats);
        }
      });
    });
  }

  /**
   * Obtenir les top produits vendus
   */
  async getTopProduits(limit: number = 10): Promise<TopProduit[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_TOP_PRODUITS, [limit], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          const produits: TopProduit[] = results.map((row) => ({
            article_id: row.article_id,
            nom: row.nom,
            quantite_vendue: toInt(row.quantite_vendue),
            chiffre_affaires: toNumber(row.chiffre_affaires),
            nombre_commandes: toInt(row.nombre_commandes),
          }));
          resolve(produits);
        }
      });
    });
  }

  /**
   * Obtenir les top produits par chiffre d'affaires
   */
  async getTopProduitsByCA(limit: number = 10): Promise<TopProduit[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_TOP_PRODUITS_PAR_CA, [limit], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          const produits: TopProduit[] = results.map((row) => ({
            article_id: row.article_id,
            nom: row.nom,
            quantite_vendue: toInt(row.quantite_vendue),
            chiffre_affaires: toNumber(row.chiffre_affaires),
            nombre_commandes: toInt(row.nombre_commandes),
          }));
          resolve(produits);
        }
      });
    });
  }

  /**
   * Obtenir le panier moyen
   */
  async getPanierMoyen(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_PANIER_MOYEN, [], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          resolve(toNumber(results[0]?.panier_moyen || 0));
        }
      });
    });
  }

  /**
   * Obtenir les statistiques par année
   */
  async getStatsByYear(duration: number): Promise<CommandeStatsPeriode[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STATS_PAR_ANNEE,
        [duration],
        (error, results: StatsPeriodeRow[]) => {
          if (error) {
            reject(error);
          } else {
            const stats: CommandeStatsPeriode[] = results.map((row) => ({
              periode: row.periode,
              nombre_commandes: toInt(row.nombre_commandes),
              chiffre_affaires: toNumber(row.chiffre_affaires),
              panier_moyen: toNumber(row.panier_moyen),
            }));
            resolve(stats);
          }
        }
      );
    });
  }

  /**
   * Obtenir les top clients par nombre de commandes
   */
  async getTopClientsByCount(limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TOP_CLIENTS_PAR_NOMBRE,
        [limit],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map((row) => ({
              utilisateur_id: row.utilisateur_id,
              nom_utilisateur: row.nom_utilisateur,
              email: row.email,
              nombre_commandes: toInt(row.nombre_commandes),
              total_depense: toNumber(row.total_depense),
              panier_moyen: toNumber(row.panier_moyen),
            })));
          }
        }
      );
    });
  }

  /**
   * Obtenir les top clients par montant dépensé
   */
  async getTopClientsByAmount(limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TOP_CLIENTS_PAR_MONTANT,
        [limit],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map((row) => ({
              utilisateur_id: row.utilisateur_id,
              nom_utilisateur: row.nom_utilisateur,
              email: row.email,
              nombre_commandes: toInt(row.nombre_commandes),
              total_depense: toNumber(row.total_depense),
              panier_moyen: toNumber(row.panier_moyen),
            })));
          }
        }
      );
    });
  }

  /**
   * Obtenir le taux de conversion
   */
  async getTauxConversion(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TAUX_CONVERSION,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const result = results[0];
            resolve({
              total_commandes: toInt(result.total_commandes),
              commandes_reussies: toInt(result.commandes_reussies),
              commandes_echouees: toInt(result.commandes_echouees),
              taux_reussite: toNumber(result.taux_reussite),
              taux_echec: toNumber(result.taux_echec),
            });
          }
        }
      );
    });
  }

  /**
   * Obtenir le temps moyen de traitement
   */
  async getTempsMoyenTraitement(days: number = 30): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TEMPS_MOYEN_TRAITEMENT,
        [days],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(toNumber(results[0]?.heures_moyennes || 0));
          }
        }
      );
    });
  }

  /**
   * Obtenir la répartition des commandes par heure
   */
  async getCommandesByHour(days: number = 30): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDES_PAR_HEURE,
        [days],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map((row) => ({
              heure: toInt(row.heure),
              nombre_commandes: toInt(row.nombre_commandes),
              chiffre_affaires: toNumber(row.chiffre_affaires),
            })));
          }
        }
      );
    });
  }

  /**
   * Obtenir la répartition des commandes par jour de la semaine
   */
  async getCommandesByDayOfWeek(days: number = 90): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDES_PAR_JOUR_SEMAINE,
        [days],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map((row) => ({
              jour: row.jour,
              numero_jour: toInt(row.numero_jour),
              nombre_commandes: toInt(row.nombre_commandes),
              chiffre_affaires: toNumber(row.chiffre_affaires),
              panier_moyen: toNumber(row.panier_moyen),
            })));
          }
        }
      );
    });
  }
}
