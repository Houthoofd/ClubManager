/**
 * Statistics Service
 * Service for generating and retrieving various statistics
 * Replaces the old Statistiques client
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface StatisticsFilters {
  tenantId?: string;
  userId?: number;
  dateRange?: DateRange;
}

export class StatisticsService {
  
  /**
   * Get user statistics
   */
  async getUserStats(filters: StatisticsFilters = {}) {
    const where: Prisma.UserWhereInput = {};
    
    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.startDate,
        lte: filters.dateRange.endDate,
      };
    }

    const [totalUsers, activeUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, actif: true } }),
      prisma.user.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Get users by status
    const usersByStatus = await prisma.user.groupBy({
      by: ['statusId'],
      where,
      _count: true,
    });

    // Get users by gender
    const usersByGender = await prisma.user.groupBy({
      by: ['genderId'],
      where,
      _count: true,
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      newUsersThisMonth,
      usersByStatus: usersByStatus.map(item => ({
        statusId: item.statusId,
        count: item._count,
      })),
      usersByGender: usersByGender.map(item => ({
        genderId: item.genderId,
        count: item._count,
      })),
    };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(filters: StatisticsFilters = {}) {
    const where: Prisma.PaiementWhereInput = {};
    
    if (filters.tenantId) {
      where.utilisateur = {
        tenantId: filters.tenantId,
      };
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.startDate,
        lte: filters.dateRange.endDate,
      };
    }

    const [totalPayments, totalRevenue, averagePayment] = await Promise.all([
      prisma.paiement.count({ where }),
      prisma.paiement.aggregate({
        where,
        _sum: { montant: true },
      }),
      prisma.paiement.aggregate({
        where,
        _avg: { montant: true },
      }),
    ]);

    // Get payments by status
    const paymentsByStatus = await prisma.paiement.groupBy({
      by: ['statut'],
      where,
      _count: true,
      _sum: { montant: true },
    });

    // Get payments by method
    const paymentsByMethod = await prisma.paiement.groupBy({
      by: ['methode'],
      where,
      _count: true,
      _sum: { montant: true },
    });

    return {
      totalPayments,
      totalRevenue: Number(totalRevenue._sum.montant || 0),
      averagePayment: Number(averagePayment._avg.montant || 0),
      paymentsByStatus: paymentsByStatus.map(item => ({
        status: item.statut,
        count: item._count,
        total: Number(item._sum.montant || 0),
      })),
      paymentsByMethod: paymentsByMethod.map(item => ({
        method: item.methode,
        count: item._count,
        total: Number(item._sum.montant || 0),
      })),
    };
  }

  /**
   * Get order statistics
   */
  async getOrderStats(filters: StatisticsFilters = {}) {
    const where: Prisma.CommandeWhereInput = {};
    
    if (filters.tenantId) {
      where.utilisateur = {
        tenantId: filters.tenantId,
      };
    }

    if (filters.dateRange) {
      where.dateCommande = {
        gte: filters.dateRange.startDate,
        lte: filters.dateRange.endDate,
      };
    }

    const [totalOrders, totalOrderValue, averageOrderValue] = await Promise.all([
      prisma.commande.count({ where }),
      prisma.commande.aggregate({
        where,
        _sum: { montantTotal: true },
      }),
      prisma.commande.aggregate({
        where,
        _avg: { montantTotal: true },
      }),
    ]);

    // Get orders by status
    const ordersByStatus = await prisma.commande.groupBy({
      by: ['statut'],
      where,
      _count: true,
      _sum: { montantTotal: true },
    });

    return {
      totalOrders,
      totalOrderValue: Number(totalOrderValue._sum.montantTotal || 0),
      averageOrderValue: Number(averageOrderValue._avg.montantTotal || 0),
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.statut,
        count: item._count,
        total: Number(item._sum.montantTotal || 0),
      })),
    };
  }

  /**
   * Get message statistics
   */
  async getMessageStats(filters: StatisticsFilters = {}) {
    const where: Prisma.MessageWhereInput = {};
    
    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.startDate,
        lte: filters.dateRange.endDate,
      };
    }

    const [totalMessages, readMessages, unreadMessages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.count({ where: { ...where, read: true } }),
      prisma.message.count({ where: { ...where, read: false } }),
    ]);

    // Get messages by status
    const messagesByStatus = await prisma.message.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Get messages by type
    const messagesByType = await prisma.message.groupBy({
      by: ['type'],
      where,
      _count: true,
    });

    return {
      totalMessages,
      readMessages,
      unreadMessages,
      readPercentage: totalMessages > 0 ? (readMessages / totalMessages) * 100 : 0,
      messagesByStatus: messagesByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      messagesByType: messagesByType.map(item => ({
        type: item.type,
        count: item._count,
      })),
    };
  }

  /**
   * Get article/inventory statistics
   */
  async getInventoryStats(filters: StatisticsFilters = {}) {
    const where: Prisma.ArticleWhereInput = {};
    
    // Articles don't have direct tenant relationship, but we can filter by active status
    const [totalArticles, activeArticles, lowStockArticles] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.count({ where: { ...where, actif: true } }),
      prisma.article.count({
        where: {
          ...where,
          actif: true,
          stock: {
            some: {
              quantite: {
                lte: 10, // Seuil minimal pour articles en rupture
              },
            },
          },
        },
      }),
    ]);

    // Get total stock value (approximation)
    const stockValue = await prisma.article.aggregate({
      where: { ...where, actif: true },
      _sum: { prix: true },
    });

    return {
      totalArticles,
      activeArticles,
      inactiveArticles: totalArticles - activeArticles,
      lowStockArticles,
      totalStockValue: Number(stockValue._sum.prix || 0),
    };
  }

  /**
   * Get course/inscription statistics
   */
  async getCourseStats(filters: StatisticsFilters = {}) {
    const where: Prisma.CoursWhereInput = {};
    
    if (filters.dateRange) {
      where.dateCours = {
        gte: filters.dateRange.startDate,
        lte: filters.dateRange.endDate,
      };
    }

    const [totalCourses, activeCourses, totalInscriptions, completedInscriptions] = await Promise.all([
      prisma.cours.count({ where }),
      prisma.cours.count({ where: { ...where, actif: true } }),
      prisma.inscription.count(),
      prisma.inscription.count({ where: { present: true } }),
    ]);

    // Get inscriptions by course type
    const inscriptionsByCourseType = await prisma.inscription.groupBy({
      by: ['coursId'],
      _count: true,
    });

    return {
      totalCourses,
      activeCourses,
      totalInscriptions,
      completedInscriptions,
      attendanceRate: totalInscriptions > 0 ? (completedInscriptions / totalInscriptions) * 100 : 0,
      avgInscriptionsPerCourse: totalCourses > 0 ? totalInscriptions / totalCourses : 0,
    };
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(filters: StatisticsFilters = {}) {
    const [
      userStats,
      paymentStats,
      orderStats,
      messageStats,
      inventoryStats,
      courseStats,
    ] = await Promise.all([
      this.getUserStats(filters),
      this.getPaymentStats(filters),
      this.getOrderStats(filters),
      this.getMessageStats(filters),
      this.getInventoryStats(filters),
      this.getCourseStats(filters),
    ]);

    return {
      users: userStats,
      payments: paymentStats,
      orders: orderStats,
      messages: messageStats,
      inventory: inventoryStats,
      courses: courseStats,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get statistics for a specific time period
   */
  async getTimeBasedStats(period: 'day' | 'week' | 'month' | 'year', tenantId?: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return this.getDashboardStats({
      tenantId,
      dateRange: {
        startDate,
        endDate: now,
      },
    });
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();