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
jest.mock("../../../../db/clients/cours/repositories/inscriptions.repository.js");
jest.mock("../../../../db/clients/cours/repositories/statistics.repository.js");
jest.mock("../../../../db/clients/cours/repositories/validation.repository.js");

describe("CoursRepository - Complete Coverage Tests", () => {
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
    (MysqlConnector.getInstance as jest.Mock).mockReturnValue(mockMysqlConnector);

    coursRepository = new CoursRepository();

    mockReadRepo = (CoursReadRepository as jest.Mock).mock.instances[0];
    mockWriteRepo = (CoursWriteRepository as jest.Mock).mock.instances[0];
    mockInscriptionsRepo = (CoursInscriptionsRepository as jest.Mock).mock.instances[0];
    mockStatisticsRepo = (CoursStatisticsRepository as jest.Mock).mock.instances[0];
    mockValidationRepo = (CoursValidationRepository as jest.Mock).mock.instances[0];
  });

  describe("Complete Read Operations Coverage", () => {
    it("should find cours recurrent by day and time successfully", async () => {
      const mockCours = {
        id: 1,
        titre: "Yoga Matinal",
        jour_semaine: 1,
        heure_debut: "08:00",
        heure_fin: "09:00",
      };
      mockReadRepo.findCoursRecurrentByDayTime = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.findCoursRecurrentByDayTime(1, "08:00", "09:00");

      expect(result).toEqual(mockCours);
      expect(mockReadRepo.findCoursRecurrentByDayTime).toHaveBeenCalledWith(1, "08:00", "09:00");
    });

    it("should return null when cours recurrent not found by day and time", async () => {
      mockReadRepo.findCoursRecurrentByDayTime = jest.fn().mockResolvedValue(null);

      const result = await coursRepository.findCoursRecurrentByDayTime(5, "20:00", "21:00");

      expect(result).toBeNull();
    });

    it("should get jours de cours par semaine successfully", async () => {
      const mockJours = [1, 2, 4]; // Lundi, Mardi, Jeudi
      mockReadRepo.getJoursDeCoursParSemaine = jest.fn().mockResolvedValue(mockJours);

      const result = await coursRepository.getJoursDeCoursParSemaine(5, 2024);

      expect(result).toEqual(mockJours);
      expect(mockReadRepo.getJoursDeCoursParSemaine).toHaveBeenCalledWith(5, 2024);
    });

    it("should return empty array when no jours de cours in week", async () => {
      mockReadRepo.getJoursDeCoursParSemaine = jest.fn().mockResolvedValue([]);

      const result = await coursRepository.getJoursDeCoursParSemaine(52, 2024);

      expect(result).toEqual([]);
    });

    it("should get cours futurs by user successfully", async () => {
      const mockCours = [
        { id: 1, titre: "Yoga", date: new Date("2024-12-20") },
        { id: 2, titre: "Pilates", date: new Date("2024-12-22") },
      ];
      mockReadRepo.getCoursFutursByUser = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.getCoursFutursByUser(1);

      expect(result).toEqual(mockCours);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when user has no future cours", async () => {
      mockReadRepo.getCoursFutursByUser = jest.fn().mockResolvedValue([]);

      const result = await coursRepository.getCoursFutursByUser(999);

      expect(result).toEqual([]);
    });

    it("should get semaines avec cours successfully", async () => {
      const mockSemaines = [
        { semaine: 1, annee: 2024, count: 5 },
        { semaine: 2, annee: 2024, count: 8 },
      ];
      mockReadRepo.getSemainesAvecCours = jest.fn().mockResolvedValue(mockSemaines);

      const result = await coursRepository.getSemainesAvecCours();

      expect(result).toEqual(mockSemaines);
      expect(result).toHaveLength(2);
    });

    it("should get semaine info successfully", async () => {
      const mockInfo = {
        semaine: 10,
        annee: 2024,
        premier_jour: new Date("2024-03-04"),
        dernier_jour: new Date("2024-03-10"),
        nombre_cours: 15,
      };
      mockReadRepo.getSemaineInfo = jest.fn().mockResolvedValue(mockInfo);

      const result = await coursRepository.getSemaineInfo(10, 2024);

      expect(result).toEqual(mockInfo);
    });

    it("should get professeurs by cours recurrent successfully", async () => {
      const mockProfs = [
        { id: 1, nom: "Dupont", prenom: "Jean" },
        { id: 2, nom: "Martin", prenom: "Marie" },
      ];
      mockReadRepo.getProfesseursByCoursRecurrent = jest.fn().mockResolvedValue(mockProfs);

      const result = await coursRepository.getProfesseursByCoursRecurrent(1);

      expect(result).toEqual(mockProfs);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when cours has no professeurs", async () => {
      mockReadRepo.getProfesseursByCoursRecurrent = jest.fn().mockResolvedValue([]);

      const result = await coursRepository.getProfesseursByCoursRecurrent(999);

      expect(result).toEqual([]);
    });

    it("should find professeur by name successfully", async () => {
      const mockProf = { id: 1, nom: "Dupont", prenom: "Jean", email: "jean.dupont@example.com" };
      mockReadRepo.findProfesseurByName = jest.fn().mockResolvedValue(mockProf);

      const result = await coursRepository.findProfesseurByName("Dupont");

      expect(result).toEqual(mockProf);
    });

    it("should return null when professeur not found by name", async () => {
      mockReadRepo.findProfesseurByName = jest.fn().mockResolvedValue(null);

      const result = await coursRepository.findProfesseurByName("Unknown");

      expect(result).toBeNull();
    });

    it("should get all professeurs successfully", async () => {
      const mockProfs = [
        { id: 1, nom: "Dupont" },
        { id: 2, nom: "Martin" },
        { id: 3, nom: "Bernard" },
      ];
      mockReadRepo.getAllProfesseurs = jest.fn().mockResolvedValue(mockProfs);

      const result = await coursRepository.getAllProfesseurs();

      expect(result).toEqual(mockProfs);
      expect(result).toHaveLength(3);
    });

    it("should count inscriptions by cours successfully", async () => {
      mockReadRepo.countInscriptionsByCours = jest.fn().mockResolvedValue(18);

      const result = await coursRepository.countInscriptionsByCours(1);

      expect(result).toBe(18);
    });

    it("should return 0 when cours has no inscriptions", async () => {
      mockReadRepo.countInscriptionsByCours = jest.fn().mockResolvedValue(0);

      const result = await coursRepository.countInscriptionsByCours(999);

      expect(result).toBe(0);
    });

    it("should check cours disponibilite successfully", async () => {
      mockReadRepo.checkCoursDisponibilite = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.checkCoursDisponibilite(1);

      expect(result).toBe(true);
    });

    it("should return false when cours not disponible", async () => {
      mockReadRepo.checkCoursDisponibilite = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.checkCoursDisponibilite(1);

      expect(result).toBe(false);
    });

    it("should get cours disponibles successfully", async () => {
      const mockCours = [
        { id: 1, titre: "Yoga", places_restantes: 5 },
        { id: 2, titre: "Pilates", places_restantes: 10 },
      ];
      mockReadRepo.getCoursDisponibles = jest.fn().mockResolvedValue(mockCours);

      const result = await coursRepository.getCoursDisponibles();

      expect(result).toEqual(mockCours);
    });

    it("should handle database errors on read operations", async () => {
      const dbError = new Error("Database read error");
      mockReadRepo.findAll = jest.fn().mockRejectedValue(dbError);

      await expect(coursRepository.findAll()).rejects.toThrow("Database read error");
    });
  });

  describe("Complete Write Operations Coverage", () => {
    it("should update cours recurrent type successfully", async () => {
      mockWriteRepo.updateCoursRecurrentType = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateCoursRecurrentType(1, "pilates");

      expect(result).toBe(true);
      expect(mockWriteRepo.updateCoursRecurrentType).toHaveBeenCalledWith(1, "pilates");
    });

    it("should update cours recurrent horaires successfully", async () => {
      mockWriteRepo.updateCoursRecurrentHoraires = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateCoursRecurrentHoraires(1, "09:00", "10:30");

      expect(result).toBe(true);
      expect(mockWriteRepo.updateCoursRecurrentHoraires).toHaveBeenCalledWith(1, "09:00", "10:30");
    });

    it("should soft delete cours recurrent successfully", async () => {
      mockWriteRepo.softDeleteCoursRecurrent = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.softDeleteCoursRecurrent(1);

      expect(result).toBe(true);
    });

    it("should generate cours from recurrent successfully", async () => {
      mockWriteRepo.generateCoursFromRecurrent = jest.fn().mockResolvedValue(4);

      const result = await coursRepository.generateCoursFromRecurrent(1);

      expect(result).toBe(4);
    });

    it("should return 0 when no cours generated from recurrent", async () => {
      mockWriteRepo.generateCoursFromRecurrent = jest.fn().mockResolvedValue(0);

      const result = await coursRepository.generateCoursFromRecurrent(999);

      expect(result).toBe(0);
    });

    it("should generate week cours successfully", async () => {
      mockWriteRepo.generateWeekCours = jest.fn().mockResolvedValue(12);

      const result = await coursRepository.generateWeekCours(5, 2024);

      expect(result).toBe(12);
      expect(mockWriteRepo.generateWeekCours).toHaveBeenCalledWith(5, 2024);
    });

    it("should delete professeur from cours recurrent successfully", async () => {
      mockWriteRepo.deleteProfesseurFromCoursRecurrent = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.deleteProfesseurFromCoursRecurrent(1, 2);

      expect(result).toBe(true);
    });

    it("should return false when professeur not found for deletion", async () => {
      mockWriteRepo.deleteProfesseurFromCoursRecurrent = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.deleteProfesseurFromCoursRecurrent(1, 999);

      expect(result).toBe(false);
    });

    it("should handle database errors on write operations", async () => {
      const dbError = new Error("Database write error");
      mockWriteRepo.createCours = jest.fn().mockRejectedValue(dbError);

      await expect(coursRepository.createCours({ titre: "Test" })).rejects.toThrow("Database write error");
    });
  });

  describe("Complete Inscriptions Operations Coverage", () => {
    it("should desinscrire utilisateur by cours successfully", async () => {
      mockInscriptionsRepo.desinscrireUtilisateurByCours = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.desinscrireUtilisateurByCours(1, 2);

      expect(result).toBe(true);
      expect(mockInscriptionsRepo.desinscrireUtilisateurByCours).toHaveBeenCalledWith(1, 2);
    });

    it("should return false when inscription not found for desinscription", async () => {
      mockInscriptionsRepo.desinscrireUtilisateurByCours = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.desinscrireUtilisateurByCours(999, 999);

      expect(result).toBe(false);
    });

    it("should update inscription notes successfully", async () => {
      mockInscriptionsRepo.updateInscriptionNotes = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateInscriptionNotes(1, "Très bon niveau");

      expect(result).toBe(true);
      expect(mockInscriptionsRepo.updateInscriptionNotes).toHaveBeenCalledWith(1, "Très bon niveau");
    });

    it("should handle empty notes", async () => {
      mockInscriptionsRepo.updateInscriptionNotes = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateInscriptionNotes(1, "");

      expect(result).toBe(true);
    });

    it("should cleanup old inscriptions successfully", async () => {
      mockInscriptionsRepo.cleanupOldInscriptions = jest.fn().mockResolvedValue(25);

      const result = await coursRepository.cleanupOldInscriptions();

      expect(result).toBe(25);
    });

    it("should return 0 when no old inscriptions to cleanup", async () => {
      mockInscriptionsRepo.cleanupOldInscriptions = jest.fn().mockResolvedValue(0);

      const result = await coursRepository.cleanupOldInscriptions();

      expect(result).toBe(0);
    });

    it("should handle database errors on inscriptions operations", async () => {
      const dbError = new Error("Inscription error");
      mockInscriptionsRepo.inscrireUtilisateur = jest.fn().mockRejectedValue(dbError);

      await expect(coursRepository.inscrireUtilisateur(1, 1)).rejects.toThrow("Inscription error");
    });
  });

  describe("Complete Statistics Operations Coverage", () => {
    it("should get statistiques tous utilisateurs successfully", async () => {
      const mockStats = [
        { user_id: 1, total_inscriptions: 15, total_presences: 12, taux_presence: 0.8 },
        { user_id: 2, total_inscriptions: 10, total_presences: 9, taux_presence: 0.9 },
      ];
      mockStatisticsRepo.getStatistiquesTousUtilisateurs = jest.fn().mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesTousUtilisateurs();

      expect(result).toEqual(mockStats);
      expect(result).toHaveLength(2);
    });

    it("should get statistiques par jour semaine successfully", async () => {
      const mockStats = [
        { jour: "Lundi", nombre_cours: 10, nombre_inscriptions: 150 },
        { jour: "Mercredi", nombre_cours: 8, nombre_inscriptions: 120 },
      ];
      mockStatisticsRepo.getStatistiquesParJourSemaine = jest.fn().mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesParJourSemaine();

      expect(result).toEqual(mockStats);
    });

    it("should get taux presence moyen successfully", async () => {
      mockStatisticsRepo.getTauxPresenceMoyen = jest.fn().mockResolvedValue(0.87);

      const result = await coursRepository.getTauxPresenceMoyen();

      expect(result).toBe(0.87);
    });

    it("should return 0 when no presence data", async () => {
      mockStatisticsRepo.getTauxPresenceMoyen = jest.fn().mockResolvedValue(0);

      const result = await coursRepository.getTauxPresenceMoyen();

      expect(result).toBe(0);
    });

    it("should get utilisateurs assidus successfully", async () => {
      const mockUsers = [
        { user_id: 1, nom: "Dupont", taux_presence: 0.95, total_presences: 38 },
        { user_id: 2, nom: "Martin", taux_presence: 0.92, total_presences: 36 },
      ];
      mockStatisticsRepo.getUtilisateursAssidus = jest.fn().mockResolvedValue(mockUsers);

      const result = await coursRepository.getUtilisateursAssidus(10);

      expect(result).toEqual(mockUsers);
    });

    it("should count cours par semaine successfully", async () => {
      mockStatisticsRepo.countCoursParSemaine = jest.fn().mockResolvedValue(28);

      const result = await coursRepository.countCoursParSemaine(10, 2024);

      expect(result).toBe(28);
    });

    it("should get statistiques periode successfully", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-03-31");
      const mockStats = {
        total_cours: 150,
        total_inscriptions: 1200,
        taux_occupation: 0.85,
        taux_presence: 0.88,
      };
      mockStatisticsRepo.getStatistiquesPeriode = jest.fn().mockResolvedValue(mockStats);

      const result = await coursRepository.getStatistiquesPeriode(startDate, endDate);

      expect(result).toEqual(mockStats);
    });

    it("should handle database errors on statistics operations", async () => {
      const dbError = new Error("Statistics error");
      mockStatisticsRepo.getStatistiquesGlobales = jest.fn().mockRejectedValue(dbError);

      await expect(coursRepository.getStatistiquesGlobales()).rejects.toThrow("Statistics error");
    });
  });

  describe("Complete Validation Operations Coverage", () => {
    it("should check inscription exists by id successfully", async () => {
      mockValidationRepo.inscriptionExistsById = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.inscriptionExistsById(1);

      expect(result).toBe(true);
    });

    it("should check professeur exists by name successfully", async () => {
      mockValidationRepo.professeurExistsByName = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.professeurExistsByName("Dupont");

      expect(result).toBe(true);
    });

    it("should check user exists and active successfully", async () => {
      mockValidationRepo.userExistsAndActive = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.userExistsAndActive(1);

      expect(result).toBe(true);
    });

    it("should return false when user is inactive", async () => {
      mockValidationRepo.userExistsAndActive = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.userExistsAndActive(1);

      expect(result).toBe(false);
    });

    it("should check duplicate cours recurrent successfully", async () => {
      mockValidationRepo.checkDuplicateCoursRecurrent = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.checkDuplicateCoursRecurrent(1, "10:00", "11:00", "yoga");

      expect(result).toBe(false);
    });

    it("should detect duplicate cours recurrent", async () => {
      mockValidationRepo.checkDuplicateCoursRecurrent = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.checkDuplicateCoursRecurrent(1, "10:00", "11:00", "yoga");

      expect(result).toBe(true);
    });

    it("should check duplicate cours successfully", async () => {
      const dateCours = new Date("2024-03-15");
      mockValidationRepo.checkDuplicateCours = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.checkDuplicateCours(dateCours, "10:00", "11:00", "yoga");

      expect(result).toBe(false);
    });

    it("should validate cours date successfully", async () => {
      const dateCours = new Date("2024-12-20");
      mockValidationRepo.validateCoursDate = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.validateCoursDate(dateCours);

      expect(result).toBe(true);
    });

    it("should reject past date", async () => {
      const pastDate = new Date("2020-01-01");
      mockValidationRepo.validateCoursDate = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.validateCoursDate(pastDate);

      expect(result).toBe(false);
    });

    it("should check can unregister successfully", async () => {
      mockValidationRepo.checkCanUnregister = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.checkCanUnregister(1);

      expect(result).toBe(true);
    });

    it("should check cours capacity successfully", async () => {
      mockValidationRepo.checkCoursCapacity = jest.fn().mockResolvedValue({ isFull: false, available: 8 });

      const result = await coursRepository.checkCoursCapacity(1);

      expect(result).toEqual({ isFull: false, available: 8 });
    });

    it("should detect full cours", async () => {
      mockValidationRepo.checkCoursCapacity = jest.fn().mockResolvedValue({ isFull: true, available: 0 });

      const result = await coursRepository.checkCoursCapacity(1);

      expect(result.isFull).toBe(true);
      expect(result.available).toBe(0);
    });

    it("should check professeur already assigned successfully", async () => {
      mockValidationRepo.checkProfesseurAlreadyAssigned = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.checkProfesseurAlreadyAssigned(1, 2);

      expect(result).toBe(false);
    });

    it("should detect professeur already assigned", async () => {
      mockValidationRepo.checkProfesseurAlreadyAssigned = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.checkProfesseurAlreadyAssigned(1, 2);

      expect(result).toBe(true);
    });

    it("should check professeur conflict successfully", async () => {
      const dateCours = new Date("2024-03-15");
      mockValidationRepo.checkProfesseurConflict = jest.fn().mockResolvedValue(false);

      const result = await coursRepository.checkProfesseurConflict(1, dateCours, "10:00", "11:00");

      expect(result).toBe(false);
    });

    it("should handle database errors on validation operations", async () => {
      const dbError = new Error("Validation error");
      mockValidationRepo.coursExists = jest.fn().mockRejectedValue(dbError);

      await expect(coursRepository.coursExists(1)).rejects.toThrow("Validation error");
    });
  });

  describe("Advanced Edge Cases and Error Scenarios", () => {
    it("should handle concurrent inscriptions gracefully", async () => {
      mockInscriptionsRepo.inscrireUtilisateur = jest.fn().mockResolvedValue(1);

      const promises = [
        coursRepository.inscrireUtilisateur(1, 1),
        coursRepository.inscrireUtilisateur(1, 2),
        coursRepository.inscrireUtilisateur(1, 3),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockInscriptionsRepo.inscrireUtilisateur).toHaveBeenCalledTimes(3);
    });

    it("should handle very long text in notes", async () => {
      const longNotes = "A".repeat(10000);
      mockInscriptionsRepo.updateInscriptionNotes = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.updateInscriptionNotes(1, longNotes);

      expect(result).toBe(true);
    });

    it("should handle special characters in cours titre", async () => {
      const coursData = {
        titre: "Yoga & Méditation - Session d'été (2024)",
        date: new Date(),
        capacite: 20,
      };
      mockWriteRepo.createCours = jest.fn().mockResolvedValue(1);

      const result = await coursRepository.createCours(coursData);

      expect(result).toBe(1);
    });

    it("should handle boundary capacite values", async () => {
      mockValidationRepo.validateCapacite = jest.fn().mockResolvedValue(true);

      const result1 = await coursRepository.validateCapacite(1);
      const result2 = await coursRepository.validateCapacite(100);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it("should handle midnight time", async () => {
      mockValidationRepo.validateHoraires = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.validateHoraires("00:00", "01:00");

      expect(result).toBe(true);
    });

    it("should handle end of day time", async () => {
      mockValidationRepo.validateHoraires = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.validateHoraires("23:00", "23:59");

      expect(result).toBe(true);
    });

    it("should handle leap year dates", async () => {
      const leapDate = new Date("2024-02-29");
      mockValidationRepo.validateCoursDate = jest.fn().mockResolvedValue(true);

      const result = await coursRepository.validateCoursDate(leapDate);

      expect(result).toBe(true);
    });

    it("should handle timezone differences", async () => {
      const dateCours = new Date("2024-12-20T10:00:00Z");
      mockReadRepo.findByDateRange = jest.fn().mockResolvedValue([]);

      const result = await coursRepository.findByDateRange(dateCours, dateCours);

      expect(result).toEqual([]);
    });

    it("should handle very large week numbers", async () => {
      mockReadRepo.findByWeek = jest.fn().mockResolvedValue([]);

      const result = await coursRepository.findByWeek(53, 2024);

      expect(result).toEqual([]);
    });

    it("should handle negative week numbers gracefully", async () => {
      mockReadRepo.findByWeek = jest.fn().mockResolvedValue([]);

      const result = await coursRepository.findByWeek(-1, 2024);

      expect(result).toEqual([]);
    });

    it("should handle year boundaries", async () => {
      mockReadRepo.findByWeek = jest.fn().mockResolvedValue([]);

      const result1 = await coursRepository.findByWeek(1, 2024);
      const result2 = await coursRepository.findByWeek(52, 2024);

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    it("should handle simultaneous updates to same cours", async () => {
      mockWriteRepo.updateCours = jest.fn().mockResolvedValue(true);

      const promises = [
        coursRepository.updateCours(1, { capacite: 25 }),
        coursRepository.updateCours(1, { capacite: 30 }),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true]);
    });

    it("should handle bulk operations efficiently", async () => {
      const coursIds = Array.from({ length: 100 }, (_, i) => i + 1);
      mockReadRepo.findById = jest.fn().mockResolvedValue({ id: 1, titre: "Yoga" });

      const promises = coursIds.map((id) => coursRepository.findById(id));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
    });

    it("should handle network timeout gracefully", async () => {
      const timeoutError = new Error("Network timeout");
      mockReadRepo.findAll = jest.fn().mockRejectedValue(timeoutError);

      await expect(coursRepository.findAll()).rejects.toThrow("Network timeout");
    });

    it("should handle connection pool exhaustion", async () => {
      const poolError = new Error("Connection pool exhausted");
      mockWriteRepo.createCours = jest.fn().mockRejectedValue(poolError);

      await expect(coursRepository.createCours({ titre: "Test" })).rejects.toThrow("Connection pool exhausted");
    });
  });

  describe("Integration Tests with Multiple Operations", () => {
    it("should handle complete cours lifecycle", async () => {
      // Create
      mockWriteRepo.createCours = jest.fn().mockResolvedValue(1);
      const coursId = await coursRepository.createCours({ titre: "Yoga", capacite: 20 });
      expect(coursId).toBe(1);

      // Read
      mockReadRepo.findById = jest.fn().mockResolvedValue({ id: 1, titre: "Yoga" });
      const cours = await coursRepository.findById(coursId);
      expect(cours).toBeDefined();

      // Update
      mockWriteRepo.updateCours = jest.fn().mockResolvedValue(true);
      const updated = await coursRepository.updateCours(coursId, { capacite: 25 });
      expect(updated).toBe(true);

      // Delete
      mockWriteRepo.softDeleteCours = jest.fn().mockResolvedValue(true);
      const deleted = await coursRepository.softDeleteCours(coursId);
      expect(deleted).toBe(true);
    });

    it("should handle inscription workflow", async () => {
      // Check availability
      mockValidationRepo.checkUserCanRegister = jest.fn().mockResolvedValue(true);
      const canRegister = await coursRepository.checkUserCanRegister(1, 1);
      expect(canRegister).toBe(true);

      // Register
      mockInscriptionsRepo.inscrireUtilisateur = jest.fn().mockResolvedValue(1);
      const inscriptionId = await coursRepository.inscrireUtilisateur(1, 1);
      expect(inscriptionId).toBe(1);

      // Mark presence
      mockInscriptionsRepo.marquerPresence = jest.fn().mockResolvedValue(true);
      const marked = await coursRepository.marquerPresence(inscriptionId, true);
      expect(marked).toBe(true);

      // Get statistics
      mockStatisticsRepo.getStatistiquesPresenceCours = jest.fn().mockResolvedValue({
        total_inscrits: 20,
        total_presents: 15,
        taux_presence: 0.75,
      });
      const stats = await coursRepository.getStatistiquesPresenceCours(1);
      expect(stats.taux_presence).toBe(0.75);
    });

    it("should handle professeur assignment workflow", async () => {
      // Check if professeur exists
      mockValidationRepo.professeurExists = jest.fn().mockResolvedValue(false);
      const exists = await coursRepository.professeurExists(1);
      expect(exists).toBe(false);

      // Create professeur
      mockWriteRepo.createProfesseur = jest.fn().mockResolvedValue(1);
      const profId = await coursRepository.createProfesseur({ nom: "Dupont" });
      expect(profId).toBe(1);

      // Assign to cours
      mockWriteRepo.associerProfesseur = jest.fn().mockResolvedValue(true);
      const assigned = await coursRepository.associerProfesseur(1, profId);
      expect(assigned).toBe(true);

      // Verify assignment
      mockReadRepo.getProfesseursByCoursRecurrent = jest.fn().mockResolvedValue([{ id: profId }]);
      const profs = await coursRepository.getProfesseursByCoursRecurrent(1);
      expect(profs).toHaveLength(1);
    });
  });

  describe("Performance and Stress Tests", () => {
    it("should handle high volume of reads efficiently", async () => {
      mockReadRepo.findAll = jest.fn().mockResolvedValue([]);

      const startTime = Date.now();
      const promises = Array.from({ length: 1000 }, () => coursRepository.findAll());
      await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    it("should handle rapid successive updates", async () => {
      mockWriteRepo.updateCours = jest.fn().mockResolvedValue(true);

      const promises = Array.from({ length: 50 }, (_, i) =>
        coursRepository.updateCours(1, { capacite: 20 + i }),
      );

      const results = await Promise.all(promises);
      expect(results.every((r) => r === true)).toBe(true);
    });
  });
});
