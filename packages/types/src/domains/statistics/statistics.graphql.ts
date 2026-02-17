import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # attendance_stats
  type AttendanceStats {
    id: Int!
    user_id: Int!
    period_start: String!
    period_end: String!
    total_sessions: Int # Nombre total de sessions prévues
    attended_sessions: Int # Nombre de sessions assistées
    absent_sessions: Int # Nombre d'absences
    cancelled_sessions: Int # Sessions annulées
    attendance_rate: Float # Taux de présence en %
    last_attendance: String # Date de dernière présence
    calculated_at: String
  }

  # financial_stats
  type FinancialStats {
    id: Int!
    period_type: String!
    period_start: String!
    period_end: String!
    total_revenue: Float # Revenu total
    membership_revenue: Float # Revenus adhésions
    session_revenue: Float # Revenus sessions/cours
    product_revenue: Float # Revenus boutique
    event_revenue: Float # Revenus événements
    other_revenue: Float # Autres revenus
    total_payments: Int # Nombre de paiements
    pending_payments: Float # Paiements en attente
    refunded_amount: Float # Montants remboursés
    calculated_at: String
  }

  # activity_stats
  type ActivityStats {
    id: Int!
    activity_id: Int!
    period_start: String!
    period_end: String!
    total_members: Int # Nombre total de membres
    active_members: Int # Membres actifs
    new_members: Int # Nouveaux inscrits
    churned_members: Int # Membres partis
    total_sessions: Int # Sessions organisées
    total_enrollments: Int # Total inscriptions
    average_attendance: Float # Taux de présence moyen %
    revenue_generated: Float # Revenu généré
    calculated_at: String
  }

  # club_stats
  type ClubStats {
    id: Int!
    stat_date: String!
    total_members: Int
    active_members: Int
    new_members_today: Int
    new_members_week: Int
    new_members_month: Int
    total_activities: Int
    active_activities: Int
    total_sessions_today: Int
    total_sessions_week: Int
    total_enrollments: Int
    revenue_today: Float
    revenue_week: Float
    revenue_month: Float
    revenue_year: Float
    pending_payments_count: Int
    pending_payments_amount: Float
    upcoming_events_week: Int
    active_instructors: Int
    calculated_at: String
  }

`;
