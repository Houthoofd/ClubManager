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

  // Vérifie si un cours existe déjà dans le planning (jour, heure) 
  async checkCoursPlanning(
    jour: string, 
    heure_debut: string, 
    heure_fin: string, 
    type_cours: string,
    options?: {
      excludeOriginal?: boolean;
      originalJour?: string;
      originalType?: string;
      originalHeureDebut?: string;
      originalHeureFin?: string;
    }
  ): Promise<{ exists: boolean; message: string }> {
    const mysqlConnector = new MysqlConnector();
    
    const normalizeString = (str: string) => str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const joursDeSemaine: Record<string, number> = {
      lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7
    };
    const jourNum = joursDeSemaine[normalizeString(jour)];

    // Si type_cours est 'ANY' ou vide, on ignore le type dans la vérification
    const ignoreType = !type_cours || type_cours === 'ANY';
    
    let sql = `
      SELECT id, type_cours FROM cours_recurrent
      WHERE jour_semaine = ?
        AND (
          (heure_debut <= ? AND heure_fin > ?) OR
          (heure_debut < ? AND heure_fin >= ?) OR
          (heure_debut >= ? AND heure_fin <= ?)
        )
    `;
    
    let params: any[] = [jourNum, heure_debut, heure_debut, heure_fin, heure_fin, heure_debut, heure_fin];
    
    // Exclut le cours original si en mode modification
    if (options?.excludeOriginal && options.originalJour && options.originalType && options.originalHeureDebut && options.originalHeureFin) {
      const originalJourNum = joursDeSemaine[normalizeString(options.originalJour)];
      const originalHeureDebut = options.originalHeureDebut.length === 5 ? options.originalHeureDebut + ':00' : options.originalHeureDebut;
      const originalHeureFin = options.originalHeureFin.length === 5 ? options.originalHeureFin + ':00' : options.originalHeureFin;
      
      sql += ` AND NOT (jour_semaine = ? AND type_cours = ? AND heure_debut = ? AND heure_fin = ?)`;
      params.push(originalJourNum, options.originalType, originalHeureDebut, originalHeureFin);
    }
    
    // Ajoute la condition du type seulement si nécessaire
    if (!ignoreType) {
      sql += ` AND type_cours = ?`;
      params.push(type_cours);
    }
    
    sql += ` LIMIT 1`;
    
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, params, (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        if (results.length > 0) {
          const coursExistant = results[0];
          resolve({ 
            exists: true, 
            message: `Un cours ${coursExistant.type_cours} est déjà programmé à ce créneau horaire.` 
          });
        } else {
          resolve({ exists: false, message: "Ce créneau est disponible." });
        }
      });
    });
  }

  // Vérifie si un article magasin existe déjà par son nom
  async checkArticleByNom(nom: string): Promise<{ isFind: boolean; message: string }> {
    const mysqlConnector = new MysqlConnector();
    const sql = `SELECT id FROM articles WHERE nom = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [nom], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve({
          isFind: results.length > 0,
          message: results.length > 0 ? "Article déjà existant." : "Article disponible."
        });
      });
    });
  }

  // Vérifie si un article magasin existe déjà par son nom ET sa catégorie
  async checkArticleByNomAndCategorie(nom: string, categorie_id: number): Promise<{ isFind: boolean; message: string }> {
    const mysqlConnector = new MysqlConnector();
    const sql = `SELECT id FROM articles WHERE nom = ? AND categorie_id = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(sql, [nom, categorie_id], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve({
          isFind: results.length > 0,
          message: results.length > 0 ? "Article déjà existant dans cette catégorie." : "Article disponible dans cette catégorie."
        });
      });
    });
  }

  // Vérifie si un ou plusieurs utilisateurs sont déjà professeurs
  async checkUtilisateursSontProfesseurs(utilisateurs: { nom: string; prenom: string }[]): Promise<{ professeurs: { nom: string; prenom: string; isProf: boolean }[], message: string }> {
    const mysqlConnector = new MysqlConnector();
    // On construit une requête pour tous les couples nom/prenom
    const results: { nom: string; prenom: string; isProf: boolean }[] = [];
    for (const utilisateur of utilisateurs) {
      const sql = `SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? AND status_id = 5 LIMIT 1`;
      // status_id = 5 pour professeur
      // eslint-disable-next-line no-await-in-loop
      const isProf = await new Promise<boolean>((resolve, reject) => {
        mysqlConnector.query(sql, [utilisateur.nom, utilisateur.prenom], (error, rows) => {
          if (error) return reject(error);
          resolve(rows.length > 0);
        });
      });
      results.push({ nom: utilisateur.nom, prenom: utilisateur.prenom, isProf });
    }
    mysqlConnector.close();
    return {
      professeurs: results,
      message: 'Vérification des statuts professeurs effectuée.'
    };
  }
}
