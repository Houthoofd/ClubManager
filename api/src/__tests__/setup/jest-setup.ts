import { jest } from '@jest/globals';

// Type de callback pour les transactions MySQL
type TransactionCallback = (error: Error | null) => void;

// Déclarer les types pour l'objet global
declare global {
  // eslint-disable-next-line no-var
  var mockQuery: jest.Mock;
  // eslint-disable-next-line no-var
  var mockClose: jest.Mock;
  namespace NodeJS {
    interface Global {
      mockQuery: jest.Mock;
      mockClose: jest.Mock;
    }
  }
}

// Créer les mocks globaux à utiliser
global.mockQuery = jest.fn();
global.mockClose = jest.fn();

// Configurer le mock pour mysqlconnector sans utiliser jest.mock
// Nous utiliserons le mock au niveau du fichier de test individuel à la place
const mysqlconnectorMock = {
  default: jest.fn().mockImplementation(() => ({
    query: global.mockQuery,
    close: global.mockClose,
    connect: jest.fn(),
    beginTransaction: jest.fn((callback?: TransactionCallback) => {
      if (callback) callback(null);
    }),
    commit: jest.fn((callback?: TransactionCallback) => {
      if (callback) callback(null);
    }),
    rollback: jest.fn((callback?: TransactionCallback) => {
      if (callback) callback(null);
    })
  }))
};

// Exporter le mock pour l'utiliser dans les tests individuels
export { mysqlconnectorMock };

// Ce fichier sera exécuté avant chaque test pour préparer l'environnement
// Désactiver les logs de console pendant les tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();
// Désactiver les logs de console pendant les tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();
