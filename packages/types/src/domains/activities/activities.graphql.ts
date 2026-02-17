import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # activity_categories
  type ActivityCategories {
    id: Int!
    name: String!
    description: String
    active: Boolean
    created_at: String
  }

  # activities
  type Activities {
    id: Int!
    category_id: Int!
    name: String!
    description: String
    has_levels: Boolean # Indique si cette activité a des niveaux/grades
    active: Boolean
    created_at: String
  }

  # activity_levels
  type ActivityLevels {
    id: Int!
    activity_id: Int!
    name: String! # Ex: Débutant, Intermédiaire, Avancé OU Ceinture blanche, jaune, etc.
    level_order: Int! # Ordre du niveau (1=débutant, 2=intermédiaire, etc.)
    color: String # Couleur associée (pour ceintures, badges, etc.)
    description: String
  }

  # user_activities
  type UserActivities {
    id: Int!
    user_id: Int!
    activity_id: Int!
    current_level_id: Int
    started_at: String
    is_active: Boolean
    notes: String # Notes spécifiques à cette pratique
    created_at: String
  }

`;
