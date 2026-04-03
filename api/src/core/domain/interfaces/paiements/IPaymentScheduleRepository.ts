/**
 * Interface: IPaymentScheduleRepository
 * Contrat pour les opérations de persistance des échéances de paiement
 */

import { Money } from '../../value-objects/paiements/Money.js';
import { PaymentSchedule, PaymentScheduleStatus } from '../../entities/paiements/PaymentSchedule.js';

export interface CreatePaymentScheduleData {
  userId: number;
  subscriptionId: number;
  dueDate: Date;
  amount: Money;
}

export interface UpdatePaymentScheduleData {
  status?: PaymentScheduleStatus;
  paidAt?: Date;
  paymentId?: number;
}

export interface PaymentScheduleFilters {
  userId?: number;
  subscriptionId?: number;
  status?: PaymentScheduleStatus;
  dateFrom?: Date;
  dateTo?: Date;
  isPaid?: boolean;
  isOverdue?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Repository pour la gestion des échéances de paiement
 */
export interface IPaymentScheduleRepository {
  /**
   * Crée une nouvelle échéance de paiement
   * @param data Données de l'échéance
   * @returns L'échéance créée
   */
  create(data: CreatePaymentScheduleData): Promise<PaymentSchedule>;

  /**
   * Crée plusieurs échéances en batch
   * @param schedules Données des échéances
   * @returns Les échéances créées
   */
  createMany(schedules: CreatePaymentScheduleData[]): Promise<PaymentSchedule[]>;

  /**
   * Trouve une échéance par son ID
   * @param id ID de l'échéance
   * @returns L'échéance ou null si non trouvée
   */
  findById(id: number): Promise<PaymentSchedule | null>;

  /**
   * Trouve toutes les échéances avec filtres
   * @param filters Filtres de recherche
   * @returns Liste des échéances et total
   */
  findAll(filters?: PaymentScheduleFilters): Promise<{
    schedules: PaymentSchedule[];
    total: number;
  }>;

  /**
   * Trouve toutes les échéances d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param filters Filtres optionnels
   * @returns Liste des échéances
   */
  findByUserId(
    userId: number,
    filters?: Omit<PaymentScheduleFilters, 'userId'>
  ): Promise<PaymentSchedule[]>;

  /**
   * Trouve toutes les échéances d'un abonnement
   * @param subscriptionId ID de l'abonnement
   * @returns Liste des échéances
   */
  findBySubscriptionId(subscriptionId: number): Promise<PaymentSchedule[]>;

  /**
   * Trouve les échéances en retard (overdue)
   * @param userId ID utilisateur optionnel pour filtrer
   * @returns Liste des échéances en retard
   */
  findOverdue(userId?: number): Promise<PaymentSchedule[]>;

  /**
   * Trouve les échéances à venir (upcoming)
   * @param days Nombre de jours à venir
   * @param userId ID utilisateur optionnel pour filtrer
   * @returns Liste des échéances à venir
   */
  findUpcoming(days: number, userId?: number): Promise<PaymentSchedule[]>;

  /**
   * Trouve les échéances en attente pour un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Liste des échéances en attente
   */
  findPendingByUserId(userId: number): Promise<PaymentSchedule[]>;

  /**
   * Trouve les échéances payées pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param limit Limite optionnelle
   * @returns Liste des échéances payées
   */
  findPaidByUserId(userId: number, limit?: number): Promise<PaymentSchedule[]>;

  /**
   * Trouve les échéances pour un mois donné
   * @param year Année
   * @param month Mois (1-12)
   * @param userId ID utilisateur optionnel
   * @returns Liste des échéances du mois
   */
  findByMonth(year: number, month: number, userId?: number): Promise<PaymentSchedule[]>;

  /**
   * Trouve la prochaine échéance d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns La prochaine échéance ou null
   */
  findNextByUserId(userId: number): Promise<PaymentSchedule | null>;

  /**
   * Met à jour une échéance
   * @param id ID de l'échéance
   * @param data Données à mettre à jour
   * @returns L'échéance mise à jour
   */
  update(id: number, data: UpdatePaymentScheduleData): Promise<PaymentSchedule>;

  /**
   * Marque une échéance comme payée
   * @param id ID de l'échéance
   * @param paymentId ID du paiement
   * @returns L'échéance mise à jour
   */
  markAsPaid(id: number, paymentId: number): Promise<PaymentSchedule>;

  /**
   * Annule une échéance
   * @param id ID de l'échéance
   * @returns L'échéance annulée
   */
  cancel(id: number): Promise<PaymentSchedule>;

  /**
   * Met à jour les statuts des échéances (passage en overdue)
   * @returns Nombre d'échéances mises à jour
   */
  updateOverdueStatuses(): Promise<number>;

  /**
   * Supprime une échéance
   * @param id ID de l'échéance
   * @returns true si supprimée
   */
  delete(id: number): Promise<boolean>;

  /**
   * Supprime toutes les échéances d'un abonnement
   * @param subscriptionId ID de l'abonnement
   * @returns Nombre d'échéances supprimées
   */
  deleteBySubscriptionId(subscriptionId: number): Promise<number>;

  /**
   * Vérifie si une échéance existe
   * @param id ID de l'échéance
   * @returns true si existe
   */
  exists(id: number): Promise<boolean>;

  /**
   * Compte les échéances avec filtres
   * @param filters Filtres de recherche
   * @returns Nombre d'échéances
   */
  count(filters?: PaymentScheduleFilters): Promise<number>;

  /**
   * Compte les échéances en retard pour un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Nombre d'échéances en retard
   */
  countOverdueByUserId(userId: number): Promise<number>;

  /**
   * Compte les échéances en attente pour un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Nombre d'échéances en attente
   */
  countPendingByUserId(userId: number): Promise<number>;

  /**
   * Calcule le montant total des échéances en attente
   * @param userId ID utilisateur optionnel
   * @returns Montant total
   */
  getTotalPendingAmount(userId?: number): Promise<Money>;

  /**
   * Calcule le montant total des échéances en retard
   * @param userId ID utilisateur optionnel
   * @returns Montant total
   */
  getTotalOverdueAmount(userId?: number): Promise<Money>;

  /**
   * Obtient les statistiques des échéances
   * @param userId ID utilisateur optionnel
   * @returns Statistiques
   */
  getStatistics(userId?: number): Promise<{
    total: number;
    pending: number;
    paid: number;
    overdue: number;
    cancelled: number;
    totalAmount: Money;
    paidAmount: Money;
    pendingAmount: Money;
    overdueAmount: Money;
  }>;

  /**
   * Vérifie si un utilisateur a des échéances en retard
   * @param userId ID de l'utilisateur
   * @returns true si échéances en retard
   */
  hasOverdueSchedules(userId: number): Promise<boolean>;

  /**
   * Génère les échéances pour un abonnement récurrent
   * @param subscriptionId ID de l'abonnement
   * @param startDate Date de début
   * @param endDate Date de fin
   * @param amount Montant de chaque échéance
   * @param frequency Fréquence (monthly, quarterly, yearly)
   * @returns Les échéances créées
   */
  generateRecurringSchedules(
    subscriptionId: number,
    userId: number,
    startDate: Date,
    endDate: Date,
    amount: Money,
    frequency: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<PaymentSchedule[]>;
}
