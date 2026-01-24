/**
 * Mock local pour les tests du service Auth
 */

// Helper pour créer des fonctions mock sans dépendance à jest
const createMockFn = <T extends (...args: any[]) => any>(implementation: T) => {
  return implementation;
};

// Données mock - Utilisateurs
export const mockUtilisateurs = [
  {
    id: 1,
    email: 'jean@test.com',
    password: '$2b$12$/CLuvALRTiMm.h0.k2dBM.vbyriSZ.4llhqtCvT7/OkL9RLW58Wce', // hash de "password123"
    first_name: 'Jean',
    last_name: 'Dupont',
    nom_utilisateur: 'jdupont',
    phone: '0612345678',
    date_of_birth: new Date('1990-01-01'),
    genre_id: 1,
    grade_id: 2,
    abonnement_id: null,
    status_id: 1,
    date_inscription: new Date('2025-01-01'),
    paiements: [],
    inscriptions: [],
    echeances_paiements: [],
  },
  {
    id: 2,
    email: 'marie@test.com',
    password: '$2b$12$/CLuvALRTiMm.h0.k2dBM.vbyriSZ.4llhqtCvT7/OkL9RLW58Wce',
    first_name: 'Marie',
    last_name: 'Martin',
    nom_utilisateur: 'mmartin',
    phone: '0698765432',
    date_of_birth: new Date('1985-05-15'),
    genre_id: 2,
    grade_id: 3,
    abonnement_id: 1,
    status_id: 1,
    date_inscription: new Date('2024-06-15'),
    paiements: [{ id: 1, date_paiement: new Date('2026-01-10') }],
    inscriptions: [{ id: 1 }, { id: 2 }],
    echeances_paiements: [
      {
        id: 1,
        utilisateur_id: 2,
        date_echeance: new Date('2025-12-01'),
        montant: 150,
        statut: 'en_attente',
      },
    ],
  },
];

// Données mock - Tokens de réinitialisation
export const mockPasswordResetTokens = [
  {
    id: 1,
    user_id: 1,
    token: 'valid-token-123',
    expires_at: new Date(Date.now() + 60 * 60 * 1000), // Expire dans 1h
    created_at: new Date(),
    utilisateurs: mockUtilisateurs[0],
  },
  {
    id: 2,
    user_id: 2,
    token: 'expired-token-456',
    expires_at: new Date(Date.now() - 60 * 60 * 1000), // Expiré
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    utilisateurs: mockUtilisateurs[1],
  },
];

// Données mock - Tentatives d'authentification
export const mockAuthAttempts = [
  { id: 1, email: 'jean@test.com', success: true, attempted_at: new Date() },
  { id: 2, email: 'wrong@test.com', success: false, attempted_at: new Date() },
];

// Données mock - Tentatives de réinitialisation
export const mockPasswordResetAttempts = [
  { id: 1, email: 'jean@test.com', success: true, attempted_at: new Date() },
];

// Factory pour créer un mock Prisma
export const createMockPrisma = () => {
  // Copie des données pour permettre la réinitialisation
  let utilisateurs = JSON.parse(JSON.stringify(mockUtilisateurs));
  let passwordResetTokens = [...mockPasswordResetTokens];
  let authAttempts = [...mockAuthAttempts];
  let passwordResetAttempts = [...mockPasswordResetAttempts];

  return {
    utilisateurs: {
      findUnique: createMockFn((args: any) => {
        const user = utilisateurs.find((u: any) => 
          (args.where.email && u.email === args.where.email) ||
          (args.where.id && u.id === args.where.id)
        );
        return Promise.resolve(user || null);
      }),

      findFirst: createMockFn((args: any) => {
        let results = [...utilisateurs];
        
        if (args?.where?.email) {
          results = results.filter((u: any) => u.email === args.where.email);
        }
        
        return Promise.resolve(results[0] || null);
      }),

      create: createMockFn((args: any) => {
        // Vérifier contrainte unique sur email
        if (utilisateurs.some((u: any) => u.email === args.data.email)) {
          throw new Error('Unique constraint failed');
        }
        
        const newUser = {
          id: utilisateurs.length + 1,
          ...args.data,
          date_inscription: new Date(),
          paiements: [],
          inscriptions: [],
          echeances_paiements: [],
        };
        utilisateurs.push(newUser);
        return Promise.resolve(newUser);
      }),

      update: createMockFn((args: any) => {
        const index = utilisateurs.findIndex((u: any) => u.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        utilisateurs[index] = { ...utilisateurs[index], ...args.data };
        return Promise.resolve(utilisateurs[index]);
      }),

      count: createMockFn((args?: any) => {
        let results = [...utilisateurs];
        
        if (args?.where?.email) {
          results = results.filter((u: any) => u.email === args.where.email);
        }
        
        return Promise.resolve(results.length);
      }),
    },

    password_reset_tokens: {
      create: createMockFn((args: any) => {
        const newToken = {
          id: passwordResetTokens.length + 1,
          ...args.data,
          created_at: new Date(),
        };
        passwordResetTokens.push(newToken);
        return Promise.resolve(newToken);
      }),

      findFirst: createMockFn((args: any) => {
        const token = passwordResetTokens.find(t => t.token === args.where.token);
        if (token && args.include?.utilisateurs) {
          return Promise.resolve({
            ...token,
            utilisateurs: utilisateurs.find((u: any) => u.id === token.user_id),
          });
        }
        return Promise.resolve(token || null);
      }),

      delete: createMockFn((args: any) => {
        const index = passwordResetTokens.findIndex(t => t.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        const deleted = passwordResetTokens[index];
        passwordResetTokens.splice(index, 1);
        return Promise.resolve(deleted);
      }),

      deleteMany: createMockFn((args: any) => {
        const initialLength = passwordResetTokens.length;
        passwordResetTokens = passwordResetTokens.filter(t => t.user_id !== args.where.user_id);
        return Promise.resolve({ count: initialLength - passwordResetTokens.length });
      }),
    },

    auth_attempts: {
      create: createMockFn((args: any) => {
        const newAttempt = {
          id: authAttempts.length + 1,
          ...args.data,
          attempted_at: new Date(),
        };
        authAttempts.push(newAttempt);
        return Promise.resolve(newAttempt);
      }),

      findMany: createMockFn((args?: any) => {
        let results = [...authAttempts];
        
        if (args?.where?.email) {
          results = results.filter(a => a.email === args.where.email);
        }
        if (args?.where?.attempted_at?.gte) {
          results = results.filter(a => a.attempted_at >= args.where.attempted_at.gte);
        }
        
        return Promise.resolve(results);
      }),
    },

    password_reset_attempts: {
      create: createMockFn((args: any) => {
        const newAttempt = {
          id: passwordResetAttempts.length + 1,
          ...args.data,
          attempted_at: new Date(),
        };
        passwordResetAttempts.push(newAttempt);
        return Promise.resolve(newAttempt);
      }),
    },

    // Méthode pour réinitialiser les données entre les tests
    _reset: () => {
      utilisateurs = JSON.parse(JSON.stringify(mockUtilisateurs));
      passwordResetTokens = [...mockPasswordResetTokens];
      authAttempts = [...mockAuthAttempts];
      passwordResetAttempts = [...mockPasswordResetAttempts];
    },
  };
};
