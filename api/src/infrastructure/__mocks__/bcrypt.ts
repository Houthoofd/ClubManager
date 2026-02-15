import { jest } from "@jest/globals";

export default {
  hash: (jest.fn() as any).mockResolvedValue("$2b$10$mockedHashedPassword"),
  compare: (jest.fn() as any).mockResolvedValue(true),
  genSalt: (jest.fn() as any).mockResolvedValue("$2b$10$mockSalt"),
  hashSync: (jest.fn() as any).mockReturnValue("$2b$10$mockedHashedPassword"),
  compareSync: (jest.fn() as any).mockReturnValue(true),
};
