import express from "express";
import messageRoutes from "./messages.js";

const router = express.Router();

// Messaging routes
router.use("/messages", messageRoutes);

export default router;