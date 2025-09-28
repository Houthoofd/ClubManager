import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Messages } from '../db/clients/messages/messages.js';
const router = express.Router();
// Appliquer l'authentification à toutes les routes
router.use(verifyToken);
router.get('/', async (req, res) => {
    try {
        let client = new Messages();
        const types = await client.obtenirMessages();
        res.json(types);
    }
    catch (error) {
        console.error('Erreur lors de la récupération des messages :', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});
router.post('/envoie', async (req, res) => {
    const { destinataires, message } = req.body;
    // Validation simple
    if (!Array.isArray(destinataires) || destinataires.length === 0) {
        return res.status(400).json({ success: false, error: 'Les destinataires sont requis.' });
    }
    if (typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ success: false, error: 'Le message est requis.' });
    }
    let client = new Messages();
    try {
        // On envoie le message pour chaque destinataire
        const results = await Promise.all(destinataires.map(async (id) => {
            return await client.envoyerMessage({
                destinataires: [id],
                contenu: message,
                sender_id: req.user?.id
            });
        }));
        return res.json({
            success: true,
            message_sent_count: destinataires.length,
            results,
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'envoi des messages:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'envoi des messages',
        });
    }
});
router.post('/creer', async (req, res) => {
    const { title, content } = req.body;
    // Validation simple
    if (!title || !content) {
        return res.status(400).json({ error: 'Le titre et le contenu sont requis.' });
    }
    try {
        const client = new Messages();
        const result = await client.obtenirMessagesPersonnalises();
        return res.json(result);
    }
    catch (error) {
        console.error('Erreur lors de la création du message :', error);
        return res.status(500).json({ error: 'Erreur serveur.' });
    }
});
export default router;
