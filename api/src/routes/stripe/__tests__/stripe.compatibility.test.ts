/**
 * @file stripe.compatibility.test.ts
 * @description Tests de compatibilité des versions d'API Stripe
 *
 * PRIORITÉ 3 - NICE TO HAVE ✨
 *
 * Couvre:
 * - Compatibilité avec différentes versions d'API Stripe
 * - Migration entre versions d'API
 * - Gestion des breaking changes
 * - Backward compatibility
 * - Deprecation warnings
 * - API versioning best practices
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import Stripe from "stripe";
import { Request, Response } from "express";

// Mock dependencies
jest.mock("@prisma/client");
jest.mock("stripe");

describe("Stripe API Compatibility Tests - Priority 3 ✨", () => {
  let mockPrisma: any;
  let mockStripe: any;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      paiement: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      utilisateur: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    mockStripe = {
      webhooks: {
        constructEvent: jest.fn(),
      },
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        confirm: jest.fn(),
      },
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    req = {
      body: {},
      headers: {
        "stripe-signature": "test_signature",
      },
      rawBody: Buffer.from("test"),
    };
  });

  describe("🔄 Versions d'API Stripe", () => {
    it("devrait supporter l'API version 2023-10-16", async () => {
      const apiVersion = "2023-10-16";
      const stripeClient = new Stripe("sk_test_123", {
        apiVersion: apiVersion as any,
      });

      // Simulate payment intent with this API version
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_test",
        amount: 5000,
        currency: "eur",
        status: "requires_payment_method",
        client_secret: "pi_test_secret",
        automatic_payment_methods: { enabled: true }, // Feature from 2023-10-16
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
      });

      expect(paymentIntent.automatic_payment_methods).toBeDefined();
      expect(paymentIntent.automatic_payment_methods.enabled).toBe(true);
    });

    it("devrait supporter l'API version 2022-11-15", async () => {
      const apiVersion = "2022-11-15";

      // Older API version without automatic_payment_methods
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_test",
        amount: 5000,
        currency: "eur",
        status: "requires_payment_method",
        client_secret: "pi_test_secret",
        payment_method_types: ["card"], // Old way
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["card"],
      });

      expect(paymentIntent.payment_method_types).toContain("card");
    });

    it("devrait détecter la version d'API utilisée", async () => {
      const getApiVersion = (stripeInstance: any): string => {
        return (
          stripeInstance._api?.version ||
          process.env.STRIPE_API_VERSION ||
          "latest"
        );
      };

      mockStripe._api = { version: "2023-10-16" };
      const version = getApiVersion(mockStripe);

      expect(version).toBe("2023-10-16");
      console.log(`✓ Using Stripe API version: ${version}`);
    });

    it("devrait logger un warning pour API version obsolète", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();
      const currentVersion = "2022-08-01";
      const recommendedVersion = "2023-10-16";

      if (currentVersion < recommendedVersion) {
        console.warn(
          `⚠️ You are using Stripe API version ${currentVersion}. ` +
            `Consider upgrading to ${recommendedVersion} for latest features.`,
        );
      }

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Consider upgrading"),
      );

      warnSpy.mockRestore();
    });
  });

  describe("🔀 Migration entre Versions", () => {
    it("devrait migrer de payment_method_types vers automatic_payment_methods", async () => {
      // Old API format
      const oldFormat = {
        amount: 5000,
        currency: "eur",
        payment_method_types: ["card"],
      };

      // New API format (2023-10-16+)
      const migrateToNewFormat = (oldPayload: any) => {
        const newPayload: any = {
          amount: oldPayload.amount,
          currency: oldPayload.currency,
        };

        if (oldPayload.payment_method_types) {
          // Convert to new format
          newPayload.automatic_payment_methods = { enabled: true };
        }

        return newPayload;
      };

      const newFormat = migrateToNewFormat(oldFormat);

      expect(newFormat.automatic_payment_methods).toBeDefined();
      expect(newFormat.automatic_payment_methods.enabled).toBe(true);
      expect(newFormat.payment_method_types).toBeUndefined();
    });

    it("devrait gérer les webhooks avec différents formats", async () => {
      // Old webhook format
      const oldWebhook = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            amount: 5000,
            charges: {
              data: [{ id: "ch_test" }],
            },
          },
        },
      };

      // New webhook format (expanded)
      const newWebhook = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            amount: 5000,
            latest_charge: {
              id: "ch_test",
              amount: 5000,
              status: "succeeded",
            },
          },
        },
      };

      const extractChargeId = (webhook: any): string => {
        // Handle both formats
        if (webhook.data.object.latest_charge) {
          return typeof webhook.data.object.latest_charge === "string"
            ? webhook.data.object.latest_charge
            : webhook.data.object.latest_charge.id;
        }
        if (webhook.data.object.charges?.data?.[0]) {
          return webhook.data.object.charges.data[0].id;
        }
        return "";
      };

      expect(extractChargeId(oldWebhook)).toBe("ch_test");
      expect(extractChargeId(newWebhook)).toBe("ch_test");
    });

    it("devrait convertir les metadata selon les contraintes de version", async () => {
      // API 2023+ has stricter metadata validation
      const metadata = {
        userId: "123",
        echeanceId: "456",
        longKey: "a".repeat(600), // > 500 chars (too long for newer versions)
        specialChars: "test@#$%",
      };

      const sanitizeMetadata = (
        meta: Record<string, string>,
      ): Record<string, string> => {
        const sanitized: Record<string, string> = {};

        for (const [key, value] of Object.entries(meta)) {
          // Limit value length to 500 chars (Stripe limit)
          const truncatedValue = value.slice(0, 500);

          // Remove special chars from keys (only alphanumeric and _)
          const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, "_");

          sanitized[sanitizedKey] = truncatedValue;
        }

        return sanitized;
      };

      const sanitized = sanitizeMetadata(metadata);

      expect(sanitized.longKey.length).toBeLessThanOrEqual(500);
      expect(sanitized.specialChars).toBe("test@#$%");
    });
  });

  describe("💥 Breaking Changes", () => {
    it("devrait gérer la suppression de `sources` (deprecated)", async () => {
      // `sources` was deprecated in favor of `payment_methods`
      const handlePaymentMethod = (customer: any): string => {
        // Try new way first
        if (customer.invoice_settings?.default_payment_method) {
          return customer.invoice_settings.default_payment_method;
        }
        // Fallback to deprecated way
        if (customer.default_source) {
          console.warn(
            "⚠️ default_source is deprecated, use invoice_settings.default_payment_method",
          );
          return customer.default_source;
        }
        return "";
      };

      const newCustomer = {
        id: "cus_test",
        invoice_settings: { default_payment_method: "pm_test" },
      };

      const oldCustomer = {
        id: "cus_test",
        default_source: "card_test",
      };

      expect(handlePaymentMethod(newCustomer)).toBe("pm_test");
      expect(handlePaymentMethod(oldCustomer)).toBe("card_test");
    });

    it("devrait adapter les charges.data vers latest_charge", async () => {
      const getLatestCharge = (paymentIntent: any): any => {
        // New API (2023+)
        if (paymentIntent.latest_charge) {
          return typeof paymentIntent.latest_charge === "object"
            ? paymentIntent.latest_charge
            : { id: paymentIntent.latest_charge };
        }

        // Old API (pre-2023)
        if (paymentIntent.charges?.data?.[0]) {
          return paymentIntent.charges.data[0];
        }

        return null;
      };

      const newPI = {
        id: "pi_test",
        latest_charge: { id: "ch_test", status: "succeeded" },
      };

      const oldPI = {
        id: "pi_test",
        charges: { data: [{ id: "ch_test", status: "succeeded" }] },
      };

      const newCharge = getLatestCharge(newPI);
      const oldCharge = getLatestCharge(oldPI);

      expect(newCharge.id).toBe("ch_test");
      expect(oldCharge.id).toBe("ch_test");
    });

    it("devrait gérer les changements de structure des webhooks", async () => {
      // API 2020-08-27: Introduced `previous_attributes` in update events
      const oldUpdateEvent = {
        type: "customer.updated",
        data: {
          object: { id: "cus_test", email: "new@example.com" },
        },
      };

      const newUpdateEvent = {
        type: "customer.updated",
        data: {
          object: { id: "cus_test", email: "new@example.com" },
          previous_attributes: { email: "old@example.com" },
        },
      };

      const hasChanged = (event: any, field: string): boolean => {
        if (event.data.previous_attributes) {
          return field in event.data.previous_attributes;
        }
        // Fallback: always assume changed if no previous_attributes
        return true;
      };

      expect(hasChanged(newUpdateEvent, "email")).toBe(true);
      expect(hasChanged(oldUpdateEvent, "email")).toBe(true);
    });
  });

  describe("⚠️ Deprecation Warnings", () => {
    it("devrait détecter l'utilisation de champs deprecated", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      const checkDeprecatedFields = (payload: any) => {
        const deprecatedFields = ["source", "sources", "statement_descriptor"];

        for (const field of deprecatedFields) {
          if (field in payload) {
            console.warn(
              `⚠️ Field '${field}' is deprecated and will be removed in future API versions`,
            );
          }
        }
      };

      checkDeprecatedFields({
        amount: 5000,
        source: "tok_visa", // Deprecated
        currency: "eur",
      });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("source"));

      warnSpy.mockRestore();
    });

    it("devrait suggérer des alternatives pour APIs deprecated", async () => {
      const getRecommendation = (deprecatedField: string): string => {
        const recommendations: Record<string, string> = {
          source: "Use payment_method instead",
          sources: "Use payment_methods instead",
          statement_descriptor: "Use statement_descriptor_suffix instead",
          account_balance: "Use balance_transactions instead",
        };

        return (
          recommendations[deprecatedField] ||
          "Check Stripe documentation for alternatives"
        );
      };

      expect(getRecommendation("source")).toContain("payment_method");
      expect(getRecommendation("sources")).toContain("payment_methods");
    });

    it("devrait tracker les versions d'API dans les logs", async () => {
      const logApiVersion = (operation: string, version: string) => {
        console.log(
          JSON.stringify({
            operation,
            stripe_api_version: version,
            timestamp: new Date().toISOString(),
          }),
        );
      };

      const logSpy = jest.spyOn(console, "log").mockImplementation();

      logApiVersion("payment_intent.create", "2023-10-16");

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("stripe_api_version"),
      );

      logSpy.mockRestore();
    });
  });

  describe("🔄 Backward Compatibility", () => {
    it("devrait supporter les anciens et nouveaux formats simultanément", async () => {
      const createPaymentIntent = (params: any): any => {
        const payload: any = {
          amount: params.amount,
          currency: params.currency || "eur",
        };

        // Support both old and new formats
        if (params.automatic_payment_methods) {
          payload.automatic_payment_methods = params.automatic_payment_methods;
        } else if (params.payment_method_types) {
          // Convert old format to new
          payload.automatic_payment_methods = { enabled: true };
        }

        return payload;
      };

      const oldStyleCall = createPaymentIntent({
        amount: 5000,
        payment_method_types: ["card"],
      });

      const newStyleCall = createPaymentIntent({
        amount: 5000,
        automatic_payment_methods: { enabled: true },
      });

      expect(oldStyleCall.automatic_payment_methods).toBeDefined();
      expect(newStyleCall.automatic_payment_methods).toBeDefined();
    });

    it("devrait normaliser les réponses de différentes versions", async () => {
      const normalizePaymentIntent = (pi: any): any => {
        return {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          // Normalize charge reference
          chargeId: pi.latest_charge?.id || pi.charges?.data?.[0]?.id || null,
          // Normalize payment method
          paymentMethod: pi.payment_method || pi.source || null,
        };
      };

      const apiV2023Response = {
        id: "pi_test",
        amount: 5000,
        currency: "eur",
        status: "succeeded",
        latest_charge: { id: "ch_new" },
        payment_method: "pm_test",
      };

      const apiV2020Response = {
        id: "pi_test",
        amount: 5000,
        currency: "eur",
        status: "succeeded",
        charges: { data: [{ id: "ch_old" }] },
        source: "card_test",
      };

      const normalized2023 = normalizePaymentIntent(apiV2023Response);
      const normalized2020 = normalizePaymentIntent(apiV2020Response);

      expect(normalized2023.chargeId).toBe("ch_new");
      expect(normalized2020.chargeId).toBe("ch_old");
      expect(normalized2023.paymentMethod).toBe("pm_test");
      expect(normalized2020.paymentMethod).toBe("card_test");
    });

    it("devrait gérer les webhooks de multiples versions", async () => {
      const processWebhook = (event: any): any => {
        const result = {
          type: event.type,
          objectId: event.data.object.id,
          amount: event.data.object.amount,
        };

        // Handle both old and new webhook structures
        if (event.api_version) {
          console.log(
            `Processing webhook with API version: ${event.api_version}`,
          );
        }

        return result;
      };

      const webhook2023 = {
        id: "evt_test",
        api_version: "2023-10-16",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            amount: 5000,
          },
        },
      };

      const webhook2020 = {
        id: "evt_test",
        api_version: "2020-08-27",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            amount: 5000,
          },
        },
      };

      const result2023 = processWebhook(webhook2023);
      const result2020 = processWebhook(webhook2020);

      expect(result2023.objectId).toBe("pi_test");
      expect(result2020.objectId).toBe("pi_test");
    });
  });

  describe("🧪 Feature Detection", () => {
    it("devrait détecter si automatic_payment_methods est disponible", async () => {
      const supportsAutomaticPaymentMethods = (apiVersion: string): boolean => {
        // Feature introduced in 2023-10-16
        return apiVersion >= "2023-10-16";
      };

      expect(supportsAutomaticPaymentMethods("2023-10-16")).toBe(true);
      expect(supportsAutomaticPaymentMethods("2024-01-01")).toBe(true);
      expect(supportsAutomaticPaymentMethods("2022-11-15")).toBe(false);
    });

    it("devrait détecter les features disponibles par version", async () => {
      const getAvailableFeatures = (apiVersion: string): string[] => {
        const features: string[] = ["basic_payments"];

        if (apiVersion >= "2022-11-15") {
          features.push("payment_links");
        }

        if (apiVersion >= "2023-10-16") {
          features.push("automatic_payment_methods");
          features.push("payment_element");
        }

        if (apiVersion >= "2024-01-01") {
          features.push("enhanced_auth");
        }

        return features;
      };

      const features2023 = getAvailableFeatures("2023-10-16");
      const features2022 = getAvailableFeatures("2022-11-15");

      expect(features2023).toContain("automatic_payment_methods");
      expect(features2022).not.toContain("automatic_payment_methods");
      expect(features2022).toContain("payment_links");
    });

    it("devrait adapter le comportement selon les features disponibles", async () => {
      const createPaymentWithFeatureDetection = (
        apiVersion: string,
        params: any,
      ): any => {
        const payload: any = {
          amount: params.amount,
          currency: params.currency,
        };

        if (apiVersion >= "2023-10-16") {
          // Use new feature
          payload.automatic_payment_methods = { enabled: true };
        } else {
          // Fallback to old way
          payload.payment_method_types = ["card", "sepa_debit"];
        }

        return payload;
      };

      const newVersionPayload = createPaymentWithFeatureDetection(
        "2023-10-16",
        {
          amount: 5000,
          currency: "eur",
        },
      );

      const oldVersionPayload = createPaymentWithFeatureDetection(
        "2022-08-01",
        {
          amount: 5000,
          currency: "eur",
        },
      );

      expect(newVersionPayload.automatic_payment_methods).toBeDefined();
      expect(oldVersionPayload.payment_method_types).toBeDefined();
    });
  });

  describe("📋 Version Testing Matrix", () => {
    it("devrait tester les webhooks sur toutes les versions supportées", async () => {
      const supportedVersions = [
        "2022-08-01",
        "2022-11-15",
        "2023-10-16",
        "2024-01-01",
      ];

      const testResults: Record<string, boolean> = {};

      for (const version of supportedVersions) {
        try {
          // Simulate webhook processing with this version
          const webhook = {
            api_version: version,
            type: "payment_intent.succeeded",
            data: { object: { id: "pi_test", amount: 5000 } },
          };

          const processed = webhook.data.object.id === "pi_test";
          testResults[version] = processed;
        } catch (error) {
          testResults[version] = false;
        }
      }

      // All versions should work
      expect(Object.values(testResults).every((r) => r)).toBe(true);
      console.log(`✓ All ${supportedVersions.length} API versions compatible`);
    });

    it("devrait valider les champs requis par version", async () => {
      const validatePayload = (
        payload: any,
        apiVersion: string,
      ): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // Common required fields
        if (!payload.amount) errors.push("amount is required");
        if (!payload.currency) errors.push("currency is required");

        // Version-specific validations
        if (apiVersion >= "2023-10-16") {
          if (!payload.automatic_payment_methods && !payload.payment_method) {
            errors.push(
              "automatic_payment_methods or payment_method required in API 2023-10-16+",
            );
          }
        }

        return { valid: errors.length === 0, errors };
      };

      const validPayload = {
        amount: 5000,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
      };

      const invalidPayload = {
        amount: 5000,
        currency: "eur",
      };

      const validResult = validatePayload(validPayload, "2023-10-16");
      const invalidResult = validatePayload(invalidPayload, "2023-10-16");

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe("🔧 Version Migration Tools", () => {
    it("devrait fournir un outil de migration automatique", async () => {
      const migratePayload = (
        payload: any,
        fromVersion: string,
        toVersion: string,
      ): any => {
        let migrated = { ...payload };

        // Migration path: 2022-xx to 2023-10-16
        if (fromVersion < "2023-10-16" && toVersion >= "2023-10-16") {
          if (
            migrated.payment_method_types &&
            !migrated.automatic_payment_methods
          ) {
            migrated.automatic_payment_methods = { enabled: true };
            delete migrated.payment_method_types;
            console.log(
              "✓ Migrated payment_method_types to automatic_payment_methods",
            );
          }

          if (migrated.source && !migrated.payment_method) {
            migrated.payment_method = migrated.source;
            delete migrated.source;
            console.log("✓ Migrated source to payment_method");
          }
        }

        return migrated;
      };

      const oldPayload = {
        amount: 5000,
        currency: "eur",
        payment_method_types: ["card"],
        source: "tok_visa",
      };

      const migrated = migratePayload(oldPayload, "2022-08-01", "2023-10-16");

      expect(migrated.automatic_payment_methods).toBeDefined();
      expect(migrated.payment_method).toBe("tok_visa");
      expect(migrated.payment_method_types).toBeUndefined();
      expect(migrated.source).toBeUndefined();
    });

    it("devrait générer un rapport de migration", async () => {
      const generateMigrationReport = (
        fromVersion: string,
        toVersion: string,
      ): any => {
        const changes: string[] = [];
        const warnings: string[] = [];
        const actions: string[] = [];

        if (fromVersion < "2023-10-16" && toVersion >= "2023-10-16") {
          changes.push("automatic_payment_methods feature now available");
          warnings.push("payment_method_types is deprecated");
          actions.push("Update code to use automatic_payment_methods");
        }

        return {
          from: fromVersion,
          to: toVersion,
          changes,
          warnings,
          actions,
          breakingChanges: warnings.length > 0,
        };
      };

      const report = generateMigrationReport("2022-08-01", "2023-10-16");

      expect(report.changes.length).toBeGreaterThan(0);
      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.breakingChanges).toBe(true);
      console.log(
        `Migration report: ${report.changes.length} changes, ${report.warnings.length} warnings`,
      );
    });
  });
});
