import { prisma } from "../prisma/prisma.service.js";
import type { Cours, Prisma } from "@prisma/client";

/**
 * CourseService - Handle course CRUD operations
 *
 * Features:
 * - Create, read, update, delete courses
 * - List courses with filters and pagination
 * - Course capacity management
 * - Course scheduling
 */

// Types
export interface CreateCourseData {
  dateCours: Date;
  typeCours: string;
  heureDebut: Date;
  heureFin: Date;
  capaciteMax?: number;
  description?: string;
}

export interface UpdateCourseData {
  dateCours?: Date;
  typeCours?: string;
  heureDebut?: Date;
  heureFin?: Date;
  capaciteMax?: number;
  description?: string;
  actif?: boolean;
}

export interface CourseWithStats {
  id: number;
  dateCours: Date;
  typeCours: string;
  heureDebut: Date;
  heureFin: Date;
  capaciteMax: number | null;
  description: string | null;
  actif: boolean;
  createdAt: Date;
  enrollmentCount: number;
  availableSlots: number | null;
  isFull: boolean;
}

class CourseService {
  /**
   * Create a new course
   */
  async createCourse(data: CreateCourseData): Promise<{
    success: boolean;
    message: string;
    course?: Cours;
  }> {
    try {
      // Validate dates
      if (data.heureDebut >= data.heureFin) {
        return {
          success: false,
          message: "L'heure de début doit être avant l'heure de fin",
        };
      }

      // Create course
      const course = await prisma.cours.create({
        data: {
          dateCours: data.dateCours,
          typeCours: data.typeCours,
          heureDebut: data.heureDebut,
          heureFin: data.heureFin,
          capaciteMax: data.capaciteMax,
          description: data.description,
          actif: true,
        },
      });

      return {
        success: true,
        message: "Cours créé avec succès",
        course,
      };
    } catch (error) {
      console.error("❌ Create course error:", error);
      return {
        success: false,
        message: "Erreur lors de la création du cours",
      };
    }
  }

  /**
   * Get course by ID with enrollment stats
   */
  async getCourseById(courseId: number): Promise<CourseWithStats | null> {
    try {
      const course = await prisma.cours.findUnique({
        where: { id: courseId },
        include: {
          inscriptions: {
            select: { id: true },
          },
        },
      });

      if (!course) {
        return null;
      }

      const enrollmentCount = course.inscriptions.length;
      const availableSlots =
        course.capaciteMax !== null
          ? course.capaciteMax - enrollmentCount
          : null;
      const isFull =
        course.capaciteMax !== null && enrollmentCount >= course.capaciteMax;

      return {
        id: course.id,
        dateCours: course.dateCours,
        typeCours: course.typeCours,
        heureDebut: course.heureDebut,
        heureFin: course.heureFin,
        capaciteMax: course.capaciteMax,
        description: course.description,
        actif: course.actif,
        createdAt: course.createdAt,
        enrollmentCount,
        availableSlots,
        isFull,
      };
    } catch (error) {
      console.error("❌ Get course by ID error:", error);
      return null;
    }
  }

  /**
   * List courses with pagination and filters
   */
  async listCourses(options: {
    page?: number;
    limit?: number;
    typeCours?: string;
    startDate?: Date;
    endDate?: Date;
    actif?: boolean;
  } = {}): Promise<{
    courses: CourseWithStats[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.CoursWhereInput = {
        ...(options.actif !== undefined && { actif: options.actif }),
        ...(options.typeCours && { typeCours: options.typeCours }),
        ...(options.startDate &&
          options.endDate && {
            dateCours: {
              gte: options.startDate,
              lte: options.endDate,
            },
          }),
      };

      // Get courses and total count
      const [courses, total] = await Promise.all([
        prisma.cours.findMany({
          where,
          skip,
          take: limit,
          include: {
            inscriptions: {
              select: { id: true },
            },
          },
          orderBy: [{ dateCours: "asc" }, { heureDebut: "asc" }],
        }),
        prisma.cours.count({ where }),
      ]);

      // Map to courses with stats
      const coursesWithStats: CourseWithStats[] = courses.map((course) => {
        const enrollmentCount = course.inscriptions.length;
        const availableSlots =
          course.capaciteMax !== null
            ? course.capaciteMax - enrollmentCount
            : null;
        const isFull =
          course.capaciteMax !== null &&
          enrollmentCount >= course.capaciteMax;

        return {
          id: course.id,
          dateCours: course.dateCours,
          typeCours: course.typeCours,
          heureDebut: course.heureDebut,
          heureFin: course.heureFin,
          capaciteMax: course.capaciteMax,
          description: course.description,
          actif: course.actif,
          createdAt: course.createdAt,
          enrollmentCount,
          availableSlots,
          isFull,
        };
      });

      return {
        courses: coursesWithStats,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("❌ List courses error:", error);
      return {
        courses: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Update course
   */
  async updateCourse(
    courseId: number,
    data: UpdateCourseData,
  ): Promise<{ success: boolean; message: string; course?: Cours }> {
    try {
      // Validate dates if both are provided
      if (data.heureDebut && data.heureFin && data.heureDebut >= data.heureFin) {
        return {
          success: false,
          message: "L'heure de début doit être avant l'heure de fin",
        };
      }

      const course = await prisma.cours.update({
        where: { id: courseId },
        data: {
          ...(data.dateCours && { dateCours: data.dateCours }),
          ...(data.typeCours && { typeCours: data.typeCours }),
          ...(data.heureDebut && { heureDebut: data.heureDebut }),
          ...(data.heureFin && { heureFin: data.heureFin }),
          ...(data.capaciteMax !== undefined && {
            capaciteMax: data.capaciteMax,
          }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.actif !== undefined && { actif: data.actif }),
        },
      });

      return {
        success: true,
        message: "Cours mis à jour avec succès",
        course,
      };
    } catch (error) {
      console.error("❌ Update course error:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour du cours",
      };
    }
  }

  /**
   * Delete course (soft delete by setting actif to false)
   */
  async deleteCourse(
    courseId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.cours.update({
        where: { id: courseId },
        data: { actif: false },
      });

      return {
        success: true,
        message: "Cours désactivé avec succès",
      };
    } catch (error) {
      console.error("❌ Delete course error:", error);
      return {
        success: false,
        message: "Erreur lors de la désactivation du cours",
      };
    }
  }

  /**
   * Get course types (distinct)
   */
  async getCourseTypes(): Promise<string[]> {
    try {
      const types = await prisma.cours.findMany({
        where: { actif: true },
        select: { typeCours: true },
        distinct: ["typeCours"],
        orderBy: { typeCours: "asc" },
      });

      return types.map((t) => t.typeCours);
    } catch (error) {
      console.error("❌ Get course types error:", error);
      return [];
    }
  }

  /**
   * Get course statistics
   */
  async getCourseStats(coursId: number): Promise<{
    totalEnrollments: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  } | null> {
    try {
      const enrollments = await prisma.inscription.findMany({
        where: { coursId },
      });

      if (enrollments.length === 0) {
        return {
          totalEnrollments: 0,
          presentCount: 0,
          absentCount: 0,
          attendanceRate: 0,
        };
      }

      const totalEnrollments = enrollments.length;
      const presentCount = enrollments.filter((e) => e.present).length;
      const absentCount = totalEnrollments - presentCount;
      const attendanceRate =
        totalEnrollments > 0 ? (presentCount / totalEnrollments) * 100 : 0;

      return {
        totalEnrollments,
        presentCount,
        absentCount,
        attendanceRate,
      };
    } catch (error) {
      console.error("❌ Get course stats error:", error);
      return null;
    }
  }
}

// Export singleton instance
export const courseService = new CourseService();
export default CourseService;
