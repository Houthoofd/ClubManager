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

  // Vérifie si un utilisateur existe via email, prénom et nom
  async checkUtilisateurByEmailPrenomNom(email: string, prenom: string, nom: string): Promise<VerifyResult> {
    const mysqlConnector = new MysqlConnector();
    const sql = `
      SELECT id FROM utilisateurs
      WHERE email = ? AND first_name = ? AND last_name = ? LIMIT 1
    `;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [email, prenom, nom], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve({
          isFind: results.length > 0,
          message: results.length > 0 ? "Utilisateur déjà existant avec cet email, prénom et nom." : "Utilisateur disponible."
        });
      });
    });
  }

  // Vérifie si un cours existe déjà dans le planning (jour, heure, type)
  async checkCoursPlanning(jour: string, heure_debut: string, heure_fin: string, type_cours: string): Promise<{ exists: boolean; message: string }> {
    const mysqlConnector = new MysqlConnector();
    // Normalise le jour pour gérer les majuscules/accents
    const normalizeString = (str: string) => str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const joursDeSemaine: Record<string, number> = {
      lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7
    };
    const jourNum = joursDeSemaine[normalizeString(jour)];

    const sql = `
      SELECT id FROM cours_recurrent
      WHERE jour_semaine = ?
        AND heure_debut = ?
        AND heure_fin = ?
        AND type_cours = ?
      LIMIT 1
    `;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [jourNum, heure_debut, heure_fin, type_cours], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        if (results.length > 0) {
          resolve({ exists: true, message: "Ce créneau de cours existe déjà dans le planning." });
        } else {
          resolve({ exists: false, message: "Ce créneau est disponible." });
        }
      });
    });
  }
}
