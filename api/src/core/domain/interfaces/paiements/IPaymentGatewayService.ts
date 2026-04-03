/**
 * Interface: IPaymentGatewayService
 * Contrat pour les services de passerelle de paiement externe (Stripe, PayPal, etc.)
 */

import { Money } from '../../value-objects/paiements/Money.js';
import { TransactionReference, TransactionProvider } from '../../value-objects/paiements/TransactionReference.js';

export interface CreatePaymentIntentData {
  amount: Money;
  description?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  paymentMethodId?: string;
}

export interface CapturePaymentData {
  transactionReference: TransactionReference;
  amount?: Money; // Pour captures partielles
}

export interface RefundPaymentData {
  transactionReference: TransactionReference;
  amount?: Money; // Pour remboursements partiels
  reason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResult {
  id: string;
  transactionReference: TransactionReference;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  amount: Money;
  clientSecret?: string; // Pour côté client (Stripe)
  metadata?: Record<string, any>;
}

export interface PaymentCaptureResult {
  success: boolean;
  transactionReference: TransactionReference;
  amount: Money;
  capturedAt: Date;
  metadata?: Record<string, any>;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId: string;
  transactionReference: TransactionReference;
  amount: Money;
  refundedAt: Date;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  reason?: string;
}

export interface PaymentStatusResult {
  transactionReference: TransactionReference;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  amount: Money;
  createdAt: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  createdAt: Date;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event?: WebhookEvent;
  error?: string;
}

export interface CustomerData {
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface CreateCustomerResult {
  customerId: string;
  email: string;
  createdAt: Date;
}

export interface PaymentMethodData {
  type: 'card' | 'bank_account' | 'wallet';
  cardNumber?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardCvc?: string;
  customerId?: string;
}

export interface CreatePaymentMethodResult {
  paymentMethodId: string;
  type: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

/**
 * Service de passerelle de paiement
 * Abstraction pour les providers externes (Stripe, PayPal, etc.)
 */
export interface IPaymentGatewayService {
  /**
   * Retourne le provider de cette passerelle
   */
  getProvider(): TransactionProvider;

  /**
   * Vérifie si la passerelle est disponible et configurée
   */
  isAvailable(): Promise<boolean>;

  /**
   * Crée une intention de paiement
   * @param data Données de l'intention de paiement
   * @returns Résultat de création
   */
  createPaymentIntent(data: CreatePaymentIntentData): Promise<PaymentIntentResult>;

  /**
   * Confirme une intention de paiement
   * @param transactionReference Référence de la transaction
   * @returns Résultat de confirmation
   */
  confirmPaymentIntent(transactionReference: TransactionReference): Promise<PaymentIntentResult>;

  /**
   * Capture un paiement autorisé
   * @param data Données de capture
   * @returns Résultat de capture
   */
  capturePayment(data: CapturePaymentData): Promise<PaymentCaptureResult>;

  /**
   * Annule une intention de paiement
   * @param transactionReference Référence de la transaction
   * @returns true si annulé
   */
  cancelPaymentIntent(transactionReference: TransactionReference): Promise<boolean>;

  /**
   * Rembourse un paiement
   * @param data Données de remboursement
   * @returns Résultat de remboursement
   */
  refundPayment(data: RefundPaymentData): Promise<PaymentRefundResult>;

  /**
   * Récupère le statut d'un paiement
   * @param transactionReference Référence de la transaction
   * @returns Statut du paiement
   */
  getPaymentStatus(transactionReference: TransactionReference): Promise<PaymentStatusResult>;

  /**
   * Vérifie et parse un webhook
   * @param payload Corps de la requête webhook
   * @param signature Signature du webhook
   * @returns Résultat de vérification
   */
  verifyWebhook(payload: string | Buffer, signature: string): Promise<WebhookVerificationResult>;

  /**
   * Crée un client
   * @param data Données du client
   * @returns Résultat de création
   */
  createCustomer(data: CustomerData): Promise<CreateCustomerResult>;

  /**
   * Récupère un client par ID
   * @param customerId ID du client
   * @returns Données du client ou null
   */
  getCustomer(customerId: string): Promise<CustomerData | null>;

  /**
   * Met à jour un client
   * @param customerId ID du client
   * @param data Données à mettre à jour
   * @returns true si mis à jour
   */
  updateCustomer(customerId: string, data: Partial<CustomerData>): Promise<boolean>;

  /**
   * Supprime un client
   * @param customerId ID du client
   * @returns true si supprimé
   */
  deleteCustomer(customerId: string): Promise<boolean>;

  /**
   * Crée une méthode de paiement
   * @param data Données de la méthode de paiement
   * @returns Résultat de création
   */
  createPaymentMethod(data: PaymentMethodData): Promise<CreatePaymentMethodResult>;

  /**
   * Attache une méthode de paiement à un client
   * @param paymentMethodId ID de la méthode de paiement
   * @param customerId ID du client
   * @returns true si attaché
   */
  attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<boolean>;

  /**
   * Détache une méthode de paiement d'un client
   * @param paymentMethodId ID de la méthode de paiement
   * @returns true si détaché
   */
  detachPaymentMethod(paymentMethodId: string): Promise<boolean>;

  /**
   * Liste les méthodes de paiement d'un client
   * @param customerId ID du client
   * @returns Liste des méthodes de paiement
   */
  listPaymentMethods(customerId: string): Promise<CreatePaymentMethodResult[]>;

  /**
   * Calcule les frais de transaction
   * @param amount Montant
   * @returns Montant des frais
   */
  calculateFees(amount: Money): Money;

  /**
   * Vérifie si les remboursements partiels sont supportés
   */
  supportsPartialRefunds(): boolean;

  /**
   * Vérifie si les captures partielles sont supportées
   */
  supportsPartialCaptures(): boolean;

  /**
   * Retourne la durée de validité d'une intention de paiement (en heures)
   */
  getPaymentIntentExpiryHours(): number;

  /**
   * Retourne le délai maximum de remboursement (en jours)
   */
  getMaxRefundDays(): number;
}
