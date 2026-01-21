/**
 * Message Service
 * Simplified version without complex repository signatures
 */

import { PrismaClient, Message } from "@prisma/client";
import { MessageRepository } from "../repositories/message.repository.js";
import { auditService, AuditAction } from "../auditService.js";

export interface MessageCreateInput {
  subject: string;
  body: string;
  type: string;
  priority?: string;
}

export interface MessageCreateData {
  tenantId: string;
  senderId: number;
  recipientId?: number | null;
  type: string;
}

export interface MessageFilter {
  status?: string;
  type?: string;
  senderId?: number;
  recipientId?: number;
}

export class MessageService {
  private repository: MessageRepository;

  constructor() {
    this.repository = new MessageRepository();
  }

  /**
   * Get message by ID
   */
  async getById(id: number): Promise<Message | null> {
    if (!id || id <= 0) {
      throw new Error("Invalid message ID");
    }
    return this.repository.findById(id);
  }

  /**
   * List messages with filters
   */
  async list(): Promise<Message[]> {
    return this.repository.findAll();
  }

  /**
   * Get messages by recipient
   */
  async getByRecipient(recipientId: number, tenantId: string = "default"): Promise<Message[]> {
    return this.repository.findByRecipient(recipientId, tenantId);
  }

  /**
   * Get messages by sender
   */
  async getBySender(senderId: number, tenantId: string = "default"): Promise<Message[]> {
    return this.repository.findBySender(senderId, tenantId);
  }

  /**
   * Create a new message
   */
  async create(
    messageData: MessageCreateInput,
    data: MessageCreateData,
    userId?: number,
  ): Promise<Message> {
    // Create message
    const message = await this.repository.create({
      subject: messageData.subject,
      body: messageData.body,
      type: messageData.type,
      priority: messageData.priority || 'NORMAL',
      tenantId: data.tenantId,
      senderId: data.senderId,
      recipientId: data.recipientId || null,
      status: 'SENT',
      scheduledFor: null,
      sentAt: new Date(),
      deliveredAt: null,
      readAt: null,
      read: false
    });

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_CREATE,
        entityType: 'message',
        entityId: message.id,
        userId,
        details: {
          type: data.type,
          recipientCount: data.recipientId ? 1 : 0,
        },
      });
    }

    return message;
  }

  /**
   * Update message
   */
  async update(
    id: number,
    updateData: Partial<Message>,
    userId?: number,
  ): Promise<Message | null> {
    if (!id || id <= 0) {
      throw new Error("Invalid message ID");
    }

    const message = await this.repository.update(id, updateData);

    // Audit log
    if (userId && message) {
      await auditService.log({
        action: AuditAction.MESSAGE_UPDATE,
        entityType: 'message',
        entityId: id,
        userId,
        details: updateData
      });
    }

    return message;
  }

  /**
   * Delete message
   */
  async delete(id: number, userId?: number): Promise<void> {
    if (!id || id <= 0) {
      throw new Error("Invalid message ID");
    }

    await this.repository.delete(id);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_DELETE,
        entityType: 'message',
        entityId: id,
        userId
      });
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: number, userId?: number): Promise<Message | null> {
    if (!id || id <= 0) {
      throw new Error("Invalid message ID");
    }

    const message = await this.repository.markAsRead(id, "default");

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.MESSAGE_READ,
        entityType: 'message',
        entityId: id,
        userId
      });
    }

    return message;
  }
}

// Create singleton instance
export const messageService = new MessageService();
