/**
 * Value Object: TransactionReference
 * Représente une référence de transaction externe (Stripe, PayPal, Bitcoin, etc.)
 */

import { PaymentError } from '../../errors/paiements/PaymentError.js';

export enum TransactionProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BITCOIN = 'bitcoin',
  BANK_TRANSFER = 'bank_transfer',
  MANUAL = 'manual',
  OTHER = 'other',
}

export class TransactionReference {
  private readonly value: string;
  private readonly provider: TransactionProvider;

  private constructor(value: string, provider: TransactionProvider) {
    this.value = value;
    this.provider = provider;
  }

  /**
   * Crée une instance TransactionReference à partir d'une valeur et un provider
   * @throws {PaymentError} Si la référence est invalide
   */
  static create(value: string, provider: TransactionProvider): TransactionReference {
    // Valider que la valeur n'est pas vide
    if (!value || typeof value !== 'string') {
      throw PaymentError.invalidTransactionReference('Référence de transaction requise');
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      throw PaymentError.invalidTransactionReference('Référence de transaction vide');
    }

    // Valider le provider
    if (!Object.values(TransactionProvider).includes(provider)) {
      throw PaymentError.invalidField('provider', `Provider invalide: ${provider}`);
    }

    // Validation spécifique selon le provider
    TransactionReference.validateByProvider(trimmedValue, provider);

    return new TransactionReference(trimmedValue, provider);
  }

  /**
   * Valide la référence selon le provider
   */
  private static validateByProvider(value: string, provider: TransactionProvider): void {
    switch (provider) {
      case TransactionProvider.STRIPE:
        TransactionReference.validateStripeReference(value);
        break;
      case TransactionProvider.PAYPAL:
        TransactionReference.validatePayPalReference(value);
        break;
      case TransactionProvider.BITCOIN:
        TransactionReference.validateBitcoinReference(value);
        break;
      case TransactionProvider.BANK_TRANSFER:
        TransactionReference.validateBankTransferReference(value);
        break;
      // MANUAL et OTHER n'ont pas de validation spécifique
    }
  }

  /**
   * Valide une référence Stripe
   */
  private static validateStripeReference(value: string): void {
    // Format Stripe: pi_xxx (PaymentIntent), ch_xxx (Charge), etc.
    const stripePatterns = [
      /^pi_[a-zA-Z0-9]{24,}$/, // Payment Intent
      /^ch_[a-zA-Z0-9]{24,}$/, // Charge
      /^py_[a-zA-Z0-9]{24,}$/, // Payout
      /^re_[a-zA-Z0-9]{24,}$/, // Refund
      /^src_[a-zA-Z0-9]{24,}$/, // Source
    ];

    const isValid = stripePatterns.some(pattern => pattern.test(value));

    if (!isValid) {
      throw PaymentError.invalidTransactionReference(
        `Format Stripe invalide: ${value}. Attendu: pi_xxx, ch_xxx, etc.`
      );
    }
  }

  /**
   * Valide une référence PayPal
   */
  private static validatePayPalReference(value: string): void {
    // Format PayPal: généralement des chaînes alphanumériques longues
    if (value.length < 10) {
      throw PaymentError.invalidTransactionReference(
        'Référence PayPal trop courte (minimum 10 caractères)'
      );
    }

    // PayPal utilise généralement des caractères alphanumériques et des tirets
    if (!/^[A-Za-z0-9\-_]+$/.test(value)) {
      throw PaymentError.invalidTransactionReference(
        'Référence PayPal invalide: seuls les caractères alphanumériques et tirets sont autorisés'
      );
    }
  }

  /**
   * Valide une adresse Bitcoin
   */
  private static validateBitcoinReference(value: string): void {
    // Bitcoin addresses: 26-35 caractères alphanumériques
    // Commence généralement par 1, 3, ou bc1
    const bitcoinPattern = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/;

    if (!bitcoinPattern.test(value)) {
      throw PaymentError.invalidTransactionReference(
        'Adresse Bitcoin invalide'
      );
    }
  }

  /**
   * Valide une référence de virement bancaire
   */
  private static validateBankTransferReference(value: string): void {
    // Référence bancaire: minimum 5 caractères
    if (value.length < 5) {
      throw PaymentError.invalidTransactionReference(
        'Référence de virement trop courte (minimum 5 caractères)'
      );
    }
  }

  /**
   * Retourne la valeur de la référence
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Retourne le provider
   */
  getProvider(): TransactionProvider {
    return this.provider;
  }

  /**
   * Vérifie si c'est une référence Stripe
   */
  isStripe(): boolean {
    return this.provider === TransactionProvider.STRIPE;
  }

  /**
   * Vérifie si c'est une référence PayPal
   */
  isPayPal(): boolean {
    return this.provider === TransactionProvider.PAYPAL;
  }

  /**
   * Vérifie si c'est une adresse Bitcoin
   */
  isBitcoin(): boolean {
    return this.provider === TransactionProvider.BITCOIN;
  }

  /**
   * Vérifie si c'est un virement bancaire
   */
  isBankTransfer(): boolean {
    return this.provider === TransactionProvider.BANK_TRANSFER;
  }

  /**
   * Vérifie si c'est une transaction manuelle
   */
  isManual(): boolean {
    return this.provider === TransactionProvider.MANUAL;
  }

  /**
   * Retourne le type de transaction Stripe
   */
  getStripeType(): 'payment_intent' | 'charge' | 'payout' | 'refund' | 'source' | 'unknown' {
    if (!this.isStripe()) {
      return 'unknown';
    }

    if (this.value.startsWith('pi_')) return 'payment_intent';
    if (this.value.startsWith('ch_')) return 'charge';
    if (this.value.startsWith('py_')) return 'payout';
    if (this.value.startsWith('re_')) return 'refund';
    if (this.value.startsWith('src_')) return 'source';

    return 'unknown';
  }

  /**
   * Vérifie si deux références sont identiques
   */
  equals(other: TransactionReference): boolean {
    if (!(other instanceof TransactionReference)) {
      return false;
    }
    return this.value === other.value && this.provider === other.provider;
  }

  /**
   * Représentation sous forme de chaîne
   */
  toString(): string {
    return this.value;
  }

  /**
   * Masque la référence pour l'affichage (affiche seulement les premiers et derniers caractères)
   */
  toMasked(): string {
    if (this.value.length <= 8) {
      return '***';
    }

    const start = this.value.substring(0, 4);
    const end = this.value.substring(this.value.length - 4);
    return `${start}...${end}`;
  }

  /**
   * Retourne une représentation JSON
   */
  toJSON() {
    return {
      value: this.value,
      provider: this.provider,
      masked: this.toMasked(),
    };
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée une référence Stripe
   */
  static stripe(paymentIntentId: string): TransactionReference {
    return TransactionReference.create(paymentIntentId, TransactionProvider.STRIPE);
  }

  /**
   * Crée une référence PayPal
   */
  static paypal(orderId: string): TransactionReference {
    return TransactionReference.create(orderId, TransactionProvider.PAYPAL);
  }

  /**
   * Crée une référence Bitcoin
   */
  static bitcoin(address: string): TransactionReference {
    return TransactionReference.create(address, TransactionProvider.BITCOIN);
  }

  /**
   * Crée une référence de virement bancaire
   */
  static bankTransfer(reference: string): TransactionReference {
    return TransactionReference.create(reference, TransactionProvider.BANK_TRANSFER);
  }

  /**
   * Crée une référence manuelle
   */
  static manual(reference: string): TransactionReference {
    return TransactionReference.create(reference, TransactionProvider.MANUAL);
  }

  /**
   * Crée une référence autre
   */
  static other(reference: string): TransactionReference {
    return TransactionReference.create(reference, TransactionProvider.OTHER);
  }

  /**
   * Tente de détecter automatiquement le provider depuis la référence
   */
  static fromString(value: string): TransactionReference {
    const trimmedValue = value.trim();

    // Détecter Stripe
    if (/^(pi|ch|py|re|src)_[a-zA-Z0-9]{24,}$/.test(trimmedValue)) {
      return TransactionReference.create(trimmedValue, TransactionProvider.STRIPE);
    }

    // Détecter Bitcoin
    if (/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(trimmedValue)) {
      return TransactionReference.create(trimmedValue, TransactionProvider.BITCOIN);
    }

    // Par défaut, considérer comme "other"
    return TransactionReference.create(trimmedValue, TransactionProvider.OTHER);
  }
}
