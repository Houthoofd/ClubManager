import { createSchema } from "graphql-yoga";
import { DateTimeResolver } from "graphql-scalars";
import { prisma } from "../infrastructure/database/prisma-client.js";

// Import des resolvers et typedefs des modules migrés
import { createAuthResolvers } from "../routes/auth/core/resolvers/index.js";
import { messagesResolvers } from "../routes/messages/core/resolvers/index.js";
import { alertesResolvers as alertesResolversNew } from "../routes/alertes/core/resolvers/index.js";
import { commandesResolvers } from "../routes/commandes/core/resolvers/index.js";
import { compteResolvers } from "../routes/compte/core/resolvers/index.js";
import { confirmationResolvers } from "../routes/confirmation/core/resolvers/index.js";
import { coursResolvers } from "../routes/cours/core/resolvers/index.js";
import { echeancesResolvers } from "../routes/echeances/core/resolvers/index.js";
import { informationsResolvers } from "../routes/informations/core/resolvers/index.js";
import { inscriptionResolvers } from "../routes/inscription/core/resolvers/index.js";
import { magasinResolvers } from "../routes/magasin/core/resolvers/index.js";
import { paiementsResolvers } from "../routes/paiements/core/resolvers/index.js";
import { professeursResolvers } from "../routes/professeurs/core/resolvers/index.js";
import { statistiquesResolvers } from "../routes/statistiques/core/resolvers/index.js";
import { stocksResolvers } from "../routes/stocks/core/resolvers/index.js";
import { utilisateursResolvers } from "../routes/utilisateurs/core/resolvers/index.js";
import { verificationResolvers } from "../routes/verification/core/resolvers/index.js";
import { uploadResolvers } from "../routes/upload/core/resolvers/index.js";
import { webhooksResolvers } from "../routes/stripe/core/webhooks/index.js";

// Import des TypeDefs centralisés depuis @clubmanager/types
import {
  authTypeDefs,
  messagesTypeDefs,
  alertesTypeDefs,
  commandesTypeDefs,
  compteTypeDefs,
  confirmationTypeDefs,
  coursTypeDefs,
  echeancesTypeDefs,
  informationsTypeDefs,
  inscriptionTypeDefs,
  magasinTypeDefs,
  paiementsTypeDefs,
  professeursTypeDefs,
  statistiquesTypeDefs,
  stocksTypeDefs,
  utilisateursTypeDefs,
  verificationTypeDefs,
  uploadTypeDefs,
  webhooksTypeDefs,
} from "@clubmanager/types";

// Créer les resolvers auth avec Prisma
const authResolvers = createAuthResolvers(prisma);

/**
 * Schéma GraphQL de base
 * Définit les types, queries et mutations
 */
export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    scalar DateTime
    scalar Decimal
    scalar JSON

    # ======================================
    # TypeDefs centralisés depuis @clubmanager/types
    # ======================================

    ${authTypeDefs}

    ${messagesTypeDefs}

    ${alertesTypeDefs}

    ${commandesTypeDefs}

    ${compteTypeDefs}

    ${confirmationTypeDefs}

    ${coursTypeDefs}

    ${echeancesTypeDefs}

    ${informationsTypeDefs}

    ${inscriptionTypeDefs}

    ${magasinTypeDefs}
    ${paiementsTypeDefs}
    ${professeursTypeDefs}
    ${statistiquesTypeDefs}
    ${stocksTypeDefs}
    ${utilisateursTypeDefs}
    ${verificationTypeDefs}
    ${uploadTypeDefs}

    ${webhooksTypeDefs}

    # ======================================
    # Types legacy (à migrer progressivement)
    # ======================================

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

      # Upload
      uploadHealth: UploadHealthStatus!
      listUploadedFiles(
        limit: Int
        offset: Int
        sortBy: String
        sortOrder: String
        extension: String
      ): ListFilesResult!
      getFileInfo(filename: String!): FileInfo!
      uploadStats: UploadStats!
      fileExists(filename: String!): FileExistsResult!
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

      # Upload
      uploadFile(input: FileUploadInput!): UploadResult!
      deleteFile(input: DeleteFileInput!): UploadResult!
      cleanupOldFiles(daysOld: Int): CleanupResult!
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

    # Upload types

    type UploadHealthStatus {
      status: String!
      message: String!
      uploadsDirectory: String!
      isWritable: Boolean!
      diskSpace: DiskSpace
      timestamp: DateTime!
    }

    type DiskSpace {
      free: Float!
      total: Float!
      used: Float!
    }

    type FileInfo {
      filename: String!
      originalName: String!
      path: String!
      size: Int!
      mimetype: String!
      extension: String!
      uploadedAt: DateTime!
      uploadedBy: Int
    }

    type ListFilesResult {
      success: Boolean!
      files: [FileInfo!]!
      total: Int!
      hasMore: Boolean!
    }

    type UploadResult {
      success: Boolean!
      message: String!
      file: FileInfo
    }

    type UploadStats {
      totalFiles: Int!
      totalSize: Float!
      averageSize: Float!
      filesByExtension: [FilesByExtension!]!
      recentUploads: [FileInfo!]!
    }

    type FilesByExtension {
      extension: String!
      count: Int!
    }

    type FileExistsResult {
      exists: Boolean!
      filename: String!
    }

    type CleanupResult {
      success: Boolean!
      message: String!
      filesDeleted: [String!]!
      count: Int!
    }

    input FileUploadInput {
      filename: String!
      mimetype: String!
      encoding: String!
      content: String!
    }

    input DeleteFileInput {
      filename: String!
    }
  `,

  resolvers: {
    DateTime: DateTimeResolver,
    Decimal: {
      serialize: (value: any) => value.toString(),
      parseValue: (value: any) => parseFloat(value),
      parseLiteral: (ast: any) => parseFloat(ast.value),
    },
    JSON: {
      serialize: (value: any) => value,
      parseValue: (value: any) => value,
      parseLiteral: (ast: any) => {
        switch (ast.kind) {
          case "StringValue":
          case "BooleanValue":
            return ast.value;
          case "IntValue":
          case "FloatValue":
            return parseFloat(ast.value);
          case "ObjectValue":
            return ast.fields.reduce((acc: any, field: any) => {
              acc[field.name.value] = field.value;
              return acc;
            }, {});
          case "ListValue":
            return ast.values.map((v: any) => v.value);
          default:
            return null;
        }
      },
    },

    Query: {
      health: () => "GraphQL API is running!",

      // Alertes (nouveaux resolvers avec middlewares)
      ...alertesResolversNew.Query,

      // Messages (nouveaux resolvers avec middlewares)
      ...messagesResolvers.Query,

      // Commandes (nouveaux resolvers avec middlewares)
      ...commandesResolvers.Query,

      // Compte (nouveaux resolvers avec middlewares)
      ...compteResolvers.Query,

      // Confirmation (nouveaux resolvers avec middlewares)
      ...confirmationResolvers.Query,

      // Cours (nouveaux resolvers avec middlewares)
      ...coursResolvers.Query,

      // Écheances (nouveaux resolvers avec middlewares)
      ...echeancesResolvers.Query,

      // Informations (nouveaux resolvers avec middlewares)
      ...informationsResolvers.Query,

      // Inscription (nouveaux resolvers avec middlewares)
      ...inscriptionResolvers.Query,

      // Magasin (nouveaux resolvers avec middlewares)
      ...magasinResolvers.Query,

      // Paiements (nouveaux resolvers avec middlewares)
      ...paiementsResolvers.Query,

      // Professeurs (nouveaux resolvers avec middlewares)
      ...professeursResolvers.Query,

      // Statistiques (nouveaux resolvers avec middlewares)
      ...statistiquesResolvers.Query,

      // Stocks (nouveaux resolvers avec middlewares)
      ...stocksResolvers.Query,

      // Utilisateurs (nouveaux resolvers avec middlewares)
      ...utilisateursResolvers(prisma).Query,

      // Verification (nouveaux resolvers avec middlewares)
      ...verificationResolvers(prisma).Query,

      // Upload (nouveaux resolvers avec middlewares)
      ...uploadResolvers(prisma).Query,

      // Webhooks Stripe (nouveaux resolvers avec middlewares)
      ...webhooksResolvers.Query,

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

      // Alertes (nouveaux resolvers avec middlewares)
      ...alertesResolversNew.Mutation,

      // Messages (nouveaux resolvers avec middlewares)
      ...messagesResolvers.Mutation,

      // Commandes (nouveaux resolvers avec middlewares)
      ...commandesResolvers.Mutation,

      // Compte (nouveaux resolvers avec middlewares)
      ...compteResolvers.Mutation,

      // Confirmation (nouveaux resolvers avec middlewares)
      ...confirmationResolvers.Mutation,

      // Cours (nouveaux resolvers avec middlewares)
      ...coursResolvers.Mutation,

      // Écheances (nouveaux resolvers avec middlewares)
      ...echeancesResolvers.Mutation,

      // Informations (nouveaux resolvers avec middlewares)
      ...informationsResolvers.Mutation,

      // Inscription (nouveaux resolvers avec middlewares)
      ...inscriptionResolvers.Mutation,

      // Magasin (nouveaux resolvers avec middlewares)
      ...magasinResolvers.Mutation,

      // Paiements (nouveaux resolvers avec middlewares)
      ...paiementsResolvers.Mutation,

      // Professeurs (nouveaux resolvers avec middlewares)
      ...professeursResolvers.Mutation,

      // Statistiques (nouveaux resolvers avec middlewares)
      ...statistiquesResolvers.Mutation,

      // Stocks (nouveaux resolvers avec middlewares)
      ...stocksResolvers.Mutation,

      // Utilisateurs (nouveaux resolvers avec middlewares)
      ...utilisateursResolvers(prisma).Mutation,

      // Verification (nouveaux resolvers avec middlewares)
      ...verificationResolvers(prisma).Mutation,

      // Upload (nouveaux resolvers avec middlewares)
      ...uploadResolvers(prisma).Mutation,

      // Webhooks Stripe (nouveaux resolvers avec middlewares)
      ...webhooksResolvers.Mutation,
    },

    Subscription: {
      // Webhooks Stripe (nouveaux resolvers avec middlewares)
      ...webhooksResolvers.Subscription,
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
