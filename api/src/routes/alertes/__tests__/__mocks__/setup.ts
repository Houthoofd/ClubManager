/**
 * Setup file for Alertes module tests
 * Mocks all external dependencies to isolate test environment
 */

// Mock @clubmanager/types/validators
jest.mock("@clubmanager/types/validators", () => ({
  obtenirAlerteSchema: {
    parse: jest.fn((data) => data),
  },
  obtenirAlertesUtilisateurSchema: {
    parse: jest.fn((data) => data),
  },
  resoudreAlerteSchema: {
    parse: jest.fn((data) => data),
  },
  ignorerAlerteSchema: {
    parse: jest.fn((data) => data),
  },
}));

// Mock DB Client Alerte
jest.mock("../../../../db/clients/alertes/alertes.js", () => ({
  Alerte: jest.fn().mockImplementation(() => ({
    obtenirDashboardAlertes: jest.fn(),
    obtenirAlertesActives: jest.fn(),
    obtenirAlertesUtilisateur: jest.fn(),
    obtenirAlerteParId: jest.fn(),
    detecterAlertes: jest.fn(),
    resoudreAlerte: jest.fn(),
    ignorerAlerte: jest.fn(),
  })),
}));

// Mock GraphQL Errors
jest.mock("../../../../shared/errors/GraphQLErrors.js", () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message: string, public details?: any) {
      super(message);
      this.name = "ValidationError";
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NotFoundError";
    }
  },
  InternalServerError: class InternalServerError extends Error {
    constructor(message: string, public originalError?: any) {
      super(message);
      this.name = "InternalServerError";
    }
  },
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthenticationError";
    }
  },
  AuthorizationError: class AuthorizationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthorizationError";
    }
  },
}));

export {};
