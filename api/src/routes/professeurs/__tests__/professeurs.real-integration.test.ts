/**
 * Tests d'intégration RÉELS du module Professeurs avec vraie DB
 * Ces tests utilisent une base MySQL de test avec Prisma
 */

// IMPORTANT: Charger .env.test AVANT tout autre import
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({
  path: join(__dirname, "../../../../.env.test"),
  override: true,
});

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getTestPrisma,
} from "../../../tests/setup/testDatabase.js";
import { PrismaClient } from "@prisma/client";

describe("Professeurs - Tests d'intégration RÉELS avec DB", () => {
  let testPrisma: PrismaClient;
  let testUserId1: number;
  let testUserId2: number;
  let testProfesseurId: number;
  let testCoursId: number;

  beforeAll(async () => {
    console.log(`🔧 [TEST PROFESSEURS] Début du setup...`);
    const prismaInstance = await setupTestDatabase();
    testPrisma = prismaInstance as PrismaClient;
    console.log(`🔗 [TEST PROFESSEURS] Base de données de test initialisée`);
  });

  afterAll(async () => {
    console.log(`🧹 [TEST PROFESSEURS] Nettoyage final...`);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    console.log(`🧹 [TEST PROFESSEURS] Nettoyage des tables...`);

    // Nettoyer toutes les tables dans le bon ordre (contraintes FK)
    await testPrisma.inscriptions.deleteMany({});
    await testPrisma.cours.deleteMany({});
    await testPrisma.utilisateurs.deleteMany({});
    await testPrisma.grades.deleteMany({});
    await testPrisma.status.deleteMany({});
    await testPrisma.roles.deleteMany({});

    console.log("🌱 [TEST PROFESSEURS] Création des données de test...");

    // Créer les données de référence obligatoires
    await testPrisma.roles.create({
      data: {
        id: 1,
        nom_role: "membre",
      },
    });

    await testPrisma.roles.create({
      data: {
        id: 2,
        nom_role: "professeur",
      },
    });

    await testPrisma.status.create({
      data: {
        id: 1,
        nom_role: "en_attente",
      },
    });

    await testPrisma.status.create({
      data: {
        id: 2,
        nom_role: "actif",
      },
    });

    await testPrisma.status.create({
      data: {
        id: 3,
        nom_role: "inactif",
      },
    });

    await testPrisma.grades.create({
      data: {
        id: 1,
        grade_id: "debutant",
      },
    });

    // Créer des utilisateurs de test
    const user1 = await testPrisma.utilisateurs.create({
      data: {
        userId: `TEST_USER1_${Date.now()}`,
        first_name: "John",
        last_name: "Doe",
        email: `john.doe.${Date.now()}@test.com`,
        nom_utilisateur: `johndoe${Date.now()}`,
        role_id: 1, // membre
        status_id: 2, // actif
        grade_id: 1,
      },
    });
    testUserId1 = user1.id;

    const user2 = await testPrisma.utilisateurs.create({
      data: {
        userId: `TEST_USER2_${Date.now()}`,
        first_name: "Jane",
        last_name: "Smith",
        email: `jane.smith.${Date.now()}@test.com`,
        nom_utilisateur: `janesmith${Date.now()}`,
        role_id: 1, // membre
        status_id: 2, // actif
        grade_id: 1,
      },
    });
    testUserId2 = user2.id;

    // Créer un professeur de test
    const professeur = await testPrisma.utilisateurs.create({
      data: {
        userId: `TEST_PROF_${Date.now()}`,
        first_name: "Sensei",
        last_name: "Master",
        email: `sensei.master.${Date.now()}@test.com`,
        nom_utilisateur: `senseimaster${Date.now()}`,
        role_id: 2, // professeur
        status_id: 2, // actif
        grade_id: 1,
      },
    });
    testProfesseurId = professeur.id;

    // Créer un cours de test
    const cours = await testPrisma.cours.create({
      data: {
        nom_cours: "Karate Débutant",
        description: "Cours pour débutants",
        jour_semaine: "Lundi",
        heure_debut: "18:00:00",
        heure_fin: "19:00:00",
        salle: "Dojo 1",
        niveau: "Débutant",
        capacite_max: 20,
        professeur_id: testProfesseurId,
      },
    });
    testCoursId = cours.id;

    console.log(
      `✅ [TEST PROFESSEURS] Données de test créées - User1: ${testUserId1}, User2: ${testUserId2}, Prof: ${testProfesseurId}, Cours: ${testCoursId}`
    );
  });

  describe("Récupération des professeurs", () => {
    it("devrait récupérer tous les professeurs depuis la vraie DB", async () => {
      const professeurs = await testPrisma.utilisateurs.findMany({
        where: {
          role_id: 2, // professeurs
        },
      });

      expect(professeurs).toBeDefined();
      expect(Array.isArray(professeurs)).toBe(true);
      expect(professeurs.length).toBeGreaterThanOrEqual(1);
      expect(professeurs[0].role_id).toBe(2);
    });

    it("devrait récupérer un professeur par ID depuis la vraie DB", async () => {
      const professeur = await testPrisma.utilisateurs.findUnique({
        where: {
          id: testProfesseurId,
        },
      });

      expect(professeur).toBeDefined();
      expect(professeur?.id).toBe(testProfesseurId);
      expect(professeur?.role_id).toBe(2);
      expect(professeur?.first_name).toBe("Sensei");
      expect(professeur?.last_name).toBe("Master");
    });

    it("devrait retourner null pour un professeur inexistant", async () => {
      const professeur = await testPrisma.utilisateurs.findUnique({
        where: {
          id: 999999,
        },
      });

      expect(professeur).toBeNull();
    });
  });

  describe("Promotion d'utilisateurs en professeurs", () => {
    it("devrait promouvoir un utilisateur en professeur dans la vraie DB", async () => {
      // Vérifier l'état initial
      const userBefore = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId1 },
      });
      expect(userBefore?.role_id).toBe(1); // membre

      // Promouvoir en professeur
      const updatedUser = await testPrisma.utilisateurs.update({
        where: { id: testUserId1 },
        data: { role_id: 2 }, // professeur
      });

      expect(updatedUser.role_id).toBe(2);
      expect(updatedUser.id).toBe(testUserId1);

      // Vérifier que la modification a bien été persistée
      const userAfter = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId1 },
      });
      expect(userAfter?.role_id).toBe(2);
    });

    it("devrait promouvoir plusieurs utilisateurs en professeurs", async () => {
      // Promouvoir les deux utilisateurs
      await testPrisma.utilisateurs.updateMany({
        where: {
          id: { in: [testUserId1, testUserId2] },
        },
        data: {
          role_id: 2, // professeur
        },
      });

      // Vérifier les deux promotions
      const users = await testPrisma.utilisateurs.findMany({
        where: {
          id: { in: [testUserId1, testUserId2] },
        },
      });

      expect(users).toHaveLength(2);
      expect(users[0].role_id).toBe(2);
      expect(users[1].role_id).toBe(2);
    });

    it("ne devrait pas échouer si l'utilisateur est déjà professeur", async () => {
      // Essayer de promouvoir un utilisateur déjà professeur
      const updatedUser = await testPrisma.utilisateurs.update({
        where: { id: testProfesseurId },
        data: { role_id: 2 }, // déjà professeur
      });

      expect(updatedUser.role_id).toBe(2);
    });
  });

  describe("Modification du statut d'un professeur", () => {
    it("devrait modifier le statut d'un professeur dans la vraie DB", async () => {
      // Vérifier l'état initial
      const profBefore = await testPrisma.utilisateurs.findUnique({
        where: { id: testProfesseurId },
      });
      expect(profBefore?.status_id).toBe(2); // actif

      // Modifier le statut
      const updatedProf = await testPrisma.utilisateurs.update({
        where: { id: testProfesseurId },
        data: { status_id: 3 }, // inactif
      });

      expect(updatedProf.status_id).toBe(3);

      // Vérifier la persistance
      const profAfter = await testPrisma.utilisateurs.findUnique({
        where: { id: testProfesseurId },
      });
      expect(profAfter?.status_id).toBe(3);
    });

    it("devrait pouvoir réactiver un professeur inactif", async () => {
      // Désactiver d'abord
      await testPrisma.utilisateurs.update({
        where: { id: testProfesseurId },
        data: { status_id: 3 }, // inactif
      });

      // Réactiver
      const reactivated = await testPrisma.utilisateurs.update({
        where: { id: testProfesseurId },
        data: { status_id: 2 }, // actif
      });

      expect(reactivated.status_id).toBe(2);
    });
  });

  describe("Planning des cours d'un professeur", () => {
    it("devrait récupérer le planning d'un professeur depuis la vraie DB", async () => {
      const cours = await testPrisma.cours.findMany({
        where: {
          professeur_id: testProfesseurId,
        },
      });

      expect(cours).toBeDefined();
      expect(Array.isArray(cours)).toBe(true);
      expect(cours.length).toBeGreaterThanOrEqual(1);
      expect(cours[0].professeur_id).toBe(testProfesseurId);
      expect(cours[0].nom_cours).toBe("Karate Débutant");
    });

    it("devrait retourner un tableau vide pour un professeur sans cours", async () => {
      // Promouvoir user1 en professeur sans lui assigner de cours
      await testPrisma.utilisateurs.update({
        where: { id: testUserId1 },
        data: { role_id: 2 },
      });

      const cours = await testPrisma.cours.findMany({
        where: {
          professeur_id: testUserId1,
        },
      });

      expect(cours).toEqual([]);
    });

    it("devrait récupérer plusieurs cours pour un professeur", async () => {
      // Créer un deuxième cours pour le même professeur
      await testPrisma.cours.create({
        data: {
          nom_cours: "Karate Avancé",
          description: "Cours pour avancés",
          jour_semaine: "Mercredi",
          heure_debut: "19:00:00",
          heure_fin: "20:30:00",
          salle: "Dojo 2",
          niveau: "Avancé",
          capacite_max: 15,
          professeur_id: testProfesseurId,
        },
      });

      const cours = await testPrisma.cours.findMany({
        where: {
          professeur_id: testProfesseurId,
        },
        orderBy: {
          nom_cours: "asc",
        },
      });

      expect(cours).toHaveLength(2);
      expect(cours[0].nom_cours).toBe("Karate Avancé");
      expect(cours[1].nom_cours).toBe("Karate Débutant");
    });
  });

  describe("Contraintes et validations de la DB", () => {
    it("devrait respecter la contrainte de clé étrangère role_id", async () => {
      await expect(
        testPrisma.utilisateurs.create({
          data: {
            userId: `TEST_INVALID_${Date.now()}`,
            first_name: "Invalid",
            last_name: "User",
            email: `invalid.${Date.now()}@test.com`,
            nom_utilisateur: `invalid${Date.now()}`,
            role_id: 999, // role inexistant
            status_id: 2,
            grade_id: 1,
          },
        })
      ).rejects.toThrow();
    });

    it("devrait respecter la contrainte de clé étrangère status_id", async () => {
      await expect(
        testPrisma.utilisateurs.create({
          data: {
            userId: `TEST_INVALID_${Date.now()}`,
            first_name: "Invalid",
            last_name: "User",
            email: `invalid.${Date.now()}@test.com`,
            nom_utilisateur: `invalid${Date.now()}`,
            role_id: 2,
            status_id: 999, // status inexistant
            grade_id: 1,
          },
        })
      ).rejects.toThrow();
    });

    it("devrait respecter l'unicité de l'email", async () => {
      const email = `duplicate.${Date.now()}@test.com`;

      // Créer le premier utilisateur
      await testPrisma.utilisateurs.create({
        data: {
          userId: `TEST_DUPLICATE1_${Date.now()}`,
          first_name: "First",
          last_name: "User",
          email: email,
          nom_utilisateur: `first${Date.now()}`,
          role_id: 2,
          status_id: 2,
          grade_id: 1,
        },
      });

      // Essayer de créer un second utilisateur avec le même email
      await expect(
        testPrisma.utilisateurs.create({
          data: {
            userId: `TEST_DUPLICATE2_${Date.now()}`,
            first_name: "Second",
            last_name: "User",
            email: email, // email dupliqué
            nom_utilisateur: `second${Date.now()}`,
            role_id: 2,
            status_id: 2,
            grade_id: 1,
          },
        })
      ).rejects.toThrow();
    });

    it("devrait respecter la contrainte de clé étrangère professeur_id dans cours", async () => {
      await expect(
        testPrisma.cours.create({
          data: {
            nom_cours: "Cours Invalide",
            jour_semaine: "Lundi",
            heure_debut: "18:00:00",
            heure_fin: "19:00:00",
            professeur_id: 999999, // professeur inexistant
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("Recherche et filtrage", () => {
    it("devrait filtrer les professeurs par statut", async () => {
      // Créer un professeur inactif
      await testPrisma.utilisateurs.create({
        data: {
          userId: `TEST_INACTIVE_${Date.now()}`,
          first_name: "Inactive",
          last_name: "Professor",
          email: `inactive.prof.${Date.now()}@test.com`,
          nom_utilisateur: `inactiveprof${Date.now()}`,
          role_id: 2,
          status_id: 3, // inactif
          grade_id: 1,
        },
      });

      // Récupérer uniquement les professeurs actifs
      const activeProfs = await testPrisma.utilisateurs.findMany({
        where: {
          role_id: 2,
          status_id: 2, // actif
        },
      });

      expect(activeProfs.length).toBeGreaterThanOrEqual(1);
      activeProfs.forEach((prof) => {
        expect(prof.status_id).toBe(2);
      });

      // Récupérer uniquement les professeurs inactifs
      const inactiveProfs = await testPrisma.utilisateurs.findMany({
        where: {
          role_id: 2,
          status_id: 3, // inactif
        },
      });

      expect(inactiveProfs.length).toBeGreaterThanOrEqual(1);
      inactiveProfs.forEach((prof) => {
        expect(prof.status_id).toBe(3);
      });
    });

    it("devrait rechercher des professeurs par nom", async () => {
      const professeurs = await testPrisma.utilisateurs.findMany({
        where: {
          role_id: 2,
          OR: [
            { first_name: { contains: "Sensei" } },
            { last_name: { contains: "Master" } },
          ],
        },
      });

      expect(professeurs.length).toBeGreaterThanOrEqual(1);
      expect(
        professeurs.some(
          (p) => p.first_name === "Sensei" && p.last_name === "Master"
        )
      ).toBe(true);
    });
  });

  describe("Transactions et opérations complexes", () => {
    it("devrait promouvoir un utilisateur et créer un cours dans une transaction", async () => {
      const result = await testPrisma.$transaction(async (tx) => {
        // Promouvoir l'utilisateur
        const promotedUser = await tx.utilisateurs.update({
          where: { id: testUserId1 },
          data: { role_id: 2 },
        });

        // Créer un cours pour ce nouveau professeur
        const newCours = await tx.cours.create({
          data: {
            nom_cours: "Nouveau Cours",
            jour_semaine: "Vendredi",
            heure_debut: "17:00:00",
            heure_fin: "18:00:00",
            professeur_id: promotedUser.id,
          },
        });

        return { promotedUser, newCours };
      });

      expect(result.promotedUser.role_id).toBe(2);
      expect(result.newCours.professeur_id).toBe(testUserId1);

      // Vérifier que tout a bien été persisté
      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId1 },
      });
      expect(user?.role_id).toBe(2);

      const cours = await testPrisma.cours.findMany({
        where: { professeur_id: testUserId1 },
      });
      expect(cours.length).toBeGreaterThanOrEqual(1);
    });

    it("devrait rollback une transaction en cas d'erreur", async () => {
      await expect(
        testPrisma.$transaction(async (tx) => {
          // Promouvoir l'utilisateur
          await tx.utilisateurs.update({
            where: { id: testUserId2 },
            data: { role_id: 2 },
          });

          // Essayer de créer un cours avec un professeur_id invalide
          await tx.cours.create({
            data: {
              nom_cours: "Cours Invalide",
              jour_semaine: "Lundi",
              heure_debut: "18:00:00",
              heure_fin: "19:00:00",
              professeur_id: 999999, // invalide
            },
          });
        })
      ).rejects.toThrow();

      // Vérifier que le rollback a bien fonctionné
      const user = await testPrisma.utilisateurs.findUnique({
        where: { id: testUserId2 },
      });
      expect(user?.role_id).toBe(1); // toujours membre, pas promu
    });
  });

  describe("Performance avec données réelles", () => {
    it("devrait gérer efficacement la récupération de nombreux professeurs", async () => {
      // Créer 20 professeurs supplémentaires
      const createPromises = Array.from({ length: 20 }, (_, i) =>
        testPrisma.utilisateurs.create({
          data: {
            userId: `TEST_PERF_${Date.now()}_${i}`,
            first_name: `Prof${i}`,
            last_name: `Test${i}`,
            email: `prof${i}.${Date.now()}@test.com`,
            nom_utilisateur: `prof${i}${Date.now()}`,
            role_id: 2,
            status_id: 2,
            grade_id: 1,
          },
        })
      );

      await Promise.all(createPromises);

      const startTime = Date.now();

      const professeurs = await testPrisma.utilisateurs.findMany({
        where: { role_id: 2 },
      });

      const duration = Date.now() - startTime;

      expect(professeurs.length).toBeGreaterThanOrEqual(21);
      expect(duration).toBeLessThan(1000); // Moins d'1 seconde
    });
  });
});
