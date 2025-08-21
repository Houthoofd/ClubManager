import MysqlConnector from '../../connector/mysqlconnector.js';
import type { VerifyResult } from '@clubmanager/types';

export class Verifiation {
  // Vérifie si un email existe
  async checkUtilisateurByEmail(email: string): Promise<VerifyResult> {
    const mysqlConnector = new MysqlConnector();
    const sql = `SELECT id FROM utilisateurs WHERE email = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [email], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve({
          isFind: results.length > 0,
          message: results.length > 0 ? "Email déjà utilisé." : "Email disponible."
        });
      });
    });
  }

  // Vérifie si un nom_utilisateur existe
  async checkUtilisateurByNomUtilisateur(nom_utilisateur: string): Promise<VerifyResult> {
    const mysqlConnector = new MysqlConnector();
    const sql = `SELECT id FROM utilisateurs WHERE nom_utilisateur = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [nom_utilisateur], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve({
          isFind: results.length > 0,
          message: results.length > 0 ? "Nom d'utilisateur déjà utilisé." : "Nom d'utilisateur disponible."
        });
      });
    });
  }

  // Vérifie si un prénom existe
  async checkUtilisateurByPrenom(prenom: string): Promise<VerifyResult> {
    const mysqlConnector = new MysqlConnector();
    const sql = `SELECT id FROM utilisateurs WHERE first_name = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [prenom], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve({
          isFind: results.length > 0,
          message: results.length > 0 ? "Prénom déjà utilisé." : "Prénom disponible."
        });
      });
    });
  }

  // Vérifie si un nom existe
  async checkUtilisateurByNom(nom: string): Promise<VerifyResult> {
    const mysqlConnector = new MysqlConnector();
    const sql = `SELECT id FROM utilisateurs WHERE last_name = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [nom], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve({
          isFind: results.length > 0,
          message: results.length > 0 ? "Nom déjà utilisé." : "Nom disponible."
        });
      });
    });
  }

  // Vérifie la combinaison prénom + nom
  async checkUtilisateurByPrenomNom(prenom: string, nom: string): Promise<VerifyResult> {
    const mysqlConnector = new MysqlConnector();
    const sql = `SELECT id FROM utilisateurs WHERE first_name = ? AND last_name = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [prenom, nom], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve({
          isFind: results.length > 0,
          message: results.length > 0 ? "Utilisateur déjà existant." : "Utilisateur disponible."
        });
      });
    });
  }
}
