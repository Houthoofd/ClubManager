/**
 * Mock du Prisma Client pour les tests
 */

import { jest } from "@jest/globals";
import bcrypt from "bcrypt";

// Helper pour créer des fonctions mock
const createMockFn = <T extends (...args: any[]) => any>(implementation: T) => {
  return implementation;
};

// Hash précalculé de 'password123' avec bcrypt - sera généré au runtime
let PASSWORD_HASH = "$2b$12$veryLongHashThatWillBeReplaced";

// Données mock - Utilisateurs
export const mockUtilisateurs = [
  {
    id: 1,
    first_name: "Jean",
    last_name: "Dupont",
    email: "jean@test.com",
    password: PASSWORD_HASH,
    status_id: 1,
    date_inscription: new Date("2025-01-01"),
    date_of_birth: new Date("1990-01-01"),
  },
  {
    id: 2,
    first_name: "Marie",
    last_name: "Martin",
    email: "marie@test.com",
    password: PASSWORD_HASH,
    status_id: 1,
    date_inscription: new Date("2025-01-02"),
    date_of_birth: new Date("1992-05-15"),
  },
];

// Données mock - Tokens de récupération
export const mockPasswordResetTokens = [
  {
    id: 1,
    user_id: 1,
    token: "valid-token-123",
    expires_at: new Date(Date.now() + 60 * 60 * 1000), // Expire dans 1h
    created_at: new Date(),
    utilisateurs: mockUtilisateurs[0],
  },
  {
    id: 2,
    user_id: 2,
    token: "expired-token-456",
    expires_at: new Date(Date.now() - 60 * 60 * 1000), // Expiré il y a 1h
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    utilisateurs: mockUtilisateurs[1],
  },
];

// Initialiser le hash password au chargement du module
(async () => {
  PASSWORD_HASH = await bcrypt.hash("password123", 12);
  mockUtilisateurs[0].password = PASSWORD_HASH;
  mockUtilisateurs[1].password = PASSWORD_HASH;
})();

// Factory pour créer un mock Prisma
export const createMockPrisma = () => {
  // Variables locales pour les données mock (reset à chaque appel)
  let utilisateurs = JSON.parse(JSON.stringify(mockUtilisateurs));
  let passwordResetTokens = JSON.parse(JSON.stringify(mockPasswordResetTokens));
  let authAttempts: any[] = [];
  let passwordResetAttempts: any[] = [];
  let manualRecoveryRequests: any[] = [];

  const mockPrismaClient = {
    utilisateurs: {
      findFirst: createMockFn(async (args?: any) => {
        let results = [...utilisateurs];

        if (args?.where?.email) {
          results = results.filter((u) => u.email === args.where.email);
        }
        if (args?.where?.status_id) {
          results = results.filter((u) => u.status_id === args.where.status_id);
        }
        if (args?.where?.id) {
          results = results.filter((u) => u.id === args.where.id);
        }

        return results[0] || null;
      }),

      findUnique: createMockFn(async (args: any) => {
        const user = utilisateurs.find((u: any) => u.id === args.where.id);
        if (!user) return null;

        // Simuler les relations si demandées
        const result: any = { ...user };
        if (args.include?.paiements || args.select?.paiements) {
          result.paiements = [];
        }
        if (args.include?.inscriptions || args.select?.inscriptions) {
          result.inscriptions = [];
        }

        return result;
      }),

      create: createMockFn(async (args: any) => {
        const newUser = {
          id: utilisateurs.length + 1,
          ...args.data,
          date_inscription: args.data.date_inscription || new Date(),
        };

        // Vérifier doublon email (erreur P2002)
        if (utilisateurs.find((u: any) => u.email === args.data.email)) {
          const error: any = new Error("Unique constraint failed");
          error.code = "P2002";
          throw error;
        }

        utilisateurs.push(newUser);
        return newUser;
      }),

      update: createMockFn(async (args: any) => {
        const index = utilisateurs.findIndex(
          (u: any) => u.id === args.where.id,
        );
        if (index === -1) return null;

        utilisateurs[index] = { ...utilisateurs[index], ...args.data };
        return utilisateurs[index];
      }),

      updateMany: createMockFn(async (args: any) => {
        let count = 0;
        utilisateurs = utilisateurs.map((u: any) => {
          const matches =
            (!args.where.id || u.id === args.where.id) &&
            (!args.where.status_id || u.status_id === args.where.status_id);
          if (matches) {
            count++;
            return { ...u, ...args.data };
          }
          return u;
        });
        return { count };
      }),

      count: createMockFn(async (args?: any) => {
        let results = [...utilisateurs];

        if (args?.where?.email) {
          results = results.filter((u) => u.email === args.where.email);
        }
        if (args?.where?.status_id) {
          results = results.filter((u) => u.status_id === args.where.status_id);
        }

        return results.length;
      }),
    },

    password_reset_tokens: {
      findFirst: createMockFn(async (args: any) => {
        let results = [...passwordResetTokens];

        if (args?.where?.token) {
          results = results.filter((t) => t.token === args.where.token);
        }
        if (args?.where?.user_id) {
          results = results.filter((t) => t.user_id === args.where.user_id);
        }
        if (args?.where?.expires_at?.gt) {
          results = results.filter(
            (t) => new Date(t.expires_at) > new Date(args.where.expires_at.gt),
          );
        }

        const token = results[0] || null;
        if (
          token &&
          (args?.include?.utilisateurs || args?.select?.utilisateurs)
        ) {
          const user = utilisateurs.find((u: any) => u.id === token.user_id);
          token.utilisateurs = user || null;
        }

        return token;
      }),

      create: createMockFn(async (args: any) => {
        const newToken = {
          id: passwordResetTokens.length + 1,
          ...args.data,
          created_at: args.data.created_at || new Date(),
        };
        passwordResetTokens.push(newToken);
        return newToken;
      }),

      deleteMany: createMockFn(async (args: any) => {
        const before = passwordResetTokens.length;

        if (args?.where?.user_id) {
          passwordResetTokens = passwordResetTokens.filter(
            (t: any) => t.user_id !== args.where.user_id,
          );
        }
        if (args?.where?.token) {
          passwordResetTokens = passwordResetTokens.filter(
            (t: any) => t.token !== args.where.token,
          );
        }
        if (args?.where?.expires_at?.lt) {
          passwordResetTokens = passwordResetTokens.filter(
            (t: any) => t.expires_at >= args.where.expires_at.lt,
          );
        }

        return { count: before - passwordResetTokens.length };
      }),

      count: createMockFn(async (args?: any) => {
        let results = [...passwordResetTokens];

        if (args?.where?.expires_at?.gt) {
          results = results.filter(
            (t) => t.expires_at > args.where.expires_at.gt,
          );
        }

        return results.length;
      }),
    },

    auth_attempts: {
      create: createMockFn(async (args: any) => {
        const newAttempt = {
          id: authAttempts.length + 1,
          ...args.data,
          attempted_at: args.data.attempted_at || new Date(),
        };
        authAttempts.push(newAttempt);
        return newAttempt;
      }),

      count: createMockFn(async (args?: any) => {
        let results = [...authAttempts];

        if (args?.where?.email) {
          results = results.filter((a) => a.email === args.where.email);
        }
        if (args?.where?.attempted_at?.gte) {
          results = results.filter(
            (a) => a.attempted_at >= args.where.attempted_at.gte,
          );
        }
        if (args?.where?.success !== undefined) {
          results = results.filter((a) => a.success === args.where.success);
        }

        return results.length;
      }),
    },

    password_reset_attempts: {
      create: createMockFn(async (args: any) => {
        const newAttempt = {
          id: passwordResetAttempts.length + 1,
          ...args.data,
          attempted_at: args.data.attempted_at || new Date(),
        };
        passwordResetAttempts.push(newAttempt);
        return newAttempt;
      }),

      count: createMockFn(async (args?: any) => {
        let results = [...passwordResetAttempts];

        if (args?.where?.email) {
          results = results.filter((a) => a.email === args.where.email);
        }
        if (args?.where?.attempted_at?.gte) {
          results = results.filter(
            (a) => a.attempted_at >= args.where.attempted_at.gte,
          );
        }
        if (args?.where?.success !== undefined) {
          results = results.filter((a) => a.success === args.where.success);
        }

        return results.length;
      }),

      findMany: createMockFn(async (args?: any) => {
        let results = [...authAttempts];

        if (args?.where?.attempted_at?.gte) {
          results = results.filter(
            (a) => a.attempted_at >= args.where.attempted_at.gte,
          );
        }
        if (args?.orderBy?.attempted_at) {
          results.sort((a, b) => {
            const aDate = new Date(a.attempted_at).getTime();
            const bDate = new Date(b.attempted_at).getTime();
            return args.orderBy.attempted_at === "desc"
              ? bDate - aDate
              : aDate - bDate;
          });
        }
        if (args?.take) {
          results = results.slice(0, args.take);
        }

        return results;
      }),
    },

    manual_recovery_requests: {
      create: createMockFn(async (args: any) => {
        const newRequest = {
          id: manualRecoveryRequests.length + 1,
          ...args.data,
          created_at: args.data.created_at || new Date(),
        };
        manualRecoveryRequests.push(newRequest);
        return newRequest;
      }),
    },

    // Mock de la transaction Prisma
    $transaction: createMockFn(async (callback: any) => {
      const tx = {
        utilisateurs: {
          update: createMockFn(async (args: any) => {
            const index = utilisateurs.findIndex(
              (u: any) => u.id === args.where.id,
            );
            if (index === -1) return null;

            utilisateurs[index] = { ...utilisateurs[index], ...args.data };
            return utilisateurs[index];
          }),
        },
        password_reset_tokens: {
          deleteMany: createMockFn(async (args: any) => {
            const before = passwordResetTokens.length;
            passwordResetTokens = passwordResetTokens.filter(
              (t: any) => t.user_id !== args.where.user_id,
            );
            return { count: before - passwordResetTokens.length };
          }),
        },
      };

      return callback(tx);
    }),

    // Méthode pour réinitialiser les données entre les tests
    _reset: () => {
      utilisateurs = JSON.parse(JSON.stringify(mockUtilisateurs));
      passwordResetTokens = JSON.parse(JSON.stringify(mockPasswordResetTokens));
      authAttempts = [];
      passwordResetAttempts = [];
      manualRecoveryRequests = [];
    },
  };

  return mockPrismaClient;
};

/**
 * Fonction pour initialiser les hashs de mots de passe
 * À appeler avant les tests pour générer les vrais hashs bcrypt
 */
export const initializePasswordHashes = async () => {
  const saltRounds = 12;
  PASSWORD_HASH = await bcrypt.hash("password123", saltRounds);

  // Mettre à jour les mots de passe dans les données mock originales
  mockUtilisateurs.forEach((user) => {
    user.password = PASSWORD_HASH;
  });

  return PASSWORD_HASH;
};
