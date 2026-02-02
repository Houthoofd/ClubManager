/**
 * Mock des données pour les tests du service Informations
 */

export const mockInformations = [
  {
    id: 1,
    titre: 'Fermeture exceptionnelle',
    contenu: 'Le club sera fermé le 25 janvier pour travaux',
    date_creation: new Date('2026-01-15T10:00:00'),
    status_id: 1,
  },
  {
    id: 2,
    titre: 'Nouveau cours disponible',
    contenu: 'Inscription ouverte pour le cours de self-défense',
    date_creation: new Date('2026-01-20T14:30:00'),
    status_id: 1,
  },
  {
    id: 3,
    titre: 'Championnat régional',
    contenu: 'Le championnat aura lieu le 15 février',
    date_creation: new Date('2026-01-22T09:00:00'),
    status_id: 1,
  },
];

export const mockStatus = [
  { id: 0, nom: 'Inactif' },
  { id: 1, nom: 'Actif' },
  { id: 2, nom: 'Admin' },
  { id: 3, nom: 'Professeur' },
  { id: 4, nom: 'Élève' },
  { id: 5, nom: 'Employé' },
];

export const mockPlansTarifaires = [
  { id: 1, nom: 'Mensuel' },
  { id: 2, nom: 'Trimestriel' },
  { id: 3, nom: 'Semestriel' },
  { id: 4, nom: 'Annuel' },
];

export const mockGenres = [
  { id: 1, nom: 'Homme' },
  { id: 2, nom: 'Femme' },
  { id: 3, nom: 'Autre' },
];

export const mockGrades = [
  { id: 1, nom: 'Ceinture Blanche' },
  { id: 2, nom: 'Ceinture Jaune' },
  { id: 3, nom: 'Ceinture Orange' },
  { id: 4, nom: 'Ceinture Verte' },
  { id: 5, nom: 'Ceinture Bleue' },
  { id: 6, nom: 'Ceinture Marron' },
  { id: 7, nom: 'Ceinture Noire' },
];

/**
 * Mock Prisma pour les tests d'intégration
 */
export const createMockPrisma = () => {
  let informations = [...mockInformations];
  let status = [...mockStatus];
  let plansTarifaires = [...mockPlansTarifaires];
  let genres = [...mockGenres];
  let grades = [...mockGrades];

  const createMockFn = (impl: any) => {
    const fn: any = (...args: any[]) => impl(...args);
    fn.mockClear = () => {};
    return fn;
  };

  return {
    informations: {
      findMany: createMockFn((args: any) => {
        let results = [...informations];
        
        if (args?.where) {
          if (args.where.status_id !== undefined) {
            results = results.filter(i => i.status_id === args.where.status_id);
          }
        }
        
        if (args?.orderBy) {
          if (args.orderBy.date_creation === 'desc') {
            results.sort((a, b) => b.date_creation.getTime() - a.date_creation.getTime());
          } else if (args.orderBy.date_creation === 'asc') {
            results.sort((a, b) => a.date_creation.getTime() - b.date_creation.getTime());
          }
        }
        
        return Promise.resolve(results);
      }),

      findFirst: createMockFn((args: any) => {
        let result = informations.find(i => {
          if (args.where.id !== undefined && i.id !== args.where.id) return false;
          if (args.where.status_id !== undefined && i.status_id !== args.where.status_id) return false;
          return true;
        });
        return Promise.resolve(result || null);
      }),

      findUnique: createMockFn((args: any) => {
        const result = informations.find(i => i.id === args.where.id);
        return Promise.resolve(result || null);
      }),

      create: createMockFn((args: any) => {
        const newInfo = {
          id: Math.max(...informations.map(i => i.id), 0) + 1,
          ...args.data,
          date_creation: args.data.date_creation || new Date(),
        };
        informations.push(newInfo);
        return Promise.resolve(newInfo);
      }),

      update: createMockFn((args: any) => {
        const index = informations.findIndex(i => i.id === args.where.id);
        if (index === -1) {
          return Promise.reject(new Error('Information not found'));
        }
        informations[index] = { ...informations[index], ...args.data };
        return Promise.resolve(informations[index]);
      }),

      delete: createMockFn((args: any) => {
        const index = informations.findIndex(i => i.id === args.where.id);
        if (index === -1) {
          return Promise.reject(new Error('Information not found'));
        }
        const deleted = informations[index];
        informations.splice(index, 1);
        return Promise.resolve(deleted);
      }),
    },

    status: {
      findMany: createMockFn(() => Promise.resolve([...status])),
      findFirst: createMockFn((args: any) => {
        const result = status.find(s => s.id === args?.where?.id);
        return Promise.resolve(result || null);
      }),
    },

    plans_tarifaires: {
      findMany: createMockFn(() => Promise.resolve([...plansTarifaires])),
      findFirst: createMockFn((args: any) => {
        const result = plansTarifaires.find(p => p.id === args?.where?.id);
        return Promise.resolve(result || null);
      }),
    },

    genres: {
      findMany: createMockFn(() => Promise.resolve([...genres])),
      findFirst: createMockFn((args: any) => {
        const result = genres.find(g => g.id === args?.where?.id);
        return Promise.resolve(result || null);
      }),
    },

    grades: {
      findMany: createMockFn(() => Promise.resolve([...grades])),
      findFirst: createMockFn((args: any) => {
        const result = grades.find(g => g.id === args?.where?.id);
        return Promise.resolve(result || null);
      }),
    },

    // Helper pour réinitialiser les données entre les tests
    _reset: () => {
      informations = [...mockInformations];
      status = [...mockStatus];
      plansTarifaires = [...mockPlansTarifaires];
      genres = [...mockGenres];
      grades = [...mockGrades];
    },
  };
};
