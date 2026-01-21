import { prisma } from "../../prisma/prisma.service.js";
import { emailService } from "../communication/email.service.js";
import type { Paiement, Prisma } from "@prisma/client";

/**
 * PaymentService - Handle payment CRUD operations and management
 *
 * Features:
 * - CRUD operations for payments
 * - Payment status management
 * - Payment history
 * - Payment statistics
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
    methode?: string;
    startDate?: Date;
    endDate?: Date;
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
          ...(data.methode !== undefined && { methode: data.methode }),
          ...(data.transactionId !== undefined && {
            transactionId: data.transactionId,
          }),
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
    statut: string,
  ): Promise<{ success: boolean; message: string; payment?: Paiement }> {
    try {
      const payment = await prisma.paiement.update({
        where: { id: paymentId },
        data: {
          statut,
          datePaiement: statut === PaymentStatus.PAID ? new Date() : undefined,
        },
        include: {
          utilisateur: true,
          abonnement: true,
        },
      });

      // Send confirmation email if payment is successful
      if (statut === PaymentStatus.PAID) {
        this.sendPaymentConfirmation(paymentId).catch((err) =>
          console.error("Failed to send payment confirmation:", err),
        );
      }

      return {
        success: true,
        message: "Statut du paiement mis à jour",
        payment,
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
    limit: number = 10,
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

      const paidPayments = payments.filter((p) => p.statut === "payé");
      const paidAmount = paidPayments.reduce(
        (sum, p) => sum + Number(p.montant),
        0,
      );
      const paidCount = paidPayments.length;

      const pendingPayments = payments.filter(
        (p) => p.statut === "en attente",
      );
      const pendingAmount = pendingPayments.reduce(
        (sum, p) => sum + Number(p.montant),
        0,
      );
      const pendingCount = pendingPayments.length;

      const failedPayments = payments.filter((p) => p.statut === "échoué");
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
  async sendPaymentConfirmation(
    paymentId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (!payment || !payment.user) {
        return {
          success: false,
          message: "Paiement ou utilisateur non trouvé",
        };
      }

      let description = "Paiement";
      if (payment.plan) {
        description = `Abonnement ${payment.plan.nom}`;
        const startDate = payment.periodeDebut
          ? new Date(payment.periodeDebut).toLocaleDateString("fr-FR")
          : "";
        const endDate = payment.periodeFin
          ? new Date(payment.periodeFin).toLocaleDateString("fr-FR")
          : "";
        description += ` (${startDate} - ${endDate})`;
      }

      await emailService.sendPaymentConfirmation(payment.user.email, {
        userName: `${payment.user.firstName} ${payment.user.lastName}`,
        amount: payment.montant,
        currency: "EUR",
        description,
      });

      return {
        success: true,
        message: "Email de confirmation envoyé",
      };
    } catch (error) {
      console.error("❌ Send payment confirmation error:", error);
      return {
        success: false,
        message: "Erreur lors de l'envoi de l'email",
      };
    }
  }

  /**
   * Get pending payments (overdue)
   */
  async getPendingPayments(): Promise<PaymentWithDetails[]> {
    try {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 7); // 7 days ago

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

  /**
   * Generate invoice for payment
   */
  async generateInvoice(paymentId: number) {
    try {
      console.log("TODO: Generate invoice for payment", paymentId);
      return {
        success: true,
        message: "Facture générée",
        invoiceUrl: `/invoices/${paymentId}.pdf`
      };
    } catch (error) {
      console.error("❌ Generate invoice error:", error);
      return {
        success: false,
        message: "Erreur lors de la génération de la facture"
      };
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(data: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    customerId?: string;
  }) {
    try {
      console.log("TODO: Process Stripe payment", data);
      return {
        success: true,
        message: "Paiement traité",
        paymentIntentId: `pi_${Date.now()}`
      };
    } catch (error) {
      console.error("❌ Process Stripe payment error:", error);
      return {
        success: false,
        message: "Erreur lors du traitement du paiement"
      };
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(event: any) {
    try {
      console.log("TODO: Handle Stripe webhook", event.type);
      return {
        success: true,
        message: "Webhook traité"
      };
    } catch (error) {
      console.error("❌ Handle Stripe webhook error:", error);
      return {
        success: false,
        message: "Erreur lors du traitement du webhook"
      };
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default PaymentService;
