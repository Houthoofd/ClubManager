import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import app, { prisma } from "./app.js";
import {
  initializeRedisWithTests,
  shutdownRedis,
  setupRedisShutdownHandlers,
} from "./utils/redis-init.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

async function startServer() {
  try {
    console.log("🚀 [Server] Starting Club Manager API...");
    console.log(`📦 [Server] Environment: ${NODE_ENV}`);
    console.log(`🔌 [Server] Port: ${PORT}`);

    // Test database connection
    console.log("🔄 [Server] Testing database connection...");
    await prisma.$connect();

    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1 as connected`;
    console.log("✅ [Server] Database connected successfully");

    // Initialize Redis with tests
    console.log("🔄 [Server] Initializing Redis cache...");
    const redisInitialized = await initializeRedisWithTests();
    if (!redisInitialized) {
      console.warn(
        "⚠️  [Server] Redis initialization failed - running without cache",
      );
      console.warn("⚠️  [Server] Some features may have degraded performance");
    }

    // Setup Redis shutdown handlers
    setupRedisShutdownHandlers();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log("✅ [Server] Server started successfully");
      console.log(`🌐 [Server] API available at http://localhost:${PORT}`);
      console.log(`📚 [Server] Health check: http://localhost:${PORT}/health`);
      console.log("");
      console.log("Ready to accept connections! 🎉");
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log("✅ HTTP server closed");

        try {
          // Disconnect Redis
          await shutdownRedis();

          // Disconnect database
          await prisma.$disconnect();
          console.log("✅ Database connection closed");
          console.log("👋 Shutdown complete. Goodbye!");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("⚠️ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ [Server] Failed to start server:", error);

    // Ensure Prisma client is disconnected on error
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("❌ [Server] Error disconnecting Prisma:", disconnectError);
    }

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise);
  console.error("❌ Reason:", reason);
  // Don't exit in development, but log the error
  if (NODE_ENV === "production") {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  if (NODE_ENV === "production") {
    process.exit(1);
  }
});

// Start the server
startServer();
