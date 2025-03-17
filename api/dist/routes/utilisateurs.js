var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { Utlisateurs } from '../db/clients/utilisateurs/utilisateurs.js';
const router = express.Router();
router.get('/verification', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nom, prenom, email, date_naissance } = req.body; // Récupère les données du body
    console.log(nom, prenom, email, date_naissance);
    try {
        const client = new Utlisateurs();
        const result = yield client.IsUserExist(nom, prenom, email, date_naissance);
        if (result.exists) {
            console.log('Utilisateur déjà existant:', result.user);
            res.status(409).json({ message: 'L\'utilisateur existe déjà.' });
        }
        else {
            console.log('Aucun utilisateur trouvé, inscription possible.');
            res.status(200).json({ message: 'Aucun utilisateur trouvé, inscription possible.' });
        }
    }
    catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'utilisateur.' });
    }
}));
router.post('/inscription', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prenom, nom, nom_utilisateur, email, genre_id, date_naissance, password, status_id, grade_id, nom_plan } = req.query;
    // Conversion des champs censés être des nombres
    const genreId = parseInt(genre_id, 10);
    const statusId = parseInt(status_id, 10);
    const gradeId = parseInt(grade_id, 10);
    const planId = parseInt(nom_plan, 10);
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
        const result = yield client.inscrireUtilisateur(prenom, nom, nom_utilisateur, email, genreId, date_naissance, password, statusId, gradeId, planId);
        if (result.affectedRows > 0) {
            console.log('Utilisateur inséré avec succès, ID:', result.insertId);
            res.status(201).json({ message: 'Utilisateur inscrit avec succès.', userId: result.insertId });
        }
        else {
            console.log("Aucun utilisateur inséré, vérifier les correspondances des valeurs.");
            res.status(400).json({ message: 'Échec de l\'inscription de l\'utilisateur.' });
        }
    }
    catch (error) {
        console.error("Erreur lors de l'inscription de l'utilisateur :", error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription de l\'utilisateur.' });
    }
}));
export default router;
