/**
 * Value Object: Email
 * Représente une adresse email valide et normalisée
 */

import { AuthError } from '../../errors/auth/AuthError.js';

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  /**
   * Crée une instance Email à partir d'une chaîne
   * @throws {AuthError} Si l'email est invalide
   */
  static create(email: string): Email {
    if (!email || typeof email !== 'string') {
      throw AuthError.invalidEmail('Email requis');
    }

    // Normaliser: trim et lowercase
    const normalized = email.trim().toLowerCase();

    if (!Email.isValid(normalized)) {
      throw AuthError.invalidEmail(`Format d'email invalide: ${email}`);
    }

    return new Email(normalized);
  }

  /**
   * Valide le format d'un email
   */
  private static isValid(email: string): boolean {
    // Regex RFC 5322 simplifiée
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    // Vérifications additionnelles
    const [localPart, domain] = email.split('@');

    // Local part ne peut pas être vide ou trop long
    if (localPart.length === 0 || localPart.length > 64) {
      return false;
    }

    // Domain ne peut pas être vide ou trop long
    if (domain.length === 0 || domain.length > 255) {
      return false;
    }

    // Domain doit avoir au moins un point
    if (!domain.includes('.')) {
      return false;
    }

    // TLD doit avoir au moins 2 caractères
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
      return false;
    }

    return true;
  }

  /**
   * Retourne la valeur de l'email
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Retourne la partie locale de l'email (avant @)
   */
  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * Retourne le domaine de l'email (après @)
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Vérifie si deux emails sont identiques
   */
  equals(other: Email): boolean {
    if (!(other instanceof Email)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Représentation sous forme de chaîne
   */
  toString(): string {
    return this.value;
  }

  /**
   * Masque l'email pour l'affichage (ex: j***@example.com)
   */
  toMasked(): string {
    const [localPart, domain] = this.value.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  }
}
