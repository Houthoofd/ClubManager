/**
 * Use Case: CreatePayment
 * Crée un nouveau paiement
 */

import { IPaymentRepository } from "../../domain/interfaces/paiements/IPaymentRepository.js";
import { IPaymentGatewayService } from "../../domain/interfaces/paiements/IPaymentGatewayService.js";
import { Money } from "../../domain/value-objects/paiements/Money.js";
import { PaymentMethod } from "../../domain/value-objects/paiements/PaymentMethod.js";
import { TransactionReference } from "../../domain/value-objects/paiements/TransactionReference.js";
import { Payment } from "../../domain/entities/paiements/Payment.js";
import { PaymentError } from "../../domain/errors/paiements/PaymentError.js";

export interface CreatePaymentInput {
  userId: number;
  amount: number;
  currency?: string;
  method: string;
  orderId?: number;
  subscriptionId?: number;
  description?: string;
  transactionReference?: string;
  transactionProvider?: string;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, any>;
}

export interface CreatePaymentOutput {
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
    createdAt: Date;
  };
}

export class CreatePaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway?: IPaymentGatewayService,
  ) {}

  async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    try {
      // 1. Validation des données requises
      this.validateInput(input);

      // 2. Créer les Value Objects
      const amount = Money.create(input.amount, input.currency);
      const method = PaymentMethod.fromString(input.method);

      // 3. Créer la référence de transaction si fournie
      let transactionRef: TransactionReference | undefined;
      if (input.transactionReference && input.transactionProvider) {
        transactionRef = TransactionReference.create(
          input.transactionReference,
          input.transactionProvider as any,
        );
      }

      // 4. Vérifier les contraintes métier
      await this.validateBusinessRules(input, method);

      // 5. Si c'est un paiement en ligne sans référence, créer l'intention de paiement
      if (method.isOnline() && !transactionRef && this.paymentGateway) {
        const paymentIntent = await this.paymentGateway.createPaymentIntent({
          amount,
          description: input.description,
          metadata: input.metadata,
        });

        transactionRef = paymentIntent.transactionReference;
      }

      // 6. Créer le paiement
      const payment = await this.paymentRepository.create({
        userId: input.userId,
        orderId: input.orderId,
        amount,
        method,
        transactionReference: transactionRef?.getValue(),
        description: input.description,
        subscriptionId: input.subscriptionId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      });

      // 7. Enregistrer la transaction d'audit
      await this.paymentRepository.recordTransaction(
        payment.id!,
        "CREATION",
        input.userId,
        "Création du paiement",
      );

      console.log(
        `[CreatePaymentUseCase] Paiement créé avec succès: ${payment.id}`,
      );

      // 8. Retourner le résultat
      return {
        success: true,
        message: "Paiement créé avec succès",
        payment: {
          id: payment.id!,
          userId: payment.userId,
          amount: payment.amount.getAmount(),
          currency: payment.amount.getCurrency(),
          method: payment.method.getValue(),
          status: payment.status.toString(),
          transactionReference: payment.transactionRef,
          createdAt: payment.createdAt,
        },
      };
    } catch (error) {
      console.error("[CreatePaymentUseCase] Erreur:", error);

      if (PaymentError.isPaymentError(error)) {
        throw error;
      }

      throw PaymentError.internalError(
        `Erreur lors de la création du paiement: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Valide les données d'entrée
   */
  private validateInput(input: CreatePaymentInput): void {
    if (!input.userId || input.userId <= 0) {
      throw PaymentError.missingField("userId");
    }

    if (!input.amount || input.amount <= 0) {
      throw PaymentError.invalidAmount("Le montant doit être supérieur à 0");
    }

    if (!input.method) {
      throw PaymentError.missingField("method");
    }

    // Validation des périodes si abonnement
    if (input.subscriptionId) {
      if (!input.periodStart || !input.periodEnd) {
        throw PaymentError.missingField("periodStart ou periodEnd");
      }

      if (input.periodStart >= input.periodEnd) {
        throw PaymentError.invalidDateRange(input.periodStart, input.periodEnd);
      }
    }
  }

  /**
   * Valide les règles métier
   */
  private async validateBusinessRules(
    input: CreatePaymentInput,
    method: PaymentMethod,
  ): Promise<void> {
    // Vérifier que l'utilisateur existe (à implémenter avec UserRepository si disponible)
    // Pour l'instant, on fait confiance à la validation d'entrée

    // Vérifier la méthode de paiement si gateway disponible
    if (method.isOnline() && this.paymentGateway) {
      const isAvailable = await this.paymentGateway.isAvailable();
      if (!isAvailable) {
        throw PaymentError.paymentMethodUnavailable(method.getValue());
      }
    }

    // Vérifier qu'il n'y a pas de doublon avec la même référence de transaction
    if (input.transactionReference) {
      const existing = await this.paymentRepository.findByTransactionReference(
        input.transactionReference,
      );

      if (existing) {
        throw PaymentError.duplicatePayment(input.transactionReference);
      }
    }

    // Règle métier: montant maximum
    const amount = Money.create(input.amount, input.currency);
    const maxAmount = Money.create(999999.99, input.currency || "EUR");
    if (amount.isGreaterThan(maxAmount)) {
      throw PaymentError.amountTooHigh(
        maxAmount.getAmount(),
        maxAmount.getCurrency(),
      );
    }

    // Règle métier: montant minimum
    const minAmount = Money.create(0.01, input.currency || "EUR");
    if (amount.isLessThan(minAmount)) {
      throw PaymentError.amountTooLow(
        minAmount.getAmount(),
        minAmount.getCurrency(),
      );
    }
  }
}
