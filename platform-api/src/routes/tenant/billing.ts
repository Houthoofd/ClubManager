import express, { Request, Response } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { multiTenantService } from '../../services/tenant/multi-tenant.service.js';

const router = express.Router();

// Apply tenant context and auth to all billing routes
router.use(tenantMiddleware.extractTenant());
router.use(authMiddleware.requireAuth());

/**
 * GET /api/tenant/billing/subscription
 * Get current tenant subscription details
 */
router.get('/subscription', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const subscription = await multiTenantService.getTenantSubscription(tenantId);

    return res.json({
      success: true,
      data: subscription,
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load subscription details',
    });
  }
});

/**
 * POST /api/tenant/billing/upgrade
 * Upgrade/downgrade tenant subscription
 */
router.post('/upgrade', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { planId, paymentMethodId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required',
      });
    }

    const validPlans = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID',
      });
    }

    // Check if upgrade is valid
    const currentSubscription = await multiTenantService.getTenantSubscription(tenantId);
    if (currentSubscription.plan === planId) {
      return res.status(400).json({
        success: false,
        message: 'You are already on this plan',
      });
    }

    // Process plan change
    const result = await multiTenantService.changeTenantPlan(tenantId, {
      newPlan: planId,
      paymentMethodId: paymentMethodId,
      userId: (req as any).user!.id,
    });

    return res.json({
      success: true,
      message: 'Plan updated successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('Plan upgrade error:', error);

    if (error.message.includes('payment')) {
      return res.status(402).json({
        success: false,
        message: 'Payment failed. Please check your payment method.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update plan. Please try again.',
    });
  }
});

/**
 * GET /api/tenant/billing/usage
 * Get current tenant usage and limits
 */
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const usage = await multiTenantService.getTenantUsage(tenantId);

    return res.json({
      success: true,
      data: usage,
    });

  } catch (error) {
    console.error('Get usage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load usage information',
    });
  }
});

/**
 * GET /api/tenant/billing/invoices
 * Get tenant billing history
 */
router.get('/invoices', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { page = 1, limit = 10 } = req.query;

    const invoices = await multiTenantService.getTenantInvoices(tenantId, {
      page: Number(page),
      limit: Number(limit),
    });

    return res.json({
      success: true,
      data: invoices.data,
      pagination: {
        page: invoices.page,
        limit: invoices.limit,
        total: invoices.total,
        pages: Math.ceil(invoices.total / invoices.limit),
      },
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load billing history',
    });
  }
});

/**
 * POST /api/tenant/billing/payment-method
 * Add or update payment method
 */
router.post('/payment-method', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { paymentMethodId, isDefault = true } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required',
      });
    }

    const result = await multiTenantService.updatePaymentMethod(tenantId, {
      paymentMethodId,
      isDefault,
      userId: (req as any).user!.id,
    });

    return res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('Update payment method error:', error);

    if (error.message.includes('invalid')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update payment method',
    });
  }
});

/**
 * POST /api/tenant/billing/cancel
 * Cancel tenant subscription (at period end)
 */
router.post('/cancel', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;
    const { reason } = req.body;

    const result = await multiTenantService.cancelSubscription(tenantId, {
      reason,
      userId: (req as any).user!.id,
      cancelAtPeriodEnd: true,
    });

    return res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      data: result,
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
    });
  }
});

/**
 * POST /api/tenant/billing/reactivate
 * Reactivate a cancelled subscription
 */
router.post('/reactivate', authMiddleware.requireRole('TENANT_ADMIN'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId!;

    const result = await multiTenantService.reactivateSubscription(tenantId, {
      userId: (req as any).user!.id,
    });

    return res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('Reactivate subscription error:', error);

    if (error.message.includes('not cancelled')) {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not cancelled',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to reactivate subscription',
    });
  }
});

export default router;