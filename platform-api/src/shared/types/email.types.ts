/**
 * Email related types
 */

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface CoursInfo {
  id: number;
  nom: string;
  description?: string;
  dateDebut: Date;
  dateFin: Date;
  instructeur?: string;
}

export enum EmailAction {
  COURSE_REMINDER = "course_reminder",
  COURSE_CANCELLATION = "course_cancellation", 
  COURSE_UPDATE = "course_update",
  WELCOME = "welcome",
  PASSWORD_RESET = "password_reset",
  VERIFICATION = "verification"
}