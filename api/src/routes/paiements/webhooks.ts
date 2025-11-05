import express from 'express';
import { Paiements } from '../../db/clients/paiements/paiements.js';

const router = express.Router();

// POST - Webhook Stripe pour confirmer les paiements
router.post('/stripe', 
  express.json({ type: 'application/json' }), 
  async (req, res) => {
    // ...existing code pour /webhook/stripe depuis le fichier principal...
  }
);

export { router as webhooksRoutes };
