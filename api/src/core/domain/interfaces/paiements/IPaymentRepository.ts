/**
 * Interface: IPaymentRepository
 * Contrat pour les opérations de persistance des paiements
 */

import { Money } from "../../value-objects/paiements/Money.js";
import { PaymentMethod } from "../../value-objects/paiements/PaymentMethod.js";
import { PaymentStatus } from "../../value-objects/paiements/PaymentStatus.js";
import { Payment } from "../../entities/paiements/Payment.js";

export interface CreatePaymentData {
  userId: number;
  orderId?: number;
  amount: Money;
  method: PaymentMethod;
  transactionReference?: string;
  description?: string;
  subscriptionId?: number;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  transactionReference?: string;
  confirmedAt?: Date;
  description?: string;
}

export interface PaymentFilters {
  userId?: number;
  orderId?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  subscriptionId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: Money;
  amountMax?: Money;
  limit?: number;
  offset?: number;
}

export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: Money;
  validatedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  cancelledPayments: number;
  averageAmount: Money;
}

/**
 * Repository pour la gestion des paiements
 */
export interface IPaymentRepository {
  /**
   * Crée un nouveau paiement
   * @param data Données du paiement
   * @returns Le paiement créé
   */
  create(data: CreatePaymentData): Promise<Payment>;

  /**
   * Trouve un paiement par son ID
   * @param id ID du paiement
   * @returns Le paiement ou null si non trouvé
   */
  findById(id: number): Promise<Payment | null>;

  /**
   * Trouve un paiement par référence de transaction
   * @param reference Référence de la transaction externe
   * @returns Le paiement ou null si non trouvé
   */
  findByTransactionReference(reference: string): Promise<Payment | null>;

  /**
   * Trouve tous les paiements avec filtres
   * @param filters Filtres de recherche
   * @returns Liste des paiements et total
   */
  findAll(filters?: PaymentFilters): Promise<{
    payments: Payment[];
    total: number;
  }>;

  /**
   * Trouve tous les paiements d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param filters Filtres optionnels
   * @returns Liste des paiements
   */
  findByUserId(
    userId: number,
    filters?: Omit<PaymentFilters, "userId">,
  ): Promise<Payment[]>;

  /**
   * Trouve tous les paiements d'une commande
   * @param orderId ID de la commande
   * @returns Liste des paiements
   */
  findByOrderId(orderId: number): Promise<Payment[]>;

  /**
   * Trouve tous les paiements d'un abonnement
   * @param subscriptionId ID de l'abonnement
   * @returns Liste des paiements
   */
  findBySubscriptionId(subscriptionId: number): Promise<Payment[]>;

  /**
   * Trouve le dernier paiement d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Le dernier paiement ou null
   */
  findLastByUserId(userId: number): Promise<Payment | null>;

  /**
   * Met à jour un paiement
   * @param id ID du paiement
   * @param data Données à mettre à jour
   * @returns Le paiement mis à jour
   */
  update(id: number, data: UpdatePaymentData): Promise<Payment>;

  /**
   * Valide un paiement
   * @param id ID du paiement
   * @param transactionReference Référence de la transaction
   * @returns Le paiement validé
   */
  validate(id: number, transactionReference?: string): Promise<Payment>;

  /**
   * Refuse un paiement
   * @param id ID du paiement
   * @param reason Raison du refus
   * @returns Le paiement refusé
   */
  refuse(id: number, reason?: string): Promise<Payment>;

  /**
   * Annule un paiement
   * @param id ID du paiement
   * @param reason Raison de l'annulation
   * @returns Le paiement annulé
   */
  cancel(id: number, reason?: string): Promise<Payment>;

  /**
   * Rembourse un paiement
   * @param id ID du paiement
   * @param reason Raison du remboursement
   * @returns Le paiement remboursé
   */
  refund(id: number, reason?: string): Promise<Payment>;

  /**
   * Supprime un paiement
   * @param id ID du paiement
   * @returns true si supprimé
   */
  delete(id: number): Promise<boolean>;

  /**
   * Vérifie si un paiement existe
   * @param id ID du paiement
   * @returns true si existe
   */
  exists(id: number): Promise<boolean>;

  /**
   * Compte les paiements avec filtres
   * @param filters Filtres de recherche
   * @returns Nombre de paiements
   */
  count(filters?: PaymentFilters): Promise<number>;

  /**
   * Calcule le montant total des paiements validés pour un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Montant total
   */
  getTotalAmountByUserId(userId: number): Promise<Money>;

  /**
   * Calcule le montant total des paiements pour une période
   * @param dateFrom Date de début
   * @param dateTo Date de fin
   * @param status Statut optionnel
   * @returns Montant total
   */
  getTotalAmountByPeriod(
    dateFrom: Date,
    dateTo: Date,
    status?: PaymentStatus,
  ): Promise<Money>;

  /**
   * Obtient les statistiques générales
   * @param dateFrom Date de début (optionnelle)
   * @param dateTo Date de fin (optionnelle)
   * @returns Statistiques
   */
  getStatistics(dateFrom?: Date, dateTo?: Date): Promise<PaymentStatistics>;

  /**
   * Obtient les statistiques par utilisateur
   * @param userId ID de l'utilisateur
   * @returns Statistiques utilisateur
   */
  getUserStatistics(userId: number): Promise<{
    totalPayments: number;
    totalAmount: Money;
    lastPaymentDate: Date | null;
    averageAmount: Money;
  }>;

  /**
   * Obtient les paiements en attente depuis plus de X jours
   * @param days Nombre de jours
   * @returns Liste des paiements
   */
  findPendingOlderThan(days: number): Promise<Payment[]>;

  /**
   * Vérifie si un utilisateur a des paiements en attente
   * @param userId ID de l'utilisateur
   * @returns true si paiements en attente
   */
  hasPendingPayments(userId: number): Promise<boolean>;

  /**
   * Enregistre une transaction de paiement
   * @param paymentId ID du paiement
   * @param type Type de transaction
   * @param performedBy ID de l'utilisateur qui effectue l'action
   * @param reason Raison optionnelle
   * @returns void
   */
  recordTransaction(
    paymentId: number,
    type: "CREATION" | "VALIDATION" | "REFUND" | "CANCELLATION" | "REFUSAL",
    performedBy: number,
    reason?: string,
  ): Promise<void>;

  /**
   * Obtient la répartition des paiements par statut
   * @param filters Filtres optionnels
   * @returns Répartition par statut
   */
  getPaymentsByStatus(filters?: any): Promise<
    Array<{
      status: string;
      count: number;
      totalAmount: number;
    }>
  >;

  /**
   * Obtient la répartition des paiements par méthode de paiement
   * @param filters Filtres optionnels
   * @returns Répartition par méthode
   */
  getPaymentsByMethod(filters?: any): Promise<
    Array<{
      method: string;
      count: number;
      totalAmount: number;
    }>
  >;
}
