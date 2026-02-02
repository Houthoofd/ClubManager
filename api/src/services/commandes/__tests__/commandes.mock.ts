/**
 * Mock local pour les tests du service Commandes
 */

import { jest } from "@jest/globals";

const createMockFn = <T extends (...args: any[]) => any>(implementation: T) => {
  return implementation;
};

export const mockCommandes = [
  {
    commande_id: "cmd-001",
    utilisateur_id: 1,
    statut: "en_attente",
    total: 150.0,
    articles: JSON.stringify([
      { id: 1, nom: "Article 1", prix: 75, quantite: 2 },
    ]),
    date_commande: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    payment_intent_id: "pi_001",
    utilisateurs: {
      id: 1,
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean@test.com",
    },
  },
  {
    commande_id: "cmd-002",
    utilisateur_id: 2,
    statut: "payee",
    total: 200.0,
    articles: JSON.stringify([
      { id: 2, nom: "Article 2", prix: 100, quantite: 2 },
    ]),
    date_commande: new Date("2026-01-02"),
    updated_at: new Date("2026-01-02"),
    payment_intent_id: "pi_002",
    utilisateurs: {
      id: 2,
      first_name: "Marie",
      last_name: "Martin",
      email: "marie@test.com",
    },
  },
];

export const createMockPrisma = () => {
  let commandes = [...mockCommandes];

  return {
    commandes: {
      findMany: createMockFn(async (args?: any) => {
        let results = [...commandes];

        if (args?.where?.utilisateur_id) {
          results = results.filter(
            (c) => c.utilisateur_id === args.where.utilisateur_id,
          );
        }
        if (args?.where?.statut) {
          results = results.filter((c) => c.statut === args.where.statut);
        }

        // Gestion pagination
        if (args?.skip !== undefined) {
          results = results.slice(args.skip);
        }
        if (args?.take !== undefined) {
          results = results.slice(0, args.take);
        }

        return results;
      }),

      findUnique: createMockFn(async (args: any) => {
        const commande = commandes.find(
          (c) => c.commande_id === args.where.commande_id,
        );
        return commande || null;
      }),

      create: createMockFn(async (args: any) => {
        const newCommande = {
          commande_id: `cmd-${Date.now()}`,
          ...args.data,
          articles:
            typeof args.data.articles === "string"
              ? args.data.articles
              : JSON.stringify(args.data.articles),
          date_commande: args.data.date_commande || new Date(),
          updated_at: new Date(),
          utilisateurs: mockCommandes[0].utilisateurs,
        };
        commandes.push(newCommande);
        return newCommande;
      }),

      update: createMockFn(async (args: any) => {
        const index = commandes.findIndex(
          (c) => c.commande_id === args.where.commande_id,
        );
        if (index === -1) return null;

        commandes[index] = {
          ...commandes[index],
          ...args.data,
          updated_at: new Date(),
        };
        return commandes[index];
      }),

      delete: createMockFn(async (args: any) => {
        const index = commandes.findIndex(
          (c) => c.commande_id === args.where.commande_id,
        );
        if (index === -1) {
          const error: any = new Error("Record not found");
          error.code = "P2025";
          throw error;
        }

        const deleted = commandes[index];
        commandes.splice(index, 1);
        return deleted;
      }),

      groupBy: createMockFn(async (args: any) => {
        const grouped: any[] = [];
        const groupMap = new Map<string, any>();

        commandes.forEach((commande) => {
          const key = commande.statut;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              statut: commande.statut,
              _count: { _all: 0 },
            });
          }
          const group = groupMap.get(key);
          group._count._all++;
        });

        return Array.from(groupMap.values());
      }),

      count: createMockFn(async (args?: any) => {
        let results = [...commandes];

        if (args?.where?.statut) {
          results = results.filter((c) => c.statut === args.where.statut);
        }

        return results.length;
      }),

      aggregate: createMockFn(async (args: any) => {
        let results = [...commandes];

        // Appliquer filtres where si présents
        if (args?.where) {
          if (args.where.utilisateur_id) {
            results = results.filter(
              (c) => c.utilisateur_id === args.where.utilisateur_id,
            );
          }
          if (args.where.statut) {
            results = results.filter((c) => c.statut === args.where.statut);
          }
        }

        const sum = results.reduce((acc, c) => acc + Number(c.total), 0);

        return {
          _sum: {
            total: sum,
          },
          _count: {
            _all: results.length,
          },
        };
      }),
    },

    _reset: () => {
      commandes = JSON.parse(JSON.stringify(mockCommandes));
    },
  };
};
