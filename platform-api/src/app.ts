import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import webhooksRouter from "./routes/webhooks.js";
import healthRouter from "./routes/health.js";
import {
  fullAppChain,
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
} from "./middleware/index.js";

// Charger les variables d'environnement
dotenv.config();

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialize Prisma Client
const prisma = new PrismaClient();

const app = express();

// IMPORTANT: Les webhooks Stripe doivent être traités AVANT express.json()
// car Stripe a besoin du body brut pour vérifier la signature
app.use("/webhooks", express.raw({ type: "application/json" }), webhooksRouter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Global middlewares (Logger + CORS + Security + Sanitization)
app.use(fullAppChain);

// ========== ROUTES ==========
// Import API routes
import apiRouter from "./routes/api.js";

// Mount API routes
app.use("/api", apiRouter);

// Route par défaut
app.get("/", (req, res) => {
  res.json({
    message: "API Club Manager",
    version: "2.0.0",
    documentation: "/api/docs",
    health: "/health",
    status: "ok",
  });
});

// 404 handler (doit être avant l'error handler)
app.use(notFoundHandler);

// Error handler global (DOIT ÊTRE LE DERNIER MIDDLEWARE)
app.use(errorHandler);

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} signal received: closing HTTP server gracefully`);

  try {
    // Fermer les connexions Prisma
    await prisma.$disconnect();
    console.log("✅ Prisma client disconnected");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
export { prisma };
