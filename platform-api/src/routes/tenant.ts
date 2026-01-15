import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import tenantService from '../services/tenantService.js';
import { tenantResolver, validateUserTenant, checkTenantLimits } from '../middleware/tenant.js';
import { TenantCreateInput, TenantUpdateInput } from '../types/tenant.js';

const router = Router();

/**
 * Validation middleware helper
 */
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * @route   POST /api/tenants
 * @desc    Create a new tenant
 * @access  Super Admin only (to be implemented)
 */
router.post(
  '/',
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('slug').isSlug().isLength({ min: 2, max: 50 }).withMessage('Invalid slug format'),
    body('domain').optional().isFQDN().withMessage('Invalid domain format'),
    body('plan').isIn(['BASIC', 'PRO', 'ENTERPRISE']).withMessage('Invalid plan type'),
    body('maxUsers').optional().isInt({ min: 1 }).withMessage('Max users must be positive integer'),
    body('maxStorage').optional().isInt({ min: 100 }).withMessage('Max storage must be at least 100MB'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const tenantData: TenantCreateInput = req.body;
      const tenant = await tenantService.createTenant(tenantData);
      
      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/tenants
 * @desc    List all tenants with pagination
 * @access  Super Admin only
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await tenantService.listTenants(page, limit);
      
      res.json({
        success: true,
        data: result.tenants,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/tenants/:id
 * @desc    Get tenant by ID
 * @access  Super Admin or Tenant Admin
 */
router.get(
  '/:id',
  [
    param('id').isString().withMessage('Tenant ID required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      const tenant = await tenantService.getTenantById(tenantId);
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
        });
      }
      
      res.json({
        success: true,
        data: tenant,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   PUT /api/tenants/:id
 * @desc    Update tenant
 * @access  Super Admin or Tenant Admin
 */
router.put(
  '/:id',
  [
    param('id').isString().withMessage('Tenant ID required'),
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('domain').optional().isFQDN().withMessage('Invalid domain format'),
    body('status').optional().isIn(['ACTIVE', 'SUSPENDED', 'INACTIVE', 'TRIAL']).withMessage('Invalid status'),
    body('plan').optional().isIn(['BASIC', 'PRO', 'ENTERPRISE']).withMessage('Invalid plan type'),
    body('maxUsers').optional().isInt({ min: 1 }).withMessage('Max users must be positive integer'),
    body('maxStorage').optional().isInt({ min: 100 }).withMessage('Max storage must be at least 100MB'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      const updateData: TenantUpdateInput = req.body;
      
      const tenant = await tenantService.updateTenant(tenantId, updateData);
      
      res.json({
        success: true,
        data: tenant,
        message: 'Tenant updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/tenants/:id/suspend
 * @desc    Suspend a tenant
 * @access  Super Admin only
 */
router.post(
  '/:id/suspend',
  [
    param('id').isString().withMessage('Tenant ID required'),
    body('reason').optional().isString().withMessage('Reason must be string'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      const { reason } = req.body;
      
      const tenant = await tenantService.suspendTenant(tenantId, reason);
      
      res.json({
        success: true,
        data: tenant,
        message: 'Tenant suspended successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/tenants/:id/reactivate
 * @desc    Reactivate a tenant
 * @access  Super Admin only
 */
router.post(
  '/:id/reactivate',
  [
    param('id').isString().withMessage('Tenant ID required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      
      const tenant = await tenantService.reactivateTenant(tenantId);
      
      res.json({
        success: true,
        data: tenant,
        message: 'Tenant reactivated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/tenants/:id/usage
 * @desc    Get tenant usage statistics
 * @access  Super Admin or Tenant Admin
 */
router.get(
  '/:id/usage',
  [
    param('id').isString().withMessage('Tenant ID required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      
      const usage = await tenantService.getTenantUsage(tenantId);
      
      res.json({
        success: true,
        data: usage,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/tenants/:id/subscriptions
 * @desc    Create subscription for tenant
 * @access  Super Admin only
 */
router.post(
  '/:id/subscriptions',
  [
    param('id').isString().withMessage('Tenant ID required'),
    body('planId').isInt().withMessage('Plan ID must be integer'),
    body('startDate').isISO8601().withMessage('Invalid start date format'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    body('price').isNumeric().withMessage('Price must be numeric'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      const subscriptionData = {
        tenantId,
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      
      const subscription = await tenantService.createSubscription(subscriptionData);
      
      res.status(201).json({
        success: true,
        data: subscription,
        message: 'Subscription created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/tenants/:id
 * @desc    Delete tenant (soft delete)
 * @access  Super Admin only
 */
router.delete(
  '/:id',
  [
    param('id').isString().withMessage('Tenant ID required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      
      await tenantService.deleteTenant(tenantId);
      
      res.json({
        success: true,
        message: 'Tenant deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;