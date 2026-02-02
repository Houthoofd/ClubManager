/**
 * Mock Prisma pour les tests du service Utilisateurs
 */

import { jest } from "@jest/globals";
import bcrypt from "bcrypt";

// Hash précalculé de 'password123' avec bcrypt - sera généré au runtime
let PASSWORD_HASH = "$2b$10$veryLongHashThatWillBeReplaced";

// Fonction pour initialiser les hash de mots de passe
export const initializePasswordHashes = async () => {
  PASSWORD_HASH = await bcrypt.hash("password123", 10);
  mockUtilisateur1.password = PASSWORD_HASH;
  mockUtilisateur2.password = PASSWORD_HASH;
  mockUtilisateur3.password = PASSWORD_HASH;
  mockUtilisateurInactif.password = PASSWORD_HASH;
  mockUtilisateurSuspendu.password = PASSWORD_HASH;
  mockUtilisateurProfesseur.password = PASSWORD_HASH;
};

// Initialiser les hash automatiquement au chargement du module
(async () => {
  PASSWORD_HASH = await bcrypt.hash("password123", 10);
  mockUtilisateur1.password = PASSWORD_HASH;
  mockUtilisateur2.password = PASSWORD_HASH;
  mockUtilisateur3.password = PASSWORD_HASH;
  mockUtilisateurInactif.password = PASSWORD_HASH;
  mockUtilisateurSuspendu.password = PASSWORD_HASH;
  mockUtilisateurProfesseur.password = PASSWORD_HASH;
})();

export const createMockPrisma = () => {
  return {
    utilisateurs: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    genres: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    grades: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    abonnements: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    status: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    inscriptions: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    presences: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    cours: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn((callback) =>
      callback({
        utilisateurs: {
          create: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn(),
        },
      }),
    ),
  };
};

// Données de test
export const mockUtilisateur1 = {
  id: 1,
  userId: "jean.dupont.950315",
  first_name: "Jean",
  last_name: "Dupont",
  nom_utilisateur: "jdupont",
  email: "jean.dupont@example.com",
  password: PASSWORD_HASH, // Hash de 'password123'
  genre_id: 1,
  date_of_birth: new Date("1995-03-15"),
  grade_id: 3,
  abonnement_id: 1,
  status_id: 1,
  active: true,
  date_inscription: new Date("2023-01-10"),
  created_at: new Date("2023-01-10"),
  updated_at: new Date("2023-01-10"),
};

export const mockUtilisateur2 = {
  id: 2,
  userId: "marie.martin.880722",
  first_name: "Marie",
  last_name: "Martin",
  nom_utilisateur: "mmartin",
  email: "marie.martin@example.com",
  password: PASSWORD_HASH,
  genre_id: 2,
  date_of_birth: new Date("1988-07-22"),
  grade_id: 4,
  abonnement_id: 2,
  status_id: 1,
  active: true,
  date_inscription: new Date("2023-02-15"),
  created_at: new Date("2023-02-15"),
  updated_at: new Date("2023-02-15"),
};

export const mockUtilisateur3 = {
  id: 3,
  userId: "sophie.bernard.001012",
  first_name: "Sophie",
  last_name: "Bernard",
  nom_utilisateur: "sbernard",
  email: "sophie.bernard@example.com",
  password: PASSWORD_HASH,
  genre_id: 2,
  date_of_birth: new Date("2000-10-12"),
  grade_id: 2,
  abonnement_id: 1,
  status_id: 1,
  active: true,
  date_inscription: new Date("2023-03-20"),
  created_at: new Date("2023-03-20"),
  updated_at: new Date("2023-03-20"),
};

export const mockUtilisateurInactif = {
  id: 4,
  userId: "pierre.durand.851204",
  first_name: "Pierre",
  last_name: "Durand",
  nom_utilisateur: "pdurand",
  email: "pierre.durand@example.com",
  password: PASSWORD_HASH,
  genre_id: 1,
  date_of_birth: new Date("1985-12-04"),
  grade_id: 5,
  abonnement_id: null,
  status_id: 2,
  active: false,
  date_inscription: new Date("2022-09-01"),
  created_at: new Date("2022-09-01"),
  updated_at: new Date("2024-01-15"),
};

export const mockUtilisateurSuspendu = {
  id: 5,
  userId: "lucas.petit.920618",
  first_name: "Lucas",
  last_name: "Petit",
  nom_utilisateur: "lpetit",
  email: "lucas.petit@example.com",
  password: PASSWORD_HASH,
  genre_id: 1,
  date_of_birth: new Date("1992-06-18"),
  grade_id: 3,
  abonnement_id: 1,
  status_id: 3,
  active: false,
  date_inscription: new Date("2023-05-10"),
  created_at: new Date("2023-05-10"),
  updated_at: new Date("2024-02-01"),
};

export const mockUtilisateurProfesseur = {
  id: 6,
  userId: "claire.lefebvre.800425",
  first_name: "Claire",
  last_name: "Lefebvre",
  nom_utilisateur: "clefebvre",
  email: "claire.lefebvre@example.com",
  password: PASSWORD_HASH,
  genre_id: 2,
  date_of_birth: new Date("1980-04-25"),
  grade_id: 6,
  abonnement_id: null,
  status_id: 5,
  active: true,
  date_inscription: new Date("2022-01-01"),
  created_at: new Date("2022-01-01"),
  updated_at: new Date("2022-01-01"),
};

// Relations
export const mockGenreHomme = {
  id: 1,
  nom: "Homme",
};

export const mockGenreFemme = {
  id: 2,
  nom: "Femme",
};

export const mockGrade1 = {
  id: 1,
  nom: "Ceinture blanche",
  niveau: 1,
};

export const mockGrade2 = {
  id: 2,
  nom: "Ceinture jaune",
  niveau: 2,
};

export const mockGrade3 = {
  id: 3,
  nom: "Ceinture orange",
  niveau: 3,
};

export const mockGrade4 = {
  id: 4,
  nom: "Ceinture verte",
  niveau: 4,
};

export const mockGrade5 = {
  id: 5,
  nom: "Ceinture bleue",
  niveau: 5,
};

export const mockGrade6 = {
  id: 6,
  nom: "Ceinture noire 1er Dan",
  niveau: 9,
};

export const mockAbonnement1 = {
  id: 1,
  nom: "Abonnement mensuel",
  type: "mensuel",
};

export const mockAbonnement2 = {
  id: 2,
  nom: "Abonnement annuel",
  type: "annuel",
};

export const mockStatusActif = {
  id: 1,
  nom: "Actif",
};

export const mockStatusInactif = {
  id: 2,
  nom: "Inactif",
};

export const mockStatusSuspendu = {
  id: 3,
  nom: "Suspendu",
};

export const mockStatusProfesseur = {
  id: 5,
  nom: "Professeur",
};

// Helpers pour formater les données
export const formatUtilisateur = (u: any) => ({
  id: u.id,
  userId: u.userId || undefined,
  first_name: u.first_name,
  last_name: u.last_name,
  nom_utilisateur: u.nom_utilisateur || undefined,
  email: u.email,
  genre_id: u.genre_id || undefined,
  date_of_birth: u.date_of_birth,
  grade_id: u.grade_id,
  abonnement_id: u.abonnement_id,
  status_id: u.status_id,
  active: u.active,
  date_inscription: u.date_inscription || undefined,
  created_at: u.created_at || undefined,
  updated_at: u.updated_at || undefined,
});

export const formatUtilisateurAvecDetails = (u: any) => {
  // Calcul de l'âge
  let age: number | undefined;
  if (u.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(u.date_of_birth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
  }

  const initiales = `${u.first_name.charAt(0).toUpperCase()}${u.last_name.charAt(0).toUpperCase()}`;

  return {
    ...formatUtilisateur(u),
    genre: u.genres
      ? {
          id: u.genres.id,
          nom: u.genres.nom,
        }
      : undefined,
    grade: u.grades
      ? {
          id: u.grades.id,
          nom: u.grades.nom,
          niveau: u.grades.niveau || 0,
        }
      : undefined,
    abonnement: u.abonnements
      ? {
          id: u.abonnements.id,
          nom: u.abonnements.nom,
          type: u.abonnements.type || "standard",
        }
      : undefined,
    status: u.status
      ? {
          id: u.status.id,
          nom: u.status.nom,
        }
      : undefined,
    age,
    initiales,
  };
};

export const formatUtilisateurRecherche = (u: any) => {
  let age: number | undefined;
  if (u.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(u.date_of_birth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
  }

  const initiales = `${u.first_name.charAt(0).toUpperCase()}${u.last_name.charAt(0).toUpperCase()}`;

  return {
    userId: u.userId || `user_${u.id}`,
    prenom: u.first_name,
    nom: u.last_name,
    date_naissance: u.date_of_birth,
    nom_utilisateur: u.nom_utilisateur || undefined,
    age,
    initiales,
  };
};

// Mock des statistiques
export const mockStatistiquesUtilisateurs = {
  totalUtilisateurs: 100,
  utilisateursActifs: 85,
  utilisateursInactifs: 10,
  nouveauxUtilisateurs30Jours: 12,
  utilisateursSuspendus: 5,
  repartitionParGenre: [
    { genre: "Homme", count: 55 },
    { genre: "Femme", count: 45 },
  ],
  repartitionParGrade: [
    { grade: "Ceinture blanche", count: 20 },
    { grade: "Ceinture jaune", count: 18 },
    { grade: "Ceinture orange", count: 25 },
    { grade: "Ceinture verte", count: 15 },
    { grade: "Ceinture bleue", count: 12 },
    { grade: "Ceinture noire 1er Dan", count: 10 },
  ],
  repartitionParAbonnement: [
    { abonnement: "Abonnement mensuel", count: 60 },
    { abonnement: "Abonnement annuel", count: 40 },
  ],
  repartitionParAge: [
    { trancheAge: "5-12 ans", count: 25 },
    { trancheAge: "13-17 ans", count: 20 },
    { trancheAge: "18-25 ans", count: 15 },
    { trancheAge: "26-40 ans", count: 25 },
    { trancheAge: "41-60 ans", count: 12 },
    { trancheAge: "61+ ans", count: 3 },
  ],
  moyenneAge: 28,
};

export const mockStatistiquesUtilisateur = {
  utilisateurId: 1,
  nombreCoursInscrits: 24,
  nombreCoursAssistes: 22,
  tauxPresence: 92,
  tempsPratique: 33,
  progression: {
    gradeActuel: "Ceinture orange",
    prochainGrade: "Ceinture verte",
    tempsDansGrade: 180,
  },
  dernierCours: new Date("2024-03-01"),
  prochainCours: new Date("2024-03-15"),
};

// Utilisateurs avec relations complètes
export const mockUtilisateur1AvecRelations = {
  ...mockUtilisateur1,
  genres: mockGenreHomme,
  grades: mockGrade3,
  abonnements: mockAbonnement1,
  status: mockStatusActif,
};

export const mockUtilisateur2AvecRelations = {
  ...mockUtilisateur2,
  genres: mockGenreFemme,
  grades: mockGrade4,
  abonnements: mockAbonnement2,
  status: mockStatusActif,
};

export const mockUtilisateur3AvecRelations = {
  ...mockUtilisateur3,
  genres: mockGenreFemme,
  grades: mockGrade2,
  abonnements: mockAbonnement1,
  status: mockStatusActif,
};

export const mockUtilisateurInactifAvecRelations = {
  ...mockUtilisateurInactif,
  genres: mockGenreHomme,
  grades: mockGrade5,
  abonnements: null,
  status: mockStatusInactif,
};

export const mockUtilisateurSuspenduAvecRelations = {
  ...mockUtilisateurSuspendu,
  genres: mockGenreHomme,
  grades: mockGrade3,
  abonnements: mockAbonnement1,
  status: mockStatusSuspendu,
};

export const mockUtilisateurProfesseurAvecRelations = {
  ...mockUtilisateurProfesseur,
  genres: mockGenreFemme,
  grades: mockGrade6,
  abonnements: null,
  status: mockStatusProfesseur,
};
