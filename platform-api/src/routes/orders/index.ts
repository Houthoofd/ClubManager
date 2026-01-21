/**
 * Orders Routes
 * REST API endpoints for order management
 */

import { Router, Request, Response } from 'express';
import { orderService } from '../../services/order/order.service.js';
import { getTenantId } from '../../utils/tenant.util.js';
import { getPaginationParams } from '../../utils/pagination.util.js';
import { sendSuccess, sendError, sendList } from '../../utils/response.util.js';
import { ShopValidationError } from '../../validators/shop.validator.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.util.js';

const router = Router();

/**
 * GET /api/orders
 * List all orders with filters and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { page, limit } = getPaginationParams(req.query);

    // Parse filters
    const filters: any = { tenantId };

    if (req.query.status) filters.status = req.query.status;
    if (req.query.userId) filters.userId = parseInt(req.query.userId as string);
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
    if (req.query.minAmount) filters.minAmount = parseFloat(req.query.minAmount as string);
    if (req.query.maxAmount) filters.maxAmount = parseFloat(req.query.maxAmount as string);

    const result = await orderService.list(filters, page, limit);

    sendList(res, result.orders, result.pagination);
  } catch (error) {
    console.error('Error listing orders:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to list orders'
    );
  }
});

/**
 * GET /api/orders/stats
 * Get order statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
    }

    const stats = await orderService.getStatistics(tenantId, startDate, endDate);

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Error getting order stats:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get order statistics'
    );
  }
});

/**
 * GET /api/orders/recent
 * Get recent orders
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const orders = await orderService.getRecent(limit, tenantId);

    sendSuccess(res, orders);
  } catch (error) {
    console.error('Error getting recent orders:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get recent orders'
    );
  }
});

/**
 * GET /api/orders/user/:userId
 * Get orders by user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const tenantId = getTenantId(req);
    const { page, limit } = getPaginationParams(req.query);

    if (isNaN(userId)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid user ID', undefined, 400);
    }

    const result = await orderService.getByUser(userId, tenantId, page, limit);

    sendList(res, result.orders, result.pagination);
  } catch (error) {
    console.error('Error getting user orders:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get user orders'
    );
  }
});

/**
 * GET /api/orders/product/:productId
 * Get orders by product
 */
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const tenantId = getTenantId(req);
    const { page, limit } = getPaginationParams(req.query);

    if (isNaN(productId)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid product ID', undefined, 400);
    }

    const result = await orderService.getByProduct(productId, tenantId, page, limit);

    sendList(res, result.orders, result.pagination);
  } catch (error) {
    console.error('Error getting product orders:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get product orders'
    );
  }
});

/**
 * GET /api/orders/:id
 * Get order by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid order ID', undefined, 400);
    }

    const order = await orderService.getById(id, tenantId);

    sendSuccess(res, order);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error getting order:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get order'
    );
  }
});

/**
 * POST /api/orders
 * Create new order
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    const orderData = {
      ...req.body,
      tenantId
    };

    const order = await orderService.create(orderData, userId);

    sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error) {
    if (error instanceof ShopValidationError) {
      return sendError(res, 'VALIDATION_ERROR', error.message, { field: error.field }, 400);
    }
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error creating order:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to create order'
    );
  }
});

/**
 * POST /api/orders/calculate
 * Calculate order total
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return sendError(res, 'VALIDATION_ERROR', 'Items array is required', { field: 'items' }, 400);
    }

    const totals = await orderService.calculateTotal(items, tenantId);

    sendSuccess(res, totals);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error calculating order total:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to calculate order total'
    );
  }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { status } = req.body;

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid order ID', undefined, 400);
    }

    if (!status) {
      return sendError(res, 'VALIDATION_ERROR', 'Status is required', { field: 'status' }, 400);
    }

    const order = await orderService.updateStatus(id, status, tenantId, userId);

    sendSuccess(res, order, 'Order status updated successfully');
  } catch (error) {
    if (error instanceof BadRequestError) {
      return sendError(res, 'BAD_REQUEST', error.message, undefined, 400);
    }
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error updating order status:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to update order status'
    );
  }
});

/**
 * PATCH /api/orders/:id/confirm
 * Confirm order
 */
router.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid order ID', undefined, 400);
    }

    const order = await orderService.confirm(id, tenantId, userId);

    sendSuccess(res, order, 'Order confirmed successfully');
  } catch (error) {
    if (error instanceof BadRequestError) {
      return sendError(res, 'BAD_REQUEST', error.message, undefined, 400);
    }
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error confirming order:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to confirm order'
    );
  }
});

/**
 * PATCH /api/orders/:id/cancel
 * Cancel order
 */
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { reason } = req.body;

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid order ID', undefined, 400);
    }

    const order = await orderService.cancel(id, tenantId, userId, reason);

    sendSuccess(res, order, 'Order cancelled successfully');
  } catch (error) {
    if (error instanceof BadRequestError) {
      return sendError(res, 'BAD_REQUEST', error.message, undefined, 400);
    }
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error cancelling order:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to cancel order'
    );
  }
});

/**
 * PATCH /api/orders/:id/deliver
 * Mark order as delivered
 */
router.patch('/:id/deliver', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid order ID', undefined, 400);
    }

    const order = await orderService.deliver(id, tenantId, userId);

    sendSuccess(res, order, 'Order marked as delivered');
  } catch (error) {
    if (error instanceof BadRequestError) {
      return sendError(res, 'BAD_REQUEST', error.message, undefined, 400);
    }
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error delivering order:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to mark order as delivered'
    );
  }
});

/**
 * DELETE /api/orders/:id
 * Delete order
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid order ID', undefined, 400);
    }

    await orderService.delete(id, tenantId, userId);

    sendSuccess(res, null, 'Order deleted successfully');
  } catch (error) {
    if (error instanceof BadRequestError) {
      return sendError(res, 'BAD_REQUEST', error.message, undefined, 400);
    }
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error deleting order:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to delete order'
    );
  }
});

export default router;
