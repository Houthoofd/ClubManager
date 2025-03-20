// src/routes/index.ts
import express from 'express';
import utilisateursRouter from './utilisateurs.js';
import informationsRouter from './informations.js';
import coursRouter from './cours.js';

const router = express.Router();

// Assurez-vous que la route pour "/utilisateurs" est correctement définie
router.use('/utilisateurs', utilisateursRouter);
router.use('/informations', informationsRouter);
router.use('/cours', coursRouter);

export default router;
