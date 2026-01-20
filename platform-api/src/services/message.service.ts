/**
 * Message Service
 * Business logic for messaging
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { MessageRepository } from "../repositories/message.repository.js";
import {
  MessageFilters,
  MessageStatus,
  MessageType,
} from "../types/message.types.js";
import { NotFoundError } from "../utils/shopHelpers.js";
import { auditService, AuditAction } from "./auditService.js";

export interface CreateMessageDTO {
  tenantId: string;
  senderId: number;
  recipientId?: number;
  subject: string;
  body: string;
  type?: string;
  priority?: string;
  status?: MessageStatus;
  scheduledFor?: Date;
}

export interface UpdateMessageDTO {
  subject?: string;
  body?: string;
  status?: MessageStatus;
  priority?: string;
  scheduledFor?: Date;
}

export class MessageService {
  private repository: MessageRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new MessageRepository(prisma);
  }

  /**
   * Get message by ID
   */
  async getById(id: number, tenantId: string) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid message ID");
    }

    const message = await this.repository.findById(id, tenantId);
    if (!message) {
      throw new NotFoundError("Message");
    }

    return message;
  }

  /**
   * List messages with filters
   */
  async list(filters: MessageFilters, page = 1, limit = 20) {
    return this.repository.findAll(filters, page, limit);
  }

  /**
   * Get messages by recipient
   */
  async getByRecipient(
    recipientId: number,
    tenantId: string,
    page = 1,
    limit = 20,
  ) {
    return this.repository.findByRecipient(recipientId, tenantId, page, limit);
  }

  /**
   * Get messages by sender
   */
  async getBySender(senderId: number, tenantId: string, page = 1, limit = 20) {
    return this.repository.findBySender(senderId, tenantId, page, limit);
  }

  /**
   * Get unread messages for a user
   */
  async getUnread(recipientId: number, tenantId: string) {
    return this.repository.findUnread(recipientId, tenantId);
  }

  /**
   * Count unread messages
   */
  async countUnread(recipientId: number, tenantId: string): Promise<number> {
    return this.repository.countUnread(recipientId, tenantId);
  }

  /**
   * Create new message
   */
  async create(data: CreateMessageDTO, userId?: number) {
    // Validate input
    if (!data.subject || data.subject.trim().length === 0) {
      throw new Error("Subject is required");
    }
    if (!data.body || data.body.trim().length === 0) {
      throw new Error("Body is required");
    }

    // Create message
    const messageData: Prisma.MessageCreateInput = {
      sender: { connect: { id: data.senderId } },
      tenant: { connect: { id: data.tenantId } },
      subject: data.subject,
      body: data.body,
      type: data.type || "prive",
      priority: data.priority || "NORMAL",
      status: data.scheduledFor ? MessageStatus.DRAFT : MessageStatus.SENT,
      scheduledFor: data.scheduledFor,
    };

    if (data.recipientId) {
      messageData.recipient = { connect: { id: data.recipientId } };
    }

    const message = await this.repository.create(messageData);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_CREATE,
        userId,
        tenantId: data.tenantId,
        resource: "Message",
        resourceType: "Message",
        resourceId: message.id.toString(),
        details: {
          type: data.type,
          recipientCount: data.recipientId ? 1 : 0,
        },
      });
    }

    return message;
  }

  /**
   * Send bulk messages to multiple recipients
   */
  async sendBulk(
    data: {
      tenantId: string;
      senderId: number;
      recipientIds: number[];
      subject: string;
      body: string;
      type?: string;
      priority?: string;
    },
    userId?: number,
  ) {
    const {
      tenantId,
      senderId,
      recipientIds,
      subject,
      body,
      type = "prive",
      priority = "NORMAL",
    } = data;

    if (!recipientIds || recipientIds.length === 0) {
      throw new Error("Recipient IDs array cannot be empty");
    }

    // Create messages for each recipient
    const messages: Prisma.MessageCreateManyInput[] = recipientIds.map(
      (recipientId) => ({
        tenantId,
        senderId,
        recipientId,
        subject,
        body,
        type,
        priority,
        status: MessageStatus.SENT,
        read: false,
      }),
    );

    // Bulk create
    const result = await this.repository.bulkCreate(messages);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_BULK_SEND,
        userId,
        tenantId,
        resource: "Message",
        resourceType: "Message",
        details: {
          recipientCount: recipientIds.length,
          subject,
          type,
        },
      });
    }

    return {
      ...result,
      recipients: recipientIds.length,
    };
  }

  /**
   * Update message
   */
  async update(
    id: number,
    data: UpdateMessageDTO,
    tenantId: string,
    userId?: number,
  ) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid message ID");
    }

    const existing = await this.getById(id, tenantId);

    // Don't allow updating sent messages
    if (
      existing.status === MessageStatus.SENT ||
      existing.status === MessageStatus.DELIVERED
    ) {
      if (data.subject || data.body) {
        throw new Error("Cannot update content of sent messages");
      }
    }

    const updateData: Prisma.MessageUpdateInput = {};
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.scheduledFor !== undefined)
      updateData.scheduledFor = data.scheduledFor;

    const message = await this.repository.update(id, updateData, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_UPDATE,
        userId,
        tenantId,
        resource: "Message",
        resourceType: "Message",
        resourceId: id.toString(),
        details: data,
      });
    }

    return message;
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: number, tenantId: string, userId?: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid message ID");
    }

    const message = await this.repository.markAsRead(id, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_READ,
        userId,
        tenantId,
        resource: "Message",
        resourceType: "Message",
        resourceId: id.toString(),
        details: { messageId: id },
      });
    }

    return message;
  }

  /**
   * Mark multiple messages as read
   */
  async markManyAsRead(
    ids: number[],
    recipientId: number,
    tenantId: string,
    userId?: number,
  ) {
    if (!ids || ids.length === 0) {
      throw new Error("Message IDs array cannot be empty");
    }

    const result = await this.repository.markManyAsRead(
      ids,
      recipientId,
      tenantId,
    );

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_BULK_READ,
        userId,
        tenantId,
        resource: "Message",
        resourceType: "Message",
        details: {
          count: ids.length,
        },
      });
    }

    return result;
  }

  /**
   * Mark all messages as read for recipient
   */
  async markAllAsRead(recipientId: number, tenantId: string, userId?: number) {
    const result = await this.repository.markAllAsRead(recipientId, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_ALL_READ,
        userId,
        tenantId,
        resource: "Message",
        resourceType: "Message",
        resourceId: "bulk",
        details: {
          count: updated.count,
          recipientId,
        },
      });
    }

    return result;
  }

  /**
   * Delete message
   */
  async delete(id: number, tenantId: string, userId?: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid message ID");
    }

    const message = await this.getById(id, tenantId);

    await this.repository.delete(id, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_DELETE,
        userId,
        tenantId,
        resource: "Message",
        resourceType: "Message",
        resourceId: id.toString(),
      });
    }

    return { success: true };
  }

  /**
   * Update message status
   */
  async updateStatus(
    id: number,
    status: MessageStatus,
    tenantId: string,
    userId?: number,
  ) {
    const message = await this.repository.updateStatus(id, status, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_STATUS_UPDATE,
        userId,
        tenantId,
        resource: "Message",
        resourceType: "Message",
        resourceId: id.toString(),
        details: { newStatus: status },
      });
    }

    return message;
  }

  /**
   * Archive message
   */
  async archive(id: number, tenantId: string, userId?: number) {
    const message = await this.getById(id, tenantId);

    const updated = await this.repository.update(
      id,
      { status: MessageStatus.ARCHIVED },
      tenantId,
    );

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_UPDATE,
        userId,
        tenantId,
        resource: "Message",
        resourceType: "Message",
        resourceId: id.toString(),
        details: { action: "archived" },
      });
    }

    return updated;
  }

  /**
   * Get message statistics
   */
  async getStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    return this.repository.getStatistics(tenantId, startDate, endDate);
  }

  /**
   * Get scheduled messages ready to send
   */
  async getScheduled(tenantId: string) {
    return this.repository.findScheduled(tenantId);
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    user1Id: number,
    user2Id: number,
    tenantId: string,
    page = 1,
    limit = 50,
  ) {
    return this.repository.getConversation(
      user1Id,
      user2Id,
      tenantId,
      page,
      limit,
    );
  }

  /**
   * Check if message exists
   */
  async exists(id: number, tenantId: string): Promise<boolean> {
    return this.repository.exists(id, tenantId);
  }

  /**
   * Count messages by status
   */
  async countByStatus(tenantId: string) {
    return this.repository.countByStatus(tenantId);
  }

  /**
   * Count messages by type
   */
  async countByType(tenantId: string) {
    return this.repository.countByType(tenantId);
  }
}

// Create singleton instance
const prisma = new PrismaClient();
export const messageService = new MessageService(prisma);
