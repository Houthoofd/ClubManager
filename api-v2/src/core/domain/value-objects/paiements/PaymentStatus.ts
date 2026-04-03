import { ValidationError } from '../../errors/DomainError.js';

/**
 * Statuts possibles pour un paiement
 */
export enum PaymentStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  REFUSED = 'refused',
}

/**
 * Value Object représentant le statut d'un paiement
 *
 * Règles métier:
 * - Le statut doit être l'un des statuts définis
 * - Immuable
 * - Transitions validées selon les règles métier
 */
export class PaymentStatus {
  private readonly value: PaymentStatusEnum;

  constructor(status: PaymentStatusEnum | string) {
    this.validate(status);
    this.value = status as PaymentStatusEnum;
  }

  /**
   * Valide le statut
   */
  private validate(status: string): void {
    if (!status) {
      throw new ValidationError('status', 'Le statut est obligatoire');
    }

    const validStatuses = Object.values(PaymentStatusEnum);
    if (!validStatuses.includes(status as PaymentStatusEnum)) {
      throw new ValidationError(
        'status',
        `Le statut "${status}" n'est pas valide. Valeurs acceptées: ${validStatuses.join(', ')}`
      );
    }
  }

  /**
   * Retourne la valeur du statut
   */
  public getValue(): PaymentStatusEnum {
    return this.value;
  }

  /**
   * Retourne la valeur du statut en string
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Compare deux statuts (égalité par valeur)
   */
  public equals(other: PaymentStatus | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Vérifie si le statut est en attente
   */
  public isPending(): boolean {
    return this.value === PaymentStatusEnum.PENDING;
  }

  /**
   * Vérifie si le statut est complété
   */
  public isCompleted(): boolean {
    return this.value === PaymentStatusEnum.COMPLETED;
  }

  /**
   * Vérifie si le statut est remboursé
   */
  public isRefunded(): boolean {
    return this.value === PaymentStatusEnum.REFUNDED;
  }

  /**
   * Vérifie si le statut est annulé
   */
  public isCancelled(): boolean {
    return this.value === PaymentStatusEnum.CANCELLED;
  }

  /**
   * Vérifie si le statut est refusé
   */
  public isRefused(): boolean {
    return this.value === PaymentStatusEnum.REFUSED;
  }

  /**
   * Vérifie si le paiement est dans un état final (ne peut plus être modifié)
   */
  public isFinal(): boolean {
    return (
      this.value === PaymentStatusEnum.REFUNDED ||
      this.value === PaymentStatusEnum.CANCELLED ||
      this.value === PaymentStatusEnum.REFUSED
    );
  }

  /**
   * Vérifie si le paiement peut être remboursé
   */
  public canBeRefunded(): boolean {
    return this.value === PaymentStatusEnum.COMPLETED;
  }

  /**
   * Vérifie si le paiement peut être annulé
   */
  public canBeCancelled(): boolean {
    return this.value === PaymentStatusEnum.PENDING;
  }

  /**
   * Vérifie si une transition vers un nouveau statut est valide
   */
  public canTransitionTo(newStatus: PaymentStatus): boolean {
    const current = this.value;
    const target = newStatus.getValue();

    // Matrice des transitions autorisées
    const allowedTransitions: Record<PaymentStatusEnum, PaymentStatusEnum[]> = {
      [PaymentStatusEnum.PENDING]: [
        PaymentStatusEnum.COMPLETED,
        PaymentStatusEnum.CANCELLED,
        PaymentStatusEnum.REFUSED,
      ],
      [PaymentStatusEnum.COMPLETED]: [
        PaymentStatusEnum.REFUNDED,
      ],
      [PaymentStatusEnum.REFUNDED]: [],
      [PaymentStatusEnum.CANCELLED]: [],
      [PaymentStatusEnum.REFUSED]: [],
    };

    return allowedTransitions[current]?.includes(target) ?? false;
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée un statut PENDING
   */
  public static pending(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PENDING);
  }

  /**
   * Crée un statut COMPLETED
   */
  public static completed(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.COMPLETED);
  }

  /**
   * Crée un statut REFUNDED
   */
  public static refunded(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.REFUNDED);
  }

  /**
   * Crée un statut CANCELLED
   */
  public static cancelled(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.CANCELLED);
  }

  /**
   * Crée un statut REFUSED
   */
  public static refused(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.REFUSED);
  }

  /**
   * Crée un PaymentStatus à partir d'une chaîne (factory method)
   * Retourne null si le statut est invalide au lieu de lever une erreur
   */
  public static createOrNull(status: string): PaymentStatus | null {
    try {
      return new PaymentStatus(status);
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si une chaîne est un statut valide sans créer l'objet
   */
  public static isValid(status: string): boolean {
    return PaymentStatus.createOrNull(status) !== null;
  }
}
