/**
 * Tests unitaires de base pour le module Vérification
 * Tests des handlers avec mocks
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { Request, Response } from "express";

// Mock Prisma AVANT tout autre import
const mockPrisma = {
  utilisateurs: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    count: jest.fn() as jest.MockedFunction<any>,
  },
  cours_recurrent: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
  },
  articles: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
  },
  professeurs: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Importer après les mocks
import {
  verifierEmailUtilisateur,
  verifierNomUtilisateur,
  verifierPrenomUtilisateur,
  verifierNomUtilisateurComplet,
  verifierPrenomNomUtilisateur,
  verifierEmailPrenomNomUtilisateur,
  verifierCoursPlanning,
  verifierArticleParNom,
  verifierArticleParNomEtCategorie,
  verifierUtilisateursSontProfesseurs,
  verifierSanteService,
} from "../core/services/verification.service.js";

describe("Vérification Module - Tests unitaires de base", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Service: verifierEmailUtilisateur", () => {
    it("devrait indiquer qu'un email existe", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        active: true,
      });

      const result = await verifierEmailUtilisateur("test@example.com");

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Email déjà utilisé.");
      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: { id: true, active: true },
      });
    });

    it("devrait indiquer qu'un email est disponible", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifierEmailUtilisateur("nouveau@example.com");

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Email disponible.");
    });

    it("devrait normaliser l'email (lowercase et trim)", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      await verifierEmailUtilisateur("  TEST@EXAMPLE.COM  ");

      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: { id: true, active: true },
      });
    });

    it("devrait gérer les erreurs de base de données", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        verifierEmailUtilisateur("test@example.com"),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("Service: verifierNomUtilisateur", () => {
    it("devrait indiquer qu'un nom d'utilisateur existe", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await verifierNomUtilisateur("john.doe");

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Nom d'utilisateur déjà utilisé.");
      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith({
        where: { userId: "john.doe" },
        select: { id: true },
      });
    });

    it("devrait indiquer qu'un nom d'utilisateur est disponible", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifierNomUtilisateur("nouveau.user");

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Nom d'utilisateur disponible.");
    });
  });

  describe("Service: verifierPrenomUtilisateur", () => {
    it("devrait trouver un utilisateur par prénom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await verifierPrenomUtilisateur("Jean");

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Prénom trouvé.");
    });

    it("devrait indiquer qu'aucun utilisateur n'a ce prénom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifierPrenomUtilisateur("Inexistant");

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Prénom non trouvé.");
    });
  });

  describe("Service: verifierNomUtilisateurComplet", () => {
    it("devrait trouver un utilisateur par nom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await verifierNomUtilisateurComplet("Dupont");

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Nom trouvé.");
    });
  });

  describe("Service: verifierPrenomNomUtilisateur", () => {
    it("devrait trouver un utilisateur par prénom et nom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await verifierPrenomNomUtilisateur("Jean", "Dupont");

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Utilisateur avec ce prénom et nom trouvé.");
      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith({
        where: {
          first_name: "Jean",
          last_name: "Dupont",
        },
        select: { id: true },
      });
    });

    it("devrait indiquer qu'aucun utilisateur n'existe avec ce prénom et nom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifierPrenomNomUtilisateur("Test", "Inexistant");

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Aucun utilisateur avec ce prénom et nom.");
    });
  });

  describe("Service: verifierEmailPrenomNomUtilisateur", () => {
    it("devrait trouver un utilisateur par email, prénom et nom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await verifierEmailPrenomNomUtilisateur(
        "jean.dupont@example.com",
        "Jean",
        "Dupont",
      );

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Utilisateur avec ces informations trouvé.");
      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith({
        where: {
          email: "jean.dupont@example.com",
          first_name: "Jean",
          last_name: "Dupont",
        },
        select: { id: true },
      });
    });
  });

  describe("Service: verifierCoursPlanning", () => {
    it("devrait indiquer qu'un cours existe à ce créneau", async () => {
      (mockPrisma.cours_recurrent.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await verifierCoursPlanning(
        "1",
        "10:00",
        "11:00",
        "Karaté",
      );

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Un cours existe déjà à ce créneau.");
      expect(mockPrisma.cours_recurrent.findFirst).toHaveBeenCalledWith({
        where: {
          jour_semaine: 1,
          type_cours: "Karaté",
        },
        select: { id: true },
      });
    });

    it("devrait indiquer que le créneau est disponible", async () => {
      (mockPrisma.cours_recurrent.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await verifierCoursPlanning("5", "14:00", "15:00", "Judo");

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Créneau disponible dans le planning.");
    });
  });

  describe("Service: verifierArticleParNom", () => {
    it("devrait trouver un article par nom", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await verifierArticleParNom("Kimono");

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Article trouvé dans le magasin.");
    });

    it("devrait indiquer qu'un article n'existe pas", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifierArticleParNom("Article Inexistant");

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Article non trouvé.");
    });
  });

  describe("Service: verifierArticleParNomEtCategorie", () => {
    it("devrait trouver un article par nom et catégorie", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await verifierArticleParNomEtCategorie("Kimono", 1);

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Article trouvé dans cette catégorie.");
      expect(mockPrisma.articles.findFirst).toHaveBeenCalledWith({
        where: {
          nom: "Kimono",
          categorie_id: 1,
        },
        select: { id: true },
      });
    });

    it("devrait indiquer qu'un article n'existe pas dans cette catégorie", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifierArticleParNomEtCategorie("Kimono", 99);

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Article non trouvé dans cette catégorie.");
    });
  });

  describe("Service: verifierUtilisateursSontProfesseurs", () => {
    it("devrait identifier quels utilisateurs sont professeurs", async () => {
      // Mock pour le premier utilisateur (professeur)
      (mockPrisma.professeurs.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(null);

      const utilisateurs = [
        { nom: "Martin", prenom: "Pierre" },
        { nom: "Durand", prenom: "Sophie" },
      ];

      const result = await verifierUtilisateursSontProfesseurs(utilisateurs);

      expect(result.professeurs).toHaveLength(2);
      expect(result.professeurs[0]).toEqual({
        nom: "Martin",
        prenom: "Pierre",
        isProf: true,
      });
      expect(result.professeurs[1]).toEqual({
        nom: "Durand",
        prenom: "Sophie",
        isProf: false,
      });
      expect(result.message).toBe(
        "1 professeur(s) trouvé(s) sur 2 utilisateur(s).",
      );
    });

    it("devrait indiquer qu'aucun utilisateur n'est professeur", async () => {
      (mockPrisma.professeurs.findFirst as jest.Mock).mockResolvedValue(null);

      const utilisateurs = [
        { nom: "Test", prenom: "User" },
        { nom: "Another", prenom: "User" },
      ];

      const result = await verifierUtilisateursSontProfesseurs(utilisateurs);

      expect(result.professeurs).toHaveLength(2);
      expect(result.professeurs[0].isProf).toBe(false);
      expect(result.professeurs[1].isProf).toBe(false);
      expect(result.message).toBe(
        "0 professeur(s) trouvé(s) sur 2 utilisateur(s).",
      );
    });
  });

  describe("Service: verifierSanteService", () => {
    it("devrait retourner un statut healthy si la base de données est accessible", async () => {
      (mockPrisma.utilisateurs.count as jest.Mock).mockResolvedValue(10);

      const result = await verifierSanteService();

      expect(result.status).toBe("healthy");
      expect(result.checks.database).toBe(true);
      expect(result.checks.verification).toBe(true);
      expect(result.message).toBe("Service de vérification opérationnel");
    });

    it("devrait retourner un statut unhealthy si la base de données est inaccessible", async () => {
      (mockPrisma.utilisateurs.count as jest.Mock).mockRejectedValue(
        new Error("Connection failed"),
      );

      const result = await verifierSanteService();

      expect(result.status).toBe("unhealthy");
      expect(result.checks.database).toBe(false);
      expect(result.checks.verification).toBe(false);
      expect(result.message).toBe("Service de vérification non opérationnel");
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait propager les erreurs de base de données", async () => {
      const dbError = new Error("Database connection lost");
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockRejectedValue(
        dbError,
      );

      await expect(
        verifierEmailUtilisateur("test@example.com"),
      ).rejects.toThrow("Database connection lost");
    });

    it("devrait gérer les erreurs lors de la vérification des professeurs", async () => {
      (mockPrisma.professeurs.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        verifierUtilisateursSontProfesseurs([{ nom: "Test", prenom: "User" }]),
      ).rejects.toThrow("Database error");
    });
  });

  describe("Validation des données", () => {
    it("devrait gérer les emails vides après trim", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifierEmailUtilisateur("   ");

      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith({
        where: { email: "" },
        select: { id: true, active: true },
      });
    });

    it("devrait convertir le jour en nombre pour la vérification de planning", async () => {
      (mockPrisma.cours_recurrent.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await verifierCoursPlanning("3", "10:00", "11:00", "Judo");

      expect(mockPrisma.cours_recurrent.findFirst).toHaveBeenCalledWith({
        where: {
          jour_semaine: 3,
          type_cours: "Judo",
        },
        select: { id: true },
      });
    });
  });

  describe("Cas limites", () => {
    it("devrait gérer une liste vide d'utilisateurs pour vérification professeurs", async () => {
      const result = await verifierUtilisateursSontProfesseurs([]);

      expect(result.professeurs).toEqual([]);
      expect(result.message).toBe(
        "0 professeur(s) trouvé(s) sur 0 utilisateur(s).",
      );
    });

    it("devrait gérer les noms d'articles avec caractères spéciaux", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifierArticleParNom("Kimono d'été");

      expect(mockPrisma.articles.findFirst).toHaveBeenCalledWith({
        where: { nom: "Kimono d'été" },
        select: { id: true },
      });
      expect(result.exists).toBe(false);
    });
  });
});
