/**
 * Value Object: Money
 * Représente un montant monétaire avec une devise
 */

import { PaymentError } from '../../errors/paiements/PaymentError.js';

export class Money {
  private readonly amount: number;
  private readonly currency: string;

  private static readonly DEFAULT_CURRENCY = 'EUR';
  private static readonly SUPPORTED_CURRENCIES = [
    'EUR',
    'USD',
    'GBP',
    'CHF',
    'CAD',
    'JPY',
    'CNY',
  ];

  private constructor(amount: number, currency: string) {
    this.amount = amount;
    this.currency = currency;
  }

  /**
   * Crée une instance Money à partir d'un montant et une devise
   * @throws {PaymentError} Si le montant ou la devise est invalide
   */
  static create(amount: number, currency: string = Money.DEFAULT_CURRENCY): Money {
    // Valider le montant
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw PaymentError.invalidAmount('Le montant doit être un nombre valide');
    }

    if (amount < 0) {
      throw PaymentError.invalidAmount('Le montant ne peut pas être négatif');
    }

    if (!isFinite(amount)) {
      throw PaymentError.invalidAmount('Le montant doit être un nombre fini');
    }

    // Limiter à 2 décimales
    const roundedAmount = Math.round(amount * 100) / 100;

    // Valider la devise
    const normalizedCurrency = currency.toUpperCase().trim();
    if (!Money.isSupportedCurrency(normalizedCurrency)) {
      throw PaymentError.invalidCurrency(
        `Devise non supportée: ${currency}. Devises acceptées: ${Money.SUPPORTED_CURRENCIES.join(', ')}`
      );
    }

    return new Money(roundedAmount, normalizedCurrency);
  }

  /**
   * Crée une instance Money à partir d'un montant en centimes
   */
  static fromCents(cents: number, currency: string = Money.DEFAULT_CURRENCY): Money {
    if (!Number.isInteger(cents)) {
      throw PaymentError.invalidAmount('Les centimes doivent être un nombre entier');
    }
    return Money.create(cents / 100, currency);
  }

  /**
   * Crée une instance Money pour un montant zéro
   */
  static zero(currency: string = Money.DEFAULT_CURRENCY): Money {
    return new Money(0, currency);
  }

  /**
   * Vérifie si une devise est supportée
   */
  private static isSupportedCurrency(currency: string): boolean {
    return Money.SUPPORTED_CURRENCIES.includes(currency);
  }

  /**
   * Retourne le montant
   */
  getAmount(): number {
    return this.amount;
  }

  /**
   * Retourne la devise
   */
  getCurrency(): string {
    return this.currency;
  }

  /**
   * Retourne le montant en centimes (entier)
   */
  getCents(): number {
    return Math.round(this.amount * 100);
  }

  /**
   * Additionne deux montants
   * @throws {PaymentError} Si les devises sont différentes
   */
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  /**
   * Soustrait deux montants
   * @throws {PaymentError} Si les devises sont différentes ou si le résultat est négatif
   */
  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;

    if (result < 0) {
      throw PaymentError.insufficientFunds(
        `Montant insuffisant: ${this.amount} ${this.currency} - ${other.amount} ${other.currency}`
      );
    }

    return Money.create(result, this.currency);
  }

  /**
   * Multiplie le montant par un facteur
   */
  multiply(factor: number): Money {
    if (typeof factor !== 'number' || isNaN(factor) || factor < 0) {
      throw PaymentError.invalidAmount('Le facteur de multiplication doit être un nombre positif');
    }
    return Money.create(this.amount * factor, this.currency);
  }

  /**
   * Divise le montant
   */
  divide(divisor: number): Money {
    if (typeof divisor !== 'number' || isNaN(divisor) || divisor <= 0) {
      throw PaymentError.invalidAmount('Le diviseur doit être un nombre positif non nul');
    }
    return Money.create(this.amount / divisor, this.currency);
  }

  /**
   * Applique un pourcentage (ex: 20 pour 20%)
   */
  applyPercentage(percentage: number): Money {
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      throw PaymentError.invalidAmount('Le pourcentage doit être un nombre valide');
    }
    return this.multiply(percentage / 100);
  }

  /**
   * Vérifie si le montant est positif (> 0)
   */
  isPositive(): boolean {
    return this.amount > 0;
  }

  /**
   * Vérifie si le montant est zéro
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Vérifie si ce montant est supérieur à un autre
   */
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Vérifie si ce montant est supérieur ou égal à un autre
   */
  isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount >= other.amount;
  }

  /**
   * Vérifie si ce montant est inférieur à un autre
   */
  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Vérifie si ce montant est inférieur ou égal à un autre
   */
  isLessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount <= other.amount;
  }

  /**
   * Vérifie si deux montants sont égaux
   */
  equals(other: Money): boolean {
    if (!(other instanceof Money)) {
      return false;
    }
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * Vérifie que deux montants ont la même devise
   * @throws {PaymentError} Si les devises sont différentes
   */
  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw PaymentError.currencyMismatch(
        `Devises incompatibles: ${this.currency} et ${other.currency}`
      );
    }
  }

  /**
   * Formate le montant avec symbole de devise
   */
  format(locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  /**
   * Retourne le montant sous forme de chaîne décimale
   */
  toDecimal(decimals: number = 2): string {
    return this.amount.toFixed(decimals);
  }

  /**
   * Représentation sous forme de chaîne
   */
  toString(): string {
    return `${this.amount} ${this.currency}`;
  }

  /**
   * Représentation JSON
   */
  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
      formatted: this.format(),
    };
  }

  /**
   * Crée une copie du montant
   */
  clone(): Money {
    return new Money(this.amount, this.currency);
  }
}
