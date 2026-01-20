/**
 * Message Service
 * Core business logic for messaging and notifications
 */

import { PrismaClient } from '@prisma/client';
import { MessageRepository } from '../repositories/message.repository.js';
import {
  CreateMessageDTO,
  BulkMessageDTO,
  UpdateMessageDTO,
  MessageFilters,
  MessageStatus,
  MessageType,
  MessageStats
} from '../types/message.types.js';
import {
  validateCreateMessage,
  validateBulkMessage,
  validateUpdateMessage,
  validateMessageId,
  validateMessageStatusTransition,
  MessageValidationError
} from '../validators/message.validator.js';
import { NotFoundError, BadRequestError } from '../utils/errors.util.js';
import { auditService } from './auditService.js';
import { emailService } from './emailService.js';

export class MessageService {
  private repository: MessageRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new MessageRepository(prisma);
  }

  /**
   * Get message by ID
   */
  async getById(id: number, tenantId: number) {
    validateMessageId(id);

    const message = await this.repository.findById(id, tenantId);
    if (!message) {
      throw new NotFoundError('Message');
    }

    return message;
  }

  /**
   * List messages with filters and pagination
   */
  async list(filters: MessageFilters, page = 1, limit = 20) {
    return this.repository.findAll(filters, page, limit);
  }

  /**
   * Get messages by recipient
   */
  async getByRecipient(recipientId: number, tenantId: number, page = 1, limit = 20) {
    return this.repository.findByRecipient(recipientId, tenantId, page, limit);
  }

  /**
   * Get messages by sender
   */
  async getBySender(senderId: number, tenantId: number, page = 1, limit = 20) {
    return this.repository.findBySender(senderId, tenantId, page, limit);
  }

  /**
   * Get unread messages for a user
   */
  async getUnread(recipientId: number, tenantId: number) {
    return this.repository.findUnread(recipientId, tenantId);
  }

  /**
   * Count unread messages
   */
  async countUnread(recipientId: number, tenantId: number): Promise<number> {
    return this.repository.countUnread(recipientId, tenantId);
  }

  /**
   * Create new message
   */
  async create(data: CreateMessageDTO, userId?: number) {
    // Validate input
    validateCreateMessage(data);

    // Create message
    const message = await this.repository.create({
      recipient: { connect: { id: data.recipientId } },
      ...(data.senderId && { sender: { connect: { id: data.senderId } } }),
      tenant: { connect: { id: data.tenantId } },
      subject: data.subject,
      body: data.body,
      type: data.type,
      priority: data.priority || 'NORMAL',
      status: data.scheduledAt ? MessageStatus.DRAFT : MessageStatus.SENT,
      metadata: data.metadata,
      scheduledAt: data.scheduledAt
    });

    // Send immediately if not scheduled
    if (!data.scheduledAt) {
      await this.sendMessage(message.id, data.tenantId);
    }

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'MESSAGE_CREATE',
        userId,
        tenantId: data.tenantId,
        resourceType: 'Message',
        resourceId: message.id,
        details: {
          recipientId: data.recipientId,
          type: data.type,
          scheduled: !!data.scheduledAt
        }
      });
    }

    return message;
  }

  /**
   * Send bulk messages to multiple recipients
   */
  async sendBulk(data: BulkMessageDTO, userId?: number) {
    // Validate input
    validateBulkMessage(data);

    // Create messages for each recipient
    const messages = data.recipientIds.map(recipientId => ({
      recipientId,
      subject: data.subject,
      body: data.body,
      type: data.type,
      priority: data.priority || 'NORMAL',
      status: MessageStatus.SENT,
      tenantId: data.tenantId,
      metadata: data.metadata
    }));

    // Bulk create
    const result = await this.repository.bulkCreate(messages);

    // Send emails if type is EMAIL
    if (data.type === MessageType.EMAIL) {
      for (const recipientId of data.recipientIds) {
        this.sendEmailMessage(recipientId, data.subject, data.body, data.tenantId).catch(err => {
          console.error(`Failed to send email to recipient ${recipientId}:`, err);
        });
      }
    }

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'MESSAGE_BULK_SEND',
        userId,
        tenantId: data.tenantId,
        resourceType: 'Message',
        details: {
          recipientCount: data.recipientIds.length,
          type: data.type
        }
      });
    }

    return {
      count: result.count,
      recipients: data.recipientIds.length
    };
  }

  /**
   * Update message
   */
  async update(id: number, data: UpdateMessageDTO, tenantId: number, userId?: number) {
    validateMessageId(id);
    validateUpdateMessage(data);

    const existing = await this.getById(id, tenantId);

    // Validate status transition if status is being updated
    if (data.status && data.status !== existing.status) {
      try {
        validateMessageStatusTransition(existing.status as MessageStatus, data.status);
      } catch (error) {
        throw new BadRequestError(
          error instanceof Error ? error.message : 'Invalid status transition'
        );
      }
    }

    const message = await this.repository.update(id, data, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'MESSAGE_UPDATE',
        userId,
        tenantId,
        resourceType: 'Message',
        resourceId: id,
        details: { changes: data }
      });
    }

    return message;
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: number, tenantId: number, userId?: number) {
    validateMessageId(id);

    const message = await this.repository.markAsRead(id, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'MESSAGE_READ',
        userId,
        tenantId,
        resourceType: 'Message',
        resourceId: id,
        details: { messageId: id }
      });
    }

    return message;
  }

  /**
   * Mark multiple messages as read
   */
  async markManyAsRead(ids: number[], recipientId: number, tenantId: number, userId?: number) {
    if (!ids || ids.length === 0) {
      throw new MessageValidationError('Message IDs array cannot be empty', 'ids');
    }

    const result = await this.repository.markManyAsRead(ids, recipientId, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'MESSAGE_BULK_READ',
        userId,
        tenantId,
        resourceType: 'Message',
        details: {
          count: result.count,
          recipientId
        }
      });
    }

    return result;
  }

  /**
   * Mark all messages as read for a recipient
   */
  async markAllAsRead(recipientId: number, tenantId: number, userId?: number) {
    const result = await this.repository.markAllAsRead(recipientId, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'MESSAGE_READ_ALL',
        userId,
        tenantId,
        resourceType: 'Message',
        details: {
          count: result.count,
          recipientId
        }
      });
    }

    return result;
  }

  /**
   * Delete message
   */
  async delete(id: number, tenantId: number, userId?: number) {
    validateMessageId(id);

    const message = await this.getById(id, tenantId);

    await this.repository.delete(id, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'MESSAGE_DELETE',
        userId,
        tenantId,
        resourceType: 'Message',
        resourceId: id,
        details: { subject: message.subject }
      });
    }

    return { success: true };
  }

  /**
   * Archive message
   */
  async archive(id: number, tenantId: number, userId?: number) {
    validateMessageId(id);

    const message = await this.repository.archive(id, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'MESSAGE_ARCHIVE',
        userId,
        tenantId,
        resourceType: 'Message',
        resourceId: id,
        details: { messageId: id }
      });
    }

    return message;
  }

  /**
   * Get message statistics
   */
  async getStatistics(tenantId?: number, startDate?: Date, endDate?: Date): Promise<MessageStats> {
    return this.repository.getStatistics(tenantId, startDate, endDate);
  }

  /**
   * Get scheduled messages ready to send
   */
  async getScheduledMessages(tenantId?: number) {
    return this.repository.findScheduled(tenantId);
  }

  /**
   * Send scheduled messages
   */
  async sendScheduledMessages(tenantId?: number) {
    const messages = await this.getScheduledMessages(tenantId);

    const results = [];
    for (const message of messages) {
      try {
        await this.sendMessage(message.id, message.tenantId);
        results.push({ messageId: message.id, success: true });
      } catch (error) {
        results.push({
          messageId: message.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      total: messages.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Send a message (email, SMS, etc.)
   */
  private async sendMessage(messageId: number, tenantId: number) {
    const message = await this.repository.findById(messageId, tenantId);
    if (!message) {
      throw new NotFoundError('Message');
    }

    try {
      switch (message.type) {
        case MessageType.EMAIL:
          if (message.recipient?.email) {
            await this.sendEmailMessage(
              message.recipientId,
              message.subject,
              message.body,
              tenantId
            );
          }
          break;

        case MessageType.SMS:
          // TODO: Implement SMS sending
          console.log('SMS sending not implemented yet');
          break;

        case MessageType.PUSH:
          // TODO: Implement push notification
          console.log('Push notification not implemented yet');
          break;

        case MessageType.IN_APP:
          // In-app messages are just stored in database
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }

      // Update status to delivered
      await this.repository.updateStatus(messageId, MessageStatus.DELIVERED, tenantId);
    } catch (error) {
      // Update status to failed
      await this.repository.updateStatus(messageId, MessageStatus.FAILED, tenantId);
      throw error;
    }
  }

  /**
   * Send email message
   */
  private async sendEmailMessage(
    recipientId: number,
    subject: string,
    body: string,
    tenantId: number
  ) {
    // Get recipient email
    const recipient = await this.prisma.user.findFirst({
      where: { id: recipientId, tenantId },
      select: { email: true, firstName: true, lastName: true }
    });

    if (!recipient) {
      throw new NotFoundError('Recipient');
    }

    await emailService.sendEmail({
      to: recipient.email,
      subject,
      html: body
    });
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    user1Id: number,
    user2Id: number,
    tenantId: number,
    page = 1,
    limit = 50
  ) {
    return this.repository.getConversation(user1Id, user2Id, tenantId, page, limit);
  }

  /**
   * Check if message exists
   */
  async exists(id: number, tenantId?: number): Promise<boolean> {
    return this.repository.exists(id, tenantId);
  }
}

// Export singleton instance
export const messageService = new MessageService(
  (await import('./prismaService.js')).prisma
);
