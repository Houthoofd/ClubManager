import { jest } from "@jest/globals";

export default {
  hash: jest.fn().mockResolvedValue("$2b$10$mockedHashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue("$2b$10$mockSalt"),
  hashSync: jest.fn().mockReturnValue("$2b$10$mockedHashedPassword"),
  compareSync: jest.fn().mockReturnValue(true),
};
