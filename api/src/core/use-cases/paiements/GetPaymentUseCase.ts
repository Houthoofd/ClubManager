/**
 * Use Case: GetPayment
 * Récupère les détails d'un paiement par son ID
 */

import { IPaymentRepository } from "../../domain/interfaces/paiements/IPaymentRepository.js";
import { Payment } from "../../domain/entities/paiements/Payment.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";

export interface GetPaymentInput {
  paymentId: number;
  requestedBy?: number; // Pour vérification d'autorisation
}

export interface GetPaymentOutput {
  success: boolean;
  message: string;
  payment?: {
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
    validatedAt?: Date;
    periodStart?: Date;
    periodEnd?: Date;
    user?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export class GetPaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(input: GetPaymentInput): Promise<GetPaymentOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Récupérer le paiement
      const payment = await this.paymentRepository.findById(input.paymentId);

      if (!payment) {
        throw PaymentError.paymentNotFound(input.paymentId);
      }

      // 3. Vérification d'autorisation si requestedBy fourni
      if (input.requestedBy) {
        this.validateAuthorization(payment, input.requestedBy);
      }

      console.log(
        `[GetPaymentUseCase] Paiement récupéré avec succès: ${input.paymentId}`,
      );

      // 4. Retourner le résultat
      return {
        success: true,
        message: "Paiement récupéré avec succès",
        payment: {
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
          validatedAt: payment.confirmedAt,
        },
      };
    } catch (error) {
      console.error("[GetPaymentUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors de la récupération du paiement: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: GetPaymentInput): void {
    if (!input.paymentId || input.paymentId <= 0) {
      throw PaymentError.missingField("paymentId");
    }
  }

  /**
   * Valide l'autorisation d'accès au paiement
   * Note: Cette logique peut être étendue avec un système de rôles/permissions
   */
  private validateAuthorization(payment: Payment, requestedBy: number): void {
    // Règle métier: Un utilisateur ne peut voir que ses propres paiements
    // Sauf si c'est un admin (à implémenter avec un système de rôles)

    // Pour l'instant, vérification simple
    if (payment.userId !== requestedBy) {
      // Note: Dans une implémentation complète, on vérifierait si requestedBy est admin
      // Pour l'instant, on lance une erreur
      throw PaymentError.userNotAuthorized(
        requestedBy,
        "consulter ce paiement",
      );
    }
  }
}
