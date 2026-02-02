/**
 * Mock Prisma pour les tests du service Statistiques
 */

// Helper pour créer des fonctions mock simples
const createMockFn = () => {
  const calls: any[] = [];
  const resolvedValues: any[] = [];
  let defaultValue: any = undefined;
  let isRejected = false;
  
  const fn: any = (...args: any[]) => {
    calls.push(args);
    
    if (resolvedValues.length > 0) {
      const value = resolvedValues.shift();
      return isRejected ? Promise.reject(value) : Promise.resolve(value);
    }
    
    if (fn._implementation) {
      return fn._implementation(...args);
    }
    
    return isRejected ? Promise.reject(defaultValue) : Promise.resolve(defaultValue);
  };
  
  fn._implementation = null;
  fn._calls = calls;
  fn._resolvedValues = resolvedValues;
  
  fn.mockResolvedValue = (value: any) => {
    defaultValue = value;
    isRejected = false;
    return fn;
  };
  
  fn.mockRejectedValue = (value: any) => {
    defaultValue = value;
    isRejected = true;
    return fn;
  };
  
  fn.mockResolvedValueOnce = (value: any) => {
    resolvedValues.push(value);
    isRejected = false;
    return fn;
  };
  
  fn.mockRejectedValueOnce = (value: any) => {
    resolvedValues.push(value);
    isRejected = true;
    return fn;
  };
  
  fn.mockImplementation = (impl: any) => {
    fn._implementation = impl;
    return fn;
  };
  
  return fn;
};

// Données de test
export const mockUtilisateurs = [
  { id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@test.com', status_id: 1, date_inscription: new Date('2024-01-01'), plan_tarifaire_id: 1 },
  { id: 2, first_name: 'Marie', last_name: 'Martin', email: 'marie@test.com', status_id: 1, date_inscription: new Date('2024-01-15'), plan_tarifaire_id: 2 }
];

export const mockCours = [
  { id: 1, type_cours: 'Karaté', date_cours: new Date('2024-06-15'), cours_recurrent_id: 1 },
  { id: 2, type_cours: 'Judo', date_cours: new Date('2024-06-16'), cours_recurrent_id: 2 }
];

export const mockInscriptions = [
  { id: 1, utilisateur_id: 1, cours_id: 1, status_id: 1, date_inscription: new Date('2024-06-01') },
  { id: 2, utilisateur_id: 2, cours_id: 1, status_id: 1, date_inscription: new Date('2024-06-02') },
  { id: 3, utilisateur_id: 1, cours_id: 2, status_id: 0, date_inscription: new Date('2024-06-03') }
];

export const mockPaiements = [
  { id: 1, utilisateur_id: 1, montant: 50, date_paiement: new Date('2024-06-01'), statut: 'validé', periode_fin: new Date('2025-01-01') },
  { id: 2, utilisateur_id: 2, montant: 75, date_paiement: new Date('2024-06-05'), statut: 'confirmé', periode_fin: new Date('2025-01-01') }
];

export const mockProfesseurs = [
  { id: 1, nom: 'Sensei', prenom: 'Maître', status_id: 5 }
];

export const mockPlansTarifaires = [
  { id: 1, nom_plan: 'Mensuel', prix: 50 },
  { id: 2, nom_plan: 'Annuel', prix: 500 }
];

export const mockCoursRecurrent = [
  { id: 1, nom: 'Karaté Kids', active: 1 },
  { id: 2, nom: 'Judo Adultes', active: 1 }
];

// Mock Prisma Client
export const createMockPrisma = () => {
  return {
    utilisateurs: {
      count: createMockFn().mockResolvedValue(mockUtilisateurs.length),
      findMany: createMockFn().mockResolvedValue(mockUtilisateurs.map(u => ({
        ...u,
        plans_tarifaires: mockPlansTarifaires.find(p => p.id === u.plan_tarifaire_id),
        inscriptions: mockInscriptions.filter(i => i.utilisateur_id === u.id)
      }))),
      findUnique: createMockFn().mockImplementation((args: any) => {
        return Promise.resolve(mockUtilisateurs.find(u => u.id === args.where.id));
      }),
      groupBy: createMockFn().mockResolvedValue([])
    },
    cours: {
      count: createMockFn().mockResolvedValue(mockCours.length),
      findMany: createMockFn().mockResolvedValue(mockCours.map(c => ({
        ...c,
        inscriptions: mockInscriptions.filter(i => i.cours_id === c.id)
      }))),
      findUnique: createMockFn().mockImplementation((args: any) => {
        return Promise.resolve(mockCours.find(c => c.id === args.where.id));
      })
    },
    inscriptions: {
      count: createMockFn().mockResolvedValue(mockInscriptions.length),
      findMany: createMockFn().mockResolvedValue(mockInscriptions.map(i => ({
        ...i,
        cours: mockCours.find(c => c.id === i.cours_id),
        utilisateurs: mockUtilisateurs.find(u => u.id === i.utilisateur_id)
      }))),
      findUnique: createMockFn().mockImplementation((args: any) => {
        return Promise.resolve(mockInscriptions.find(i => i.id === args.where.id));
      })
    },
    paiements: {
      count: createMockFn().mockResolvedValue(mockPaiements.length),
      findMany: createMockFn().mockResolvedValue(mockPaiements.map(p => ({
        ...p,
        utilisateurs: mockUtilisateurs.find(u => u.id === p.utilisateur_id)
      }))),
      findUnique: createMockFn().mockImplementation((args: any) => {
        return Promise.resolve(mockPaiements.find(p => p.id === args.where.id));
      })
    },
    professeurs: {
      count: createMockFn().mockResolvedValue(mockProfesseurs.length),
      findMany: createMockFn().mockResolvedValue(mockProfesseurs)
    },
    plans_tarifaires: {
      count: createMockFn().mockResolvedValue(mockPlansTarifaires.length),
      findMany: createMockFn().mockResolvedValue(mockPlansTarifaires)
    },
    cours_recurrent: {
      count: createMockFn().mockResolvedValue(mockCoursRecurrent.length),
      findMany: createMockFn().mockResolvedValue(mockCoursRecurrent)
    },
    echeances_paiements: {
      findMany: createMockFn().mockResolvedValue([])
    },
    commande_articles: {
      groupBy: createMockFn().mockResolvedValue([
        { article_id: 1, _sum: { quantite: 100 } },
        { article_id: 2, _sum: { quantite: 50 } }
      ])
    },
    articles: {
      findUnique: createMockFn().mockImplementation((args: any) => {
        const articles = [
          { id: 1, nom: 'Kimono' },
          { id: 2, nom: 'Ceinture' }
        ];
        return Promise.resolve(articles.find(a => a.id === args.where.id));
      })
    }
  };
};
