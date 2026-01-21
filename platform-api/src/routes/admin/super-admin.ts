import express, { Request, Response } from 'express';
import { multiTenantService } from '../../services/tenant/multi-tenant.service.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Require super admin for all admin routes
router.use(authMiddleware.requireSuperAdmin());

/**
 * GET /api/admin/tenants
 * Get all tenants with pagination and filtering
 */
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      plan, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const tenants = await multiTenantService.getAllTenants({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      plan: plan as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    return res.json({
      success: true,
      data: tenants.data,
      pagination: {
        page: tenants.page,
        limit: tenants.limit,
        total: tenants.total,
        pages: Math.ceil(tenants.total / tenants.limit),
      },
    });

  } catch (error) {
    console.error('Get all tenants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load tenants',
    });
  }
});

/**
 * GET /api/admin/tenants/:tenantId
 * Get detailed tenant information
 */
router.get('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const tenant = await multiTenantService.getTenantDetails(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    return res.json({
      success: true,
      data: tenant,
    });

  } catch (error) {
    console.error('Get tenant details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load tenant details',
    });
  }
});

/**
 * PATCH /api/admin/tenants/:tenantId/status
 * Update tenant status (suspend, activate, etc.)
 */
router.patch('/tenants/:tenantId/status', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'DELETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const result = await multiTenantService.updateTenantStatus(tenantId, {
      status,
      reason,
      updatedBy: req.user!.id,
    });

    return res.json({
      success: true,
      message: `Tenant status updated to ${status}`,
      data: result,
    });

  } catch (error: any) {
    console.error('Update tenant status error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update tenant status',
    });
  }
});

/**
 * GET /api/admin/analytics/overview
 * Get platform-wide analytics overview
 */
router.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    const analytics = await multiTenantService.getPlatformAnalytics({
      period: period as string,
    });

    return res.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Get platform analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load analytics',
    });
  }
});

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics
 */
router.get('/analytics/revenue', async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    const revenue = await multiTenantService.getRevenueAnalytics({
      period: period as string,
    });

    return res.json({
      success: true,
      data: revenue,
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load revenue analytics',
    });
  }
});

/**
 * POST /api/admin/tenants/:tenantId/impersonate
 * Generate impersonation token for tenant admin
 */
router.post('/tenants/:tenantId/impersonate', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason for impersonation is required (minimum 10 characters)',
      });
    }

    const impersonationToken = await multiTenantService.createImpersonationToken(tenantId, {
      reason,
      createdBy: req.user!.id,
      expiresIn: '1h', // 1 hour
    });

    return res.json({
      success: true,
      message: 'Impersonation token created',
      data: {
        token: impersonationToken.token,
        expiresAt: impersonationToken.expiresAt,
        tenantUrl: `https://${impersonationToken.tenant.subdomain}.clubmanager.app`,
      },
    });

  } catch (error: any) {
    console.error('Create impersonation token error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create impersonation token',
    });
  }
});

/**
 * GET /api/admin/system/health
 * Get system health metrics
 */
router.get('/system/health', async (req: Request, res: Response) => {
  try {
    const health = await multiTenantService.getSystemHealth();

    return res.json({
      success: true,
      data: health,
    });

  } catch (error) {
    console.error('Get system health error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load system health',
    });
  }
});

/**
 * POST /api/admin/system/maintenance
 * Enable/disable maintenance mode
 */
router.post('/system/maintenance', async (req: Request, res: Response) => {
  try {
    const { enabled, message, estimatedDuration } = req.body;

    const result = await multiTenantService.setMaintenanceMode({
      enabled: Boolean(enabled),
      message: message || 'System is under maintenance',
      estimatedDuration,
      setBy: req.user!.id,
    });

    return res.json({
      success: true,
      message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
      data: result,
    });

  } catch (error) {
    console.error('Set maintenance mode error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update maintenance mode',
    });
  }
});

/**
 * GET /api/admin/logs/audit
 * Get platform audit logs
 */
router.get('/logs/audit', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      userId, 
      tenantId,
      startDate,
      endDate 
    } = req.query;

    const logs = await multiTenantService.getAuditLogs({
      page: Number(page),
      limit: Number(limit),
      action: action as string,
      userId: userId as string,
      tenantId: tenantId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return res.json({
      success: true,
      data: logs.data,
      pagination: {
        page: logs.page,
        limit: logs.limit,
        total: logs.total,
        pages: Math.ceil(logs.total / logs.limit),
      },
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load audit logs',
    });
  }
});

export default router;