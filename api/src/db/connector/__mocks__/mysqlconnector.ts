/**
 * Mock centralisé pour MysqlConnector
 * Utilisé par Jest pour mocker les appels à la base de données dans les tests
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

const mockInstance = {
  query: mockQuery,
  isPoolHealthy: jest.fn(() => true),
};

class MockMysqlConnector {
  private static instance: any;

  public static getInstance() {
    if (!MockMysqlConnector.instance) {
      MockMysqlConnector.instance = mockInstance;
    }
    return MockMysqlConnector.instance;
  }

  public static resetInstance() {
    MockMysqlConnector.instance = undefined;
    mockQuery.mockClear();
  }

  public query = mockQuery;
}

export default MockMysqlConnector;
export { mockQuery, mockInstance };
