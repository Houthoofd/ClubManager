import express from 'express';
import signupRouter from './signup.js';
import billingRouter from './billing.js';
import settingsRouter from './settings.js';

const router = express.Router();

// Tenant-specific routes
router.use('/', signupRouter);
router.use('/billing', billingRouter);
router.use('/settings', settingsRouter);

export default router;