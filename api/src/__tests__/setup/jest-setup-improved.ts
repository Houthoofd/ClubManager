import { jest } from '@jest/globals';

// Type de callback pour les transactions MySQL
type TransactionCallback = (error: Error | null) => void;

// Types pour les mocks PostgreSQL
type PgQueryResult = {
  rows: any[];
  rowCount?: number;
  command?: string;
  oid?: number;
  fields?: any[];
};

// Déclarer les types pour l'objet global
declare global {
  var mockQuery: jest.Mock;
  var mockClose: jest.Mock;
  var mockApp: any;
  var mockMysqlConnector: any;
  namespace NodeJS {
    interface Global {
      mockQuery: jest.Mock;
      mockClose: jest.Mock;
      mockApp: any;
      mockMysqlConnector: any;
    }
  }
}

// Créer les mocks globaux à utiliser
global.mockQuery = jest.fn();
global.mockClose = jest.fn();

// Désactiver les logs console pendant les tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Créer un mock Express au lieu d'utiliser le vrai Express
global.mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  listen: jest.fn(),
  json: jest.fn(() => ({ use: jest.fn() }))
};

// Créer un mock MySql connector directement disponible globalement
// au lieu d'essayer de mocker un module qui peut ne pas exister
global.mockMysqlConnector = {
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
};

// Au lieu d'essayer de mocker automatiquement le module, 
// définissons une fonction que les tests peuvent utiliser pour mocker manuellement
// les modules dont ils ont besoin
export function getMockConnector() {
  return jest.fn().mockImplementation(() => global.mockMysqlConnector);
}

// Fonction pour mocker pg (PostgreSQL)
export function mockPg() {
  jest.mock('pg', () => {
    const mockResult = { rows: [] };
    const queryMock = jest.fn().mockImplementation(() => Promise.resolve(mockResult));

    const mockClientObject = {
      query: jest.fn().mockImplementation(() => Promise.resolve(mockResult)),
      release: jest.fn(),
    };

    const mockPool = {
      query: queryMock,
      connect: jest.fn().mockImplementation(() => Promise.resolve(mockClientObject)),
      end: jest.fn(),
    };

    return {
      Pool: jest.fn(() => mockPool),
    };
  });
}

// Fonction utilitaire pour mocker un module client DB
export function mockDbClient(path: string) {
  jest.mock(path, () => {
    const mockResult = { rows: [] };
    const queryMock = jest.fn().mockImplementation(() => Promise.resolve(mockResult));

    const MockClient = jest.fn().mockImplementation(() => ({
      query: queryMock,
      close: jest.fn(),
    }));

    return {
      default: MockClient,
    };
  });
}
