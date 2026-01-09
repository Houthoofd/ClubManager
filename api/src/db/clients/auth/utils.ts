/**
 * Utilitaires pour le module Auth - Façade principale
 * Délègue aux utilitaires spécialisés pour une meilleure organisation
 */

import { ValidationUtils } from "./utils/validation.utils.js";
import { CryptoUtils } from "./utils/crypto.utils.js";
import { StringUtils } from "./utils/string.utils.js";
import { DateUtils } from "./utils/date.utils.js";
import type { ResultatValidationMotDePasse } from "./types.js";

/**
 * Classe principale AuthUtils - Point d'entrée unifié pour tous les utilitaires
 * Délègue aux classes spécialisées pour maintenir une API simple
 */
export class AuthUtils {
  // ==================== Validation ====================

  /**
   * Valide le format d'un email
   * @param email - Email à valider
   * @returns true si l'email est valide
   */
  static validerEmail(email: string): boolean {
    return ValidationUtils.validerEmail(email);
  }

  /**
   * Valide la force d'un mot de passe (version complète)
   * @param password - Mot de passe à valider
   * @returns Objet avec le résultat et les erreurs éventuelles
   */
  static validerMotDePasse(password: string): ResultatValidationMotDePasse {
    return ValidationUtils.validerMotDePasse(password);
  }

  /**
   * Valide la force d'un mot de passe (version simplifiée)
   * @param password - Mot de passe à valider
   * @returns Objet avec le résultat et les erreurs éventuelles
   */
  static validerMotDePasseSimple(
    password: string,
  ): ResultatValidationMotDePasse {
    return ValidationUtils.validerMotDePasseSimple(password);
  }

  /**
   * Valide un code de vérification (6 chiffres)
   * @param code - Code à valider
   * @returns true si le code est valide
   */
  static validerCodeVerification(code: string): boolean {
    return ValidationUtils.validerCodeVerification(code);
  }

  /**
   * Valide un token (format hexadécimal)
   * @param token - Token à valider
   * @param minLength - Longueur minimale (défaut: 32)
   * @returns true si le token est valide
   */
  static validerToken(token: string, minLength: number = 32): boolean {
    return ValidationUtils.validerToken(token, minLength);
  }

  /**
   * Valide un ID utilisateur
   * @param userId - ID à valider
   * @returns true si l'ID est valide
   */
  static validerUserId(userId: any): boolean {
    return ValidationUtils.validerUserId(userId);
  }

  // ==================== Cryptographie ====================

  /**
   * Génère un token sécurisé aléatoire
   * @param length - Longueur du token en bytes (défaut: 32)
   * @returns Token hexadécimal
   */
  static genererTokenSecurise(length: number = 32): string {
    return CryptoUtils.genererTokenSecurise(length);
  }

  /**
   * Hash un mot de passe avec bcrypt
   * @param password - Mot de passe en clair
   * @param saltRounds - Nombre de rounds pour le salt (défaut: 12)
   * @returns Hash du mot de passe
   */
  static async hasherMotDePasse(
    password: string,
    saltRounds: number = 12,
  ): Promise<string> {
    return CryptoUtils.hasherMotDePasse(password, saltRounds);
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
    return CryptoUtils.verifierMotDePasse(password, hash);
  }

  /**
   * Génère un code de vérification numérique (6 chiffres)
   * @returns Code de vérification
   */
  static genererCodeVerification(): string {
    return CryptoUtils.genererCodeVerification();
  }

  /**
   * Génère un hash SHA256 d'une chaîne
   * @param input - Chaîne à hasher
   * @returns Hash SHA256 en hexadécimal
   */
  static hashSHA256(input: string): string {
    return CryptoUtils.hashSHA256(input);
  }

  /**
   * Génère un UUID v4
   * @returns UUID
   */
  static genererUUID(): string {
    return CryptoUtils.genererUUID();
  }

  /**
   * Compare deux chaînes de manière sécurisée (timing attack safe)
   * @param a - Première chaîne
   * @param b - Deuxième chaîne
   * @returns true si les chaînes sont identiques
   */
  static compareSecurise(a: string, b: string): boolean {
    return CryptoUtils.compareSecurise(a, b);
  }

  // ==================== Manipulation de chaînes ====================

  /**
   * Normalise un email (trim et lowercase)
   * @param email - Email à normaliser
   * @returns Email normalisé
   */
  static normaliserEmail(email: string): string {
    return StringUtils.normaliserEmail(email);
  }

  /**
   * Masque un email pour affichage sécurisé
   * @param email - Email à masquer
   * @returns Email masqué (ex: j***@example.com)
   */
  static masquerEmail(email: string): string {
    return StringUtils.masquerEmail(email);
  }

  /**
   * Masque partiellement un nom (prénom ou nom de famille)
   * @param name - Nom à masquer
   * @returns Nom masqué (ex: "Jean" => "J***")
   */
  static masquerNom(name: string): string {
    return StringUtils.masquerNom(name);
  }

  /**
   * Sanitize une chaîne pour éviter les injections
   * @param input - Chaîne à nettoyer
   * @param maxLength - Longueur maximale (défaut: 255)
   * @returns Chaîne nettoyée
   */
  static sanitizeInput(input: string, maxLength: number = 255): string {
    return StringUtils.sanitizeInput(input, maxLength);
  }

  /**
   * Échappe les caractères HTML
   * @param input - Chaîne à échapper
   * @returns Chaîne échappée
   */
  static echapperHTML(input: string): string {
    return StringUtils.echapperHTML(input);
  }

  /**
   * Capitalise la première lettre d'une chaîne
   * @param text - Texte à capitaliser
   * @returns Texte capitalisé
   */
  static capitaliser(text: string): string {
    return StringUtils.capitaliser(text);
  }

  /**
   * Formate un nom complet
   * @param firstName - Prénom
   * @param lastName - Nom de famille
   * @returns Nom formaté
   */
  static formaterNomComplet(firstName: string, lastName: string): string {
    return StringUtils.formaterNomComplet(firstName, lastName);
  }

  // ==================== Manipulation de dates ====================

  /**
   * Génère une date d'expiration pour un token (en heures)
   * @param hours - Nombre d'heures avant expiration (défaut: 1)
   * @returns Date d'expiration
   */
  static genererDateExpiration(hours: number = 1): Date {
    return DateUtils.genererDateExpiration(hours);
  }

  /**
   * Génère une date d'expiration en jours
   * @param days - Nombre de jours avant expiration
   * @returns Date d'expiration
   */
  static genererDateExpirationJours(days: number): Date {
    return DateUtils.genererDateExpirationJours(days);
  }

  /**
   * Génère une date d'expiration en minutes
   * @param minutes - Nombre de minutes avant expiration
   * @returns Date d'expiration
   */
  static genererDateExpirationMinutes(minutes: number): Date {
    return DateUtils.genererDateExpirationMinutes(minutes);
  }

  /**
   * Calcule une date dans le passé (pour vérification de tentatives)
   * @param minutes - Nombre de minutes dans le passé
   * @returns Date dans le passé
   */
  static calculerDatePassee(minutes: number): Date {
    return DateUtils.calculerDatePassee(minutes);
  }

  /**
   * Vérifie si un token est expiré
   * @param expiresAt - Date d'expiration
   * @returns true si le token est expiré
   */
  static estExpire(expiresAt: Date | string): boolean {
    return DateUtils.estExpire(expiresAt);
  }

  /**
   * Vérifie si une date est dans le futur
   * @param date - Date à vérifier
   * @returns true si la date est dans le futur
   */
  static estFutur(date: Date | string): boolean {
    return DateUtils.estFutur(date);
  }

  /**
   * Calcule le nombre de minutes entre deux dates
   * @param date1 - Première date
   * @param date2 - Deuxième date (défaut: maintenant)
   * @returns Nombre de minutes
   */
  static differenceEnMinutes(date1: Date, date2?: Date): number {
    return DateUtils.differenceEnMinutes(date1, date2);
  }

  /**
   * Formate une date en ISO 8601
   * @param date - Date à formater
   * @returns Date en format ISO
   */
  static formaterISO(date?: Date): string {
    return DateUtils.formaterISO(date);
  }

  /**
   * Formate une date au format FR (DD/MM/YYYY)
   * @param date - Date à formater
   * @returns Date formatée
   */
  static formaterDateFR(date: Date): string {
    return DateUtils.formaterDateFR(date);
  }

  /**
   * Vérifie si une date est valide
   * @param date - Date à vérifier
   * @returns true si la date est valide
   */
  static estDateValide(date: any): boolean {
    return DateUtils.estDateValide(date);
  }
}

// Exporter aussi les sous-modules pour usage direct si nécessaire
export { ValidationUtils, CryptoUtils, StringUtils, DateUtils };
