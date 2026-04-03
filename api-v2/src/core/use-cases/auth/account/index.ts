/**
 * Exports des use cases du groupe Account (gestion de compte)
 *
 * Ce fichier centralise les exports de tous les use cases liés à la gestion
 * des comptes utilisateurs : inscription, changement de mot de passe, réinitialisation, etc.
 */

// Register Use Case
export { RegisterUseCase } from "./RegisterUseCase.js";
export type { RegisterDTO, RegisterResult } from "./RegisterUseCase.js";

// Change Password Use Case
export { ChangePasswordUseCase } from "./ChangePasswordUseCase.js";
export type {
  ChangePasswordDTO,
  ChangePasswordResult,
} from "./ChangePasswordUseCase.js";

// Request Password Reset Use Case
export { RequestPasswordResetUseCase } from "./RequestPasswordResetUseCase.js";
export type {
  RequestPasswordResetDTO,
  RequestPasswordResetResult,
} from "./RequestPasswordResetUseCase.js";

// Reset Password Use Case
export { ResetPasswordUseCase } from "./ResetPasswordUseCase.js";
export type {
  ResetPasswordDTO,
  ResetPasswordResult,
} from "./ResetPasswordUseCase.js";
