import { ValidationError } from '../../errors/DomainError.js';

/**
 * Types de méthodes de paiement supportées
 */
export enum PaymentMethodType {
  CARTE = 'carte',
  ESPECES = 'especes',
  VIREMENT = 'virement',
  CHEQUE = 'cheque',
  PRELEVEMENT = 'prelevement',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
}

/**
 * Value Object représentant une méthode de paiement
 *
 * Règles métier:
 * - Doit être un type de paiement valide
 * - Immuable
 * - Peut avoir des métadonnées associées (ex: 4 derniers chiffres de la carte)
 */
export class PaymentMethod {
  private readonly _type: PaymentMethodType;
  private readonly _metadata?: Record<string, any>;

  constructor(type: PaymentMethodType, metadata?: Record<string, any>) {
    this.validate(type);
    this._type = type;
    this._metadata = metadata;
  }

  /**
   * Valide le type de méthode de paiement
   */
  private validate(type: PaymentMethodType): void {
    if (!Object.values(PaymentMethodType).includes(type)) {
      throw new ValidationError(
        'paymentMethod',
        `Type de paiement invalide: ${type}`
      );
    }
  }

  /**
   * Retourne le type de méthode de paiement
   */
  public getType(): PaymentMethodType {
    return this._type;
  }

  /**
   * Retourne les métadonnées
   */
  public getMetadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  /**
   * Vérifie si c'est un paiement en ligne
   */
  public isOnline(): boolean {
    return [
      PaymentMethodType.PAYPAL,
      PaymentMethodType.STRIPE,
      PaymentMethodType.CARTE,
      PaymentMethodType.VIREMENT,
    ].includes(this._type);
  }

  /**
   * Vérifie si c'est un paiement physique
   */
  public isPhysical(): boolean {
    return [PaymentMethodType.ESPECES, PaymentMethodType.CHEQUE].includes(
      this._type
    );
  }

  /**
   * Vérifie si c'est un paiement automatique
   */
  public isAutomatic(): boolean {
    return this._type === PaymentMethodType.PRELEVEMENT;
  }

  /**
   * Vérifie si la méthode nécessite une validation manuelle
   */
  public requiresManualValidation(): boolean {
    return [PaymentMethodType.CHEQUE, PaymentMethodType.VIREMENT].includes(
      this._type
    );
  }

  /**
   * Retourne une représentation textuelle lisible
   */
  public getDisplayName(): string {
    const displayNames: Record<PaymentMethodType, string> = {
      [PaymentMethodType.CARTE]: 'Carte bancaire',
      [PaymentMethodType.ESPECES]: 'Espèces',
      [PaymentMethodType.VIREMENT]: 'Virement bancaire',
      [PaymentMethodType.CHEQUE]: 'Chèque',
      [PaymentMethodType.PRELEVEMENT]: 'Prélèvement automatique',
      [PaymentMethodType.PAYPAL]: 'PayPal',
      [PaymentMethodType.STRIPE]: 'Stripe',
    };

    return displayNames[this._type];
  }

  /**
   * Compare deux méthodes de paiement (égalité par valeur)
   */
  public equals(other: PaymentMethod | null | undefined): boolean {
    if (!other) return false;
    return this._type === other._type;
  }

  /**
   * Retourne la valeur pour la persistance
   */
  public getValue(): string {
    return this._type;
  }

  /**
   * Retourne la valeur pour la persistance
   */
  public toString(): string {
    return this._type;
  }

  /**
   * Convertit en objet simple
   */
  public toObject(): Record<string, any> {
    return {
      type: this._type,
      metadata: this._metadata,
    };
  }

  /**
   * Crée une méthode de paiement à partir d'une chaîne
   */
  public static fromString(type: string, metadata?: Record<string, any>): PaymentMethod {
    const paymentType = type as PaymentMethodType;
    return new PaymentMethod(paymentType, metadata);
  }

  /**
   * Crée une méthode de paiement ou retourne null si invalide
   */
  public static createOrNull(
    type: string,
    metadata?: Record<string, any>
  ): PaymentMethod | null {
    try {
      return PaymentMethod.fromString(type, metadata);
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si une chaîne est une méthode de paiement valide
   */
  public static isValid(type: string): boolean {
    return Object.values(PaymentMethodType).includes(type as PaymentMethodType);
  }

  // ============== FACTORY METHODS ==============

  public static carte(lastFourDigits?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.CARTE, {
      lastFourDigits,
    });
  }

  public static especes(): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.ESPECES);
  }

  public static virement(referenceId?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.VIREMENT, {
      referenceId,
    });
  }

  public static cheque(checkNumber?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.CHEQUE, {
      checkNumber,
    });
  }

  public static prelevement(mandateId?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.PRELEVEMENT, {
      mandateId,
    });
  }

  public static paypal(paypalEmail?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.PAYPAL, {
      paypalEmail,
    });
  }

  public static stripe(chargeId?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.STRIPE, {
      chargeId,
    });
  }
}
