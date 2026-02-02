/**
 * Tests des cas limites (edge cases) pour le module Cours
 * Tests des situations limites et cas particuliers
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getAllCours,
  getParticipantCours,
  inscrireUtilisateur,
  annulerPresence,
  validerPresence,
  desinscrireUtilisateur,
  ajouterCours,
  modifierCours,
  supprimerJour,
  retirerProfesseur,
} from "../core/handlers/index.js";

// Mock du connector MySQL
jest.mock("../../../db/connector/mysqlconnector.js", () => {
  return {
    default: {
      getInstance: jest.fn(() => ({
        query: jest.fn(),
      })),
    },
  };
});

describe("Cours - Tests des cas limites", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe("Cas limites de capacité", () => {
    it("devrait gérer un cours avec 0 place disponible", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("places")) {
            callback(null, [{ places_disponibles: 0, places_max: 10 }]);
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("complet"),
        }),
      );
    });

    it("devrait gérer un cours avec exactement 1 place disponible", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("inscription")) {
            callback(null, []);
          } else if (query.includes("places")) {
            callback(null, [{ places_disponibles: 1, places_max: 10 }]);
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer un cours avec capacité maximale très élevée", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 999999,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer un cours avec places_max = 1", async () => {
      mockRequest.body = {
        nom: "Cours particulier",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 1,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Cas limites temporels", () => {
    it("devrait gérer un cours commençant à minuit", async () => {
      mockRequest.body = {
        nom: "Yoga Nuit",
        date: "2024-03-15",
        heure_debut: "00:00:00",
        heure_fin: "01:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer un cours finissant à 23:59:59", async () => {
      mockRequest.body = {
        nom: "Yoga Nuit",
        date: "2024-03-15",
        heure_debut: "23:00:00",
        heure_fin: "23:59:59",
        places_max: 15,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer un cours d'exactement 1 minute", async () => {
      mockRequest.body = {
        nom: "Cours Express",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "10:01:00",
        places_max: 15,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer un cours très long (8 heures)", async () => {
      mockRequest.body = {
        nom: "Retraite Yoga",
        date: "2024-03-15",
        heure_debut: "09:00:00",
        heure_fin: "17:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer une date très lointaine dans le futur", async () => {
      mockRequest.body = {
        nom: "Yoga Future",
        date: "2099-12-31",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Cas limites de données", () => {
    it("devrait gérer une liste vide de cours", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Aucun cours à venir trouvé.",
      });
    });

    it("devrait gérer une liste vide de participants", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it("devrait gérer un nom de cours d'exactement 1 caractère", async () => {
      mockRequest.body = {
        nom: "Y",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      // Devrait être rejeté car trop court
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer un nom de cours à la limite maximale (255 caractères)", async () => {
      mockRequest.body = {
        nom: "Y".repeat(255),
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des noms avec des caractères spéciaux", async () => {
      mockRequest.body = {
        utilisateur_nom: "O'Brien-D'Angelo",
        utilisateur_prenom: "Jean-François",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("inscription")) {
            callback(null, []);
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des noms avec des accents", async () => {
      mockRequest.body = {
        utilisateur_nom: "Léon",
        utilisateur_prenom: "José",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("inscription")) {
            callback(null, []);
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des noms en majuscules", async () => {
      mockRequest.body = {
        utilisateur_nom: "DUPONT",
        utilisateur_prenom: "JEAN",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("inscription")) {
            callback(null, []);
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Cas limites d'IDs", () => {
    it("devrait gérer l'ID 0", async () => {
      mockRequest.params = { id: "0" };

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer un très grand ID (Number.MAX_SAFE_INTEGER)", async () => {
      mockRequest.params = { id: Number.MAX_SAFE_INTEGER.toString() };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait gérer l'ID 1 (premier ID valide)", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [{ id: 1, nom: "Dupont" }]);
        },
      );

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Cas limites de modification", () => {
    it("devrait gérer la modification d'un cours sans changements", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [{ id: 1, nom: "Yoga" }]);
          } else if (query.includes("UPDATE")) {
            callback(null, { affectedRows: 0 });
          }
        },
      );

      await modifierCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).not.toHaveBeenCalledWith(500);
    });

    it("devrait gérer la suppression d'un jour sans cours", async () => {
      mockRequest.params = { date: "2024-12-25" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 0 });
        },
      );

      await supprimerJour(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("trouvé"),
      });
    });

    it("devrait gérer la suppression d'un jour avec un seul cours", async () => {
      mockRequest.params = { date: "2024-03-15" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 1 });
        },
      );

      await supprimerJour(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer la suppression d'un jour avec plusieurs cours", async () => {
      mockRequest.params = { date: "2024-03-15" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 10 });
        },
      );

      await supprimerJour(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Cas limites de présence", () => {
    it("devrait gérer la validation de présence juste avant le cours", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("UPDATE")) {
            callback(null, { affectedRows: 1 });
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1, status_id: 1 }]);
          }
        },
      );

      await validerPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer l'annulation puis la revalidation de présence", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("UPDATE")) {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      // Annulation
      await annulerPresence(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(200);

      jest.clearAllMocks();

      // Revalidation
      await validerPresence(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Cas limites de concurrence", () => {
    it("devrait gérer deux inscriptions simultanées à la dernière place", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("places")) {
            // Simule une race condition
            callback(null, [{ places_disponibles: 1, places_max: 10 }]);
          } else if (query.includes("INSERT")) {
            // Premier appel réussit, second devrait échouer
            callback(new Error("ER_DUP_ENTRY"), null);
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Cas limites de professeurs", () => {
    it("devrait gérer un professeur assigné à plusieurs cours le même jour", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2024-03-15",
        heure_debut: "14:00:00",
        heure_fin: "15:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1, cours_count: 3 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer le retrait du dernier professeur d'un cours", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { professeur_id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [{ id: 1, professeur_id: 1 }]);
          } else if (query.includes("UPDATE")) {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await retirerProfesseur(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
