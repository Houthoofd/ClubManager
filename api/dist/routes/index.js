// src/routes/index.ts
import express from 'express';
import utilisateursRouter from './utilisateurs.js'; // Si tu as un fichier utilisateurs.js
const router = express.Router();
// Assurez-vous que la route pour "/utilisateurs" est correctement définie
router.use('/utilisateurs', utilisateursRouter);
export default router;
