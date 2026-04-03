/**
 * Value Object: Password
 * Représente un mot de passe sécurisé avec validation et hashing
 */

import bcrypt from 'bcrypt';
import { AuthError } from '../../errors/auth/AuthError.js';

export interface PasswordValidationRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
}

export interface PasswordStrength {
  score: number; // 0-5
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
}

export class Password {
  private readonly hashedValue: string;
  private static readonly BCRYPT_ROUNDS = 12;
  private static readonly DEFAULT_RULES: PasswordValidationRules = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
  };

  private constructor(hashedPassword: string) {
    this.hashedValue = hashedPassword;
  }

  /**
   * Crée une instance Password à partir d'un mot de passe en clair
   * Valide et hash le mot de passe
   * @throws {AuthError} Si le mot de passe est invalide
   */
  static async create(
    plainPassword: string,
    rules: PasswordValidationRules = Password.DEFAULT_RULES
  ): Promise<Password> {
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw AuthError.invalidPassword('Mot de passe requis');
    }

    // Valider le mot de passe
    Password.validate(plainPassword, rules);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, Password.BCRYPT_ROUNDS);

    return new Password(hashedPassword);
  }

  /**
   * Crée une instance Password à partir d'un hash existant
   * Utilisé lors de la récupération depuis la base de données
   */
  static fromHash(hashedPassword: string): Password {
    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Hash de mot de passe invalide');
    }

    // Vérifier que c'est bien un hash bcrypt
    if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
      throw new Error('Format de hash invalide');
    }

    return new Password(hashedPassword);
  }

  /**
   * Valide un mot de passe selon les règles définies
   * @throws {AuthError} Si le mot de passe ne respecte pas les règles
   */
  static validate(
    plainPassword: string,
    rules: PasswordValidationRules = Password.DEFAULT_RULES
  ): void {
    const errors: AuthError[] = [];

    // Vérifier la longueur minimale
    if (plainPassword.length < rules.minLength) {
      errors.push(AuthError.passwordTooShort(rules.minLength));
    }

    // Vérifier la présence d'une majuscule
    if (rules.requireUppercase && !/[A-Z]/.test(plainPassword)) {
      errors.push(AuthError.passwordMissingUppercase());
    }

    // Vérifier la présence d'une minuscule
    if (rules.requireLowercase && !/[a-z]/.test(plainPassword)) {
      errors.push(AuthError.passwordMissingLowercase());
    }

    // Vérifier la présence d'un chiffre
    if (rules.requireNumber && !/[0-9]/.test(plainPassword)) {
      errors.push(AuthError.passwordMissingNumber());
    }

    // Vérifier la présence d'un caractère spécial
    if (rules.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(plainPassword)) {
      errors.push(AuthError.passwordMissingSpecialChar());
    }

    // Si des erreurs existent, lancer la première
    if (errors.length > 0) {
      throw errors[0];
    }
  }

  /**
   * Vérifie si un mot de passe en clair correspond au hash
   */
  async verify(plainPassword: string): Promise<boolean> {
    if (!plainPassword) {
      return false;
    }

    try {
      return await bcrypt.compare(plainPassword, this.hashedValue);
    } catch (error) {
      console.error('[Password] Erreur lors de la vérification:', error);
      return false;
    }
  }

  /**
   * Évalue la force d'un mot de passe
   */
  static evaluateStrength(plainPassword: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];

    // Longueur
    if (plainPassword.length >= 8) score++;
    if (plainPassword.length >= 12) score++;
    if (plainPassword.length >= 16) score++;
    else if (plainPassword.length < 8) {
      feedback.push('Utilisez au moins 8 caractères');
    }

    // Complexité
    if (/[a-z]/.test(plainPassword)) score++;
    else feedback.push('Ajoutez des lettres minuscules');

    if (/[A-Z]/.test(plainPassword)) score++;
    else feedback.push('Ajoutez des lettres majuscules');

    if (/[0-9]/.test(plainPassword)) score++;
    else feedback.push('Ajoutez des chiffres');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(plainPassword)) score++;
    else feedback.push('Ajoutez des caractères spéciaux');

    // Pénalités
    if (/(.)\1{2,}/.test(plainPassword)) {
      score--;
      feedback.push('Évitez les caractères répétés');
    }

    if (/^[a-zA-Z]+$/.test(plainPassword)) {
      score--;
      feedback.push('Mélangez lettres et chiffres');
    }

    // Normaliser le score entre 0 et 5
    score = Math.max(0, Math.min(5, score));

    // Déterminer le niveau
    let level: PasswordStrength['level'];
    if (score <= 1) level = 'very-weak';
    else if (score === 2) level = 'weak';
    else if (score === 3) level = 'fair';
    else if (score === 4) level = 'good';
    else if (score === 5) level = 'strong';
    else level = 'very-strong';

    return { score, level, feedback };
  }

  /**
   * Retourne le hash du mot de passe
   */
  getHash(): string {
    return this.hashedValue;
  }

  /**
   * Vérifie si le mot de passe est identique à un autre
   */
  equals(other: Password): boolean {
    if (!(other instanceof Password)) {
      return false;
    }
    return this.hashedValue === other.hashedValue;
  }

  /**
   * Retourne une représentation sécurisée (masquée)
   */
  toString(): string {
    return '********';
  }
}
