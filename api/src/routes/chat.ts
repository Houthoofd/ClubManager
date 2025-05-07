import express from 'express';
import {Compte} from '../db/clients/compte/compte.js';
import { z } from 'zod';
import { VerifyResultWithData } from '../../../packages/types/dist/index.js';
import { Chat } from '../db/clients/chat/chat.js';

const router = express.Router();


// ✅ Route pour récupérer les derniers messages
router.get('/historique', async function (req, res, next) {
  try {
    const client = new Chat()
    const messages = await client.recupererHistorique();
    res.json(messages);
  } catch (err) {
    console.error('Erreur historique :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour envoyer un message
router.post('/envoyer', async (req, res) => {
  const { senderId, receiverId, groupeId, message } = req.body;
  console.log(req.body)
  try {
    const chatClient = new Chat();
    const result = await chatClient.envoyerMessage(senderId, receiverId, groupeId, message);
    
    // Si l'insertion réussie, renvoyer une réponse
    res.json({
      status: 'success',
      message: 'Message envoyé avec succès!',
      data: result
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message :', error);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
});



export default router;