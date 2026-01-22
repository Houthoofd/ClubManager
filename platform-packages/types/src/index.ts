// Export des types existants
export * from "./utilisateurs.js";
export * from "./query.js";
export * from "./cours.js";
export * from "./statistiques.js";
export * from "./magasin.js";

// Export des commandes avec renommage pour éviter les conflits
export type {
  Commande as CommandeStore,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeComplete,
} from "./commandes.js";

// Export des schemas utilisateurs
export type {
  UserDataLoginByUserId,
  UserSearchByEmail,
} from "./utilisateurs.js";
export {
  userDataLoginByUserIdSchema,
  userSearchByEmailSchema,
} from "./utilisateurs.js";

// Export des types migrés depuis platform-api
export * from "./auth.js";
export * from "./tenant.js";
export * from "./user.js";
export * from "./multi-tenant.js";
export * from "./email.types.js";
export * from "./shop.types.js";
export * from "./message.types.js";

// Note: express.d.ts is a declaration file and will be picked up automatically by TypeScript
