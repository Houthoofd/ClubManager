/**
 * Order Repository
 * Data access layer for orders (Commandes) and order items
 * Uses French model names from Prisma schema: Commande, CommandeArticle, Article
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { OrderFilters, OrderStatus } from "../types/shop.types.js";

export class OrderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find order by ID with items
   */
  async findById(id: number, tenantId?: string) {
    const where: Prisma.CommandeWhereInput = { id };
    if (tenantId) {
      // Commande model doesn't have tenantId, filtering by user's tenantId instead
      where.utilisateur = {
        tenantId: tenantId,
      };
    }

    return this.prisma.commande.findFirst({
      where,
      include: {
        articles: {
          include: {
            article: true,
          },
        },
        utilisateur: {
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
   * Find all orders with filters
   */
  async findAll(filters: OrderFilters, page = 1, limit = 20) {
    const where: Prisma.CommandeWhereInput = {};

    if (filters.tenantId) {
      where.utilisateur = {
        tenantId: filters.tenantId,
      };
    }

    if (filters.userId) {
      where.utilisateurId = filters.userId;
    }

    if (filters.status) {
      where.statut = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.dateCommande = {};
      if (filters.startDate) {
        where.dateCommande.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.dateCommande.lte = filters.endDate;
      }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.montantTotal = {};
      if (filters.minAmount !== undefined) {
        where.montantTotal.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.montantTotal.lte = filters.maxAmount;
      }
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.commande.findMany({
        where,
        skip,
        take: limit,
        include: {
          articles: {
            include: {
              article: true,
            },
          },
          utilisateur: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { dateCommande: "desc" },
      }),
      this.prisma.commande.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find orders by user
   */
  async findByUser(userId: number, tenantId?: string, page = 1, limit = 20) {
    return this.findAll({ userId, tenantId }, page, limit);
  }

  /**
   * Create new order with items
   */
  async create(data: Prisma.CommandeCreateInput) {
    return this.prisma.commande.create({
      data,
      include: {
        articles: {
          include: {
            article: true,
          },
        },
      },
    });
  }

  /**
   * Update order
   */
  async update(
    id: number,
    data: Prisma.CommandeUpdateInput,
    tenantId?: string,
  ) {
    const where: Prisma.CommandeWhereUniqueInput = { id };

    // Verify tenant ownership if provided
    if (tenantId) {
      const order = await this.findById(id, tenantId);
      if (!order) {
        throw new Error("Order not found or access denied");
      }
    }

    return this.prisma.commande.update({
      where,
      data,
      include: {
        articles: {
          include: {
            article: true,
          },
        },
      },
    });
  }

  /**
   * Update order status
   */
  async updateStatus(id: number, status: OrderStatus, tenantId?: string) {
    return this.update(id, { statut: status }, tenantId);
  }

  /**
   * Delete order
   */
  async delete(id: number, tenantId?: string) {
    const where: Prisma.CommandeWhereUniqueInput = { id };

    if (tenantId) {
      const order = await this.findById(id, tenantId);
      if (!order) {
        throw new Error("Order not found or access denied");
      }
    }

    // Delete order items first (cascade should handle this but being explicit)
    await this.prisma.commandeArticle.deleteMany({
      where: { commandeId: id },
    });

    return this.prisma.commande.delete({ where });
  }

  /**
   * Count orders by status
   */
  async countByStatus(tenantId?: string) {
    const where: Prisma.CommandeWhereInput = {};
    if (tenantId) {
      where.utilisateur = {
        tenantId: tenantId,
      };
    }

    const counts = await this.prisma.commande.groupBy({
      by: ["statut"],
      where,
      _count: true,
    });

    return counts.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.statut] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Get total revenue
   */
  async getTotalRevenue(tenantId?: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.CommandeWhereInput = {
      statut: {
        in: ["confirmée", "en préparation", "prête", "livrée"],
      },
    };

    if (tenantId) {
      where.utilisateur = {
        tenantId: tenantId,
      };
    }

    if (startDate || endDate) {
      where.dateCommande = {};
      if (startDate) {
        where.dateCommande.gte = startDate;
      }
      if (endDate) {
        where.dateCommande.lte = endDate;
      }
    }

    const result = await this.prisma.commande.aggregate({
      where,
      _sum: {
        montantTotal: true,
      },
      _count: true,
    });

    return {
      totalRevenue: result._sum.montantTotal || 0,
      totalOrders: result._count,
    };
  }

  /**
   * Get average order value
   */
  async getAverageOrderValue(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: Prisma.CommandeWhereInput = {
      statut: {
        in: ["confirmée", "en préparation", "prête", "livrée"],
      },
    };

    if (tenantId) {
      where.utilisateur = {
        tenantId: tenantId,
      };
    }

    if (startDate || endDate) {
      where.dateCommande = {};
      if (startDate) {
        where.dateCommande.gte = startDate;
      }
      if (endDate) {
        where.dateCommande.lte = endDate;
      }
    }

    const result = await this.prisma.commande.aggregate({
      where,
      _avg: {
        montantTotal: true,
      },
    });

    return result._avg.montantTotal || 0;
  }

  /**
   * Get recent orders
   */
  async getRecent(limit = 10, tenantId?: string) {
    const where: Prisma.CommandeWhereInput = {};
    if (tenantId) {
      where.utilisateur = {
        tenantId: tenantId,
      };
    }

    return this.prisma.commande.findMany({
      where,
      take: limit,
      orderBy: { dateCommande: "desc" },
      include: {
        articles: {
          include: {
            article: true,
          },
        },
        utilisateur: {
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
   * Check if order exists
   */
  async exists(id: number, tenantId?: string): Promise<boolean> {
    const order = await this.findById(id, tenantId);
    return order !== null;
  }

  /**
   * Get order statistics
   */
  async getStatistics(tenantId?: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.CommandeWhereInput = {};
    if (tenantId) {
      where.utilisateur = {
        tenantId: tenantId,
      };
    }

    if (startDate || endDate) {
      where.dateCommande = {};
      if (startDate) {
        where.dateCommande.gte = startDate;
      }
      if (endDate) {
        where.dateCommande.lte = endDate;
      }
    }

    const [total, revenue, statusCounts] = await Promise.all([
      this.prisma.commande.count({ where }),
      this.getTotalRevenue(tenantId, startDate, endDate),
      this.countByStatus(tenantId),
    ]);

    const avgOrderValue =
      revenue.totalOrders > 0
        ? Number(revenue.totalRevenue) / revenue.totalOrders
        : 0;

    return {
      totalOrders: total,
      totalRevenue: revenue.totalRevenue,
      averageOrderValue: avgOrderValue,
      ordersByStatus: statusCounts,
    };
  }

  /**
   * Find orders by product (article)
   */
  async findByProduct(
    productId: number,
    tenantId?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.CommandeWhereInput = {
      articles: {
        some: {
          articleId: productId,
        },
      },
    };
    if (tenantId) {
      where.utilisateur = {
        tenantId: tenantId,
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.commande.findMany({
        where,
        skip,
        take: limit,
        include: {
          articles: {
            include: {
              article: true,
            },
          },
          utilisateur: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { dateCommande: "desc" },
      }),
      this.prisma.commande.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
