import express from 'express';
import superAdminRouter from './super-admin.js';

const router = express.Router();

// Super admin routes for managing the entire platform
router.use('/', superAdminRouter);

export default router;