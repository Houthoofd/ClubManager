import { z } from 'zod';

/**
 * attendance_stats
 */
export const attendanceStatsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  total_sessions: z.number().nullable().optional(), // Nombre total de sessions prévues
  attended_sessions: z.number().nullable().optional(), // Nombre de sessions assistées
  absent_sessions: z.number().nullable().optional(), // Nombre d'absences
  cancelled_sessions: z.number().nullable().optional(), // Sessions annulées
  attendance_rate: z.number().nullable().optional(), // Taux de présence en %
  last_attendance: z.string().nullable().optional(), // Date de dernière présence
  calculated_at: z.string().nullable().optional(),
});

export const attendanceStatsCreateSchema = attendanceStatsSchema.omit({ id: true });

export const attendanceStatsUpdateSchema = attendanceStatsSchema.partial().omit({ id: true });


/**
 * financial_stats
 */
export const financialStatsSchema = z.object({
  id: z.number(),
  period_type: z.enum(["daily", "weekly", "monthly", "yearly"]),
  period_start: z.string(),
  period_end: z.string(),
  total_revenue: z.number().nullable().optional(), // Revenu total
  membership_revenue: z.number().nullable().optional(), // Revenus adhésions
  session_revenue: z.number().nullable().optional(), // Revenus sessions/cours
  product_revenue: z.number().nullable().optional(), // Revenus boutique
  event_revenue: z.number().nullable().optional(), // Revenus événements
  other_revenue: z.number().nullable().optional(), // Autres revenus
  total_payments: z.number().nullable().optional(), // Nombre de paiements
  pending_payments: z.number().nullable().optional(), // Paiements en attente
  refunded_amount: z.number().nullable().optional(), // Montants remboursés
  calculated_at: z.string().nullable().optional(),
});

export const financialStatsCreateSchema = financialStatsSchema.omit({ id: true });

export const financialStatsUpdateSchema = financialStatsSchema.partial().omit({ id: true });


/**
 * activity_stats
 */
export const activityStatsSchema = z.object({
  id: z.number(),
  activity_id: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  total_members: z.number().nullable().optional(), // Nombre total de membres
  active_members: z.number().nullable().optional(), // Membres actifs
  new_members: z.number().nullable().optional(), // Nouveaux inscrits
  churned_members: z.number().nullable().optional(), // Membres partis
  total_sessions: z.number().nullable().optional(), // Sessions organisées
  total_enrollments: z.number().nullable().optional(), // Total inscriptions
  average_attendance: z.number().nullable().optional(), // Taux de présence moyen %
  revenue_generated: z.number().nullable().optional(), // Revenu généré
  calculated_at: z.string().nullable().optional(),
});

export const activityStatsCreateSchema = activityStatsSchema.omit({ id: true });

export const activityStatsUpdateSchema = activityStatsSchema.partial().omit({ id: true });


/**
 * club_stats
 */
export const clubStatsSchema = z.object({
  id: z.number(),
  stat_date: z.string(),
  total_members: z.number().nullable().optional(),
  active_members: z.number().nullable().optional(),
  new_members_today: z.number().nullable().optional(),
  new_members_week: z.number().nullable().optional(),
  new_members_month: z.number().nullable().optional(),
  total_activities: z.number().nullable().optional(),
  active_activities: z.number().nullable().optional(),
  total_sessions_today: z.number().nullable().optional(),
  total_sessions_week: z.number().nullable().optional(),
  total_enrollments: z.number().nullable().optional(),
  revenue_today: z.number().nullable().optional(),
  revenue_week: z.number().nullable().optional(),
  revenue_month: z.number().nullable().optional(),
  revenue_year: z.number().nullable().optional(),
  pending_payments_count: z.number().nullable().optional(),
  pending_payments_amount: z.number().nullable().optional(),
  upcoming_events_week: z.number().nullable().optional(),
  active_instructors: z.number().nullable().optional(),
  calculated_at: z.string().nullable().optional(),
});

export const clubStatsCreateSchema = clubStatsSchema.omit({ id: true });

export const clubStatsUpdateSchema = clubStatsSchema.partial().omit({ id: true });


