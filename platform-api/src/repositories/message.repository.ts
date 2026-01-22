/**
 * Message Repository
 * Data access layer for messages and notifications
 */

import { PrismaClient, Prisma } from "@prisma/client";
import {
  MessageFilters,
  MessageStatus,
  MessageType,
} from "../shared/types/message.types.js";

export class MessageRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find message by ID
   */
  async findById(id: number, tenantId?: string) {
    const where: Prisma.MessageWhereInput = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.message.findFirst({
      where,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Find all messages with filters
   */
  async findAll(filters: MessageFilters, page = 1, limit = 20) {
    const where: Prisma.MessageWhereInput = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.userId) {
      where.OR = [
        { senderId: filters.userId },
        { recipientId: filters.userId },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search } },
        { body: { contains: filters.search } },
      ];
    }

    if (filters.unreadOnly) {
      where.readAt = null;
      where.status = {
        in: [MessageStatus.SENT, MessageStatus.DELIVERED],
      };
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          recipient: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find messages by recipient
   */
  async findByRecipient(
    recipientId: number,
    tenantId?: string,
    page = 1,
    limit = 20,
  ) {
    const where: Prisma.MessageWhereInput = { recipientId };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find messages by sender
   */
  async findBySender(
    senderId: number,
    tenantId?: string,
    page = 1,
    limit = 20,
  ) {
    const where: Prisma.MessageWhereInput = { senderId };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        include: {
          recipient: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find unread messages
   */
  async findUnread(recipientId: number, tenantId?: string) {
    const where: Prisma.MessageWhereInput = {
      recipientId,
      readAt: null,
      status: {
        in: [MessageStatus.SENT, MessageStatus.DELIVERED],
      },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Count unread messages
   */
  async countUnread(recipientId: number, tenantId?: string): Promise<number> {
    const where: Prisma.MessageWhereInput = {
      recipientId,
      readAt: null,
      status: {
        in: [MessageStatus.SENT, MessageStatus.DELIVERED],
      },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.message.count({ where });
  }

  /**
   * Create new message
   */
  async create(data: Prisma.MessageCreateInput) {
    return this.prisma.message.create({
      data,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Bulk create messages
   */
  async bulkCreate(data: Prisma.MessageCreateManyInput[]) {
    return this.prisma.message.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Update message
   */
  async update(id: number, data: Prisma.MessageUpdateInput, tenantId?: string) {
    const where: Prisma.MessageWhereUniqueInput = { id };

    // Verify tenant ownership if provided
    if (tenantId) {
      const message = await this.findById(id, tenantId);
      if (!message) {
        throw new Error("Message not found or access denied");
      }
    }

    return this.prisma.message.update({
      where,
      data,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: number, tenantId?: string) {
    return this.update(
      id,
      {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
      tenantId,
    );
  }

  /**
   * Mark multiple messages as read
   */
  async markManyAsRead(ids: number[], recipientId: number, tenantId?: string) {
    const where: Prisma.MessageWhereInput = {
      id: { in: ids },
      recipientId,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.message.updateMany({
      where,
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all messages as read for a recipient
   */
  async markAllAsRead(recipientId: number, tenantId?: string) {
    const where: Prisma.MessageWhereInput = {
      recipientId,
      readAt: null,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.message.updateMany({
      where,
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Update message status
   */
  async updateStatus(id: number, status: MessageStatus, tenantId?: string) {
    const updateData: Prisma.MessageUpdateInput = { status };

    if (status === MessageStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === MessageStatus.READ) {
      updateData.readAt = new Date();
    }

    return this.update(id, updateData, tenantId);
  }

  /**
   * Delete message
   */
  async delete(id: number, tenantId?: string) {
    const where: Prisma.MessageWhereUniqueInput = { id };

    if (tenantId) {
      const message = await this.findById(id, tenantId);
      if (!message) {
        throw new Error("Message not found or access denied");
      }
    }

    return this.prisma.message.delete({ where });
  }

  /**
   * Archive message
   */
  async markAsDelivered(id: number, tenantId?: string) {
    return this.update(id, { status: MessageStatus.ARCHIVED }, tenantId);
  }

  /**
   * Count messages by status
   */
  async countByStatus(tenantId?: string) {
    const where: Prisma.MessageWhereInput = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const counts = await this.prisma.message.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    return counts.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Count messages by type
   */
  async countByType(tenantId?: string) {
    const where: Prisma.MessageWhereInput = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const counts = await this.prisma.message.groupBy({
      by: ["type"],
      where,
      _count: true,
    });

    return counts.reduce(
      (acc, item) => {
        acc[item.type] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Get message statistics
   */
  async getStatistics(tenantId?: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.MessageWhereInput = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [total, statusCounts, typeCounts, delivered, read, failed] =
      await Promise.all([
        this.prisma.message.count({ where }),
        this.countByStatus(tenantId),
        this.countByType(tenantId),
        this.prisma.message.count({
          where: {
            ...where,
            status: MessageStatus.DELIVERED,
          },
        }),
        this.prisma.message.count({
          where: {
            ...where,
            status: MessageStatus.READ,
          },
        }),
        this.prisma.message.count({
          where: {
            ...where,
            status: MessageStatus.FAILED,
          },
        }),
      ]);

    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
    const readRate = delivered > 0 ? (read / delivered) * 100 : 0;

    return {
      totalSent: total,
      totalDelivered: delivered,
      totalRead: read,
      totalFailed: failed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      readRate: Math.round(readRate * 100) / 100,
      messagesByType: typeCounts,
      messagesByStatus: statusCounts,
    };
  }

  /**
   * Find scheduled messages
   */
  async findScheduled(tenantId?: string) {
    const where: Prisma.MessageWhereInput = {
      status: MessageStatus.DRAFT,
      scheduledFor: {
        lte: new Date(),
      },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledFor: "asc" },
    });
  }

  /**
   * Check if message exists
   */
  async exists(id: number, tenantId?: string): Promise<boolean> {
    const message = await this.findById(id, tenantId);
    return message !== null;
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    user1Id: number,
    user2Id: number,
    tenantId?: string,
    page = 1,
    limit = 50,
  ) {
    const where: Prisma.MessageWhereInput = {
      OR: [
        { senderId: user1Id, recipientId: user2Id },
        { senderId: user2Id, recipientId: user1Id },
      ],
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
