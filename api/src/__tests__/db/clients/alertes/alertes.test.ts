import { jest } from '@jest/globals';
import { AlertesRepository } from '../../../../db/clients/alertes/alertes.repository.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';

// Mock MySQL Connector
jest.mock('../../../../db/connector/mysqlconnector.js');

describe('AlertesRepository', () => {
  let alertesRepository: AlertesRepository;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    alertesRepository = new AlertesRepository();
    mockMysqlConnector = (MysqlConnector as any).getInstance();
  });

  describe('obtenirDashboard', () => {
    it('should return dashboard alerts successfully', async () => {
      const mockDashboard = [
        {
          type: 'info',
          priorite: 1,
          titre: 'Bienvenue',
          message: 'Bienvenue sur le dashboard',
          count: 5
        },
        {
          type: 'warning',
          priorite: 2,
          titre: 'Attention',
          message: 'Vous avez des actions en attente',
          count: 3
        }
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockDashboard]);
      });

      const result = await alertesRepository.obtenirDashboard();

      expect(result).toEqual({
        isFind: true,
        message: 'Dashboard des alertes récupéré avec succès',
        data: mockDashboard
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.any(Function)
      );
    });

    it('should return empty array when no alerts', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [[]]);
      });

      const result = await alertesRepository.obtenirDashboard();

      expect(result).toEqual({
        isFind: true,
        message: 'Dashboard des alertes récupéré avec succès',
        data: []
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(alertesRepository.obtenirDashboard()).rejects.toThrow('Database connection failed');
    });
  });

  describe('obtenirAlertesActives', () => {
    it('should return active alerts successfully', async () => {
      const mockAlertesActives = [
        {
          id: 1,
          type: 'cours_expire',
          priorite: 1,
          titre: 'Cours expiré',
          message: 'Le cours de yoga a expiré',
          user_id: 123,
          created_at: new Date(),
          is_read: false
        },
        {
          id: 2,
          type: 'paiement_en_attente',
          priorite: 2,
          titre: 'Paiement en attente',
          message: 'Un paiement est en attente',
          user_id: 456,
          created_at: new Date(),
          is_read: false
        }
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockAlertesActives);
      });

      const result = await alertesRepository.obtenirAlertesActives();

      expect(result).toEqual({
        isFind: true,
        message: 'Alertes actives récupérées avec succès',
        data: mockAlertesActives
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.any(Function)
      );
    });

    it('should return empty array when no active alerts', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await alertesRepository.obtenirAlertesActives();

      expect(result.isFind).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Query failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(alertesRepository.obtenirAlertesActives()).rejects.toThrow('Query failed');
    });
  });

  describe('obtenirAlertesUtilisateur', () => {
    it('should return user alerts successfully', async () => {
      const userId = 123;
      const mockUserAlerts = [
        {
          id: 1,
          type: 'inscription',
          titre: 'Inscription confirmée',
          message: 'Votre inscription au cours a été confirmée',
          created_at: new Date(),
          is_read: false
        }
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockUserAlerts]);
      });

      const result = await alertesRepository.obtenirAlertesUtilisateur(userId);

      expect(result).toEqual({
        isFind: true,
        message: 'Alertes utilisateur récupérées avec succès',
        data: mockUserAlerts
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [userId],
        expect.any(Function)
      );
    });

    it('should return empty array for user with no alerts', async () => {
      const userId = 999;

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [[]]);
      });

      const result = await alertesRepository.obtenirAlertesUtilisateur(userId);

      expect(result.isFind).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle invalid user id', async () => {
      const invalidUserId = -1;

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [[]]);
      });

      const result = await alertesRepository.obtenirAlertesUtilisateur(invalidUserId);

      expect(result.isFind).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      const userId = 123;
      const dbError = new Error('Database error');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(alertesRepository.obtenirAlertesUtilisateur(userId)).rejects.toThrow('Database error');
    });
  });

  describe('obtenirStatistiques', () => {
    it('should return statistics successfully', async () => {
      const mockStats = {
        total_alertes: 150,
        alertes_actives: 45,
        alertes_lues: 105,
        par_type: {
          info: 50,
          warning: 60,
          error: 40
        },
        par_priorite: {
          haute: 30,
          moyenne: 70,
          basse: 50
        }
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockStats]);
      });

      const result = await alertesRepository.obtenirStatistiques();

      expect(result).toEqual({
        isFind: true,
        message: 'Statistiques des alertes récupérées avec succès',
        data: mockStats
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.any(Function)
      );
    });

    it('should return empty object when no statistics', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await alertesRepository.obtenirStatistiques();

      expect(result.isFind).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Statistics query failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(alertesRepository.obtenirStatistiques()).rejects.toThrow('Statistics query failed');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null results from database', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, null);
      });

      const result = await alertesRepository.obtenirDashboard();

      expect(result.isFind).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle undefined results from database', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, undefined);
      });

      const result = await alertesRepository.obtenirAlertesActives();

      expect(result.isFind).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle connection timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(timeoutError, null);
      });

      await expect(alertesRepository.obtenirStatistiques()).rejects.toThrow('Connection timeout');
    });

    it('should handle SQL syntax errors', async () => {
      const sqlError = new Error('SQL syntax error');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(sqlError, null);
      });

      await expect(alertesRepository.obtenirAlertesActives()).rejects.toThrow('SQL syntax error');
    });
  });

  describe('Constructor', () => {
    it('should create instance with mysql connector', () => {
      const repository = new AlertesRepository();

      expect(repository).toBeInstanceOf(AlertesRepository);
      expect(MysqlConnector.getInstance).toHaveBeenCalled();
    });
  });
});
