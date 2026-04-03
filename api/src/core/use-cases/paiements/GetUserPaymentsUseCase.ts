/**
 * Use Case: GetUserPayments
 * Récupère tous les paiements d'un utilisateur avec filtres et pagination
 */

import {
  IPaymentRepository,
  PaymentFilters,
} from "../../domain/interfaces/paiements/IPaymentRepository.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";
import { PaymentStatus } from "../../domain/value-objects/paiements/PaymentStatus.js";
import { PaymentMethod } from "../../domain/value-objects/paiements/PaymentMethod.js";
import { Money } from "../../domain/value-objects/paiements/Money.js";

export interface GetUserPaymentsInput {
  userId: number;
  requestUserId: number;
  isAdmin?: boolean;
  // Filtres optionnels
  status?: string;
  method?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  orderId?: number;
  subscriptionId?: number;
  // Pagination
  limit?: number;
  offset?: number;
}

export interface GetUserPaymentsOutput {
  success: boolean;
  message: string;
  payments: Array<{
    id: number;
    userId: number;
    orderId?: number;
    subscriptionId?: number;
    amount: number;
    currency: string;
    method: string;
    status: string;
    transactionReference?: string;
    description?: string;
    createdAt: Date;
    confirmedAt?: Date;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary?: {
    totalAmount: number;
    currency: string;
    totalPayments: number;
    validatedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    cancelledPayments: number;
  };
}

export class GetUserPaymentsUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: GetUserPaymentsInput): Promise<GetUserPaymentsOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Vérifier l'autorisation
      this.validateAuthorization(
        input.userId,
        input.requestUserId,
        input.isAdmin,
      );

      // 3. Construire les filtres
      const filters = this.buildFilters(input);

      // 4. Récupérer les paiements
      const { payments, total } = await this.paymentRepository.findAll(filters);

      // 5. Calculer les statistiques si demandé
      let summary;
      if (payments.length > 0) {
        const statsFilters: any = {
          userId: input.userId,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
        };
        const stats = await this.paymentRepository.getStatistics(statsFilters);

        summary = {
          totalAmount: stats.totalAmount.getAmount(),
          currency: stats.totalAmount.getCurrency(),
          totalPayments: stats.totalPayments,
          validatedPayments: stats.validatedPayments,
          pendingPayments: stats.pendingPayments,
          refundedPayments: stats.refundedPayments,
          cancelledPayments: stats.cancelledPayments,
        };
      }

      // 6. Préparer la pagination
      const limit = input.limit || 20;
      const offset = input.offset || 0;
      const hasMore = offset + payments.length < total;

      console.log(
        `[GetUserPaymentsUseCase] ${payments.length} paiements récupérés pour l'utilisateur ${input.userId}`,
      );

      // 7. Retourner le résultat
      return {
        success: true,
        message: `${payments.length} paiement(s) récupéré(s)`,
        payments: payments.map((payment) => ({
          id: payment.id!,
          userId: payment.userId,
          orderId: payment.orderId,
          subscriptionId: payment.subscriptionId,
          amount: payment.amount.getAmount(),
          currency: payment.amount.getCurrency(),
          method: payment.method.getValue(),
          status: payment.status.toString(),
          transactionReference: payment.transactionRef,
          description: payment.description,
          createdAt: payment.createdAt,
          confirmedAt: payment.confirmedAt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore,
        },
        summary,
      };
    } catch (error) {
      console.error("[GetUserPaymentsUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors de la récupération des paiements: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: GetUserPaymentsInput): void {
    if (!input.userId || input.userId <= 0) {
      throw PaymentError.missingField("userId");
    }

    if (!input.requestUserId || input.requestUserId <= 0) {
      throw PaymentError.missingField("requestUserId");
    }

    // Validation des dates
    if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
      throw PaymentError.invalidDateRange(input.dateFrom, input.dateTo);
    }

    // Validation des montants
    if (input.amountMin !== undefined && input.amountMin < 0) {
      throw PaymentError.invalidAmount(
        "Le montant minimum ne peut pas être négatif",
      );
    }

    if (input.amountMax !== undefined && input.amountMax < 0) {
      throw PaymentError.invalidAmount(
        "Le montant maximum ne peut pas être négatif",
      );
    }

    if (
      input.amountMin !== undefined &&
      input.amountMax !== undefined &&
      input.amountMin > input.amountMax
    ) {
      throw PaymentError.invalidAmount(
        "Le montant minimum ne peut pas être supérieur au montant maximum",
      );
    }

    // Validation de la pagination
    if (input.limit !== undefined && input.limit <= 0) {
      throw PaymentError.invalidField(
        "limit",
        "La limite doit être supérieure à 0",
      );
    }

    if (input.offset !== undefined && input.offset < 0) {
      throw PaymentError.invalidField(
        "offset",
        "L'offset ne peut pas être négatif",
      );
    }

    // Limiter le nombre de résultats
    if (input.limit && input.limit > 100) {
      throw PaymentError.invalidField("limit", "La limite maximale est de 100");
    }
  }

  /**
   * Valide l'autorisation
   */
  private validateAuthorization(
    targetUserId: number,
    requestUserId: number,
    isAdmin?: boolean,
  ): void {
    // Seul l'utilisateur ou un admin peut voir ses paiements
    if (targetUserId !== requestUserId && !isAdmin) {
      throw PaymentError.userNotAuthorized(
        requestUserId,
        "consulter ces paiements",
      );
    }
  }

  /**
   * Construit les filtres de recherche
   */
  private buildFilters(input: GetUserPaymentsInput): PaymentFilters {
    const filters: PaymentFilters = {
      userId: input.userId,
      limit: input.limit || 20,
      offset: input.offset || 0,
    };

    // Filtre par statut
    if (input.status) {
      try {
        filters.status = new PaymentStatus(input.status);
      } catch (error) {
        throw PaymentError.invalidStatus(input.status);
      }
    }

    // Filtre par méthode
    if (input.method) {
      try {
        filters.method = PaymentMethod.fromString(input.method);
      } catch (error) {
        throw PaymentError.invalidPaymentMethod(input.method);
      }
    }

    // Filtre par dates
    if (input.dateFrom) {
      filters.dateFrom = input.dateFrom;
    }

    if (input.dateTo) {
      filters.dateTo = input.dateTo;
    }

    // Filtre par montants
    if (input.amountMin !== undefined) {
      filters.amountMin = Money.create(
        input.amountMin,
        input.currency || "EUR",
      );
    }

    if (input.amountMax !== undefined) {
      filters.amountMax = Money.create(
        input.amountMax,
        input.currency || "EUR",
      );
    }

    // Filtre par commande
    if (input.orderId) {
      filters.orderId = input.orderId;
    }

    // Filtre par abonnement
    if (input.subscriptionId) {
      filters.subscriptionId = input.subscriptionId;
    }

    return filters;
  }
}
