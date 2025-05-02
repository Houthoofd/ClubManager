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
import { Professeurs } from '../db/clients/professeurs/professeurs.js';
const router = express.Router();
// route pour ajouter un professeur //
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Professeurs();
        const { coursId } = req.params; // Récupère l'ID du cours depuis l'URL
        // Récupérer les utilisateurs associés à ce cours
        const professeurs = yield client.obtenirLesProfesseurs();
        console.log('Professeurs récupèrés:', professeurs);
        res.status(200).json(professeurs);
    }
    catch (error) {
        console.error('Erreur lors de la récupération du cours avec utilisateurs :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
    }
}));
// route pour ajouter un professeur //
router.post('/ajouter', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Professeurs();
        const data = req.body;
        console.log(data);
        // Récupérer les utilisateurs associés à ce cours
        const result = yield client.ajouterUnProfesseur(data);
        console.log('Professeur ajouté avec succès:', result);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Erreur lors de l'ajout ou de la modification :", error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
    }
}));
export default router;
