/**
 * Entity: PaymentSchedule (Échéance de paiement)
 * Représente une échéance de paiement programmée pour un abonnement
 */

import { Money } from '../../value-objects/paiements/Money.js';
import { PaymentError } from '../../errors/paiements/PaymentError.js';

export enum PaymentScheduleStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface PaymentScheduleProps {
  id?: number;
  userId: number;
  subscriptionId: number;
  dueDate: Date;
  amount: Money;
  status: PaymentScheduleStatus;
  paidAt?: Date;
  paymentId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentSchedule {
  private readonly id?: number;
  private readonly userId: number;
  private readonly subscriptionId: number;
  private readonly dueDate: Date;
  private readonly amount: Money;
  private status: PaymentScheduleStatus;
  private paidAt?: Date;
  private paymentId?: number;
  private readonly createdAt: Date;
  private updatedAt?: Date;

  private constructor(props: PaymentScheduleProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.subscriptionId = props.subscriptionId;
    this.dueDate = props.dueDate;
    this.amount = props.amount;
    this.status = props.status;
    this.paidAt = props.paidAt;
    this.paymentId = props.paymentId;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt;
  }

  /**
   * Crée une nouvelle échéance de paiement
   */
  static create(props: Omit<PaymentScheduleProps, 'id' | 'createdAt' | 'status'>): PaymentSchedule {
    // Validation
    PaymentSchedule.validate(props);

    // Déterminer le statut initial
    const now = new Date();
    let status: PaymentScheduleStatus;

    if (props.paidAt) {
      status = PaymentScheduleStatus.PAID;
    } else if (props.dueDate < now) {
      status = PaymentScheduleStatus.OVERDUE;
    } else {
      status = PaymentScheduleStatus.PENDING;
    }

    return new PaymentSchedule({
      ...props,
      status,
      createdAt: new Date(),
    });
  }

  /**
   * Recrée une échéance depuis la base de données
   */
  static fromPersistence(data: PaymentScheduleProps): PaymentSchedule {
    if (!data.id) {
      throw PaymentError.invalidField('id', 'ID requis pour reconstituer une échéance');
    }

    return new PaymentSchedule(data);
  }

  /**
   * Valide les propriétés de l'échéance
   */
  private static validate(props: Partial<PaymentScheduleProps>): void {
    if (!props.userId || props.userId <= 0) {
      throw PaymentError.invalidField('userId', 'ID utilisateur invalide');
    }

    if (!props.subscriptionId || props.subscriptionId <= 0) {
      throw PaymentError.invalidField('subscriptionId', 'ID abonnement invalide');
    }

    if (!props.dueDate || !(props.dueDate instanceof Date)) {
      throw PaymentError.invalidField('dueDate', 'Date d\'échéance invalide');
    }

    if (isNaN(props.dueDate.getTime())) {
      throw PaymentError.invalidField('dueDate', 'Date d\'échéance invalide');
    }

    if (!props.amount || !props.amount.isPositive()) {
      throw PaymentError.invalidAmount('Le montant doit être positif');
    }
  }

  // ============== BUSINESS LOGIC METHODS ==============

  /**
   * Vérifie si l'échéance est en retard
   */
  isOverdue(): boolean {
    if (this.status === PaymentScheduleStatus.PAID) {
      return false;
    }

    return this.dueDate < new Date();
  }

  /**
   * Vérifie si l'échéance est en attente
   */
  isPending(): boolean {
    return this.status === PaymentScheduleStatus.PENDING;
  }

  /**
   * Vérifie si l'échéance est payée
   */
  isPaid(): boolean {
    return this.status === PaymentScheduleStatus.PAID;
  }

  /**
   * Vérifie si l'échéance est annulée
   */
  isCancelled(): boolean {
    return this.status === PaymentScheduleStatus.CANCELLED;
  }

  /**
   * Marque l'échéance comme payée
   */
  markAsPaid(paymentId: number): void {
    if (this.isPaid()) {
      throw PaymentError.scheduleAlreadyPaid(this.id || 0);
    }

    if (this.isCancelled()) {
      throw PaymentError.invalidStatusTransition(
        this.status,
        PaymentScheduleStatus.PAID
      );
    }

    if (!paymentId || paymentId <= 0) {
      throw PaymentError.invalidField('paymentId', 'ID paiement invalide');
    }

    this.status = PaymentScheduleStatus.PAID;
    this.paidAt = new Date();
    this.paymentId = paymentId;
    this.updatedAt = new Date();
  }

  /**
   * Annule l'échéance
   */
  cancel(): void {
    if (this.isPaid()) {
      throw PaymentError.invalidStatusTransition(
        this.status,
        PaymentScheduleStatus.CANCELLED
      );
    }

    if (this.isCancelled()) {
      return; // Déjà annulée
    }

    this.status = PaymentScheduleStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * Met à jour le statut selon la date actuelle
   */
  updateStatus(): void {
    if (this.isPaid() || this.isCancelled()) {
      return; // Statuts finaux
    }

    const now = new Date();

    if (this.dueDate < now) {
      this.status = PaymentScheduleStatus.OVERDUE;
      this.updatedAt = new Date();
    } else {
      this.status = PaymentScheduleStatus.PENDING;
    }
  }

  /**
   * Retourne le nombre de jours jusqu'à l'échéance
   * Négatif si dépassé
   */
  getDaysUntilDue(): number {
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Retourne le nombre de jours de retard
   * 0 si pas en retard
   */
  getDaysOverdue(): number {
    if (!this.isOverdue()) {
      return 0;
    }

    const now = new Date();
    const diffTime = now.getTime() - this.dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Vérifie si l'échéance peut être payée
   */
  canBePaid(): boolean {
    return !this.isPaid() && !this.isCancelled();
  }

  /**
   * Vérifie si l'échéance est due bientôt (dans les X jours)
   */
  isDueSoon(days: number = 7): boolean {
    if (this.isPaid() || this.isCancelled()) {
      return false;
    }

    const daysUntilDue = this.getDaysUntilDue();
    return daysUntilDue > 0 && daysUntilDue <= days;
  }

  /**
   * Retourne le mois de l'échéance
   */
  getMonth(): number {
    return this.dueDate.getMonth() + 1; // 1-12
  }

  /**
   * Retourne l'année de l'échéance
   */
  getYear(): number {
    return this.dueDate.getFullYear();
  }

  /**
   * Retourne une description lisible du statut
   */
  getStatusLabel(): string {
    switch (this.status) {
      case PaymentScheduleStatus.PENDING:
        return 'En attente';
      case PaymentScheduleStatus.PAID:
        return 'Payé';
      case PaymentScheduleStatus.OVERDUE:
        return 'En retard';
      case PaymentScheduleStatus.CANCELLED:
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  }

  // ============== GETTERS ==============

  getId(): number | undefined {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  getSubscriptionId(): number {
    return this.subscriptionId;
  }

  getDueDate(): Date {
    return new Date(this.dueDate); // Retourner une copie
  }

  getAmount(): Money {
    return this.amount;
  }

  getStatus(): PaymentScheduleStatus {
    return this.status;
  }

  getPaidAt(): Date | undefined {
    return this.paidAt ? new Date(this.paidAt) : undefined;
  }

  getPaymentId(): number | undefined {
    return this.paymentId;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date | undefined {
    return this.updatedAt ? new Date(this.updatedAt) : undefined;
  }

  // ============== SERIALIZATION ==============

  /**
   * Convertit l'échéance en objet simple
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      subscriptionId: this.subscriptionId,
      dueDate: this.dueDate.toISOString(),
      amount: this.amount.getAmount(),
      currency: this.amount.getCurrency(),
      status: this.status,
      paidAt: this.paidAt?.toISOString(),
      paymentId: this.paymentId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
    };
  }

  /**
   * Convertit en objet pour l'affichage public
   */
  toPublicObject(): Record<string, any> {
    return {
      id: this.id,
      dueDate: this.dueDate.toISOString(),
      amount: this.amount.format(),
      status: this.status,
      statusLabel: this.getStatusLabel(),
      isPaid: this.isPaid(),
      isOverdue: this.isOverdue(),
      daysUntilDue: this.getDaysUntilDue(),
      daysOverdue: this.getDaysOverdue(),
      paidAt: this.paidAt?.toISOString(),
    };
  }

  /**
   * Clone l'échéance
   */
  clone(): PaymentSchedule {
    return new PaymentSchedule({
      id: this.id,
      userId: this.userId,
      subscriptionId: this.subscriptionId,
      dueDate: new Date(this.dueDate),
      amount: this.amount.clone(),
      status: this.status,
      paidAt: this.paidAt ? new Date(this.paidAt) : undefined,
      paymentId: this.paymentId,
      createdAt: new Date(this.createdAt),
      updatedAt: this.updatedAt ? new Date(this.updatedAt) : undefined,
    });
  }
}
