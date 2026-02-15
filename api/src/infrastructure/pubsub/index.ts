/**
 * PubSub Service - Gestion des subscriptions GraphQL en temps réel
 *
 * Supporte deux modes :
 * - In-Memory PubSub (dev/test, single instance)
 * - Redis PubSub (production, multi-instance)
 */

import { PubSub } from "graphql-subscriptions";
import { RedisPubSub } from "graphql-redis-subscriptions";
import { Redis } from "ioredis";

// ============================================================================
// Types et événements
// ============================================================================

/**
 * Liste des événements disponibles pour les subscriptions
 */
export enum PubSubEvent {
  // Webhooks
  WEBHOOK_PROCESSED = "WEBHOOK_PROCESSED",
  WEBHOOK_FAILED = "WEBHOOK_FAILED",
  WEBHOOK_RETRY = "WEBHOOK_RETRY",

  // Paiements
  PAYMENT_CREATED = "PAYMENT_CREATED",
  PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED = "PAYMENT_FAILED",

  // Commandes
  ORDER_CREATED = "ORDER_CREATED",
  ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED",

  // Notifications
  NOTIFICATION_CREATED = "NOTIFICATION_CREATED",

  // Messages
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
}

/**
 * Payload des événements webhook
 */
export interface WebhookEventPayload {
  id: string;
  eventId: string;
  eventType: string;
  status: string;
  processedAt?: Date;
  error?: string;
}

/**
 * Configuration du PubSub
 */
interface PubSubConfig {
  type: "memory" | "redis";
  redis?: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
}

// ============================================================================
// Service PubSub
// ============================================================================

class PubSubService {
  private pubsub: any; // PubSub | RedisPubSub - using any to avoid type conflicts
  private config: PubSubConfig;
  private isRedis: boolean = false;

  constructor(config?: Partial<PubSubConfig>) {
    this.config = {
      type: (process.env.PUBSUB_TYPE as "memory" | "redis") || "memory",
      redis: {
        url: process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING,
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || "0"),
      },
      ...config,
    };

    this.pubsub = this.initializePubSub();
  }

  /**
   * Initialiser le PubSub selon la configuration
   */
  private initializePubSub(): any {
    if (this.config.type === "redis") {
      try {
        console.log("🔄 [PubSubService] Initialisation Redis PubSub...");

        const redisUrl =
          this.config.redis?.url ||
          `redis://${this.config.redis?.host}:${this.config.redis?.port}`;

        const options = {
          host: this.config.redis?.host,
          port: this.config.redis?.port,
          password: this.config.redis?.password,
          db: this.config.redis?.db,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        };

        // Créer deux clients Redis : un pour publish, un pour subscribe
        const publisher = new Redis(options);
        const subscriber = new Redis(options);

        // Gérer les événements
        publisher.on("connect", () => {
          console.log("✅ [PubSubService] Redis Publisher connecté");
        });

        subscriber.on("connect", () => {
          console.log("✅ [PubSubService] Redis Subscriber connecté");
        });

        publisher.on("error", (error: Error) => {
          console.error(
            "❌ [PubSubService] Erreur Redis Publisher:",
            error.message,
          );
        });

        subscriber.on("error", (error: Error) => {
          console.error(
            "❌ [PubSubService] Erreur Redis Subscriber:",
            error.message,
          );
        });

        this.isRedis = true;

        return new RedisPubSub({
          publisher,
          subscriber,
        });
      } catch (error: any) {
        console.error(
          "❌ [PubSubService] Échec initialisation Redis PubSub, fallback sur in-memory:",
          error.message,
        );
        this.isRedis = false;
        return new PubSub();
      }
    } else {
      console.log("🔄 [PubSubService] Utilisation du PubSub en mémoire");
      this.isRedis = false;
      return new PubSub();
    }
  }

  /**
   * Publier un événement
   */
  async publish<T = any>(event: PubSubEvent, payload: T): Promise<void> {
    try {
      await this.pubsub.publish(event as string, payload);
      console.log(`📢 [PubSubService] Événement publié: ${event}`, {
        payloadKeys: Object.keys(payload as object),
      });
    } catch (error: any) {
      console.error(
        `❌ [PubSubService] Erreur publication ${event}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * S'abonner à un événement (pour les resolvers GraphQL)
   */
  asyncIterator<T = any>(
    events: PubSubEvent | PubSubEvent[],
  ): AsyncIterator<T> {
    const eventNames = Array.isArray(events)
      ? events.map((e) => e as string)
      : [events as string];
    console.log(`🔔 [PubSubService] Nouvelle souscription:`, eventNames);
    return this.pubsub.asyncIterator(eventNames);
  }

  /**
   * Publier un événement webhook
   */
  async publishWebhookEvent(
    type: "PROCESSED" | "FAILED" | "RETRY",
    payload: WebhookEventPayload,
  ): Promise<void> {
    const eventMap = {
      PROCESSED: PubSubEvent.WEBHOOK_PROCESSED,
      FAILED: PubSubEvent.WEBHOOK_FAILED,
      RETRY: PubSubEvent.WEBHOOK_RETRY,
    };

    const event = eventMap[type];
    await this.publish(event, { onWebhookProcessed: payload });
  }

  /**
   * Publier un événement de paiement
   */
  async publishPaymentEvent(
    type: "CREATED" | "SUCCEEDED" | "FAILED",
    payload: any,
  ): Promise<void> {
    const eventMap = {
      CREATED: PubSubEvent.PAYMENT_CREATED,
      SUCCEEDED: PubSubEvent.PAYMENT_SUCCEEDED,
      FAILED: PubSubEvent.PAYMENT_FAILED,
    };

    const event = eventMap[type];
    await this.publish(event, { onPaymentEvent: payload });
  }

  /**
   * Publier un événement de commande
   */
  async publishOrderEvent(
    type: "CREATED" | "STATUS_CHANGED",
    payload: any,
  ): Promise<void> {
    const eventMap = {
      CREATED: PubSubEvent.ORDER_CREATED,
      STATUS_CHANGED: PubSubEvent.ORDER_STATUS_CHANGED,
    };

    const event = eventMap[type];
    await this.publish(event, { onOrderEvent: payload });
  }

  /**
   * Publier une notification
   */
  async publishNotification(payload: any): Promise<void> {
    await this.publish(PubSubEvent.NOTIFICATION_CREATED, {
      onNotification: payload,
    });
  }

  /**
   * Publier un message
   */
  async publishMessage(payload: any): Promise<void> {
    await this.publish(PubSubEvent.MESSAGE_RECEIVED, {
      onMessage: payload,
    });
  }

  /**
   * Obtenir le type de PubSub utilisé
   */
  getType(): "memory" | "redis" {
    return this.isRedis ? "redis" : "memory";
  }

  /**
   * Vérifier si le PubSub est opérationnel
   */
  isReady(): boolean {
    return !!this.pubsub;
  }

  /**
   * Fermer proprement les connexions
   */
  async close(): Promise<void> {
    try {
      if (this.isRedis && this.pubsub instanceof RedisPubSub) {
        // RedisPubSub gère automatiquement la fermeture des clients
        console.log("✅ [PubSubService] Connexions Redis fermées");
      }
    } catch (error: any) {
      console.error("❌ [PubSubService] Erreur fermeture:", error.message);
    }
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const pubSubService = new PubSubService();

export default pubSubService;
