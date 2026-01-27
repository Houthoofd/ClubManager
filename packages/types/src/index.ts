// Export sélectif pour éviter les conflits avec utilisateurs-service
export type {
  UserDataSession,
  Professeur,
  UserDataLogin,
  Abonnement,
  Grade,
  Genres,
  Status,
  UserDataInscription,
  UserDataAjout,
  UtilisateurInscriptionPayload,
  UserData,
} from "./utilisateurs.js";

export {
  abonnementSchema,
  gradeSchema,
  genresSchema,
  userDataLoginSchema,
  userInscriptionSchema,
} from "./utilisateurs.js";
export * from "./query.js";
export * from "./cours.js";
// Export ancien fichier statistiques (types de base seulement)
export type { StatistiquesFrequentation } from "./statistiques.js";
export {
  frequentationParCoursSchema,
  frequentationParMoisSchema,
  statistiquesFrequentationSchema,
  progressionParCoursSchema,
  statistiquesProgressionUtilisateurSchema,
} from "./statistiques.js";
// Export nouveau fichier statistiques-service (types complets)
export * from "./statistiques-service.js";
export * from "./email.js";
export * from "./s3.js";
export * from "./alertes.js";
export * from "./auth.js";
export * from "./commandes-service.js";
export * from "./compte-service.js";
export * from "./cours-service.js";
export * from "./informations-service.js";
export * from "./inscriptions-service.js";
export * from "./messagerie.js";
export * from "./paiements.js";
export * from "./stock.js";

// Export sélectif pour professeurs pour éviter conflit avec Professeur de utilisateurs
export type {
  ProfesseurAvecDetails,
  PlanningCoursProf,
  AjouterProfesseurInput,
  ModifierStatutProfesseurInput,
  StatistiquesProfesseurs,
  StatistiquesProfesseur,
  ProfesseursResponse,
  ProfesseursFiltres,
  TraitementProfesseurResult,
  ProfesseursPaginatedResponse,
  PlanningProfesseurResponse,
  RetirerPromotionInput,
  AjouterProfesseurResult,
} from "./professeurs.js";

export {
  StatutProfesseur,
  ProfesseurSchema,
  PlanningCoursProfSchema,
  AjouterProfesseurInputSchema,
  ModifierStatutProfesseurInputSchema,
  ProfesseursError,
} from "./professeurs.js";

// Export des types du service utilisateurs
export type {
  Utilisateur,
  UtilisateurAvecDetails,
  UtilisateurRecherche,
  CreerUtilisateurInput,
  ModifierUtilisateurInput,
  InscrireUtilisateurInput,
  ConnexionInput,
  ConnexionParUserIdInput,
  ConnexionResult,
  StatistiquesUtilisateurs,
  StatistiquesUtilisateur,
  UtilisateursFiltres,
  UtilisateursPaginatedResponse,
  DesactiverUtilisateurInput,
  ReactiverUtilisateurInput,
  VerificationEmailResult,
  VerificationUtilisateurResult,
  UtilisateursResponse,
  CreerUtilisateurResult,
  ModifierUtilisateurResult,
  ActivationResult,
  UtilisateursTriOptions,
  UtilisateurInformationsCompletes,
  RechercherParEmailInput,
  GenererUserIdResult,
} from "./utilisateurs-service.js";

export {
  StatutUtilisateur,
  UtilisateurSchema,
  CreerUtilisateurInputSchema,
  ModifierUtilisateurInputSchema,
  InscrireUtilisateurInputSchema,
  ConnexionInputSchema,
  ConnexionParUserIdInputSchema,
  DesactiverUtilisateurInputSchema,
  ReactiverUtilisateurInputSchema,
  RechercherParEmailInputSchema,
  UtilisateursError,
  UtilisateursErrorCode,
} from "./utilisateurs-service.js";

// Export du magasin avec renommage pour éviter les conflits
export type {
  Article,
  ArticleCreationData,
  ArticleCommande,
  ArticlesParCategorie,
  Commande as MagasinCommande,
  CommandeDetails,
  NouvelleCommande,
  Categorie as MagasinCategorie,
  Stock,
  FiltresArticles,
  OptionsPagination,
  OptionsTri,
  ConfirmationResult,
  MagasinConfirmationResult,
  MagasinResponse,
  ArticlesResponse,
  CommandeResponse,
  CommandesResponse,
  CategoriesResponse,
  IdMagasin,
  IdArticle,
  IdCommande,
  IdCategorie,
  IdUtilisateur,
  MappingTaille,
} from "./magasin.js";

// Export des valeurs nécessaires (classes, enums, constantes)
export {
  StatutCommande,
  MagasinError,
  TAILLES_MAPPING,
  TAILLES_REVERSE_MAPPING,
} from "./magasin.js";

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
