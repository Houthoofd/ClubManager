import { prisma } from "../../prisma/prisma.service.js";
import type { Inscription } from "@prisma/client";

/**
 * AttendanceService - Handle attendance tracking for courses
 *
 * Features:
 * - Mark user attendance
 * - Get attendance records
 * - Calculate attendance statistics
 */

class AttendanceService {
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
   * Get attendance for a course
   */
  async getCourseAttendance(coursId: number): Promise<{
    totalEnrollments: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    attendees: Array<{
      id: number;
      utilisateurId: number;
      present: boolean;
      user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
  } | null> {
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
      });

      if (enrollments.length === 0) {
        return {
          totalEnrollments: 0,
          presentCount: 0,
          absentCount: 0,
          attendanceRate: 0,
          attendees: [],
        };
      }

      const totalEnrollments = enrollments.length;
      const presentCount = enrollments.filter((e) => e.present).length;
      const absentCount = totalEnrollments - presentCount;
      const attendanceRate =
        totalEnrollments > 0 ? (presentCount / totalEnrollments) * 100 : 0;

      const attendees = enrollments.map((enrollment) => ({
        id: enrollment.id,
        utilisateurId: enrollment.utilisateurId,
        present: enrollment.present,
        user: {
          id: enrollment.utilisateur.id,
          firstName: enrollment.utilisateur.firstName,
          lastName: enrollment.utilisateur.lastName,
          email: enrollment.utilisateur.email,
        },
      }));

      return {
        totalEnrollments,
        presentCount,
        absentCount,
        attendanceRate,
        attendees,
      };
    } catch (error) {
      console.error("❌ Get course attendance error:", error);
      return null;
    }
  }

  /**
   * Get user attendance history
   */
  async getUserAttendanceHistory(
    utilisateurId: number,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {},
  ): Promise<Array<{
    id: number;
    coursId: number;
    present: boolean;
    dateInscription: Date;
    course: {
      id: number;
      dateCours: Date;
      typeCours: string;
      heureDebut: Date;
      heureFin: Date;
    };
  }>> {
    try {
      const where: any = {
        utilisateurId,
      };

      if (options.startDate || options.endDate) {
        where.cours = {
          dateCours: {
            ...(options.startDate && { gte: options.startDate }),
            ...(options.endDate && { lte: options.endDate }),
          },
        };
      }

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
        take: options.limit || 50,
      });

      return enrollments.map((enrollment) => ({
        id: enrollment.id,
        coursId: enrollment.coursId,
        present: enrollment.present,
        dateInscription: enrollment.dateInscription,
        course: {
          id: enrollment.cours.id,
          dateCours: enrollment.cours.dateCours,
          typeCours: enrollment.cours.typeCours,
          heureDebut: enrollment.cours.heureDebut,
          heureFin: enrollment.cours.heureFin,
        },
      }));
    } catch (error) {
      console.error("❌ Get user attendance history error:", error);
      return [];
    }
  }

  /**
   * Get user attendance statistics
   */
  async getUserAttendanceStats(
    utilisateurId: number,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{
    totalCourses: number;
    attendedCourses: number;
    missedCourses: number;
    attendanceRate: number;
  }> {
    try {
      const where: any = {
        utilisateurId,
      };

      if (options.startDate || options.endDate) {
        where.cours = {
          dateCours: {
            ...(options.startDate && { gte: options.startDate }),
            ...(options.endDate && { lte: options.endDate }),
          },
        };
      }

      const enrollments = await prisma.inscription.findMany({
        where,
      });

      const totalCourses = enrollments.length;
      const attendedCourses = enrollments.filter((e) => e.present).length;
      const missedCourses = totalCourses - attendedCourses;
      const attendanceRate =
        totalCourses > 0 ? (attendedCourses / totalCourses) * 100 : 0;

      return {
        totalCourses,
        attendedCourses,
        missedCourses,
        attendanceRate,
      };
    } catch (error) {
      console.error("❌ Get user attendance stats error:", error);
      return {
        totalCourses: 0,
        attendedCourses: 0,
        missedCourses: 0,
        attendanceRate: 0,
      };
    }
  }

  /**
   * Bulk mark attendance for multiple users
   */
  async bulkMarkAttendance(
    coursId: number,
    attendanceData: Array<{ utilisateurId: number; present: boolean }>,
  ): Promise<{ success: boolean; message: string; updated: number }> {
    try {
      let updated = 0;

      for (const data of attendanceData) {
        try {
          await prisma.inscription.update({
            where: {
              utilisateurId_coursId: {
                utilisateurId: data.utilisateurId,
                coursId,
              },
            },
            data: { present: data.present },
          });
          updated++;
        } catch (error) {
          console.error(
            `Failed to update attendance for user ${data.utilisateurId}:`,
            error,
          );
        }
      }

      return {
        success: true,
        message: `${updated} présences mises à jour`,
        updated,
      };
    } catch (error) {
      console.error("❌ Bulk mark attendance error:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour des présences",
        updated: 0,
      };
    }
  }

  /**
   * Get attendance summary by course type
   */
  async getAttendanceSummaryByCourseType(
    utilisateurId: number,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<
    Array<{
      typeCours: string;
      totalCourses: number;
      attendedCourses: number;
      attendanceRate: number;
    }>
  > {
    try {
      const where: any = {
        utilisateurId,
      };

      if (options.startDate || options.endDate) {
        where.cours = {
          dateCours: {
            ...(options.startDate && { gte: options.startDate }),
            ...(options.endDate && { lte: options.endDate }),
          },
        };
      }

      const enrollments = await prisma.inscription.findMany({
        where,
        include: {
          cours: {
            select: {
              typeCours: true,
            },
          },
        },
      });

      // Group by course type
      const groupedData: Record<
        string,
        { total: number; attended: number }
      > = {};

      enrollments.forEach((enrollment) => {
        const type = enrollment.cours.typeCours;
        if (!groupedData[type]) {
          groupedData[type] = { total: 0, attended: 0 };
        }
        groupedData[type].total++;
        if (enrollment.present) {
          groupedData[type].attended++;
        }
      });

      // Convert to array
      return Object.entries(groupedData).map(([typeCours, data]) => ({
        typeCours,
        totalCourses: data.total,
        attendedCourses: data.attended,
        attendanceRate:
          data.total > 0 ? (data.attended / data.total) * 100 : 0,
      }));
    } catch (error) {
      console.error("❌ Get attendance summary by course type error:", error);
      return [];
    }
  }
}

// Export singleton instance
export const attendanceService = new AttendanceService();
export default AttendanceService;
