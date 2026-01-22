/**
 * Message Service
 * Simplified version without complex repository signatures
 */

import { PrismaClient, Message } from "@prisma/client";
import { MessageRepository } from "../../../repositories/message.repository.js";
import { auditService, AuditAction } from "../../infrastructure/audit/audit.service.js";

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
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.repository = new MessageRepository(this.prisma);
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
  async list(): Promise<any> {
    return this.repository.findAll({});
  }

  /**
   * Get messages by recipient
   */
  async getByRecipient(recipientId: number, tenantId: string = "default"): Promise<{ messages: Message[]; pagination: any }> {
    return this.repository.findByRecipient(recipientId, tenantId);
  }

  /**
   * Get messages by sender
   */
  async getBySender(senderId: number, tenantId: string = "default"): Promise<{ messages: Message[]; pagination: any }> {
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
      tenant: { connect: { id: data.tenantId } },
      sender: { connect: { id: data.senderId } },
      recipient: data.recipientId ? { connect: { id: data.recipientId } } : undefined,
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
        tenantId: data.tenantId,
        action: AuditAction.MESSAGE_CREATE,
        resource: 'messages',
        resourceType: 'message',
        resourceId: message.id.toString(),
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
        tenantId: message.tenantId,
        action: AuditAction.MESSAGE_UPDATE,
        resource: 'messages',
        resourceType: 'message',
        resourceId: id.toString(),
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

    // Get message before deletion for audit
    const messageToDelete = await this.repository.findById(id);

    await this.repository.delete(id);

    // Audit log
    if (userId && messageToDelete) {
      await auditService.log({
        tenantId: messageToDelete.tenantId,
        action: AuditAction.MESSAGE_DELETE,
        resource: 'messages',
        resourceType: 'message',
        resourceId: id.toString(),
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
        tenantId: message.tenantId,
        action: AuditAction.MESSAGE_READ,
        resource: 'messages',
        resourceType: 'message',
        resourceId: id.toString(),
        userId
      });
    }

    return message;
  }
}

// Create singleton instance
export const messageService = new MessageService();
