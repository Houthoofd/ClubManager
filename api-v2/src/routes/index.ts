// src/routes/index.ts
import express from "express";
import { alertesRouter } from "./alertes/index.js";
import { commandesRouter } from "./commandes/index.js";
import utilisateursRouter from "./utilisateurs.js";
import informationsRouter from "./informations.js";
import coursRouter from "./cours.js";
import paiementRouter from "./paiements.js";
import statistiquesRouter from "./statistiques.js";
import magasinRouter from "./magasin.js";
import inscriptionRouter from "./inscription.js";
import verificationRouter from "./verification.js";
import { authRouter } from "./auth/index.js";

const router = express.Router();

// Correction : montez statistiquesRouter sur /statistiques AVANT les autres routes
router.use("/statistiques", statistiquesRouter);
router.use("/alertes", alertesRouter);
router.use("/commandes", commandesRouter);
router.use("/utilisateurs", utilisateursRouter);
router.use("/informations", informationsRouter);
router.use("/cours", coursRouter);
router.use("/paiements", paiementRouter);
router.use("/magasin", magasinRouter);
router.use("/inscription", inscriptionRouter);
router.use("/verification", verificationRouter);
router.use("/auth", authRouter);

export default router;
