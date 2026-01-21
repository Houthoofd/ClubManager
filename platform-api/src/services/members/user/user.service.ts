import { authService } from "../../infrastructure/auth/auth.service.js";
import { userManagerService } from "../users/user-manager.service.js";
import type { 
  LoginCredentials, 
  RegisterUserData, 
  AuthResult, 
  UserProfile 
} from "../../infrastructure/auth/auth.types.js";

/**
 * User Service - Delegates to appropriate specialized services
 * This is a facade that routes requests to auth or user management services
 */
export class UserService {
  
  // Authentication methods - delegate to authService
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    return authService.login(credentials);
  }

  async register(data: RegisterUserData): Promise<AuthResult> {
    return authService.register(data);
  }

  async verifyAuth(token: string) {
    return authService.verifyAuth(token);
  }

  async hashPassword(password: string): Promise<string> {
    return authService.hashPassword(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return authService.verifyPassword(password, hash);
  }

  // Token methods - delegate to authService
  generateToken(userId: number, email: string, tenantId: string, statusId?: number): string {
    return authService.generateToken({ id: userId, email, tenantId });
  }

  verifyToken(token: string): any {
    return authService.verifyToken(token);
  }

  // User management methods - delegate to userManagerService
  async findByEmail(email: string, tenantId: string) {
    return userManagerService.findByEmail(email, tenantId);
  }

  async getUserById(userId: number, tenantId: string): Promise<import("../users/user-manager.service.js").UserProfile | null> {
    return userManagerService.getUserById(userId, tenantId);
  }

  async getUserByEmail(email: string, tenantId: string) {
    return userManagerService.getUserByEmail(email, tenantId);
  }

  async updateUser(
    userId: number,
    tenantId: string,
    data: Partial<Omit<RegisterUserData, "tenantId" | "password">>,
  ) {
    return userManagerService.updateUser(userId, tenantId, data);
  }

  async deleteUser(userId: number, tenantId: string) {
    return userManagerService.deleteUser(userId, tenantId);
  }

  async listUsers(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      statusId?: number;
      actif?: boolean;
    } = {},
  ) {
    return userManagerService.listUsers(tenantId, options);
  }

  async create(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth: Date;
    genderId?: number;
    tenantId: string;
    actif?: boolean;
  }) {
    return userManagerService.create(userData);
  }

  // Password reset methods (TODO: move to dedicated password-reset service)
  async requestPasswordReset(email: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    console.log("TODO: Implement requestPasswordReset for", email, tenantId);
    return { success: true, message: "Password reset requested" };
  }

  async resetPassword(token: string, newPassword: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    console.log("TODO: Implement resetPassword for token", token, tenantId);
    return { success: true, message: "Password reset successful" };
  }
}

export const userService = new UserService();