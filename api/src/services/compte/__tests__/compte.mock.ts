/**
 * Mock local pour les tests du service Compte
 */

// Helper pour créer des fonctions mock sans dépendance à jest
const createMockFn = <T extends (...args: any[]) => any>(implementation: T) => {
  return implementation;
};

// Données mock - Genres
export const mockGenres = [
  { id: 1, genre_name: 'Homme' },
  { id: 2, genre_name: 'Femme' },
  { id: 3, genre_name: 'Autre' },
];

// Données mock - Grades
export const mockGrades = [
  { id: 1, grade_id: 'BLANC', nom_grade: 'Ceinture Blanche' },
  { id: 2, grade_id: 'JAUNE', nom_grade: 'Ceinture Jaune' },
  { id: 3, grade_id: 'ORANGE', nom_grade: 'Ceinture Orange' },
  { id: 4, grade_id: 'VERTE', nom_grade: 'Ceinture Verte' },
];

// Données mock - Status
export const mockStatus = [
  { id: 0, nom_role: 'Inactif' },
  { id: 1, nom_role: 'Actif' },
  { id: 2, nom_role: 'Admin' },
  { id: 3, nom_role: 'Professeur' },
];

// Données mock - Plans tarifaires
export const mockPlansTarifaires = [
  { id: 1, nom_plan: 'Mensuel', prix: 49.99 },
  { id: 2, nom_plan: 'Trimestriel', prix: 135 },
  { id: 3, nom_plan: 'Annuel', prix: 480 },
];

// Données mock - Utilisateurs
export const mockUtilisateurs = [
  {
    id: 1,
    email: 'jean@test.com',
    password: '',
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
    genres: mockGenres[0],
    grades: mockGrades[1],
    status: mockStatus[1],
    plans_tarifaires: null,
  },
  {
    id: 2,
    email: 'marie@test.com',
    password: '',
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
    genres: mockGenres[1],
    grades: mockGrades[2],
    status: mockStatus[1],
    plans_tarifaires: mockPlansTarifaires[0],
  },
];

// Factory pour créer un mock Prisma
export const createMockPrisma = () => {
  // Copie des données pour permettre la réinitialisation
  let utilisateurs = JSON.parse(JSON.stringify(mockUtilisateurs));
  let genres = [...mockGenres];
  let grades = [...mockGrades];
  let status = [...mockStatus];
  let plansTarifaires = [...mockPlansTarifaires];

  return {
    utilisateurs: {
      findUnique: createMockFn((args: any) => {
        const user = utilisateurs.find((u: any) => u.id === args.where.id);
        if (!user) return Promise.resolve(null);
        
        // Construire l'objet avec les relations si demandées
        const result = { ...user };
        if (args.include?.genres) result.genres = genres.find((g: any) => g.id === user.genre_id);
        if (args.include?.grades) result.grades = grades.find((g: any) => g.id === user.grade_id);
        if (args.include?.status) result.status = status.find((s: any) => s.id === user.status_id);
        if (args.include?.plans_tarifaires) {
          result.plans_tarifaires = user.abonnement_id 
            ? plansTarifaires.find((p: any) => p.id === user.abonnement_id)
            : null;
        }
        
        return Promise.resolve(result);
      }),

      findMany: createMockFn((args?: any) => {
        let results = [...utilisateurs];
        
        if (args?.where?.first_name) {
          results = results.filter((u: any) => u.first_name === args.where.first_name);
        }
        if (args?.where?.last_name) {
          results = results.filter((u: any) => u.last_name === args.where.last_name);
        }
        if (args?.where?.email) {
          results = results.filter((u: any) => u.email === args.where.email);
        }
        
        // Ajouter les relations si demandées
        if (args?.include) {
          results = results.map((u: any) => {
            const result = { ...u };
            if (args.include.genres) result.genres = genres.find((g: any) => g.id === u.genre_id);
            if (args.include.grades) result.grades = grades.find((g: any) => g.id === u.grade_id);
            if (args.include.status) result.status = status.find((s: any) => s.id === u.status_id);
            if (args.include.plans_tarifaires) {
              result.plans_tarifaires = u.abonnement_id 
                ? plansTarifaires.find((p: any) => p.id === u.abonnement_id)
                : null;
            }
            return result;
          });
        }
        
        return Promise.resolve(results);
      }),

      findFirst: createMockFn((args: any) => {
        let results = [...utilisateurs];
        
        if (args?.where?.id) {
          results = results.filter((u: any) => u.id === args.where.id);
        }
        if (args?.where?.email) {
          results = results.filter((u: any) => u.email === args.where.email);
        }
        
        const user = results[0];
        if (!user) return Promise.resolve(null);
        
        // Ajouter les relations si demandées
        if (args?.include) {
          const result = { ...user };
          if (args.include.genres) result.genres = genres.find((g: any) => g.id === user.genre_id);
          if (args.include.grades) result.grades = grades.find((g: any) => g.id === user.grade_id);
          if (args.include.status) result.status = status.find((s: any) => s.id === user.status_id);
          return Promise.resolve(result);
        }
        
        return Promise.resolve(user);
      }),

      update: createMockFn((args: any) => {
        const index = utilisateurs.findIndex((u: any) => u.id === args.where.id);
        if (index === -1) return Promise.resolve(null);
        
        utilisateurs[index] = { ...utilisateurs[index], ...args.data };
        return Promise.resolve(utilisateurs[index]);
      }),
    },

    genres: {
      findMany: createMockFn(() => Promise.resolve([...genres])),
      findUnique: createMockFn((args: any) => {
        const genre = genres.find(g => g.id === args.where.id);
        return Promise.resolve(genre || null);
      }),
    },

    grades: {
      findMany: createMockFn(() => Promise.resolve([...grades])),
      findUnique: createMockFn((args: any) => {
        const grade = grades.find(g => g.id === args.where.id);
        return Promise.resolve(grade || null);
      }),
    },

    status: {
      findMany: createMockFn(() => Promise.resolve([...status])),
      findUnique: createMockFn((args: any) => {
        const s = status.find(s => s.id === args.where.id);
        return Promise.resolve(s || null);
      }),
    },

    plans_tarifaires: {
      findMany: createMockFn(() => Promise.resolve([...plansTarifaires])),
    },

    // Méthode pour réinitialiser les données entre les tests
    _reset: () => {
      utilisateurs = JSON.parse(JSON.stringify(mockUtilisateurs));
      genres = [...mockGenres];
      grades = [...mockGrades];
      status = [...mockStatus];
      plansTarifaires = [...mockPlansTarifaires];
    },
  };
};
