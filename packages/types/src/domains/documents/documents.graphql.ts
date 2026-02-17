import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # documents
  type Documents {
    id: Int!
    title: String!
    description: String
    file_url: String!
    file_name: String!
    file_type: String # Type MIME du fichier
    file_size: Int # Taille en octets
    category: String
    visibility: String
    uploaded_by: Int!
    created_at: String
    updated_at: String
  }

`;
