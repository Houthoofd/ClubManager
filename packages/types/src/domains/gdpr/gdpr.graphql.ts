import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # user_consents
  type UserConsents {
    id: Int!
    user_id: Int!
    consent_type: String!
    consent_given: Boolean
    consent_text: String # Texte du consentement au moment de l'acceptation
    given_at: String
    withdrawn_at: String
    ip_address: String
    user_agent: String
    created_at: String
    updated_at: String
  }

`;
