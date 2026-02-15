/**
 * Mock centralisé pour MysqlConnector
 * Utilisé par Jest pour mocker les appels à la base de données dans les tests
 */

import { jest } from "@jest/globals";

const mockQuery = jest.fn() as any;
const mockClosePool = (jest.fn() as any).mockResolvedValue(undefined);
const mockWaitForConnection = (jest.fn() as any).mockResolvedValue(undefined);
const mockClose = (jest.fn() as any).mockResolvedValue(undefined);
const mockBeginTransaction = jest.fn() as any;
const mockCommit = jest.fn() as any;
const mockRollback = jest.fn() as any;
const mockGetPoolStatus = (jest.fn() as any)(() => ({
  total: 0,
  free: 0,
  used: 0,
  healthy: true,
}));

const mockInstance = {
  query: mockQuery,
  isPoolHealthy: (jest.fn() as any)(() => true),
  closePool: mockClosePool,
  waitForConnection: mockWaitForConnection,
  close: mockClose,
  beginTransaction: mockBeginTransaction,
  commit: mockCommit,
  rollback: mockRollback,
  getPoolStatus: mockGetPoolStatus,
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
    mockClosePool.mockClear();
    mockWaitForConnection.mockClear();
    mockClose.mockClear();
    mockBeginTransaction.mockClear();
    mockCommit.mockClear();
    mockRollback.mockClear();
    mockGetPoolStatus.mockClear();
  }

  public query = mockQuery;
  public closePool = mockClosePool;
  public waitForConnection = mockWaitForConnection;
  public close = mockClose;
  public beginTransaction = mockBeginTransaction;
  public commit = mockCommit;
  public rollback = mockRollback;
  public getPoolStatus = mockGetPoolStatus;
}

export default MockMysqlConnector;
export {
  mockQuery,
  mockInstance,
  mockClosePool,
  mockWaitForConnection,
  mockClose,
  mockBeginTransaction,
  mockCommit,
  mockRollback,
  mockGetPoolStatus,
};
