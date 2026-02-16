/**
 * ============================================================================
 * STORED PROCEDURES HELPERS
 * ============================================================================
 *
 * Ce fichier contient des helpers TypeScript pour appeler les procédures
 * stockées MySQL installées dans la base de données ClubManager.
 *
 * Usage:
 *   import { StoredProcedures } from '@/shared/stored-procedures';
 *   const result = await StoredProcedures.addUserSport(prisma, { ... });
 *
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ProcedureResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Auth Types
export interface EmailValidationToken {
  token: string;
  expires_at: Date;
}

// Sports Types
export interface AddUserSportParams {
  userId: number;
  sportId: number;
  initialGradeId?: number;
  startDate?: Date;
  isPrimary?: boolean;
  subscriptionTypeId?: number;
}

export interface AddUserSportResult {
  success: boolean;
  message: string;
  userSportId?: number;
}

// Grades Types
export interface PromoteUserGradeParams {
  userId: number;
  sportId: number;
  newGradeId: number;
  examinedBy?: number;
  obtainedAt?: Date;
  examScore?: number;
  notes?: string;
}

export interface PromoteUserGradeResult {
  success: boolean;
  message: string;
  historyId?: number;
}

// Courses Types
export interface CreateRecurringCourseParams {
  sportId: number;
  courseTypeId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
  location?: string;
  teacherIds?: number[];
}

export interface EnrollUserInCourseParams {
  userId: number;
  courseId?: number;
  coursRecurrentId?: number;
  status?: string;
}

// Attendance Types
export interface MarkAttendanceParams {
  userId: number;
  courseId: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

// Events Types
export interface RegisterEventParticipantParams {
  userId: number;
  eventId: number;
  registrationType?: string;
  notes?: string;
}

// Analytics Types
export interface UserAttendanceStats {
  overview: any[];
  byMonth: any[];
  bySport: any[];
  trend: any[];
  recurringCourses: any[];
}

export interface UserSportStats {
  userId: number;
  sportId: number;
  totalSessions: number;
  totalHours: number;
  averageAttendance: number;
  // ... autres stats
}

// ============================================================================
// STORED PROCEDURES CLASS
// ============================================================================

export class StoredProcedures {

  // ==========================================================================
  // AUTH PROCEDURES
  // ==========================================================================

  /**
   * Générer un token aléatoire
   */
  static async generateToken(prisma: PrismaClient): Promise<string> {
    const result = await prisma.$queryRaw<[{ token: string }]>`
      SELECT generate_token() as token
    `;
    return result[0].token;
  }

  /**
   * Créer un token de validation d'email
   */
  static async createEmailValidationToken(
    prisma: PrismaClient,
    userId: number
  ): Promise<EmailValidationToken> {
    await prisma.$executeRaw`
      CALL create_email_validation_token(${userId})
    `;

    // Récupérer le token créé
    const result = await prisma.$queryRaw<EmailValidationToken[]>`
      SELECT token, expires_at
      FROM email_validation_tokens
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return result[0];
  }

  /**
   * Valider un token d'email
   */
  static async validateEmailToken(
    prisma: PrismaClient,
    token: string
  ): Promise<{ valid: boolean; userId?: number }> {
    const result = await prisma.$queryRaw<any[]>`
      CALL validate_email_token(${token})
    `;

    return {
      valid: result.length > 0,
      userId: result[0]?.user_id
    };
  }

  // ==========================================================================
  // SPORTS PROCEDURES
  // ==========================================================================

  /**
   * Ajouter un utilisateur à un sport
   */
  static async addUserSport(
    prisma: PrismaClient,
    params: AddUserSportParams
  ): Promise<AddUserSportResult> {
    const result = await prisma.$queryRaw<any[]>`
      CALL add_user_sport(
        ${params.userId},
        ${params.sportId},
        ${params.initialGradeId || null},
        ${params.startDate || null},
        ${params.isPrimary || false},
        ${params.subscriptionTypeId || null},
        @success,
        @message,
        @user_sport_id
      )
    `;

    // Récupérer les variables OUT
    const output = await prisma.$queryRaw<any[]>`
      SELECT @success as success, @message as message, @user_sport_id as userSportId
    `;

    return {
      success: Boolean(output[0].success),
      message: output[0].message,
      userSportId: output[0].userSportId
    };
  }

  // ==========================================================================
  // GRADES PROCEDURES
  // ==========================================================================

  /**
   * Promouvoir un utilisateur à un nouveau grade
   */
  static async promoteUserGrade(
    prisma: PrismaClient,
    params: PromoteUserGradeParams
  ): Promise<PromoteUserGradeResult> {
    await prisma.$executeRaw`
      CALL promote_user_grade(
        ${params.userId},
        ${params.sportId},
        ${params.newGradeId},
        ${params.examinedBy || null},
        ${params.obtainedAt || null},
        ${params.examScore || null},
        ${params.notes || null},
        @success,
        @message,
        @history_id
      )
    `;

    const output = await prisma.$queryRaw<any[]>`
      SELECT @success as success, @message as message, @history_id as historyId
    `;

    return {
      success: Boolean(output[0].success),
      message: output[0].message,
      historyId: output[0].historyId
    };
  }

  // ==========================================================================
  // COURSES PROCEDURES
  // ==========================================================================

  /**
   * Créer un cours récurrent avec professeurs
   */
  static async createRecurringCourseWithTeachers(
    prisma: PrismaClient,
    params: CreateRecurringCourseParams
  ): Promise<ProcedureResult<{ courseId: number }>> {
    await prisma.$executeRaw`
      CALL create_recurring_course_with_teachers(
        ${params.sportId},
        ${params.courseTypeId},
        ${params.dayOfWeek},
        ${params.startTime},
        ${params.endTime},
        ${params.maxCapacity || null},
        ${params.location || null},
        ${JSON.stringify(params.teacherIds || [])},
        @success,
        @message,
        @course_id
      )
    `;

    const output = await prisma.$queryRaw<any[]>`
      SELECT @success as success, @message as message, @course_id as courseId
    `;

    return {
      success: Boolean(output[0].success),
      message: output[0].message,
      data: { courseId: output[0].courseId }
    };
  }

  /**
   * Inscrire un utilisateur à un cours
   */
  static async enrollUserInCourse(
    prisma: PrismaClient,
    params: EnrollUserInCourseParams
  ): Promise<ProcedureResult<{ inscriptionId: number }>> {
    await prisma.$executeRaw`
      CALL enroll_user_in_course(
        ${params.userId},
        ${params.courseId || null},
        ${params.coursRecurrentId || null},
        ${params.status || 'active'},
        @success,
        @message,
        @inscription_id
      )
    `;

    const output = await prisma.$queryRaw<any[]>`
      SELECT @success as success, @message as message, @inscription_id as inscriptionId
    `;

    return {
      success: Boolean(output[0].success),
      message: output[0].message,
      data: { inscriptionId: output[0].inscriptionId }
    };
  }

  // ==========================================================================
  // ATTENDANCE PROCEDURES
  // ==========================================================================

  /**
   * Marquer la présence d'un utilisateur
   */
  static async markAttendance(
    prisma: PrismaClient,
    params: MarkAttendanceParams
  ): Promise<ProcedureResult<{ attendanceId: number }>> {
    await prisma.$executeRaw`
      CALL mark_attendance(
        ${params.userId},
        ${params.courseId},
        ${params.status},
        ${params.notes || null},
        @success,
        @message,
        @attendance_id
      )
    `;

    const output = await prisma.$queryRaw<any[]>`
      SELECT @success as success, @message as message, @attendance_id as attendanceId
    `;

    return {
      success: Boolean(output[0].success),
      message: output[0].message,
      data: { attendanceId: output[0].attendanceId }
    };
  }

  // ==========================================================================
  // PAYMENTS PROCEDURES
  // ==========================================================================

  /**
   * Vérifier les paiements en retard
   */
  static async checkOverduePayments(
    prisma: PrismaClient,
    daysOverdue: number = 7,
    sportId?: number
  ): Promise<any[]> {
    const result = await prisma.$queryRaw<any[]>`
      CALL check_overdue_payments(${daysOverdue}, ${sportId || null})
    `;

    return result;
  }

  // ==========================================================================
  // EVENTS PROCEDURES
  // ==========================================================================

  /**
   * Inscrire un participant à un événement
   */
  static async registerEventParticipant(
    prisma: PrismaClient,
    params: RegisterEventParticipantParams
  ): Promise<ProcedureResult<{ registrationId: number }>> {
    await prisma.$executeRaw`
      CALL register_event_participant(
        ${params.userId},
        ${params.eventId},
        ${params.registrationType || 'participant'},
        ${params.notes || null},
        @success,
        @message,
        @registration_id
      )
    `;

    const output = await prisma.$queryRaw<any[]>`
      SELECT @success as success, @message as message, @registration_id as registrationId
    `;

    return {
      success: Boolean(output[0].success),
      message: output[0].message,
      data: { registrationId: output[0].registrationId }
    };
  }

  // ==========================================================================
  // ANALYTICS PROCEDURES
  // ==========================================================================

  /**
   * Obtenir les statistiques de fréquentation d'un utilisateur
   */
  static async getUserAttendanceStatistics(
    prisma: PrismaClient,
    userId: number,
    sportId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<UserAttendanceStats> {
    // Note: Cette procédure retourne plusieurs resultsets
    // Prisma ne les gère pas bien, il faudra peut-être utiliser une connexion MySQL native
    const result = await prisma.$queryRawUnsafe(`
      CALL get_user_attendance_statistics(
        ${userId},
        ${sportId || 'NULL'},
        ${startDate ? `'${startDate.toISOString().split('T')[0]}'` : 'NULL'},
        ${endDate ? `'${endDate.toISOString().split('T')[0]}'` : 'NULL'}
      )
    `);

    return result as any;
  }

  /**
   * Obtenir les statistiques sportives d'un utilisateur
   */
  static async getUserSportStats(
    prisma: PrismaClient,
    userId: number,
    sportId?: number
  ): Promise<UserSportStats[]> {
    const result = await prisma.$queryRaw<UserSportStats[]>`
      CALL get_user_sport_stats(${userId}, ${sportId || null})
    `;

    return result;
  }

  /**
   * Obtenir les statistiques du dashboard d'un sport
   */
  static async getSportDashboardStats(
    prisma: PrismaClient,
    sportId?: number
  ): Promise<any> {
    const result = await prisma.$queryRawUnsafe(`
      CALL get_sport_dashboard_stats(${sportId || 'NULL'})
    `);

    return result;
  }

  // ==========================================================================
  // REPORTING PROCEDURES
  // ==========================================================================

  /**
   * Obtenir un rapport financier
   */
  static async getFinancialReport(
    prisma: PrismaClient,
    startDate: Date,
    endDate: Date,
    sportId?: number
  ): Promise<any> {
    const result = await prisma.$queryRawUnsafe(`
      CALL get_financial_report(
        '${startDate.toISOString().split('T')[0]}',
        '${endDate.toISOString().split('T')[0]}',
        ${sportId || 'NULL'}
      )
    `);

    return result;
  }

  // ==========================================================================
  // TEACHERS PROCEDURES
  // ==========================================================================

  /**
   * Retirer un professeur d'un cours
   */
  static async removeTeacherFromCourse(
    prisma: PrismaClient,
    teacherId: number,
    courseId: number
  ): Promise<ProcedureResult> {
    await prisma.$executeRaw`
      CALL remove_teacher_from_course(
        ${teacherId},
        ${courseId},
        @success,
        @message
      )
    `;

    const output = await prisma.$queryRaw<any[]>`
      SELECT @success as success, @message as message
    `;

    return {
      success: Boolean(output[0].success),
      message: output[0].message
    };
  }

  // ==========================================================================
  // ADMIN PROCEDURES
  // ==========================================================================

  /**
   * Exporter les données utilisateur (RGPD)
   */
  static async exportUserDataGdpr(
    prisma: PrismaClient,
    userId: number
  ): Promise<any> {
    // Cette procédure retourne plusieurs resultsets avec toutes les données utilisateur
    const result = await prisma.$queryRawUnsafe(`
      CALL export_user_data_gdpr(${userId})
    `);

    return result;
  }
}

// ============================================================================
// LEGACY ALIASES (RÉTROCOMPATIBILITÉ)
// ============================================================================

export class LegacyProcedures {
  /**
   * Alias pour create_recurring_course_with_teachers
   * @deprecated Utiliser StoredProcedures.createRecurringCourseWithTeachers
   */
  static async ajouterCoursRecurrentAvecProfesseurs(
    prisma: PrismaClient,
    params: CreateRecurringCourseParams
  ) {
    return StoredProcedures.createRecurringCourseWithTeachers(prisma, params);
  }

  /**
   * Alias pour get_user_attendance_statistics
   * @deprecated Utiliser StoredProcedures.getUserAttendanceStatistics
   */
  static async obtenirStatistiquesFrequentation(
    prisma: PrismaClient,
    utilisateurId: number
  ) {
    return StoredProcedures.getUserAttendanceStatistics(prisma, utilisateurId);
  }

  /**
   * Alias pour remove_teacher_from_course
   * @deprecated Utiliser StoredProcedures.removeTeacherFromCourse
   */
  static async supprimerAssociationProfesseurCours(
    prisma: PrismaClient,
    professeurId: number,
    coursId: number
  ) {
    return StoredProcedures.removeTeacherFromCourse(prisma, professeurId, coursId);
  }
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default StoredProcedures;
