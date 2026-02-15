/**
 * Types GraphQL pour Utilisateurs (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL
 */

/**
 * Utilisateur complet (GraphQL)
 */
export interface Utilisateur {
  id: number;
  prenom: string;
  nom: string;
  nomUtilisateur?: string;
  email: string;
  dateNaissance: string;
  dateInscription: string;
  genreId: number;
  gradeId?: number | null;
  abonnementId: number;
  statusId: number;
  genre?: string;
  grade?: string;
  abonnement?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Statistiques des utilisateurs (GraphQL)
 */
export interface UtilisateurStats {
  totalUtilisateurs: number;
  utilisateursActifs: number;
  utilisateursInactifs: number;
}

/**
 * Résultat de vérification d'existence (GraphQL)
 */
export interface VerifierExistenceResult {
  message: string;
  type: string;
  userExists: boolean;
  canRegister?: boolean;
  userData?: UtilisateurExistant;
}

/**
 * Utilisateur existant (GraphQL)
 */
export interface UtilisateurExistant {
  id: number;
  prenom: string;
  nom: string;
  email?: string;
  dateNaissance: string;
  status?: string;
}

/**
 * Résultat d'inscription (GraphQL)
 */
export interface InscriptionResult {
  message: string;
  generatedUserId: number;
  inscriptionDetails: InscriptionDetails;
  emailStatus: EmailStatus;
  warning?: string;
}

/**
 * Détails d'inscription (GraphQL)
 */
export interface InscriptionDetails {
  userId: number;
  prenom: string;
  nom: string;
  email: string;
  nomUtilisateur: string;
}

/**
 * Statut d'email (GraphQL)
 */
export interface EmailStatus {
  sent: boolean;
  message?: string;
  details?: Record<string, any>;
  emailDestination?: string;
  isTestMode?: boolean;
  error?: string;
  reason?: string;
}

/**
 * Résultat de connexion (GraphQL)
 */
export interface ConnexionResult {
  success: boolean;
  message: string;
  data?: ConnexionData;
}

/**
 * Données de connexion (GraphQL)
 */
export interface ConnexionData {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  token?: string;
}

/**
 * Résultat de mise à jour (GraphQL)
 */
export interface UpdateUtilisateurResult {
  message: string;
  data: Utilisateur;
}

/**
 * Résultat de suppression (GraphQL)
 */
export interface DeleteUtilisateurResult {
  isConfirm: boolean;
  message: string;
  action: string;
}

/**
 * Résultat de vérification de token email (GraphQL)
 */
export interface VerifyEmailTokenResult {
  success: boolean;
  message?: string;
  data?: Record<string, any>;
  error?: string;
  redirectTo: string;
}

/**
 * Résultat de test email (GraphQL)
 */
export interface EmailTestResult {
  success: boolean;
  message: string;
  messageId?: string;
  details?: Record<string, any>;
  error?: string;
}

/**
 * Résultat de test de configuration email (GraphQL)
 */
export interface EmailConfigTestResult {
  success: boolean;
  message: string;
  details: Record<string, any>;
}

/**
 * Résultat de health check (GraphQL)
 */
export interface HealthCheckResult {
  status: string;
  module: string;
  timestamp: string;
}

/**
 * Input pour vérification d'existence (GraphQL)
 */
export interface VerifierExistenceInput {
  nom: string;
  prenom: string;
  dateNaissance: string;
}

/**
 * Input pour inscription (GraphQL)
 */
export interface InscriptionInput {
  prenom: string;
  nom: string;
  nomUtilisateur?: string;
  email: string;
  password: string;
  genreId: number;
  abonnementId: number;
  dateNaissance: string;
  dateInscription?: string;
  statusId?: number;
  gradeId?: number;
}

/**
 * Input pour connexion par userId (GraphQL)
 */
export interface ConnexionUserIdInput {
  userId: string;
  password: string;
}

/**
 * Input pour connexion par email (GraphQL)
 */
export interface ConnexionEmailInput {
  email: string;
  password: string;
}

/**
 * Input pour mise à jour utilisateur (GraphQL)
 */
export interface UpdateUtilisateurInput {
  email?: string;
  dateNaissance?: string;
  genres?: number;
  grades?: number;
  abonnement?: number;
  status?: number;
  password?: string;
}

/**
 * Input pour suppression utilisateur (GraphQL)
 */
export interface DeleteUtilisateurInput {
  isConfirm: boolean;
}

/**
 * Input pour suppression soft (GraphQL)
 */
export interface SoftDeleteUtilisateurInput {
  isConfirm: boolean;
}

/**
 * Genre (GraphQL)
 */
export interface Genre {
  id: number;
  genreName: string;
}

/**
 * Grade (GraphQL)
 */
export interface Grade {
  id: number;
  gradeId: string;
  gradeName: string;
  ordre?: number;
}

/**
 * Abonnement (GraphQL)
 */
export interface Abonnement {
  id: number;
  nomPlan: string;
  description?: string;
  prix?: number;
  dureeMois?: number;
  actif: boolean;
}

/**
 * Status (GraphQL)
 */
export interface Status {
  id: number;
  statusName: string;
  description?: string;
}

/**
 * Professeur (GraphQL)
 */
export interface Professeur {
  id: number;
  utilisateurId: number;
  specialites?: string[];
  bio?: string;
  actif: boolean;
}

/**
 * Utilisateur disponible pour login (GraphQL)
 */
export interface AvailableUserForLogin {
  userId: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  nomUtilisateur: string;
  age: number;
  initiales: string;
  relationFamiliale?: string;
  estResponsable?: boolean;
}

/**
 * Contexte GraphQL pour Utilisateurs
 */
export interface UtilisateursContext {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    statusId: number;
    role: string;
    status: string;
  };
  req?: any;
  res?: any;
}
