/**
 * Mock local pour les tests du service Alertes
 */

// Helper pour créer des fonctions mock sans dépendance à jest
const createMockFn = <T extends (...args: any[]) => any>(implementation: T) => {
  return implementation;
};

// Données mock - Types d'alertes
export const mockAlertesTypes = [
  { id: 1, code: 'COMPTE_INCOMPLET', nom: 'Compte incomplet', description: 'Profil utilisateur incomplet', priorite: 'haute', actif: true },
  { id: 2, code: 'PAIEMENT_RETARD', nom: 'Paiement en retard', description: 'Paiement en retard', priorite: 'normale', actif: true },
  { id: 3, code: 'PAIEMENT_CRITIQUE', nom: 'Paiement critique', description: 'Paiement très en retard', priorite: 'critique', actif: true },
];

// Données mock - Alertes utilisateurs
export const mockAlertesUtilisateurs = [
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

// Factory pour créer un mock Prisma
export const createMockPrisma = () => {
  // Copie des données pour permettre la réinitialisation
  let alertesUtilisateurs = [...mockAlertesUtilisateurs];
  let alertesTypes = [...mockAlertesTypes];

  return {
    alertes_utilisateurs: {
      findMany: createMockFn((args?: any) => {
        let results = [...alertesUtilisateurs];
        
        if (args?.where?.statut) {
          results = results.filter(a => a.statut === args.where.statut);
        }
        if (args?.where?.utilisateur_id) {
          results = results.filter(a => a.utilisateur_id === args.where.utilisateur_id);
        }
        
        return Promise.resolve(results);
      }),

      findUnique: createMockFn((args: any) => {
        const alerte = alertesUtilisateurs.find(a => a.id === args.where.id);
        return Promise.resolve(alerte || null);
      }),

      findFirst: createMockFn((args: any) => {
        let result = alertesUtilisateurs.find(a => {
          if (args.where.utilisateur_id && a.utilisateur_id !== args.where.utilisateur_id) return false;
          if (args.where.alerte_type_id && a.alerte_type_id !== args.where.alerte_type_id) return false;
          if (args.where.statut && a.statut !== args.where.statut) return false;
          return true;
        });
        return Promise.resolve(result || null);
      }),

      create: createMockFn((args: any) => {
        const typeAlerte = alertesTypes.find(t => t.id === args.data.alerte_type_id);
        const user = mockAlertesUtilisateurs[0]?.utilisateurs || {
          id: args.data.utilisateur_id,
          first_name: 'Test',
          last_name: 'User',
          email: 'test@test.com',
          status_id: 1,
        };
        
        const newAlerte = {
          id: alertesUtilisateurs.length + 1,
          ...args.data,
          date_detection: new Date(),
          date_resolution: null,
          alertes_types: typeAlerte || mockAlertesTypes[0], // Inclure la relation
          utilisateurs: user, // Inclure la relation utilisateur
        };
        alertesUtilisateurs.push(newAlerte);
        return Promise.resolve(newAlerte);
      }),

      update: createMockFn((args: any) => {
        const index = alertesUtilisateurs.findIndex(a => a.id === args.where.id);
        if (index === -1) {
          // Simuler une erreur Prisma pour enregistrement non trouvé
          const error: any = new Error('Record to update not found.');
          error.code = 'P2025';
          return Promise.reject(error);
        }
        
        alertesUtilisateurs[index] = { ...alertesUtilisateurs[index], ...args.data };
        return Promise.resolve(alertesUtilisateurs[index]);
      }),

      groupBy: createMockFn((args: any) => {
        const grouped: any[] = [];
        const groupMap = new Map<string, any>();

        alertesUtilisateurs.forEach(alerte => {
          const key = `${alerte.alerte_type_id}-${alerte.statut}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              alerte_type_id: alerte.alerte_type_id,
              statut: alerte.statut,
              _count: { _all: 0 },
            });
          }
          const group = groupMap.get(key);
          group._count._all++;
        });

        return Promise.resolve(Array.from(groupMap.values()));
      }),

      count: createMockFn((args?: any) => {
        let results = [...alertesUtilisateurs];
        
        if (args?.where?.statut) {
          results = results.filter(a => a.statut === args.where.statut);
        }
        
        return Promise.resolve(results.length);
      }),
    },

    alertes_types: {
      findMany: createMockFn(() => Promise.resolve([...alertesTypes])),
      findUnique: createMockFn((args: any) => {
        const type = alertesTypes.find(t => t.id === args.where.id);
        return Promise.resolve(type || null);
      }),
    },

    utilisateurs: {
      findMany: createMockFn((args?: any) => {
        const users = [
          { 
            id: 1, 
            first_name: 'Jean', 
            last_name: 'Dupont', 
            email: 'jean@test.com', 
            status_id: 1,
            echeances_paiements: [], // Pas de paiements en retard
            abonnements: [{ id: 1, actif: true }], // A un abonnement
          },
          { 
            id: 2, 
            first_name: 'Marie', 
            last_name: 'Martin', 
            email: 'marie@test.com', 
            status_id: 1,
            echeances_paiements: [], // Pas de paiements en retard
            abonnements: [], // Pas d'abonnement
          },
        ];
        
        let results = [...users];
        if (args?.where?.status_id?.in) {
          results = results.filter(u => args.where.status_id.in.includes(u.status_id));
        }
        
        return Promise.resolve(results);
      }),
    },

    // Mock de la transaction Prisma
    $transaction: createMockFn(async (callback: any) => {
      // Créer un objet transaction qui utilise les mêmes mocks
      const tx = {
        alertes_utilisateurs: {
          update: createMockFn(async (args: any) => {
            const index = alertesUtilisateurs.findIndex(a => a.id === args.where.id);
            if (index === -1) return null;
            
            alertesUtilisateurs[index] = { ...alertesUtilisateurs[index], ...args.data };
            return alertesUtilisateurs[index];
          }),
        },
        alertes_resolutions: {
          create: createMockFn(async (args: any) => {
            return {
              id: 1,
              ...args.data,
              date_resolution: new Date(),
            };
          }),
        },
        alertes_actions: {
          create: createMockFn(async (args: any) => {
            return {
              id: 1,
              ...args.data,
              date_action: new Date(),
            };
          }),
        },
      };
      
      return callback(tx);
    }),

    // Méthode pour réinitialiser les données entre les tests
    _reset: () => {
      alertesUtilisateurs = [...mockAlertesUtilisateurs];
      alertesTypes = [...mockAlertesTypes];
    },
  };
};
