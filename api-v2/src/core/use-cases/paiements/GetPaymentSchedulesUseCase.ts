/**
 * Use Case: GetPaymentSchedules
 * Récupère les échéances de paiement avec filtres
 */

import { IPaymentScheduleRepository } from "../../domain/interfaces/paiements/IPaymentScheduleRepository.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";
import { PaymentScheduleStatus } from "../../domain/entities/paiements/PaymentSchedule.js";

export interface GetPaymentSchedulesInput {
  userId: number;
  requestUserId: number;
  isAdmin?: boolean;
  subscriptionId?: number;
  status?: PaymentScheduleStatus;
  dateFrom?: Date;
  dateTo?: Date;
  isPaid?: boolean;
  isOverdue?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetPaymentSchedulesOutput {
  success: boolean;
  message: string;
  schedules?: Array<{
    id: number;
    userId: number;
    subscriptionId: number;
    dueDate: Date;
    amount: number;
    currency: string;
    status: string;
    isPaid: boolean;
    isOverdue: boolean;
    paidAt?: Date;
    paymentId?: number;
    createdAt: Date;
  }>;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class GetPaymentSchedulesUseCase {
  constructor(
    private readonly paymentScheduleRepository: IPaymentScheduleRepository,
  ) {}

  async execute(
    input: GetPaymentSchedulesInput,
  ): Promise<GetPaymentSchedulesOutput> {
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
      const filters = {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        status: input.status,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        isPaid: input.isPaid,
        isOverdue: input.isOverdue,
        limit: input.limit || 50,
        offset: input.offset || 0,
      };

      // 4. Récupérer les échéances
      const result = await this.paymentScheduleRepository.findAll(filters);

      console.log(
        `[GetPaymentSchedulesUseCase] ${result.total} échéances trouvées pour l'utilisateur ${input.userId}`,
      );

      // 5. Formater les résultats
      const schedules = result.schedules.map((schedule) => ({
        id: schedule.getId()!,
        userId: schedule.getUserId(),
        subscriptionId: schedule.getSubscriptionId(),
        dueDate: schedule.getDueDate(),
        amount: schedule.getAmount().getAmount(),
        currency: schedule.getAmount().getCurrency(),
        status: schedule.getStatus(),
        isPaid: schedule.isPaid(),
        isOverdue: schedule.isOverdue(),
        paidAt: schedule.getPaidAt(),
        paymentId: schedule.getPaymentId(),
        createdAt: schedule.getCreatedAt(),
      }));

      // 6. Retourner le résultat
      return {
        success: true,
        message: `${result.total} échéance(s) trouvée(s)`,
        schedules,
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + filters.limit < result.total,
        },
      };
    } catch (error) {
      console.error("[GetPaymentSchedulesUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors de la récupération des échéances: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: GetPaymentSchedulesInput): void {
    if (!input.userId || input.userId <= 0) {
      throw PaymentError.missingField("userId");
    }

    if (!input.requestUserId || input.requestUserId <= 0) {
      throw PaymentError.missingField("requestUserId");
    }

    // Validation des limites de pagination
    if (input.limit && input.limit <= 0) {
      throw PaymentError.invalidField("limit", "La limite doit être positive");
    }

    if (input.limit && input.limit > 1000) {
      throw PaymentError.invalidField(
        "limit",
        "La limite ne peut pas dépasser 1000",
      );
    }

    if (input.offset && input.offset < 0) {
      throw PaymentError.invalidField(
        "offset",
        "L'offset doit être positif ou nul",
      );
    }

    // Validation des dates
    if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
      throw PaymentError.invalidDateRange(input.dateFrom, input.dateTo);
    }
  }

  /**
   * Valide l'autorisation
   */
  private validateAuthorization(
    userId: number,
    requestUserId: number,
    isAdmin?: boolean,
  ): void {
    // Seul le propriétaire ou un admin peut voir ses échéances
    if (userId !== requestUserId && !isAdmin) {
      throw PaymentError.userNotAuthorized(
        requestUserId,
        "consulter ces échéances",
      );
    }
  }
}
