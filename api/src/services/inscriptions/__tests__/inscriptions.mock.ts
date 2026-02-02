/**
 * Mock local pour les tests du service Inscriptions
 */

import { jest } from "@jest/globals";

// Helper pour créer des fonctions mock sans dépendance à jest
const createMockFn = <T extends (...args: any[]) => any>(implementation: T) => {
  return implementation;
};

// Données mock - Utilisateurs (minimal)
const mockUtilisateurs = [
  { id: 1, first_name: "Jean", last_name: "Dupont", email: "jean@test.com" },
  { id: 2, first_name: "Marie", last_name: "Martin", email: "marie@test.com" },
  {
    id: 3,
    first_name: "Pierre",
    last_name: "Durand",
    email: "pierre@test.com",
  },
];

// Données mock - Cours (minimal)
const mockCours = [
  {
    id: 1,
    date_cours: new Date("2026-01-28T00:00:00"),
    type_cours: "Karaté Débutant",
    heure_debut: "18:00",
    heure_fin: "19:30",
  },
  {
    id: 2,
    date_cours: new Date("2026-01-30T00:00:00"),
    type_cours: "Judo Avancé",
    heure_debut: "19:00",
    heure_fin: "20:30",
  },
  {
    id: 3,
    date_cours: new Date("2026-01-29T00:00:00"),
    type_cours: "Taekwondo Enfants",
    heure_debut: "14:00",
    heure_fin: "15:00",
  },
  {
    id: 4,
    date_cours: new Date("2026-01-28T00:00:00"),
    type_cours: "Judo Débutant",
    heure_debut: "18:30",
    heure_fin: "20:00",
  },
];

// Données mock - Inscriptions
export const mockInscriptions = [
  {
    id: 1,
    utilisateur_id: 1,
    cours_id: 1,
    date_inscription: new Date("2026-01-15T10:00:00"),
    status_id: true,
    users: mockUtilisateurs[0],
    cours: mockCours[0],
  },
  {
    id: 2,
    utilisateur_id: 1,
    cours_id: 2,
    date_inscription: new Date("2026-01-16T11:00:00"),
    status_id: true,
    users: mockUtilisateurs[0],
    cours: mockCours[1],
  },
  {
    id: 3,
    utilisateur_id: 2,
    cours_id: 1,
    date_inscription: new Date("2026-01-17T09:00:00"),
    status_id: true,
    users: mockUtilisateurs[1],
    cours: mockCours[0],
  },
  {
    id: 4,
    utilisateur_id: 2,
    cours_id: 3,
    date_inscription: new Date("2026-01-18T14:00:00"),
    status_id: null,
    users: mockUtilisateurs[1],
    cours: mockCours[2],
  },
  {
    id: 5,
    utilisateur_id: 3,
    cours_id: 2,
    date_inscription: new Date("2026-01-19T15:30:00"),
    status_id: false,
    users: mockUtilisateurs[2],
    cours: mockCours[1],
  },
];

// Factory pour créer un mock Prisma
export const createMockPrisma = () => {
  // Copie des données pour permettre la réinitialisation
  let inscriptions = JSON.parse(JSON.stringify(mockInscriptions));
  let utilisateurs = [...mockUtilisateurs];
  let cours = [...mockCours];

  return {
    inscriptions: {
      findMany: createMockFn((args?: any) => {
        let results = [...inscriptions];

        if (args?.where?.utilisateur_id) {
          results = results.filter(
            (i: any) => i.utilisateur_id === args.where.utilisateur_id,
          );
        }
        if (args?.where?.cours_id) {
          results = results.filter(
            (i: any) => i.cours_id === args.where.cours_id,
          );
        }
        if (args?.where?.status_id !== undefined) {
          results = results.filter(
            (i: any) => i.status_id === args.where.status_id,
          );
        }
        if (args?.where?.date_inscription?.gte) {
          results = results.filter(
            (i: any) =>
              new Date(i.date_inscription) >= args.where.date_inscription.gte,
          );
        }
        if (args?.where?.date_inscription?.lte) {
          results = results.filter(
            (i: any) =>
              new Date(i.date_inscription) <= args.where.date_inscription.lte,
          );
        }

        if (args?.orderBy?.date_inscription) {
          results.sort((a: any, b: any) => {
            const dateA = new Date(a.date_inscription).getTime();
            const dateB = new Date(b.date_inscription).getTime();
            return args.orderBy.date_inscription === "desc"
              ? dateB - dateA
              : dateA - dateB;
          });
        }

        return Promise.resolve(results);
      }),

      findUnique: createMockFn((args: any) => {
        const inscription = inscriptions.find(
          (i: any) => i.id === args.where.id,
        );
        return Promise.resolve(inscription || null);
      }),

      findFirst: createMockFn((args: any) => {
        let results = [...inscriptions];

        if (args?.where?.utilisateur_id) {
          results = results.filter(
            (i: any) => i.utilisateur_id === args.where.utilisateur_id,
          );
        }
        if (args?.where?.cours_id) {
          results = results.filter(
            (i: any) => i.cours_id === args.where.cours_id,
          );
        }

        return Promise.resolve(results[0] || null);
      }),

      create: createMockFn((args: any) => {
        // Vérifier doublon
        const existant = inscriptions.find(
          (i: any) =>
            i.utilisateur_id === args.data.utilisateur_id &&
            i.cours_id === args.data.cours_id,
        );
        if (existant) {
          throw new Error("Cet utilisateur est déjà inscrit à ce cours");
        }

        const newInscription = {
          id: inscriptions.length + 1,
          ...args.data,
          date_inscription: new Date(),
          users: utilisateurs.find(
            (u: any) => u.id === args.data.utilisateur_id,
          ),
          cours: cours.find((c: any) => c.id === args.data.cours_id),
        };
        inscriptions.push(newInscription);
        return Promise.resolve(newInscription);
      }),

      update: createMockFn((args: any) => {
        const index = inscriptions.findIndex(
          (i: any) => i.id === args.where.id,
        );
        if (index === -1) return Promise.resolve(null);

        inscriptions[index] = { ...inscriptions[index], ...args.data };

        // Ajouter les relations si demandées
        const result = { ...inscriptions[index] };
        if (args.include?.users) {
          const user = mockUtilisateurs.find(
            (u: any) => u.id === result.utilisateur_id,
          );
          result.users = user;
        }
        if (args.include?.cours) {
          const cours = mockCours.find((c: any) => c.id === result.cours_id);
          result.cours = cours;
        }

        return Promise.resolve(result);
      }),

      delete: createMockFn((args: any) => {
        const index = inscriptions.findIndex(
          (i: any) => i.id === args.where.id,
        );
        if (index === -1) return Promise.resolve(null);

        const deleted = inscriptions[index];
        inscriptions.splice(index, 1);
        return Promise.resolve(deleted);
      }),

      count: createMockFn((args?: any) => {
        let results = [...inscriptions];

        if (args?.where?.cours_id) {
          results = results.filter(
            (i: any) => i.cours_id === args.where.cours_id,
          );
        }
        if (args?.where?.status_id !== undefined) {
          results = results.filter(
            (i: any) => i.status_id === args.where.status_id,
          );
        }
        if (args?.where?.date_inscription?.gte) {
          results = results.filter(
            (i: any) =>
              new Date(i.date_inscription) >= args.where.date_inscription.gte,
          );
        }
        if (args?.where?.date_inscription?.lte) {
          results = results.filter(
            (i: any) =>
              new Date(i.date_inscription) <= args.where.date_inscription.lte,
          );
        }

        return Promise.resolve(results.length);
      }),

      groupBy: createMockFn((args: any) => {
        const grouped: any[] = [];
        const groupMap = new Map<any, any>();

        inscriptions.forEach((inscription: any) => {
          const key = args.by
            .map((field: string) => inscription[field])
            .join("-");
          if (!groupMap.has(key)) {
            const groupData: any = {};
            args.by.forEach((field: string) => {
              groupData[field] = inscription[field];
            });
            groupData._count = { id: 0 };
            groupMap.set(key, groupData);
          }
          const group = groupMap.get(key);
          group._count.id++;
        });

        return Promise.resolve(Array.from(groupMap.values()));
      }),
    },

    cours: {
      findUnique: createMockFn((args: any) => {
        const c = cours.find((c: any) => c.id === args.where.id);
        return Promise.resolve(c || null);
      }),

      findMany: createMockFn((args?: any) => {
        let results = [...cours];

        if (args?.where?.id?.in) {
          results = results.filter((c: any) => args.where.id.in.includes(c.id));
        }

        return Promise.resolve(results);
      }),
    },

    utilisateurs: {
      findMany: createMockFn((args?: any) => {
        let results = [...utilisateurs];

        if (args?.where?.id?.in) {
          results = results.filter((u: any) => args.where.id.in.includes(u.id));
        }

        return Promise.resolve(results);
      }),
    },

    // Méthode pour réinitialiser les données entre les tests
    _reset: () => {
      inscriptions = JSON.parse(JSON.stringify(mockInscriptions));
      utilisateurs = [...mockUtilisateurs];
      cours = [...mockCours];
    },
  };
};
