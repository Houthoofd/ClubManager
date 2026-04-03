/**
 * Entity: PaymentTransaction
 * Représente une transaction/action effectuée sur un paiement (audit trail)
 */

import { PaymentError } from '../../errors/paiements/PaymentError.js';

export enum PaymentTransactionType {
  CREATION = 'creation',
  VALIDATION = 'validation',
  REFUND = 'refund',
  CANCELLATION = 'cancellation',
  REFUSAL = 'refusal',
  UPDATE = 'update',
  STATUS_CHANGE = 'status_change',
}

export interface PaymentTransactionProps {
  id?: number;
  paymentId: number;
  type: PaymentTransactionType;
  performedBy: number;
  performedAt: Date;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export class PaymentTransaction {
  private readonly id?: number;
  private readonly paymentId: number;
  private readonly type: PaymentTransactionType;
  private readonly performedBy: number;
  private readonly performedAt: Date;
  private readonly reason?: string;
  private readonly metadata?: Record<string, any>;
  private readonly ipAddress?: string;
  private readonly userAgent?: string;
  private readonly createdAt: Date;

  private constructor(props: PaymentTransactionProps) {
    this.id = props.id;
    this.paymentId = props.paymentId;
    this.type = props.type;
    this.performedBy = props.performedBy;
    this.performedAt = props.performedAt;
    this.reason = props.reason;
    this.metadata = props.metadata;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.createdAt = props.createdAt || new Date();
  }

  /**
   * Crée une nouvelle transaction de paiement
   */
  static create(
    props: Omit<PaymentTransactionProps, 'id' | 'createdAt' | 'performedAt'>
  ): PaymentTransaction {
    // Validation
    PaymentTransaction.validate(props);

    return new PaymentTransaction({
      ...props,
      performedAt: new Date(),
      createdAt: new Date(),
    });
  }

  /**
   * Recrée une transaction depuis la base de données
   */
  static fromPersistence(data: PaymentTransactionProps): PaymentTransaction {
    if (!data.id) {
      throw PaymentError.invalidField('id', 'ID requis pour reconstituer une transaction');
    }

    return new PaymentTransaction(data);
  }

  /**
   * Valide les propriétés de la transaction
   */
  private static validate(props: Partial<PaymentTransactionProps>): void {
    if (!props.paymentId || props.paymentId <= 0) {
      throw PaymentError.invalidField('paymentId', 'ID paiement invalide');
    }

    if (!props.type || !Object.values(PaymentTransactionType).includes(props.type)) {
      throw PaymentError.invalidField('type', 'Type de transaction invalide');
    }

    if (!props.performedBy || props.performedBy <= 0) {
      throw PaymentError.invalidField('performedBy', 'ID utilisateur invalide');
    }
  }

  // ============== BUSINESS LOGIC METHODS ==============

  /**
   * Vérifie si c'est une transaction de création
   */
  isCreation(): boolean {
    return this.type === PaymentTransactionType.CREATION;
  }

  /**
   * Vérifie si c'est une transaction de validation
   */
  isValidation(): boolean {
    return this.type === PaymentTransactionType.VALIDATION;
  }

  /**
   * Vérifie si c'est une transaction de remboursement
   */
  isRefund(): boolean {
    return this.type === PaymentTransactionType.REFUND;
  }

  /**
   * Vérifie si c'est une transaction d'annulation
   */
  isCancellation(): boolean {
    return this.type === PaymentTransactionType.CANCELLATION;
  }

  /**
   * Vérifie si c'est une transaction de refus
   */
  isRefusal(): boolean {
    return this.type === PaymentTransactionType.REFUSAL;
  }

  /**
   * Vérifie si c'est une transaction de mise à jour
   */
  isUpdate(): boolean {
    return this.type === PaymentTransactionType.UPDATE;
  }

  /**
   * Vérifie si c'est un changement de statut
   */
  isStatusChange(): boolean {
    return this.type === PaymentTransactionType.STATUS_CHANGE;
  }

  /**
   * Vérifie si la transaction a une raison
   */
  hasReason(): boolean {
    return !!this.reason && this.reason.trim().length > 0;
  }

  /**
   * Vérifie si la transaction a des métadonnées
   */
  hasMetadata(): boolean {
    return !!this.metadata && Object.keys(this.metadata).length > 0;
  }

  /**
   * Retourne le label du type de transaction
   */
  getTypeLabel(): string {
    const labels: Record<PaymentTransactionType, string> = {
      [PaymentTransactionType.CREATION]: 'Création',
      [PaymentTransactionType.VALIDATION]: 'Validation',
      [PaymentTransactionType.REFUND]: 'Remboursement',
      [PaymentTransactionType.CANCELLATION]: 'Annulation',
      [PaymentTransactionType.REFUSAL]: 'Refus',
      [PaymentTransactionType.UPDATE]: 'Mise à jour',
      [PaymentTransactionType.STATUS_CHANGE]: 'Changement de statut',
    };

    return labels[this.type] || 'Inconnu';
  }

  /**
   * Retourne une entrée de log formatée
   */
  toLogEntry(): string {
    const timestamp = this.performedAt.toISOString();
    const action = this.getTypeLabel();
    const user = `Utilisateur #${this.performedBy}`;
    const payment = `Paiement #${this.paymentId}`;

    let log = `[${timestamp}] ${user} - ${action} - ${payment}`;

    if (this.reason) {
      log += ` - Raison: ${this.reason}`;
    }

    if (this.ipAddress) {
      log += ` - IP: ${this.ipAddress}`;
    }

    return log;
  }

  /**
   * Retourne une description détaillée de la transaction
   */
  getDescription(): string {
    let description = this.getTypeLabel();

    if (this.reason) {
      description += ` - ${this.reason}`;
    }

    return description;
  }

  /**
   * Retourne l'âge de la transaction en minutes
   */
  getAgeInMinutes(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.performedAt.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Retourne l'âge de la transaction en heures
   */
  getAgeInHours(): number {
    return Math.floor(this.getAgeInMinutes() / 60);
  }

  /**
   * Retourne l'âge de la transaction en jours
   */
  getAgeInDays(): number {
    return Math.floor(this.getAgeInHours() / 24);
  }

  /**
   * Vérifie si la transaction est récente (moins de X minutes)
   */
  isRecent(minutes: number = 5): boolean {
    return this.getAgeInMinutes() < minutes;
  }

  /**
   * Extrait une valeur des métadonnées
   */
  getMetadataValue<T = any>(key: string): T | undefined {
    if (!this.metadata) {
      return undefined;
    }
    return this.metadata[key] as T;
  }

  // ============== GETTERS ==============

  getId(): number | undefined {
    return this.id;
  }

  getPaymentId(): number {
    return this.paymentId;
  }

  getType(): PaymentTransactionType {
    return this.type;
  }

  getPerformedBy(): number {
    return this.performedBy;
  }

  getPerformedAt(): Date {
    return new Date(this.performedAt);
  }

  getReason(): string | undefined {
    return this.reason;
  }

  getMetadata(): Record<string, any> | undefined {
    return this.metadata ? { ...this.metadata } : undefined;
  }

  getIpAddress(): string | undefined {
    return this.ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.userAgent;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  // ============== SERIALIZATION ==============

  /**
   * Convertit la transaction en objet simple
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      paymentId: this.paymentId,
      type: this.type,
      performedBy: this.performedBy,
      performedAt: this.performedAt.toISOString(),
      reason: this.reason,
      metadata: this.metadata,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Convertit en objet pour l'affichage public
   */
  toPublicObject(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      typeLabel: this.getTypeLabel(),
      performedAt: this.performedAt.toISOString(),
      reason: this.reason,
      ageInMinutes: this.getAgeInMinutes(),
    };
  }

  /**
   * Convertit en format d'audit complet
   */
  toAuditObject(): Record<string, any> {
    return {
      id: this.id,
      paymentId: this.paymentId,
      type: this.type,
      typeLabel: this.getTypeLabel(),
      performedBy: this.performedBy,
      performedAt: this.performedAt.toISOString(),
      reason: this.reason,
      metadata: this.metadata,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      logEntry: this.toLogEntry(),
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Clone la transaction
   */
  clone(): PaymentTransaction {
    return new PaymentTransaction({
      id: this.id,
      paymentId: this.paymentId,
      type: this.type,
      performedBy: this.performedBy,
      performedAt: new Date(this.performedAt),
      reason: this.reason,
      metadata: this.metadata ? { ...this.metadata } : undefined,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: new Date(this.createdAt),
    });
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée une transaction de création
   */
  static creation(
    paymentId: number,
    performedBy: number,
    metadata?: Record<string, any>
  ): PaymentTransaction {
    return PaymentTransaction.create({
      paymentId,
      type: PaymentTransactionType.CREATION,
      performedBy,
      metadata,
    });
  }

  /**
   * Crée une transaction de validation
   */
  static validation(
    paymentId: number,
    performedBy: number,
    metadata?: Record<string, any>
  ): PaymentTransaction {
    return PaymentTransaction.create({
      paymentId,
      type: PaymentTransactionType.VALIDATION,
      performedBy,
      metadata,
    });
  }

  /**
   * Crée une transaction de remboursement
   */
  static refund(
    paymentId: number,
    performedBy: number,
    reason?: string,
    metadata?: Record<string, any>
  ): PaymentTransaction {
    return PaymentTransaction.create({
      paymentId,
      type: PaymentTransactionType.REFUND,
      performedBy,
      reason,
      metadata,
    });
  }

  /**
   * Crée une transaction d'annulation
   */
  static cancellation(
    paymentId: number,
    performedBy: number,
    reason?: string,
    metadata?: Record<string, any>
  ): PaymentTransaction {
    return PaymentTransaction.create({
      paymentId,
      type: PaymentTransactionType.CANCELLATION,
      performedBy,
      reason,
      metadata,
    });
  }

  /**
   * Crée une transaction de refus
   */
  static refusal(
    paymentId: number,
    performedBy: number,
    reason?: string,
    metadata?: Record<string, any>
  ): PaymentTransaction {
    return PaymentTransaction.create({
      paymentId,
      type: PaymentTransactionType.REFUSAL,
      performedBy,
      reason,
      metadata,
    });
  }
}
