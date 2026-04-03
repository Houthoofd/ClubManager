/**
 * Domain Error: PaymentError
 * Erreurs du domaine Paiements
 */

export class PaymentError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  private constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, PaymentError.prototype);
  }

  // ==================== Erreurs Montant ====================

  static invalidAmount(message: string = "Montant invalide"): PaymentError {
    return new PaymentError(message, "INVALID_AMOUNT", 400);
  }

  static amountTooLow(
    minAmount: number,
    currency: string = "EUR",
  ): PaymentError {
    return new PaymentError(
      `Le montant minimum est de ${minAmount} ${currency}`,
      "AMOUNT_TOO_LOW",
      400,
    );
  }

  static amountTooHigh(
    maxAmount: number,
    currency: string = "EUR",
  ): PaymentError {
    return new PaymentError(
      `Le montant maximum est de ${maxAmount} ${currency}`,
      "AMOUNT_TOO_HIGH",
      400,
    );
  }

  static insufficientFunds(
    message: string = "Fonds insuffisants",
  ): PaymentError {
    return new PaymentError(message, "INSUFFICIENT_FUNDS", 400);
  }

  // ==================== Erreurs Devise ====================

  static invalidCurrency(message: string = "Devise invalide"): PaymentError {
    return new PaymentError(message, "INVALID_CURRENCY", 400);
  }

  static currencyMismatch(
    message: string = "Devises incompatibles",
  ): PaymentError {
    return new PaymentError(message, "CURRENCY_MISMATCH", 400);
  }

  static unsupportedCurrency(currency: string): PaymentError {
    return new PaymentError(
      `Devise non supportée: ${currency}`,
      "UNSUPPORTED_CURRENCY",
      400,
    );
  }

  // ==================== Erreurs Paiement ====================

  static paymentNotFound(paymentId: number | string): PaymentError {
    return new PaymentError(
      `Paiement ${paymentId} non trouvé`,
      "PAYMENT_NOT_FOUND",
      404,
    );
  }

  static paymentAlreadyProcessed(paymentId: number): PaymentError {
    return new PaymentError(
      `Le paiement ${paymentId} a déjà été traité`,
      "PAYMENT_ALREADY_PROCESSED",
      409,
    );
  }

  static paymentExpired(paymentId: number): PaymentError {
    return new PaymentError(
      `Le paiement ${paymentId} a expiré`,
      "PAYMENT_EXPIRED",
      410,
    );
  }

  static duplicatePayment(reference?: string): PaymentError {
    const msg = reference
      ? `Un paiement avec la référence ${reference} existe déjà`
      : "Paiement en double détecté";
    return new PaymentError(msg, "DUPLICATE_PAYMENT", 409);
  }

  // ==================== Erreurs Statut ====================

  static invalidStatus(status: string): PaymentError {
    return new PaymentError(
      `Statut de paiement invalide: ${status}`,
      "INVALID_STATUS",
      400,
    );
  }

  static invalidStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): PaymentError {
    return new PaymentError(
      `Transition de statut impossible: ${currentStatus} → ${newStatus}`,
      "INVALID_STATUS_TRANSITION",
      409,
    );
  }

  static paymentAlreadyValidated(paymentId: number): PaymentError {
    return new PaymentError(
      `Le paiement ${paymentId} est déjà validé`,
      "PAYMENT_ALREADY_VALIDATED",
      409,
    );
  }

  static paymentAlreadyCancelled(paymentId: number): PaymentError {
    return new PaymentError(
      `Le paiement ${paymentId} est déjà annulé`,
      "PAYMENT_ALREADY_CANCELLED",
      409,
    );
  }

  static paymentAlreadyRefunded(paymentId: number): PaymentError {
    return new PaymentError(
      `Le paiement ${paymentId} est déjà remboursé`,
      "PAYMENT_ALREADY_REFUNDED",
      409,
    );
  }

  // ==================== Erreurs Remboursement ====================

  static refundNotAllowed(reason: string): PaymentError {
    return new PaymentError(
      `Remboursement non autorisé: ${reason}`,
      "REFUND_NOT_ALLOWED",
      403,
    );
  }

  static refundTooLate(daysLimit: number): PaymentError {
    return new PaymentError(
      `Le délai de remboursement de ${daysLimit} jours est dépassé`,
      "REFUND_TOO_LATE",
      403,
    );
  }

  static partialRefundNotSupported(): PaymentError {
    return new PaymentError(
      "Les remboursements partiels ne sont pas supportés",
      "PARTIAL_REFUND_NOT_SUPPORTED",
      400,
    );
  }

  // ==================== Erreurs Méthode de paiement ====================

  static invalidPaymentMethod(method: string): PaymentError {
    return new PaymentError(
      `Méthode de paiement invalide: ${method}`,
      "INVALID_PAYMENT_METHOD",
      400,
    );
  }

  static paymentMethodNotSupported(method: string): PaymentError {
    return new PaymentError(
      `Méthode de paiement non supportée: ${method}`,
      "PAYMENT_METHOD_NOT_SUPPORTED",
      400,
    );
  }

  static paymentMethodUnavailable(method: string): PaymentError {
    return new PaymentError(
      `Méthode de paiement temporairement indisponible: ${method}`,
      "PAYMENT_METHOD_UNAVAILABLE",
      503,
    );
  }

  // ==================== Erreurs Transaction ====================

  static transactionFailed(reason?: string): PaymentError {
    const message = reason
      ? `Transaction échouée: ${reason}`
      : "Transaction échouée";
    return new PaymentError(message, "TRANSACTION_FAILED", 500);
  }

  static invalidTransactionReference(reference: string): PaymentError {
    return new PaymentError(
      `Référence de transaction invalide: ${reference}`,
      "INVALID_TRANSACTION_REFERENCE",
      400,
    );
  }

  static transactionAlreadyExists(reference: string): PaymentError {
    return new PaymentError(
      `Une transaction avec la référence ${reference} existe déjà`,
      "TRANSACTION_ALREADY_EXISTS",
      409,
    );
  }

  // ==================== Erreurs Provider externe ====================

  static stripeError(message: string): PaymentError {
    return new PaymentError(`Erreur Stripe: ${message}`, "STRIPE_ERROR", 500);
  }

  static paypalError(message: string): PaymentError {
    return new PaymentError(`Erreur PayPal: ${message}`, "PAYPAL_ERROR", 500);
  }

  static externalProviderError(
    provider: string,
    message: string,
  ): PaymentError {
    return new PaymentError(
      `Erreur ${provider}: ${message}`,
      "EXTERNAL_PROVIDER_ERROR",
      500,
    );
  }

  static gatewayError(message: string): PaymentError {
    return new PaymentError(`Erreur gateway: ${message}`, "GATEWAY_ERROR", 500);
  }

  // ==================== Erreurs Échéance ====================

  static scheduleNotFound(scheduleId: number): PaymentError {
    return new PaymentError(
      `Échéance ${scheduleId} non trouvée`,
      "SCHEDULE_NOT_FOUND",
      404,
    );
  }

  static scheduleAlreadyPaid(scheduleId: number): PaymentError {
    return new PaymentError(
      `L'échéance ${scheduleId} est déjà payée`,
      "SCHEDULE_ALREADY_PAID",
      409,
    );
  }

  static scheduleNotDue(scheduleId: number, dueDate: Date): PaymentError {
    return new PaymentError(
      `L'échéance ${scheduleId} n'est pas encore échue (date: ${dueDate.toISOString()})`,
      "SCHEDULE_NOT_DUE",
      400,
    );
  }

  static scheduleCancelled(): PaymentError {
    return new PaymentError(
      "L'échéance est annulée",
      "SCHEDULE_CANCELLED",
      400,
    );
  }

  static invalidScheduleStatus(status: string): PaymentError {
    return new PaymentError(
      `Statut d'échéance invalide: ${status}`,
      "INVALID_SCHEDULE_STATUS",
      400,
    );
  }

  // ==================== Erreurs Abonnement ====================

  static subscriptionNotFound(subscriptionId: number): PaymentError {
    return new PaymentError(
      `Abonnement ${subscriptionId} non trouvé`,
      "SUBSCRIPTION_NOT_FOUND",
      404,
    );
  }

  static subscriptionInactive(subscriptionId: number): PaymentError {
    return new PaymentError(
      `L'abonnement ${subscriptionId} est inactif`,
      "SUBSCRIPTION_INACTIVE",
      403,
    );
  }

  static subscriptionExpired(subscriptionId: number): PaymentError {
    return new PaymentError(
      `L'abonnement ${subscriptionId} a expiré`,
      "SUBSCRIPTION_EXPIRED",
      410,
    );
  }

  // ==================== Erreurs Utilisateur ====================

  static userNotFound(userId: number): PaymentError {
    return new PaymentError(
      `Utilisateur ${userId} non trouvé`,
      "USER_NOT_FOUND",
      404,
    );
  }

  static userNotAuthorized(userId: number, action: string): PaymentError {
    return new PaymentError(
      `L'utilisateur ${userId} n'est pas autorisé à ${action}`,
      "USER_NOT_AUTHORIZED",
      403,
    );
  }

  static unauthorized(userId: number, message?: string): PaymentError {
    return new PaymentError(
      message || `L'utilisateur ${userId} n'est pas autorisé`,
      "UNAUTHORIZED",
      403,
    );
  }

  // ==================== Erreurs Validation ====================

  static missingField(fieldName: string): PaymentError {
    return new PaymentError(
      `Le champ ${fieldName} est requis`,
      "MISSING_FIELD",
      400,
    );
  }

  static invalidField(fieldName: string, reason?: string): PaymentError {
    const message = reason
      ? `Champ ${fieldName} invalide: ${reason}`
      : `Champ ${fieldName} invalide`;
    return new PaymentError(message, "INVALID_FIELD", 400);
  }

  static invalidDateRange(startDate: Date, endDate: Date): PaymentError {
    return new PaymentError(
      `Période invalide: ${startDate.toISOString()} à ${endDate.toISOString()}`,
      "INVALID_DATE_RANGE",
      400,
    );
  }

  static invalidParameter(paramName: string, reason?: string): PaymentError {
    const message = reason
      ? `Paramètre ${paramName} invalide: ${reason}`
      : `Paramètre ${paramName} invalide`;
    return new PaymentError(message, "INVALID_PARAMETER", 400);
  }

  static invalidPagination(reason: string): PaymentError {
    return new PaymentError(
      `Pagination invalide: ${reason}`,
      "INVALID_PAGINATION",
      400,
    );
  }

  static invalidMethod(method: string): PaymentError {
    return new PaymentError(
      `Méthode invalide: ${method}`,
      "INVALID_METHOD",
      400,
    );
  }

  // ==================== Erreurs Générales ====================

  static internalError(
    message: string = "Erreur interne du serveur",
  ): PaymentError {
    return new PaymentError(message, "INTERNAL_ERROR", 500);
  }

  static databaseError(operation?: string): PaymentError {
    const message = operation
      ? `Erreur base de données lors de ${operation}`
      : "Erreur base de données";
    return new PaymentError(message, "DATABASE_ERROR", 500);
  }

  static notImplemented(feature: string): PaymentError {
    return new PaymentError(
      `Fonctionnalité ${feature} non implémentée`,
      "NOT_IMPLEMENTED",
      501,
    );
  }

  static concurrencyError(): PaymentError {
    return new PaymentError(
      "Conflit de concurrence détecté. Veuillez réessayer",
      "CONCURRENCY_ERROR",
      409,
    );
  }

  // ==================== Méthodes utilitaires ====================

  /**
   * Vérifie si l'erreur est de type PaymentError
   */
  static isPaymentError(error: unknown): error is PaymentError {
    return error instanceof PaymentError;
  }

  /**
   * Convertit une erreur en PaymentError
   */
  static fromError(error: unknown): PaymentError {
    if (PaymentError.isPaymentError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return new PaymentError(error.message, "UNKNOWN_ERROR", 500);
    }

    return new PaymentError("Erreur inconnue", "UNKNOWN_ERROR", 500);
  }

  /**
   * Retourne une représentation JSON de l'erreur
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}
