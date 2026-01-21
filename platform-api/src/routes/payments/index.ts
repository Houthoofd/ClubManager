import express from "express";
import stripeRoutes from "./stripe.js";
import subscriptionRoutes from "./subscriptions.js";

const router = express.Router();

// Payment routes
router.use("/stripe", stripeRoutes);
router.use("/subscriptions", subscriptionRoutes);

export default router;