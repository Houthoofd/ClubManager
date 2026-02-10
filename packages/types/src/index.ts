// Pour compatibilité ESM : utilisez import au lieu de require

// Export des TypeDefs GraphQL
export { authTypeDefs } from "./graphql/auth.typedefs.js";
export { messagesTypeDefs } from "./graphql/messages.graphql.types.js";
export { alertesTypeDefs } from "./graphql/alertes.graphql.types.js";
export { commandesTypeDefs } from "./graphql/commandes.graphql.types.js";
export { compteTypeDefs } from "./graphql/compte.graphql.types.js";
export { confirmationTypeDefs } from "./graphql/confirmation.graphql.types.js";
export { coursTypeDefs } from "./graphql/cours.graphql.types.js";
export { echeancesTypeDefs } from "./graphql/echeances.graphql.types.js";
export { informationsTypeDefs } from "./graphql/informations.graphql.types.js";
export { inscriptionTypeDefs } from "./graphql/inscription.graphql.types.js";
export { magasinTypeDefs } from "./graphql/magasin.graphql.types.js";
export { paiementsTypeDefs } from "./graphql/paiements.graphql.types.js";
export { professeursTypeDefs } from "./graphql/professeurs.graphql.types.js";
export { statistiquesTypeDefs } from "./graphql/statistiques.graphql.types.js";
export { stocksTypeDefs } from "./graphql/stocks.graphql.types.js";
export { utilisateursTypeDefs } from "./graphql/utilisateurs.typedefs.js";
export { verificationTypeDefs } from "./graphql/verification.typedefs.js";
export { uploadTypeDefs } from "./graphql/upload.typedefs.js";

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
  UserDataLoginByUserId,
  UserSearchByEmail,
  AvailableUserForLogin,
} from "./utilisateurs.js";

export {
  abonnementSchema,
  gradeSchema,
  genresSchema,
  userDataLoginSchema,
  userInscriptionSchema,
  userDataLoginByUserIdSchema,
  userSearchByEmailSchema,
  utilisateurInscriptionSchema,
  userDataAjoutSchema,
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
export * from "./inscription-utilisateur.js";
export * from "./inscriptions-service.js";
export * from "./messagerie.js";

// Export sélectif pour messages pour éviter conflit avec messagerie
export type {
  Message as MessagePersonnalise,
  TypeMessage,
  EmailDetail,
  EnvoiMessageDetails,
  EnvoiMessageData,
  EnvoiMessageResult as EnvoiMessagePersonnaliseResult,
  MessageStatistiques,
  MessageNonLusCount,
  MessageOperationResult,
  RappelPaiementData,
  RappelPaiementResult,
  SendCustomEmailOptions,
  SendTemplateEmailOptions,
  SendWelcomeEmailOptions,
  SendValidationEmailOptions,
  MessageHistory,
  EmailStatistics,
  MessagesResponse,
  TypesMessagesResponse as TypesMessagesPersonnalisesResponse,
  TypeMessageResponse,
  EmailOperationResult,
} from "./messages.js";

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

// Export des validators pour les commandes
export {
  commandesValidators,
  StatutCommandeEnum,
  CommandeArticleSchema,
  CreateCommandeSchema,
  UpdateCommandeSchema,
  UpdateStatutCommandeSchema,
  GetCommandeByIdSchema,
  GetCommandesUtilisateurSchema,
  GetCommandesParStatutSchema,
  SearchCommandesSchema,
  BatchUpdateCommandesSchema,
} from "./validators/commandes.validators.js";

export type {
  StatutCommande as StatutCommandeValidator,
  CommandeArticleInput,
  CreateCommandeInput,
  UpdateCommandeInput,
  UpdateStatutCommandeInput,
  SearchCommandesInput,
  PaginationInput,
  BatchUpdateCommandesInput,
} from "./validators/commandes.validators.js";

// Export des validators pour les comptes
export {
  compteValidators,
  EmailSchema,
  PhoneSchema,
  NameSchema,
  PasswordSchema,
  DateOfBirthSchema,
  GetCompteByIdSchema,
  GetCompteByNomPrenomSchema,
  GetInformationsCompteSchema,
  UpdateCompteSchema,
  ChangePasswordSchema,
  CreatePasswordSchema,
  UpdatePasswordSchema,
  DeleteCompteSchema,
  ConversionInputSchema,
  GetGenreIdSchema,
  GetGradeIdSchema,
  GetStatusIdSchema,
  GetAbonnementIdSchema,
  CompteUtilisateurIdParamSchema,
} from "./validators/compte.validators.js";

export type {
  GetCompteByIdInput,
  GetCompteByNomPrenomInput,
  GetInformationsCompteInput,
  UpdateCompteInput,
  ChangePasswordInput,
  CreatePasswordInput,
  UpdatePasswordInput,
  DeleteCompteInput,
  ConversionInputType,
  GetGenreIdInput,
  GetGradeIdInput,
  GetStatusIdInput,
  GetAbonnementIdInput,
} from "./validators/compte.validators.js";

// Export des validators pour la confirmation
export {
  confirmationValidators,
  confirmationPaymentInputSchema,
  confirmationPaymentCommandeInputSchema,
} from "./validators/confirmation.validators.js";

export type {
  ConfirmationPaymentInput,
  ConfirmationPaymentCommandeInput,
} from "./validators/confirmation.validators.js";

// Export des validators pour les cours
export {
  coursValidators,
  ajouterCoursInputSchema,
  modifierCoursInputSchema,
  inscrireUtilisateurInputSchema as coursInscrireUtilisateurInputSchema,
  desinscrireUtilisateurInputSchema,
  presenceInputSchema,
  retirerProfesseurInputSchema,
  coursIdSchema,
  utilisateurIdSchema as coursUtilisateurIdSchema,
  JourSemaineEnum,
  HeureSchema,
  DateCoursSchema,
} from "./validators/cours.validators.js";

export type {
  JourSemaine,
  AjouterCoursInput,
  ModifierCoursInput,
  InscrireUtilisateurInput as CoursInscrireUtilisateurInput,
  DesinscrireUtilisateurInput,
  PresenceInput,
  RetirerProfesseurInput,
} from "./validators/cours.validators.js";

// Export des validators pour les écheances
export {
  echeancesValidators,
  getEcheancesUtilisateurSchema,
  getEcheanceDetailSchema,
  createEcheanceSchema,
  updateEcheanceSchema,
  deleteEcheanceSchema,
  getStatistiquesSchema,
  diagnosticEcheanceSchema,
  echeancesFiltersInputSchema,
  echeancesUtilisateurIdSchema,
  echeanceIdSchema,
  marquerEcheancePayeeSchema,
} from "./validators/echeances.validators.js";

export type {
  GetEcheancesUtilisateurData,
  GetEcheanceDetailData,
  CreateEcheanceData,
  UpdateEcheanceData,
  DeleteEcheanceData,
  GetStatistiquesData,
  DiagnosticEcheanceData,
  EcheancesFiltersInput,
  EcheancesUtilisateurIdInput,
  EcheanceIdInput,
  MarquerEcheancePayeeInput,
} from "./validators/echeances.validators.js";

// Export des validators pour les professeurs
export {
  getProfesseursSchema,
  getProfesseurByIdSchema,
  getProfesseurByIdGraphQLSchema,
  ajouterProfesseurSchema,
  modifierStatutProfesseurSchema,
  getPlanningProfesseurSchema,
  getPlanningProfesseurGraphQLSchema,
  professeursUtilisateurSchema,
  coursSchema,
} from "./validators/professeurs.validators.js";

export type {
  GetProfesseursData,
  GetProfesseurByIdData,
  GetProfesseurByIdGraphQLData,
  AjouterProfesseurData,
  ModifierStatutProfesseurData,
  GetPlanningProfesseurData,
  GetPlanningProfesseurGraphQLData,
  UtilisateurData,
  CoursData,
} from "./validators/professeurs.validators.js";

// Export des validators pour les statistiques
export {
  utilisateurIdSchema,
  userIdSchema,
  utilisateurIdGraphQLSchema,
  userIdGraphQLSchema,
  getFrequentationSchema,
  getProgressionSchema,
  getPresenceSchema,
  getPresenceRawSchema,
  emptyParamsSchema,
  paginationSchema,
  dateRangeSchema,
  simpleUtilisateurIdSchema,
  joursHistoriqueSchema,
  moisHistoriqueSchema,
  periodeSchema,
} from "./validators/statistiques.validators.js";

export type {
  UtilisateurIdData,
  UserIdData,
  UtilisateurIdGraphQLData,
  UserIdGraphQLData,
  GetFrequentationData,
  GetProgressionData,
  GetPresenceData,
  GetPresenceRawData,
  EmptyParamsData,
  PaginationData,
  DateRangeData,
  JoursHistoriqueData,
  MoisHistoriqueData,
  PeriodeData,
} from "./validators/statistiques.validators.js";

// Export des validators pour les stocks
export {
  stockSchema,
  stockUpdateSchema,
  alerteParamsSchema,
  alerteParamsGraphQLSchema,
  articleIdParamSchema,
  articleIdGraphQLSchema,
  stocksHealthCheckSchema,
  stocksArraySchema,
} from "./validators/stocks.validators.js";

export type {
  Stock as StockValidator,
  StockUpdate,
  AlerteParams,
  AlerteParamsGraphQL,
  ArticleIdParam,
  ArticleIdGraphQL,
  HealthCheck as StocksHealthCheck,
} from "./validators/stocks.validators.js";
