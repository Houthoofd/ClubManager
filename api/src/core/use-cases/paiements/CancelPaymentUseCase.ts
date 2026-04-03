/**
 * Use Case: CancelPayment
 * Annule un paiement existant
 */

import { IPaymentRepository } from "../../domain/interfaces/paiements/IPaymentRepository.js";
import { IPaymentGatewayService } from "../../domain/interfaces/paiements/IPaymentGatewayService.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";
import { PaymentStatus } from "../../domain/value-objects/paiements/PaymentStatus.js";
import { TransactionReference } from "../../domain/value-objects/paiements/TransactionReference.js";

export interface CancelPaymentInput {
  paymentId: number;
  userId: number;
  reason?: string;
  isAdmin?: boolean;
}

export interface CancelPaymentOutput {
  success: boolean;
  message: string;
  payment?: {
    id: number;
    userId: number;
    status: string;
    cancelledAt?: Date;
  };
}

export class CancelPaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway?: IPaymentGatewayService,
  ) {}

  async execute(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Récupérer le paiement
      const payment = await this.paymentRepository.findById(input.paymentId);
      if (!payment) {
        throw PaymentError.paymentNotFound(input.paymentId);
      }

      // 3. Vérifier l'autorisation
      this.validateAuthorization(payment.userId, input.userId, input.isAdmin);

      // 4. Vérifier que le paiement peut être annulé
      await this.validateCancellation(payment.status);

      // 5. Annuler le paiement sur le gateway si nécessaire
      const transactionRef = payment.transactionRef;
      if (transactionRef && this.paymentGateway) {
        const currentStatus = payment.status;

        // Si le paiement est validé, on doit l'annuler sur le gateway
        if (currentStatus.isCompleted()) {
          try {
            await this.paymentGateway.cancelPaymentIntent(
              TransactionReference.create(transactionRef, "STRIPE" as any),
            );
            console.log(
              `[CancelPaymentUseCase] Paiement annulé sur le gateway: ${transactionRef}`,
            );
          } catch (error) {
            console.error(
              `[CancelPaymentUseCase] Erreur lors de l'annulation sur le gateway:`,
              error,
            );
            throw PaymentError.transactionFailed(
              `Impossible d'annuler le paiement sur le gateway: ${(error as Error).message}`,
            );
          }
        }
      }

      // 6. Mettre à jour le statut du paiement
      const cancelledStatus = PaymentStatus.cancelled();
      const updatedPayment = await this.paymentRepository.update(
        input.paymentId,
        {
          status: cancelledStatus,
        },
      );

      // 7. Enregistrer la transaction d'audit
      const auditMessage = input.reason
        ? `Paiement annulé: ${input.reason}`
        : "Paiement annulé";

      await this.paymentRepository.recordTransaction(
        input.paymentId,
        "CANCELLATION",
        input.userId,
        auditMessage,
      );

      console.log(
        `[CancelPaymentUseCase] Paiement annulé avec succès: ${input.paymentId}`,
      );

      // 8. Retourner le résultat
      return {
        success: true,
        message: "Paiement annulé avec succès",
        payment: {
          id: updatedPayment.id!,
          userId: updatedPayment.userId,
          status: updatedPayment.status.toString(),
          cancelledAt: new Date(),
        },
      };
    } catch (error) {
      console.error("[CancelPaymentUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors de l'annulation du paiement: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: CancelPaymentInput): void {
    if (!input.paymentId || input.paymentId <= 0) {
      throw PaymentError.missingField("paymentId");
    }

    if (!input.userId || input.userId <= 0) {
      throw PaymentError.missingField("userId");
    }
  }

  /**
   * Valide l'autorisation
   */
  private validateAuthorization(
    paymentUserId: number,
    requestUserId: number,
    isAdmin?: boolean,
  ): void {
    // Seul le propriétaire ou un admin peut annuler
    if (paymentUserId !== requestUserId && !isAdmin) {
      throw PaymentError.userNotAuthorized(
        requestUserId,
        "annuler ce paiement",
      );
    }
  }

  /**
   * Valide que le paiement peut être annulé
   */
  private async validateCancellation(status: PaymentStatus): Promise<void> {
    // Paiements qui ne peuvent pas être annulés
    if (status.isCancelled()) {
      throw PaymentError.invalidStatusTransition(
        status.toString(),
        "CANCELLED",
      );
    }

    if (status.isRefunded()) {
      throw PaymentError.invalidStatusTransition(
        status.toString(),
        "CANCELLED",
      );
    }

    if (status.isRefused()) {
      throw PaymentError.invalidStatusTransition(
        status.toString(),
        "CANCELLED",
      );
    }

    // Paiements validés : on peut annuler mais c'est sensible
    if (status.isCompleted()) {
      console.warn(
        "[CancelPaymentUseCase] Annulation d'un paiement validé - action sensible",
      );
    }

    // Les paiements PENDING peuvent toujours être annulés
  }
}
