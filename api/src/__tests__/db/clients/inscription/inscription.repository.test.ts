/**
 * Tests unitaires pour InscriptionRepository
 * Teste toutes les méthodes d'accès aux données pour les inscriptions et cours
 */

import { InscriptionRepository, getInscriptionRepository } from '../../../../db/clients/inscription/inscription.repository.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import type {
  CoursRow,
  CoursRecurrentRow,
  InscriptionRow,
  UtilisateurInscritRow,
  ProfesseurRow,
  JourDeCoursRow,
  SemaineAvecCoursRow,
  StatistiquesPresenceCoursRow,
  StatistiquesPresenceUtilisateurRow,
} from '../../../../db/clients/inscription/types/index.js';

// Mock du MysqlConnector
jest.mock('../../../../db/connector/mysqlconnector.js');

describe('InscriptionRepository', () => {
  let repository: InscriptionRepository;
  let mockMysqlConnector: jest.Mocked<MysqlConnector>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new InscriptionRepository();
    mockMysqlConnector = (MysqlConnector as jest.MockedClass<typeof MysqlConnector>).mock.instances[0] as jest.Mocked<MysqlConnector>;
  });

  // ==========================================================================
  // TESTS - MÉTHODES DE LECTURE (SELECT) - COURS
  // ==========================================================================

  describe('findAllCours', () => {
    it('should return all cours', async () => {
      const mockCours: CoursRow[] = [
        {
          id: 1,
          date_cours: new Date('2024-01-15'),
          jour_cours: 'lundi',
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          cours_recurrent_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          date_cours: new Date('2024-01-16'),
          jour_cours: 'mardi',
          jour_semaine: 2,
          type_cours: 'Karaté',
          heure_debut: '19:00:00',
          heure_fin: '20:00:00',
          cours_recurrent_id: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockCours);
      });

      const result = await repository.findAllCours();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].type_cours).toBe('Judo');
      expect(result[1].id).toBe(2);
      expect(result[1].type_cours).toBe('Karaté');
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no cours found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findAllCours();

      expect(result).toEqual([]);
    });

    it('should reject on database error', async () => {
      const mockError = new Error('Database error');
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(mockError, null);
      });

      await expect(repository.findAllCours()).rejects.toThrow('Database error');
    });
  });

  describe('findCoursById', () => {
    it('should return a cours by id', async () => {
      const mockCours: CoursRow = {
        id: 1,
        date_cours: new Date('2024-01-15'),
        jour_cours: 'lundi',
        jour_semaine: 1,
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
        cours_recurrent_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockCours]);
      });

      const result = await repository.findCoursById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.type_cours).toBe('Judo');
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1],
        expect.any(Function)
      );
    });

    it('should return null when cours not found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findCoursById(999);

      expect(result).toBeNull();
    });

    it('should reject on database error', async () => {
      const mockError = new Error('Database error');
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(mockError, null);
      });

      await expect(repository.findCoursById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findCoursByParticipant', () => {
    it('should return cours for a participant', async () => {
      const mockCours: CoursRow[] = [
        {
          id: 1,
          date_cours: new Date('2024-01-15'),
          jour_cours: 'lundi',
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          cours_recurrent_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockCours);
      });

      const result = await repository.findCoursByParticipant(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1],
        expect.any(Function)
      );
    });

    it('should return empty array when participant has no cours', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findCoursByParticipant(1);

      expect(result).toEqual([]);
    });
  });

  describe('findCoursBySemaine', () => {
    it('should return cours for a specific week', async () => {
      const mockCours: CoursRow[] = [
        {
          id: 1,
          date_cours: new Date('2024-01-15'),
          jour_cours: 'lundi',
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          cours_recurrent_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockCours);
      });

      const result = await repository.findCoursBySemaine(2024, 3);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [2024, 3],
        expect.any(Function)
      );
    });
  });

  describe('findSemainesAvecCours', () => {
    it('should return weeks with cours', async () => {
      const mockSemaines: SemaineAvecCoursRow[] = [
        {
          numero_semaine: 3,
          annee: 2024,
          date_debut: new Date('2024-01-15'),
          date_fin: new Date('2024-01-21'),
          nombre_cours: 5,
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockSemaines);
      });

      const result = await repository.findSemainesAvecCours();

      expect(result).toHaveLength(1);
      expect(result[0].numero_semaine).toBe(3);
      expect(result[0].annee).toBe(2024);
      expect(result[0].nombre_cours).toBe(5);
    });
  });

  describe('searchCoursByDate', () => {
    it('should return cours for a specific date', async () => {
      const mockCours: CoursRow[] = [
        {
          id: 1,
          date_cours: new Date('2024-01-15'),
          jour_cours: 'lundi',
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          cours_recurrent_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockCours);
      });

      const result = await repository.searchCoursByDate('2024-01-15');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['2024-01-15'],
        expect.any(Function)
      );
    });
  });

  describe('searchCoursByDateRange', () => {
    it('should return cours within date range', async () => {
      const mockCours: CoursRow[] = [
        {
          id: 1,
          date_cours: new Date('2024-01-15'),
          jour_cours: 'lundi',
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          cours_recurrent_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          date_cours: new Date('2024-01-18'),
          jour_cours: 'jeudi',
          jour_semaine: 4,
          type_cours: 'Karaté',
          heure_debut: '19:00:00',
          heure_fin: '20:00:00',
          cours_recurrent_id: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockCours);
      });

      const result = await repository.searchCoursByDateRange('2024-01-15', '2024-01-20');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['2024-01-15', '2024-01-20'],
        expect.any(Function)
      );
    });
  });

  describe('searchCoursByType', () => {
    it('should return cours matching type', async () => {
      const mockCours: CoursRow[] = [
        {
          id: 1,
          date_cours: new Date('2024-01-15'),
          jour_cours: 'lundi',
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          cours_recurrent_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockCours);
      });

      const result = await repository.searchCoursByType('Judo');

      expect(result).toHaveLength(1);
      expect(result[0].type_cours).toBe('Judo');
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['%Judo%'],
        expect.any(Function)
      );
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES DE LECTURE (SELECT) - COURS RÉCURRENTS
  // ==========================================================================

  describe('findAllCoursRecurrents', () => {
    it('should return all cours recurrents', async () => {
      const mockCoursRecurrents: CoursRecurrentRow[] = [
        {
          id: 1,
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          date_debut: new Date('2024-01-01'),
          date_fin: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockCoursRecurrents);
      });

      const result = await repository.findAllCoursRecurrents();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].jour_semaine).toBe(1);
      expect(result[0].type_cours).toBe('Judo');
    });

    it('should return empty array when no cours recurrents found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findAllCoursRecurrents();

      expect(result).toEqual([]);
    });
  });

  describe('findCoursRecurrentById', () => {
    it('should return a cours recurrent by id', async () => {
      const mockCoursRecurrent: CoursRecurrentRow = {
        id: 1,
        jour_semaine: 1,
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
        date_debut: new Date('2024-01-01'),
        date_fin: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockCoursRecurrent]);
      });

      const result = await repository.findCoursRecurrentById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.jour_semaine).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1],
        expect.any(Function)
      );
    });

    it('should return null when cours recurrent not found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findCoursRecurrentById(999);

      expect(result).toBeNull();
    });
  });

  describe('findCoursRecurrentId', () => {
    it('should return cours recurrent id by criteria', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ id: 1 }]);
      });

      const result = await repository.findCoursRecurrentId(1, 'Judo', '18:00:00', '19:00:00');

      expect(result).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 'Judo', '18:00:00', '19:00:00'],
        expect.any(Function)
      );
    });

    it('should return null when no matching cours recurrent found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findCoursRecurrentId(1, 'Judo', '18:00:00', '19:00:00');

      expect(result).toBeNull();
    });
  });

  describe('findJoursDeCours', () => {
    it('should return jours de cours with professeurs', async () => {
      const mockJours: JourDeCoursRow[] = [
        {
          id: 1,
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          date_debut: new Date('2024-01-01'),
          date_fin: null,
          professeurs: 'Jean Dupont, Marie Martin',
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockJours);
      });

      const result = await repository.findJoursDeCours();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].jour).toBe('lundi');
      expect(result[0].professeurs).toHaveLength(2);
      expect(result[0].professeurs[0]).toBe('Jean Dupont');
    });
  });

  describe('findJoursDeCoursParSemaine', () => {
    it('should return jours de cours for a specific week', async () => {
      const mockJours: JourDeCoursRow[] = [
        {
          id: 1,
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          date_debut: new Date('2024-01-01'),
          date_fin: null,
          professeurs: 'Jean Dupont',
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockJours);
      });

      const result = await repository.findJoursDeCoursParSemaine('2024-01-15', '2024-01-21');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['2024-01-21', '2024-01-15'],
        expect.any(Function)
      );
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES DE LECTURE (SELECT) - INSCRIPTIONS
  // ==========================================================================

  describe('findInscriptionsByCours', () => {
    it('should return inscriptions for a cours', async () => {
      const mockInscriptions: InscriptionRow[] = [
        {
          id: 1,
          cours_id: 1,
          utilisateur_id: 1,
          date_inscription: new Date(),
          presence: 'present',
          est_valide: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          cours_id: 1,
          utilisateur_id: 2,
          date_inscription: new Date(),
          presence: 'absent',
          est_valide: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockInscriptions);
      });

      const result = await repository.findInscriptionsByCours(1);

      expect(result).toHaveLength(2);
      expect(result[0].cours_id).toBe(1);
      expect(result[0].presence).toBe('present');
      expect(result[1].presence).toBe('absent');
    });

    it('should return empty array when no inscriptions found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findInscriptionsByCours(1);

      expect(result).toEqual([]);
    });
  });

  describe('findCoursInscritsByUtilisateur', () => {
    it('should return cours inscrits for a user', async () => {
      const mockCours = [
        {
          id: 1,
          date_cours: new Date('2024-01-15'),
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          presence: 'present',
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockCours);
      });

      const result = await repository.findCoursInscritsByUtilisateur(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].type_cours).toBe('Judo');
    });
  });

  describe('verifyInscription', () => {
    it('should return verification result when user is inscrit', async () => {
      const mockResult = [
        {
          inscriptionId: 1,
          userId: 1,
          cours_id: 1,
          presence: 'present',
          est_valide: 1,
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      const result = await repository.verifyInscription(1, 1);

      expect(result.isBooked).toBe(true);
      expect(result.isFind).toBe(true);
      expect(result.message).toBe('Utilisateur déjà inscrit');
      expect(result.data.inscriptionId).toBe(1);
      expect(result.data.est_valide).toBe(true);
    });

    it('should return not found when user is not inscrit', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.verifyInscription(1, 1);

      expect(result.isBooked).toBe(false);
      expect(result.isFind).toBe(false);
      expect(result.message).toBe('Utilisateur non inscrit à ce cours');
    });
  });

  describe('findInscriptionById', () => {
    it('should return an inscription by id', async () => {
      const mockInscription: InscriptionRow = {
        id: 1,
        cours_id: 1,
        utilisateur_id: 1,
        date_inscription: new Date(),
        presence: 'present',
        est_valide: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockInscription]);
      });

      const result = await repository.findInscriptionById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.cours_id).toBe(1);
      expect(result?.est_valide).toBe(true);
    });

    it('should return null when inscription not found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findInscriptionById(999);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES DE LECTURE (SELECT) - UTILISATEURS
  // ==========================================================================

  describe('findParticipantIdByName', () => {
    it('should return participant id by name', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ id: 1 }]);
      });

      const result = await repository.findParticipantIdByName('John', 'Doe');

      expect(result).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['John', 'Doe'],
        expect.any(Function)
      );
    });

    it('should return null when participant not found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findParticipantIdByName('Unknown', 'User');

      expect(result).toBeNull();
    });
  });

  describe('findUtilisateursByCours', () => {
    it('should return utilisateurs for a cours', async () => {
      const mockUtilisateurs: UtilisateurInscritRow[] = [
        {
          id: 1,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@example.com',
          presence: 'present',
          date_inscription: new Date(),
          est_valide: 1,
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockUtilisateurs);
      });

      const result = await repository.findUtilisateursByCours(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].nom).toBe('Doe');
      expect(result[0].prenom).toBe('John');
      expect(result[0].presence).toBe('present');
    });
  });

  describe('verifyParticipant', () => {
    it('should return true when participant exists', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ id: 1 }]);
      });

      const result = await repository.verifyParticipant('John', 'Doe');

      expect(result).toBe(true);
    });

    it('should return false when participant does not exist', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.verifyParticipant('Unknown', 'User');

      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES DE LECTURE (SELECT) - PROFESSEURS
  // ==========================================================================

  describe('findProfesseursByCours', () => {
    it('should return professeurs for a cours', async () => {
      const mockProfesseurs: ProfesseurRow[] = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@example.com',
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockProfesseurs);
      });

      const result = await repository.findProfesseursByCours(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].nom).toBe('Dupont');
      expect(result[0].prenom).toBe('Jean');
    });
  });

  describe('findProfesseursByCoursRecurrent', () => {
    it('should return professeurs for a cours recurrent', async () => {
      const mockProfesseurs: ProfesseurRow[] = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@example.com',
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockProfesseurs);
      });

      const result = await repository.findProfesseursByCoursRecurrent(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('findProfesseurIdsByNames', () => {
    it('should return professeur ids by names', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ id: 1 }, { id: 2 }]);
      });

      const result = await repository.findProfesseurIdsByNames(['Jean Dupont', 'Marie Martin']);

      expect(result).toEqual([1, 2]);
    });

    it('should return empty array when no professeurs found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.findProfesseurIdsByNames(['Unknown Prof']);

      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES DE LECTURE (SELECT) - STATISTIQUES
  // ==========================================================================

  describe('getStatistiquesPresenceByCours', () => {
    it('should return presence statistics by cours', async () => {
      const mockStats: StatistiquesPresenceCoursRow[] = [
        {
          cours_id: 1,
          date_cours: new Date('2024-01-15'),
          type_cours: 'Judo',
          total_inscrits: 10,
          presents: 8,
          absents: 1,
          en_attente: 1,
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockStats);
      });

      const result = await repository.getStatistiquesPresenceByCours('2024-01-01', '2024-01-31');

      expect(result).toHaveLength(1);
      expect(result[0].cours_id).toBe(1);
      expect(result[0].total_inscrits).toBe(10);
      expect(result[0].presents).toBe(8);
      expect(result[0].taux_presence).toBe(80);
    });
  });

  describe('getStatistiquesPresenceByUtilisateur', () => {
    it('should return presence statistics by utilisateur', async () => {
      const mockStats: StatistiquesPresenceUtilisateurRow[] = [
        {
          utilisateur_id: 1,
          nom: 'Doe',
          prenom: 'John',
          total_cours: 10,
          presents: 8,
          absents: 2,
          en_attente: 0,
        },
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockStats);
      });

      const result = await repository.getStatistiquesPresenceByUtilisateur('2024-01-01', '2024-01-31');

      expect(result).toHaveLength(1);
      expect(result[0].utilisateur_id).toBe(1);
      expect(result[0].total_cours).toBe(10);
      expect(result[0].presents).toBe(8);
      expect(result[0].taux_presence).toBe(80);
    });
  });

  describe('countInscriptionsByCours', () => {
    it('should return count of inscriptions for a cours', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 10 }]);
      });

      const result = await repository.countInscriptionsByCours(1);

      expect(result).toBe(10);
    });

    it('should return 0 when no inscriptions found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await repository.countInscriptionsByCours(1);

      expect(result).toBe(0);
    });
  });

  describe('countCoursByUtilisateur', () => {
    it('should return count of cours for a utilisateur', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 5 }]);
      });

      const result = await repository.countCoursByUtilisateur(1);

      expect(result).toBe(5);
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES D'ÉCRITURE (INSERT) - COURS
  // ==========================================================================

  describe('createCours', () => {
    it('should create a new cours and return its id', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { insertId: 1 });
      });

      const result = await repository.createCours({
        date_cours: '2024-01-15',
        type_cours: 'Judo',
        heure_debut: '18:00',
        heure_fin: '19:00',
      });

      expect(result).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['2024-01-15', 'Judo', '18:00', '19:00']),
        expect.any(Function)
      );
    });

    it('should reject on database error', async () => {
      const mockError = new Error('Insert error');
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(mockError, null);
      });

      await expect(
        repository.createCours({
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00',
          heure_fin: '19:00',
        })
      ).rejects.toThrow('Insert error');
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES D'ÉCRITURE (INSERT) - COURS RÉCURRENTS
  // ==========================================================================

  describe('createCoursRecurrent', () => {
    it('should create a cours recurrent and return its id', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { insertId: 1 });
      });

      const result = await repository.createCoursRecurrent({
        jour: 'lundi',
        type_cours: 'Judo',
        heure_debut: '18:00',
        heure_fin: '19:00',
      });

      expect(result).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 'Judo', '18:00', '19:00']),
        expect.any(Function)
      );
    });

    it('should reject when jour is invalid', async () => {
      await expect(
        repository.createCoursRecurrent({
          jour: 'invalidDay',
          type_cours: 'Judo',
          heure_debut: '18:00',
          heure_fin: '19:00',
        })
      ).rejects.toThrow('Jour invalide: invalidDay');
    });
  });

  describe('associateProfesseursToCoursRecurrent', () => {
    it('should associate professeurs to cours recurrent', async () => {
      mockMysqlConnector.query = jest
        .fn()
        .mockImplementationOnce((sql: string, params: any[], callback: Function) => {
          // First call - get professeur IDs
          callback(null, [{ id: 1 }, { id: 2 }]);
        })
        .mockImplementationOnce((sql: string, params: any[], callback: Function) => {
          // Second call - insert associations
          callback(null, { affectedRows: 2 });
        });

      await repository.associateProfesseursToCoursRecurrent(1, ['Jean Dupont', 'Marie Martin']);

      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(2);
    });

    it('should resolve without inserting when no professeurs found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      await expect(
        repository.associateProfesseursToCoursRecurrent(1, ['Unknown Prof'])
      ).resolves.not.toThrow();

      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES D'ÉCRITURE (INSERT) - INSCRIPTIONS
  // ==========================================================================

  describe('createInscription', () => {
    it('should create an inscription and return its id', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { insertId: 1 });
      });

      const result = await repository.createInscription({
        coursId: 1,
        utilisateurId: 1,
        presence: 'en_attente',
        est_valide: false,
      });

      expect(result).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 1, 'en_attente', 0],
        expect.any(Function)
      );
    });
  });

  describe('createInscriptionSimple', () => {
    it('should create a simple inscription', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { insertId: 1 });
      });

      const result = await repository.createInscriptionSimple(1, 1);

      expect(result).toBe(1);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 1],
        expect.any(Function)
      );
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES D'ÉCRITURE (UPDATE)
  // ==========================================================================

  describe('updatePresence', () => {
    it('should update presence and return true', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.updatePresence({
        inscriptionId: 1,
        presence: 'present',
      });

      expect(result).toBe(true);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['present', 1],
        expect.any(Function)
      );
    });

    it('should return false when no rows affected', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 0 });
      });

      const result = await repository.updatePresence({
        inscriptionId: 999,
        presence: 'present',
      });

      expect(result).toBe(false);
    });
  });

  describe('validerInscription', () => {
    it('should validate inscription', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.validerInscription(1, 1);

      expect(result).toBe(true);
    });
  });

  describe('annulerInscription', () => {
    it('should cancel inscription', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.annulerInscription(1, 1);

      expect(result).toBe(true);
    });
  });

  describe('updateCoursRecurrent', () => {
    it('should update cours recurrent', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.updateCoursRecurrent({
        id: 1,
        jour: 'mardi',
        type_cours: 'Karaté',
      });

      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES D'ÉCRITURE (DELETE)
  // ==========================================================================

  describe('deleteInscription', () => {
    it('should delete inscription and return true', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.deleteInscription(1);

      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 0 });
      });

      const result = await repository.deleteInscription(999);

      expect(result).toBe(false);
    });
  });

  describe('deleteInscriptionByCoursUser', () => {
    it('should delete inscription by cours and user', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.deleteInscriptionByCoursUser(1, 1);

      expect(result).toBe(true);
    });
  });

  describe('deleteCours', () => {
    it('should delete cours', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.deleteCours(1);

      expect(result).toBe(true);
    });
  });

  describe('deleteCoursRecurrent', () => {
    it('should delete cours recurrent', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.deleteCoursRecurrent(1);

      expect(result).toBe(true);
    });
  });

  describe('softDeleteCoursRecurrent', () => {
    it('should soft delete cours recurrent by setting date_fin', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      const result = await repository.softDeleteCoursRecurrent(1, '2024-12-31');

      expect(result).toBe(true);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['2024-12-31', 1],
        expect.any(Function)
      );
    });
  });

  describe('deleteProfesseursFromCoursRecurrent', () => {
    it('should delete all professeurs from cours recurrent', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 2 });
      });

      const result = await repository.deleteProfesseursFromCoursRecurrent(1);

      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // TESTS - MÉTHODES DE VALIDATION
  // ==========================================================================

  describe('coursExists', () => {
    it('should return true when cours exists', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ exists_flag: 1 }]);
      });

      const result = await repository.coursExists(1);

      expect(result).toBe(true);
    });

    it('should return false when cours does not exist', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ exists_flag: 0 }]);
      });

      const result = await repository.coursExists(999);

      expect(result).toBe(false);
    });
  });

  describe('coursRecurrentExists', () => {
    it('should return true when cours recurrent exists', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ exists_flag: 1 }]);
      });

      const result = await repository.coursRecurrentExists(1);

      expect(result).toBe(true);
    });
  });

  describe('utilisateurExists', () => {
    it('should return true when utilisateur exists', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ exists_flag: 1 }]);
      });

      const result = await repository.utilisateurExists(1);

      expect(result).toBe(true);
    });
  });

  describe('isUserInscrit', () => {
    it('should return true when user is inscrit', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ is_inscrit: 1 }]);
      });

      const result = await repository.isUserInscrit(1, 1);

      expect(result).toBe(true);
    });

    it('should return false when user is not inscrit', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ is_inscrit: 0 }]);
      });

      const result = await repository.isUserInscrit(1, 1);

      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // TESTS - SINGLETON
  // ==========================================================================

  describe('getInscriptionRepository', () => {
    it('should return singleton instance', () => {
      const instance1 = getInscriptionRepository();
      const instance2 = getInscriptionRepository();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(InscriptionRepository);
    });
  });

  // ==========================================================================
  // TESTS - ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(networkError, null);
      });

      await expect(repository.findAllCours()).rejects.toThrow('Network timeout');
    });

    it('should handle SQL syntax errors', async () => {
      const sqlError = new Error('SQL syntax error');
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(sqlError, null);
      });

      await expect(repository.findCoursById(1)).rejects.toThrow('SQL syntax error');
    });

    it('should handle constraint violation errors', async () => {
      const constraintError = new Error('Foreign key constraint fails');
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(constraintError, null);
      });

      await expect(
        repository.createInscription({
          coursId: 999,
          utilisateurId: 999,
        })
      ).rejects.toThrow('Foreign key constraint fails');
    });
  });
});
