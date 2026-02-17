import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # event_types
  type EventTypes {
    id: Int!
    name: String!
    description: String
    color: String # Couleur pour le calendrier
    icon: String
  }

  # events
  type Events {
    id: Int!
    event_type_id: Int!
    title: String!
    description: String
    location: String
    start_date: String!
    end_date: String!
    start_time: String
    end_time: String
    max_participants: Int # NULL = illimité
    current_participants: Int
    registration_required: Boolean
    registration_deadline: String
    price: Float
    image_url: String
    status: String
    created_by: Int!
    created_at: String
    updated_at: String
  }

  # event_registrations
  type EventRegistrations {
    id: Int!
    event_id: Int!
    user_id: Int!
    status: String
    payment_status: String
    notes: String
    registered_at: String
  }

`;
