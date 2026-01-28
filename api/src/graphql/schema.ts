import { createSchema } from "graphql-yoga";
import { DateTimeResolver } from "graphql-scalars";
import { prisma } from "../infrastructure/database/prisma-client.js";
import { alertesResolvers } from "../services/alertes/index.js";
import { authResolvers } from "../services/auth/index.js";

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

      # Alertes
      dashboardAlertes: AlerteDashboard!
      alertesActives: [AlerteUtilisateur!]!
      alertesUtilisateur(utilisateurId: Int!): [AlerteUtilisateur!]!
      statistiquesAlertes: AlerteStats!

      # Auth
      checkEmail(email: String!): EmailCheckResult!
      securityInfo(userId: Int!): SecurityInfo
      authStats: AuthStats!
      verifyResetToken(token: String!): PasswordResetToken
    }

    type Mutation {
      # Authentification
      login(email: String!, password: String!): AuthResult!
      register(input: CreateUserInput!): AuthResult!
      changePassword(input: ChangePasswordInput!): AuthResult!
      requestPasswordReset(email: String!): AuthResult!
      resetPassword(token: String!, newPassword: String!): AuthResult!
      createManualRecovery(
        userId: Int!
        reason: String!
        verificationData: String!
      ): AuthResult!
      cleanExpiredTokens: CleanTokensResult!

      # Refresh Tokens
      refreshToken(refreshToken: String!): RefreshTokenResult!
      revokeRefreshToken(refreshToken: String!): AuthResult!
      revokeAllUserTokens(userId: Int!): RevokeTokensResult!

      # Alertes
      detecterAlertes: AlerteResult!
      resoudreAlerte(input: ResoudreAlerteInput!): AlerteResult!
      ignorerAlerte(input: IgnorerAlerteInput!): AlerteResult!
      creerAlerte(input: CreateAlerteInput!): AlerteUtilisateur!
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

    # Types pour les alertes

    type AlerteUtilisateur {
      id: Int!
      utilisateurId: Int!
      alerteTypeId: Int!
      statut: String!
      donneesContexte: String
      dateDetection: DateTime!
      dateResolution: DateTime
      notes: String
      effectueParId: Int
      typeAlerte: String
      nomUtilisateur: String
      email: String
      priorite: String
    }

    type AlerteDashboard {
      totalAlertes: Int!
      alertesActives: Int!
      alertesCritiques: Int!
      alertesResolues: Int!
      alertesParType: [AlerteParType!]!
      total: Int
      alertes_recentes: [AlerteUtilisateur!]
    }

    type AlerteParType {
      typeAlerteId: Int!
      count: Int!
      statut: String!
    }

    type AlerteStats {
      totalAlertes: Int!
      alertesActives: Int!
      alertesResolues: Int!
      alertesCritiques: Int!
    }

    type AlerteResult {
      success: Boolean!
      message: String!
    }

    input CreateAlerteInput {
      utilisateurId: Int!
      typeAlerteId: Int!
      donneesContexte: String
    }

    input ResoudreAlerteInput {
      alerteId: Int!
      notes: String!
      effectuePar: Int!
    }

    input IgnorerAlerteInput {
      alerteId: Int!
      notes: String
    }

    # Auth types

    type AuthResult {
      success: Boolean!
      message: String!
      token: String
      refreshToken: String
      user: AuthUser
    }

    type AuthUser {
      id: Int!
      nom: String
      prenom: String
      email: String!
      telephone: String
      genre_id: Int
      grade_id: Int
      created_at: DateTime
    }

    type EmailCheckResult {
      exists: Boolean!
      email: String!
    }

    type SecurityInfo {
      id: Int!
      email: String!
      firstName: String!
      lastName: String!
      dateOfBirth: DateTime
      dateInscription: DateTime!
      nbPaiements: Int!
      nbInscriptions: Int!
      dernierPaiement: DateTime
    }

    type AuthStats {
      totalUsers: Int!
      activeUsers: Int!
      recentLogins: Int
      failedAttempts: Int
      passwordResets: Int
    }

    type PasswordResetToken {
      valid: Boolean!
      userId: Int
      expiresAt: DateTime
    }

    type CleanTokensResult {
      count: Int!
    }

    type RefreshTokenResult {
      success: Boolean!
      message: String!
      accessToken: String
      refreshToken: String
      expiresIn: Int
    }

    type RevokeTokensResult {
      success: Boolean!
      message: String!
      count: Int!
    }

    input CreateUserInput {
      email: String!
      password: String!
      first_name: String!
      last_name: String!
      telephone: String
      date_of_birth: String
      genre_id: Int
      grade_id: Int
    }

    input ChangePasswordInput {
      userId: Int!
      currentPassword: String
      newPassword: String!
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
      health: () => "GraphQL API is running!",

      // Alertes
      ...alertesResolvers.Query,

      // Auth
      ...authResolvers.Query,

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
      // Auth
      ...authResolvers.Mutation,

      // Alertes
      ...alertesResolvers.Mutation,
    },

    // Field resolvers
    User: {
      genre: (parent) => parent.genres,
      grade: (parent) => parent.grades,
    },

    AuthUser: {
      nom: (parent) => parent.lastName || parent.last_name,
      prenom: (parent) => parent.firstName || parent.first_name,
    },

    Course: {
      cours_recurrent: (parent) => parent.cours_recurrent,
    },

    Article: {
      categorie: (parent) => parent.categories,
    },
  },
});
