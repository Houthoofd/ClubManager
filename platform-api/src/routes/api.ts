import { Router } from "express";
import {
  requireAuthAndTenant,
  requireTenant,
  validateBody,
  validateQuery,
  validateParams,
  auditLogger,
  auditUpdate,
  auditDelete,
  requireRole,
  tenantRateLimiter,
} from "../middleware/index.js";

// Import route modules - MODERNIZED (Prisma)
import productsRouter from "./products.js";
import inventoryRouter from "./inventory.js";
import ordersRouter from "./orders.js";
import messagingRouter from "./messaging.js";
import authRouter from "./auth.js";
import healthRouter from "./health.js";

// LEGACY ROUTES - TEMPORARILY DISABLED (depend on mysqlconnector/old DB clients)
// These routes need to be rewritten to use Prisma
// import utilisateursRouter from "./utilisateurs.js";
// import coursRouter from "./cours.js";
// import compteRouter from "./compte.js";
// import magasinRouter from "./magasin.js";
// import professeursRouter from "./professeurs.js";
// import messagesRouter from "./messages.js";
// import statistiquesRouter from "./statistiques.js";
// import informationsRouter from "./informations.js";

const router = Router();

/**
 * Routes publiques (sans authentification)
 */

// Health checks (no auth, no rate limit)
router.use("/health", healthRouter);

// Auth routes (login, register, forgot password)
router.use("/auth", authRouter);

/**
 * Routes protégées (avec authentification + tenant)
 */

// Apply rate limiting to all protected routes
router.use(tenantRateLimiter);

// Products (nouvelle architecture modulaire)
router.use("/products", requireAuthAndTenant, productsRouter);

// Inventory management
router.use("/inventory", requireAuthAndTenant, inventoryRouter);

// Orders management
router.use("/orders", requireAuthAndTenant, ordersRouter);

// Messaging system
router.use("/messaging", requireAuthAndTenant, messagingRouter);

/**
 * Routes legacy (TEMPORARILY DISABLED - need Prisma migration)
 * These routes depend on old mysqlconnector and DB clients
 * To re-enable: rewrite using Prisma, uncomment imports above, then uncomment below
 */

// Users management
// router.use("/utilisateurs", requireAuthAndTenant, utilisateursRouter);

// Courses management
// router.use("/cours", requireAuthAndTenant, coursRouter);

// Account management
// router.use("/compte", requireAuthAndTenant, compteRouter);

// Shop management (legacy)
// router.use("/magasin", requireAuthAndTenant, magasinRouter);

// Teachers management
// router.use("/professeurs", requireAuthAndTenant, professeursRouter);

// Messages (legacy - différent de messaging)
// router.use("/messages", requireAuthAndTenant, messagesRouter);

// Statistics
// router.use("/statistiques", requireAuthAndTenant, statistiquesRouter);

// Information management
// router.use("/informations", requireAuthAndTenant, informationsRouter);

/**
 * Catch-all pour routes API non trouvées
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "/api/health",
      "/api/auth",
      "/api/products",
      "/api/inventory",
      "/api/orders",
      "/api/messaging",
      // Legacy routes (currently disabled):
      // "/api/utilisateurs",
      // "/api/cours",
      // "/api/compte",
      // "/api/magasin",
      // "/api/professeurs",
      // "/api/messages",
      // "/api/statistiques",
      // "/api/informations",
    ],
  });
});

export default router;
