/**
 * Mock Prisma pour les tests du service Messagerie
 */

import { jest } from "@jest/globals";

// Helper pour créer des fonctions mock simples
const createMockFn = () => {
  const calls: any[] = [];
  const resolvedValues: any[] = [];
  let defaultValue: any = undefined;
  let isRejected = false;

  const fn: any = (...args: any[]) => {
    calls.push(args);

    // Si on a des valeurs pour mockResolvedValueOnce
    if (resolvedValues.length > 0) {
      const value = resolvedValues.shift();
      return isRejected ? Promise.reject(value) : Promise.resolve(value);
    }

    // Sinon utiliser la valeur par défaut
    if (fn._implementation) {
      return fn._implementation(...args);
    }

    return isRejected
      ? Promise.reject(defaultValue)
      : Promise.resolve(defaultValue);
  };

  fn._implementation = null;
  fn._calls = calls;

  fn.mockResolvedValue = (value: any) => {
    defaultValue = value;
    isRejected = false;
    return fn;
  };

  fn.mockRejectedValue = (value: any) => {
    defaultValue = value;
    isRejected = true;
    return fn;
  };

  fn.mockResolvedValueOnce = (value: any) => {
    resolvedValues.push(value);
    isRejected = false;
    return fn;
  };

  fn.mockRejectedValueOnce = (value: any) => {
    resolvedValues.push(value);
    isRejected = true;
    return fn;
  };

  fn.mockImplementation = (impl: any) => {
    fn._implementation = impl;
    return fn;
  };

  fn.mockReset = () => {
    fn._implementation = null;
    calls.length = 0;
    resolvedValues.length = 0;
    defaultValue = undefined;
    isRejected = false;
    return fn;
  };

  // Pour les assertions Jest
  fn.mock = {
    get calls() {
      return calls;
    },
  };

  return fn;
};

export const createMockPrisma = () => {
  return {
    messages: {
      findMany: createMockFn(),
      findFirst: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      delete: createMockFn(),
      deleteMany: createMockFn(),
      count: createMockFn(),
    },
    messages_personnalises: {
      findMany: createMockFn(),
      findFirst: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      updateMany: createMockFn(),
      delete: createMockFn(),
      deleteMany: createMockFn(),
      count: createMockFn(),
      groupBy: createMockFn(),
    },
    message_status: {
      findMany: createMockFn(),
      findFirst: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      createMany: createMockFn(),
      update: createMockFn(),
      updateMany: createMockFn(),
      upsert: createMockFn(),
      delete: createMockFn(),
      deleteMany: createMockFn(),
      count: createMockFn(),
    },
    utilisateurs: {
      findMany: createMockFn(),
      findFirst: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      delete: createMockFn(),
      count: createMockFn(),
    },
    groupes: {
      findMany: createMockFn(),
      findFirst: createMockFn(),
      findUnique: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      delete: createMockFn(),
    },
    groupes_utilisateurs: {
      findMany: createMockFn(),
      findFirst: createMockFn(),
      create: createMockFn(),
      delete: createMockFn(),
    },
    notifications: {
      findMany: createMockFn(),
      create: createMockFn(),
      update: createMockFn(),
      delete: createMockFn(),
    },
    $queryRaw: createMockFn(),
    $transaction: createMockFn(),
  } as any;
};

/**
 * Données de test
 */
export const mockUtilisateur = {
  id: 1,
  prenom: "Jean",
  nom: "Dupont",
  email: "jean.dupont@test.com",
  userId: "user123",
  statut: "actif",
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

export const mockUtilisateur2 = {
  id: 2,
  prenom: "Marie",
  nom: "Martin",
  email: "marie.martin@test.com",
  userId: "user456",
  statut: "actif",
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

export const mockMessage = {
  id: 1,
  sender_id: 1,
  receiver_id: 2,
  groupe_id: null,
  contenu: "Bonjour",
  created_at: new Date("2024-01-15"),
  utilisateurs_messages_sender_idToutilisateurs: {
    prenom: "Jean",
    nom: "Dupont",
  },
  message_status: [],
};

export const mockMessagePersonnalise = {
  id: 1,
  utilisateur_id: 2,
  contenu: "Message personnalisé",
  lu: false,
  is_active: true,
  deleted_at: null,
  deleted_by: null,
  status_envoi: "sent" as const,
  sendgrid_message_id: null,
  error_details: null,
  date_lecture: null,
  created_at: new Date("2024-01-15"),
  updated_at: new Date("2024-01-15"),
};

export const mockGroupe = {
  id: 1,
  nom: "Groupe Test",
  description: "Description test",
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

export const mockMessageStatus = {
  id: 1,
  message_id: 1,
  utilisateur_id: 2,
  status: "non_vu" as const,
  updated_at: new Date("2024-01-15"),
};

export const mockStatistiques = {
  totalTypesMessages: 0,
  totalMessagesEnvoyes: 10,
  messagesUtilisateur: 5,
  messagesNonLus: 2,
  messagesParJour: [
    { date: "2024-01-15", count: 5 },
    { date: "2024-01-14", count: 3 },
  ],
};

/**
 * Réinitialise tous les mocks
 */
export const resetAllMocks = (mockPrisma: any) => {
  Object.values(mockPrisma).forEach((model: any) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((fn: any) => {
        if (typeof fn === "function" && "mockReset" in fn) {
          fn.mockReset();
        }
      });
    }
  });
};

/**
 * Configure les mocks par défaut pour un utilisateur valide
 */
export const setupDefaultMocks = (mockPrisma: any) => {
  mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
  mockPrisma.utilisateurs.findMany.mockResolvedValue([
    mockUtilisateur,
    mockUtilisateur2,
  ]);
  mockPrisma.messages.findMany.mockResolvedValue([]);
  mockPrisma.messages_personnalises.findMany.mockResolvedValue([]);
  mockPrisma.message_status.count.mockResolvedValue(0);
  mockPrisma.messages_personnalises.count.mockResolvedValue(0);
};
