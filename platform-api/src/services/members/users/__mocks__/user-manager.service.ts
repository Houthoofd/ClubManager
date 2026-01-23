import { jest } from '@jest/globals';

export const userManagerService = {
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  listUsers: jest.fn(),
  register: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  verifyUser: jest.fn(),
};
