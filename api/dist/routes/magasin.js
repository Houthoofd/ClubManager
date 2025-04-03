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
import { Magasin } from '../db/clients/magasin/magasin.js';
const router = express.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = new Magasin();
        const { coursId } = req.params; // Récupère l'ID du cours depuis l'URL
        // Récupérer les utilisateurs associés à ce cours
        const result = yield client.obtenirLesArticles();
        console.log('articles récipèrés avec succès', result);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Erreur lors de la récupération des articles :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
    }
}));
export default router;
