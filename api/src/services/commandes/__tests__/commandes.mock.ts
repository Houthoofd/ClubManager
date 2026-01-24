/**
 * Mock local pour les tests du service Commandes
 */

// Helper pour créer des fonctions mock sans dépendance à jest
const createMockFn = <T extends (...args: any[]) => any>(implementation: T) => {
  return implementation;
};

// Données mock - Utilisateurs (minimal pour les commandes)
const mockUtilisateurs = [
  {
    id: 1,
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean@test.com',
  },
  {
    id: 2,
    first_name: 'Marie',
    last_name: 'Martin',
    email: 'marie@test.com',
  },
];

// Données mock - Commandes
export const mockCommandes = [
  {
    commande_id: 'cmd-001',
    utilisateur_id: 1,
    statut: 'en_attente',
    total: 89.99,
    articles: JSON.stringify([
      { produit_id: 1, nom: 'Abonnement mensuel', quantite: 1, prix_unitaire: 49.99, total: 49.99 },
      { produit_id: 2, nom: 'Cours particulier', quantite: 2, prix_unitaire: 20, total: 40 },
    ]),
    date_commande: new Date('2026-01-15T10:30:00'),
    updated_at: new Date('2026-01-15T10:30:00'),
    payment_intent_id: 'pi_test_123',
    utilisateurs: mockUtilisateurs[0],
  },
  {
    commande_id: 'cmd-002',
    utilisateur_id: 2,
    statut: 'confirmee',
    total: 150,
    articles: JSON.stringify([
      { produit_id: 3, nom: 'Pack Premium', quantite: 1, prix_unitaire: 150, total: 150 },
    ]),
    date_commande: new Date('2026-01-10T14:00:00'),
    updated_at: new Date('2026-01-10T15:00:00'),
    payment_intent_id: 'pi_test_456',
    utilisateurs: mockUtilisateurs[1],
  },
  {
    commande_id: 'cmd-003',
    utilisateur_id: 1,
    statut: 'livree',
    total: 75.50,
    articles: JSON.stringify([
      { produit_id: 4, nom: 'Équipement', quantite: 1, prix_unitaire: 75.50, total: 75.50 },
    ]),
    date_commande: new Date('2026-01-05T09:15:00'),
    updated_at: new Date('2026-01-08T16:30:00'),
    payment_intent_id: 'pi_test_789',
    utilisateurs: mockUtilisateurs[0],
  },
  {
    commande_id: 'cmd-004',
    utilisateur_id: 2,
    statut: 'annulee',
    total: 30,
    articles: JSON.stringify([
      { produit_id: 5, nom: 'Cours essai', quantite: 1, prix_unitaire: 30, total: 30 },
    ]),
    date_commande: new Date('2026-01-20T11:00:00'),
    updated_at: new Date('2026-01-20T12:00:00'),
    payment_intent_id: null,
    utilisateurs: mockUtilisateurs[1],
  },
];

// Factory pour créer un mock Prisma
export const createMockPrisma = () => {
  // Copie des données pour permettre la réinitialisation
  let commandes = JSON.parse(JSON.stringify(mockCommandes));

  return {
    commandes: {
      findMany: createMockFn((args?: any) => {
        let results = [...commandes];
        
        if (args?.where?.utilisateur_id) {
          results = results.filter((c: any) => c.utilisateur_id === args.where.utilisateur_id);
        }
        if (args?.where?.statut) {
          results = results.filter((c: any) => c.statut === args.where.statut);
        }
        
        if (args?.orderBy?.date_commande) {
          results.sort((a: any, b: any) => {
            const dateA = new Date(a.date_commande).getTime();
            const dateB = new Date(b.date_commande).getTime();
            return args.orderBy.date_commande === 'desc' ? dateB - dateA : dateA - dateB;
          });
        }
        
        return Promise.resolve(results);
      }),

      findUnique: createMockFn((args: any) => {
        const commande = commandes.find((c: any) => c.commande_id === args.where.commande_id);
        return Promise.resolve(commande || null);
      }),

      create: createMockFn((args: any) => {
        const newCommande = {
          commande_id: `cmd-${Date.now()}`,
          ...args.data,
          date_commande: new Date(),
          updated_at: new Date(),
        };
        commandes.push(newCommande);
        return Promise.resolve(newCommande);
      }),

      update: createMockFn((args: any) => {
        const index = commandes.findIndex((c: any) => c.commande_id === args.where.commande_id);
        if (index === -1) return Promise.resolve(null);
        
        commandes[index] = { 
          ...commandes[index], 
          ...args.data,
          updated_at: new Date(),
        };
        return Promise.resolve(commandes[index]);
      }),

      delete: createMockFn((args: any) => {
        const index = commandes.findIndex((c: any) => c.commande_id === args.where.commande_id);
        if (index === -1) return Promise.resolve(null);
        
        const deleted = commandes[index];
        commandes.splice(index, 1);
        return Promise.resolve(deleted);
      }),

      groupBy: createMockFn((args: any) => {
        const grouped: any[] = [];
        const groupMap = new Map<string, any>();

        commandes.forEach((commande: any) => {
          const key = commande.statut;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              statut: commande.statut,
              _count: { _all: 0 },
              _sum: { total: 0 },
            });
          }
          const group = groupMap.get(key);
          group._count._all++;
          group._sum.total += commande.total;
        });

        return Promise.resolve(Array.from(groupMap.values()));
      }),

      count: createMockFn((args?: any) => {
        let results = [...commandes];
        
        if (args?.where?.statut) {
          results = results.filter((c: any) => c.statut === args.where.statut);
        }
        
        return Promise.resolve(results.length);
      }),
    },

    // Méthode pour réinitialiser les données entre les tests
    _reset: () => {
      commandes = JSON.parse(JSON.stringify(mockCommandes));
    },
  };
};
