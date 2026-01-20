/**
 * Messaging Routes
 * REST API endpoints for messaging and notifications
 */

import { Router, Request, Response } from 'express';
import { messageService } from '../services/message.service.js';
import { getTenantId } from '../utils/tenant.util.js';
import { getPaginationParams } from '../utils/pagination.util.js';
import { sendSuccess, sendError, sendList } from '../utils/response.util.js';
import { MessageValidationError } from '../validators/message.validator.js';
import { NotFoundError, BadRequestError } from '../utils/errors.util.js';

const router = Router();

/**
 * GET /api/messages
 * List all messages with filters and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { page, limit } = getPaginationParams(req.query);

    // Parse filters
    const filters: any = { tenantId };

    if (req.query.status) filters.status = req.query.status;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.userId) filters.userId = parseInt(req.query.userId as string);
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.unreadOnly === 'true') filters.unreadOnly = true;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    const result = await messageService.list(filters, page, limit);

    sendList(res, result.messages, result.pagination);
  } catch (error) {
    console.error('Error listing messages:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to list messages'
    );
  }
});

/**
 * GET /api/messages/stats
 * Get message statistics
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

    const stats = await messageService.getStatistics(tenantId, startDate, endDate);

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Error getting message stats:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get message statistics'
    );
  }
});

/**
 * GET /api/messages/unread
 * Get unread messages for current user
 */
router.get('/unread', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', undefined, 401);
    }

    const messages = await messageService.getUnread(userId, tenantId);

    sendSuccess(res, messages);
  } catch (error) {
    console.error('Error getting unread messages:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get unread messages'
    );
  }
});

/**
 * GET /api/messages/unread/count
 * Count unread messages for current user
 */
router.get('/unread/count', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', undefined, 401);
    }

    const count = await messageService.countUnread(userId, tenantId);

    sendSuccess(res, { count });
  } catch (error) {
    console.error('Error counting unread messages:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to count unread messages'
    );
  }
});

/**
 * GET /api/messages/sent
 * Get messages sent by current user
 */
router.get('/sent', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { page, limit } = getPaginationParams(req.query);

    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', undefined, 401);
    }

    const result = await messageService.getBySender(userId, tenantId, page, limit);

    sendList(res, result.messages, result.pagination);
  } catch (error) {
    console.error('Error getting sent messages:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get sent messages'
    );
  }
});

/**
 * GET /api/messages/received
 * Get messages received by current user
 */
router.get('/received', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { page, limit } = getPaginationParams(req.query);

    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', undefined, 401);
    }

    const result = await messageService.getByRecipient(userId, tenantId, page, limit);

    sendList(res, result.messages, result.pagination);
  } catch (error) {
    console.error('Error getting received messages:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get received messages'
    );
  }
});

/**
 * GET /api/messages/conversation/:userId
 * Get conversation between current user and another user
 */
router.get('/conversation/:userId', async (req: Request, res: Response) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    const tenantId = getTenantId(req);
    const currentUserId = (req.user as any)?.id;
    const { page, limit } = getPaginationParams(req.query);

    if (!currentUserId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', undefined, 401);
    }

    if (isNaN(otherUserId)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid user ID', undefined, 400);
    }

    const result = await messageService.getConversation(
      currentUserId,
      otherUserId,
      tenantId,
      page,
      limit
    );

    sendList(res, result.messages, result.pagination);
  } catch (error) {
    console.error('Error getting conversation:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get conversation'
    );
  }
});

/**
 * GET /api/messages/:id
 * Get message by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid message ID', undefined, 400);
    }

    const message = await messageService.getById(id, tenantId);

    sendSuccess(res, message);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error getting message:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to get message'
    );
  }
});

/**
 * POST /api/messages
 * Create and send new message
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    const messageData = {
      ...req.body,
      tenantId,
      senderId: userId
    };

    const message = await messageService.create(messageData, userId);

    sendSuccess(res, message, 'Message sent successfully', 201);
  } catch (error) {
    if (error instanceof MessageValidationError) {
      return sendError(res, 'VALIDATION_ERROR', error.message, { field: error.field }, 400);
    }

    console.error('Error creating message:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to create message'
    );
  }
});

/**
 * POST /api/messages/bulk
 * Send bulk messages to multiple recipients
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    const messageData = {
      ...req.body,
      tenantId
    };

    const result = await messageService.sendBulk(messageData, userId);

    sendSuccess(res, result, `Bulk messages sent to ${result.recipients} recipients`, 201);
  } catch (error) {
    if (error instanceof MessageValidationError) {
      return sendError(res, 'VALIDATION_ERROR', error.message, { field: error.field }, 400);
    }

    console.error('Error sending bulk messages:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to send bulk messages'
    );
  }
});

/**
 * PATCH /api/messages/:id/read
 * Mark message as read
 */
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid message ID', undefined, 400);
    }

    const message = await messageService.markAsRead(id, tenantId, userId);

    sendSuccess(res, message, 'Message marked as read');
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error marking message as read:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to mark message as read'
    );
  }
});

/**
 * POST /api/messages/read-many
 * Mark multiple messages as read
 */
router.post('/read-many', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { messageIds } = req.body;

    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', undefined, 401);
    }

    if (!messageIds || !Array.isArray(messageIds)) {
      return sendError(res, 'VALIDATION_ERROR', 'Message IDs array is required', { field: 'messageIds' }, 400);
    }

    const result = await messageService.markManyAsRead(messageIds, userId, tenantId, userId);

    sendSuccess(res, result, `${result.count} messages marked as read`);
  } catch (error) {
    if (error instanceof MessageValidationError) {
      return sendError(res, 'VALIDATION_ERROR', error.message, { field: error.field }, 400);
    }

    console.error('Error marking messages as read:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to mark messages as read'
    );
  }
});

/**
 * POST /api/messages/read-all
 * Mark all messages as read for current user
 */
router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (!userId) {
      return sendError(res, 'UNAUTHORIZED', 'User not authenticated', undefined, 401);
    }

    const result = await messageService.markAllAsRead(userId, tenantId, userId);

    sendSuccess(res, result, `${result.count} messages marked as read`);
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to mark all messages as read'
    );
  }
});

/**
 * PATCH /api/messages/:id/archive
 * Archive message
 */
router.patch('/:id/archive', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid message ID', undefined, 400);
    }

    const message = await messageService.archive(id, tenantId, userId);

    sendSuccess(res, message, 'Message archived successfully');
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error archiving message:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to archive message'
    );
  }
});

/**
 * DELETE /api/messages/:id
 * Delete message
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid message ID', undefined, 400);
    }

    await messageService.delete(id, tenantId, userId);

    sendSuccess(res, null, 'Message deleted successfully');
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, 'NOT_FOUND', error.message, undefined, 404);
    }

    console.error('Error deleting message:', error);
    sendError(
      res,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to delete message'
    );
  }
});

export default router;
