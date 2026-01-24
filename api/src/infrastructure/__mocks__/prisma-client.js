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
    nom_utilisateur: 'jdupont',
    phone: '0612345678',
    date_of_birth: new Date('1990-01-01'),
    genre_id: 1,
    grade_id: 2,
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
    nom_utilisateur: 'mmartin',
    phone: '0698765432',
    date_of_birth: new Date('1985-05-15'),
    genre_id: 2,
    grade_id: 3,
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

// Données de test - COMPTE (genres, grades, status, plans)
const mockGenres = [
  { id: 1, genre_name: 'Homme' },
  { id: 2, genre_name: 'Femme' },
  { id: 3, genre_name: 'Autre' },
];

const mockGrades = [
  { id: 1, grade_id: 'BLANC', nom_grade: 'Ceinture Blanche' },
  { id: 2, grade_id: 'JAUNE', nom_grade: 'Ceinture Jaune' },
  { id: 3, grade_id: 'ORANGE', nom_grade: 'Ceinture Orange' },
  { id: 4, grade_id: 'VERTE', nom_grade: 'Ceinture Verte' },
];

const mockStatus = [
  { id: 0, nom_role: 'Inactif' },
  { id: 1, nom_role: 'Actif' },
  { id: 2, nom_role: 'Admin' },
  { id: 3, nom_role: 'Professeur' },
];

const mockPlansTarifaires = [
  { id: 1, nom_plan: 'Mensuel', prix: 49.99 },
  { id: 2, nom_plan: 'Trimestriel', prix: 135 },
  { id: 3, nom_plan: 'Annuel', prix: 480 },
];

// Données de test - COMMANDES
const mockCommandes = [
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

// Données de test - COURS
const mockProfesseurs = [
  {
    id: 1,
    nom: 'Sensei',
    prenom: 'Karate',
    email: 'karate.sensei@test.com',
    phone: '0611111111',
    date_embauche: new Date('2020-01-01'),
    specialite: 'Karaté',
    status_id: 5,
  },
  {
    id: 2,
    nom: 'Master',
    prenom: 'Judo',
    email: 'judo.master@test.com',
    phone: '0622222222',
    date_embauche: new Date('2019-06-15'),
    specialite: 'Judo',
    status_id: 5,
  },
  {
    id: 3,
    nom: 'Coach',
    prenom: 'Taekwondo',
    email: 'taekwondo.coach@test.com',
    phone: '0633333333',
    date_embauche: new Date('2021-03-10'),
    specialite: 'Taekwondo',
    status_id: 5,
  },
];

const mockCoursRecurrent = [
  {
    id: 1,
    type_cours: 'Karaté Débutant',
    jour_semaine: 2, // Mardi
    heure_debut: '18:00',
    heure_fin: '19:30',
  },
  {
    id: 2,
    type_cours: 'Judo Avancé',
    jour_semaine: 4, // Jeudi
    heure_debut: '19:00',
    heure_fin: '20:30',
  },
  {
    id: 3,
    type_cours: 'Taekwondo Enfants',
    jour_semaine: 3, // Mercredi
    heure_debut: '14:00',
    heure_fin: '15:00',
  },
];

const mockCoursRecurrentProfesseur = [
  { id: 1, cours_recurrent_id: 1, professeur_id: 1 },
  { id: 2, cours_recurrent_id: 2, professeur_id: 2 },
  { id: 3, cours_recurrent_id: 3, professeur_id: 3 },
];

const mockCours = [
  {
    id: 1,
    date_cours: new Date('2026-01-28'), // Mardi prochain
    type_cours: 'Karaté Débutant',
    heure_debut: '18:00',
    heure_fin: '19:30',
    cours_recurrent_id: 1,
  },
  {
    id: 2,
    date_cours: new Date('2026-01-30'), // Jeudi prochain
    type_cours: 'Judo Avancé',
    heure_debut: '19:00',
    heure_fin: '20:30',
    cours_recurrent_id: 2,
  },
  {
    id: 3,
    date_cours: new Date('2026-01-29'), // Mercredi prochain
    type_cours: 'Taekwondo Enfants',
    heure_debut: '14:00',
    heure_fin: '15:00',
    cours_recurrent_id: 3,
  },
  {
    id: 4,
    date_cours: new Date('2026-02-04'), // Mardi suivant
    type_cours: 'Karaté Débutant',
    heure_debut: '18:00',
    heure_fin: '19:30',
    cours_recurrent_id: 1,
  },
];

const mockInscriptions = [
  {
    id: 1,
    cours_id: 1,
    utilisateur_id: 1,
    is_present: null,
    is_validate: null,
  },
  {
    id: 2,
    cours_id: 1,
    utilisateur_id: 2,
    is_present: true,
    is_validate: true,
  },
  {
    id: 3,
    cours_id: 2,
    utilisateur_id: 2,
    is_present: false,
    is_validate: false,
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
    
    this.utilisateurs = {
      findMany: (args) => {
        let results = [...mockUtilisateurs];
        
        // Filtres
        if (args?.where?.status_id !== undefined) {
          results = results.filter(u => u.status_id === args.where.status_id);
        }
        if (args?.where?.first_name) {
          results = results.filter(u => u.first_name === args.where.first_name);
        }
        if (args?.where?.last_name) {
          results = results.filter(u => u.last_name === args.where.last_name);
        }
        
        // Inclure les relations
        if (args?.include) {
          results = results.map(u => {
            const enriched = { ...u };
            if (args.include.genres) enriched.genres = mockGenres.find(g => g.id === u.genre_id) || null;
            if (args.include.grades) enriched.grades = mockGrades.find(g => g.id === u.grade_id) || null;
            if (args.include.status) enriched.status = mockStatus.find(s => s.id === u.status_id) || null;
            if (args.include.plans_tarifaires) enriched.plans_tarifaires = mockPlansTarifaires.find(p => p.id === u.abonnement_id) || null;
            return enriched;
          });
        }
        
        return Promise.resolve(results);
      },
      
      findFirst: (args) => {
        let result = mockUtilisateurs.find(u => {
          let match = true;
          if (args?.where?.email) match = match && u.email === args.where.email;
          if (args?.where?.id) match = match && u.id === args.where.id;
          if (args?.where?.first_name) match = match && u.first_name === args.where.first_name;
          if (args?.where?.last_name) match = match && u.last_name === args.where.last_name;
          if (args?.where?.status_id !== undefined) match = match && u.status_id === args.where.status_id;
          return match;
        });
        
        if (!result) return Promise.resolve(null);
        
        // Inclure les relations
        if (args?.include) {
          const enriched = { ...result };
          if (args.include.genres) enriched.genres = mockGenres.find(g => g.id === result.genre_id) || null;
          if (args.include.grades) enriched.grades = mockGrades.find(g => g.id === result.grade_id) || null;
          if (args.include.status) enriched.status = mockStatus.find(s => s.id === result.status_id) || null;
          if (args.include.plans_tarifaires) enriched.plans_tarifaires = mockPlansTarifaires.find(p => p.id === result.abonnement_id) || null;
          result = enriched;
        }
        
        // Appliquer le select si présent
        if (args?.select) {
          const selected = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] === true || typeof args.select[key] === 'object') {
              selected[key] = result[key];
            }
          });
          result = selected;
        }
        
        return Promise.resolve(result);
      },
      
      findUnique: (args) => {
        let result = mockUtilisateurs.find(u => {
          let match = true;
          if (args.where.id) match = match && u.id === args.where.id;
          if (args.where.email) match = match && u.email === args.where.email;
          if (args.where.status_id !== undefined) match = match && u.status_id === args.where.status_id;
          return match;
        });
        
        if (!result) return Promise.resolve(null);
        
        // Inclure les relations
        if (args?.include) {
          const enriched = { ...result };
          if (args.include.genres) enriched.genres = mockGenres.find(g => g.id === result.genre_id) || null;
          if (args.include.grades) enriched.grades = mockGrades.find(g => g.id === result.grade_id) || null;
          if (args.include.status) enriched.status = mockStatus.find(s => s.id === result.status_id) || null;
          if (args.include.plans_tarifaires) enriched.plans_tarifaires = mockPlansTarifaires.find(p => p.id === result.abonnement_id) || null;
          result = enriched;
        }
        
        // Appliquer le select si présent
        if (args?.select) {
          const selected = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] === true || typeof args.select[key] === 'object') {
              selected[key] = result[key];
            }
          });
          result = selected;
        }
        
        return Promise.resolve(result);
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
        if (!user) {
          return Promise.reject(new Error('User not found'));
        }
        
        const updated = { ...user, ...args.data };
        
        // Inclure les relations
        if (args?.include) {
          const enriched = { ...updated };
          if (args.include.genres) enriched.genres = mockGenres.find(g => g.id === updated.genre_id) || null;
          if (args.include.grades) enriched.grades = mockGrades.find(g => g.id === updated.grade_id) || null;
          if (args.include.status) enriched.status = mockStatus.find(s => s.id === updated.status_id) || null;
          if (args.include.plans_tarifaires) enriched.plans_tarifaires = mockPlansTarifaires.find(p => p.id === updated.abonnement_id) || null;
          return Promise.resolve(enriched);
        }
        
        return Promise.resolve(updated);
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
    
    this.commandes = {
      findMany: (args) => {
        let results = [...mockCommandes];
        
        // Filtre par statut
        if (args?.where?.statut) {
          results = results.filter(c => c.statut === args.where.statut);
        }
        
        // Filtre par utilisateur
        if (args?.where?.utilisateur_id) {
          results = results.filter(c => c.utilisateur_id === args.where.utilisateur_id);
        }
        
        // Filtre par date
        if (args?.where?.date_commande?.gte) {
          results = results.filter(c => c.date_commande >= args.where.date_commande.gte);
        }
        if (args?.where?.date_commande?.lte) {
          results = results.filter(c => c.date_commande <= args.where.date_commande.lte);
        }
        
        // Recherche texte dans utilisateurs
        if (args?.where?.utilisateurs) {
          const searchOr = args.where.utilisateurs.OR;
          if (searchOr && Array.isArray(searchOr)) {
            results = results.filter(c => {
              const user = c.utilisateurs;
              return searchOr.some(condition => {
                if (condition.first_name?.contains) {
                  return user.first_name.toLowerCase().includes(condition.first_name.contains.toLowerCase());
                }
                if (condition.last_name?.contains) {
                  return user.last_name.toLowerCase().includes(condition.last_name.contains.toLowerCase());
                }
                if (condition.email?.contains) {
                  return user.email.toLowerCase().includes(condition.email.contains.toLowerCase());
                }
                return false;
              });
            });
          }
        }
        
        // Pagination
        if (args?.skip) {
          results = results.slice(args.skip);
        }
        if (args?.take) {
          results = results.slice(0, args.take);
        }
        
        // Include utilisateurs
        if (args?.include?.utilisateurs) {
          results = results.map(c => ({
            ...c,
            utilisateurs: c.utilisateurs,
          }));
        }
        
        return Promise.resolve(results);
      },
      
      findUnique: (args) => {
        const commande = mockCommandes.find(c => c.commande_id === args.where.commande_id);
        if (!commande) return Promise.resolve(null);
        
        // Include utilisateurs
        if (args?.include?.utilisateurs) {
          return Promise.resolve({
            ...commande,
            utilisateurs: commande.utilisateurs,
          });
        }
        
        return Promise.resolve(commande);
      },
      
      create: (args) => {
        const newCommande = {
          commande_id: `cmd-${Date.now()}`,
          ...args.data,
          date_commande: args.data.date_commande || new Date(),
          updated_at: new Date(),
          utilisateurs: mockUtilisateurs.find(u => u.id === args.data.utilisateur_id),
        };
        mockCommandes.push(newCommande);
        
        // Include utilisateurs
        if (args?.include?.utilisateurs) {
          return Promise.resolve({
            ...newCommande,
            utilisateurs: newCommande.utilisateurs,
          });
        }
        
        return Promise.resolve(newCommande);
      },
      
      update: (args) => {
        const index = mockCommandes.findIndex(c => c.commande_id === args.where.commande_id);
        if (index === -1) {
          return Promise.reject(new Error('Commande not found'));
        }
        
        mockCommandes[index] = {
          ...mockCommandes[index],
          ...args.data,
          updated_at: new Date(),
        };
        
        // Include utilisateurs
        if (args?.include?.utilisateurs) {
          return Promise.resolve({
            ...mockCommandes[index],
            utilisateurs: mockCommandes[index].utilisateurs,
          });
        }
        
        return Promise.resolve(mockCommandes[index]);
      },
      
      delete: (args) => {
        const index = mockCommandes.findIndex(c => c.commande_id === args.where.commande_id);
        if (index === -1) {
          return Promise.reject(new Error('Commande not found'));
        }
        
        const deleted = mockCommandes[index];
        mockCommandes.splice(index, 1);
        return Promise.resolve(deleted);
      },
      
      count: (args) => {
        let results = [...mockCommandes];
        
        // Filtre par statut
        if (args?.where?.statut) {
          results = results.filter(c => c.statut === args.where.statut);
        }
        
        // Filtre par utilisateur
        if (args?.where?.utilisateur_id) {
          results = results.filter(c => c.utilisateur_id === args.where.utilisateur_id);
        }
        
        // Filtre par date
        if (args?.where?.date_commande?.gte) {
          results = results.filter(c => c.date_commande >= args.where.date_commande.gte);
        }
        if (args?.where?.date_commande?.lte) {
          results = results.filter(c => c.date_commande <= args.where.date_commande.lte);
        }
        
        return Promise.resolve(results.length);
      },
      
      groupBy: (args) => {
        if (args.by.includes('statut')) {
          const groups = {};
          mockCommandes.forEach(c => {
            if (!groups[c.statut]) {
              groups[c.statut] = { statut: c.statut, _count: 0 };
            }
            groups[c.statut]._count++;
          });
          return Promise.resolve(Object.values(groups));
        }
        return Promise.resolve([]);
      },
      
      aggregate: (args) => {
        let results = [...mockCommandes];
        
        // Filtre par date
        if (args?.where?.date_commande?.gte) {
          results = results.filter(c => c.date_commande >= args.where.date_commande.gte);
        }
        
        // Calcul somme
        if (args?._sum?.total) {
          const sum = results.reduce((acc, c) => acc + Number(c.total), 0);
          return Promise.resolve({ _sum: { total: sum } });
        }
        
        return Promise.resolve({ _sum: { total: 0 } });
      },
    };
    
    this.genres = {
      findFirst: (args) => {
        const genre = mockGenres.find(g => {
          if (args?.where?.genre_name) {
            return g.genre_name === args.where.genre_name;
          }
          return false;
        });
        return Promise.resolve(genre || null);
      },
      
      findMany: () => {
        return Promise.resolve(mockGenres);
      },
    };
    
    this.grades = {
      findFirst: (args) => {
        const grade = mockGrades.find(g => {
          if (args?.where?.grade_id) {
            return g.grade_id === args.where.grade_id;
          }
          return false;
        });
        return Promise.resolve(grade || null);
      },
      
      findMany: () => {
        return Promise.resolve(mockGrades);
      },
    };
    
    this.status = {
      findFirst: (args) => {
        const status = mockStatus.find(s => {
          if (args?.where?.nom_role) {
            return s.nom_role === args.where.nom_role;
          }
          return false;
        });
        return Promise.resolve(status || null);
      },
      
      findMany: () => {
        return Promise.resolve(mockStatus);
      },
    };
    
    this.plans_tarifaires = {
      findFirst: (args) => {
        const plan = mockPlansTarifaires.find(p => {
          if (args?.where?.nom_plan) {
            return p.nom_plan === args.where.nom_plan;
          }
          return false;
        });
        return Promise.resolve(plan || null);
      },
      
      findMany: () => {
        return Promise.resolve(mockPlansTarifaires);
      },
    };
    
    // COURS
    this.professeurs = {
      findMany: (args) => {
        let results = [...mockProfesseurs];
        
        if (args?.where?.status_id) {
          results = results.filter(p => p.status_id === args.where.status_id);
        }
        
        if (args?.where?.OR) {
          const orResults = [];
          args.where.OR.forEach(condition => {
            const found = mockProfesseurs.filter(p => {
              if (condition.AND) {
                return condition.AND.every(c => {
                  if (c.prenom) return p.prenom === c.prenom;
                  if (c.nom) return p.nom === c.nom;
                  return true;
                });
              }
              if (condition.nom) return p.nom === condition.nom;
              return false;
            });
            orResults.push(...found);
          });
          results = orResults;
        }
        
        return Promise.resolve(results);
      },
      
      findFirst: (args) => {
        let result = null;
        
        if (args?.where?.AND) {
          result = mockProfesseurs.find(p => {
            return args.where.AND.every(c => {
              if (c.prenom) return p.prenom === c.prenom;
              if (c.nom) return p.nom === c.nom;
              return true;
            });
          });
        }
        
        if (!result && args?.where?.nom) {
          result = mockProfesseurs.find(p => p.nom === args.where.nom);
        }
        
        if (args?.include?.cours_recurrent_professeur && result) {
          const associations = mockCoursRecurrentProfesseur.filter(
            crp => crp.professeur_id === result.id
          );
          result = {
            ...result,
            cours_recurrent_professeur: associations.map(assoc => ({
              ...assoc,
              cours_recurrent: mockCoursRecurrent.find(cr => cr.id === assoc.cours_recurrent_id)
            }))
          };
        }
        
        return Promise.resolve(result || null);
      },
    };
    
    this.cours_recurrent = {
      findMany: (args) => {
        let results = [...mockCoursRecurrent];
        
        if (args?.where?.jour_semaine) {
          results = results.filter(cr => cr.jour_semaine === args.where.jour_semaine);
        }
        
        if (args?.include?.cours_recurrent_professeur) {
          results = results.map(cr => ({
            ...cr,
            cours_recurrent_professeur: mockCoursRecurrentProfesseur
              .filter(crp => crp.cours_recurrent_id === cr.id)
              .map(crp => ({
                ...crp,
                professeurs: mockProfesseurs.find(p => p.id === crp.professeur_id)
              }))
          }));
        }
        
        return Promise.resolve(results);
      },
      
      findFirst: (args) => {
        const result = mockCoursRecurrent.find(cr => {
          if (args?.where?.jour_semaine && cr.jour_semaine !== args.where.jour_semaine) {
            return false;
          }
          if (args?.where?.type_cours && cr.type_cours !== args.where.type_cours) {
            return false;
          }
          if (args?.where?.heure_debut && cr.heure_debut !== args.where.heure_debut) {
            return false;
          }
          if (args?.where?.heure_fin && cr.heure_fin !== args.where.heure_fin) {
            return false;
          }
          return true;
        });
        return Promise.resolve(result || null);
      },
      
      findUnique: (args) => {
        const result = mockCoursRecurrent.find(cr => cr.id === args.where.id);
        
        if (result && args?.include?.cours_recurrent_professeur) {
          return Promise.resolve({
            ...result,
            cours_recurrent_professeur: mockCoursRecurrentProfesseur
              .filter(crp => crp.cours_recurrent_id === result.id)
              .map(crp => ({
                ...crp,
                professeurs: mockProfesseurs.find(p => p.id === crp.professeur_id)
              }))
          });
        }
        
        return Promise.resolve(result || null);
      },
      
      create: (args) => {
        const newCoursRecurrent = {
          id: mockCoursRecurrent.length + 1,
          ...args.data,
        };
        mockCoursRecurrent.push(newCoursRecurrent);
        return Promise.resolve(newCoursRecurrent);
      },
      
      update: (args) => {
        const index = mockCoursRecurrent.findIndex(cr => cr.id === args.where.id);
        if (index >= 0) {
          mockCoursRecurrent[index] = { ...mockCoursRecurrent[index], ...args.data };
          return Promise.resolve(mockCoursRecurrent[index]);
        }
        return Promise.reject(new Error('Cours récurrent non trouvé'));
      },
      
      delete: (args) => {
        const index = mockCoursRecurrent.findIndex(cr => cr.id === args.where.id);
        if (index >= 0) {
          const deleted = mockCoursRecurrent.splice(index, 1)[0];
          return Promise.resolve(deleted);
        }
        return Promise.reject(new Error('Cours récurrent non trouvé'));
      },
    };
    
    this.cours_recurrent_professeur = {
      createMany: (args) => {
        const created = args.data.map((item, idx) => ({
          id: mockCoursRecurrentProfesseur.length + idx + 1,
          ...item,
        }));
        mockCoursRecurrentProfesseur.push(...created);
        return Promise.resolve({ count: created.length });
      },
      
      deleteMany: (args) => {
        let count = 0;
        
        if (args?.where?.cours_recurrent_id && args?.where?.professeur_id?.in) {
          const toDelete = mockCoursRecurrentProfesseur.filter(
            crp => crp.cours_recurrent_id === args.where.cours_recurrent_id &&
                   args.where.professeur_id.in.includes(crp.professeur_id)
          );
          count = toDelete.length;
          toDelete.forEach(item => {
            const index = mockCoursRecurrentProfesseur.indexOf(item);
            if (index >= 0) mockCoursRecurrentProfesseur.splice(index, 1);
          });
        } else if (args?.where?.cours_recurrent_id) {
          const toDelete = mockCoursRecurrentProfesseur.filter(
            crp => crp.cours_recurrent_id === args.where.cours_recurrent_id
          );
          count = toDelete.length;
          toDelete.forEach(item => {
            const index = mockCoursRecurrentProfesseur.indexOf(item);
            if (index >= 0) mockCoursRecurrentProfesseur.splice(index, 1);
          });
        }
        
        return Promise.resolve({ count });
      },
    };
    
    this.cours = {
      findMany: (args) => {
        let results = [...mockCours];
        
        // Filtres where
        if (args?.where?.date_cours?.gte) {
          results = results.filter(c => c.date_cours >= args.where.date_cours.gte);
        }
        if (args?.where?.date_cours?.lte) {
          results = results.filter(c => c.date_cours <= args.where.date_cours.lte);
        }
        if (args?.where?.cours_recurrent_id) {
          results = results.filter(c => c.cours_recurrent_id === args.where.cours_recurrent_id);
        }
        if (args?.where?.inscriptions?.some) {
          const userId = args.where.inscriptions.some.utilisateur_id;
          const coursIdsWithUser = mockInscriptions
            .filter(i => i.utilisateur_id === userId)
            .map(i => i.cours_id);
          results = results.filter(c => coursIdsWithUser.includes(c.id));
        }
        
        // Includes
        if (args?.include?.inscriptions) {
          results = results.map(c => ({
            ...c,
            inscriptions: mockInscriptions.filter(i => i.cours_id === c.id).map(i => ({
              ...i,
              utilisateurs: mockUtilisateurs.find(u => u.id === i.utilisateur_id)
            }))
          }));
        }
        
        // Take
        if (args?.take) {
          results = results.slice(0, args.take);
        }
        
        return Promise.resolve(results);
      },
      
      createMany: (args) => {
        const created = args.data.map((item, idx) => ({
          id: mockCours.length + idx + 1,
          ...item,
        }));
        mockCours.push(...created);
        return Promise.resolve({ count: created.length });
      },
      
      updateMany: (args) => {
        let count = 0;
        mockCours.forEach(c => {
          let matches = true;
          if (args?.where?.cours_recurrent_id && c.cours_recurrent_id !== args.where.cours_recurrent_id) {
            matches = false;
          }
          if (args?.where?.date_cours?.gte && c.date_cours < args.where.date_cours.gte) {
            matches = false;
          }
          
          if (matches) {
            Object.assign(c, args.data);
            count++;
          }
        });
        return Promise.resolve({ count });
      },
      
      deleteMany: (args) => {
        let count = 0;
        const toDelete = mockCours.filter(c => {
          if (args?.where?.cours_recurrent_id && c.cours_recurrent_id !== args.where.cours_recurrent_id) {
            return false;
          }
          if (args?.where?.date_cours?.gte && c.date_cours < args.where.date_cours.gte) {
            return false;
          }
          return true;
        });
        count = toDelete.length;
        toDelete.forEach(item => {
          const index = mockCours.indexOf(item);
          if (index >= 0) mockCours.splice(index, 1);
        });
        return Promise.resolve({ count });
      },
    };
    
    this.inscriptions = {
      findMany: (args) => {
        let results = [...mockInscriptions];
        
        if (args?.where?.cours_id) {
          results = results.filter(i => i.cours_id === args.where.cours_id);
        }
        if (args?.where?.utilisateur_id) {
          results = results.filter(i => i.utilisateur_id === args.where.utilisateur_id);
        }
        if (args?.where?.cours?.date_cours?.lte) {
          const coursIds = mockCours
            .filter(c => c.date_cours <= args.where.cours.date_cours.lte)
            .map(c => c.id);
          results = results.filter(i => coursIds.includes(i.cours_id));
        }
        
        if (args?.include?.utilisateurs) {
          results = results.map(i => ({
            ...i,
            utilisateurs: mockUtilisateurs.find(u => u.id === i.utilisateur_id)
          }));
        }
        
        if (args?.include?.cours) {
          results = results.map(i => ({
            ...i,
            cours: mockCours.find(c => c.id === i.cours_id)
          }));
        }
        
        return Promise.resolve(results);
      },
      
      findFirst: (args) => {
        const result = mockInscriptions.find(i => {
          if (args?.where?.cours_id && i.cours_id !== args.where.cours_id) return false;
          if (args?.where?.utilisateur_id && i.utilisateur_id !== args.where.utilisateur_id) return false;
          return true;
        });
        
        if (result && args?.include?.cours) {
          return Promise.resolve({
            ...result,
            cours: mockCours.find(c => c.id === result.cours_id)
          });
        }
        
        return Promise.resolve(result || null);
      },
      
      create: (args) => {
        const newInscription = {
          id: mockInscriptions.length + 1,
          ...args.data,
        };
        mockInscriptions.push(newInscription);
        
        if (args?.include) {
          let result = { ...newInscription };
          if (args.include.cours) {
            result.cours = mockCours.find(c => c.id === newInscription.cours_id);
          }
          if (args.include.utilisateurs) {
            result.utilisateurs = mockUtilisateurs.find(u => u.id === newInscription.utilisateur_id);
          }
          return Promise.resolve(result);
        }
        
        return Promise.resolve(newInscription);
      },
      
      updateMany: (args) => {
        let count = 0;
        mockInscriptions.forEach(i => {
          let matches = true;
          if (args?.where?.cours_id && i.cours_id !== args.where.cours_id) {
            matches = false;
          }
          if (args?.where?.utilisateur_id && i.utilisateur_id !== args.where.utilisateur_id) {
            matches = false;
          }
          
          if (matches) {
            Object.assign(i, args.data);
            count++;
          }
        });
        return Promise.resolve({ count });
      },
      
      deleteMany: (args) => {
        let toDelete = [];
        
        if (args?.where?.cours_id && args?.where?.utilisateur_id) {
          toDelete = mockInscriptions.filter(
            i => i.cours_id === args.where.cours_id && i.utilisateur_id === args.where.utilisateur_id
          );
        } else if (args?.where?.cours?.cours_recurrent_id && args?.where?.cours?.date_cours?.gte) {
          const coursIds = mockCours
            .filter(c => c.cours_recurrent_id === args.where.cours.cours_recurrent_id &&
                        c.date_cours >= args.where.cours.date_cours.gte)
            .map(c => c.id);
          toDelete = mockInscriptions.filter(i => coursIds.includes(i.cours_id));
        }
        
        toDelete.forEach(item => {
          const index = mockInscriptions.indexOf(item);
          if (index >= 0) mockInscriptions.splice(index, 1);
        });
        
        return Promise.resolve({ count: toDelete.length });
      },
    };
    
    this.$transaction = async (cb) => {
      return cb({
        alertes_utilisateurs: this.alertes_utilisateurs,
        alertes_actions: this.alertes_actions,
        utilisateurs: this.utilisateurs,
        password_reset_tokens: this.password_reset_tokens,
        commandes: this.commandes,
        genres: this.genres,
        grades: this.grades,
        status: this.status,
        plans_tarifaires: this.plans_tarifaires,
        professeurs: this.professeurs,
        cours_recurrent: this.cours_recurrent,
        cours_recurrent_professeur: this.cours_recurrent_professeur,
        cours: this.cours,
        inscriptions: this.inscriptions,
      });
    };
  }
}

export const { PrismaClient: MockPrismaClient } = { PrismaClient };

