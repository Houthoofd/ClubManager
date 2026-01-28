/**
 * Mock Prisma pour les tests du service Professeurs
 */

import { jest } from '@jest/globals';

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
    },
    professeurs: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    cours_recurrent: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    cours_recurrent_professeur: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
};

// Données de test
export const mockProfesseur = {
  id: 1,
  nom: "Martin",
  prenom: "Sophie",
  nom_utilisateur: "smartin",
  email: "sophie.martin@example.com",
  genre_id: 2,
  date_naissance: new Date("1985-05-15"),
  grade_id: 5,
  status_id: 5,
};

export const mockProfesseur2 = {
  id: 2,
  nom: "Dubois",
  prenom: "Pierre",
  nom_utilisateur: "pdubois",
  email: "pierre.dubois@example.com",
  genre_id: 1,
  date_naissance: new Date("1978-08-22"),
  grade_id: 6,
  status_id: 5,
};

export const mockUtilisateurNormal = {
  id: 3,
  nom: "Lefebvre",
  prenom: "Marie",
  nom_utilisateur: "mlefebvre",
  email: "marie.lefebvre@example.com",
  genre_id: 2,
  date_naissance: new Date("1990-03-10"),
  grade_id: 3,
  status_id: 1,
};

export const mockPlanningCours = [
  {
    cours_recurrent_id: 1,
    type_cours: "Karaté Débutant",
    jour_semaine: 1,
    heure_debut: "18:00",
    heure_fin: "19:30",
    est_recurrent_actif: true,
    professeur_id: 1,
    professeur_nom: "Martin",
    professeur_prenom: "Sophie",
  },
  {
    cours_recurrent_id: 2,
    type_cours: "Karaté Avancé",
    jour_semaine: 3,
    heure_debut: "19:00",
    heure_fin: "20:30",
    est_recurrent_actif: true,
    professeur_id: 1,
    professeur_nom: "Martin",
    professeur_prenom: "Sophie",
  },
  {
    cours_recurrent_id: 3,
    type_cours: "Judo Enfants",
    jour_semaine: 5,
    heure_debut: "17:00",
    heure_fin: "18:00",
    est_recurrent_actif: true,
    professeur_id: 1,
    professeur_nom: "Martin",
    professeur_prenom: "Sophie",
  },
];

export const mockGenre = {
  id: 2,
  nom: "Femme",
};

export const mockGrade = {
  id: 5,
  nom: "Ceinture noire 1er Dan",
  niveau: 9,
};

// Helpers pour formater les données
export const formatProfesseur = (p: any) => ({
  id: p.id,
  nom: p.nom,
  prenom: p.prenom,
  nom_utilisateur: p.nom_utilisateur,
  email: p.email,
  genre_id: p.genre_id,
  date_naissance: p.date_naissance,
  grade_id: p.grade_id,
  status_id: p.status_id,
});

export const formatProfesseurAvecDetails = (p: any) => ({
  ...formatProfesseur(p),
  genre: p.genre
    ? {
        id: p.genre.id,
        nom: p.genre.nom,
      }
    : undefined,
  grade: p.grade
    ? {
        id: p.grade.id,
        nom: p.grade.nom,
        niveau: p.grade.niveau,
      }
    : undefined,
  nombreCours: p.nombreCours || 0,
  nombreEleves: p.nombreEleves || 0,
});

export const formatPlanningCours = (p: any) => ({
  cours_recurrent_id: p.cours_recurrent_id,
  type_cours: p.type_cours,
  jour_semaine: p.jour_semaine,
  heure_debut: p.heure_debut,
  heure_fin: p.heure_fin,
  est_recurrent_actif: Boolean(p.est_recurrent_actif),
  professeur_id: p.professeur_id,
  professeur_nom: p.professeur_nom,
  professeur_prenom: p.professeur_prenom,
});

// Mock des statistiques
export const mockStatistiquesProfesseurs = {
  totalProfesseurs: 15,
  professeursActifs: 15,
  professeursInactifs: 0,
  totalCours: 45,
  totalEleves: 120,
  moyenneCoursParProfesseur: 3.0,
  moyenneElevesParProfesseur: 8.0,
  repartitionParGrade: [
    { grade: "Grade 3", count: 2 },
    { grade: "Grade 4", count: 5 },
    { grade: "Grade 5", count: 6 },
    { grade: "Grade 6", count: 2 },
  ],
};

export const mockStatistiquesProfesseur = {
  professeurId: 1,
  nombreCours: 3,
  nombreEleves: 25,
  tauxPresence: 95.5,
  heuresEnseignement: 4.5,
};
