import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # audit_logs
  type AuditLogs {
    id: Int!
    user_id: Int
    action: String! # Action effectuée (create, update, delete, login, etc.)
    entity_type: String # Type d'entité concernée (user, order, session, etc.)
    entity_id: Int # ID de l'entité concernée
    description: String
    ip_address: String
    user_agent: String # Navigateur/appareil
    created_at: String
  }

`;
