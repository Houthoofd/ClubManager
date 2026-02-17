import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # membership_plans
  type MembershipPlans {
    id: Int!
    name: String!
    description: String
    price: Float!
    duration_months: Int
    features: String # Avantages en JSON
    active: Boolean
    created_at: String
  }

  # memberships
  type Memberships {
    id: Int!
    user_id: Int!
    plan_id: Int!
    start_date: String!
    end_date: String!
    status: String
    auto_renew: Boolean
    created_at: String
  }

  # payments
  type Payments {
    id: Int!
    user_id: Int!
    amount: Float!
    payment_method: String
    payment_type: String
    reference_id: Int # ID de référence (adhésion, session, commande, etc.)
    status: String
    transaction_id: String # ID de transaction externe
    payment_date: String
    notes: String
  }

`;
