/**
 * Setup des mocks pour les tests
 */

// Mock du Prisma Client
const mockPrisma = {
  alertes_utilisateurs: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  alertes_types: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  utilisateurs: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  $transaction: jest.fn().mockImplementation(async (cb: any) => {
    return cb({
      alertes_utilisateurs: {
        update: jest.fn().mockResolvedValue({ id: 1 }),
      },
      alertes_actions: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    });
  }),
};

export { mockPrisma };
