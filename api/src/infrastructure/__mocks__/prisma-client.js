/**
 * Mock du Prisma Client pour les tests
 */

// Données de test - ALERTES
const mockAlertesTypes = [
  { id: 1, code: 'COMPTE_INCOMPLET', nom: 'Compte incomplet', description: 'Profil utilisateur incomplet', priorite: 'haute', actif: true },
  { id: 2, code: 'PAIEMENT_RETARD', nom: 'Paiement en retard', description: 'Paiement en retard', priorite: 'normale', actif: true },
  { id: 3, code: 'PAIEMENT_CRITIQUE', nom: 'Paiement critique', description: 'Paiement très en retard', priorite: 'critique', actif: true },
];

const mockAlertesUtilisateurs = [
  {
    id: 1,
    utilisateur_id: 1,
    alerte_type_id: 1,
    statut: 'active',
    donnees_contexte: { champsManquants: ['email'] },
    date_detection: new Date('2026-01-20'),
    date_resolution: null,
    notes: null,
    resolu_par: null,
    alertes_types: mockAlertesTypes[0],
    utilisateurs: {
      id: 1,
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean@test.com',
      status_id: 1,
    },
  },
  {
    id: 2,
    utilisateur_id: 2,
    alerte_type_id: 3,
    statut: 'active',
    donnees_contexte: { joursRetard: 45, montantTotal: '150.00' },
    date_detection: new Date('2026-01-15'),
    date_resolution: null,
    notes: null,
    resolu_par: null,
    alertes_types: mockAlertesTypes[2],
    utilisateurs: {
      id: 2,
      first_name: 'Marie',
      last_name: 'Martin',
      email: 'marie@test.com',
      status_id: 1,
    },
  },
];

// Données de test - AUTH
const mockUtilisateurs = [
  {
    id: 1,
    email: 'jean@test.com',
    password: '$2b$12$/CLuvALRTiMm.h0.k2dBM.vbyriSZ.4llhqtCvT7/OkL9RLW58Wce', // hash de "password123"
    first_name: 'Jean',
    last_name: 'Dupont',
    date_of_birth: new Date('1990-01-01'),
    genre_id: 1,
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
    date_of_birth: new Date('1985-05-15'),
    genre_id: 2,
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

const mockPasswordResetTokens = [
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

const mockAuthAttempts = [
  { id: 1, email: 'jean@test.com', success: true, attempted_at: new Date() },
  { id: 2, email: 'wrong@test.com', success: false, attempted_at: new Date() },
];

const mockPasswordResetAttempts = [
  { id: 1, email: 'jean@test.com', success: true, attempted_at: new Date() },
];

// Mock des méthodes Prisma
export class PrismaClient {
  constructor() {
    this.alertes_utilisateurs = {
      findMany: (args) => {
        let results = [...mockAlertesUtilisateurs];
        
        if (args?.where?.statut) {
          results = results.filter(a => a.statut === args.where.statut);
        }
        if (args?.where?.utilisateur_id) {
          results = results.filter(a => a.utilisateur_id === args.where.utilisateur_id);
        }
        
        return Promise.resolve(results);
      },
      
      findFirst: (args) => {
        const result = mockAlertesUtilisateurs.find(a => {
          if (args?.where?.id) return a.id === args.where.id;
          if (args?.where?.utilisateur_id && args?.where?.alerte_type_id) {
            return a.utilisateur_id === args.where.utilisateur_id && 
                   a.alerte_type_id === args.where.alerte_type_id;
          }
          return false;
        });
        return Promise.resolve(result || null);
      },
      
      create: (args) => {
        const newAlerte = {
          id: mockAlertesUtilisateurs.length + 1,
          ...args.data,
          date_detection: new Date(),
          date_resolution: null,
          notes: null,
          resolu_par: null,
        };
        
        if (args.include?.alertes_types) {
          newAlerte.alertes_types = mockAlertesTypes.find(t => t.id === args.data.alerte_type_id);
        }
        if (args.include?.utilisateurs) {
          newAlerte.utilisateurs = mockUtilisateurs.find(u => u.id === args.data.utilisateur_id);
        }
        
        return Promise.resolve(newAlerte);
      },
      
      update: (args) => {
        const alerte = mockAlertesUtilisateurs.find(a => a.id === args.where.id);
        return Promise.resolve({ ...alerte, ...args.data });
      },
      
      count: (args) => {
        let results = [...mockAlertesUtilisateurs];
        
        if (args?.where?.statut) {
          results = results.filter(a => a.statut === args.where.statut);
        }
        if (args?.where?.alertes_types?.priorite) {
          results = results.filter(a => a.alertes_types.priorite === args.where.alertes_types.priorite);
        }
        
        return Promise.resolve(results.length);
      },
      
      groupBy: () => {
        return Promise.resolve([
          { alerte_type_id: 1, statut: 'active', _count: 1 },
          { alerte_type_id: 3, statut: 'active', _count: 1 },
        ]);
      },
    };
    
    this.utilisateurs = {
      findMany: (args) => {
        let results = [...mockUtilisateurs];
        if (args?.where?.status_id) {
          results = results.filter(u => u.status_id === args.where.status_id);
        }
        return Promise.resolve(results);
      },
      
      findFirst: (args) => {
        let result = mockUtilisateurs.find(u => {
          if (args?.where?.email) return u.email === args.where.email;
          if (args?.where?.id) return u.id === args.where.id;
          if (args?.where?.email && args?.where?.status_id) {
            return u.email === args.where.email && u.status_id === args.where.status_id;
          }
          return false;
        });
        
        // Appliquer le select si présent
        if (result && args?.select) {
          const selected = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] === true) {
              selected[key] = result[key];
            }
          });
          result = selected;
        }
        
        return Promise.resolve(result || null);
      },
      
      findUnique: (args) => {
        let result = mockUtilisateurs.find(u => u.id === args.where.id);
        
        // Appliquer le select/include si présent
        if (result && args?.select) {
          const selected = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] === true || typeof args.select[key] === 'object') {
              selected[key] = result[key];
            }
          });
          result = selected;
        }
        
        return Promise.resolve(result || null);
      },
      
      create: (args) => {
        // Vérifier si l'email existe déjà
        const emailExists = mockUtilisateurs.some(u => u.email === args.data.email);
        if (emailExists) {
          const error = new Error('Unique constraint failed');
          error.code = 'P2002';
          return Promise.reject(error);
        }
        
        const newUser = {
          id: mockUtilisateurs.length + 1,
          ...args.data,
          paiements: [],
          inscriptions: [],
        };
        
        // Appliquer le select si présent
        if (args?.select) {
          const selected = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] === true) {
              selected[key] = newUser[key];
            }
          });
          return Promise.resolve(selected);
        }
        
        return Promise.resolve(newUser);
      },
      
      update: (args) => {
        const user = mockUtilisateurs.find(u => u.id === args.where.id);
        return Promise.resolve({ ...user, ...args.data });
      },
      
      updateMany: (args) => {
        let count = 0;
        if (args?.where?.id) {
          const user = mockUtilisateurs.find(u => u.id === args.where.id);
          if (user && user.status_id === args.where.status_id) count = 1;
        }
        return Promise.resolve({ count });
      },
      
      count: (args) => {
        let results = [...mockUtilisateurs];
        if (args?.where?.status_id) {
          results = results.filter(u => u.status_id === args.where.status_id);
        }
        if (args?.where?.email !== undefined) {
          // Filtrer par email, y compris les chaînes vides
          results = results.filter(u => u.email === args.where.email);
        }
        return Promise.resolve(results.length);
      },
    };
    
    this.password_reset_tokens = {
      findFirst: (args) => {
        let result = mockPasswordResetTokens.find(t => {
          if (args?.where?.token) {
            const tokenMatch = t.token === args.where.token;
            if (args.where.expires_at?.gt) {
              return tokenMatch && t.expires_at > args.where.expires_at.gt;
            }
            return tokenMatch;
          }
          return false;
        });
        
        if (result && args?.include?.utilisateurs) {
          result = { ...result, utilisateurs: mockUtilisateurs.find(u => u.id === result.user_id) };
        }
        
        return Promise.resolve(result || null);
      },
      
      create: (args) => {
        const newToken = {
          id: mockPasswordResetTokens.length + 1,
          ...args.data,
        };
        mockPasswordResetTokens.push(newToken);
        return Promise.resolve(newToken);
      },
      
      deleteMany: (args) => {
        let count = 0;
        if (args?.where?.user_id) {
          count = mockPasswordResetTokens.filter(t => t.user_id === args.where.user_id).length;
        } else if (args?.where?.token) {
          count = mockPasswordResetTokens.filter(t => t.token === args.where.token).length;
        } else if (args?.where?.expires_at?.lt) {
          count = mockPasswordResetTokens.filter(t => t.expires_at < args.where.expires_at.lt).length;
        }
        return Promise.resolve({ count });
      },
      
      count: (args) => {
        let results = [...mockPasswordResetTokens];
        if (args?.where?.expires_at?.gt) {
          results = results.filter(t => t.expires_at > args.where.expires_at.gt);
        }
        return Promise.resolve(results.length);
      },
    };
    
    this.auth_attempts = {
      create: (args) => {
        const newAttempt = {
          id: mockAuthAttempts.length + 1,
          ...args.data,
        };
        return Promise.resolve(newAttempt);
      },
      
      count: (args) => {
        let results = [...mockAuthAttempts];
        if (args?.where?.email) {
          results = results.filter(a => a.email === args.where.email);
        }
        if (args?.where?.attempted_at?.gte) {
          results = results.filter(a => a.attempted_at >= args.where.attempted_at.gte);
        }
        if (args?.where?.success !== undefined) {
          results = results.filter(a => a.success === args.where.success);
        }
        return Promise.resolve(results.length);
      },
    };
    
    this.password_reset_attempts = {
      create: (args) => {
        const newAttempt = {
          id: mockPasswordResetAttempts.length + 1,
          ...args.data,
        };
        return Promise.resolve(newAttempt);
      },
      
      count: (args) => {
        let results = [...mockPasswordResetAttempts];
        if (args?.where?.email) {
          results = results.filter(a => a.email === args.where.email);
        }
        if (args?.where?.attempted_at?.gte) {
          results = results.filter(a => a.attempted_at >= args.where.attempted_at.gte);
        }
        return Promise.resolve(results.length);
      },
    };
    
    this.manual_recovery_requests = {
      create: (args) => {
        return Promise.resolve({
          id: 1,
          ...args.data,
        });
      },
    };
    
    this.alertes_types = {
      findMany: (args) => {
        let results = [...mockAlertesTypes];
        if (args?.where?.actif !== undefined) {
          results = results.filter(t => t.actif === args.where.actif);
        }
        return Promise.resolve(results);
      },
    };
    
    this.alertes_actions = {
      create: (args) => {
        return Promise.resolve({
          id: 1,
          ...args.data,
          date_action: new Date(),
        });
      },
    };
    
    this.$transaction = async (cb) => {
      return cb({
        alertes_utilisateurs: this.alertes_utilisateurs,
        alertes_actions: this.alertes_actions,
        utilisateurs: this.utilisateurs,
        password_reset_tokens: this.password_reset_tokens,
      });
    };
  }
}

export const { PrismaClient: MockPrismaClient } = { PrismaClient };

