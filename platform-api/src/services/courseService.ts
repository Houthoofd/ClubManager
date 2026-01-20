import { prisma } from "./prismaService.js";
import type { Cours, Inscription, Prisma } from "@prisma/client";

/**
 * CourseService - Handle all course-related operations
 *
 * Features:
 * - CRUD operations for courses
 * - User enrollment/unenrollment
 * - Capacity management
 * - Attendance tracking
 * - Course scheduling
 * - Filtering and pagination
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

export interface EnrollmentData {
  utilisateurId: number;
  coursId: number;
  statusId?: number;
  notes?: string;
}

export interface EnrollmentWithDetails {
  id: number;
  utilisateurId: number;
  coursId: number;
  statusId: number;
  dateInscription: Date;
  present: boolean;
  notes: string | null;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: number;
    dateCours: Date;
    typeCours: string;
    heureDebut: Date;
    heureFin: Date;
  };
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
   * Enroll user in course
   */
  async enrollUser(data: EnrollmentData): Promise<{
    success: boolean;
    message: string;
    enrollment?: Inscription;
  }> {
    try {
      // Check if course exists and has capacity
      const course = await this.getCourseById(data.coursId);

      if (!course) {
        return {
          success: false,
          message: "Cours non trouvé",
        };
      }

      if (!course.actif) {
        return {
          success: false,
          message: "Ce cours n'est plus actif",
        };
      }

      if (course.isFull) {
        return {
          success: false,
          message: "Le cours est complet",
        };
      }

      // Check if user is already enrolled
      const existingEnrollment = await prisma.inscription.findUnique({
        where: {
          utilisateurId_coursId: {
            utilisateurId: data.utilisateurId,
            coursId: data.coursId,
          },
        },
      });

      if (existingEnrollment) {
        return {
          success: false,
          message: "Utilisateur déjà inscrit à ce cours",
        };
      }

      // Enroll user
      const enrollment = await prisma.inscription.create({
        data: {
          utilisateurId: data.utilisateurId,
          coursId: data.coursId,
          statusId: data.statusId || 1,
          notes: data.notes,
          present: false,
        },
      });

      return {
        success: true,
        message: "Inscription réussie",
        enrollment,
      };
    } catch (error) {
      console.error("❌ Enroll user error:", error);
      return {
        success: false,
        message: "Erreur lors de l'inscription",
      };
    }
  }

  /**
   * Unenroll user from course
   */
  async unenrollUser(
    utilisateurId: number,
    coursId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.inscription.delete({
        where: {
          utilisateurId_coursId: {
            utilisateurId,
            coursId,
          },
        },
      });

      return {
        success: true,
        message: "Désinscription réussie",
      };
    } catch (error) {
      console.error("❌ Unenroll user error:", error);
      return {
        success: false,
        message: "Erreur lors de la désinscription",
      };
    }
  }

  /**
   * Get enrollments for a course
   */
  async getCourseEnrollments(
    coursId: number,
  ): Promise<EnrollmentWithDetails[]> {
    try {
      const enrollments = await prisma.inscription.findMany({
        where: { coursId },
        include: {
          utilisateur: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { dateInscription: "desc" },
      });

      return enrollments.map((enrollment) => ({
        id: enrollment.id,
        utilisateurId: enrollment.utilisateurId,
        coursId: enrollment.coursId,
        statusId: enrollment.statusId,
        dateInscription: enrollment.dateInscription,
        present: enrollment.present,
        notes: enrollment.notes,
        user: {
          id: enrollment.utilisateur.id,
          firstName: enrollment.utilisateur.firstName,
          lastName: enrollment.utilisateur.lastName,
          email: enrollment.utilisateur.email,
        },
      }));
    } catch (error) {
      console.error("❌ Get course enrollments error:", error);
      return [];
    }
  }

  /**
   * Get user enrollments
   */
  async getUserEnrollments(
    utilisateurId: number,
    options: {
      upcoming?: boolean;
      past?: boolean;
    } = {},
  ): Promise<EnrollmentWithDetails[]> {
    try {
      const now = new Date();

      const where: Prisma.InscriptionWhereInput = {
        utilisateurId,
        ...(options.upcoming && {
          cours: {
            dateCours: { gte: now },
          },
        }),
        ...(options.past && {
          cours: {
            dateCours: { lt: now },
          },
        }),
      };

      const enrollments = await prisma.inscription.findMany({
        where,
        include: {
          cours: {
            select: {
              id: true,
              dateCours: true,
              typeCours: true,
              heureDebut: true,
              heureFin: true,
            },
          },
        },
        orderBy: {
          cours: {
            dateCours: "desc",
          },
        },
      });

      return enrollments.map((enrollment) => ({
        id: enrollment.id,
        utilisateurId: enrollment.utilisateurId,
        coursId: enrollment.coursId,
        statusId: enrollment.statusId,
        dateInscription: enrollment.dateInscription,
        present: enrollment.present,
        notes: enrollment.notes,
        course: {
          id: enrollment.cours.id,
          dateCours: enrollment.cours.dateCours,
          typeCours: enrollment.cours.typeCours,
          heureDebut: enrollment.cours.heureDebut,
          heureFin: enrollment.cours.heureFin,
        },
      }));
    } catch (error) {
      console.error("❌ Get user enrollments error:", error);
      return [];
    }
  }

  /**
   * Mark user attendance
   */
  async markAttendance(
    utilisateurId: number,
    coursId: number,
    present: boolean,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.inscription.update({
        where: {
          utilisateurId_coursId: {
            utilisateurId,
            coursId,
          },
        },
        data: { present },
      });

      return {
        success: true,
        message: "Présence mise à jour",
      };
    } catch (error) {
      console.error("❌ Mark attendance error:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour de la présence",
      };
    }
  }

  /**
   * Check if user is enrolled in course
   */
  async isUserEnrolled(
    utilisateurId: number,
    coursId: number,
  ): Promise<boolean> {
    try {
      const enrollment = await prisma.inscription.findUnique({
        where: {
          utilisateurId_coursId: {
            utilisateurId,
            coursId,
          },
        },
      });

      return enrollment !== null;
    } catch (error) {
      console.error("❌ Check enrollment error:", error);
      return false;
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
