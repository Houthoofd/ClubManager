/**
 * Entité Payment - Représente un paiement dans le système
 *
 * Cette classe contient:
 * - Les propriétés du paiement
 * - La logique métier (validation, remboursement, annulation)
 * - Les méthodes de manipulation
 *
 * Règles métier:
 * - Un paiement doit avoir un montant positif
 * - Un paiement doit être associé à un utilisateur
 * - Seuls les paiements COMPLETED peuvent être remboursés
 * - Seuls les paiements PENDING peuvent être annulés
 * - Un paiement dans un état final ne peut plus être modifié
 */

import { Money } from '../../value-objects/paiements/Money.js';
import { PaymentMethod } from '../../value-objects/paiements/PaymentMethod.js';
import { PaymentStatus, PaymentStatusEnum } from '../../value-objects/paiements/PaymentStatus.js';
import { ValidationError } from '../../errors/DomainError.js';

export interface PaymentProps {
  id?: number;
  userId: number;
  orderId?: number;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  paymentDate: Date;
  confirmedAt?: Date;
  description?: string;
  subscriptionId?: number;
  periodStart?: Date;
  periodEnd?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Payment {
  private readonly _id?: number;
  private readonly _userId: number;
  private readonly _orderId?: number;
  private readonly _amount: Money;
  private readonly _method: PaymentMethod;
  private _status: PaymentStatus;
  private readonly _transactionRef?: string;
  private readonly _paymentDate: Date;
  private _confirmedAt?: Date;
  private _description?: string;
  private readonly _subscriptionId?: number;
  private readonly _periodStart?: Date;
  private readonly _periodEnd?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PaymentProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._orderId = props.orderId;
    this._amount = props.amount;
    this._method = props.method;
    this._status = props.status;
    this._transactionRef = props.transactionRef;
    this._paymentDate = props.paymentDate;
    this._confirmedAt = props.confirmedAt;
    this._description = props.description;
    this._subscriptionId = props.subscriptionId;
    this._periodStart = props.periodStart;
    this._periodEnd = props.periodEnd;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée un nouveau paiement
   */
  public static create(
    props: Omit<PaymentProps, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'confirmedAt'>
  ): Payment {
    // Validation des données obligatoires
    Payment.validateUserId(props.userId);
    Payment.validateAmount(props.amount);
    Payment.validateMethod(props.method);
    Payment.validatePaymentDate(props.paymentDate);

    // Validation de la période si présente
    if (props.periodStart && props.periodEnd) {
      Payment.validatePeriod(props.periodStart, props.periodEnd);
    }

    return new Payment({
      ...props,
      status: PaymentStatus.pending(),
      confirmedAt: undefined,
    });
  }

  /**
   * Reconstruit un paiement depuis la base de données
   */
  public static fromPersistence(props: PaymentProps): Payment {
    return new Payment(props);
  }

  // ============== VALIDATIONS MÉTIER ==============

  private static validateUserId(userId: number): void {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ValidationError('userId', 'L\'identifiant utilisateur est invalide');
    }
  }

  private static validateAmount(amount: Money): void {
    if (!(amount instanceof Money)) {
      throw new ValidationError('amount', 'Le montant est invalide');
    }

    if (amount.isZero() || !amount.isPositive()) {
      throw new ValidationError('amount', 'Le montant doit être supérieur à zéro');
    }
  }

  private static validateMethod(method: PaymentMethod): void {
    if (!(method instanceof PaymentMethod)) {
      throw new ValidationError('method', 'La méthode de paiement est invalide');
    }
  }

  private static validatePaymentDate(paymentDate: Date): void {
    if (!(paymentDate instanceof Date) || isNaN(paymentDate.getTime())) {
      throw new ValidationError('paymentDate', 'La date de paiement est invalide');
    }
  }

  private static validatePeriod(periodStart: Date, periodEnd: Date): void {
    if (!(periodStart instanceof Date) || isNaN(periodStart.getTime())) {
      throw new ValidationError('periodStart', 'La date de début de période est invalide');
    }

    if (!(periodEnd instanceof Date) || isNaN(periodEnd.getTime())) {
      throw new ValidationError('periodEnd', 'La date de fin de période est invalide');
    }

    if (periodEnd <= periodStart) {
      throw new ValidationError(
        'periodEnd',
        'La date de fin de période doit être postérieure à la date de début'
      );
    }
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Valide le paiement (change le statut à COMPLETED)
   */
  public validate(): void {
    if (!this._status.isPending()) {
      throw new ValidationError(
        'status',
        `Impossible de valider un paiement avec le statut ${this._status.getValue()}`
      );
    }

    this._status = PaymentStatus.completed();
    this._confirmedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Rembourse le paiement (change le statut à REFUNDED)
   * Règle métier: Seuls les paiements COMPLETED peuvent être remboursés
   */
  public refund(): void {
    if (!this.isRefundable()) {
      throw new ValidationError(
        'status',
        `Impossible de rembourser un paiement avec le statut ${this._status.getValue()}`
      );
    }

    this._status = PaymentStatus.refunded();
    this._updatedAt = new Date();
  }

  /**
   * Annule le paiement (change le statut à CANCELLED)
   * Règle métier: Seuls les paiements PENDING peuvent être annulés
   */
  public cancel(): void {
    if (!this.canBeCancelled()) {
      throw new ValidationError(
        'status',
        `Impossible d'annuler un paiement avec le statut ${this._status.getValue()}`
      );
    }

    this._status = PaymentStatus.cancelled();
    this._updatedAt = new Date();
  }

  /**
   * Refuse le paiement avec une raison
   */
  public refuse(reason: string): void {
    if (!this._status.isPending()) {
      throw new ValidationError(
        'status',
        `Impossible de refuser un paiement avec le statut ${this._status.getValue()}`
      );
    }

    this._status = PaymentStatus.refused();

    // Ajouter la raison du refus à la description
    const refusalNote = `[REFUS] ${reason}`;
    this._description = this._description
      ? `${refusalNote}\n${this._description}`
      : refusalNote;

    this._updatedAt = new Date();
  }

  /**
   * Vérifie si le paiement peut être remboursé
   * Règle: Seuls les paiements COMPLETED peuvent être remboursés
   */
  public isRefundable(): boolean {
    return this._status.canBeRefunded();
  }

  /**
   * Vérifie si le paiement peut être annulé
   * Règle: Seuls les paiements PENDING peuvent être annulés
   */
  public canBeCancelled(): boolean {
    return this._status.canBeCancelled();
  }

  /**
   * Retourne l'âge du paiement en jours
   */
  public getAge(): number {
    const now = new Date();
    const diffInMs = now.getTime() - this._paymentDate.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifie si le paiement est confirmé
   */
  public isConfirmed(): boolean {
    return this._status.isCompleted() && this._confirmedAt !== undefined;
  }

  /**
   * Vérifie si le paiement est en attente
   */
  public isPending(): boolean {
    return this._status.isPending();
  }

  /**
   * Vérifie si le paiement est dans un état final
   */
  public isFinal(): boolean {
    return this._status.isFinal();
  }

  /**
   * Vérifie si le paiement est associé à une commande
   */
  public hasOrder(): boolean {
    return this._orderId !== undefined;
  }

  /**
   * Vérifie si le paiement est associé à une souscription
   */
  public hasSubscription(): boolean {
    return this._subscriptionId !== undefined;
  }

  /**
   * Vérifie si le paiement couvre une période
   */
  public hasPeriod(): boolean {
    return this._periodStart !== undefined && this._periodEnd !== undefined;
  }

  /**
   * Met à jour la description du paiement
   */
  public updateDescription(description: string): void {
    if (this._status.isFinal()) {
      throw new ValidationError(
        'status',
        'Impossible de modifier un paiement dans un état final'
      );
    }

    this._description = description;
    this._updatedAt = new Date();
  }

  /**
   * Ajoute une note à la description
   */
  public addNote(note: string): void {
    const timestamp = new Date().toISOString();
    const noteWithTimestamp = `[${timestamp}] ${note}`;

    this._description = this._description
      ? `${noteWithTimestamp}\n${this._description}`
      : noteWithTimestamp;

    this._updatedAt = new Date();
  }

  // ============== GETTERS ==============

  get id(): number | undefined {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get orderId(): number | undefined {
    return this._orderId;
  }

  get amount(): Money {
    return this._amount;
  }

  get method(): PaymentMethod {
    return this._method;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get transactionRef(): string | undefined {
    return this._transactionRef;
  }

  get paymentDate(): Date {
    return this._paymentDate;
  }

  get confirmedAt(): Date | undefined {
    return this._confirmedAt;
  }

  get description(): string | undefined {
    return this._description;
  }

  get subscriptionId(): number | undefined {
    return this._subscriptionId;
  }

  get periodStart(): Date | undefined {
    return this._periodStart;
  }

  get periodEnd(): Date | undefined {
    return this._periodEnd;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Convertit l'entité en objet simple (pour la persistence)
   */
  public toObject(): Record<string, any> {
    return {
      id: this._id,
      user_id: this._userId,
      order_id: this._orderId,
      amount: this._amount.getAmount(),
      currency: this._amount.getCurrency(),
      method: this._method.getValue(),
      method_metadata: this._method.getMetadata(),
      status: this._status.getValue(),
      transaction_ref: this._transactionRef,
      payment_date: this._paymentDate,
      confirmed_at: this._confirmedAt,
      description: this._description,
      subscription_id: this._subscriptionId,
      period_start: this._periodStart,
      period_end: this._periodEnd,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  /**
   * Convertit l'entité en objet public (pour les APIs)
   */
  public toPublicObject(): Record<string, any> {
    return {
      id: this._id,
      user_id: this._userId,
      order_id: this._orderId,
      amount: this._amount.getAmount(),
      currency: this._amount.getCurrency(),
      amount_formatted: this._amount.format(),
      method: this._method.getDisplayName(),
      method_type: this._method.getValue(),
      status: this._status.getValue(),
      transaction_ref: this._transactionRef,
      payment_date: this._paymentDate,
      confirmed_at: this._confirmedAt,
      description: this._description,
      subscription_id: this._subscriptionId,
      period_start: this._periodStart,
      period_end: this._periodEnd,
      age_days: this.getAge(),
      is_refundable: this.isRefundable(),
      can_be_cancelled: this.canBeCancelled(),
      is_confirmed: this.isConfirmed(),
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }
}
