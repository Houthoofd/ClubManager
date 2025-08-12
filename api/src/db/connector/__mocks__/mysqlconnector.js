import { jest } from '@jest/globals';

function MysqlConnector() {
  return {
    query: jest.fn(),
    close: jest.fn(),
    connect: jest.fn(),
    beginTransaction: jest.fn(callback => callback && callback(null)),
    commit: jest.fn(callback => callback && callback(null)),
    rollback: jest.fn(callback => callback && callback(null))
  };
}

export default MysqlConnector;
