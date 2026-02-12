// Mock pour mysql2
export const mockConnection = {
  query: jest.fn(),
  release: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  destroy: jest.fn(),
  threadId: 123,
};

export const mockPool = {
  getConnection: jest.fn((callback: any) => {
    callback(null, mockConnection);
  }),
  end: jest.fn((callback: any) => {
    callback(null);
  }),
  on: jest.fn(),
  _allConnections: [],
  _freeConnections: [],
};

const mysql2Mock = {
  createPool: jest.fn(() => mockPool),
};

export default mysql2Mock;
