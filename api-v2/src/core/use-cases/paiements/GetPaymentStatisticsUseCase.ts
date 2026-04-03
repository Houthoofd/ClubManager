/**
 * Use Case: GetPaymentStatistics
 * Récupère les statistiques de paiements pour un utilisateur ou globalement
 */

import { IPaymentRepository } from "../../domain/interfaces/paiements/IPaymentRepository.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";

export interface GetPaymentStatisticsInput {
  userId?: number;
  requestUserId: number;
  isAdmin?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  includeMethodBreakdown?: boolean;
  includeStatusBreakdown?: boolean;
}

export interface GetPaymentStatisticsOutput {
  success: boolean;
  message: string;
  statistics: {
    totalPayments: number;
    totalAmount: number;
    currency: string;
    averageAmount: number;
    validatedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    cancelledPayments: number;
    failedPayments: number;
  };
  breakdown?: {
    byStatus?: Array<{
      status: string;
      count: number;
      totalAmount: number;
      percentage: number;
    }>;
    byMethod?: Array<{
      method: string;
      count: number;
      totalAmount: number;
      percentage: number;
    }>;
  };
  period?: {
    from?: Date;
    to?: Date;
    durationDays?: number;
  };
}

export class GetPaymentStatisticsUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(
    input: GetPaymentStatisticsInput,
  ): Promise<GetPaymentStatisticsOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Vérifier l'autorisation
      this.validateAuthorization(
        input.userId,
        input.requestUserId,
        input.isAdmin,
      );

      // 3. Préparer les filtres
      const filters: any = {
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      };

      // Si userId fourni, filtrer par utilisateur
      if (input.userId) {
        filters.userId = input.userId;
      }

      // 4. Récupérer les statistiques principales
      const stats = await this.paymentRepository.getStatistics(filters);

      console.log(
        `[GetPaymentStatisticsUseCase] Statistiques récupérées: ${stats.totalPayments} paiements`,
      );

      // 5. Calculer les breakdowns si demandé
      let breakdown;
      if (input.includeMethodBreakdown || input.includeStatusBreakdown) {
        breakdown = await this.getBreakdowns(
          filters,
          stats.totalPayments,
          stats.totalAmount.getAmount(),
          input.includeMethodBreakdown,
          input.includeStatusBreakdown,
        );
      }

      // 6. Calculer la période
      let period;
      if (input.dateFrom || input.dateTo) {
        period = {
          from: input.dateFrom,
          to: input.dateTo,
          durationDays: this.calculateDurationDays(
            input.dateFrom,
            input.dateTo,
          ),
        };
      }

      // 7. Retourner le résultat
      return {
        success: true,
        message: "Statistiques récupérées avec succès",
        statistics: {
          totalPayments: stats.totalPayments,
          totalAmount: stats.totalAmount.getAmount(),
          currency: stats.totalAmount.getCurrency(),
          averageAmount: stats.averageAmount.getAmount(),
          validatedPayments: stats.validatedPayments,
          pendingPayments: stats.pendingPayments,
          refundedPayments: stats.refundedPayments,
          cancelledPayments: stats.cancelledPayments,
          failedPayments: 0, // À implémenter dans le repository si nécessaire
        },
        breakdown,
        period,
      };
    } catch (error) {
      console.error("[GetPaymentStatisticsUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors de la récupération des statistiques: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: GetPaymentStatisticsInput): void {
    if (!input.requestUserId || input.requestUserId <= 0) {
      throw PaymentError.missingField("requestUserId");
    }

    // Validation des dates
    if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
      throw PaymentError.invalidDateRange(input.dateFrom, input.dateTo);
    }

    // Validation de l'userId si fourni
    if (input.userId !== undefined && input.userId <= 0) {
      throw PaymentError.invalidField(
        "userId",
        "L'ID utilisateur doit être positif",
      );
    }
  }

  /**
   * Valide l'autorisation
   */
  private validateAuthorization(
    targetUserId: number | undefined,
    requestUserId: number,
    isAdmin?: boolean,
  ): void {
    // Si on demande les stats d'un utilisateur spécifique
    if (targetUserId !== undefined) {
      // Seul l'utilisateur ou un admin peut voir ses stats
      if (targetUserId !== requestUserId && !isAdmin) {
        throw PaymentError.userNotAuthorized(
          requestUserId,
          "consulter ces statistiques",
        );
      }
    } else {
      // Stats globales : seul un admin peut y accéder
      if (!isAdmin) {
        throw PaymentError.userNotAuthorized(
          requestUserId,
          "voir les statistiques globales (privilège administrateur requis)",
        );
      }
    }
  }

  /**
   * Récupère les breakdowns par méthode et statut
   */
  private async getBreakdowns(
    filters: any,
    totalPayments: number,
    totalAmount: number,
    includeMethod?: boolean,
    includeStatus?: boolean,
  ): Promise<{
    byStatus?: Array<{
      status: string;
      count: number;
      totalAmount: number;
      percentage: number;
    }>;
    byMethod?: Array<{
      method: string;
      count: number;
      totalAmount: number;
      percentage: number;
    }>;
  }> {
    const breakdown: any = {};

    // Breakdown par statut
    if (includeStatus) {
      const statusBreakdown =
        await this.paymentRepository.getPaymentsByStatus(filters);

      breakdown.byStatus = statusBreakdown.map((item: any) => ({
        status: item.status,
        count: item.count,
        totalAmount: item.totalAmount,
        percentage: totalPayments > 0 ? (item.count / totalPayments) * 100 : 0,
      }));
    }

    // Breakdown par méthode de paiement
    if (includeMethod) {
      const methodBreakdown =
        await this.paymentRepository.getPaymentsByMethod(filters);

      breakdown.byMethod = methodBreakdown.map((item: any) => ({
        method: item.method,
        count: item.count,
        totalAmount: item.totalAmount,
        percentage: totalPayments > 0 ? (item.count / totalPayments) * 100 : 0,
      }));
    }

    return breakdown;
  }

  /**
   * Calcule la durée en jours entre deux dates
   */
  private calculateDurationDays(from?: Date, to?: Date): number | undefined {
    if (!from || !to) {
      return undefined;
    }

    const diffMs = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
