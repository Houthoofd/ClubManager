// src/routes/index.ts
import express from "express";

// Import new modular routes
import authRoutes from "./auth/index.js";
import userRoutes from "./users/index.js";
import paymentRoutes from "./payments/index.js";
import messagingRoutes from "./messaging/index.js";
import adminRoutes from "./admin/index.js";
import utilsRoutes from "./utils/index.js";

// Import new tenant and admin routes
import tenantRouter from "./tenant/index.js";
import adminRouter from "./admin/index.js";

// Import active routes
import productsRouter from "./products/index.js";
import inventoryRouter from "./inventory/index.js";
import ordersRouter from "./orders/index.js";
import webhooksRouter from "./utils/webhooks.js";
import healthRouter from "./utils/health.js";
import apiRouter from "./api.js";

const router = express.Router();

// === NEW MODULAR ROUTES ===
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/payments", paymentRoutes);
router.use("/messaging", messagingRoutes);
router.use("/admin", adminRouter);
router.use("/utils", utilsRoutes);
router.use("/tenant", tenantRouter);

// === ACTIVE ROUTES ===
router.use("/api", apiRouter);
router.use("/health", healthRouter);
router.use("/webhooks", webhooksRouter);
router.use("/products", productsRouter);
router.use("/inventory", inventoryRouter);
router.use("/orders", ordersRouter);

// Legacy commerce & inventory
router.use("/products", productsRouter);
router.use("/inventory", inventoryRouter);
router.use("/orders", ordersRouter);

// Other active routes
router.use("/webhooks", webhooksRouter);
router.use("/health", healthRouter);
router.use("/api", apiRouter);

export default router;
