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
import { Cours } from '../db/clients/cours/cours.js';
import { datareservationSchema } from '@clubmanager/types';
import { z } from 'zod';
const router = express.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Cours();
        // Appel de la méthode pour obtenir les cours
        const cours = yield client.obtenirLesCours();
        if (cours && cours.length > 0) {
            console.log('Cours récupérés:', cours);
            res.status(200).json(cours); // Répondre avec les cours récupérés
        }
        else {
            console.log('Aucun cours trouvé.');
            res.status(404).json({ message: 'Aucun cours trouvé.' });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des cours :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des cours.' });
    }
}));
router.post('/inscription', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validation des données entrantes
        const validatedData = datareservationSchema.parse(req.body);
        console.log("Données validées :", validatedData);
        const client = new Cours();
        // Vérification si l'utilisateur est déjà inscrit
        const verifInscriptionUtilisateur = yield client.verifierInscriptionUtilisateur(validatedData);
        console.log("Résultat de la vérification de l'utilisateur :", verifInscriptionUtilisateur);
        if (verifInscriptionUtilisateur.isBooked === false) {
            // Vérification de l'ID utilisateur avant l'inscription
            if (!verifInscriptionUtilisateur.data) {
                return res.status(400).json({ message: 'Utilisateur introuvable.' });
            }
            // Si l'utilisateur n'est pas encore inscrit, on procède à l'inscription
            const dataToSend = {
                cours_id: validatedData.cours_id,
                utilisateur_id: verifInscriptionUtilisateur.data.userId, // ID de l'utilisateur trouvé
                status_id: 1
            };
            console.log("Objet dataToSend :", dataToSend);
            // Inscription de l'utilisateur au cours
            const result = yield client.inscrireUtilisateurAuCours(dataToSend);
            console.log("Résultat de l'inscription :", result);
            if (result.isConfirm === true) {
                // Utilisateur inscrit avec succès
                res.status(201).json({
                    message: 'Utilisateur inscrit avec succès.',
                    userId: verifInscriptionUtilisateur.data,
                    coursId: validatedData.cours_id
                });
            }
            else {
                // Erreur d'insertion
                res.status(500).json({ message: 'Erreur lors de l\'inscription de l\'utilisateur au cours.' });
            }
        }
        else {
            // L'utilisateur est déjà inscrit au cours
            res.status(409).json({ message: 'Utilisateur déjà inscrit au cours.' });
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            // Erreur de validation des données
            res.status(400).json({ message: 'Données invalides.', errors: error.errors });
        }
        else {
            // Autres erreurs (SQL, serveur, etc.)
            console.error("Erreur lors de l'inscription de l'utilisateur :", error);
            res.status(500).json({ message: 'Erreur serveur lors de l\'inscription de l\'utilisateur.' });
        }
    }
}));
export default router;
