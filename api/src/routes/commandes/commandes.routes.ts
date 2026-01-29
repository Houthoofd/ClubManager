import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getCommandes,
  getCommande,
  updateStatut,
  batchUpdateStatuts,
  paymentConfirmation,
} from "./core/index.js";

const router = express.Router();

// Middleware pour vérifier l'authentification sur toutes les routes
router.use(verifyToken);

// Routes principales
router.get("/", getCommandes);
router.get("/:id", getCommande);
router.put("/:id/statut", updateStatut);

// Routes de batch update
router.put("/batch/statuts-safe", batchUpdateStatuts);

// Routes de paiement
router.post("/paiement/confirmation", paymentConfirmation);

export default router;
