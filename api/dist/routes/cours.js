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
const router = express.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Cours();
        // Appel de la méthode pour obtenir les grades
        const cours = yield client.obtenirLesCours();
        if (cours && cours.length > 0) {
            console.log('Cours récupérés:', cours);
            res.status(200).json(cours);
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
export default router;
