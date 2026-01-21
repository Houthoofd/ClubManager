import express from "express";
import managementRoutes from "./management.js";
import verificationRoutes from "./verification.js";
import emailRoutes from "./email.js";

const router = express.Router();

// User management routes
router.use("/", managementRoutes); // GET /, GET /:id, POST /, PUT /:id, DELETE /:id
router.use("/verify", verificationRoutes); // POST /verify
router.use("/email", emailRoutes); // Email-related routes

export default router;