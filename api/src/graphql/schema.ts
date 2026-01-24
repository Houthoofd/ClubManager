import { createSchema } from 'graphql-yoga';
import { DateTimeResolver } from 'graphql-scalars';
import { prisma } from '../infrastructure/database/prisma-client.js';

/**
 * Schéma GraphQL de base
 * Définit les types, queries et mutations
 */
export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    scalar DateTime
    scalar Decimal

    type Query {
      # Santé de l'API
      health: String!
      
      # Utilisateurs
      users(take: Int, skip: Int): [User!]!
      user(id: Int!): User
      
      # Cours
      courses(take: Int, skip: Int): [Course!]!
      course(id: Int!): Course
      
      # Articles/Magasin
      articles(take: Int, skip: Int): [Article!]!
      article(id: Int!): Article
    }

    type Mutation {
      # Authentification (à implémenter)
      login(email: String!, password: String!): AuthPayload!
      register(input: RegisterInput!): AuthPayload!
    }

    # Types de base

    type User {
      id: Int!
      nom: String!
      prenom: String!
      email: String!
      telephone: String
      genre: Genre
      grade: Grade
      inscriptions: [Inscription!]!
      created_at: DateTime!
    }

    type Genre {
      id: Int!
      genre_name: String!
    }

    type Grade {
      id: Int!
      grade_id: String!
    }

    type Course {
      id: Int!
      date_cours: DateTime!
      type_cours: String!
      heure_debut: DateTime!
      heure_fin: DateTime!
      cours_recurrent: CoursRecurrent!
      inscriptions: [Inscription!]!
    }

    type CoursRecurrent {
      id: Int!
      type_cours: String!
      jour_semaine: Int!
      heure_debut: DateTime!
      heure_fin: DateTime!
    }

    type Inscription {
      id: Int!
      utilisateur_id: Int!
      cours_id: Int!
      date_inscription: DateTime!
      status_id: Boolean
      user: User!
      cours: Course!
    }

    type Article {
      id: Int!
      nom: String!
      description: String
      prix: Decimal!
      image_url: String
      categorie: Categorie
      stocks: [Stock!]!
    }

    type Categorie {
      id: Int!
      nom: String!
    }

    type Stock {
      id: Int!
      article_id: Int!
      taille_id: Int!
      quantite_disponible: Int!
      article: Article!
      taille: Taille!
    }

    type Taille {
      id: Int!
      taille: String!
    }

    # Auth types

    type AuthPayload {
      token: String!
      user: User!
    }

    input RegisterInput {
      nom: String!
      prenom: String!
      email: String!
      password: String!
      telephone: String
      genre_id: Int
    }
  `,
  
  resolvers: {
    DateTime: DateTimeResolver,
    Decimal: {
      serialize: (value: any) => value.toString(),
      parseValue: (value: any) => parseFloat(value),
      parseLiteral: (ast: any) => parseFloat(ast.value),
    },

    Query: {
      health: () => 'GraphQL API is running!',
      
      // Utilisateurs
      users: async (_parent, args) => {
        const { take = 10, skip = 0 } = args;
        return prisma.utilisateurs.findMany({
          take,
          skip,
          include: {
            genres: true,
            grades: true,
          },
        });
      },
      
      user: async (_parent, args) => {
        return prisma.utilisateurs.findUnique({
          where: { id: args.id },
          include: {
            genres: true,
            grades: true,
            inscriptions: {
              include: {
                cours: true,
              },
            },
          },
        });
      },
      
      // Cours
      courses: async (_parent, args) => {
        const { take = 10, skip = 0 } = args;
        return prisma.cours.findMany({
          take,
          skip,
          include: {
            cours_recurrent: true,
          },
        });
      },
      
      course: async (_parent, args) => {
        return prisma.cours.findUnique({
          where: { id: args.id },
          include: {
            cours_recurrent: true,
            inscriptions: {
              include: {
                users: true,
              },
            },
          },
        });
      },
      
      // Articles
      articles: async (_parent, args) => {
        const { take = 10, skip = 0 } = args;
        return prisma.articles.findMany({
          take,
          skip,
          include: {
            categories: true,
            stocks: {
              include: {
                tailles: true,
              },
            },
          },
        });
      },
      
      article: async (_parent, args) => {
        return prisma.articles.findUnique({
          where: { id: args.id },
          include: {
            categories: true,
            stocks: {
              include: {
                tailles: true,
              },
            },
          },
        });
      },
    },

    Mutation: {
      login: async (_parent, _args) => {
        // TODO: Implémenter la logique d'authentification
        throw new Error('Not implemented yet');
      },
      
      register: async (_parent, _args) => {
        // TODO: Implémenter la logique d'inscription
        throw new Error('Not implemented yet');
      },
    },

    // Field resolvers
    User: {
      genre: (parent) => parent.genres,
      grade: (parent) => parent.grades,
    },
    
    Course: {
      cours_recurrent: (parent) => parent.cours_recurrent,
    },
    
    Article: {
      categorie: (parent) => parent.categories,
    },
  },
});
