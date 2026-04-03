/**
 * Use Case: RefundPayment
 * Rembourse un paiement validé
 */

import { IPaymentRepository } from "../../domain/interfaces/paiements/IPaymentRepository.js";
import { IPaymentGatewayService } from "../../domain/interfaces/paiements/IPaymentGatewayService.js";
import { Payment } from "../../domain/entities/paiements/Payment.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";
import { TransactionReference } from "../../domain/value-objects/paiements/TransactionReference.js";
import { Money } from "../../domain/value-objects/paiements/Money.js";

export interface RefundPaymentInput {
  paymentId: number;
  refundedBy: number;
  reason?: string;
  amount?: number; // Pour remboursements partiels (optionnel)
  metadata?: Record<string, any>;
}

export interface RefundPaymentOutput {
  success: boolean;
  message: string;
  payment?: {
    id: number;
    userId: number;
    amount: number;
    currency: string;
    method: string;
    status: string;
    refundedAmount: number;
    refundedAt: Date;
    refundReason?: string;
  };
  refundReference?: string;
}

export class RefundPaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway?: IPaymentGatewayService,
  ) {}

  async execute(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Récupérer le paiement
      const payment = await this.paymentRepository.findById(input.paymentId);

      if (!payment) {
        throw PaymentError.paymentNotFound(input.paymentId);
      }

      // 3. Vérifier que le paiement peut être remboursé
      this.validateBusinessRules(payment, input);

      // 4. Déterminer le montant à rembourser
      const refundAmount = input.amount
        ? Money.create(input.amount, payment.amount.getCurrency())
        : payment.amount;

      // 5. Vérifier que le montant de remboursement est valide
      this.validateRefundAmount(payment, refundAmount);

      // 6. Si le paiement a une référence externe, effectuer le remboursement via le gateway
      let refundReference: string | undefined;
      const transactionRef = payment.transactionRef;

      if (transactionRef && this.paymentGateway) {
        const transactionReference = TransactionReference.create(
          transactionRef,
          "STRIPE" as any,
        );
        const gatewayRefundResult = await this.processGatewayRefund(
          transactionReference,
          refundAmount,
          input.reason,
          input.metadata,
        );

        refundReference = gatewayRefundResult.refundId;
      }

      // 7. Rembourser le paiement dans la base de données
      const refundedPayment = await this.paymentRepository.refund(
        input.paymentId,
        input.reason,
      );

      // 8. Enregistrer la transaction d'audit
      await this.paymentRepository.recordTransaction(
        input.paymentId,
        "REFUND",
        input.refundedBy,
        input.reason || "Remboursement du paiement",
      );

      console.log(
        `[RefundPaymentUseCase] Paiement remboursé avec succès: ${input.paymentId} (Montant: ${refundAmount.format()})`,
      );

      // 9. Retourner le résultat
      return {
        success: true,
        message: "Paiement remboursé avec succès",
        payment: {
          id: refundedPayment.id!,
          userId: refundedPayment.userId,
          amount: refundedPayment.amount.getAmount(),
          currency: refundedPayment.amount.getCurrency(),
          method: refundedPayment.method.getValue(),
          status: refundedPayment.status.toString(),
          refundedAmount: refundAmount.getAmount(),
          refundedAt: new Date(),
          refundReason: input.reason,
        },
        refundReference,
      };
    } catch (error) {
      console.error("[RefundPaymentUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors du remboursement du paiement: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: RefundPaymentInput): void {
    if (!input.paymentId || input.paymentId <= 0) {
      throw PaymentError.missingField("paymentId");
    }

    if (!input.refundedBy || input.refundedBy <= 0) {
      throw PaymentError.missingField("refundedBy");
    }

    if (input.amount !== undefined && input.amount <= 0) {
      throw PaymentError.invalidAmount(
        "Le montant du remboursement doit être positif",
      );
    }
  }

  /**
   * Valide les règles métier pour le remboursement
   */
  private validateBusinessRules(
    payment: Payment,
    input: RefundPaymentInput,
  ): void {
    // Vérifier que le paiement est validé (confirmé)
    if (!payment.isConfirmed()) {
      throw PaymentError.refundNotAllowed(
        "Seuls les paiements validés peuvent être remboursés",
      );
    }

    // Vérifier que le paiement n'est pas déjà remboursé
    if (payment.status.isRefunded()) {
      throw PaymentError.paymentAlreadyRefunded(payment.id!);
    }

    // Vérifier que le paiement n'est pas annulé
    if (payment.status.isCancelled()) {
      throw PaymentError.refundNotAllowed(
        "Un paiement annulé ne peut pas être remboursé",
      );
    }

    // Vérifier le délai de remboursement (règle métier: 90 jours)
    const maxRefundDays = this.paymentGateway?.getMaxRefundDays() || 90;
    const paymentAgeInDays = payment.getAge();

    if (paymentAgeInDays > maxRefundDays) {
      throw PaymentError.refundTooLate(maxRefundDays);
    }

    // Vérifier si les remboursements partiels sont supportés
    if (input.amount && this.paymentGateway) {
      const supportsPartialRefunds =
        this.paymentGateway.supportsPartialRefunds();
      if (!supportsPartialRefunds) {
        throw PaymentError.partialRefundNotSupported();
      }
    }

    // Vérifier que le paiement peut être remboursé
    if (!payment.isRefundable()) {
      throw PaymentError.refundNotAllowed(
        "Ce paiement ne peut pas être remboursé",
      );
    }
  }

  /**
   * Valide le montant du remboursement
   */
  private validateRefundAmount(payment: Payment, refundAmount: Money): void {
    const paymentAmount = payment.amount;

    // Vérifier que le montant de remboursement ne dépasse pas le montant du paiement
    if (refundAmount.isGreaterThan(paymentAmount)) {
      throw PaymentError.invalidAmount(
        `Le montant du remboursement (${refundAmount.format()}) ne peut pas dépasser le montant du paiement (${paymentAmount.format()})`,
      );
    }

    // Vérifier que le montant est positif
    if (!refundAmount.isPositive()) {
      throw PaymentError.invalidAmount(
        "Le montant du remboursement doit être positif",
      );
    }

    // Vérifier que les devises correspondent
    if (refundAmount.getCurrency() !== paymentAmount.getCurrency()) {
      throw PaymentError.currencyMismatch(
        `Devise du remboursement (${refundAmount.getCurrency()}) différente de celle du paiement (${paymentAmount.getCurrency()})`,
      );
    }
  }

  /**
   * Effectue le remboursement via la passerelle de paiement
   */
  private async processGatewayRefund(
    transactionRef: TransactionReference,
    amount: Money,
    reason?: string,
    metadata?: Record<string, any>,
  ): Promise<{ success: boolean; refundId: string }> {
    if (!this.paymentGateway) {
      throw PaymentError.internalError("Passerelle de paiement non disponible");
    }

    try {
      // Vérifier la disponibilité du gateway
      const isAvailable = await this.paymentGateway.isAvailable();
      if (!isAvailable) {
        throw PaymentError.paymentMethodUnavailable(
          this.paymentGateway.getProvider(),
        );
      }

      // Effectuer le remboursement
      const refundResult = await this.paymentGateway.refundPayment({
        transactionReference: transactionRef,
        amount,
        reason,
        metadata,
      });

      // Vérifier que le remboursement a réussi
      if (!refundResult.success) {
        throw PaymentError.transactionFailed(
          `Le remboursement a échoué (statut: ${refundResult.status})`,
        );
      }

      console.log(
        `[RefundPaymentUseCase] Remboursement effectué via ${this.paymentGateway.getProvider()}: ${refundResult.refundId}`,
      );

      return {
        success: true,
        refundId: refundResult.refundId,
      };
    } catch (error) {
      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      console.error(
        "[RefundPaymentUseCase] Erreur lors du remboursement via le gateway:",
        error,
      );

      throw PaymentError.externalProviderError(
        this.paymentGateway.getProvider(),
        (error as Error).message,
      );
    }
  }
}
