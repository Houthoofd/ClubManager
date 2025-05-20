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
import { Message } from '../db/clients/messages/messages.js';
const router = express.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let client = new Message();
        const types = yield client.obtenirTousLesTypesDeMessages();
        res.json(types); // ✅ On envoie la liste simple côté front
    }
    catch (error) {
        console.error('Erreur lors de la récupération des messages :', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
}));
router.post('/envoie', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { destinataires, message } = req.body;
    // Validation simple
    if (!Array.isArray(destinataires) || destinataires.length === 0) {
        return res.status(400).json({ success: false, error: 'Les destinataires sont requis.' });
    }
    if (typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ success: false, error: 'Le message est requis.' });
    }
    let client = new Message();
    try {
        // On envoie le message pour chaque destinataire
        const results = yield Promise.all(destinataires.map((id) => __awaiter(void 0, void 0, void 0, function* () {
            return yield client.envoyerMessage(id, message);
        })));
        return res.json({
            success: true,
            message_sent_count: destinataires.length,
            results, // on retourne tous les résultats
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'envoi des messages:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'envoi des messages',
        });
    }
}));
router.post('/creer', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, content } = req.body;
    // Validation simple
    if (!title || !content) {
        return res.status(400).json({ error: 'Le titre et le contenu sont requis.' });
    }
    try {
        const client = new Message();
        const result = yield client.creerTypeMessage(title, content); // <- Ici on attend la Promise
        return res.json(result); // <- On envoie la confirmation en réponse
    }
    catch (error) {
        console.error('Erreur lors de la création du message :', error);
        return res.status(500).json({ error: 'Erreur serveur.' });
    }
}));
export default router;
