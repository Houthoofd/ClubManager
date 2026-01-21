import express from "express";
import loginRoutes from "./login.js";
import registerRoutes from "./register.js";
import logoutRoutes from "./logout.js";
import passwordResetRoutes from "./password-reset.js";
import verifyRoutes from "./verify.js";
import profileRoutes from "./profile.js";

const router = express.Router();

// Auth routes
router.use("/login", loginRoutes);
router.use("/register", registerRoutes);
router.use("/logout", logoutRoutes);
router.use("/verify", verifyRoutes);
router.use("/", profileRoutes); // /me et /profile
router.use("/password", passwordResetRoutes); // /password/forgot et /password/reset

export default router;