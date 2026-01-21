import { prisma } from "../prisma/prisma.service.js";
import type { Message } from "@prisma/client";

export interface MessageFilter {
  senderId?: number;
  recipientId?: number;
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class MessageRepository {
  async findById(id: number): Promise<Message | null> {
    return prisma.message.findUnique({
      where: { id }
    });
  }

  async findAll(filter: MessageFilter = {}): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        ...(filter.senderId && { senderId: filter.senderId }),
        ...(filter.recipientId && { recipientId: filter.recipientId }),
        ...(filter.status && { status: filter.status }),
        ...(filter.type && { type: filter.type }),
        ...(filter.dateFrom && { createdAt: { gte: filter.dateFrom } }),
        ...(filter.dateTo && { createdAt: { lte: filter.dateTo } })
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    return prisma.message.create({
      data
    });
  }

  async update(id: number, data: Partial<Message>): Promise<Message> {
    return prisma.message.update({
      where: { id },
      data
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.message.delete({
      where: { id }
    });
  }

  async findByRecipient(recipientId: number, tenantId: string, page: number = 1, limit: number = 20): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        recipientId,
        tenantId
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findBySender(senderId: number, tenantId: string, page: number = 1, limit: number = 20): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        senderId,
        tenantId
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findUnread(recipientId: number, tenantId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        recipientId,
        tenantId,
        read: false
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async countUnread(recipientId: number, tenantId: string): Promise<number> {
    return prisma.message.count({
      where: {
        recipientId,
        tenantId,
        read: false
      }
    });
  }

  async markAsRead(id: number, tenantId: string): Promise<Message> {
    return prisma.message.update({
      where: { id },
      data: { 
        read: true,
        readAt: new Date()
      }
    });
  }

  async markManyAsRead(messageIds: number[], tenantId: string) {
    return prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        tenantId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }

  async markAllAsRead(recipientId: number, tenantId: string) {
    return prisma.message.updateMany({
      where: {
        recipientId,
        tenantId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }

  async updateStatus(id: number, status: string, tenantId: string): Promise<Message> {
    return prisma.message.update({
      where: { id },
      data: { status }
    });
  }

  async bulkCreate(messages: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ count: number }> {
    return prisma.message.createMany({
      data: messages
    });
  }

  async exists(id: number, tenantId: string): Promise<boolean> {
    const count = await prisma.message.count({
      where: { id, tenantId }
    });
    return count > 0;
  }

  async countByStatus(tenantId: string) {
    return prisma.message.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true
    });
  }

  async countByType(tenantId: string) {
    return prisma.message.groupBy({
      by: ['type'],
      where: { tenantId },
      _count: true
    });
  }

  async getStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    return {
      total: await prisma.message.count({ where: { tenantId } }),
      unread: await prisma.message.count({ where: { tenantId, read: false } }),
      sent: await prisma.message.count({ where: { tenantId, status: 'SENT' } })
    };
  }

  async findScheduled(tenantId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        tenantId,
        status: 'SCHEDULED',
        scheduledFor: { lte: new Date() }
      }
    });
  }

  async getConversation(senderId: number, recipientId: number, tenantId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        tenantId,
        OR: [
          { senderId, recipientId },
          { senderId: recipientId, recipientId: senderId }
        ]
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' }
    });
  }
}