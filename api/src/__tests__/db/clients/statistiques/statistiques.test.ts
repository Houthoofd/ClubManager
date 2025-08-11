import { Statistiques } from '../../../../db/clients/statistiques/statistiques.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';

// Mock the MySQL connector
jest.mock('../../../../db/connector/mysqlconnector.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      query: jest.fn(),
      close: jest.fn()
    };
  });
});

describe('Statistiques Client', () => {
  let statistiquesClient: Statistiques;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    statistiquesClient = new Statistiques();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];
  });

  describe('obtenirStatistiquesFrequentation', () => {
    it('should return attendance statistics', async () => {
      // Mock data
      const mockTotalResult = 120;
      const mockParCoursResult = [
        { cours_id: 1, titre: 'Karate Débutant', frequentation: 50 },
        { cours_id: 2, titre: 'Karate Avancé', frequentation: 70 }
      ];
      const mockParMoisResult = [
        { mois: 'Janvier', frequentation: 30 },
        { mois: 'Février', frequentation: 40 },
        { mois: 'Mars', frequentation: 50 }
      ];

      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          if (_sql.includes('COUNT(*) as total')) {
            callback(null, [{ total: mockTotalResult }]);
          } else if (_sql.includes('cours c')) {
            callback(null, mockParCoursResult);
          } else if (_sql.includes('MONTHNAME')) {
            callback(null, mockParMoisResult);
          }
        }
      );

      const result = await statistiquesClient.obtenirStatistiquesFrequentation();

      expect(result).toEqual({
        totalFrequentation: mockTotalResult,
        frequentationParCours: mockParCoursResult,
        frequentationParMois: mockParMoisResult
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(3);
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(new Error('Database error'), undefined);
        }
      );

      await expect(statistiquesClient.obtenirStatistiquesFrequentation()).rejects.toThrow('Database error');
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('obtenirProgressionUtilisateur', () => {
    it('should return user progression data', async () => {
      // Mock data
      const mockCoursSuivisResult = 15;
      const mockProgressionResult = [
        { cours_id: 1, titre: 'Karate Débutant', cours_suivis: 10, progression: 80 },
        { cours_id: 2, titre: 'Karate Avancé', cours_suivis: 5, progression: 40 }
      ];

      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          if (_sql.includes('COUNT(*) as total')) {
            callback(null, [{ total: mockCoursSuivisResult }]);
          } else if (_sql.includes('COUNT(uc.id) as cours_suivis')) {
            callback(null, mockProgressionResult);
          }
        }
      );

      const result = await statistiquesClient.obtenirProgressionUtilisateur(1);

      expect(result).toEqual({
        utilisateur_id: 1,
        coursSuivis: mockCoursSuivisResult,
        progressionParCours: mockProgressionResult,
        niveauActuel: 'Intermédiaire'
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(2);
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should set correct level based on courses taken', async () => {
      // Test for "Débutant" level
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, [{ total: 5 }]);
        }
      ).mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, []);
        }
      );

      let result = await statistiquesClient.obtenirProgressionUtilisateur(1);
      expect(result.niveauActuel).toBe('Débutant');

      jest.clearAllMocks();
      mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];

      // Test for "Avancé" level
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, [{ total: 35 }]);
        }
      ).mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, []);
        }
      );

      result = await statistiquesClient.obtenirProgressionUtilisateur(1);
      expect(result.niveauActuel).toBe('Avancé');
    });
  });

  describe('obtenirPresenceParMois', () => {
    it('should return presence data by month', async () => {
      // Mock data
      const mockPresenceData = [
        { mois: 1, annee: 2023, nombre_presences: 8 },
        { mois: 2, annee: 2023, nombre_presences: 10 }
      ];

      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, mockPresenceData);
        }
      );

      const result = await statistiquesClient.obtenirPresenceParMois(1);

      expect(result).toEqual(mockPresenceData);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT MONTH(c.date) as mois'),
        [1],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('formatPresenceData', () => {
    it('should format presence data correctly', () => {
      const rawData = [
        { mois: 1, annee: 2023, nombre_presences: 8 },
        { mois: 2, annee: 2023, nombre_presences: 10 }
      ];
      const formattedData = statistiquesClient.formatPresenceData(rawData);
      expect(formattedData).toEqual([
        { mois: 'Janvier', annee: 2023, nombre_presences: 8, label: 'Janvier 2023' },
        { mois: 'Février', annee: 2023, nombre_presences: 10, label: 'Février 2023' }
      ]);
    });
  });
});
