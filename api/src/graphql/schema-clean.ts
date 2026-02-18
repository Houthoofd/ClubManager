import { createSchema } from "graphql-yoga";
import { DateTimeResolver } from "graphql-scalars";
import { prisma } from '@/infrastructure/database/prisma-client.js';

// Import resolvers
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

// Import TypeDefs from @clubmanager/types
import { users, sessions, shop, memberships, statistics } from "@clubmanager/types";

// Create auth resolvers with Prisma
const authResolvers = createAuthResolvers(prisma);

/**
 * Clean GraphQL Schema - English Only
 *
 * Uses TypeDefs from @clubmanager/types package (domains/)
 * All types follow the database schema naming (English, snake_case)
 */
export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    # ============================================================================
    # Custom Scalars
    # ============================================================================

    scalar DateTime
    scalar Decimal
    scalar JSON

    # ============================================================================
    # Domain TypeDefs from @clubmanager/types
    # ============================================================================

    # Users Domain
    ${users.typeDefs}

    # Sessions Domain (courses, instructors)
    ${sessions.typeDefs}

    # Shop Domain (products, categories, stocks)
    ${shop.typeDefs}

    # Memberships Domain (subscriptions, payments)
    ${memberships.typeDefs}

    # Statistics Domain
    ${statistics.typeDefs}

    # ============================================================================
    # Root Query Type
    # ============================================================================

    type Query {
      # Health check
      health: String!

      # Users
      users(take: Int, skip: Int): [Users!]!
      user(id: Int!): Users

      # Sessions (Courses)
      sessions(take: Int, skip: Int): [Sessions!]!
      session(id: Int!): Sessions
      sessionTypes: [SessionTypes!]!
      instructors(take: Int, skip: Int): [Instructors!]!

      # Shop
      products(take: Int, skip: Int): [Products!]!
      product(id: Int!): Products
      productCategories: [ProductCategories!]!

      # Enrollments
      sessionEnrollments(sessionId: Int!): [SessionEnrollments!]!
      userEnrollments(userId: Int!): [SessionEnrollments!]!

      # Memberships & Subscriptions
      subscriptionPlans: [SubscriptionPlans!]!
      userSubscription(userId: Int!): UserSubscriptions

      # Payments
      payments(userId: Int, take: Int, skip: Int): [Payments!]!
      payment(id: Int!): Payments

      # Statistics
      dashboardStats: DashboardStats
      userStats(userId: Int!): UserStats

      # Auth
      me: Users
      checkEmail(email: String!): EmailCheckResult!
      verifyResetToken(token: String!): PasswordResetTokenValidation
    }

    # ============================================================================
    # Root Mutation Type
    # ============================================================================

    type Mutation {
      # Authentication
      login(email: String!, password: String!): AuthResult!
      register(input: RegisterInput!): AuthResult!
      logout: AuthResult!
      requestPasswordReset(email: String!): AuthResult!
      resetPassword(token: String!, newPassword: String!): AuthResult!
      changePassword(userId: Int!, currentPassword: String!, newPassword: String!): AuthResult!

      # Users
      createUser(input: CreateUserInput!): Users!
      updateUser(id: Int!, input: UpdateUserInput!): Users!
      deleteUser(id: Int!): MutationResult!

      # Sessions (Courses)
      createSession(input: CreateSessionInput!): Sessions!
      updateSession(id: Int!, input: UpdateSessionInput!): Sessions!
      deleteSession(id: Int!): MutationResult!

      # Enrollments
      enrollUser(userId: Int!, sessionId: Int!): SessionEnrollments!
      cancelEnrollment(enrollmentId: Int!): MutationResult!
      updateEnrollmentStatus(enrollmentId: Int!, status: String!): SessionEnrollments!

      # Shop
      createProduct(input: CreateProductInput!): Products!
      updateProduct(id: Int!, input: UpdateProductInput!): Products!
      deleteProduct(id: Int!): MutationResult!

      # Orders
      createOrder(input: CreateOrderInput!): Orders!
      updateOrderStatus(orderId: Int!, status: String!): Orders!

      # Payments
      createPayment(input: CreatePaymentInput!): Payments!
      processPayment(paymentId: Int!): PaymentResult!

      # Subscriptions
      createSubscription(userId: Int!, planId: Int!): UserSubscriptions!
      cancelSubscription(subscriptionId: Int!): MutationResult!
    }

    # ============================================================================
    # Subscription Type (Real-time updates)
    # ============================================================================

    type Subscription {
      enrollmentUpdated(sessionId: Int!): SessionEnrollments!
      paymentProcessed(userId: Int!): Payments!
    }

    # ============================================================================
    # Input Types
    # ============================================================================

    input RegisterInput {
      email: String!
      password: String!
      first_name: String!
      last_name: String!
      phone: String
      birth_date: String
      gender_id: Int
    }

    input CreateUserInput {
      email: String!
      password: String!
      first_name: String!
      last_name: String!
      phone: String
      birth_date: String
      address: String
      gender_id: Int
      role: String
    }

    input UpdateUserInput {
      email: String
      first_name: String
      last_name: String
      phone: String
      birth_date: String
      address: String
      gender_id: Int
      active: Boolean
    }

    input CreateSessionInput {
      session_type_id: Int!
      instructor_id: Int!
      date: String!
      start_time: String!
      end_time: String!
      location: String
      max_participants: Int
      notes: String
    }

    input UpdateSessionInput {
      session_type_id: Int
      instructor_id: Int
      date: String
      start_time: String
      end_time: String
      location: String
      max_participants: Int
      status: String
      notes: String
    }

    input CreateProductInput {
      name: String!
      description: String
      price: Float!
      category_id: Int!
      image_url: String
      active: Boolean
    }

    input UpdateProductInput {
      name: String
      description: String
      price: Float
      category_id: Int
      image_url: String
      active: Boolean
    }

    input CreateOrderInput {
      user_id: Int!
      items: [OrderItemInput!]!
      delivery_address: String
      notes: String
    }

    input OrderItemInput {
      product_id: Int!
      stock_id: Int!
      quantity: Int!
      price: Float!
    }

    input CreatePaymentInput {
      user_id: Int!
      order_id: Int
      subscription_id: Int
      amount: Float!
      payment_method: String!
      stripe_payment_intent_id: String
    }

    # ============================================================================
    # Response Types
    # ============================================================================

    type AuthResult {
      success: Boolean!
      message: String!
      token: String
      user: Users
    }

    type MutationResult {
      success: Boolean!
      message: String!
    }

    type PaymentResult {
      success: Boolean!
      message: String!
      payment: Payments
      clientSecret: String
    }

    type EmailCheckResult {
      exists: Boolean!
      email: String!
    }

    type PasswordResetTokenValidation {
      valid: Boolean!
      userId: Int
      expiresAt: DateTime
    }

    type DashboardStats {
      totalUsers: Int!
      activeUsers: Int!
      totalSessions: Int!
      upcomingSessions: Int!
      totalOrders: Int!
      totalRevenue: Float!
      pendingPayments: Int!
    }

    type UserStats {
      userId: Int!
      totalEnrollments: Int!
      completedSessions: Int!
      totalSpent: Float!
      subscriptionStatus: String
    }

    # ============================================================================
    # Extended Types with Relations
    # ============================================================================

    # Extended Orders type (not in base typedefs)
    type Orders {
      id: Int!
      user_id: Int!
      total_amount: Float!
      status: String!
      delivery_address: String
      notes: String
      created_at: String
      items: [OrderItems!]!
      payment: Payments
    }

    type OrderItems {
      id: Int!
      order_id: Int!
      product_id: Int!
      stock_id: Int!
      quantity: Int!
      price: Float!
      product: Products
    }
  `,

  resolvers: {
    DateTime: DateTimeResolver,

    // Decimal scalar
    Decimal: {
      serialize: (value: any) => value?.toString() ?? null,
      parseValue: (value: any) => value,
      parseLiteral: (ast: any) => ast.value,
    },

    // JSON scalar
    JSON: {
      serialize: (value: any) => value,
      parseValue: (value: any) => value,
      parseLiteral: (ast: any) => {
        try {
          return JSON.parse(ast.value);
        } catch {
          return null;
        }
      },
    },

    Query: {
      health: () => "OK",

      // Users
      users: async (_parent, args) => {
        return prisma.users.findMany({
          take: args.take,
          skip: args.skip,
          include: {
            genders: true,
          },
        });
      },

      user: async (_parent, args) => {
        return prisma.users.findUnique({
          where: { id: args.id },
          include: {
            genders: true,
            user_profiles: true,
            user_security: true,
          },
        });
      },

      // Sessions
      sessions: async (_parent, args) => {
        return prisma.sessions.findMany({
          take: args.take,
          skip: args.skip,
          include: {
            session_types: true,
            instructors: true,
          },
        });
      },

      session: async (_parent, args) => {
        return prisma.sessions.findUnique({
          where: { id: args.id },
          include: {
            session_types: true,
            instructors: true,
            session_enrollments: {
              include: {
                users: true,
              },
            },
          },
        });
      },

      // Shop
      products: async (_parent, args) => {
        return prisma.products.findMany({
          take: args.take,
          skip: args.skip,
          include: {
            product_categories: true,
            product_stocks: true,
          },
        });
      },

      product: async (_parent, args) => {
        return prisma.products.findUnique({
          where: { id: args.id },
          include: {
            product_categories: true,
            product_stocks: {
              include: {
                stock_sizes: true,
              },
            },
          },
        });
      },

      // Enrollments
      sessionEnrollments: async (_parent, args) => {
        return prisma.session_enrollments.findMany({
          where: { session_id: args.sessionId },
          include: {
            users: true,
            sessions: true,
          },
        });
      },

      userEnrollments: async (_parent, args) => {
        return prisma.session_enrollments.findMany({
          where: { user_id: args.userId },
          include: {
            sessions: {
              include: {
                session_types: true,
                instructors: true,
              },
            },
          },
        });
      },

      // Subscriptions
      subscriptionPlans: async () => {
        return prisma.subscription_plans.findMany({
          where: { active: true },
        });
      },

      userSubscription: async (_parent, args) => {
        return prisma.user_subscriptions.findFirst({
          where: {
            user_id: args.userId,
            status: 'active',
          },
          include: {
            subscription_plans: true,
          },
        });
      },

      // Payments
      payments: async (_parent, args) => {
        return prisma.payments.findMany({
          where: args.userId ? { user_id: args.userId } : undefined,
          take: args.take,
          skip: args.skip,
          orderBy: { payment_date: 'desc' },
        });
      },

      payment: async (_parent, args) => {
        return prisma.payments.findUnique({
          where: { id: args.id },
        });
      },

      // Auth
      me: async (_parent, _args, context) => {
        // Get user from context (set by auth middleware)
        const userId = context?.user?.id;
        if (!userId) return null;

        return prisma.users.findUnique({
          where: { id: userId },
          include: {
            genders: true,
            user_profiles: true,
          },
        });
      },

      checkEmail: async (_parent, args) => {
        const exists = await prisma.users.findUnique({
          where: { email: args.email },
        });
        return {
          exists: !!exists,
          email: args.email,
        };
      },
    },

    Mutation: {
      // Merge all resolvers
      ...authResolvers.Mutation,
      ...utilisateursResolvers.Mutation,
      ...coursResolvers.Mutation,
      ...inscriptionResolvers.Mutation,
      ...magasinResolvers.Mutation,
      ...commandesResolvers.Mutation,
      ...paiementsResolvers.Mutation,
    },

    Subscription: {
      // Add subscription resolvers here when needed
    },
  },
});
