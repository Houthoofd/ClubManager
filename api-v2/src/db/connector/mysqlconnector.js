// Mock for Jest tests
import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockClose = jest.fn();
const mockConnect = jest.fn();
const mockBeginTransaction = jest.fn(cb => cb && cb(null));
const mockCommit = jest.fn(cb => cb && cb(null));
const mockRollback = jest.fn(cb => cb && cb(null));

// Create a mock constructor with Jest mock functionality
function MysqlConnector() {
  return {
    query: mockQuery,
    close: mockClose,
    connect: mockConnect,
    beginTransaction: mockBeginTransaction,
    commit: mockCommit,
    rollback: mockRollback
  };
}

// Add mock property for Jest to recognize this as a mock
MysqlConnector.mock = {
  instances: [{
    query: mockQuery,
    close: mockClose,
    connect: mockConnect,
    beginTransaction: mockBeginTransaction,
    commit: mockCommit,
    rollback: mockRollback
  }]
};

export default MysqlConnector;
