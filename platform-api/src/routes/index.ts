// src/routes/index.ts
import express from "express";
import utilisateursRouter from "./utilisateurs.js";
import informationsRouter from "./informations.js";
import coursRouter from "./cours.js";
import paiementRouter from "./paiements.js";
import statistiquesRouter from "./statistiques.js";
import magasinRouter from "./magasin.js";
import inscriptionRouter from "./inscription.js";
import verificationRouter from "./verification.js";
import authRouter from "./auth.js"; // CORRIGÉ: Import du router auth principal
import authTenantRouter from "./authTenant.js"; // NOUVEAU: Authentification tenant-aware
import tenantRouter from "./tenant.js"; // NOUVEAU: Router tenant management

// NOUVEAU: Routes modulaires Day 3
import productsRouter from "./products.js";
import inventoryRouter from "./inventory.js";
import ordersRouter from "./orders.js";
import messagingRouter from "./messaging.js";

const router = express.Router();

// Correction : montez statistiquesRouter sur /statistiques AVANT les autres routes
router.use("/statistiques", statistiquesRouter);
// NOUVEAU: Routes tenant management (admin)
router.use("/tenants", tenantRouter);
router.use("/utilisateurs", utilisateursRouter);
router.use("/informations", informationsRouter);
router.use("/cours", coursRouter);
router.use("/paiements", paiementRouter);
router.use("/magasin", magasinRouter);
router.use("/inscription", inscriptionRouter);
router.use("/verification", verificationRouter);
router.use("/auth", authRouter); // CORRIGÉ: Utiliser le router auth principal
router.use("/auth-tenant", authTenantRouter); // NOUVEAU: Authentification SaaS multitenant

// NOUVEAU: Routes modulaires Day 3
router.use("/products", productsRouter); // Gestion produits
router.use("/inventory", inventoryRouter); // Gestion inventaire/stock
router.use("/orders", ordersRouter); // Gestion commandes
router.use("/messaging", messagingRouter); // Messagerie et notifications

export default router;
