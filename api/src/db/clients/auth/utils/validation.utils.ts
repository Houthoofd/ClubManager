/**
 * Utilitaires de validation pour le module Auth
 * Responsabilité : Validation email, mot de passe, codes
 */

import type { ResultatValidationMotDePasse } from '../types.js';

export class ValidationUtils {
  /**
   * Valide le format d'un email
   * @param email - Email à valider
   * @returns true si l'email est valide
   */
  static validerEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Valide la force d'un mot de passe (version complète)
   * @param password - Mot de passe à valider
   * @returns Objet avec le résultat et les erreurs éventuelles
   */
  static validerMotDePasse(password: string): ResultatValidationMotDePasse {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
      return {
        valid: false,
        errors: ['Le mot de passe est requis']
      };
    }

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (password.length > 128) {
      errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide la force d'un mot de passe (version simplifiée)
   * @param password - Mot de passe à valider
   * @returns Objet avec le résultat et les erreurs éventuelles
   */
  static validerMotDePasseSimple(password: string): ResultatValidationMotDePasse {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
      return {
        valid: false,
        errors: ['Le mot de passe est requis']
      };
    }

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide un code de vérification (6 chiffres)
   * @param code - Code à valider
   * @returns true si le code est valide
   */
  static validerCodeVerification(code: string): boolean {
    return /^\d{6}$/.test(code);
  }

  /**
   * Valide un token (format hexadécimal)
   * @param token - Token à valider
   * @param minLength - Longueur minimale (défaut: 32)
   * @returns true si le token est valide
   */
  static validerToken(token: string, minLength: number = 32): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    return /^[a-f0-9]+$/i.test(token) && token.length >= minLength;
  }

  /**
   * Valide un ID utilisateur
   * @param userId - ID à valider
   * @returns true si l'ID est valide
   */
  static validerUserId(userId: any): boolean {
    return Number.isInteger(userId) && userId > 0;
  }
}
