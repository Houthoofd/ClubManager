/**
 * Use Case: PaySchedule
 * Effectue le paiement d'une échéance de paiement
 */

import { IPaymentRepository } from "../../domain/interfaces/paiements/IPaymentRepository.js";
import { IPaymentScheduleRepository } from "../../domain/interfaces/paiements/IPaymentScheduleRepository.js";
import { IPaymentGatewayService } from "../../domain/interfaces/paiements/IPaymentGatewayService.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";
import { PaymentMethod } from "../../domain/value-objects/paiements/PaymentMethod.js";
import { TransactionReference } from "../../domain/value-objects/paiements/TransactionReference.js";
import { PaymentScheduleStatus } from "../../domain/entities/paiements/PaymentSchedule.js";

export interface PayScheduleInput {
  scheduleId: number;
  userId: number;
  method: string;
  transactionReference?: string;
  transactionProvider?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PayScheduleOutput {
  success: boolean;
  message: string;
  schedule?: {
    id: number;
    userId: number;
    status: string;
    paidAt: Date;
  };
  payment?: {
    id: number;
    amount: number;
    currency: string;
    method: string;
    status: string;
    transactionReference?: string;
  };
}

export class PayScheduleUseCase {
  constructor(
    private readonly paymentScheduleRepository: IPaymentScheduleRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway?: IPaymentGatewayService,
  ) {}

  async execute(input: PayScheduleInput): Promise<PayScheduleOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Récupérer l'échéance
      const schedule = await this.paymentScheduleRepository.findById(
        input.scheduleId,
      );
      if (!schedule) {
        throw PaymentError.scheduleNotFound(input.scheduleId);
      }

      // 3. Vérifier l'autorisation
      this.validateAuthorization(schedule.getUserId(), input.userId);

      // 4. Vérifier que l'échéance peut être payée
      this.validateSchedulePayment(input.scheduleId, schedule.getStatus());

      // 5. Créer les Value Objects
      const method = PaymentMethod.fromString(input.method);
      const amount = schedule.getAmount();

      // 6. Créer la référence de transaction si fournie
      let transactionRef: TransactionReference | undefined;
      if (input.transactionReference && input.transactionProvider) {
        transactionRef = TransactionReference.create(
          input.transactionReference,
          input.transactionProvider as any,
        );
      }

      // 7. Si paiement en ligne sans référence, créer l'intention de paiement
      if (method.isOnline() && !transactionRef && this.paymentGateway) {
        const paymentIntent = await this.paymentGateway.createPaymentIntent({
          amount,
          description:
            input.description || `Paiement échéance #${input.scheduleId}`,
          metadata: {
            ...input.metadata,
            scheduleId: input.scheduleId,
            type: "schedule_payment",
          },
        });

        transactionRef = paymentIntent.transactionReference;
      }

      // 8. Créer le paiement
      const payment = await this.paymentRepository.create({
        userId: input.userId,
        subscriptionId: schedule.getSubscriptionId(),
        amount,
        method,
        transactionReference: transactionRef?.getValue(),
        description:
          input.description || `Paiement échéance #${input.scheduleId}`,
        periodStart: schedule.getDueDate(),
        periodEnd: schedule.getDueDate(),
      });

      // 9. Mettre à jour l'échéance
      const updatedSchedule = await this.paymentScheduleRepository.update(
        input.scheduleId,
        {
          status: PaymentScheduleStatus.PAID,
          paidAt: new Date(),
          paymentId: payment.id,
        },
      );

      // 10. Enregistrer l'audit du paiement
      await this.paymentRepository.recordTransaction(
        payment.id!,
        "CREATION",
        input.userId,
        `Paiement de l'échéance #${input.scheduleId}`,
      );

      console.log(
        `[PayScheduleUseCase] Échéance #${input.scheduleId} payée avec succès via paiement #${payment.id}`,
      );

      // 11. Retourner le résultat
      return {
        success: true,
        message: "Échéance payée avec succès",
        schedule: {
          id: updatedSchedule.getId()!,
          userId: updatedSchedule.getUserId(),
          status: updatedSchedule.getStatus(),
          paidAt: updatedSchedule.getPaidAt()!,
        },
        payment: {
          id: payment.id!,
          amount: payment.amount.getAmount(),
          currency: payment.amount.getCurrency(),
          method: payment.method.getValue(),
          status: payment.status.toString(),
          transactionReference: payment.transactionRef,
        },
      };
    } catch (error) {
      console.error("[PayScheduleUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors du paiement de l'échéance: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: PayScheduleInput): void {
    if (!input.scheduleId || input.scheduleId <= 0) {
      throw PaymentError.missingField("scheduleId");
    }

    if (!input.userId || input.userId <= 0) {
      throw PaymentError.missingField("userId");
    }

    if (!input.method) {
      throw PaymentError.missingField("method");
    }
  }

  /**
   * Valide l'autorisation
   */
  private validateAuthorization(
    scheduleUserId: number,
    requestUserId: number,
  ): void {
    // Seul le propriétaire peut payer son échéance
    if (scheduleUserId !== requestUserId) {
      throw PaymentError.userNotAuthorized(
        requestUserId,
        "payer cette échéance",
      );
    }
  }

  /**
   * Valide que l'échéance peut être payée
   */
  private validateSchedulePayment(scheduleId: number, status: string): void {
    // Échéances déjà payées
    if (status === PaymentScheduleStatus.PAID) {
      throw PaymentError.scheduleAlreadyPaid(scheduleId);
    }

    // Échéances annulées
    if (status === PaymentScheduleStatus.CANCELLED) {
      throw PaymentError.invalidStatusTransition(
        status,
        PaymentScheduleStatus.PAID,
      );
    }

    // Seules les échéances PENDING et OVERDUE peuvent être payées
    if (
      status !== PaymentScheduleStatus.PENDING &&
      status !== PaymentScheduleStatus.OVERDUE
    ) {
      throw PaymentError.invalidField(
        "status",
        `L'échéance avec le statut ${status} ne peut pas être payée`,
      );
    }
  }
}
