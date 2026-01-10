import { jest } from "@jest/globals";
import { CoursRepository } from "../../../../db/clients/cours/cours.repository.js";
import MysqlConnector from "../../../../db/connector/mysqlconnector.js";
import { CoursReadRepository } from "../../../../db/clients/cours/repositories/read.repository.js";
import { CoursWriteRepository } from "../../../../db/clients/cours/repositories/write.repository.js";
import { CoursInscriptionsRepository } from "../../../../db/clients/cours/repositories/inscriptions.repository.js";
import { CoursStatisticsRepository } from "../../../../db/clients/cours/repositories/statistics.repository.js";
import { CoursValidationRepository } from "../../../../db/clients/cours/repositories/validation.repository.js";

// Mock MySQL Connector and sub-repositories
jest.mock("../../../../db/connector/mysqlconnector.js");
jest.mock("../../../../db/clients/cours/repositories/read.repository.js");
jest.mock("../../../../db/clients/cours/repositories/write.repository.js");
jest.mock(
  "../../../../db/clients/cours/repositories/inscriptions.repository.js",
);
jest.mock("../../../../db/clients/cours/repositories/statistics.repository.js");
jest.mock("../../../../db/clients/cours/repositories/validation.repository.js");

describe("CoursRepository", () => {
  let coursRepository: CoursRepository;
  let mockMysqlConnector: any;
  let mockReadRepo: any;
  let mockWriteRepo: any;
  let mockInscriptionsRepo: any;
  let mockStatisticsRepo: any;
  let mockValidationRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMysqlConnector = {
      query: jest.fn(),
      getInstance: jest.fn(),
    };
    (MysqlConnector.getInstance as jest.Mock).mockReturnValue(
      mockMysqlConnector,
    );

    coursRepository = new CoursRepository();

    mockReadRepo = (CoursReadRepository as jest.Mock).mock.instances[0];
    mockWriteRepo = (CoursWriteRepository as jest.Mock).mock.instances[0];
    mockInscriptionsRepo = (CoursInscriptionsRepository as jest.Mock).mock
      .instances[0];
    mockStatisticsRepo = (CoursStatisticsRepository as jest.Mock).mock
      .instances[0];
    mockValidationRepo = (CoursValidationRepository as jest.Mock).mock
      .instances[0];
  });

  describe("Constructor", () => {
    it("should create instance with all sub-repositories", () => {
      expect(coursRepository).toBeInstanceOf(CoursRepository);
      expect(MysqlConnector.getInstance).toHaveBeenCalled();
      expect(CoursReadRepository).toHaveBeenCalled();
      expect(CoursWriteRepository).toHaveBeenCalled();
      expect(CoursInscriptionsRepository).toHaveBeenCalled();
      expect(CoursStatisticsRepository).toHaveBeenCalled();
      expect(CoursValidationRepository).toHaveBeenCalled();
    });
  });

  describe("Read Operations - Basic", () => {
    it("should find all cours", async () => {
      const mockCours = [
        { id: 1, titre: "Yoga", date: new Date(), capacite: 20 },
        { id: 2, titre: "Pilates", date: new Date(), capacite: 15 },
      ];
      mockReadRepo.findAll = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.findAll();

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.findAll).toHaveBeenCalled();
    });

    it("should find cours by id", async () => {
      const mockCours = { id: 1, titre: "Yoga", capacite: 20 };
      mockReadRepo.findById = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.findById(1);

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.findById).toHaveBeenCalledWith(1);
    });

    it("should return null when cours not found", async () => {
      mockReadRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await coursRepository.findById(999);

      expect(result).toBeNull();
    });

    it("should find cours by week", async () => {
      const mockCours = [{ id: 1, titre: "Yoga", semaine: 1 }];
      mockReadRepo.findByWeek = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.findByWeek(1, 2024);

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.findByWeek).toHaveBeenCalledWith(1, 2024);
    });

    it("should find cours by date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const mockCours = [{ id: 1, titre: "Yoga" }];
      mockReadRepo.findByDateRange = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.findByDateRange(startDate, endDate);

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
    });

    it("should find future cours", async () => {
      const mockCours = [{ id: 1, titre: "Yoga", date: new Date() }];
      mockReadRepo.findFutureCours = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.findFutureCours();

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.findFutureCours).toHaveBeenCalled();
    });
  });

  describe("Read Operations - With Relations", () => {
    it("should find cours with professeurs", async () => {
      const mockCours = {
        id: 1,
        titre: "Yoga",
        professeurs: [{ id: 1, nom: "Dupont" }],
      };
      mockReadRepo.findByIdWithProfesseurs = jest
        .fn()
        .mockResolvedValue(mockCours);

      const result = await coursRepository.findByIdWithProfesseurs(1);

      expect(result).toEqual(mockCours);
      expect(result.professeurs).toHaveLength(1);
    });

    it("should find all cours with professeurs", async () => {
      const mockCours = [
        { id: 1, titre: "Yoga", professeurs: [] },
        { id: 2, titre: "Pilates", professeurs: [] },
      ];
      mockReadRepo.findAllWithProfesseurs = jest
        .fn()
        .mockResolvedValue(mockCours);

      const result = await coursRepository.findAllWithProfesseurs();

      expect(result).toEqual(mockCours);
    });

    it("should get participants by cours", async () => {
      const mockParticipants = [
        { id: 1, nom: "User1", inscrit_le: new Date() },
        { id: 2, nom: "User2", inscrit_le: new Date() },
      ];
      mockReadRepo.getParticipantsByCours = jest
        .fn()
        .mockResolvedValue(mockParticipants);

      const result = await coursRepository.getParticipantsByCours(1);

      expect(result).toEqual(mockParticipants);
      expect(result).toHaveLength(2);
    });

    it("should get cours by user", async () => {
      const mockCours = [{ id: 1, titre: "Yoga", inscrit_le: new Date() }];
      mockReadRepo.getCoursByUser = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.getCoursByUser(1);

      expect(result).toEqual(mockCours);
    });
  });

  describe("Read Operations - Cours Recurrents", () => {
    it("should find all cours recurrents", async () => {
      const mockCoursRecurrents = [
        {
          id: 1,
          titre: "Yoga hebdomadaire",
          jour_semaine: 1,
          heure_debut: "10:00",
        },
        {
          id: 2,
          titre: "Pilates hebdomadaire",
          jour_semaine: 3,
          heure_debut: "14:00",
        },
      ];
      mockReadRepo.findAllCoursRecurrents = jest
        .fn()
        .mockResolvedValue(mockCoursRecurrents);

      const result = await coursRepository.findAllCoursRecurrents();

      expect(result).toEqual(mockCoursRecurrents);
      expect(result).toHaveLength(2);
    });

    it("should find cours recurrent by id", async () => {
      const mockCoursRecurrent = { id: 1, titre: "Yoga", jour_semaine: 1 };
      mockReadRepo.findCoursRecurrentById = jest
        .fn()
        .mockResolvedValue(mockCoursRecurrent);

      const result = await coursRepository.findCoursRecurrentById(1);

      expect(result).toEqual(mockCoursRecurrent);
    });

    it("should find cours recurrents by day", async () => {
      const mockCours = [{ id: 1, titre: "Yoga", jour_semaine: 1 }];
      mockReadRepo.findCoursRecurrentsByDay = jest
        .fn()
        .mockResolvedValue(mockCours);

      const result = await coursRepository.findCoursRecurrentsByDay(1);

      expect(result).toEqual(mockCours);
    });

    it("should get jours de cours", async () => {
      const mockJours = [1, 3, 5]; // Lundi, Mercredi, Vendredi
      mockReadRepo.getJoursDeCours = jest.fn().mockResolvedValue(mockJours);

      const result = await coursRepository.getJoursDeCours();

      expect(result).toEqual(mockJours);
      expect(result).toHaveLength(3);
    });
  });

  describe("Write Operations - Create", () => {
    it("should create cours successfully", async () => {
      const coursData = {
        titre: "Nouveau Yoga",
        date: new Date(),
        capacite: 20,
        professeur_id: 1,
      };
      mockWriteRepo.createCours = jest.fn().mockResolvedValue(1);

      const result = await coursRepository.createCours(coursData);

      expect(result).toBe(1);
      expect(mockWriteRepo.createCours).toHaveBeenCalledWith(coursData);
    });

    it("should create cours recurrent", async () => {
      const coursRecurrentData = {
        titre: "Yoga hebdomadaire",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
        capacite: 20,
      };
      mockWriteRepo.createCoursRecurrent = jest.fn().mockResolvedValue(1);

      const result =
        await coursRepository.createCoursRecurrent(coursRecurrentData);

      expect(result).toBe(1);
      expect(mockWriteRepo.createCoursRecurrent).toHaveBeenCalledWith(
        coursRecurrentData,
      );
    });

    it("should handle creation errors", async () => {
      const coursData = { titre: "Yoga", date: new Date(), capacite: 20 };
      const dbError = new Error("Creation failed");
      mockWriteRepo.createCours = jest.fn().mockRejectedValue(dbError);

      await expect(coursRepository.createCours(coursData)).rejects.toThrow(
        "Creation failed",
      );
    });
  });

  describe("Write Operations - Update", () => {
    it("should update cours", async () => {
      const updateData = { titre: "Yoga modifié", capacite: 25 };
      mockWriteRepo.updateCours = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateCours(1, updateData);

      expect(result).toBe(true);
      expect(mockWriteRepo.updateCours).toHaveBeenCalledWith(1, updateData);
    });

    it("should update cours actif status", async () => {
      mockWriteRepo.updateCoursActif = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateCoursActif(1, false);

      expect(result).toBe(true);
      expect(mockWriteRepo.updateCoursActif).toHaveBeenCalledWith(1, false);
    });

    it("should update cours capacite", async () => {
      mockWriteRepo.updateCoursCapacite = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateCoursCapacite(1, 30);

      expect(result).toBe(true);
      expect(mockWriteRepo.updateCoursCapacite).toHaveBeenCalledWith(1, 30);
    });

    it("should update cours recurrent", async () => {
      const updateData = { titre: "Yoga modifié", capacite: 25 };
      mockWriteRepo.updateCoursRecurrent = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateCoursRecurrent(1, updateData);

      expect(result).toBe(true);
    });

    it("should return false when cours not found for update", async () => {
      mockWriteRepo.updateCours = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.updateCours(999, { titre: "Test" });

      expect(result).toBe(false);
    });
  });

  describe("Write Operations - Delete", () => {
    it("should delete cours", async () => {
      mockWriteRepo.deleteCours = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.deleteCours(1);

      expect(result).toBe(true);
      expect(mockWriteRepo.deleteCours).toHaveBeenCalledWith(1);
    });

    it("should soft delete cours", async () => {
      mockWriteRepo.softDeleteCours = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.softDeleteCours(1);

      expect(result).toBe(true);
    });

    it("should delete cours recurrent", async () => {
      mockWriteRepo.deleteCoursRecurrent = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.deleteCoursRecurrent(1);

      expect(result).toBe(true);
    });

    it("should handle deletion errors", async () => {
      const dbError = new Error("Deletion failed");
      mockWriteRepo.deleteCours = jest.fn().mockRejectedValue(dbError);

      await expect(coursRepository.deleteCours(1)).rejects.toThrow(
        "Deletion failed",
      );
    });
  });

  describe("Write Operations - Professeurs", () => {
    it("should associate professeur to cours recurrent", async () => {
      mockWriteRepo.associerProfesseur = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.associerProfesseur(1, 2);

      expect(result).toBe(true);
      expect(mockWriteRepo.associerProfesseur).toHaveBeenCalledWith(1, 2);
    });

    it("should associate multiple professeurs", async () => {
      const professeurIds = [1, 2, 3];
      mockWriteRepo.associerProfesseurs = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.associerProfesseurs(
        1,
        professeurIds,
      );

      expect(result).toBe(true);
      expect(mockWriteRepo.associerProfesseurs).toHaveBeenCalledWith(
        1,
        professeurIds,
      );
    });

    it("should delete professeurs from cours recurrent", async () => {
      mockWriteRepo.deleteProfesseursByCoursRecurrent = jest
        .fn()
        .mockResolvedValue(2);

      const result = await coursRepository.deleteProfesseursByCoursRecurrent(1);

      expect(result).toBe(2);
    });

    it("should create new professeur", async () => {
      const professeurData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@example.com",
      };
      mockWriteRepo.createProfesseur = jest.fn().mockResolvedValue(1);

      const result = await coursRepository.createProfesseur(professeurData);

      expect(result).toBe(1);
    });
  });

  describe("Inscriptions Operations - Create/Delete", () => {
    it("should inscrire utilisateur to cours", async () => {
      mockInscriptionsRepo.inscrireUtilisateur = jest.fn().mockResolvedValue(1);

      const result = await coursRepository.inscrireUtilisateur(1, 1);

      expect(result).toBe(1);
      expect(mockInscriptionsRepo.inscrireUtilisateur).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it("should desinscrire utilisateur from cours", async () => {
      mockInscriptionsRepo.desinscrireUtilisateur = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.desinscrireUtilisateur(1);

      expect(result).toBe(true);
    });

    it("should delete inscriptions by cours", async () => {
      mockInscriptionsRepo.deleteInscriptionsByCours = jest
        .fn()
        .mockResolvedValue(5);

      const result = await coursRepository.deleteInscriptionsByCours(1);

      expect(result).toBe(5);
    });

    it("should delete inscriptions by user", async () => {
      mockInscriptionsRepo.deleteInscriptionsByUser = jest
        .fn()
        .mockResolvedValue(3);

      const result = await coursRepository.deleteInscriptionsByUser(1);

      expect(result).toBe(3);
    });

    it("should handle inscription errors", async () => {
      const dbError = new Error("Inscription failed");
      mockInscriptionsRepo.inscrireUtilisateur = jest
        .fn()
        .mockRejectedValue(dbError);

      await expect(coursRepository.inscrireUtilisateur(1, 1)).rejects.toThrow(
        "Inscription failed",
      );
    });
  });

  describe("Inscriptions Operations - Presence", () => {
    it("should marquer presence", async () => {
      mockInscriptionsRepo.marquerPresence = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.marquerPresence(1, true);

      expect(result).toBe(true);
      expect(mockInscriptionsRepo.marquerPresence).toHaveBeenCalledWith(
        1,
        true,
      );
    });

    it("should valider presence", async () => {
      mockInscriptionsRepo.validerPresence = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.validerPresence(1);

      expect(result).toBe(true);
    });

    it("should annuler presence", async () => {
      mockInscriptionsRepo.annulerPresence = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.annulerPresence(1);

      expect(result).toBe(true);
    });

    it("should update inscription status", async () => {
      mockInscriptionsRepo.updateInscriptionStatus = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.updateInscriptionStatus(
        1,
        "confirme",
      );

      expect(result).toBe(true);
    });
  });

  describe("Inscriptions Operations - Read", () => {
    it("should verifier inscription", async () => {
      mockInscriptionsRepo.verifierInscription = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.verifierInscription(1, 1);

      expect(result).toBe(true);
      expect(mockInscriptionsRepo.verifierInscription).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it("should get inscription by id", async () => {
      const mockInscription = { id: 1, cours_id: 1, utilisateur_id: 1 };
      mockInscriptionsRepo.getInscriptionById = jest
        .fn()
        .mockResolvedValue(mockInscription);

      const result = await coursRepository.getInscriptionById(1);

      expect(result).toEqual(mockInscription);
    });

    it("should get inscriptions by user", async () => {
      const mockInscriptions = [
        { id: 1, cours_id: 1, utilisateur_id: 1 },
        { id: 2, cours_id: 2, utilisateur_id: 1 },
      ];
      mockInscriptionsRepo.getInscriptionsByUser = jest
        .fn()
        .mockResolvedValue(mockInscriptions);

      const result = await coursRepository.getInscriptionsByUser(1);

      expect(result).toEqual(mockInscriptions);
      expect(result).toHaveLength(2);
    });

    it("should get inscriptions by cours", async () => {
      const mockInscriptions = [
        { id: 1, cours_id: 1, utilisateur_id: 1 },
        { id: 2, cours_id: 1, utilisateur_id: 2 },
      ];
      mockInscriptionsRepo.getInscriptionsByCours = jest
        .fn()
        .mockResolvedValue(mockInscriptions);

      const result = await coursRepository.getInscriptionsByCours(1);

      expect(result).toEqual(mockInscriptions);
    });

    it("should count presents by cours", async () => {
      mockInscriptionsRepo.countPresentsByCours = jest
        .fn()
        .mockResolvedValue(15);

      const result = await coursRepository.countPresentsByCours(1);

      expect(result).toBe(15);
    });

    it("should count absents by cours", async () => {
      mockInscriptionsRepo.countAbsentsByCours = jest.fn().mockResolvedValue(5);

      const result = await coursRepository.countAbsentsByCours(1);

      expect(result).toBe(5);
    });
  });

  describe("Statistics Operations", () => {
    it("should get statistiques presence cours", async () => {
      const mockStats = {
        total_inscrits: 20,
        total_presents: 15,
        taux_presence: 0.75,
      };
      mockStatisticsRepo.getStatistiquesPresenceCours = jest
        .fn()
        .mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesPresenceCours(1);

      expect(result).toEqual(mockStats);
    });

    it("should get statistiques globales", async () => {
      const mockStats = {
        total_cours: 100,
        total_inscriptions: 500,
        taux_occupation_moyen: 0.85,
      };
      mockStatisticsRepo.getStatistiquesGlobales = jest
        .fn()
        .mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesGlobales();

      expect(result).toEqual(mockStats);
    });

    it("should get statistiques presence utilisateur", async () => {
      const mockStats = {
        total_inscriptions: 10,
        total_presences: 8,
        taux_presence: 0.8,
      };
      mockStatisticsRepo.getStatistiquesPresenceUtilisateur = jest
        .fn()
        .mockResolvedValue(mockStats);

      const result =
        await coursRepository.getStatistiquesPresenceUtilisateur(1);

      expect(result).toEqual(mockStats);
    });

    it("should get statistiques par type cours", async () => {
      const mockStats = [
        { type: "Yoga", count: 50 },
        { type: "Pilates", count: 30 },
      ];
      mockStatisticsRepo.getStatistiquesParTypeCours = jest
        .fn()
        .mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesParTypeCours();

      expect(result).toEqual(mockStats);
    });

    it("should get cours plus populaires", async () => {
      const mockCours = [
        { id: 1, titre: "Yoga", inscriptions: 100 },
        { id: 2, titre: "Pilates", inscriptions: 75 },
      ];
      mockStatisticsRepo.getCoursPlusPopulaires = jest
        .fn()
        .mockResolvedValue(mockCours);

      const result = await coursRepository.getCoursPlusPopulaires(10);

      expect(result).toEqual(mockCours);
    });

    it("should count total cours", async () => {
      mockStatisticsRepo.countTotalCours = jest.fn().mockResolvedValue(100);

      const result = await coursRepository.countTotalCours();

      expect(result).toBe(100);
    });

    it("should count total participants", async () => {
      mockStatisticsRepo.countTotalParticipants = jest
        .fn()
        .mockResolvedValue(500);

      const result = await coursRepository.countTotalParticipants();

      expect(result).toBe(500);
    });
  });

  describe("Validation Operations", () => {
    it("should check if inscription exists", async () => {
      mockValidationRepo.inscriptionExists = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.inscriptionExists(1, 1);

      expect(result).toBe(true);
      expect(mockValidationRepo.inscriptionExists).toHaveBeenCalledWith(1, 1);
    });

    it("should check if cours exists", async () => {
      mockValidationRepo.coursExists = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.coursExists(1);

      expect(result).toBe(true);
    });

    it("should check if cours recurrent exists", async () => {
      mockValidationRepo.coursRecurrentExists = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.coursRecurrentExists(1);

      expect(result).toBe(true);
    });

    it("should check if professeur exists", async () => {
      mockValidationRepo.professeurExists = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.professeurExists(1);

      expect(result).toBe(true);
    });

    it("should check if user can register", async () => {
      mockValidationRepo.checkUserCanRegister = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.checkUserCanRegister(1, 1);

      expect(result).toBe(true);
    });

    it("should check if cours is full", async () => {
      mockValidationRepo.checkCoursIsFull = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.checkCoursIsFull(1);

      expect(result).toBe(false);
    });

    it("should check duplicate inscription", async () => {
      mockValidationRepo.checkDuplicateInscription = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.checkDuplicateInscription(1, 1);

      expect(result).toBe(false);
    });

    it("should validate capacite", async () => {
      mockValidationRepo.validateCapacite = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.validateCapacite(20);

      expect(result).toBe(true);
    });

    it("should check if cours is past", async () => {
      mockValidationRepo.checkCoursIsPast = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.checkCoursIsPast(1);

      expect(result).toBe(false);
    });
  });

  describe("Additional Validation Operations - Complete Coverage", () => {
    it("should validate horaires", async () => {
      mockValidationRepo.validateHoraires = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.validateHoraires("10:00", "11:00");

      expect(result).toBe(true);
      expect(mockValidationRepo.validateHoraires).toHaveBeenCalledWith(
        "10:00",
        "11:00",
      );
    });

    it("should check horaire conflict", async () => {
      const dateCours = new Date("2024-01-15");
      mockValidationRepo.checkHoraireConflict = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.checkHoraireConflict(
        dateCours,
        "10:00",
        "11:00",
      );

      expect(result).toBe(false);
      expect(mockValidationRepo.checkHoraireConflict).toHaveBeenCalledWith(
        dateCours,
        "10:00",
        "11:00",
      );
    });

    it("should check horaire conflict recurrent", async () => {
      mockValidationRepo.checkHoraireConflictRecurrent = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.checkHoraireConflictRecurrent(
        "lundi",
        "10:00",
        "11:00",
      );

      expect(result).toBe(false);
      expect(
        mockValidationRepo.checkHoraireConflictRecurrent,
      ).toHaveBeenCalledWith("lundi", "10:00", "11:00");
    });

    it("should validate jour semaine", async () => {
      mockValidationRepo.validateJourSemaine = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.validateJourSemaine("lundi");

      expect(result).toBe(true);
      expect(mockValidationRepo.validateJourSemaine).toHaveBeenCalledWith(
        "lundi",
      );
    });

    it("should count user active inscriptions", async () => {
      mockValidationRepo.countUserActiveInscriptions = jest
        .fn()
        .mockResolvedValue(5);

      const result = await coursRepository.countUserActiveInscriptions(1);

      expect(result).toBe(5);
      expect(
        mockValidationRepo.countUserActiveInscriptions,
      ).toHaveBeenCalledWith(1);
    });

    it("should count cours by day", async () => {
      const dateCours = new Date("2024-01-15");
      mockValidationRepo.countCoursByDay = jest.fn().mockResolvedValue(3);

      const result = await coursRepository.countCoursByDay(dateCours);

      expect(result).toBe(3);
      expect(mockValidationRepo.countCoursByDay).toHaveBeenCalledWith(
        dateCours,
      );
    });

    it("should count cours recurrents by day", async () => {
      mockValidationRepo.countCoursRecurrentsByDay = jest
        .fn()
        .mockResolvedValue(2);

      const result = await coursRepository.countCoursRecurrentsByDay("lundi");

      expect(result).toBe(2);
      expect(mockValidationRepo.countCoursRecurrentsByDay).toHaveBeenCalledWith(
        "lundi",
      );
    });

    it("should validate inscription completely", async () => {
      const validationResult = {
        isValid: true,
        errors: [],
      };
      mockValidationRepo.validateInscription = jest
        .fn()
        .mockResolvedValue(validationResult);

      const result = await coursRepository.validateInscription(1, 1);

      expect(result).toEqual(validationResult);
      expect(mockValidationRepo.validateInscription).toHaveBeenCalledWith(1, 1);
    });

    it("should validate cours recurrent completely", async () => {
      const validationResult = {
        isValid: true,
        errors: [],
      };
      mockValidationRepo.validateCoursRecurrent = jest
        .fn()
        .mockResolvedValue(validationResult);

      const result = await coursRepository.validateCoursRecurrent(
        "lundi",
        "10:00",
        "11:00",
        "yoga",
        20,
      );

      expect(result).toEqual(validationResult);
      expect(mockValidationRepo.validateCoursRecurrent).toHaveBeenCalledWith(
        "lundi",
        "10:00",
        "11:00",
        "yoga",
        20,
      );
    });
  });

  describe("Read Operations - Additional Methods", () => {
    it("should find cours recurrent by day and time", async () => {
      const mockCours = { id: 1, jour_semaine: 1, heure_debut: "10:00" };
      mockReadRepo.findCoursRecurrentByDayTime = jest
        .fn()
        .mockResolvedValue(mockCours);

      const result = await coursRepository.findCoursRecurrentByDayTime(
        1,
        "10:00",
        "11:00",
      );

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.findCoursRecurrentByDayTime).toHaveBeenCalledWith(
        1,
        "10:00",
        "11:00",
      );
    });

    it("should get jours de cours par semaine", async () => {
      const mockJours = [1, 3, 5];
      mockReadRepo.getJoursDeCoursParSemaine = jest
        .fn()
        .mockResolvedValue(mockJours);

      const result = await coursRepository.getJoursDeCoursParSemaine(1, 2024);

      expect(result).toEqual(mockJours);
      expect(mockReadRepo.getJoursDeCoursParSemaine).toHaveBeenCalledWith(
        1,
        2024,
      );
    });

    it("should get cours futurs by user", async () => {
      const mockCours = [{ id: 1, titre: "Yoga", date: new Date() }];
      mockReadRepo.getCoursFutursByUser = jest
        .fn()
        .mockResolvedValue(mockCours);

      const result = await coursRepository.getCoursFutursByUser(1);

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.getCoursFutursByUser).toHaveBeenCalledWith(1);
    });

    it("should get semaines avec cours", async () => {
      const mockSemaines = [{ semaine: 1, annee: 2024, count: 5 }];
      mockReadRepo.getSemainesAvecCours = jest
        .fn()
        .mockResolvedValue(mockSemaines);

      const result = await coursRepository.getSemainesAvecCours();

      expect(result).toEqual(mockSemaines);
      expect(mockReadRepo.getSemainesAvecCours).toHaveBeenCalled();
    });

    it("should get semaine info", async () => {
      const mockInfo = {
        semaine: 1,
        annee: 2024,
        premier_jour: new Date(),
        dernier_jour: new Date(),
      };
      mockReadRepo.getSemaineInfo = jest.fn().mockResolvedValue(mockInfo);

      const result = await coursRepository.getSemaineInfo(1, 2024);

      expect(result).toEqual(mockInfo);
      expect(mockReadRepo.getSemaineInfo).toHaveBeenCalledWith(1, 2024);
    });

    it("should get professeurs by cours recurrent", async () => {
      const mockProfs = [{ id: 1, nom: "Dupont" }];
      mockReadRepo.getProfesseursByCoursRecurrent = jest
        .fn()
        .mockResolvedValue(mockProfs);

      const result = await coursRepository.getProfesseursByCoursRecurrent(1);

      expect(result).toEqual(mockProfs);
      expect(mockReadRepo.getProfesseursByCoursRecurrent).toHaveBeenCalledWith(
        1,
      );
    });

    it("should find professeur by name", async () => {
      const mockProf = { id: 1, nom: "Dupont" };
      mockReadRepo.findProfesseurByName = jest.fn().mockResolvedValue(mockProf);

      const result = await coursRepository.findProfesseurByName("Dupont");

      expect(result).toEqual(mockProf);
      expect(mockReadRepo.findProfesseurByName).toHaveBeenCalledWith("Dupont");
    });

    it("should get all professeurs", async () => {
      const mockProfs = [
        { id: 1, nom: "Dupont" },
        { id: 2, nom: "Martin" },
      ];
      mockReadRepo.getAllProfesseurs = jest.fn().mockResolvedValue(mockProfs);

      const result = await coursRepository.getAllProfesseurs();

      expect(result).toEqual(mockProfs);
      expect(mockReadRepo.getAllProfesseurs).toHaveBeenCalled();
    });

    it("should count inscriptions by cours", async () => {
      mockReadRepo.countInscriptionsByCours = jest.fn().mockResolvedValue(15);

      const result = await coursRepository.countInscriptionsByCours(1);

      expect(result).toBe(15);
      expect(mockReadRepo.countInscriptionsByCours).toHaveBeenCalledWith(1);
    });

    it("should check cours disponibilite", async () => {
      mockReadRepo.checkCoursDisponibilite = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.checkCoursDisponibilite(1);

      expect(result).toBe(true);
      expect(mockReadRepo.checkCoursDisponibilite).toHaveBeenCalledWith(1);
    });

    it("should get cours disponibles", async () => {
      const mockCours = [{ id: 1, titre: "Yoga", places_restantes: 5 }];
      mockReadRepo.getCoursDisponibles = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.getCoursDisponibles();

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.getCoursDisponibles).toHaveBeenCalled();
    });
  });

  describe("Write Operations - Additional Methods", () => {
    it("should update cours recurrent type", async () => {
      mockWriteRepo.updateCoursRecurrentType = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.updateCoursRecurrentType(
        1,
        "pilates",
      );

      expect(result).toBe(true);
      expect(mockWriteRepo.updateCoursRecurrentType).toHaveBeenCalledWith(
        1,
        "pilates",
      );
    });

    it("should update cours recurrent horaires", async () => {
      mockWriteRepo.updateCoursRecurrentHoraires = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.updateCoursRecurrentHoraires(
        1,
        "10:00",
        "11:00",
      );

      expect(result).toBe(true);
      expect(mockWriteRepo.updateCoursRecurrentHoraires).toHaveBeenCalledWith(
        1,
        "10:00",
        "11:00",
      );
    });

    it("should soft delete cours recurrent", async () => {
      mockWriteRepo.softDeleteCoursRecurrent = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.softDeleteCoursRecurrent(1);

      expect(result).toBe(true);
      expect(mockWriteRepo.softDeleteCoursRecurrent).toHaveBeenCalledWith(1);
    });

    it("should generate cours from recurrent", async () => {
      mockWriteRepo.generateCoursFromRecurrent = jest.fn().mockResolvedValue(5);

      const result = await coursRepository.generateCoursFromRecurrent(1);

      expect(result).toBe(5);
      expect(mockWriteRepo.generateCoursFromRecurrent).toHaveBeenCalledWith(1);
    });

    it("should generate week cours", async () => {
      mockWriteRepo.generateWeekCours = jest.fn().mockResolvedValue(10);

      const result = await coursRepository.generateWeekCours(1, 2024);

      expect(result).toBe(10);
      expect(mockWriteRepo.generateWeekCours).toHaveBeenCalledWith(1, 2024);
    });

    it("should delete professeur from cours recurrent", async () => {
      mockWriteRepo.deleteProfesseurFromCoursRecurrent = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.deleteProfesseurFromCoursRecurrent(
        1,
        2,
      );

      expect(result).toBe(true);
      expect(
        mockWriteRepo.deleteProfesseurFromCoursRecurrent,
      ).toHaveBeenCalledWith(1, 2);
    });
  });

  describe("Inscriptions Operations - Additional Methods", () => {
    it("should desinscrire utilisateur by cours", async () => {
      mockInscriptionsRepo.desinscrireUtilisateurByCours = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.desinscrireUtilisateurByCours(1, 1);

      expect(result).toBe(true);
      expect(
        mockInscriptionsRepo.desinscrireUtilisateurByCours,
      ).toHaveBeenCalledWith(1, 1);
    });

    it("should update inscription notes", async () => {
      mockInscriptionsRepo.updateInscriptionNotes = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.updateInscriptionNotes(
        1,
        "Notes importantes",
      );

      expect(result).toBe(true);
      expect(mockInscriptionsRepo.updateInscriptionNotes).toHaveBeenCalledWith(
        1,
        "Notes importantes",
      );
    });

    it("should cleanup old inscriptions", async () => {
      mockInscriptionsRepo.cleanupOldInscriptions = jest
        .fn()
        .mockResolvedValue(15);

      const result = await coursRepository.cleanupOldInscriptions();

      expect(result).toBe(15);
      expect(mockInscriptionsRepo.cleanupOldInscriptions).toHaveBeenCalled();
    });
  });

  describe("Statistics Operations - Additional Methods", () => {
    it("should get statistiques tous utilisateurs", async () => {
      const mockStats = [
        { user_id: 1, total_inscriptions: 10, taux_presence: 0.8 },
        { user_id: 2, total_inscriptions: 5, taux_presence: 0.9 },
      ];
      mockStatisticsRepo.getStatistiquesTousUtilisateurs = jest
        .fn()
        .mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesTousUtilisateurs();

      expect(result).toEqual(mockStats);
      expect(
        mockStatisticsRepo.getStatistiquesTousUtilisateurs,
      ).toHaveBeenCalled();
    });

    it("should get statistiques par jour semaine", async () => {
      const mockStats = [
        { jour: "Lundi", count: 10 },
        { jour: "Mercredi", count: 8 },
      ];
      mockStatisticsRepo.getStatistiquesParJourSemaine = jest
        .fn()
        .mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesParJourSemaine();

      expect(result).toEqual(mockStats);
      expect(
        mockStatisticsRepo.getStatistiquesParJourSemaine,
      ).toHaveBeenCalled();
    });

    it("should get taux presence moyen", async () => {
      mockStatisticsRepo.getTauxPresenceMoyen = jest
        .fn()
        .mockResolvedValue(0.85);

      const result = await coursRepository.getTauxPresenceMoyen();

      expect(result).toBe(0.85);
      expect(mockStatisticsRepo.getTauxPresenceMoyen).toHaveBeenCalled();
    });

    it("should get utilisateurs assidus", async () => {
      const mockUsers = [
        { user_id: 1, nom: "Dupont", taux_presence: 0.95 },
        { user_id: 2, nom: "Martin", taux_presence: 0.92 },
      ];
      mockStatisticsRepo.getUtilisateursAssidus = jest
        .fn()
        .mockResolvedValue(mockUsers);

      const result = await coursRepository.getUtilisateursAssidus(10);

      expect(result).toEqual(mockUsers);
      expect(mockStatisticsRepo.getUtilisateursAssidus).toHaveBeenCalledWith(
        10,
      );
    });

    it("should count cours par semaine", async () => {
      mockStatisticsRepo.countCoursParSemaine = jest.fn().mockResolvedValue(25);

      const result = await coursRepository.countCoursParSemaine(1, 2024);

      expect(result).toBe(25);
      expect(mockStatisticsRepo.countCoursParSemaine).toHaveBeenCalledWith(
        1,
        2024,
      );
    });

    it("should get statistiques periode", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const mockStats = {
        total_cours: 50,
        total_inscriptions: 200,
        taux_occupation: 0.8,
      };
      mockStatisticsRepo.getStatistiquesPeriode = jest
        .fn()
        .mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesPeriode(
        startDate,
        endDate,
      );

      expect(result).toEqual(mockStats);
      expect(mockStatisticsRepo.getStatistiquesPeriode).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
    });
  });

  describe("Validation Operations - Additional Methods", () => {
    it("should check inscription exists by id", async () => {
      mockValidationRepo.inscriptionExistsById = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.inscriptionExistsById(1);

      expect(result).toBe(true);
      expect(mockValidationRepo.inscriptionExistsById).toHaveBeenCalledWith(1);
    });

    it("should check professeur exists by name", async () => {
      mockValidationRepo.professeurExistsByName = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.professeurExistsByName("Dupont");

      expect(result).toBe(true);
      expect(mockValidationRepo.professeurExistsByName).toHaveBeenCalledWith(
        "Dupont",
      );
    });

    it("should check user exists and active", async () => {
      mockValidationRepo.userExistsAndActive = jest
        .fn()
        .mockResolvedValue(true);

      const result = await coursRepository.userExistsAndActive(1);

      expect(result).toBe(true);
      expect(mockValidationRepo.userExistsAndActive).toHaveBeenCalledWith(1);
    });

    it("should check duplicate cours recurrent", async () => {
      mockValidationRepo.checkDuplicateCoursRecurrent = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.checkDuplicateCoursRecurrent(
        1,
        "10:00",
        "11:00",
        "yoga",
      );

      expect(result).toBe(false);
      expect(
        mockValidationRepo.checkDuplicateCoursRecurrent,
      ).toHaveBeenCalledWith(1, "10:00", "11:00", "yoga");
    });

    it("should check duplicate cours", async () => {
      const dateCours = new Date("2024-01-15");
      mockValidationRepo.checkDuplicateCours = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.checkDuplicateCours(
        dateCours,
        "10:00",
        "11:00",
        "yoga",
      );

      expect(result).toBe(false);
      expect(mockValidationRepo.checkDuplicateCours).toHaveBeenCalledWith(
        dateCours,
        "10:00",
        "11:00",
        "yoga",
      );
    });

    it("should validate cours date", async () => {
      const dateCours = new Date("2024-01-15");
      mockValidationRepo.validateCoursDate = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.validateCoursDate(dateCours);

      expect(result).toBe(true);
      expect(mockValidationRepo.validateCoursDate).toHaveBeenCalledWith(
        dateCours,
      );
    });

    it("should check can unregister", async () => {
      mockValidationRepo.checkCanUnregister = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.checkCanUnregister(1);

      expect(result).toBe(true);
      expect(mockValidationRepo.checkCanUnregister).toHaveBeenCalledWith(1);
    });

    it("should check cours capacity", async () => {
      mockValidationRepo.checkCoursCapacity = jest
        .fn()
        .mockResolvedValue({ isFull: false, available: 5 });

      const result = await coursRepository.checkCoursCapacity(1);

      expect(result).toEqual({ isFull: false, available: 5 });
      expect(mockValidationRepo.checkCoursCapacity).toHaveBeenCalledWith(1);
    });

    it("should check professeur already assigned", async () => {
      mockValidationRepo.checkProfesseurAlreadyAssigned = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.checkProfesseurAlreadyAssigned(1, 2);

      expect(result).toBe(false);
      expect(
        mockValidationRepo.checkProfesseurAlreadyAssigned,
      ).toHaveBeenCalledWith(1, 2);
    });

    it("should check professeur conflict", async () => {
      mockValidationRepo.checkProfesseurConflict = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.checkProfesseurConflict(
        1,
        new Date(),
        "10:00",
        "11:00",
      );

      expect(result).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null values", async () => {
      mockReadRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await coursRepository.findById(999);

      expect(result).toBeNull();
    });

    it("should handle empty arrays", async () => {
      mockReadRepo.findAll = jest.fn().mockResolvedValue([]);

      const result = await coursRepository.findAll();

      expect(result).toEqual([]);
    });

    it("should handle invalid dates", async () => {
      const invalidDate = new Date("invalid");
      mockReadRepo.findByDateRange = jest.fn().mockResolvedValue([]);

      const result = await coursRepository.findByDateRange(
        invalidDate,
        invalidDate,
      );

      expect(result).toEqual([]);
    });

    it("should handle negative capacite", async () => {
      mockValidationRepo.validateCapacite = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.validateCapacite(-5);

      expect(result).toBe(false);
    });

    it("should handle zero as cours id", async () => {
      mockValidationRepo.coursExists = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.coursExists(0);

      expect(result).toBe(false);
    });

    it("should handle empty string for jour semaine", async () => {
      mockValidationRepo.validateJourSemaine = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.validateJourSemaine("");

      expect(result).toBe(false);
    });

    it("should handle invalid time format", async () => {
      mockValidationRepo.validateHoraires = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.validateHoraires("25:00", "11:00");

      expect(result).toBe(false);
    });

    it("should handle very large user id", async () => {
      mockValidationRepo.userExistsAndActive = jest
        .fn()
        .mockResolvedValue(false);

      const result = await coursRepository.userExistsAndActive(999999999);

      expect(result).toBe(false);
    });
  });
});
