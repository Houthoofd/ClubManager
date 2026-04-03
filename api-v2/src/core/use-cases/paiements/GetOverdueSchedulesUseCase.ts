/**
 * Use Case: GetOverdueSchedules
 * Récupère toutes les échéances en retard
 */

import { IPaymentScheduleRepository } from "../../domain/interfaces/paiements/IPaymentScheduleRepository.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";

export interface GetOverdueSchedulesInput {
  userId?: number;
  requestUserId: number;
  isAdmin?: boolean;
  subscriptionId?: number;
  daysSinceOverdue?: number; // Filtrer par nombre de jours de retard
  limit?: number;
  offset?: number;
}

export interface GetOverdueSchedulesOutput {
  success: boolean;
  message: string;
  schedules: Array<{
    id: number;
    userId: number;
    subscriptionId: number;
    dueDate: Date;
    amount: number;
    currency: string;
    status: string;
    daysOverdue: number;
    createdAt: Date;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalOverdueAmount: number;
    currency: string;
    totalOverdueSchedules: number;
    averageDaysOverdue: number;
    oldestOverdueDate: Date | null;
  };
}

export class GetOverdueSchedulesUseCase {
  constructor(
    private readonly paymentScheduleRepository: IPaymentScheduleRepository,
  ) {}

  async execute(
    input: GetOverdueSchedulesInput,
  ): Promise<GetOverdueSchedulesOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Vérifier l'autorisation
      this.validateAuthorization(
        input.userId,
        input.requestUserId,
        input.isAdmin,
      );

      // 3. Préparer les filtres pour les échéances échues
      const filters = {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        isOverdue: true,
        isPaid: false,
        limit: input.limit || 50,
        offset: input.offset || 0,
      };

      // 4. Récupérer les échéances échues
      const result = await this.paymentScheduleRepository.findOverdue(
        input.userId,
      );

      // 5. Filtrer par subscriptionId et nombre de jours de retard si spécifié
      let filteredSchedules = result;

      if (input.subscriptionId !== undefined) {
        filteredSchedules = filteredSchedules.filter((schedule) => {
          return schedule.getSubscriptionId() === input.subscriptionId;
        });
      }

      if (input.daysSinceOverdue !== undefined) {
        filteredSchedules = filteredSchedules.filter((schedule) => {
          const daysOverdue = schedule.getDaysOverdue();
          return daysOverdue >= input.daysSinceOverdue!;
        });
      }

      // 6. Appliquer la pagination
      const total = filteredSchedules.length;
      const offset = input.offset || 0;
      const limit = input.limit || 50;
      const paginatedSchedules = filteredSchedules.slice(
        offset,
        offset + limit,
      );

      console.log(
        `[GetOverdueSchedulesUseCase] ${total} échéances en retard trouvées${
          input.userId ? ` pour l'utilisateur ${input.userId}` : ""
        }`,
      );

      // 7. Calculer les statistiques
      const summary = this.calculateSummary(filteredSchedules);

      // 8. Formater les résultats
      const schedules = paginatedSchedules.map((schedule) => ({
        id: schedule.getId()!,
        userId: schedule.getUserId(),
        subscriptionId: schedule.getSubscriptionId(),
        dueDate: schedule.getDueDate(),
        amount: schedule.getAmount().getAmount(),
        currency: schedule.getAmount().getCurrency(),
        status: schedule.getStatus(),
        daysOverdue: schedule.getDaysOverdue(),
        createdAt: schedule.getCreatedAt(),
      }));

      // 9. Retourner le résultat
      return {
        success: true,
        message: `${total} échéance(s) en retard trouvée(s)`,
        schedules,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        summary,
      };
    } catch (error) {
      console.error("[GetOverdueSchedulesUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors de la récupération des échéances en retard: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: GetOverdueSchedulesInput): void {
    if (!input.requestUserId || input.requestUserId <= 0) {
      throw PaymentError.missingField("requestUserId");
    }

    if (input.userId !== undefined && input.userId <= 0) {
      throw PaymentError.invalidField(
        "userId",
        "L'ID utilisateur doit être positif",
      );
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

    // Validation du filtre de jours de retard
    if (input.daysSinceOverdue !== undefined && input.daysSinceOverdue < 0) {
      throw PaymentError.invalidField(
        "daysSinceOverdue",
        "Le nombre de jours doit être positif ou nul",
      );
    }
  }

  /**
   * Valide l'autorisation
   */
  private validateAuthorization(
    userId: number | undefined,
    requestUserId: number,
    isAdmin?: boolean,
  ): void {
    // Si un userId spécifique est demandé
    if (userId !== undefined) {
      // Seul le propriétaire ou un admin peut voir ses échéances
      if (userId !== requestUserId && !isAdmin) {
        throw PaymentError.userNotAuthorized(
          requestUserId,
          "consulter ces échéances en retard",
        );
      }
    } else {
      // Si aucun userId spécifié, seul un admin peut voir toutes les échéances
      if (!isAdmin) {
        throw PaymentError.userNotAuthorized(
          requestUserId,
          "voir toutes les échéances en retard (privilège administrateur requis)",
        );
      }
    }
  }

  /**
   * Calcule les statistiques des échéances en retard
   */
  private calculateSummary(schedules: any[]): {
    totalOverdueAmount: number;
    currency: string;
    totalOverdueSchedules: number;
    averageDaysOverdue: number;
    oldestOverdueDate: Date | null;
  } {
    if (schedules.length === 0) {
      return {
        totalOverdueAmount: 0,
        currency: "EUR",
        totalOverdueSchedules: 0,
        averageDaysOverdue: 0,
        oldestOverdueDate: null,
      };
    }

    // Calculer le montant total en retard
    const totalOverdueAmount = schedules.reduce((sum, schedule) => {
      return sum + schedule.getAmount().getAmount();
    }, 0);

    // Récupérer la devise (on suppose que toutes les échéances ont la même devise)
    const currency = schedules[0].getAmount().getCurrency();

    // Calculer la moyenne des jours de retard
    const totalDaysOverdue = schedules.reduce((sum, schedule) => {
      return sum + schedule.getDaysOverdue();
    }, 0);
    const averageDaysOverdue = Math.round(totalDaysOverdue / schedules.length);

    // Trouver l'échéance la plus ancienne
    const oldestOverdueDate = schedules.reduce(
      (oldest, schedule) => {
        const dueDate = schedule.getDueDate();
        return !oldest || dueDate < oldest ? dueDate : oldest;
      },
      null as Date | null,
    );

    return {
      totalOverdueAmount,
      currency,
      totalOverdueSchedules: schedules.length,
      averageDaysOverdue,
      oldestOverdueDate,
    };
  }
}
