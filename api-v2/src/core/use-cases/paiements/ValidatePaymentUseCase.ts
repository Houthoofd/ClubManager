/**
 * Use Case: ValidatePayment
 * Valide un paiement en attente
 */

import { IPaymentRepository } from "../../domain/interfaces/paiements/IPaymentRepository.js";
import { IPaymentGatewayService } from "../../domain/interfaces/paiements/IPaymentGatewayService.js";
import { Payment } from "../../domain/entities/paiements/Payment.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";
import { TransactionReference } from "../../domain/value-objects/paiements/TransactionReference.js";

export interface ValidatePaymentInput {
  paymentId: number;
  transactionReference?: string;
  validatedBy: number;
  metadata?: Record<string, any>;
}

export interface ValidatePaymentOutput {
  success: boolean;
  message: string;
  payment?: {
    id: number;
    userId: number;
    amount: number;
    currency: string;
    method: string;
    status: string;
    transactionReference?: string;
    validatedAt: Date;
  };
}

export class ValidatePaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway?: IPaymentGatewayService,
  ) {}

  async execute(input: ValidatePaymentInput): Promise<ValidatePaymentOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Récupérer le paiement
      const payment = await this.paymentRepository.findById(input.paymentId);

      if (!payment) {
        throw PaymentError.paymentNotFound(input.paymentId);
      }

      // 3. Vérifier que le paiement peut être validé
      this.validateBusinessRules(payment);

      // 4. Si une référence de transaction est fournie, mettre à jour
      if (input.transactionReference) {
        // Vérifier qu'il n'y a pas de doublon
        const existing =
          await this.paymentRepository.findByTransactionReference(
            input.transactionReference,
          );

        if (existing && existing.id !== payment.id) {
          throw PaymentError.transactionAlreadyExists(
            input.transactionReference,
          );
        }
      }

      // 5. Si le paiement a une référence externe, vérifier le statut avec le gateway
      const transactionRef = payment.transactionRef;
      if (transactionRef && this.paymentGateway) {
        await this.verifyWithGateway(transactionRef);
      }

      // 6. Valider le paiement
      const validatedPayment = await this.paymentRepository.validate(
        input.paymentId,
        input.transactionReference,
      );

      // 7. Enregistrer la transaction d'audit
      await this.paymentRepository.recordTransaction(
        input.paymentId,
        "VALIDATION",
        input.validatedBy,
        "Validation du paiement",
      );

      console.log(
        `[ValidatePaymentUseCase] Paiement validé avec succès: ${input.paymentId}`,
      );

      // 8. Retourner le résultat
      return {
        success: true,
        message: "Paiement validé avec succès",
        payment: {
          id: validatedPayment.id!,
          userId: validatedPayment.userId,
          amount: validatedPayment.amount.getAmount(),
          currency: validatedPayment.amount.getCurrency(),
          method: validatedPayment.method.getValue(),
          status: validatedPayment.status.toString(),
          transactionReference: validatedPayment.transactionRef,
          validatedAt: validatedPayment.confirmedAt || new Date(),
        },
      };
    } catch (error) {
      console.error("[ValidatePaymentUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors de la validation du paiement: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: ValidatePaymentInput): void {
    if (!input.paymentId || input.paymentId <= 0) {
      throw PaymentError.missingField("paymentId");
    }

    if (!input.validatedBy || input.validatedBy <= 0) {
      throw PaymentError.missingField("validatedBy");
    }
  }

  /**
   * Valide les règles métier
   */
  private validateBusinessRules(payment: Payment): void {
    // Vérifier que le paiement est en attente
    if (!payment.isPending()) {
      if (payment.isConfirmed()) {
        throw PaymentError.paymentAlreadyValidated(payment.id!);
      }

      if (payment.status.isCancelled()) {
        throw PaymentError.invalidStatusTransition(
          payment.status.toString(),
          "VALIDATED",
        );
      }

      if (payment.status.isRefunded()) {
        throw PaymentError.invalidStatusTransition(
          payment.status.toString(),
          "VALIDATED",
        );
      }

      throw PaymentError.invalidStatusTransition(
        payment.status.toString(),
        "VALIDATED",
      );
    }

    // Vérifier que le montant est positif
    if (!payment.amount.isPositive()) {
      throw PaymentError.invalidAmount(
        "Le montant du paiement doit être positif",
      );
    }

    // Autres règles métier si nécessaires
  }

  /**
   * Vérifie le statut du paiement avec la passerelle externe
   */
  private async verifyWithGateway(transactionReference: string): Promise<void> {
    if (!this.paymentGateway) {
      return;
    }

    try {
      const isAvailable = await this.paymentGateway.isAvailable();
      if (!isAvailable) {
        console.warn(
          "[ValidatePaymentUseCase] Gateway non disponible, skip vérification externe",
        );
        return;
      }

      // Créer un TransactionReference pour la vérification
      const transactionRef =
        this.createTransactionReference(transactionReference);

      const status = await this.paymentGateway.getPaymentStatus(transactionRef);

      // Vérifier que le paiement est réussi côté gateway
      if (status.status !== "succeeded") {
        throw PaymentError.transactionFailed(
          `Le paiement n'est pas validé côté ${this.paymentGateway.getProvider()} (statut: ${status.status})`,
        );
      }
    } catch (error) {
      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      console.error(
        "[ValidatePaymentUseCase] Erreur lors de la vérification avec le gateway:",
        error,
      );

      throw PaymentError.externalProviderError(
        this.paymentGateway.getProvider(),
        (error as Error).message,
      );
    }
  }

  /**
   * Crée une TransactionReference depuis une string
   */
  private createTransactionReference(reference: string): TransactionReference {
    // Tentative de détection automatique du provider
    try {
      return TransactionReference.create(reference, "STRIPE" as any);
    } catch (error) {
      // Fallback: essayer d'autres providers
      try {
        return TransactionReference.create(reference, "PAYPAL" as any);
      } catch {
        // Si tout échoue, utiliser STRIPE par défaut
        console.warn(
          `[ValidatePaymentUseCase] Impossible de détecter le provider pour ${reference}, utilisation de STRIPE par défaut`,
        );
        return TransactionReference.create(reference, "STRIPE" as any);
      }
    }
  }
}
