/**
 * Routes REST pour le module Alertes
 * ✅ MIGRÉ : Routes compatibles avec la nouvelle architecture
 * - Handlers utilisent les services partagés
 * - GraphQL resolvers disponibles
 * - Erreurs standardisées
 */

import express from "express";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import {
  getDashboard,
  getAlertesActives,
  getAlertesUtilisateur,
  detecterAlertesHandler,
  resoudreAlerteHandler,
  ignorerAlerteHandler,
} from "./core/index.js";

const router = express.Router();

console.log("🔧 [Alertes Routes] Initialisation des routes alertes");

// Middleware pour vérifier que l'utilisateur est super-admin
router.use(verifyToken);
router.use(requireRole(["super-administrateur"]));

// Routes
router.get("/dashboard", getDashboard);
router.get("/actives", getAlertesActives);
router.get("/utilisateur/:userId", getAlertesUtilisateur);
router.post("/detecter", detecterAlertesHandler);
router.put("/:alerteId/resoudre", resoudreAlerteHandler);
router.put("/:alerteId/ignorer", ignorerAlerteHandler);

console.log("✅ [Alertes Routes] Routes alertes chargées");

export default router;
