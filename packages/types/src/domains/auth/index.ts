/**
 * Auth Domain
 */

// Base types (skip ResetPasswordInput as it's in validators)
export type {
  AuthResult,
  CreateUserInput,
  ChangePasswordInput,
  PasswordResetToken,
  EmailCheckResult,
} from "./types.js";

// Validators (has ResetPasswordInput and others)
export * from "./validators.js";

// GraphQL typedefs only
export { authTypeDefs } from "./graphql.typedefs.js";
