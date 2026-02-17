import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # genders
  type Genders {
    id: Int!
    name: String!
    code: String
  }

  # users
  type Users {
    id: Int!
    first_name: String!
    last_name: String!
    email: String!
    password: String!
    phone: String
    birth_date: String
    address: String
    gender_id: Int
    role: String # admin=administrateur, instructor=enseignant/coach, member=adhérent
    active: Boolean
    email_verified: Boolean
    created_at: String
    updated_at: String
  }

  # user_profiles
  type UserProfiles {
    id: Int!
    user_id: Int!
    bio: String
    avatar_url: String
    emergency_contact_name: String
    emergency_contact_phone: String
    preferences: String # Préférences utilisateur en JSON (notifications, langue, etc.)
    created_at: String
    updated_at: String
  }

  # user_security
  type UserSecurity {
    id: Int!
    user_id: Int!
    failed_login_attempts: Int
    last_login_at: String
    last_login_ip: String
    account_locked_until: String
    password_changed_at: String
    created_at: String
    updated_at: String
  }

  # password_reset_tokens
  type PasswordResetTokens {
    id: Int!
    user_id: Int!
    token: String!
    expires_at: String!
    used_at: String
    created_at: String
  }

  # account_deletion_requests
  type AccountDeletionRequests {
    id: Int!
    user_id: Int!
    reason: String
    status: String
    requested_at: String
    processed_at: String
    processed_by: Int
    notes: String
  }

`;
