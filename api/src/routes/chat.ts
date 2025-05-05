import express from 'express';
import {Compte} from '../db/clients/compte/compte.js';
import { z } from 'zod';
import { VerifyResultWithData } from '../../../packages/types/dist/index.js';
import { Chat } from 'src/db/clients/chat/chat.js';

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





export default router;