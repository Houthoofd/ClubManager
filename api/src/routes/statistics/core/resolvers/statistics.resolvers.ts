/**
 * Statistics Resolvers
 *
 * Implements all statistics queries for the dashboard:
 * - Attendance stats (attendanceStats, topMembers)
 * - Member stats (membersCount, membersByGrade, membersByGender, birthdays, newMembers)
 * - Product stats (topProducts)
 * - Session stats (weeklySessions)
 * - Payment stats (monthlyPayments, recentPayments, pendingPayments, overduePayments, lastPayments, paymentsByMonth)
 * - Plan stats (activePlans, renewalRate, membersByPlan)
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";

/**
 * Type Definitions
 */
interface AttendanceStatsArgs {
  userId: number;
}

interface TopMembersArgs {
  limit?: number;
}

interface NewMembersArgs {
  limit?: number;
}

interface TopProductsArgs {
  limit?: number;
}

interface RecentPaymentsArgs {
  limit?: number;
}

interface LastPaymentsArgs {
  limit?: number;
}

/**
 * Helper Functions
 */

/**
 * Get current month start and end dates
 */
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * Get date range for last N months
 */
function getLastMonthsRange(months: number) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return { start, end };
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Get upcoming birthdays (next 30 days)
 */
function isUpcomingBirthday(birthDate: Date): boolean {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 30);

  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  const nextMonthNum = nextMonth.getMonth();

  // Same month
  if (birthMonth === currentMonth) {
    return birthDay >= currentDay;
  }

  // Next month (within 30 days)
  if (birthMonth === nextMonthNum && currentMonth !== nextMonthNum) {
    return birthDay <= nextMonth.getDate();
  }

  return false;
}

/**
 * Statistics Resolvers
 */
export const statisticsResolvers = {
  Query: {
    // ========================================
    // Attendance Statistics
    // ========================================

    /**
     * Get attendance statistics for a specific user
     */
    attendanceStats: async (_: unknown, args: AttendanceStatsArgs) => {
      const { userId } = args;

      // Count total presences via enrollments
      const totalPresences = await prisma.enrollments.count({
        where: {
          user_id: userId,
          status: "present",
        },
      });

      // Current month presences
      const { start, end } = getCurrentMonthRange();
      const currentMonthPresences = await prisma.enrollments.count({
        where: {
          user_id: userId,
          status: "present",
          enrollment_date: {
            gte: start,
            lte: end,
          },
        },
      });

      // Last 12 months for average
      const lastYear = getLastMonthsRange(12);
      const yearPresences = await prisma.enrollments.count({
        where: {
          user_id: userId,
          status: "present",
          enrollment_date: {
            gte: lastYear.start,
            lte: lastYear.end,
          },
        },
      });

      const monthlyAverage = Math.round(yearPresences / 12);

      // Last session
      const lastEnrollment = await prisma.enrollments.findFirst({
        where: {
          user_id: userId,
          status: "present",
        },
        orderBy: {
          enrollment_date: "desc",
        },
        select: {
          enrollment_date: true,
        },
      });

      return {
        user_id: userId,
        total_presences: totalPresences,
        current_month: currentMonthPresences,
        monthly_average: monthlyAverage,
        last_session: lastEnrollment?.enrollment_date || null,
      };
    },

    /**
     * Get top members by attendance
     */
    topMembers: async (_: unknown, args: TopMembersArgs) => {
      const limit = args.limit || 10;

      // Get enrollments grouped by user with count
      const enrollmentStats = await prisma.enrollments.groupBy({
        by: ["user_id"],
        where: {
          status: "present",
          user_id: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: limit,
      });

      // Get user details for top members
      const topMembers = await Promise.all(
        enrollmentStats.map(async (stat) => {
          const user = await prisma.users.findUnique({
            where: { id: stat.user_id! },
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          });

          // Calculate attendance rate (assuming ~4 sessions per week * 52 weeks per year)
          const totalPossibleSessions = 200; // Approximation
          const attendanceRate = Math.min(
            100,
            Math.round((stat._count.id / totalPossibleSessions) * 100),
          );

          return {
            user_id: user?.id || stat.user_id,
            first_name: user?.first_name || "Unknown",
            last_name: user?.last_name || "User",
            total_presences: stat._count.id,
            attendance_rate: attendanceRate,
          };
        }),
      );

      return topMembers;
    },

    // ========================================
    // Member Statistics
    // ========================================

    /**
     * Get total count of active members
     */
    membersCount: async () => {
      const count = await prisma.users.count({
        where: {
          deleted_at: null,
        },
      });

      return { count };
    },

    /**
     * Get member distribution by grade
     */
    membersByGrade: async () => {
      // Get all user_sports with grades
      const userSports = await prisma.user_sports.findMany({
        where: {
          current_grade_id: { not: null },
          is_active: true,
        },
        include: {
          belt_grades: true,
        },
      });

      // Group by grade
      const gradeMap = new Map<string, number>();

      for (const us of userSports) {
        const gradeName = us.belt_grades?.name || "Sans grade";
        gradeMap.set(gradeName, (gradeMap.get(gradeName) || 0) + 1);
      }

      return Array.from(gradeMap.entries()).map(([grade_name, count]) => ({
        grade_name,
        count,
      }));
    },

    /**
     * Get member distribution by gender
     */
    membersByGender: async () => {
      // Since users table doesn't have gender field directly, use genre_id relation
      const users = await prisma.users.findMany({
        where: {
          deleted_at: null,
          genre_id: { not: null },
        },
        include: {
          genders: true,
        },
      });

      const genderMap = new Map<string, number>();

      for (const user of users) {
        const genderName = user.genders?.genre_name || "Autre";
        genderMap.set(genderName, (genderMap.get(genderName) || 0) + 1);
      }

      return Array.from(genderMap.entries()).map(([gender_name, count]) => ({
        gender_name,
        count,
      }));
    },

    /**
     * Get upcoming birthdays (next 30 days)
     */
    birthdays: async () => {
      const users = await prisma.users.findMany({
        where: {
          deleted_at: null,
          birth_date: { not: null },
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          birth_date: true,
        },
      });

      const upcomingBirthdays = users
        .filter(
          (user) => user.birth_date && isUpcomingBirthday(user.birth_date),
        )
        .map((user) => ({
          user_id: user.id,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          birth_date: user.birth_date!,
          age: calculateAge(user.birth_date!),
        }))
        .sort((a, b) => {
          // Sort by month/day
          const aMonth = a.birth_date.getMonth();
          const aDay = a.birth_date.getDate();
          const bMonth = b.birth_date.getMonth();
          const bDay = b.birth_date.getDate();
          return aMonth === bMonth ? aDay - bDay : aMonth - bMonth;
        });

      return upcomingBirthdays;
    },

    /**
     * Get recently registered members
     */
    newMembers: async (_: unknown, args: NewMembersArgs) => {
      const limit = args.limit || 10;

      const users = await prisma.users.findMany({
        where: {
          deleted_at: null,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          birth_date: true,
          registration_date: true,
        },
        orderBy: {
          registration_date: "desc",
        },
        take: limit,
      });

      return users.map((user) => ({
        ...user,
        created_at: user.registration_date,
      }));
    },

    // ========================================
    // Product Statistics
    // ========================================

    /**
     * Get top selling products
     */
    topProducts: async (_: unknown, args: TopProductsArgs) => {
      const limit = args.limit || 10;

      // Group order items by article_id
      const productStats = await prisma.order_items.groupBy({
        by: ["article_id"],
        _sum: {
          quantity: true,
          unit_price: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: limit,
      });

      // Get article details
      const topProducts = await Promise.all(
        productStats.map(async (stat) => {
          const article = await prisma.shop_articles.findUnique({
            where: { id: stat.article_id! },
            select: {
              id: true,
              name: true,
            },
          });

          return {
            product_id: stat.article_id!,
            name: article?.name || "Produit inconnu",
            quantity_sold: stat._sum?.quantity || 0,
            total_revenue:
              Number(stat._sum?.unit_price || 0) * (stat._sum?.quantity || 0),
          };
        }),
      );

      return topProducts;
    },

    // ========================================
    // Session Statistics
    // ========================================

    /**
     * Get weekly sessions count and breakdown by day
     */
    weeklySessions: async () => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      // Get course instances this week
      const sessions = await prisma.course_instances.findMany({
        where: {
          course_date: {
            gte: weekStart,
            lt: weekEnd,
          },
          deleted_at: null,
        },
        select: {
          course_date: true,
        },
      });

      // Count by day
      const byDay = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
      sessions.forEach((session) => {
        const dayIndex = session.course_date.getDay();
        byDay[dayIndex]++;
      });

      return {
        total: sessions.length,
        by_day: byDay,
      };
    },

    // ========================================
    // Payment Statistics
    // ========================================

    /**
     * Get monthly payment totals
     */
    monthlyPayments: async () => {
      const { start, end } = getCurrentMonthRange();

      const payments = await prisma.payments.findMany({
        where: {
          payment_date: {
            gte: start,
            lte: end,
          },
          status: "completed",
        },
        select: {
          amount: true,
        },
      });

      const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        total,
        count: payments.length,
      };
    },

    /**
     * Get recent payments
     */
    recentPayments: async (_: unknown, args: RecentPaymentsArgs) => {
      const limit = args.limit || 10;

      const payments = await prisma.payments.findMany({
        where: {
          status: "completed",
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          payment_date: "desc",
        },
        take: limit,
      });

      return payments.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        amount: Number(p.amount),
        payment_date: p.payment_date,
        status: p.status,
        user_first_name: p.users?.first_name || "",
        user_last_name: p.users?.last_name || "",
      }));
    },

    /**
     * Get pending payments
     */
    pendingPayments: async () => {
      const payments = await prisma.payments.findMany({
        where: {
          status: "pending",
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          payment_date: "desc",
        },
      });

      return payments.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        amount: Number(p.amount),
        payment_date: p.payment_date,
        status: p.status,
        user_first_name: p.users?.first_name || "",
        user_last_name: p.users?.last_name || "",
      }));
    },

    /**
     * Get overdue payments
     */
    overduePayments: async () => {
      const today = new Date();

      const payments = await prisma.payments.findMany({
        where: {
          status: "pending",
          payment_date: {
            lt: today,
          },
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          payment_date: "asc",
        },
      });

      return payments.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        amount: Number(p.amount),
        payment_date: p.payment_date,
        status: p.status,
        user_first_name: p.users?.first_name || "",
        user_last_name: p.users?.last_name || "",
      }));
    },

    /**
     * Get last N payments (alias for recentPayments)
     */
    lastPayments: async (_: unknown, args: LastPaymentsArgs) => {
      const limit = args.limit || 10;

      const payments = await prisma.payments.findMany({
        where: {
          status: "completed",
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          payment_date: "desc",
        },
        take: limit,
      });

      return payments.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        amount: Number(p.amount),
        payment_date: p.payment_date,
        status: p.status,
        user_first_name: p.users?.first_name || "",
        user_last_name: p.users?.last_name || "",
      }));
    },

    /**
     * Get payment totals by month (last 12 months)
     */
    paymentsByMonth: async () => {
      const { start } = getLastMonthsRange(12);

      const payments = await prisma.payments.findMany({
        where: {
          payment_date: {
            gte: start,
          },
          status: "completed",
        },
        select: {
          payment_date: true,
          amount: true,
        },
      });

      // Group by month
      const monthMap = new Map<string, { total: number; count: number }>();

      payments.forEach((p) => {
        if (p.payment_date) {
          const monthKey = `${p.payment_date.getFullYear()}-${String(
            p.payment_date.getMonth() + 1,
          ).padStart(2, "0")}`;

          const existing = monthMap.get(monthKey) || { total: 0, count: 0 };
          monthMap.set(monthKey, {
            total: existing.total + Number(p.amount),
            count: existing.count + 1,
          });
        }
      });

      // Convert to array and sort
      return Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },

    // ========================================
    // Plan Statistics
    // ========================================

    /**
     * Get active membership plans count
     */
    activePlans: async () => {
      // Get active subscriptions grouped by subscription_id
      const subscriptions = await prisma.user_subscriptions.groupBy({
        by: ["subscription_id"],
        where: {
          status_id: { not: null }, // Active status
          subscription_id: { not: null },
        },
        _count: {
          id: true,
        },
      });

      // Get plan details
      const activePlans = await Promise.all(
        subscriptions.map(async (sub) => {
          const plan = await prisma.pricing_plans.findUnique({
            where: { id: sub.subscription_id! },
            select: {
              name: true,
            },
          });

          return {
            plan_name: plan?.name || "Plan inconnu",
            count: sub._count?.id || 0,
          };
        }),
      );

      return activePlans;
    },

    /**
     * Get subscription renewal rate
     */
    renewalRate: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Subscriptions that ended in last 3 months
      const endedSubscriptions = await prisma.user_subscriptions.count({
        where: {
          subscription_end_at: {
            gte: threeMonthsAgo,
            lt: new Date(),
          },
        },
      });

      // Of those, how many were renewed (have a newer subscription for same user)
      const renewedCount = await prisma.user_subscriptions.findMany({
        where: {
          subscription_end_at: {
            gte: threeMonthsAgo,
            lt: new Date(),
          },
        },
        select: {
          user_id: true,
        },
      });

      let renewed = 0;
      for (const sub of renewedCount) {
        const hasNewSub = await prisma.user_subscriptions.findFirst({
          where: {
            user_id: sub.user_id,
            subscription_start_at: {
              gte: threeMonthsAgo,
            },
            status_id: { not: null }, // Has active status
          },
        });
        if (hasNewSub) renewed++;
      }

      const rate =
        endedSubscriptions > 0 ? (renewed / endedSubscriptions) * 100 : 0;

      return {
        rate: Math.round(rate),
      };
    },

    /**
     * Get member distribution by plan
     */
    membersByPlan: async () => {
      const subscriptions = await prisma.user_subscriptions.groupBy({
        by: ["subscription_id"],
        where: {
          status_id: { not: null }, // Active status
          subscription_id: { not: null },
        },
        _count: {
          id: true,
        },
      });

      const membersByPlan = await Promise.all(
        subscriptions.map(async (sub) => {
          const plan = await prisma.pricing_plans.findUnique({
            where: { id: sub.subscription_id! },
            select: {
              name: true,
            },
          });

          return {
            plan_name: plan?.name || "Plan inconnu",
            count: sub._count?.id || 0,
          };
        }),
      );

      return membersByPlan;
    },
  },

  Mutation: {
    // No mutations for statistics - read-only queries
  },
};

export default statisticsResolvers;
