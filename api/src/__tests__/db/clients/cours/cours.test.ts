import { Cours } from '../../../../db/clients/cours/cours.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import {
  AjoutCours,
  DataAnnulation,
  DataInscription,
  DataReservation,
  DataValidation,
} from '@clubmanager/types';

// Mock the MySQL connector
jest.mock('../../../../db/connector/mysqlconnector.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      query: jest.fn(),
      connect: jest.fn(),
      close: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    };
  });
});

describe('Cours Client', () => {
  let coursClient: Cours;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    coursClient = new Cours();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];
  });

  describe('obtenirLesCoursPourParticipant', () => {
    it('should return courses for a participant', async () => {
      const mockParticipantId = 1;
      const mockCourses = [
        {
          id: 1,
          date_cours: '2023-06-01',
          type_cours: 'Karate débutant',
          heure_debut: '18:00:00',
          heure_fin: '19:30:00',
        },
        {
          id: 2,
          date_cours: '2023-06-08',
          type_cours: 'Karate débutant',
          heure_debut: '18:00:00',
          heure_fin: '19:30:00',
        },
      ];

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockCourses);
        }
      );

      const result = await coursClient.obtenirLesCoursPourParticipant(mockParticipantId);
      expect(result).toEqual(mockCourses);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.* FROM cours c JOIN inscriptions i ON i.cours_id = c.id'),
        [mockParticipantId],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const mockError = new Error('Database error');

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(mockError, null);
        }
      );

      await expect(coursClient.obtenirLesCoursPourParticipant(1)).rejects.toEqual(mockError);
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('obtenirUtilisateursParCours', () => {
    it('should return users for a course', async () => {
      const mockCoursId = 1;
      const mockResults = [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' },
      ];

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockResults);
        }
      );

      const result = await coursClient.obtenirUtilisateursParCours(mockCoursId);
      expect(result).toEqual({
        utilisateurs: [
          { nom: 'Doe', prenom: 'John', presence: undefined },
          { nom: 'Smith', prenom: 'Jane', presence: undefined },
        ],
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.first_name, u.last_name FROM utilisateurs u'),
        [mockCoursId],
        expect.any(Function)
      );
    });
  });

  describe('obtenirCoursAvecUtilisateurs', () => {
    it('should return courses with their users', async () => {
      const mockParticipantId = 1;
      const mockCourses = [
        {
          id: 1,
          date_cours: '2023-06-01',
          type_cours: 'Karate débutant',
          heure_debut: '18:00:00',
          heure_fin: '19:30:00',
        },
      ];
      const mockUsers = {
        utilisateurs: [
          { nom: 'Doe', prenom: 'John', presence: 1 },
        ],
      };

      jest.spyOn(coursClient, 'obtenirLesCoursPourParticipant').mockResolvedValue(mockCourses);
      jest.spyOn(coursClient, 'obtenirUtilisateursParCours').mockResolvedValue(mockUsers);

      const result = await coursClient.obtenirCoursAvecUtilisateurs(mockParticipantId);
      expect(result).toEqual([
        {
          ...mockCourses[0],
          utilisateurs: mockUsers.utilisateurs,
        },
      ]);
      expect(coursClient.obtenirLesCoursPourParticipant).toHaveBeenCalledWith(mockParticipantId);
      expect(coursClient.obtenirUtilisateursParCours).toHaveBeenCalledWith(mockCourses[0].id);
    });
  });

  describe('obtenirLesJoursDeCours', () => {
    it('should return course days with professors', async () => {
      const mockResults = [
        {
          jour: 'Lundi',
          type_cours: 'Karate débutant',
          heure_debut: '18:00',
          heure_fin: '19:30',
          professeurs: 'John Doe, Jane Smith',
        },
      ];

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockResults);
        }
      );

      const result = await coursClient.obtenirLesJoursDeCours();
      expect(result).toEqual([
        {
          jour: 'Lundi',
          type_cours: 'Karate débutant',
          heure_debut: '18:00',
          heure_fin: '19:30',
          professeurs: ['John Doe', 'Jane Smith'],
        },
      ]);
    });

    it('should handle empty professor list', async () => {
      const mockResults = [
        {
          jour: 'Lundi',
          type_cours: 'Karate débutant',
          heure_debut: '18:00',
          heure_fin: '19:30',
          professeurs: null,
        },
      ];

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockResults);
        }
      );

      const result = await coursClient.obtenirLesJoursDeCours();
      expect(result).toEqual([
        {
          jour: 'Lundi',
          type_cours: 'Karate débutant',
          heure_debut: '18:00',
          heure_fin: '19:30',
          professeurs: [],
        },
      ]);
    });
  });

  describe('ajouterCoursRecurrentAvecProfesseurs', () => {
    it('should add recurring course with professors', async () => {
      const mockData: AjoutCours = {
        jour_semaine: 'lundi',
        type_cours: 'Karate débutant',
        heure_debut: '18:00:00',
        heure_fin: '19:30:00',
        professeurs: ["Emmanuel", "John"],
      };

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { insertId: 1 });
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, {});
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 52 });
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, [
            { professeur_id: 10 },
            { professeur_id: 11 },
          ]);
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 2 });
        }
      );

      const result = await coursClient.ajouterCoursRecurrentAvecProfesseurs(mockData);
      expect(result).toEqual({
        isConfirm: true,
        message: 'Cours récurrent + cours générés + professeurs associés avec succès',
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(5);
    });

    it('should handle invalid weekday', async () => {
      const mockData: AjoutCours = {
        jour_semaine: 'invalidDay',
        type_cours: 'Karate débutant',
        heure_debut: '18:00:00',
        heure_fin: '19:30:00',
        professeurs: ["Emmanuel", "John"],
      };
      await expect(coursClient.ajouterCoursRecurrentAvecProfesseurs(mockData))
        .rejects.toEqual('Jour de la semaine invalide');
    });

    it('should handle no professors case', async () => {
      const mockData: AjoutCours = {
        jour_semaine: 'lundi',
        type_cours: 'Karate débutant',
        heure_debut: '18:00:00',
        heure_fin: '19:30:00',
        professeurs: [],
      };

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { insertId: 1 });
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, {});
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 52 });
        }
      );

      const result = await coursClient.ajouterCoursRecurrentAvecProfesseurs(mockData);
      expect(result).toEqual({ affectedRows: 52 });
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('supprimerJourDeCours', () => {
    it('should delete courses for a specific day', async () => {
      const jourSemaine = 1;

      mockMysqlConnector.beginTransaction.mockImplementationOnce(
        (callback: (error: Error | null) => void) => {
          callback(null);
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 1 });
        }
      );

      mockMysqlConnector.commit.mockImplementationOnce(
        (callback: (error: Error | null) => void) => {
          callback(null);
        }
      );

      const result = await coursClient.supprimerJourDeCours(jourSemaine);
      expect(result).toEqual({
        isConfirm: true,
        message: `Cours récurrents et toutes les dépendances supprimés avec succès pour les jours ${jourSemaine}`,
      });
      expect(mockMysqlConnector.beginTransaction).toHaveBeenCalled();
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM cours_recurrent'),
        [jourSemaine],
        expect.any(Function)
      );
      expect(mockMysqlConnector.commit).toHaveBeenCalled();
    });

    it('should handle transaction error', async () => {
      const jourSemaine = 1;
      const mockError = new Error('Transaction error');

      mockMysqlConnector.beginTransaction.mockImplementationOnce(
        (callback: (error: Error | null) => void) => {
          callback(mockError);
        }
      );

      await expect(coursClient.supprimerJourDeCours(jourSemaine)).rejects.toEqual(mockError);
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should handle query error and rollback', async () => {
      const jourSemaine = 1;
      const mockError = new Error('Query error');

      mockMysqlConnector.beginTransaction.mockImplementationOnce(
        (callback: (error: Error | null) => void) => {
          callback(null);
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(mockError, null);
        }
      );

      mockMysqlConnector.rollback.mockImplementationOnce(
        (callback: () => void) => {
          callback();
        }
      );

      await expect(coursClient.supprimerJourDeCours(jourSemaine)).rejects.toEqual(mockError);
      expect(mockMysqlConnector.rollback).toHaveBeenCalled();
    });
  });

  describe('obtenirTousLesCours', () => {
    it('should return all upcoming courses', async () => {
      const mockCourses = [
        {
          id: 1,
          date_cours: '2023-06-01',
          type_cours: 'Karate débutant',
          heure_debut: '18:00:00',
          heure_fin: '19:30:00',
        },
        {
          id: 2,
          date_cours: '2023-06-08',
          type_cours: 'Karate avancé',
          heure_debut: '20:00:00',
          heure_fin: '21:30:00',
        },
      ];

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockCourses);
        }
      );

      const result = await coursClient.obtenirTousLesCours();
      expect(result).toEqual(mockCourses);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM cours WHERE date_cours >= CURRENT_DATE'),
        [],
        expect.any(Function)
      );
    });
  });

  describe('obtenirUtilisateursParticipantsParCours', () => {
    it('should return course with participants', async () => {
      const mockCoursId = 1;
      const mockResults = [
        {
          coursId: 1,
          date_cours: '2023-06-01',
          type_cours: 'Karate débutant',
          heure_debut: '18:00:00',
          heure_fin: '19:30:00',
          utilisateurId: 101,
          nom: 'Doe',
          prenom: 'John',
          status_id: 1,
        },
        {
          coursId: 1,
          date_cours: '2023-06-01',
          type_cours: 'Karate débutant',
          heure_debut: '18:00:00',
          heure_fin: '19:30:00',
          utilisateurId: 102,
          nom: 'Smith',
          prenom: 'Jane',
          status_id: 1,
        },
      ];

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockResults);
        }
      );

      const result = await coursClient.obtenirUtilisateursParticipantsParCours(mockCoursId);
      expect(result).toEqual({
        id: 1,
        date_cours: '2023-06-01',
        type_cours: 'Karate débutant',
        heure_debut: '18:00:00',
        heure_fin: '19:30:00',
        utilisateurs: [
          { nom: 'Doe', prenom: 'John', presence: 1 },
          { nom: 'Smith', prenom: 'Jane', presence: 1 },
        ],
      });
    });
  });

  describe('verifierParticipant', () => {
    it('should verify participant and return their courses', async () => {
      const mockData = { nom: 'Doe', prenom: 'John' };
      const mockParticipantId = 101;
      const mockCourses = [
        {
          id: 1,
          date_cours: '2023-06-01',
          type_cours: 'Karate débutant',
          heure_debut: '18:00:00',
          heure_fin: '19:30:00',
        },
      ];

      jest.spyOn(coursClient, 'obtenirIdParticipantParNomPrenom').mockResolvedValue(mockParticipantId);
      jest.spyOn(coursClient, 'obtenirLesCoursPourParticipant').mockResolvedValue(mockCourses);

      const result = await coursClient.verifierParticipant(mockData);
      expect(result).toEqual(mockCourses);
      expect(coursClient.obtenirIdParticipantParNomPrenom).toHaveBeenCalledWith('Doe', 'John');
      expect(coursClient.obtenirLesCoursPourParticipant).toHaveBeenCalledWith(mockParticipantId);
    });

    it('should propagate errors', async () => {
      const mockData = { nom: 'Unknown', prenom: 'User' };
      const mockError = new Error('User not found');
      jest.spyOn(coursClient, 'obtenirIdParticipantParNomPrenom').mockRejectedValue(mockError);
      await expect(coursClient.verifierParticipant(mockData)).rejects.toEqual(mockError);
    });
  });

  describe('ajouterCoursRecurrent', () => {
    it('should add a recurring course', async () => {
      const mockData: AjoutCours = {
        jour_semaine: 'lundi',
        type_cours: 'Karate débutant',
        heure_debut: '18:00:00',
        heure_fin: '19:30:00',
        professeurs: [],
      };

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { insertId: 1 });
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, {});
        }
      );

      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 52 });
        }
      );

      const result = await coursClient.ajouterCoursRecurrent(mockData);
      expect(result).toEqual({ affectedRows: 52 });
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('associerProfesseursAuCoursRecurrent', () => {
    it('should associate professors to a recurring course', async () => {
      const coursRecurrentId = 1;
      const professeursIds = [10, 11];

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 2 });
        }
      );

      const result = await coursClient.associerProfesseursAuCoursRecurrent(coursRecurrentId, professeursIds);
      expect(result).toEqual({ affectedRows: 2 });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO cours_recurrent_professeur'),
        [1, 10, 1, 11],
        expect.any(Function)
      );
    });

    it('should reject if no professors are provided', async () => {
      const coursRecurrentId = 1;
      const professeursIds: number[] = [];
      await expect(coursClient.associerProfesseursAuCoursRecurrent(coursRecurrentId, professeursIds))
        .rejects.toEqual('Aucun professeur à associer');
    });
  });
});
