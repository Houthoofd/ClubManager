/**
 * Tests pour les middleware Auth
 * Teste requireAuth, requireAdmin, requireOwner, etc.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { GraphQLResolveInfo } from "graphql";
import {
  requireAuth,
  requireAdmin,
  requireOwner,
  requireVerifiedEmail,
  isAuthenticated,
  hasRole,
  isAdmin,
  isOwner,
  canAccess,
  AuthContext,
} from "../core/middleware/auth.middleware.js";
import {
  UnauthenticatedError,
  ForbiddenError,
  AccountDisabledError,
  EmailNotVerifiedError,
} from "../core/errors/auth.errors.js";

describe("Auth Middleware Tests", () => {
  let mockContext: AuthContext;
  let mockInfo: GraphQLResolveInfo;
  let mockResolver: jest.Mock;

  beforeEach(() => {
    // Reset mock context
    mockContext = {
      user: undefined,
      req: {},
      res: {},
    };

    // Mock GraphQL info
    mockInfo = {} as GraphQLResolveInfo;

    // Mock resolver
    mockResolver = jest.fn(async (parent, args, context) => ({
      success: true,
      data: "test",
    }));
  });

  // ==========================================================================
  // requireAuth Tests
  // ==========================================================================

  describe("requireAuth", () => {
    it("devrait permettre l'accès si l'utilisateur est authentifié", async () => {
      mockContext.user = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        status_id: 1,
        role: "user",
      };

      const protectedResolver = requireAuth(mockResolver);
      const result = await protectedResolver({}, {}, mockContext, mockInfo);

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });

    it("devrait rejeter si l'utilisateur n'est pas authentifié", async () => {
      mockContext.user = undefined;

      const protectedResolver = requireAuth(mockResolver);

      await expect(
        protectedResolver({}, {}, mockContext, mockInfo)
      ).rejects.toThrow(UnauthenticatedError);

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it("devrait accepter un message d'erreur personnalisé", async () => {
      mockContext.user = undefined;

      const protectedResolver = requireAuth(mockResolver, {
        message: "Accès réservé aux membres",
      });

      await expect(
        protectedResolver({}, {}, mockContext, mockInfo)
      ).rejects.toThrow("Accès réservé aux membres");
    });

    it("devrait vérifier que le compte est actif si requireActiveAccount est true", async () => {
      mockContext.user = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        status_id: 2, // Compte inactif
        role: "user",
      };

      const protectedResolver = requireAuth(mockResolver, {
        requireActiveAccount: true,
      });

      await expect(
        protectedResolver({}, {}, mockContext, mockInfo)
      ).rejects.toThrow(AccountDisabledError);

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it("devrait permettre l'accès si le compte est actif", async () => {
      mockContext.user = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        status_id: 1, // Compte actif
        role: "user",
      };

      const protectedResolver = requireAuth(mockResolver, {
        requireActiveAccount: true,
      });

      const result = await protectedResolver({}, {}, mockContext, mockInfo);

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });

    it("devrait vérifier l'email si requireEmailVerified est true", async () => {
      mockContext.user = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        status_id: 1,
        role: "user",
        email_verifie: false, // Email non vérifié
      };

      const protectedResolver = requireAuth(mockResolver, {
        requireEmailVerified: true,
      });

      await expect(
        protectedResolver({}, {}, mockContext, mockInfo)
      ).rejects.toThrow(EmailNotVerifiedError);

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it("devrait permettre l'accès si l'email est vérifié", async () => {
      mockContext.user = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        status_id: 1,
        role: "user",
        email_verifie: true, // Email vérifié
      };

      const protectedResolver = requireAuth(mockResolver, {
        requireEmailVerified: true,
      });

      const result = await protectedResolver({}, {}, mockContext, mockInfo);

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });

    it("devrait vérifier le rôle si roles est spécifié", async () => {
      mockContext.user = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        status_id: 1,
        role: "user",
      };

      const protectedResolver = requireAuth(mockResolver, {
        roles: ["admin", "super_admin"],
      });

      await expect(
        protectedResolver({}, {}, mockContext, mockInfo)
      ).rejects.toThrow(ForbiddenError);

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it("devrait permettre l'accès si le rôle correspond", async () => {
      mockContext.user = {
        id: 1,
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        status_id: 1,
        role: "admin",
      };

      const protectedResolver = requireAuth(mockResolver, {
        roles: ["admin", "super_admin"],
      });

      const result = await protectedResolver({}, {}, mockContext, mockInfo);

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });
  });

  // ==========================================================================
  // requireAdmin Tests
  // ==========================================================================

  describe("requireAdmin", () => {
    it("devrait permettre l'accès aux admins", async () => {
      mockContext.user = {
        id: 1,
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        status_id: 1,
        role: "admin",
      };

      const adminResolver = requireAdmin(mockResolver);
      const result = await adminResolver({}, {}, mockContext, mockInfo);

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });

    it("devrait permettre l'accès aux super_admins", async () => {
      mockContext.user = {
        id: 1,
        email: "superadmin@example.com",
        first_name: "Super",
        last_name: "Admin",
        status_id: 1,
        role: "super_admin",
      };

      const adminResolver = requireAdmin(mockResolver);
      const result = await adminResolver({}, {}, mockContext, mockInfo);

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });

    it("devrait rejeter les utilisateurs normaux", async () => {
      mockContext.user = {
        id: 1,
        email: "user@example.com",
        first_name: "Normal",
        last_name: "User",
        status_id: 1,
        role: "user",
      };

      const adminResolver = requireAdmin(mockResolver);

      await expect(
        adminResolver({}, {}, mockContext, mockInfo)
      ).rejects.toThrow(ForbiddenError);

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it("devrait rejeter les utilisateurs non authentifiés", async () => {
      mockContext.user = undefined;

      const adminResolver = requireAdmin(mockResolver);

      await expect(
        adminResolver({}, {}, mockContext, mockInfo)
      ).rejects.toThrow(UnauthenticatedError);

      expect(mockResolver).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // requireOwner Tests
  // ==========================================================================

  describe("requireOwner", () => {
    it("devrait permettre l'accès au propriétaire", async () => {
      mockContext.user = {
        id: 123,
        email: "owner@example.com",
        first_name: "Owner",
        last_name: "User",
        status_id: 1,
        role: "user",
      };

      const ownerResolver = requireOwner(
        mockResolver,
        (args: any) => args.userId
      );

      const result = await ownerResolver(
        {},
        { userId: 123 },
        mockContext,
        mockInfo
      );

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });

    it("devrait rejeter si l'utilisateur n'est pas le propriétaire", async () => {
      mockContext.user = {
        id: 123,
        email: "user@example.com",
        first_name: "User",
        last_name: "Test",
        status_id: 1,
        role: "user",
      };

      const ownerResolver = requireOwner(
        mockResolver,
        (args: any) => args.userId
      );

      await expect(
        ownerResolver({}, { userId: 456 }, mockContext, mockInfo)
      ).rejects.toThrow(ForbiddenError);

      expect(mockResolver).not.toHaveBeenCalled();
    });

    it("devrait permettre l'accès aux admins même s'ils ne sont pas propriétaires", async () => {
      mockContext.user = {
        id: 999,
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        status_id: 1,
        role: "admin",
      };

      const ownerResolver = requireOwner(
        mockResolver,
        (args: any) => args.userId
      );

      const result = await ownerResolver(
        {},
        { userId: 123 },
        mockContext,
        mockInfo
      );

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });

    it("devrait gérer les IDs en string", async () => {
      mockContext.user = {
        id: 123,
        email: "owner@example.com",
        first_name: "Owner",
        last_name: "User",
        status_id: 1,
        role: "user",
      };

      const ownerResolver = requireOwner(
        mockResolver,
        (args: any) => args.userId
      );

      const result = await ownerResolver(
        {},
        { userId: "123" }, // String ID
        mockContext,
        mockInfo
      );

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });
  });

  // ==========================================================================
  // requireVerifiedEmail Tests
  // ==========================================================================

  describe("requireVerifiedEmail", () => {
    it("devrait permettre l'accès si l'email est vérifié", async () => {
      mockContext.user = {
        id: 1,
        email: "verified@example.com",
        first_name: "Verified",
        last_name: "User",
        status_id: 1,
        role: "user",
        email_verifie: true,
      };

      const verifiedResolver = requireVerifiedEmail(mockResolver);
      const result = await verifiedResolver({}, {}, mockContext, mockInfo);

      expect(mockResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "test" });
    });

    it("devrait rejeter si l'email n'est pas vérifié", async () => {
      mockContext.user = {
        id: 1,
        email: "unverified@example.com",
        first_name: "Unverified",
        last_name: "User",
        status_id: 1,
        role: "user",
        email_verifie: false,
      };

      const verifiedResolver = requireVerifiedEmail(mockResolver);

      await expect(
        verifiedResolver({}, {}, mockContext, mockInfo)
      ).rejects.toThrow(EmailNotVerifiedError);

      expect(mockResolver).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Helper Functions Tests
  // ==========================================================================

  describe("isAuthenticated", () => {
    it("devrait retourner true si l'utilisateur est authentifié", () => {
      mockContext.user = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        status_id: 1,
      };

      expect(isAuthenticated(mockContext)).toBe(true);
    });

    it("devrait retourner false si l'utilisateur n'est pas authentifié", () => {
      mockContext.user = undefined;
      expect(isAuthenticated(mockContext)).toBe(false);
    });
  });

  describe("hasRole", () => {
    it("devrait retourner true si l'utilisateur a le rôle", () => {
      mockContext.user = {
        id: 1,
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        status_id: 1,
        role: "admin",
      };

      expect(hasRole(mockContext, ["admin", "super_admin"])).toBe(true);
    });

    it("devrait retourner false si l'utilisateur n'a pas le rôle", () => {
      mockContext.user = {
        id: 1,
        email: "user@example.com",
        first_name: "User",
        last_name: "Test",
        status_id: 1,
        role: "user",
      };

      expect(hasRole(mockContext, ["admin", "super_admin"])).toBe(false);
    });

    it("devrait retourner false si l'utilisateur n'est pas authentifié", () => {
      mockContext.user = undefined;
      expect(hasRole(mockContext, ["admin"])).toBe(false);
    });

    it("devrait utiliser 'user' comme rôle par défaut", () => {
      mockContext.user = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        status_id: 1,
        // role non défini
      };

      expect(hasRole(mockContext, ["user"])).toBe(true);
    });
  });

  describe("isAdmin", () => {
    it("devrait retourner true pour les admins", () => {
      mockContext.user = {
        id: 1,
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        status_id: 1,
        role: "admin",
      };

      expect(isAdmin(mockContext)).toBe(true);
    });

    it("devrait retourner true pour les super_admins", () => {
      mockContext.user = {
        id: 1,
        email: "superadmin@example.com",
        first_name: "Super",
        last_name: "Admin",
        status_id: 1,
        role: "super_admin",
      };

      expect(isAdmin(mockContext)).toBe(true);
    });

    it("devrait retourner false pour les utilisateurs normaux", () => {
      mockContext.user = {
        id: 1,
        email: "user@example.com",
        first_name: "User",
        last_name: "Test",
        status_id: 1,
        role: "user",
      };

      expect(isAdmin(mockContext)).toBe(false);
    });
  });

  describe("isOwner", () => {
    it("devrait retourner true si l'utilisateur est propriétaire", () => {
      mockContext.user = {
        id: 123,
        email: "owner@example.com",
        first_name: "Owner",
        last_name: "User",
        status_id: 1,
      };

      expect(isOwner(mockContext, 123)).toBe(true);
    });

    it("devrait retourner true avec ID en string", () => {
      mockContext.user = {
        id: 123,
        email: "owner@example.com",
        first_name: "Owner",
        last_name: "User",
        status_id: 1,
      };

      expect(isOwner(mockContext, "123")).toBe(true);
    });

    it("devrait retourner false si l'utilisateur n'est pas propriétaire", () => {
      mockContext.user = {
        id: 123,
        email: "user@example.com",
        first_name: "User",
        last_name: "Test",
        status_id: 1,
      };

      expect(isOwner(mockContext, 456)).toBe(false);
    });

    it("devrait retourner false si l'utilisateur n'est pas authentifié", () => {
      mockContext.user = undefined;
      expect(isOwner(mockContext, 123)).toBe(false);
    });
  });

  describe("canAccess", () => {
    it("devrait retourner true si l'utilisateur est admin", () => {
      mockContext.user = {
        id: 999,
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        status_id: 1,
        role: "admin",
      };

      expect(canAccess(mockContext, 123)).toBe(true);
    });

    it("devrait retourner true si l'utilisateur est propriétaire", () => {
      mockContext.user = {
        id: 123,
        email: "owner@example.com",
        first_name: "Owner",
        last_name: "User",
        status_id: 1,
        role: "user",
      };

      expect(canAccess(mockContext, 123)).toBe(true);
    });

    it("devrait retourner false si l'utilisateur n'est ni admin ni propriétaire", () => {
      mockContext.user = {
        id: 456,
        email: "user@example.com",
        first_name: "User",
        last_name: "Test",
        status_id: 1,
        role: "user",
      };

      expect(canAccess(mockContext, 123)).toBe(false);
    });
  });
});
