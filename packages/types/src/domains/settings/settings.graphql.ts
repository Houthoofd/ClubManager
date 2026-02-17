import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # settings
  type Settings {
    id: Int!
    setting_key: String!
    setting_value: String!
    setting_type: String
    category: String # Catégorie du paramètre
    description: String
    is_public: Boolean # 1 si visible publiquement, 0 sinon
    updated_at: String
  }

`;
