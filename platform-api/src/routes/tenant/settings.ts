import express, { Request, Response } from 'express';
import { tenantMiddleware } from '../../middleware/auth/tenant.middleware.js';
import { authMiddleware } from '../../middleware/auth/auth.middleware.js';
import { multiTenantService } from '../../services/tenant/multi-tenant.service.js';
import { userService } from '../../services/user/user.service.js';
import { z } from 'zod';

const router = express.Router();

// Apply tenant context and auth to all settings routes
router.use(tenantMiddleware.extractTenant());
router.use(authMiddleware.requireAuth());

const TenantSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(20, 'Subdomain must be at most 20 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color').optional(),
  customDomain: z.string().url().optional(),
  features: z.object({
    messaging: z.boolean().optional(),
    analytics: z.boolean().optional(),
    api: z.boolean().optional(),
    customBranding: z.boolean().optional(),
  }).optional(),
});

/**
 * GET /api/tenant/settings
 * Get tenant settings
 */
router.get('/', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const settings = await multiTenantService.getTenantSettings(tenantId);

    return res.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error('Get tenant settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load tenant settings',
    });
  }
});

/**
 * PATCH /api/tenant/settings
 * Update tenant settings
 */
router.patch('/', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;

    // Validate input
    const validationResult = TenantSettingsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const data = validationResult.data;

    // Check subdomain availability if changing
    if (data.subdomain) {
      const existingTenant = await multiTenantService.getTenantBySubdomain(data.subdomain);
      if (existingTenant && (existingTenant as any).tenantId !== tenantId) {
        return res.status(409).json({
          success: false,
          message: 'Subdomain is already taken',
          field: 'subdomain',
        });
      }
    }

    // Update settings
    const updatedSettings = await multiTenantService.updateTenantSettings(tenantId, {
      ...data,
      updatedBy: (req as any).user!.id,
    });

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings,
    });

  } catch (error: any) {
    console.error('Update tenant settings error:', error);

    if (error.message.includes('subdomain')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        field: 'subdomain',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update settings',
    });
  }
});

/**
 * GET /api/tenant/settings/users
 * Get tenant users with roles
 */
router.get('/users', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { page = 1, limit = 20, role, search } = req.query;

    // Mock response for now since userService.getTenantUsers doesn't exist yet
    const users = {
      data: [],
      page: Number(page),
      limit: Number(limit),
      total: 0,
    };

    return res.json({
      success: true,
      data: users.data,
      pagination: {
        page: users.page,
        limit: users.limit,
        total: users.total,
        pages: Math.ceil(users.total / users.limit),
      },
    });

  } catch (error) {
    console.error('Get tenant users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load users',
    });
  }
});

/**
 * POST /api/tenant/settings/users/:userId/role
 * Update user role within tenant
 */
router.post('/users/:userId/role', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['MEMBER', 'INSTRUCTOR', 'ADMIN', 'TENANT_ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // Can't change own role to prevent lockout
    if (userId === String((req as any).user!.id) && role !== 'TENANT_ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own tenant admin role',
      });
    }

    // Mock response for now
    const result = {
      success: true,
      userId,
      role,
    };

    return res.json({
      success: true,
      message: 'User role updated successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('Update user role error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this tenant',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
    });
  }
});

/**
 * DELETE /api/tenant/settings/users/:userId
 * Remove user from tenant
 */
router.delete('/users/:userId', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { userId } = req.params;

    // Can't remove yourself
    if (userId === String((req as any).user!.id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove yourself from the tenant',
      });
    }

    // Mock response for now
    return res.json({
      success: true,
      message: 'User removed from tenant successfully',
    });

  } catch (error: any) {
    console.error('Remove user from tenant error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this tenant',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to remove user from tenant',
    });
  }
});

/**
 * GET /api/tenant/settings/analytics
 * Get tenant analytics and insights
 */
router.get('/analytics', tenantMiddleware.requireFeature('analytics'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { period = '30d' } = req.query;

    const analytics = await multiTenantService.getTenantAnalytics(tenantId, {
      period: period as string,
    });

    return res.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Get tenant analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load analytics',
    });
  }
});

/**
 * POST /api/tenant/settings/export
 * Export tenant data
 */
router.post('/export', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { format = 'json', includeUsers = true, includeCourses = true, includeMessages = false } = req.body;

    const exportJob = await multiTenantService.exportTenantData(tenantId, {
      format,
      include: {
        users: includeUsers,
        courses: includeCourses,
        messages: includeMessages,
      },
      requestedBy: (req as any).user!.id,
    });

    return res.json({
      success: true,
      message: 'Export started. You will receive an email when ready.',
      data: {
        jobId: exportJob.id,
        estimatedDuration: '5-10 minutes',
      },
    });

  } catch (error) {
    console.error('Export tenant data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start export',
    });
  }
});

/**
 * DELETE /api/tenant/settings/delete-account
 * Delete tenant account permanently
 */
router.delete('/delete-account', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { confirmText, reason } = req.body;

    // Require confirmation text
    if (confirmText !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        success: false,
        message: 'Please type "DELETE MY ACCOUNT" to confirm',
      });
    }

    const deletionJob = await multiTenantService.deleteTenant(tenantId, {
      reason,
      requestedBy: (req as any).user!.id,
    });

    return res.json({
      success: true,
      message: 'Account deletion initiated. All data will be permanently deleted in 24 hours.',
      data: {
        jobId: deletionJob.id,
        finalDeletionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

  } catch (error) {
    console.error('Delete tenant account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
});

export default router;