/**
 * Validators Index
 * Exports centralisés de tous les validators Zod
 */

// Common validators
export * from "./common/common.validators.js";

// User validators
export * from "./users/user.validators.js";

// Auth validators
export * from "./users/auth.validators.js";

/**
 * Re-export des types inférés les plus utilisés
 */
export type {
  PaginationParams,
  PaginationQueryParams,
  SearchQuery,
  SortOrder,
} from "./common/common.validators.js";

export type {
  CreateUserInput,
  UpdateUserInput,
  SoftDeleteUserInput,
  RestoreUserInput,
  UpdatePasswordInput,
  UpdateEmailInput,
  UpdateProfileInput,
  AnonymizeUserInput,
} from "./users/user.validators.js";

export type {
  LoginInput,
  LoginByUserIdInput,
  RegisterInput,
  RegisterWithConfirmInput,
  ValidateEmailTokenInput,
  PasswordResetRequestInput,
  PasswordResetInput,
  PasswordResetWithConfirmInput,
  ChangePasswordInput,
  SearchUserByEmailInput,
  VerifyUserExistsInput,
  RefreshTokenInput,
  VerifyJwtInput,
  LogoutInput,
  ResendEmailValidationInput,
} from "./users/auth.validators.js";
