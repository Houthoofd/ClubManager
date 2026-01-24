export * from './utilisateurs.js';
export * from './query.js';
export * from './cours.js';
export * from './statistiques.js';
export * from './email.js';
export * from './s3.js';
export * from './alertes.js';
export * from './auth.js';
export * from './commandes-service.js';
export * from './compte-service.js';
export * from './cours-service.js';
export * from './informations-service.js';
export * from './inscriptions-service.js';

// Export du magasin
export * from './magasin.js';

// Export des commandes avec renommage pour éviter les conflits
export type { 
  Commande as CommandeStore,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeComplete 
} from './commandes.js';

// Export des nouveaux types et schémas pour la connexion multi-utilisateurs
export type { UserDataLoginByUserId, UserSearchByEmail } from './utilisateurs.js';
export { userDataLoginByUserIdSchema, userSearchByEmailSchema } from './utilisateurs.js';