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
import { Utilisateurs } from '../db/clients/utilisateurs/utilisateurs.js';
import { z } from 'zod';
import { userSchema, userDataLoginSchema } from '../../../packages/types/dist/index.js';
const router = express.Router();
// Fonction pour convertir une chaîne de caractères en nombre
function convertToNumber(value) {
    console.log(value);
    if (value === null || value === undefined) {
        return 0;
    }
    const convertedValue = Number(value);
    return isNaN(convertedValue) ? 0 : convertedValue;
}
// Route de vérification de l'existence d'un utilisateur
router.get('/verification', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nom, prenom, email, date_naissance } = req.body;
    try {
        const client = new Utilisateurs();
        const result = yield client.IsUserExist(nom, prenom, email, date_naissance);
        if (result.exists) {
            res.status(409).json({ message: 'L\'utilisateur existe déjà.' });
        }
        else {
            res.status(200).json({ message: 'Aucun utilisateur trouvé, inscription possible.' });
        }
    }
    catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'utilisateur.' });
    }
}));
// Route de vérification de l'existence d'un utilisateur
// Route to verify the existence of a user
router.post('/connexion', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate incoming data with Zod
        const validatedData = userDataLoginSchema.parse(req.body);
        console.log("Données validées :", validatedData);
        const client = new Utilisateurs();
        // Check if the user exists
        const result = yield client.validerConnexion(validatedData);
        if (result.isFind) {
            res.status(200).json({ message: result.message, data: result.dataToStore });
        }
        else {
            res.status(404).json({ message: result.message });
        }
    }
    catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'utilisateur.' });
    }
}));
// Route d'inscription d'un utilisateur
router.post('/inscription', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validation des données reçues avec Zod
        const validatedData = userSchema.parse(req.body);
        console.log("Données validées :", validatedData);
        const client = new Utilisateurs();
        const result = yield client.inscrireUtilisateur(validatedData);
        if (result.affectedRows > 0) {
            res.status(201).json({ message: 'Utilisateur inscrit avec succès.', userId: result.insertId });
        }
        else {
            res.status(400).json({ message: 'Échec de l\'inscription de l\'utilisateur.' });
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: 'Données invalides.', errors: error.errors });
        }
        else {
            console.error("Erreur lors de l'inscription de l'utilisateur :", error);
            res.status(500).json({ message: 'Erreur serveur lors de l\'inscription de l\'utilisateur.' });
        }
    }
}));
export default router;
