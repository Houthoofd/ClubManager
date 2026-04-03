import { InvalidEmailError } from '../errors/DomainError.js';

/**
 * Value Object représentant une adresse email
 *
 * Règles métier:
 * - Format valide selon RFC 5322 (simplifié)
 * - Longueur maximale de 255 caractères
 * - Normalisation en minuscules
 * - Immuable
 */
export class Email {
  private readonly value: string;

  constructor(email: string) {
    const normalizedEmail = this.normalize(email);
    this.validate(normalizedEmail);
    this.value = normalizedEmail;
  }

  /**
   * Normalise l'email (trim + lowercase)
   */
  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Valide le format de l'email
   */
  private validate(email: string): void {
    // Vérifier que l'email n'est pas vide
    if (!email || email.length === 0) {
      throw new InvalidEmailError('vide');
    }

    // Vérifier la longueur maximale
    if (email.length > 255) {
      throw new InvalidEmailError(email + ' (trop long)');
    }

    // Regex simple mais efficace pour valider un email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new InvalidEmailError(email);
    }

    // Vérifications supplémentaires
    const [localPart, domain] = email.split('@');

    // Local part (avant @) ne doit pas dépasser 64 caractères
    if (localPart.length > 64) {
      throw new InvalidEmailError(email + ' (partie locale trop longue)');
    }

    // Domaine ne doit pas dépasser 255 caractères
    if (domain.length > 255) {
      throw new InvalidEmailError(email + ' (domaine trop long)');
    }

    // Le domaine doit avoir au moins un point
    if (!domain.includes('.')) {
      throw new InvalidEmailError(email + ' (domaine invalide)');
    }
  }

  /**
   * Retourne la valeur de l'email
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Retourne la valeur de l'email (alias)
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Compare deux emails (égalité par valeur)
   */
  public equals(other: Email | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Retourne le domaine de l'email
   */
  public getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Retourne la partie locale de l'email (avant @)
   */
  public getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * Vérifie si l'email appartient à un domaine spécifique
   */
  public isFromDomain(domain: string): boolean {
    return this.getDomain() === domain.toLowerCase();
  }

  /**
   * Crée un Email à partir d'une chaîne (factory method)
   * Retourne null si l'email est invalide au lieu de lever une erreur
   */
  public static createOrNull(email: string): Email | null {
    try {
      return new Email(email);
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si une chaîne est un email valide sans créer l'objet
   */
  public static isValid(email: string): boolean {
    return Email.createOrNull(email) !== null;
  }
}
