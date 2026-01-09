/**
 * Service principal Auth - Composition des services spécialisés
 * Responsabilité : Orchestration et délégation aux services spécialisés
 */

import { ConfirmationResult } from "@clubmanager/types";
import { AccountService } from "./auth/accountService.js";
import { PasswordRecoveryService } from "./auth/passwordRecoveryService.js";
import { SecurityService } from "./auth/securityService.js";
import type {
  ResultatAuthentification,
  CreerCompteParams,
} from "../db/clients/auth/types.js";

/**
 * Service Auth principal - Point d'entrée unifié
 * Compose les services spécialisés pour une meilleure organisation
 */
export class AuthService {
  private accountService: AccountService;
  private passwordRecoveryService: PasswordRecoveryService;
  private securityService: SecurityService;

  constructor() {
    this.accountService = new AccountService();
    this.passwordRecoveryService = new PasswordRecoveryService();
    this.securityService = new SecurityService();
  }

  // ==================== Authentification (SecurityService) ====================

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
    return this.securityService.authentifierUtilisateur(email, password);
  }

  /**
   * Enregistre une tentative de récupération de mot de passe
   * @param email - Email de l'utilisateur
   * @param success - Succès ou échec de la tentative
   */
  async enregistrerTentativeRecuperation(
    email: string,
    success: boolean,
  ): Promise<void> {
    return this.securityService.enregistrerTentativeRecuperation(
      email,
      success,
    );
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
    return this.securityService.enregistrerTentativeConnexion(email, success);
  }

  /**
   * Vérifie si un email a trop de tentatives récentes
   * @param email - Email à vérifier
   * @param type - Type de tentative ('login' ou 'recovery')
   * @param minutes - Fenêtre de temps en minutes
   * @param maxAttempts - Nombre maximum de tentatives
   * @returns true si bloqué
   */
  async verifierBlocage(
    email: string,
    type: "login" | "recovery",
    minutes: number = 15,
    maxAttempts: number = 5,
  ): Promise<boolean> {
    return this.securityService.verifierBlocage(
      email,
      type,
      minutes,
      maxAttempts,
    );
  }

  /**
   * Obtient le nombre de tentatives récentes
   * @param email - Email de l'utilisateur
   * @param type - Type de tentative
   * @param minutes - Fenêtre de temps en minutes
   * @returns Nombre de tentatives
   */
  async obtenirNombreTentatives(
    email: string,
    type: "login" | "recovery",
    minutes: number = 15,
  ): Promise<number> {
    return this.securityService.obtenirNombreTentatives(email, type, minutes);
  }

  // ==================== Gestion des comptes (AccountService) ====================

  /**
   * Crée un nouveau compte utilisateur
   * @param userData - Données de l'utilisateur (first_name, last_name, email, password_hash)
   * @returns Confirmation de la création
   */
  async creerCompteUtilisateur(
    userData: CreerCompteParams,
  ): Promise<ConfirmationResult> {
    return this.accountService.creerCompteUtilisateur(userData);
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
    return this.accountService.modifierMotDePasse(userId, newPasswordHash);
  }

  /**
   * Valide un mot de passe et le hash si valide
   * @param password - Mot de passe en clair
   * @returns Hash du mot de passe ou null si invalide
   */
  async validerEtHasherMotDePasse(
    password: string,
  ): Promise<{ success: boolean; hash?: string; errors?: string[] }> {
    return this.accountService.validerEtHasherMotDePasse(password);
  }

  // ==================== Récupération de mot de passe (PasswordRecoveryService) ====================

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
    return this.passwordRecoveryService.creerTokenRecuperation(
      userId,
      token,
      expiresAt,
    );
  }

  /**
   * Marque un token comme utilisé (le supprime)
   * @param token - Token à marquer comme utilisé
   * @returns Confirmation
   */
  async marquerTokenUtilise(token: string): Promise<ConfirmationResult> {
    return this.passwordRecoveryService.marquerTokenUtilise(token);
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
    return this.passwordRecoveryService.reinitialiserMotDePasseAvecToken(
      token,
      newPasswordHash,
    );
  }

  /**
   * Nettoie les tokens expirés
   * @returns Confirmation avec nombre de tokens supprimés
   */
  async nettoyerTokensExpires(): Promise<ConfirmationResult> {
    return this.passwordRecoveryService.nettoyerTokensExpires();
  }

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
    return this.passwordRecoveryService.creerDemandeRecuperationManuelle(
      userId,
      raison,
      informationsVerification,
    );
  }

  // ==================== Méthodes de nettoyage (Maintenance) ====================

  /**
   * Nettoie les anciennes tentatives (audit cleanup)
   * @param days - Nombre de jours à conserver
   * @returns Confirmation
   */
  async nettoyerAnciennesTentatives(
    days: number = 30,
  ): Promise<ConfirmationResult> {
    return this.securityService.nettoyerAnciennesTentatives(days);
  }

  /**
   * Effectue un nettoyage complet (tokens + tentatives)
   * @param days - Nombre de jours à conserver pour les tentatives
   * @returns Résumé du nettoyage
   */
  async nettoyageComplet(
    days: number = 30,
  ): Promise<{ tokens: ConfirmationResult; tentatives: ConfirmationResult }> {
    const [tokens, tentatives] = await Promise.all([
      this.nettoyerTokensExpires(),
      this.nettoyerAnciennesTentatives(days),
    ]);

    return { tokens, tentatives };
  }
}
