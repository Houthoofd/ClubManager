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
        // Vérification si l'utilisateur existe déjà
        const verifUtilisateur = yield client.verifierUtilisateur(validatedData);
        if (verifUtilisateur.isFind === false) {
            // L'utilisateur n'existe pas, on peut l'inscrire
            const result = yield client.inscrireUtilisateur(validatedData);
            if (result.affectedRows > 0) {
                res.status(201).json({ message: 'Utilisateur inscrit avec succès.', userId: result.insertId });
            }
            else {
                res.status(400).json({ message: 'Échec de l\'inscription de l\'utilisateur.' });
            }
        }
        else {
            // L'utilisateur existe déjà
            res.status(400).json({ message: 'Utilisateur déjà inscrit.' });
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            // Gestion des erreurs de validation
            res.status(400).json({ message: 'Données invalides.', errors: error.errors });
        }
        else {
            // Gestion des autres erreurs serveur
            console.error("Erreur lors de l'inscription de l'utilisateur :", error);
            res.status(500).json({ message: 'Erreur serveur lors de l\'inscription de l\'utilisateur.' });
        }
    }
}));
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Utilisateurs();
        // Attendre la résolution de la méthode obtenirTousLesUtilisateurs
        const utilisateurs = yield client.obtenirTousLesUtilisateurs();
        // Vérifier si des utilisateurs ont été trouvés et renvoyer une réponse appropriée
        if (utilisateurs.isFind) {
            res.status(200).json(utilisateurs); // Renvoyer la liste des utilisateurs
        }
        else {
            res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
        }
    }
    catch (error) {
        console.error("Erreur : ", error);
        res.status(500).send("Erreur serveur");
    }
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let utilisateurId = req.params.id;
    if (isNaN(Number(utilisateurId))) {
        return res.status(400).json({ message: "ID invalide, il doit être un nombre." });
    }
    else {
        utilisateurId = Number(utilisateurId);
    }
    try {
        const client = new Utilisateurs();
        const utilisateur = yield client.obtenirUnUtilisateur(utilisateurId);
        if (utilisateur.isFind) {
            res.status(200).json(utilisateur.data); // Renvoie les données de l'utilisateur trouvé
        }
        else {
            res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
        }
    }
    catch (error) {
        console.error("Erreur : ", error);
        res.status(500).send("Erreur serveur");
    }
}));
export default router;
