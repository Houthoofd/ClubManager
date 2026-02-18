/**
 * Payment Service
 * Handles Stripe payments, webhooks, and subscription management
 */

import Stripe from 'stripe';
import type {
  CreatePaymentIntentInput,
  ConfirmPaymentIntentInput,
  RefundInput,
  StripePaymentIntent,
  StripeWebhookEvent,
} from '@clubmanager/types';
import prisma from '../../../../config/database.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<StripePaymentIntent> {
    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100), // Convert to cents
      currency: input.currency || 'eur',
      payment_method: input.payment_method,
      customer: input.customer_id,
      metadata: {
        order_id: input.order_id?.toString() || '',
        ...input.metadata,
      },
    });

    // Save to database
    const record = await prisma.payments.create({
      data: {
        user_id: 1, // TODO: Get from context
        amount: input.amount,
        payment_method: 'online',
        payment_type: 'product',
        reference_id: input.order_id,
        status: 'pending',
        transaction_id: paymentIntent.id,
        notes: JSON.stringify({ stripe_payment_intent: paymentIntent }),
      },
    });

    return {
      id: record.id,
      stripe_payment_intent_id: paymentIntent.id,
      user_id: record.user_id,
      order_id: input.order_id,
      amount: input.amount,
      currency: input.currency || 'eur',
      status: this.mapStripeStatus(paymentIntent.status),
      payment_method: input.payment_method,
      client_secret: paymentIntent.client_secret || undefined,
      metadata: input.metadata,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(input: ConfirmPaymentIntentInput): Promise<StripePaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.confirm(input.payment_intent_id, {
      payment_method: input.payment_method,
    });

    // Update payment record
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: paymentIntent.id },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        },
      });
    }

    return {
      id: payment?.id || 0,
      stripe_payment_intent_id: paymentIntent.id,
      user_id: payment?.user_id || 0,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: this.mapStripeStatus(paymentIntent.status),
      payment_method: input.payment_method,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Process a refund
   */
  async refundPayment(input: RefundInput): Promise<void> {
    await this.stripe.refunds.create({
      payment_intent: input.payment_intent_id,
      amount: input.amount ? Math.round(input.amount * 100) : undefined,
      reason: input.reason,
      metadata: input.metadata,
    });

    // Update payment record
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: input.payment_intent_id },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'refunded' },
      });
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(payload: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    // Log webhook event
    await this.logWebhookEvent(event);

    // Process event
    try {
      await this.processWebhookEvent(event);

      // Mark as succeeded
      await this.updateWebhookStatus(event.id, 'succeeded');
    } catch (error) {
      // Mark as failed
      await this.updateWebhookStatus(event.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async logWebhookEvent(event: Stripe.Event): Promise<void> {
    await prisma.stripe_webhook_events.create({
      data: {
        stripe_event_id: event.id,
        event_type: event.type,
        object_type: (event.data.object as any).object || 'unknown',
        object_id: (event.data.object as any).id || 'unknown',
        status: 'pending',
        payload: event as any,
      },
    });
  }

  private async updateWebhookStatus(
    eventId: string,
    status: 'succeeded' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await prisma.stripe_webhook_events.updateMany({
      where: { stripe_event_id: eventId },
      data: {
        status,
        error_message: errorMessage,
        processed_at: new Date(),
      },
    });
  }

  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: paymentIntent.id },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'completed' },
      });

      // Update order if exists
      if (payment.reference_id && payment.payment_type === 'product') {
        await prisma.orders.update({
          where: { id: payment.reference_id },
          data: {
            payment_status: 'paid',
            status: 'processing',
          },
        });
      }
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: paymentIntent.id },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: charge.payment_intent as string },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'refunded' },
      });
    }
  }

  private mapStripeStatus(
    status: string
  ): 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded' {
    return status as any;
  }
}

export default new PaymentService();
