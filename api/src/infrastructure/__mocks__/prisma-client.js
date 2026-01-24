/**
 * Mock du Prisma Client pour les tests
 */

// Données de test
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

const mockUtilisateurs = [
  {
    id: 1,
    email: 'jean@test.com',
    first_name: 'Jean',
    last_name: 'Dupont',
    date_of_birth: new Date('1990-01-01'),
    genre_id: 1,
    abonnement_id: null,
    status_id: 1,
    echeances_paiements: [],
  },
  {
    id: 2,
    email: 'marie@test.com',
    first_name: 'Marie',
    last_name: 'Martin',
    date_of_birth: new Date('1985-05-15'),
    genre_id: 2,
    abonnement_id: 1,
    status_id: 1,
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
    
    this.alertes_types = {
      findMany: (args) => {
        let results = [...mockAlertesTypes];
        if (args?.where?.actif !== undefined) {
          results = results.filter(t => t.actif === args.where.actif);
        }
        return Promise.resolve(results);
      },
    };
    
    this.utilisateurs = {
      findMany: () => Promise.resolve(mockUtilisateurs),
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
      });
    };
  }
}

export const { PrismaClient: MockPrismaClient } = { PrismaClient };

