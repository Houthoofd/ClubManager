/**
 * Classe principale Auth - Point d'entrée unifié pour les opérations d'authentification
 * Composition du repository (lecture) et du service (écriture/actions)
 */

import { ConfirmationResult } from "@clubmanager/types";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "../../../services/authService.js";
import { AuthUtils } from "./utils.js";
import type {
  ResultatAuthentification,
  CreerCompteParams,
  InformationsSecurite,
  ResultatValidationMotDePasse,
} from "./types.js";

export class Auth {
  private repository: AuthRepository;
  private service: AuthService;

  constructor() {
    this.repository = new AuthRepository();
    this.service = new AuthService();
  }

  // ==================== Méthodes d'authentification ====================

  /**
   * Authentifie un utilisateur avec email et mot de passe
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe en clair
   * @returns Résultat de l'authentification avec données utilisateur si succès
   */
  async authentifierUtilisateur(
    email: string,
    password: string,
  ): Promise<ResultatAuthentification> {
    return this.service.authentifierUtilisateur(email, password);
  }

  /**
   * Crée un nouveau compte utilisateur
   * @param userData - Données de l'utilisateur
   * @returns Confirmation de la création
   */
  async creerCompteUtilisateur(
    userData: CreerCompteParams,
  ): Promise<ConfirmationResult> {
    return this.service.creerCompteUtilisateur(userData);
  }

  /**
   * Modifie le mot de passe d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param newPasswordHash - Nouveau hash du mot de passe
   * @returns Confirmation de la modification
   */
  async modifierMotDePasse(
    userId: number,
    newPasswordHash: string,
  ): Promise<ConfirmationResult> {
    return this.service.modifierMotDePasse(userId, newPasswordHash);
  }

  // ==================== Méthodes de récupération de données ====================

  /**
   * Recherche un utilisateur par email
   * @param email - Email de l'utilisateur
   * @returns Utilisateur trouvé ou null
   */
  async rechercherUtilisateurParEmail(email: string): Promise<any> {
    return this.repository.rechercherUtilisateurParEmail(email);
  }

  /**
   * Vérifie si un email existe déjà en base
   * @param email - Email à vérifier
   * @returns true si l'email existe
   */
  async emailExiste(email: string): Promise<boolean> {
    return this.repository.emailExiste(email);
  }

  /**
   * Récupère les informations de sécurité d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Informations de sécurité ou null
   */
  async obtenirInformationsSecurite(
    userId: number,
  ): Promise<InformationsSecurite | null> {
    return this.repository.obtenirInformationsSecurite(userId);
  }

  // ==================== Gestion des tokens de récupération ====================

  /**
   * Crée un token de récupération de mot de passe
   * @param userId - ID de l'utilisateur
   * @param token - Token de récupération
   * @param expiresAt - Date d'expiration
   * @returns Confirmation de la création
   */
  async creerTokenRecuperation(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<ConfirmationResult> {
    return this.service.creerTokenRecuperation(userId, token, expiresAt);
  }

  /**
   * Vérifie un token de récupération
   * @param token - Token à vérifier
   * @returns Données du token ou null si invalide/expiré
   */
  async verifierTokenRecuperation(token: string): Promise<any> {
    return this.repository.verifierTokenRecuperation(token);
  }

  /**
   * Marque un token comme utilisé (le supprime)
   * @param token - Token à marquer comme utilisé
   * @returns Confirmation
   */
  async marquerTokenUtilise(token: string): Promise<ConfirmationResult> {
    return this.service.marquerTokenUtilise(token);
  }

  /**
   * Réinitialise le mot de passe avec un token de récupération
   * @param token - Token de récupération
   * @param newPasswordHash - Nouveau hash du mot de passe
   * @returns Confirmation de la réinitialisation
   */
  async reinitialiserMotDePasseAvecToken(
    token: string,
    newPasswordHash: string,
  ): Promise<ConfirmationResult> {
    return this.service.reinitialiserMotDePasseAvecToken(
      token,
      newPasswordHash,
    );
  }

  /**
   * Nettoie les tokens expirés
   * @returns Confirmation avec nombre de tokens supprimés
   */
  async nettoyerTokensExpires(): Promise<ConfirmationResult> {
    return this.service.nettoyerTokensExpires();
  }

  // ==================== Sécurité et tentatives ====================

  /**
   * Vérifie les tentatives de récupération récentes (protection anti-spam)
   * @param email - Email de l'utilisateur
   * @param minutes - Fenêtre de temps en minutes (défaut: 15)
   * @returns Nombre de tentatives
   */
  async verifierTentativesRecuperationRecentes(
    email: string,
    minutes: number = 15,
  ): Promise<number> {
    return this.repository.verifierTentativesRecuperationRecentes(
      email,
      minutes,
    );
  }

  /**
   * Obtient le nombre de tentatives de connexion récentes
   * @param email - Email de l'utilisateur
   * @param minutes - Fenêtre de temps en minutes (défaut: 15)
   * @returns Nombre de tentatives
   */
  async obtenirTentativesConnexionRecentes(
    email: string,
    minutes: number = 15,
  ): Promise<number> {
    return this.repository.obtenirTentativesConnexionRecentes(email, minutes);
  }

  /**
   * Enregistre une tentative de récupération
   * @param email - Email de l'utilisateur
   * @param success - Succès ou échec de la tentative
   */
  async enregistrerTentativeRecuperation(
    email: string,
    success: boolean,
  ): Promise<void> {
    return this.service.enregistrerTentativeRecuperation(email, success);
  }

  /**
   * Enregistre une tentative de connexion
   * @param email - Email de l'utilisateur
   * @param success - Succès ou échec de la tentative
   */
  async enregistrerTentativeConnexion(
    email: string,
    success: boolean,
  ): Promise<void> {
    return this.service.enregistrerTentativeConnexion(email, success);
  }

  // ==================== Récupération manuelle ====================

  /**
   * Crée une demande de récupération manuelle
   * @param userId - ID de l'utilisateur
   * @param raison - Raison de la demande
   * @param informationsVerification - Informations de vérification
   * @returns Confirmation de la création
   */
  async creerDemandeRecuperationManuelle(
    userId: number,
    raison: string,
    informationsVerification: any,
  ): Promise<ConfirmationResult> {
    return this.service.creerDemandeRecuperationManuelle(
      userId,
      raison,
      informationsVerification,
    );
  }

  // ==================== Méthodes utilitaires (helpers) ====================

  /**
   * Méthode helper pour compatibilité avec les routes existantes
   * Permet d'exécuter une requête SQL directement
   * @deprecated Utiliser les méthodes spécifiques du repository/service
   */
  queryAsync(sql: string, params: any[] = []): Promise<any[]> {
    return this.repository.queryAsync(sql, params);
  }

  /**
   * Valide un mot de passe et le hash si valide
   * @param password - Mot de passe en clair
   * @returns Hash du mot de passe ou null si invalide
   */
  async validerEtHasherMotDePasse(
    password: string,
  ): Promise<{ success: boolean; hash?: string; errors?: string[] }> {
    return this.service.validerEtHasherMotDePasse(password);
  }

  // ==================== Méthodes statiques (utilitaires) ====================

  /**
   * Génère un token sécurisé
   * @param length - Longueur du token en bytes (défaut: 32)
   * @returns Token hexadécimal
   */
  static genererTokenSecurise(length: number = 32): string {
    return AuthUtils.genererTokenSecurise(length);
  }

  /**
   * Hash un mot de passe avec bcrypt
   * @param password - Mot de passe en clair
   * @returns Hash du mot de passe
   */
  static async hasherMotDePasse(password: string): Promise<string> {
    return AuthUtils.hasherMotDePasse(password);
  }

  /**
   * Vérifie un mot de passe contre son hash
   * @param password - Mot de passe en clair
   * @param hash - Hash à vérifier
   * @returns true si le mot de passe correspond
   */
  static async verifierMotDePasse(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return AuthUtils.verifierMotDePasse(password, hash);
  }

  /**
   * Valide le format d'un email
   * @param email - Email à valider
   * @returns true si l'email est valide
   */
  static validerEmail(email: string): boolean {
    return AuthUtils.validerEmail(email);
  }

  /**
   * Valide la force d'un mot de passe
   * @param password - Mot de passe à valider
   * @returns Objet avec le résultat et les erreurs éventuelles
   */
  static validerMotDePasse(password: string): ResultatValidationMotDePasse {
    return AuthUtils.validerMotDePasseSimple(password);
  }

  /**
   * Normalise un email (trim et lowercase)
   * @param email - Email à normaliser
   * @returns Email normalisé
   */
  static normaliserEmail(email: string): string {
    return AuthUtils.normaliserEmail(email);
  }

  /**
   * Masque un email pour affichage sécurisé
   * @param email - Email à masquer
   * @returns Email masqué (ex: j***@example.com)
   */
  static masquerEmail(email: string): string {
    return AuthUtils.masquerEmail(email);
  }
}
