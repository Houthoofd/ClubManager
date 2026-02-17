/**
 * Generated TypeScript types for statistics domain
 * @generated - Do not edit manually
 */

export interface AttendanceStats {
  id: number;
  user_id: number;
  period_start: string;
  period_end: string;
  /** Nombre total de sessions prévues */
  total_sessions?: number;
  /** Nombre de sessions assistées */
  attended_sessions?: number;
  /** Nombre d'absences */
  absent_sessions?: number;
  /** Sessions annulées */
  cancelled_sessions?: number;
  /** Taux de présence en % */
  attendance_rate?: number;
  /** Date de dernière présence */
  last_attendance?: string;
  calculated_at?: string;
}

export interface AttendanceStatsInsert {
  user_id: number;
  period_start: string;
  period_end: string;
  /** Nombre total de sessions prévues */
  total_sessions?: number;
  /** Nombre de sessions assistées */
  attended_sessions?: number;
  /** Nombre d'absences */
  absent_sessions?: number;
  /** Sessions annulées */
  cancelled_sessions?: number;
  /** Taux de présence en % */
  attendance_rate?: number;
  /** Date de dernière présence */
  last_attendance?: string;
  calculated_at?: string;
}

export interface AttendanceStatsUpdate {
  user_id?: number;
  period_start?: string;
  period_end?: string;
  /** Nombre total de sessions prévues */
  total_sessions?: number;
  /** Nombre de sessions assistées */
  attended_sessions?: number;
  /** Nombre d'absences */
  absent_sessions?: number;
  /** Sessions annulées */
  cancelled_sessions?: number;
  /** Taux de présence en % */
  attendance_rate?: number;
  /** Date de dernière présence */
  last_attendance?: string;
  calculated_at?: string;
}

export interface FinancialStats {
  id: number;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  /** Revenu total */
  total_revenue?: number;
  /** Revenus adhésions */
  membership_revenue?: number;
  /** Revenus sessions/cours */
  session_revenue?: number;
  /** Revenus boutique */
  product_revenue?: number;
  /** Revenus événements */
  event_revenue?: number;
  /** Autres revenus */
  other_revenue?: number;
  /** Nombre de paiements */
  total_payments?: number;
  /** Paiements en attente */
  pending_payments?: number;
  /** Montants remboursés */
  refunded_amount?: number;
  calculated_at?: string;
}

export interface FinancialStatsInsert {
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  /** Revenu total */
  total_revenue?: number;
  /** Revenus adhésions */
  membership_revenue?: number;
  /** Revenus sessions/cours */
  session_revenue?: number;
  /** Revenus boutique */
  product_revenue?: number;
  /** Revenus événements */
  event_revenue?: number;
  /** Autres revenus */
  other_revenue?: number;
  /** Nombre de paiements */
  total_payments?: number;
  /** Paiements en attente */
  pending_payments?: number;
  /** Montants remboursés */
  refunded_amount?: number;
  calculated_at?: string;
}

export interface FinancialStatsUpdate {
  period_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start?: string;
  period_end?: string;
  /** Revenu total */
  total_revenue?: number;
  /** Revenus adhésions */
  membership_revenue?: number;
  /** Revenus sessions/cours */
  session_revenue?: number;
  /** Revenus boutique */
  product_revenue?: number;
  /** Revenus événements */
  event_revenue?: number;
  /** Autres revenus */
  other_revenue?: number;
  /** Nombre de paiements */
  total_payments?: number;
  /** Paiements en attente */
  pending_payments?: number;
  /** Montants remboursés */
  refunded_amount?: number;
  calculated_at?: string;
}

export interface ActivityStats {
  id: number;
  activity_id: number;
  period_start: string;
  period_end: string;
  /** Nombre total de membres */
  total_members?: number;
  /** Membres actifs */
  active_members?: number;
  /** Nouveaux inscrits */
  new_members?: number;
  /** Membres partis */
  churned_members?: number;
  /** Sessions organisées */
  total_sessions?: number;
  /** Total inscriptions */
  total_enrollments?: number;
  /** Taux de présence moyen % */
  average_attendance?: number;
  /** Revenu généré */
  revenue_generated?: number;
  calculated_at?: string;
}

export interface ActivityStatsInsert {
  activity_id: number;
  period_start: string;
  period_end: string;
  /** Nombre total de membres */
  total_members?: number;
  /** Membres actifs */
  active_members?: number;
  /** Nouveaux inscrits */
  new_members?: number;
  /** Membres partis */
  churned_members?: number;
  /** Sessions organisées */
  total_sessions?: number;
  /** Total inscriptions */
  total_enrollments?: number;
  /** Taux de présence moyen % */
  average_attendance?: number;
  /** Revenu généré */
  revenue_generated?: number;
  calculated_at?: string;
}

export interface ActivityStatsUpdate {
  activity_id?: number;
  period_start?: string;
  period_end?: string;
  /** Nombre total de membres */
  total_members?: number;
  /** Membres actifs */
  active_members?: number;
  /** Nouveaux inscrits */
  new_members?: number;
  /** Membres partis */
  churned_members?: number;
  /** Sessions organisées */
  total_sessions?: number;
  /** Total inscriptions */
  total_enrollments?: number;
  /** Taux de présence moyen % */
  average_attendance?: number;
  /** Revenu généré */
  revenue_generated?: number;
  calculated_at?: string;
}

export interface ClubStats {
  id: number;
  stat_date: string;
  total_members?: number;
  active_members?: number;
  new_members_today?: number;
  new_members_week?: number;
  new_members_month?: number;
  total_activities?: number;
  active_activities?: number;
  total_sessions_today?: number;
  total_sessions_week?: number;
  total_enrollments?: number;
  revenue_today?: number;
  revenue_week?: number;
  revenue_month?: number;
  revenue_year?: number;
  pending_payments_count?: number;
  pending_payments_amount?: number;
  upcoming_events_week?: number;
  active_instructors?: number;
  calculated_at?: string;
}

export interface ClubStatsInsert {
  stat_date: string;
  total_members?: number;
  active_members?: number;
  new_members_today?: number;
  new_members_week?: number;
  new_members_month?: number;
  total_activities?: number;
  active_activities?: number;
  total_sessions_today?: number;
  total_sessions_week?: number;
  total_enrollments?: number;
  revenue_today?: number;
  revenue_week?: number;
  revenue_month?: number;
  revenue_year?: number;
  pending_payments_count?: number;
  pending_payments_amount?: number;
  upcoming_events_week?: number;
  active_instructors?: number;
  calculated_at?: string;
}

export interface ClubStatsUpdate {
  stat_date?: string;
  total_members?: number;
  active_members?: number;
  new_members_today?: number;
  new_members_week?: number;
  new_members_month?: number;
  total_activities?: number;
  active_activities?: number;
  total_sessions_today?: number;
  total_sessions_week?: number;
  total_enrollments?: number;
  revenue_today?: number;
  revenue_week?: number;
  revenue_month?: number;
  revenue_year?: number;
  pending_payments_count?: number;
  pending_payments_amount?: number;
  upcoming_events_week?: number;
  active_instructors?: number;
  calculated_at?: string;
}

