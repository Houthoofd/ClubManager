import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # instructors
  type Instructors {
    id: Int!
    user_id: Int!
    specialization: String # Spécialité de l'instructeur
    bio: String
    certifications: String # Certifications et qualifications
    active: Boolean
    created_at: String
  }

  # session_types
  type SessionTypes {
    id: Int!
    activity_id: Int!
    name: String!
    description: String
    duration_minutes: Int
    max_participants: Int # NULL = illimité
    price: Float
    active: Boolean
  }

  # sessions
  type Sessions {
    id: Int!
    session_type_id: Int!
    instructor_id: Int!
    date: String!
    start_time: String!
    end_time: String!
    location: String # Lieu de la session (salle, terrain, etc.)
    max_participants: Int
    current_participants: Int
    status: String
    notes: String
    created_at: String
  }

  # session_enrollments
  type SessionEnrollments {
    id: Int!
    user_id: Int!
    session_id: Int!
    status: String
    enrolled_at: String
    notes: String
  }

`;
