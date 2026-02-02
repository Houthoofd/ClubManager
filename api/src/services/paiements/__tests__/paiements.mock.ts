/**
 * Mock Prisma pour les tests du service Paiements
 */

// Helper pour créer des fonctions mock simples
const createMockFn = () => {
  const calls: any[] = [];
  const resolvedValues: any[] = [];
  let defaultValue: any = undefined;
  let isRejected = false;
  
  const fn: any = (...args: any[]) => {
    calls.push(args);
    
    // Si on a des valeurs pour mockResolvedValueOnce
    if (resolvedValues.length > 0) {
      const value = resolvedValues.shift();
      return isRejected ? Promise.reject(value) : Promise.resolve(value);
    }
    
    // Sinon utiliser la valeur par défaut
    if (fn._implementation) {
      return fn._implementation(...args);
    }
    
    return isRejected ? Promise.reject(defaultValue) : Promise.resolve(defaultValue);
  };
  
  fn._implementation = null;
  fn._calls = calls;
  
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
  
  fn.mockReset = () => { 
    fn._implementation = null;
    calls.length = 0;
    resolvedValues.length = 0;
    defaultValue = undefined;
    isRejected = false;
    return fn; 
  };
  
  // Pour les assertions Jest
  fn.mock = {
    get calls() { return calls; }
  };
  
  return fn;
};

export const createMockPrisma = () => {
  return {
    paiements: {
      findMany: createMockFn(),
      findFirst: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      updateMany: createMockFn(),
      delete: createMockFn(),
      deleteMany: createMockFn(),
      count: createMockFn(),
      aggregate: createMockFn()
    },
    echeances_paiements: {
      findMany: createMockFn(),
      findFirst: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      updateMany: createMockFn(),
      delete: createMockFn(),
      deleteMany: createMockFn(),
      count: createMockFn()
    },
    utilisateurs: {
      findUnique: createMockFn(),
      findMany: createMockFn()
    },
    commandes: {
      findUnique: createMockFn(),
      findMany: createMockFn()
    },
    plans_tarifaires: {
      findUnique: createMockFn(),
      findMany: createMockFn()
    }
  };
};

// Données de test
export const mockUtilisateur = {
  id: 1,
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com'
};

export const mockCommande = {
  id: 1,
  numero_commande: 'CMD-2026-001',
  montant_total: 150.00,
  statut: 'validé'
};

export const mockAbonnement = {
  id: 1,
  nom: 'Abonnement Premium',
  montant: 50.00,
  frequence: 'mensuel'
};

export const mockPaiement = {
  id: 1,
  commande_id: 1,
  utilisateur_id: 1,
  montant: 150.00,
  methode_paiement: 'stripe',
  stripe_payment_intent_id: 'pi_test_123',
  paypal_order_id: null,
  bitcoin_address: null,
  date_paiement: new Date('2026-01-15'),
  statut: 'en attente',
  description: 'Paiement commande CMD-2026-001',
  date_confirmation: null,
  date_modification: new Date('2026-01-15'),
  abonnement_id: null,
  periode_debut: null,
  periode_fin: null,
  utilisateurs: mockUtilisateur,
  commandes: mockCommande,
  plans_tarifaires: null
};

export const mockPaiementValide = {
  ...mockPaiement,
  id: 2,
  statut: 'validé',
  date_confirmation: new Date('2026-01-16')
};

export const mockPaiementAbonnement = {
  id: 3,
  commande_id: null,
  utilisateur_id: 1,
  montant: 50.00,
  methode_paiement: 'paypal',
  stripe_payment_intent_id: null,
  paypal_order_id: 'PAYPAL-123',
  bitcoin_address: null,
  date_paiement: new Date('2026-01-01'),
  statut: 'validé',
  description: 'Paiement abonnement mensuel',
  date_confirmation: new Date('2026-01-01'),
  date_modification: new Date('2026-01-01'),
  abonnement_id: 1,
  periode_debut: new Date('2026-01-01'),
  periode_fin: new Date('2026-01-31'),
  utilisateurs: mockUtilisateur,
  commandes: null,
  plans_tarifaires: mockAbonnement
};

export const mockEcheance = {
  id: 1,
  utilisateur_id: 1,
  abonnement_id: 1,
  date_echeance: new Date('2026-02-01'),
  montant: 50.00,
  statut: 'en attente',
  date_paiement: null,
  utilisateurs: mockUtilisateur,
  plans_tarifaires: mockAbonnement
};

export const mockEcheanceEchue = {
  ...mockEcheance,
  id: 2,
  date_echeance: new Date('2026-01-01'),
  statut: 'échu'
};

export const mockEcheancePayee = {
  ...mockEcheance,
  id: 3,
  statut: 'payé',
  date_paiement: new Date('2026-01-01')
};

// Helpers pour formater les données
export const formatPaiement = (p: any) => ({
  id: p.id,
  commande_id: p.commande_id,
  utilisateur_id: p.utilisateur_id,
  montant: Number(p.montant),
  methode_paiement: p.methode_paiement,
  stripe_payment_intent_id: p.stripe_payment_intent_id,
  paypal_order_id: p.paypal_order_id,
  bitcoin_address: p.bitcoin_address,
  date_paiement: p.date_paiement,
  statut: p.statut,
  description: p.description,
  date_confirmation: p.date_confirmation,
  date_modification: p.date_modification,
  abonnement_id: p.abonnement_id,
  periode_debut: p.periode_debut,
  periode_fin: p.periode_fin,
  utilisateur: p.utilisateurs ? {
    id: p.utilisateurs.id,
    nom: p.utilisateurs.nom,
    prenom: p.utilisateurs.prenom,
    email: p.utilisateurs.email
  } : undefined,
  commande: p.commandes ? {
    id: p.commandes.id,
    numero_commande: p.commandes.numero_commande,
    montant_total: Number(p.commandes.montant_total),
    statut: p.commandes.statut
  } : undefined,
  abonnement: p.plans_tarifaires ? {
    id: p.plans_tarifaires.id,
    nom: p.plans_tarifaires.nom,
    montant: Number(p.plans_tarifaires.montant),
    frequence: p.plans_tarifaires.frequence
  } : undefined
});

export const formatEcheance = (e: any) => ({
  id: e.id,
  utilisateur_id: e.utilisateur_id,
  abonnement_id: e.abonnement_id,
  date_echeance: e.date_echeance,
  montant: Number(e.montant),
  statut: e.statut,
  date_paiement: e.date_paiement,
  utilisateur: e.utilisateurs ? {
    id: e.utilisateurs.id,
    nom: e.utilisateurs.nom,
    prenom: e.utilisateurs.prenom,
    email: e.utilisateurs.email
  } : undefined,
  abonnement: e.plans_tarifaires ? {
    id: e.plans_tarifaires.id,
    nom: e.plans_tarifaires.nom,
    montant: Number(e.plans_tarifaires.montant),
    frequence: e.plans_tarifaires.frequence
  } : undefined
});
