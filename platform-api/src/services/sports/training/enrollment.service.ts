import { prisma } from "../../prisma/prisma.service.js";
import type { Inscription, Prisma } from "@prisma/client";
import { courseService } from "./course.service.js";

/**
 * EnrollmentService - Handle course enrollment operations
 *
 * Features:
 * - User enrollment/unenrollment
 * - Enrollment validation
 * - Get enrollments by course or user
 * - Check enrollment status
 */

// Types
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

class EnrollmentService {
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
      const course = await courseService.getCourseById(data.coursId);

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
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: number): Promise<EnrollmentWithDetails | null> {
    try {
      const enrollment = await prisma.inscription.findUnique({
        where: { id: enrollmentId },
        include: {
          utilisateur: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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
      });

      if (!enrollment) {
        return null;
      }

      return {
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
        course: {
          id: enrollment.cours.id,
          dateCours: enrollment.cours.dateCours,
          typeCours: enrollment.cours.typeCours,
          heureDebut: enrollment.cours.heureDebut,
          heureFin: enrollment.cours.heureFin,
        },
      };
    } catch (error) {
      console.error("❌ Get enrollment by ID error:", error);
      return null;
    }
  }

  /**
   * Update enrollment notes
   */
  async updateEnrollmentNotes(
    utilisateurId: number,
    coursId: number,
    notes: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.inscription.update({
        where: {
          utilisateurId_coursId: {
            utilisateurId,
            coursId,
          },
        },
        data: { notes },
      });

      return {
        success: true,
        message: "Notes mises à jour",
      };
    } catch (error) {
      console.error("❌ Update enrollment notes error:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour des notes",
      };
    }
  }
}

// Export singleton instance
export const enrollmentService = new EnrollmentService();
export default EnrollmentService;
