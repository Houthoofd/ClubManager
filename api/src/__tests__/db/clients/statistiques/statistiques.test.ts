import { jest } from '@jest/globals';
import { Statistiques } from '../../../../db/clients/statistiques/statistiques.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import { MysqlError } from 'mysql';

// Mock MySQL Connector
jest.mock('../../../../db/connector/mysqlconnector.js');

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
      const mockTotalResult = 120;
      const mockParCoursResult = [
        { cours_id: 1, titre: 'Karate Débutant', frequentation: 50 },
        { cours_id: 2, titre: 'Karate Avancé', frequentation: 70 },
      ];
      
      const mockParMoisResult = [
        { cours_id: 1, titre: 'Karate Débutant', frequentation: 50 },
        { cours_id: 2, titre: 'Karate Avancé', frequentation: 70 },
      ];

      // Utiliser la séquence correcte pour les mocks
      let queryCount = 0;
      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        queryCount++;
        
        // Pour la première requête (total)
        if (queryCount === 1) {
          // S'assurer que le format correspond exactement à ce que le code attend
          callback(null, [{ total: mockTotalResult }]);
        }
        // Pour la deuxième requête (par cours)
        else if (queryCount === 2) {
          callback(null, mockParCoursResult);
        }
        // Pour la troisième requête (par mois)
        else if (queryCount === 3) {
          callback(null, mockParMoisResult);
        }
        else {
          callback(null, []);
        }
      });

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
      // Utiliser la signature correcte pour le mock
      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(new Error('Database error'), undefined);
      });

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

      // Setup mock implementation with correct signature
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: Function) => {
          if (_sql.includes('COUNT(*) as total')) {
            callback(null, [{ total: mockCoursSuivisResult }]);
          } else if (_sql.includes('COUNT(uc.id) as cours_suivis')) {
            callback(null, mockProgressionResult);
          } else {
            callback(null, []);
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
      // Test for "Débutant" level - using correct mock signature
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: Function) => {
          callback(null, [{ total: 5 }]);
        }
      ).mockImplementationOnce(
        (_sql: string, _values: any[], callback: Function) => {
          callback(null, []);
        }
      );

      let result = await statistiquesClient.obtenirProgressionUtilisateur(1);
      expect(result.niveauActuel).toBe('Débutant');

      jest.clearAllMocks();
      mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];

      // Test for "Avancé" level - using correct mock signature
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: Function) => {
          callback(null, [{ total: 35 }]);
        }
      ).mockImplementationOnce(
        (_sql: string, _values: any[], callback: Function) => {
          callback(null, []);
        }
      );

      result = await statistiquesClient.obtenirProgressionUtilisateur(1);
      expect(result.niveauActuel).toBe('Avancé');
    });
  });

  describe('obtenirPresenceParMois', () => {
    it('should return presence data by month', async () => {
      const userId = 1;
      const mockPresenceData = [
        { mois: 1, annee: 2023, nombre_presences: 10 },
        { mois: 2, annee: 2023, nombre_presences: 8 },
      ];

      // Utiliser la signature correcte avec valeurs et callback
      mockMysqlConnector.query.mockImplementation((_sql: string, values: number[], callback: Function) => {
        expect(values).toEqual([userId]);
        callback(null, mockPresenceData);
      });

      const result = await statistiquesClient.obtenirPresenceParMois(userId);

      expect(result).toEqual(mockPresenceData);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
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

