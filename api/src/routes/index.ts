// src/routes/index.ts
import express from 'express';
import utilisateursRouter from './utilisateurs.js';
import informationsRouter from './informations.js';
import coursRouter from './cours.js';
import paiementRouter from './paiements.js';
import statistiquesRouter from './statistiques.js';
import magasinRouter from './magasin.js';

const router = express.Router();

// Assurez-vous que la route pour "/utilisateurs" est correctement définie
router.use('/utilisateurs', utilisateursRouter);
router.use('/informations', informationsRouter);
router.use('/cours', coursRouter);
router.use('/cours/statistiques', statistiquesRouter);
router.use('/paiements', paiementRouter);
router.use('/magasin', magasinRouter);


export default router;
