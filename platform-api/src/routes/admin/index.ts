import express from "express";
import statisticsRoutes from "./statistics.js";

const router = express.Router();

// Admin routes
router.use("/statistics", statisticsRoutes);

export default router;