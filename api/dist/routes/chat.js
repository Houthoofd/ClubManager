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
import { Chat } from '../db/clients/chat/chat.js';
const router = express.Router();
// ✅ Route pour récupérer les derniers messages
router.get('/historique', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = new Chat();
            const messages = yield client.recupererHistorique();
            res.json(messages);
        }
        catch (err) {
            console.error('Erreur historique :', err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    });
});
// Route pour envoyer un message
router.post('/envoyer', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId, groupeId, message } = req.body;
    console.log(req.body);
    try {
        const chatClient = new Chat();
        const result = yield chatClient.envoyerMessage(senderId, receiverId, groupeId, message);
        // Si l'insertion réussie, renvoyer une réponse
        res.json({
            status: 'success',
            message: 'Message envoyé avec succès!',
            data: result
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'envoi du message :', error);
        res.status(500).json({ status: 'error', message: 'Erreur serveur' });
    }
}));
export default router;
