/**
 * Verification Resolvers
 * Handles GraphQL queries for duplicate checking and validation
 */

import type { PrismaClient } from "@prisma/client";

/**
 * Creates verification resolvers with Prisma client
 */
export const verificationResolvers = (prisma: PrismaClient) => ({
  Query: {
    /**
     * Check if a product exists by name and category
     */
    checkProductByNameAndCategory: async (
      _parent: any,
      args: { name: string; categoryId: number },
      _context: any,
    ) => {
      try {
        const { name, categoryId } = args;

        const product = await prisma.shop_articles.findFirst({
          where: {
            name: name,
            category_id: categoryId,
          },
        });

        return {
          exists: !!product,
          product: product || null,
        };
      } catch (error) {
        console.error("Error checking product by name and category:", error);
        throw new Error("Failed to check product existence");
      }
    },

    /**
     * Check if a product exists by name only
     */
    checkProductByName: async (
      _parent: any,
      args: { name: string },
      _context: any,
    ) => {
      try {
        const { name } = args;

        const product = await prisma.shop_articles.findFirst({
          where: {
            name: name,
          },
        });

        return {
          exists: !!product,
          product: product || null,
        };
      } catch (error) {
        console.error("Error checking product by name:", error);
        throw new Error("Failed to check product existence");
      }
    },

    /**
     * Check if a course schedule conflicts with existing courses
     */
    checkCourseSchedule: async (
      _parent: any,
      args: {
        input: {
          day: string;
          startTime: string;
          endTime: string;
          courseType?: string;
          excludeOriginal?: boolean;
          originalDay?: string;
          originalType?: string;
          originalStartTime?: string;
          originalEndTime?: string;
        };
      },
      _context: any,
    ) => {
      try {
        const { input } = args;
        const {
          day,
          startTime,
          endTime,
          courseType,
          excludeOriginal,
          originalDay,
          originalType,
          originalStartTime,
          originalEndTime,
        } = input;

        // Build where clause for conflict detection
        const whereClause: any = {
          day_of_week: day,
          OR: [
            // Cas 1: Le nouveau cours commence pendant un cours existant
            {
              AND: [
                { start_time: { lte: startTime } },
                { end_time: { gt: startTime } },
              ],
            },
            // Cas 2: Le nouveau cours se termine pendant un cours existant
            {
              AND: [
                { start_time: { lt: endTime } },
                { end_time: { gte: endTime } },
              ],
            },
            // Cas 3: Le nouveau cours englobe complètement un cours existant
            {
              AND: [
                { start_time: { gte: startTime } },
                { end_time: { lte: endTime } },
              ],
            },
          ],
        };

        // Filter by course type if provided and not "ANY"
        if (courseType && courseType !== "ANY") {
          whereClause.course_type = courseType;
        }

        // Exclude original course when editing
        if (
          excludeOriginal &&
          originalDay &&
          originalType &&
          originalStartTime &&
          originalEndTime
        ) {
          whereClause.NOT = {
            AND: [
              { day_of_week: originalDay },
              { course_type: originalType },
              { start_time: originalStartTime },
              { end_time: originalEndTime },
            ],
          };
        }

        const conflictingCourses = await prisma.recurring_courses.findMany({
          where: whereClause,
          include: {
            recurring_course_teachers: true,
          },
        });

        return {
          exists: conflictingCourses.length > 0,
          conflictingCourses: conflictingCourses.map((course: any) => ({
            id: course.id,
            day: course.day_of_week,
            start_time: course.start_time,
            end_time: course.end_time,
            course_type: course.course_type,
            instructor_id:
              course.recurring_course_teachers?.[0]?.teacher_id || null,
          })),
        };
      } catch (error) {
        console.error("Error checking course schedule:", error);
        throw new Error("Failed to check course schedule");
      }
    },
  },

  Mutation: {
    // No mutations needed for verification module currently
  },
});

export default verificationResolvers;
