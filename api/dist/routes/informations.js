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
import { Informations } from '../db/clients/informations/informations.js';
const router = express.Router();
router.get('/grades', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Informations();
        // Appel de la méthode pour obtenir les grades
        const grades = yield client.obtenirLesGrades();
        if (grades && grades.length > 0) {
            console.log('Grades récupérés:', grades);
            res.status(200).json(grades);
        }
        else {
            console.log('Aucun grade trouvé.');
            res.status(404).json({ message: 'Aucun grade trouvé.' });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des grades :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des grades.' });
    }
}));
router.get('/genres', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Informations();
        // Appel de la méthode pour obtenir les genres
        const genres = yield client.obtenirLesGenres();
        if (genres && genres.length > 0) {
            console.log('Genres récupérés:', genres);
            res.status(200).json(genres);
        }
        else {
            console.log('Aucun genres trouvé.');
            res.status(404).json({ message: 'Aucun genres trouvé.' });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des genres :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des genres.' });
    }
}));
router.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Informations();
        // Appel de la méthode pour obtenir les status
        const status = yield client.obtenirLeStatus();
        if (status && status.length > 0) {
            console.log('Status récupérés:', status);
            res.status(200).json(status);
        }
        else {
            console.log('Aucun status trouvé.');
            res.status(404).json({ message: 'Aucun status trouvé.' });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des status :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des status.' });
    }
}));
router.get('/abonnements', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Informations();
        // Appel de la méthode pour obtenir les plans tarifaires
        const plansTarifaires = yield client.obtenirLesPlansTarifaires();
        if (plansTarifaires && plansTarifaires.length > 0) {
            console.log('plans tarifaires récupérés:', plansTarifaires);
            res.status(200).json(plansTarifaires);
        }
        else {
            console.log('Aucun plans tarifaires trouvé.');
            res.status(404).json({ message: 'Aucun plans tarifaires trouvé.' });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des plans tarifaires :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des plans tarifaires.' });
    }
}));
export default router;
