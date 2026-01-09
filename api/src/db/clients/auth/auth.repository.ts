/**
 * Repository pour les opérations de récupération des données Auth
 * Responsabilité : Exécution des requêtes et mapping des résultats
 */

import { VerifyResultWithData } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';
import * as queries from './queries.js';
import type {
  UtilisateurAuth,
  TokenRecuperation,
  InformationsSecurite,
} from './types.js';

export class AuthRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  /**
   * Méthode helper pour exécuter une requête de manière async/await
   * @param sql - Requête SQL
   * @param params - Paramètres de la requête
   * @returns Résultats de la requête
   */
  queryAsync(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Recherche un utilisateur par email
   * @param email - Email de l'utilisateur
   * @returns Utilisateur trouvé ou null
   */
  async rechercherUtilisateurParEmail(email: string): Promise<UtilisateurAuth | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_USER_BY_EMAIL_ALL_STATUS,
        [email],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la recherche utilisateur:', error);
            reject(error);
          } else {
            resolve(results.length > 0 ? results[0] : null);
          }
        }
      );
    });
  }

  /**
   * Recherche un utilisateur actif par email (pour authentification)
   * @param email - Email de l'utilisateur
   * @returns Utilisateur actif ou null
   */
  async rechercherUtilisateurActifParEmail(email: string): Promise<UtilisateurAuth | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_USER_BY_EMAIL,
        [email],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la recherche utilisateur actif:', error);
            reject(error);
          } else {
            resolve(results.length > 0 ? results[0] : null);
          }
        }
      );
    });
  }

  /**
   * Vérifie si un email existe déjà en base
   * @param email - Email à vérifier
   * @returns true si l'email existe
   */
  async emailExiste(email: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_EMAIL_EXISTS,
        [email],
        (error: any, results: any) => {
          if (error) {
            console.error("Erreur lors de la vérification de l'email:", error);
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  /**
   * Récupère les informations de sécurité d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Informations de sécurité ou null
   */
  async obtenirInformationsSecurite(userId: number): Promise<InformationsSecurite | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_SECURITY_INFO,
        [userId],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la récupération des infos sécurité:', error);
            reject(error);
          } else {
            resolve(results.length > 0 ? results[0] : null);
          }
        }
      );
    });
  }

  /**
   * Vérifie un token de récupération
   * @param token - Token à vérifier
   * @returns Données du token ou null si invalide/expiré
   */
  async verifierTokenRecuperation(token: string): Promise<TokenRecuperation | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_VALID_TOKEN,
        [token, new Date()],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la vérification du token:', error);
            reject(error);
          } else {
            resolve(results.length > 0 ? results[0] : null);
          }
        }
      );
    });
  }

  /**
   * Compte les tentatives de récupération récentes
   * @param email - Email de l'utilisateur
   * @param minutes - Fenêtre de temps en minutes (défaut: 15)
   * @returns Nombre de tentatives
   */
  async verifierTentativesRecuperationRecentes(
    email: string,
    minutes: number = 15
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const timeAgo = new Date(Date.now() - minutes * 60 * 1000);

      this.mysqlConnector.query(
        queries.COUNT_RECENT_RECOVERY_ATTEMPTS,
        [email, timeAgo],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors de la vérification des tentatives:', error);
            resolve(0); // En cas d'erreur, autoriser par défaut
          } else {
            resolve(results[0].count);
          }
        }
      );
    });
  }

  /**
   * Compte les tentatives de connexion récentes
   * @param email - Email de l'utilisateur
   * @param minutes - Fenêtre de temps en minutes (défaut: 15)
   * @returns Nombre de tentatives
   */
  async obtenirTentativesConnexionRecentes(
    email: string,
    minutes: number = 15
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const timeAgo = new Date(Date.now() - minutes * 60 * 1000);

      this.mysqlConnector.query(
        queries.COUNT_RECENT_LOGIN_ATTEMPTS,
        [email, timeAgo],
        (error: any, results: any) => {
          if (error) {
            console.error('Erreur lors du comptage des tentatives:', error);
            reject(error);
          } else {
            resolve(results[0].count);
          }
        }
      );
    });
  }

  /**
   * Récupère un utilisateur par son ID
   * @param userId - ID de l'utilisateur
   * @returns Utilisateur ou null
   */
  async obtenirUtilisateurParId(userId: number): Promise<UtilisateurAuth | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, first_name, last_name, email, status_id
        FROM utilisateurs
        WHERE id = ?
      `;

      this.mysqlConnector.query(sql, [userId], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la récupération utilisateur par ID:', error);
          reject(error);
        } else {
          resolve(results.length > 0 ? results[0] : null);
        }
      });
    });
  }

  /**
   * Liste tous les tokens de récupération d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Liste des tokens
   */
  async listerTokensUtilisateur(userId: number): Promise<TokenRecuperation[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM password_reset_tokens
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;

      this.mysqlConnector.query(sql, [userId], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la récupération des tokens:', error);
          reject(error);
        } else {
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Compte le nombre d'utilisateurs actifs
   * @returns Nombre d'utilisateurs actifs
   */
  async compterUtilisateursActifs(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM utilisateurs
        WHERE status_id = 1
      `;

      this.mysqlConnector.query(sql, [], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors du comptage des utilisateurs actifs:', error);
          reject(error);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }
}
