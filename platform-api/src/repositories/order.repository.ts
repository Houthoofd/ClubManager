/**
 * Order Repository
 * Data access layer for orders and order items
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { OrderFilters, OrderStatus } from '../types/shop.types.js';

export class OrderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find order by ID with items
   */
  async findById(id: number, tenantId?: number) {
    const where: Prisma.OrderWhereInput = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Find all orders with filters
   */
  async findAll(filters: OrderFilters, page = 1, limit = 20) {
    const where: Prisma.OrderWhereInput = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
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

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.totalAmount = {};
      if (filters.minAmount !== undefined) {
        where.totalAmount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.totalAmount.lte = filters.maxAmount;
      }
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find orders by user
   */
  async findByUser(userId: number, tenantId?: number, page = 1, limit = 20) {
    return this.findAll({ userId, tenantId }, page, limit);
  }

  /**
   * Create new order with items
   */
  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  /**
   * Update order
   */
  async update(id: number, data: Prisma.OrderUpdateInput, tenantId?: number) {
    const where: Prisma.OrderWhereUniqueInput = { id };

    // Verify tenant ownership if provided
    if (tenantId) {
      const order = await this.findById(id, tenantId);
      if (!order) {
        throw new Error('Order not found or access denied');
      }
    }

    return this.prisma.order.update({
      where,
      data,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  /**
   * Update order status
   */
  async updateStatus(id: number, status: OrderStatus, tenantId?: number) {
    return this.update(id, { status }, tenantId);
  }

  /**
   * Delete order
   */
  async delete(id: number, tenantId?: number) {
    const where: Prisma.OrderWhereUniqueInput = { id };

    if (tenantId) {
      const order = await this.findById(id, tenantId);
      if (!order) {
        throw new Error('Order not found or access denied');
      }
    }

    // Delete order items first (cascade might handle this)
    await this.prisma.orderItem.deleteMany({
      where: { orderId: id }
    });

    return this.prisma.order.delete({ where });
  }

  /**
   * Count orders by status
   */
  async countByStatus(tenantId?: number) {
    const where: Prisma.OrderWhereInput = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const counts = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    return counts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get total revenue
   */
  async getTotalRevenue(tenantId?: number, startDate?: Date, endDate?: Date) {
    const where: Prisma.OrderWhereInput = {
      status: {
        in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED]
      }
    };

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

    const result = await this.prisma.order.aggregate({
      where,
      _sum: {
        totalAmount: true
      },
      _count: true
    });

    return {
      totalRevenue: result._sum.totalAmount || 0,
      totalOrders: result._count
    };
  }

  /**
   * Get average order value
   */
  async getAverageOrderValue(tenantId?: number, startDate?: Date, endDate?: Date) {
    const where: Prisma.OrderWhereInput = {
      status: {
        in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED]
      }
    };

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

    const result = await this.prisma.order.aggregate({
      where,
      _avg: {
        totalAmount: true
      }
    });

    return result._avg.totalAmount || 0;
  }

  /**
   * Get recent orders
   */
  async getRecent(limit = 10, tenantId?: number) {
    const where: Prisma.OrderWhereInput = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Check if order exists
   */
  async exists(id: number, tenantId?: number): Promise<boolean> {
    const order = await this.findById(id, tenantId);
    return order !== null;
  }

  /**
   * Get order statistics
   */
  async getStatistics(tenantId?: number, startDate?: Date, endDate?: Date) {
    const where: Prisma.OrderWhereInput = {};
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

    const [total, revenue, statusCounts] = await Promise.all([
      this.prisma.order.count({ where }),
      this.getTotalRevenue(tenantId, startDate, endDate),
      this.countByStatus(tenantId)
    ]);

    const avgOrderValue = revenue.totalOrders > 0
      ? revenue.totalRevenue / revenue.totalOrders
      : 0;

    return {
      totalOrders: total,
      totalRevenue: revenue.totalRevenue,
      averageOrderValue: avgOrderValue,
      ordersByStatus: statusCounts
    };
  }

  /**
   * Find orders by product
   */
  async findByProduct(productId: number, tenantId?: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {
      items: {
        some: {
          productId
        }
      }
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
