import { jest } from '@jest/globals';

// Configurer les mocks globaux pour MySQL - Correction du chemin
jest.mock('../../../db/connector/mysqlconnector', () => {
  // Créer des mocks globaux pour être utilisés dans tous les tests
  const mockQuery = jest.fn();
  const mockClose = jest.fn();
  
  // Exporter les mocks pour y accéder depuis les tests
  global.mockQuery = mockQuery;
  global.mockClose = mockClose;
  
  return {
    default: jest.fn().mockImplementation(() => {
      return {
        query: mockQuery,
        close: mockClose,
        connect: jest.fn(),
        beginTransaction: jest.fn(callback => callback && callback(null)),
        commit: jest.fn(callback => callback && callback(null)),
        rollback: jest.fn(callback => callback && callback())
      };
    })
  };
});

// Ce fichier sera exécuté avant chaque test pour préparer l'environnement

// Désactiver les logs de console pendant les tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();
