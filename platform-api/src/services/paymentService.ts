import { prisma } from "./prismaService.js";
import { emailService } from "./emailService.js";
import type { Paiement, Prisma } from "@prisma/client";

/**
 * PaymentService - Handle all payment-related operations
 *
 * Features:
 * - CRUD operations for payments
 * - Payment status management
 * - Invoice generation
 * - Payment confirmation emails
 * - Payment history
 * - Payment reminders
 * - Stripe integration preparation
 */

// Types
export interface CreatePaymentData {
  utilisateurId: number;
  montant: number;
  statut?: string;
  datePaiement?: Date;
  abonnementId?: number;
  periodeDebut?: Date;
  periodeFin?: Date;
  methode?: string;
  transactionId?: string;
}

export interface UpdatePaymentData {
  montant?: number;
  statut?: string;
  datePaiement?: Date;
  methode?: string;
  transactionId?: string;
}

export interface PaymentWithDetails {
  id: number;
  utilisateurId: number;
  montant: number;
  statut: string;
  datePaiement: Date | null;
  abonnementId: number | null;
  periodeDebut: Date | null;
  periodeFin: Date | null;
  methode: string | null;
  transactionId: string | null;
  createdAt: Date;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  plan?: {
    id: number;
    nom: string;
    prix: number;
  };
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  failedAmount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
}

export enum PaymentStatus {
  PENDING = "en attente",
  PAID = "payé",
  FAILED = "échoué",
  REFUNDED = "remboursé",
  CANCELLED = "annulé",
}

export enum PaymentMethod {
  CARD = "carte",
  CASH = "espèces",
  TRANSFER = "virement",
  STRIPE = "stripe",
  PAYPAL = "paypal",
}

class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentData): Promise<{
    success: boolean;
    message: string;
    payment?: Paiement;
  }> {
    try {
      // Validate amount
      if (data.montant <= 0) {
        return {
          success: false,
          message: "Le montant doit être supérieur à 0",
        };
      }

      // Create payment
      const payment = await prisma.paiement.create({
        data: {
          utilisateurId: data.utilisateurId,
          montant: data.montant,
          statut: data.statut || PaymentStatus.PENDING,
          datePaiement: data.datePaiement || new Date(),
          abonnementId: data.abonnementId,
          periodeDebut: data.periodeDebut,
          periodeFin: data.periodeFin,
          methode: data.methode,
          transactionId: data.transactionId,
        },
      });

      return {
        success: true,
        message: "Paiement créé avec succès",
        payment,
      };
    } catch (error) {
      console.error("❌ Create payment error:", error);
      return {
        success: false,
        message: "Erreur lors de la création du paiement",
      };
    }
  }

  /**
   * Get payment by ID with details
   */
  async getPaymentById(paymentId: number): Promise<PaymentWithDetails | null> {
    try {
      const payment = await prisma.paiement.findUnique({
        where: { id: paymentId },
        include: {
          utilisateur: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          abonnement: {
            select: {
              id: true,
              nom: true,
              prix: true,
            },
          },
        },
      });

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        utilisateurId: payment.utilisateurId,
        montant: Number(payment.montant),
        statut: payment.statut,
        datePaiement: payment.datePaiement,
        abonnementId: payment.abonnementId,
        periodeDebut: payment.periodeDebut,
        periodeFin: payment.periodeFin,
        methode: payment.methode,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        user: {
          id: payment.utilisateur.id,
          firstName: payment.utilisateur.firstName,
          lastName: payment.utilisateur.lastName,
          email: payment.utilisateur.email,
        },
        plan: payment.abonnement
          ? {
              id: payment.abonnement.id,
              nom: payment.abonnement.nom,
              prix: Number(payment.abonnement.prix),
            }
          : undefined,
      };
    } catch (error) {
      console.error("❌ Get payment by ID error:", error);
      return null;
    }
  }

  /**
   * List payments with pagination and filters
   */
  async listPayments(options: {
    page?: number;
    limit?: number;
    utilisateurId?: number;
    statut?: string;
    startDate?: Date;
    endDate?: Date;
    methode?: string;
  } = {}): Promise<{
    payments: PaymentWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.PaiementWhereInput = {
        ...(options.utilisateurId && {
          utilisateurId: options.utilisateurId,
        }),
        ...(options.statut && { statut: options.statut }),
        ...(options.methode && { methode: options.methode }),
        ...(options.startDate &&
          options.endDate && {
            datePaiement: {
              gte: options.startDate,
              lte: options.endDate,
            },
          }),
      };

      // Get payments and total count
      const [payments, total] = await Promise.all([
        prisma.paiement.findMany({
          where,
          skip,
          take: limit,
          include: {
            utilisateur: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            abonnement: {
              select: {
                id: true,
                nom: true,
                prix: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.paiement.count({ where }),
      ]);

      // Map to payments with details
      const paymentsWithDetails: PaymentWithDetails[] = payments.map(
        (payment) => ({
          id: payment.id,
          utilisateurId: payment.utilisateurId,
          montant: Number(payment.montant),
          statut: payment.statut,
          datePaiement: payment.datePaiement,
          abonnementId: payment.abonnementId,
          periodeDebut: payment.periodeDebut,
          periodeFin: payment.periodeFin,
          methode: payment.methode,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt,
          user: {
            id: payment.utilisateur.id,
            firstName: payment.utilisateur.firstName,
            lastName: payment.utilisateur.lastName,
            email: payment.utilisateur.email,
          },
          plan: payment.abonnement
            ? {
                id: payment.abonnement.id,
                nom: payment.abonnement.nom,
                prix: Number(payment.abonnement.prix),
              }
            : undefined,
        }),
      );

      return {
        payments: paymentsWithDetails,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("❌ List payments error:", error);
      return {
        payments: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Update payment
   */
  async updatePayment(
    paymentId: number,
    data: UpdatePaymentData,
  ): Promise<{ success: boolean; message: string; payment?: Paiement }> {
    try {
      const payment = await prisma.paiement.update({
        where: { id: paymentId },
        data: {
          ...(data.montant !== undefined && { montant: data.montant }),
          ...(data.statut && { statut: data.statut }),
          ...(data.datePaiement !== undefined && {
            datePaiement: data.datePaiement,
          }),
          ...(data.methode && { methode: data.methode }),
          ...(data.transactionId && { transactionId: data.transactionId }),
        },
      });

      return {
        success: true,
        message: "Paiement mis à jour avec succès",
        payment,
      };
    } catch (error) {
      console.error("❌ Update payment error:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour du paiement",
      };
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: number,
    status: string,
    transactionId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payment = await prisma.paiement.update({
        where: { id: paymentId },
        data: {
          statut: status,
          ...(status === PaymentStatus.PAID && { datePaiement: new Date() }),
          ...(transactionId && { transactionId }),
        },
        include: {
          utilisateur: true,
          abonnement: true,
        },
      });

      // Send confirmation email if payment is successful
      if (status === PaymentStatus.PAID) {
        await this.sendPaymentConfirmation(paymentId);
      }

      return {
        success: true,
        message: "Statut du paiement mis à jour",
      };
    } catch (error) {
      console.error("❌ Update payment status error:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour du statut",
      };
    }
  }

  /**
   * Delete payment
   */
  async deletePayment(
    paymentId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.paiement.delete({
        where: { id: paymentId },
      });

      return {
        success: true,
        message: "Paiement supprimé avec succès",
      };
    } catch (error) {
      console.error("❌ Delete payment error:", error);
      return {
        success: false,
        message: "Erreur lors de la suppression du paiement",
      };
    }
  }

  /**
   * Get user payment history
   */
  async getUserPaymentHistory(
    utilisateurId: number,
    limit = 50,
  ): Promise<PaymentWithDetails[]> {
    try {
      const payments = await prisma.paiement.findMany({
        where: { utilisateurId },
        include: {
          utilisateur: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          abonnement: {
            select: {
              id: true,
              nom: true,
              prix: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return payments.map((payment) => ({
        id: payment.id,
        utilisateurId: payment.utilisateurId,
        montant: Number(payment.montant),
        statut: payment.statut,
        datePaiement: payment.datePaiement,
        abonnementId: payment.abonnementId,
        periodeDebut: payment.periodeDebut,
        periodeFin: payment.periodeFin,
        methode: payment.methode,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        user: {
          id: payment.utilisateur.id,
          firstName: payment.utilisateur.firstName,
          lastName: payment.utilisateur.lastName,
          email: payment.utilisateur.email,
        },
        plan: payment.abonnement
          ? {
              id: payment.abonnement.id,
              nom: payment.abonnement.nom,
              prix: Number(payment.abonnement.prix),
            }
          : undefined,
      }));
    } catch (error) {
      console.error("❌ Get user payment history error:", error);
      return [];
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(options: {
    utilisateurId?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<PaymentStats> {
    try {
      const where: Prisma.PaiementWhereInput = {
        ...(options.utilisateurId && {
          utilisateurId: options.utilisateurId,
        }),
        ...(options.startDate &&
          options.endDate && {
            datePaiement: {
              gte: options.startDate,
              lte: options.endDate,
            },
          }),
      };

      const payments = await prisma.paiement.findMany({ where });

      const totalPayments = payments.length;
      const totalAmount = payments.reduce(
        (sum, p) => sum + Number(p.montant),
        0,
      );

      const paidPayments = payments.filter((p) => p.statut === PaymentStatus.PAID);
      const paidAmount = paidPayments.reduce(
        (sum, p) => sum + Number(p.montant),
        0,
      );
      const paidCount = paidPayments.length;

      const pendingPayments = payments.filter(
        (p) => p.statut === PaymentStatus.PENDING,
      );
      const pendingAmount = pendingPayments.reduce(
        (sum, p) => sum + Number(p.montant),
        0,
      );
      const pendingCount = pendingPayments.length;

      const failedPayments = payments.filter(
        (p) => p.statut === PaymentStatus.FAILED,
      );
      const failedAmount = failedPayments.reduce(
        (sum, p) => sum + Number(p.montant),
        0,
      );
      const failedCount = failedPayments.length;

      return {
        totalPayments,
        totalAmount,
        paidAmount,
        pendingAmount,
        failedAmount,
        paidCount,
        pendingCount,
        failedCount,
      };
    } catch (error) {
      console.error("❌ Get payment stats error:", error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        failedAmount: 0,
        paidCount: 0,
        pendingCount: 0,
        failedCount: 0,
      };
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(paymentId: number): Promise<boolean> {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (!payment || !payment.user) {
        return false;
      }

      let description = "Paiement";
      if (payment.plan) {
        description = `Abonnement ${payment.plan.nom}`;
        if (payment.periodeDebut && payment.periodeFin) {
          const startDate = new Date(payment.periodeDebut).toLocaleDateString(
            "fr-FR",
          );
          const endDate = new Date(payment.periodeFin).toLocaleDateString(
            "fr-FR",
          );
          description += ` (${startDate} - ${endDate})`;
        }
      }

      await emailService.sendPaymentConfirmation(payment.user.email, {
        userName: `${payment.user.firstName} ${payment.user.lastName}`,
        amount: payment.montant,
        currency: "EUR",
        description,
      });

      return true;
    } catch (error) {
      console.error("❌ Send payment confirmation error:", error);
      return false;
    }
  }

  /**
   * Process Stripe payment (preparation for Phase 2)
   */
  async processStripePayment(data: {
    utilisateurId: number;
    montant: number;
    abonnementId?: number;
    paymentMethodId: string;
  }): Promise<{
    success: boolean;
    message: string;
    payment?: Paiement;
    stripePaymentIntentId?: string;
  }> {
    try {
      // TODO: Integrate with Stripe API in Phase 2
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({...});

      // For now, create a pending payment
      const result = await this.createPayment({
        utilisateurId: data.utilisateurId,
        montant: data.montant,
        abonnementId: data.abonnementId,
        statut: PaymentStatus.PENDING,
        methode: PaymentMethod.STRIPE,
      });

      return {
        success: result.success,
        message: result.message,
        payment: result.payment,
        stripePaymentIntentId: "pi_placeholder", // Replace with actual Stripe payment intent ID
      };
    } catch (error) {
      console.error("❌ Process Stripe payment error:", error);
      return {
        success: false,
        message: "Erreur lors du traitement du paiement Stripe",
      };
    }
  }

  /**
   * Handle Stripe webhook (preparation for Phase 2)
   */
  async handleStripeWebhook(event: any): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // TODO: Implement Stripe webhook handling in Phase 2
      // switch (event.type) {
      //   case 'payment_intent.succeeded':
      //     await this.updatePaymentStatus(paymentId, PaymentStatus.PAID, event.data.object.id);
      //     break;
      //   case 'payment_intent.payment_failed':
      //     await this.updatePaymentStatus(paymentId, PaymentStatus.FAILED);
      //     break;
      // }

      return {
        success: true,
        message: "Webhook traité avec succès",
      };
    } catch (error) {
      console.error("❌ Handle Stripe webhook error:", error);
      return {
        success: false,
        message: "Erreur lors du traitement du webhook",
      };
    }
  }

  /**
   * Generate invoice (placeholder for PDF generation)
   */
  async generateInvoice(paymentId: number): Promise<{
    success: boolean;
    message: string;
    invoiceUrl?: string;
  }> {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (!payment) {
        return {
          success: false,
          message: "Paiement non trouvé",
        };
      }

      // TODO: Implement PDF generation with pdfkit or similar
      // For now, return a placeholder URL
      const invoiceUrl = `${process.env.API_URL || "http://localhost:3001"}/api/invoices/${paymentId}.pdf`;

      return {
        success: true,
        message: "Facture générée avec succès",
        invoiceUrl,
      };
    } catch (error) {
      console.error("❌ Generate invoice error:", error);
      return {
        success: false,
        message: "Erreur lors de la génération de la facture",
      };
    }
  }

  /**
   * Get pending payments for reminders
   */
  async getPendingPayments(daysOverdue = 7): Promise<PaymentWithDetails[]> {
    try {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - daysOverdue);

      const payments = await prisma.paiement.findMany({
        where: {
          statut: PaymentStatus.PENDING,
          createdAt: {
            lte: overdueDate,
          },
        },
        include: {
          utilisateur: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          abonnement: {
            select: {
              id: true,
              nom: true,
              prix: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return payments.map((payment) => ({
        id: payment.id,
        utilisateurId: payment.utilisateurId,
        montant: Number(payment.montant),
        statut: payment.statut,
        datePaiement: payment.datePaiement,
        abonnementId: payment.abonnementId,
        periodeDebut: payment.periodeDebut,
        periodeFin: payment.periodeFin,
        methode: payment.methode,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        user: {
          id: payment.utilisateur.id,
          firstName: payment.utilisateur.firstName,
          lastName: payment.utilisateur.lastName,
          email: payment.utilisateur.email,
        },
        plan: payment.abonnement
          ? {
              id: payment.abonnement.id,
              nom: payment.abonnement.nom,
              prix: Number(payment.abonnement.prix),
            }
          : undefined,
      }));
    } catch (error) {
      console.error("❌ Get pending payments error:", error);
      return [];
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default PaymentService;
