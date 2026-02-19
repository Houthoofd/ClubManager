/**
 * Payment Resolvers
 * GraphQL resolvers for Stripe payment operations
 */

import type {
  CreatePaymentIntentInput,
  ConfirmPaymentIntentInput,
  RefundInput,
} from "@clubmanager/types";
import paymentService from "../services/payment.service.js";
import { prisma } from "@/infrastructure/database/prisma-client.js";

export const paymentResolvers = {
  Query: {
    /**
     * Get payment intent by ID
     */
    getPaymentIntent: async (
      _parent: any,
      { paymentIntentId }: { paymentIntentId: string },
      context: any,
    ) => {
      try {
        if (!context.user) {
          throw new Error("Not authenticated");
        }

        // TODO: Implement get payment intent
        // const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId);

        return {
          success: true,
          message: "Payment intent retrieved successfully",
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to get payment intent",
        };
      }
    },

    /**
     * Get payment history for user
     */
    getPaymentHistory: async (_parent: any, _args: any, context: any) => {
      try {
        if (!context.user) {
          throw new Error("Not authenticated");
        }

        // TODO: Implement payment history
        // const payments = await paymentService.getPaymentHistory(context.user.id);

        return {
          success: true,
          message: "Payment history retrieved successfully",
          payments: [],
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to get payment history",
        };
      }
    },
  },

  Mutation: {
    /**
     * Create a payment intent
     */
    createPaymentIntent: async (
      _parent: any,
      { input }: { input: CreatePaymentIntentInput },
      context: any,
    ) => {
      try {
        if (!context.user) {
          throw new Error("Not authenticated");
        }

        const paymentIntent = await paymentService.createPaymentIntent(input);

        return {
          success: true,
          message: "Payment intent created successfully",
          paymentIntent,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create payment intent",
        };
      }
    },

    /**
     * Confirm a payment intent
     */
    confirmPaymentIntent: async (
      _parent: any,
      { input }: { input: ConfirmPaymentIntentInput },
      context: any,
    ) => {
      try {
        if (!context.user) {
          throw new Error("Not authenticated");
        }

        const paymentIntent = await paymentService.confirmPaymentIntent(input);

        return {
          success: true,
          message: "Payment confirmed successfully",
          paymentIntent,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Payment confirmation failed",
        };
      }
    },

    /**
     * Create a payment intent for an order
     */
    createPaymentIntentForOrder: async (
      _parent: any,
      {
        input,
      }: {
        input: {
          orderId: number;
          userId: number;
          amount: number;
          currency?: string;
          metadata?: any;
        };
      },
      context: any,
    ) => {
      try {
        if (!context.user) {
          throw new Error("Not authenticated");
        }

        // Verify user owns the order
        if (context.user.id !== input.userId && context.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const paymentIntentInput: CreatePaymentIntentInput = {
          amount: input.amount,
          currency: input.currency || "eur",
          order_id: input.orderId,
          metadata: {
            order_id: input.orderId.toString(),
            user_id: input.userId.toString(),
            ...input.metadata,
          },
        };

        const paymentIntent =
          await paymentService.createPaymentIntent(paymentIntentInput);

        return {
          success: true,
          message: "Payment intent created successfully",
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.stripe_payment_intent_id,
          amount: paymentIntent.amount,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create payment intent for order",
          clientSecret: null,
          paymentIntentId: null,
          amount: null,
        };
      }
    },

    /**
     * Confirm order payment
     */
    confirmOrderPayment: async (
      _parent: any,
      {
        input,
      }: {
        input: {
          orderId: number;
          userId: number;
          paymentIntentId: string;
          paymentMethod: string;
        };
      },
      context: any,
    ) => {
      try {
        if (!context.user) {
          throw new Error("Not authenticated");
        }

        // Verify user owns the order
        if (context.user.id !== input.userId && context.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const confirmInput: ConfirmPaymentIntentInput = {
          payment_intent_id: input.paymentIntentId,
          payment_method: input.paymentMethod,
        };

        const paymentIntent =
          await paymentService.confirmPaymentIntent(confirmInput);

        // Update order status
        const updatedOrder = await prisma.orders.update({
          where: { id: input.orderId },
          data: { status: "paid" },
        });

        // Get payment record
        const payment = await prisma.payments.findFirst({
          where: { transaction_id: input.paymentIntentId },
        });

        return {
          success: true,
          message: "Order payment confirmed successfully",
          payment: payment || null,
          order: updatedOrder,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to confirm order payment",
          payment: null,
          order: null,
        };
      }
    },

    /**
     * Refund a payment
     */
    refundPayment: async (
      _parent: any,
      { input }: { input: RefundInput },
      context: any,
    ) => {
      try {
        if (!context.user) {
          throw new Error("Not authenticated");
        }

        // Check if user is admin
        if (context.user.role !== "admin") {
          throw new Error("Only admins can process refunds");
        }

        await paymentService.refundPayment(input);

        return {
          success: true,
          message: "Refund processed successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Refund failed",
        };
      }
    },

    /**
     * Handle Stripe webhook (internal use, called from webhook endpoint)
     */
    handleStripeWebhook: async (
      _parent: any,
      { payload, signature }: { payload: string; signature: string },
    ) => {
      try {
        await paymentService.handleWebhook(payload, signature);

        return {
          success: true,
          message: "Webhook processed successfully",
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Webhook processing failed",
        };
      }
    },
  },
};
