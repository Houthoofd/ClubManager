import express from 'express';
import path from 'path';
import fs from 'fs';
import {Utlisateurs} from '../db/clients/utilisateurs/utilisateurs.js';

const router = express.Router();

router.get('/verification', async (req, res) => {
  const { nom, prenom, email, date_naissance } = req.body;  // Récupère les données du body

  console.log(nom, prenom, email, date_naissance);

  try {
    const client = new Utlisateurs();

    const result = await client.IsUserExist(nom, prenom, email, date_naissance);

    if (result.exists) {
      console.log('Utilisateur déjà existant:', result.user);
      res.status(409).json({ message: 'L\'utilisateur existe déjà.' });
    } else {
      console.log('Aucun utilisateur trouvé, inscription possible.');
      res.status(200).json({ message: 'Aucun utilisateur trouvé, inscription possible.' });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'utilisateur.' });
  }
});

router.post('/inscription', async (req, res) => {
  const {
    prenom,
    nom,
    nom_utilisateur,
    email,
    genre_id,
    date_naissance,
    password,
    status_id,
    grade_id,
    nom_plan
  } = req.query;

  // Conversion des champs censés être des nombres
  const genreId = parseInt(genre_id as string, 10);
  const statusId = parseInt(status_id as string, 10);
  const gradeId = parseInt(grade_id as string, 10);
  const planId = parseInt(nom_plan as string, 10);

  console.log("Données reçues :", {
    prenom,
    nom,
    nom_utilisateur,
    email,
    genreId,
    date_naissance,
    password,
    statusId,
    gradeId,
    planId
  });

  try {
    const client = new Utlisateurs();

    const result = await client.inscrireUtilisateur(
      prenom as string,
      nom as string,
      nom_utilisateur as string,
      email as string,
      genreId,
      date_naissance as string,
      password as string,
      statusId,
      gradeId,
      planId
    );

    if (result.affectedRows > 0) {
      console.log('Utilisateur inséré avec succès, ID:', result.insertId);
      res.status(201).json({ message: 'Utilisateur inscrit avec succès.', userId: result.insertId });
    } else {
      console.log("Aucun utilisateur inséré, vérifier les correspondances des valeurs.");
      res.status(400).json({ message: 'Échec de l\'inscription de l\'utilisateur.' });
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription de l'utilisateur :", error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription de l\'utilisateur.' });
  }
});








export default router;