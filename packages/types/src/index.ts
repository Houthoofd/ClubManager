// ============================================
// LEGACY EXPORTS (à migrer progressivement)
// ============================================
export * from "./utilisateurs.js";
export * from "./query.js";
export * from "./cours.js";
export * from "./statistiques.js";

// Export du magasin
export * from "./magasin.js";

// Export des commandes avec renommage pour éviter les conflits
export type {
  Commande as CommandeStore,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeComplete,
} from "./commandes.js";

// Export des nouveaux types et schémas pour la connexion multi-utilisateurs
export type {
  UserDataLoginByUserId,
  UserSearchByEmail,
} from "./utilisateurs.js";
export {
  userDataLoginByUserIdSchema,
  userSearchByEmailSchema,
} from "./utilisateurs.js";

// ============================================
// NEW ARCHITECTURE EXPORTS
// ============================================

// Constants
export * from "./constants/validation.constants.js";

// Enums
export * from "./enums/UserRole.enum.js";
export * from "./enums/UserStatus.enum.js";

// API Response Types
export * from "./api/responses/ApiResponse.types.js";

// Domain Types
export * from "./domain/user/User.types.js";

// DTOs
export * from "./dtos/users/UserDto.js";
export * from "./dtos/auth/AuthDto.js";

// Validators (Zod schemas)
export * from "./validators/index.js";
