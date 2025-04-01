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
import { datareservationSchema, datannulationSchema, datavalidationSchema } from '@clubmanager/types';
import { z } from 'zod';
const router = express.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Cours();
        // Récupérer tous les cours
        const cours = yield client.obtenirLesCours();
        if (!cours || cours.length === 0) {
            console.log('Aucun cours trouvé.');
            return res.status(404).json({ message: 'Aucun cours trouvé.' });
        }
        // Ajouter les utilisateurs pour chaque cours
        const coursAvecUtilisateurs = yield Promise.all(cours.map((cour) => __awaiter(void 0, void 0, void 0, function* () {
            // Récupérer les utilisateurs pour chaque cours
            const utilisateursParCours = yield client.obtenirUtilisateursParCours(cour.id);
            // Extraire la liste des utilisateurs
            const utilisateurs = utilisateursParCours.utilisateurs; // Assure-toi d'extraire uniquement les utilisateurs ici
            // Retourner le cours avec les utilisateurs
            return Object.assign(Object.assign({}, cour), { utilisateurs: utilisateurs || [] }); // Si aucun utilisateur, on retourne un tableau vide
        })));
        console.log('Cours récupérés avec utilisateurs:', coursAvecUtilisateurs);
        res.status(200).json(coursAvecUtilisateurs); // Renvoie les cours avec les utilisateurs
    }
    catch (error) {
        console.error('Erreur lors de la récupération des cours avec utilisateurs :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des cours et des utilisateurs.' });
    }
}));
router.get('/:coursId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Cours();
        const { coursId } = req.params; // Récupère l'ID du cours depuis l'URL
        // Récupérer les utilisateurs associés à ce cours
        const utilisateursParCours = yield client.obtenirUtilisateursParCours(coursId);
        // Ajouter les utilisateurs aux données du cours
        const coursAvecUtilisateurs = { Cours: utilisateursParCours };
        console.log('Cours récupéré avec utilisateurs:', coursAvecUtilisateurs);
        res.status(200).json(coursAvecUtilisateurs);
    }
    catch (error) {
        console.error('Erreur lors de la récupération du cours avec utilisateurs :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
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
router.patch("/inscription/annulation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validation des données entrantes
        console.log("annulation" + req.body);
        const validatedData = datannulationSchema.parse(req.body);
        console.log("Données validées :", validatedData);
        const client = new Cours();
        const annulationReussie = yield client.annulerUtilisateurAuCours(validatedData);
        if (annulationReussie) {
            res.status(200).json({ message: "Présence annulée avec succès." });
        }
        else {
            res.status(404).json({ message: "Présence non trouvée ou déjà annulée." });
        }
    }
    catch (error) {
        console.error("Erreur lors de l'annulation :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'annulation de la réservation." });
    }
}));
router.patch("/inscription/validation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validation des données entrantes
        console.log("validation" + req.body);
        const validatedData = datavalidationSchema.parse(req.body);
        console.log("Données validées :", validatedData);
        const client = new Cours();
        const validationReussie = yield client.validerUtilisateurAuCours(validatedData);
        if (validationReussie) {
            res.status(200).json({ message: "Présence validée avec succès." });
        }
        else {
            res.status(404).json({ message: "Présence non trouvée ou déjà annulée." });
        }
    }
    catch (error) {
        console.error("Erreur lors de la confirmation de la présence :", error);
        res.status(500).json({ message: "Erreur lors de la confirmation de la présence" });
    }
}));
router.delete("/annulation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validation des données entrantes
        const validatedData = datannulationSchema.parse(req.body);
        console.log("Données validées :", validatedData);
        const client = new Cours();
        const annulationReussie = yield client.desinscrireUtilisateurDuCours(validatedData);
        if (annulationReussie) {
            res.status(200).json({ message: "Réservation annulée avec succès." });
        }
        else {
            res.status(404).json({ message: "Réservation non trouvée ou déjà annulée." });
        }
    }
    catch (error) {
        console.error("Erreur lors de l'annulation :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'annulation de la réservation." });
    }
}));
export default router;
