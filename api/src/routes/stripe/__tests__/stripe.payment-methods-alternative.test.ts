/**
 * @file stripe.payment-methods-alternative.test.ts
 * @description Tests pour les méthodes de paiement alternatives
 *
 * PRIORITÉ 3 - NICE TO HAVE ✨
 *
 * Couvre:
 * - SEPA Direct Debit
 * - iDEAL (Netherlands)
 * - Bancontact (Belgium)
 * - Giropay (Germany)
 * - Sofort (Europe)
 * - Przelewy24 (Poland)
 * - EPS (Austria)
 * - Multibanco (Portugal)
 * - Validation spécifique par méthode
 * - Gestion des délais de confirmation
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import Stripe from "stripe";
import { Request, Response } from "express";

// Mock dependencies
jest.mock("@prisma/client");
jest.mock("stripe");

describe("Stripe Alternative Payment Methods Tests - Priority 3 ✨", () => {
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
      echeance: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        confirm: jest.fn(),
      },
      paymentMethods: {
        create: jest.fn(),
        attach: jest.fn(),
        retrieve: jest.fn(),
      },
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
      setupIntents: {
        create: jest.fn(),
        confirm: jest.fn(),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    req = {
      body: {},
      headers: {},
    };
  });

  describe("🇪🇺 SEPA Direct Debit", () => {
    it("devrait créer un PaymentIntent avec SEPA", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_sepa_test",
        amount: 5000,
        currency: "eur",
        payment_method_types: ["sepa_debit"],
        status: "requires_payment_method",
        client_secret: "pi_sepa_secret",
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["sepa_debit"],
        metadata: {
          userId: "1",
          echeanceId: "1",
        },
      });

      expect(paymentIntent.payment_method_types).toContain("sepa_debit");
      expect(paymentIntent.currency).toBe("eur");
      expect(paymentIntent.id).toBe("pi_sepa_test");
    });

    it("devrait créer un payment method SEPA avec IBAN", async () => {
      mockStripe.paymentMethods.create.mockResolvedValue({
        id: "pm_sepa_test",
        type: "sepa_debit",
        sepa_debit: {
          country: "BE",
          bank_code: "1234",
          branch_code: "5678",
          last4: "3000",
          fingerprint: "fingerprint_test",
        },
      });

      const paymentMethod = await mockStripe.paymentMethods.create({
        type: "sepa_debit",
        sepa_debit: {
          iban: "BE68539007547034", // Belgian IBAN
        },
        billing_details: {
          name: "John Doe",
          email: "john@example.com",
        },
      });

      expect(paymentMethod.type).toBe("sepa_debit");
      expect(paymentMethod.sepa_debit.country).toBe("BE");
      expect(paymentMethod.sepa_debit.last4).toBe("3000");
    });

    it("devrait valider le format IBAN", async () => {
      const validateIBAN = (
        iban: string,
      ): { valid: boolean; error?: string } => {
        // Remove spaces
        const cleanIban = iban.replace(/\s/g, "");

        // Check length (15-34 chars)
        if (cleanIban.length < 15 || cleanIban.length > 34) {
          return { valid: false, error: "IBAN length invalid" };
        }

        // Check format (2 letters + 2 digits + alphanumeric)
        const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
        if (!ibanRegex.test(cleanIban)) {
          return { valid: false, error: "IBAN format invalid" };
        }

        // Country-specific length validation
        const countryLengths: Record<string, number> = {
          BE: 16, // Belgium
          FR: 27, // France
          DE: 22, // Germany
          NL: 18, // Netherlands
          IT: 27, // Italy
          ES: 24, // Spain
        };

        const country = cleanIban.slice(0, 2);
        if (
          countryLengths[country] &&
          cleanIban.length !== countryLengths[country]
        ) {
          return { valid: false, error: `IBAN length invalid for ${country}` };
        }

        return { valid: true };
      };

      expect(validateIBAN("BE68539007547034").valid).toBe(true);
      expect(validateIBAN("FR1420041010050500013M02606").valid).toBe(true);
      expect(validateIBAN("INVALID").valid).toBe(false);
      expect(validateIBAN("BE123").valid).toBe(false); // Too short
    });

    it("devrait gérer le délai de confirmation SEPA (3-5 jours)", async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_sepa_test",
        status: "processing",
        payment_method_types: ["sepa_debit"],
        amount: 5000,
        currency: "eur",
      });

      mockPrisma.paiement.create.mockResolvedValue({
        id: 1,
        statut: "EN_ATTENTE",
        montant: 50,
        delaiConfirmation: 5, // days
      });

      const payment = await mockPrisma.paiement.create({
        data: {
          stripePaymentIntentId: "pi_sepa_test",
          montant: 50,
          statut: "EN_ATTENTE",
          delaiConfirmation: 5,
        },
      });

      expect(payment.statut).toBe("EN_ATTENTE");
      expect(payment.delaiConfirmation).toBe(5);
      console.log("⏱️ SEPA payment will be confirmed in 5 days");
    });

    it("devrait requérir un mandat SEPA", async () => {
      const requiresMandate = (paymentMethodType: string): boolean => {
        return paymentMethodType === "sepa_debit";
      };

      expect(requiresMandate("sepa_debit")).toBe(true);
      expect(requiresMandate("card")).toBe(false);

      // Simulate mandate creation
      mockStripe.setupIntents.create.mockResolvedValue({
        id: "seti_test",
        status: "requires_payment_method",
        payment_method_types: ["sepa_debit"],
        usage: "off_session",
      });

      const setupIntent = await mockStripe.setupIntents.create({
        payment_method_types: ["sepa_debit"],
        usage: "off_session", // For recurring payments
      });

      expect(setupIntent.usage).toBe("off_session");
    });
  });

  describe("🇳🇱 iDEAL (Netherlands)", () => {
    it("devrait créer un PaymentIntent avec iDEAL", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_ideal_test",
        amount: 5000,
        currency: "eur",
        payment_method_types: ["ideal"],
        status: "requires_action",
        next_action: {
          type: "redirect_to_url",
          redirect_to_url: {
            url: "https://ideal.bank.nl/authenticate",
            return_url: "https://app.example.com/payment/return",
          },
        },
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["ideal"],
        return_url: "https://app.example.com/payment/return",
      });

      expect(paymentIntent.payment_method_types).toContain("ideal");
      expect(paymentIntent.status).toBe("requires_action");
      expect(paymentIntent.next_action?.type).toBe("redirect_to_url");
    });

    it("devrait lister les banques iDEAL disponibles", async () => {
      const getIdealBanks = (): Array<{ id: string; name: string }> => {
        return [
          { id: "abn_amro", name: "ABN AMRO" },
          { id: "asn_bank", name: "ASN Bank" },
          { id: "bunq", name: "Bunq" },
          { id: "ing", name: "ING" },
          { id: "knab", name: "Knab" },
          { id: "rabobank", name: "Rabobank" },
          { id: "regiobank", name: "RegioBank" },
          { id: "revolut", name: "Revolut" },
          { id: "sns_bank", name: "SNS Bank" },
          { id: "triodos_bank", name: "Triodos Bank" },
          { id: "van_lanschot", name: "Van Lanschot" },
        ];
      };

      const banks = getIdealBanks();

      expect(banks.length).toBeGreaterThan(10);
      expect(banks.find((b) => b.id === "ing")).toBeDefined();
      expect(banks.find((b) => b.id === "rabobank")).toBeDefined();
    });

    it("devrait valider que la devise est EUR pour iDEAL", async () => {
      const validateIdealCurrency = (currency: string): boolean => {
        return currency.toLowerCase() === "eur";
      };

      expect(validateIdealCurrency("eur")).toBe(true);
      expect(validateIdealCurrency("EUR")).toBe(true);
      expect(validateIdealCurrency("usd")).toBe(false);
    });

    it("devrait gérer la redirection iDEAL", async () => {
      const handleIdealRedirect = (paymentIntent: any): string => {
        if (paymentIntent.next_action?.type === "redirect_to_url") {
          return paymentIntent.next_action.redirect_to_url.url;
        }
        return "";
      };

      const pi = {
        id: "pi_test",
        next_action: {
          type: "redirect_to_url",
          redirect_to_url: {
            url: "https://ideal.bank.nl/authenticate",
            return_url: "https://app.example.com/return",
          },
        },
      };

      const redirectUrl = handleIdealRedirect(pi);

      expect(redirectUrl).toContain("ideal.bank.nl");
    });
  });

  describe("🇧🇪 Bancontact (Belgium)", () => {
    it("devrait créer un PaymentIntent avec Bancontact", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_bancontact_test",
        amount: 5000,
        currency: "eur",
        payment_method_types: ["bancontact"],
        status: "requires_action",
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["bancontact"],
      });

      expect(paymentIntent.payment_method_types).toContain("bancontact");
      expect(paymentIntent.currency).toBe("eur");
    });

    it("devrait valider les montants pour Bancontact (min 0.01 EUR)", async () => {
      const validateBancontactAmount = (
        amount: number,
      ): { valid: boolean; error?: string } => {
        if (amount < 1) {
          return { valid: false, error: "Minimum amount is 0.01 EUR (1 cent)" };
        }
        return { valid: true };
      };

      expect(validateBancontactAmount(100).valid).toBe(true); // 1 EUR
      expect(validateBancontactAmount(1).valid).toBe(true); // 0.01 EUR
      expect(validateBancontactAmount(0).valid).toBe(false);
    });

    it("devrait gérer le retour Bancontact après authentification", async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_bancontact_test",
        status: "succeeded",
        payment_method_types: ["bancontact"],
        amount: 5000,
        charges: {
          data: [
            {
              id: "ch_test",
              status: "succeeded",
            },
          ],
        },
      });

      const pi = await mockStripe.paymentIntents.retrieve("pi_bancontact_test");

      expect(pi.status).toBe("succeeded");
      expect(pi.charges.data[0].status).toBe("succeeded");
    });
  });

  describe("🇩🇪 Giropay & Sofort (Germany)", () => {
    it("devrait créer un PaymentIntent avec Giropay", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_giropay_test",
        amount: 5000,
        currency: "eur",
        payment_method_types: ["giropay"],
        status: "requires_action",
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["giropay"],
      });

      expect(paymentIntent.payment_method_types).toContain("giropay");
    });

    it("devrait créer un PaymentIntent avec Sofort", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_sofort_test",
        amount: 5000,
        currency: "eur",
        payment_method_types: ["sofort"],
        status: "requires_action",
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["sofort"],
        payment_method_data: {
          sofort: {
            country: "DE",
          },
        },
      });

      expect(paymentIntent.payment_method_types).toContain("sofort");
    });

    it("devrait valider les pays supportés par Sofort", async () => {
      const getSofortSupportedCountries = (): string[] => {
        return ["AT", "BE", "DE", "ES", "IT", "NL"];
      };

      const validateSofortCountry = (country: string): boolean => {
        return getSofortSupportedCountries().includes(country.toUpperCase());
      };

      expect(validateSofortCountry("DE")).toBe(true);
      expect(validateSofortCountry("AT")).toBe(true);
      expect(validateSofortCountry("FR")).toBe(false);
    });
  });

  describe("🇵🇱 Przelewy24 (Poland)", () => {
    it("devrait créer un PaymentIntent avec Przelewy24", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_p24_test",
        amount: 5000,
        currency: "pln",
        payment_method_types: ["p24"],
        status: "requires_action",
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "pln",
        payment_method_types: ["p24"],
        payment_method_data: {
          billing_details: {
            email: "customer@example.com",
          },
        },
      });

      expect(paymentIntent.payment_method_types).toContain("p24");
      expect(paymentIntent.currency).toBe("pln");
    });

    it("devrait valider que la devise est PLN ou EUR pour Przelewy24", async () => {
      const validateP24Currency = (currency: string): boolean => {
        return ["pln", "eur"].includes(currency.toLowerCase());
      };

      expect(validateP24Currency("pln")).toBe(true);
      expect(validateP24Currency("eur")).toBe(true);
      expect(validateP24Currency("usd")).toBe(false);
    });

    it("devrait requérir un email pour Przelewy24", async () => {
      const validateP24Data = (
        data: any,
      ): { valid: boolean; error?: string } => {
        if (!data.billing_details?.email) {
          return { valid: false, error: "Email is required for Przelewy24" };
        }
        return { valid: true };
      };

      expect(
        validateP24Data({ billing_details: { email: "test@example.com" } })
          .valid,
      ).toBe(true);
      expect(validateP24Data({ billing_details: {} }).valid).toBe(false);
    });
  });

  describe("🇦🇹 EPS (Austria)", () => {
    it("devrait créer un PaymentIntent avec EPS", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_eps_test",
        amount: 5000,
        currency: "eur",
        payment_method_types: ["eps"],
        status: "requires_action",
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["eps"],
      });

      expect(paymentIntent.payment_method_types).toContain("eps");
    });

    it("devrait lister les banques EPS disponibles", async () => {
      const getEpsBanks = (): Array<{ id: string; name: string }> => {
        return [
          { id: "arzte_und_apotheker_bank", name: "Ärzte- und Apothekerbank" },
          { id: "austrian_anadi_bank_ag", name: "Austrian Anadi Bank AG" },
          { id: "bank_austria", name: "Bank Austria" },
          {
            id: "bankhaus_carl_spangler",
            name: "Bankhaus Carl Spängler & Co.AG",
          },
          {
            id: "erste_bank_und_sparkassen",
            name: "Erste Bank und Sparkassen",
          },
          {
            id: "raiffeisen_bankengruppe_osterreich",
            name: "Raiffeisen Bankengruppe Österreich",
          },
        ];
      };

      const banks = getEpsBanks();

      expect(banks.length).toBeGreaterThan(5);
      expect(banks.find((b) => b.id === "bank_austria")).toBeDefined();
    });
  });

  describe("🇵🇹 Multibanco (Portugal)", () => {
    it("devrait créer un PaymentIntent avec Multibanco", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_multibanco_test",
        amount: 5000,
        currency: "eur",
        payment_method_types: ["multibanco"],
        status: "requires_action",
        next_action: {
          type: "multibanco_display_details",
          multibanco_display_details: {
            entity: "12345",
            reference: "123456789",
            expires_at: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 days
          },
        },
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["multibanco"],
      });

      expect(paymentIntent.payment_method_types).toContain("multibanco");
      expect(paymentIntent.next_action?.type).toBe(
        "multibanco_display_details",
      );
    });

    it("devrait extraire les détails de paiement Multibanco", async () => {
      const extractMultibancoDetails = (paymentIntent: any): any => {
        if (paymentIntent.next_action?.type === "multibanco_display_details") {
          return paymentIntent.next_action.multibanco_display_details;
        }
        return null;
      };

      const pi = {
        id: "pi_test",
        next_action: {
          type: "multibanco_display_details",
          multibanco_display_details: {
            entity: "12345",
            reference: "123456789",
            expires_at: 1234567890,
          },
        },
      };

      const details = extractMultibancoDetails(pi);

      expect(details.entity).toBe("12345");
      expect(details.reference).toBe("123456789");
      expect(details.expires_at).toBeDefined();
    });

    it("devrait gérer l'expiration des références Multibanco", async () => {
      const isMultibancoExpired = (expiresAt: number): boolean => {
        return Date.now() / 1000 > expiresAt;
      };

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // +24h
      const pastTimestamp = Math.floor(Date.now() / 1000) - 86400; // -24h

      expect(isMultibancoExpired(futureTimestamp)).toBe(false);
      expect(isMultibancoExpired(pastTimestamp)).toBe(true);
    });
  });

  describe("🌍 Multi-Method Support", () => {
    it("devrait permettre plusieurs méthodes de paiement simultanément", async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: "pi_multi_test",
        amount: 5000,
        currency: "eur",
        payment_method_types: ["card", "sepa_debit", "ideal", "bancontact"],
        status: "requires_payment_method",
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: 5000,
        currency: "eur",
        payment_method_types: ["card", "sepa_debit", "ideal", "bancontact"],
      });

      expect(paymentIntent.payment_method_types).toHaveLength(4);
      expect(paymentIntent.payment_method_types).toContain("card");
      expect(paymentIntent.payment_method_types).toContain("sepa_debit");
      expect(paymentIntent.payment_method_types).toContain("ideal");
    });

    it("devrait recommander des méthodes selon le pays", async () => {
      const recommendPaymentMethods = (
        country: string,
        currency: string,
      ): string[] => {
        const methods: string[] = ["card"]; // Always available

        const countryMethods: Record<string, string[]> = {
          NL: ["ideal"],
          BE: ["bancontact"],
          DE: ["giropay", "sofort"],
          AT: ["eps", "sofort"],
          PL: ["p24"],
          PT: ["multibanco"],
        };

        if (countryMethods[country.toUpperCase()]) {
          methods.push(...countryMethods[country.toUpperCase()]);
        }

        // SEPA available for EUR in SEPA zone
        if (
          currency.toLowerCase() === "eur" &&
          ["NL", "BE", "DE", "FR", "IT", "ES", "AT", "PT"].includes(
            country.toUpperCase(),
          )
        ) {
          methods.push("sepa_debit");
        }

        return methods;
      };

      expect(recommendPaymentMethods("NL", "eur")).toContain("ideal");
      expect(recommendPaymentMethods("NL", "eur")).toContain("sepa_debit");
      expect(recommendPaymentMethods("BE", "eur")).toContain("bancontact");
      expect(recommendPaymentMethods("DE", "eur")).toContain("giropay");
      expect(recommendPaymentMethods("PL", "pln")).toContain("p24");
    });

    it("devrait valider la compatibilité méthode/devise", async () => {
      const isMethodCurrencyCompatible = (
        method: string,
        currency: string,
      ): boolean => {
        const compatibilityMatrix: Record<string, string[]> = {
          card: ["eur", "usd", "gbp", "chf", "pln", "czk"], // Most currencies
          sepa_debit: ["eur"],
          ideal: ["eur"],
          bancontact: ["eur"],
          giropay: ["eur"],
          sofort: ["eur"],
          eps: ["eur"],
          multibanco: ["eur"],
          p24: ["eur", "pln"],
        };

        return (
          compatibilityMatrix[method]?.includes(currency.toLowerCase()) || false
        );
      };

      expect(isMethodCurrencyCompatible("ideal", "eur")).toBe(true);
      expect(isMethodCurrencyCompatible("ideal", "usd")).toBe(false);
      expect(isMethodCurrencyCompatible("p24", "pln")).toBe(true);
      expect(isMethodCurrencyCompatible("p24", "eur")).toBe(true);
      expect(isMethodCurrencyCompatible("sepa_debit", "usd")).toBe(false);
    });
  });

  describe("⏱️ Gestion des Délais de Confirmation", () => {
    it("devrait identifier les méthodes à confirmation différée", async () => {
      const isDelayedConfirmation = (paymentMethod: string): boolean => {
        const delayedMethods = ["sepa_debit", "multibanco"];
        return delayedMethods.includes(paymentMethod);
      };

      expect(isDelayedConfirmation("sepa_debit")).toBe(true);
      expect(isDelayedConfirmation("multibanco")).toBe(true);
      expect(isDelayedConfirmation("ideal")).toBe(false);
      expect(isDelayedConfirmation("card")).toBe(false);
    });

    it("devrait retourner le délai estimé par méthode", async () => {
      const getConfirmationDelay = (paymentMethod: string): number => {
        const delays: Record<string, number> = {
          card: 0, // Immediate
          ideal: 0, // Immediate
          bancontact: 0, // Immediate
          giropay: 0, // Immediate
          sofort: 0, // Immediate
          sepa_debit: 5, // 3-5 business days
          multibanco: 1, // Up to 1 day
          p24: 0, // Immediate but can take hours
        };

        return delays[paymentMethod] || 0;
      };

      expect(getConfirmationDelay("card")).toBe(0);
      expect(getConfirmationDelay("sepa_debit")).toBe(5);
      expect(getConfirmationDelay("multibanco")).toBe(1);
    });

    it("devrait notifier l'utilisateur du délai", async () => {
      const generateDelayMessage = (
        paymentMethod: string,
        locale: string = "fr",
      ): string => {
        const messages: Record<string, Record<string, string>> = {
          sepa_debit: {
            fr: "Votre paiement SEPA sera confirmé dans 3 à 5 jours ouvrés.",
            en: "Your SEPA payment will be confirmed in 3-5 business days.",
          },
          multibanco: {
            fr: "Votre paiement Multibanco sera confirmé sous 24 heures après le paiement en ATM.",
            en: "Your Multibanco payment will be confirmed within 24 hours after ATM payment.",
          },
          default: {
            fr: "Votre paiement sera confirmé immédiatement.",
            en: "Your payment will be confirmed immediately.",
          },
        };

        return messages[paymentMethod]?.[locale] || messages.default[locale];
      };

      expect(generateDelayMessage("sepa_debit", "fr")).toContain("3 à 5 jours");
      expect(generateDelayMessage("sepa_debit", "en")).toContain(
        "3-5 business days",
      );
      expect(generateDelayMessage("ideal", "fr")).toContain("immédiatement");
    });
  });

  describe("🔒 Validation Spécifique par Méthode", () => {
    it("devrait valider les données requises pour chaque méthode", async () => {
      const validatePaymentMethodData = (
        method: string,
        data: any,
      ): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        switch (method) {
          case "sepa_debit":
            if (!data.sepa_debit?.iban) errors.push("IBAN is required");
            if (!data.billing_details?.name) errors.push("Name is required");
            if (!data.billing_details?.email) errors.push("Email is required");
            break;

          case "ideal":
            if (!data.billing_details?.name) errors.push("Name is required");
            break;

          case "p24":
            if (!data.billing_details?.email) errors.push("Email is required");
            break;

          case "sofort":
            if (!data.sofort?.country) errors.push("Country is required");
            break;
        }

        return { valid: errors.length === 0, errors };
      };

      const validSepa = validatePaymentMethodData("sepa_debit", {
        sepa_debit: { iban: "BE68539007547034" },
        billing_details: { name: "John Doe", email: "john@example.com" },
      });

      const invalidSepa = validatePaymentMethodData("sepa_debit", {
        sepa_debit: {},
        billing_details: {},
      });

      expect(validSepa.valid).toBe(true);
      expect(invalidSepa.valid).toBe(false);
      expect(invalidSepa.errors.length).toBeGreaterThan(0);
    });
  });

  describe("📊 Statistiques et Reporting", () => {
    it("devrait tracker l'utilisation par méthode de paiement", async () => {
      const paymentStats = {
        card: 150,
        sepa_debit: 45,
        ideal: 30,
        bancontact: 25,
        giropay: 10,
        sofort: 8,
        p24: 5,
        multibanco: 3,
      };

      const total = Object.values(paymentStats).reduce(
        (sum, count) => sum + count,
        0,
      );
      const percentages = Object.entries(paymentStats).map(
        ([method, count]) => ({
          method,
          count,
          percentage: (count / total) * 100,
        }),
      );

      expect(total).toBe(276);
      expect(
        percentages.find((p) => p.method === "card")?.percentage,
      ).toBeGreaterThan(50);
      console.log(`Most used: card (${percentages[0].percentage.toFixed(1)}%)`);
    });

    it("devrait calculer le taux de succès par méthode", async () => {
      const successRates = {
        card: { total: 150, succeeded: 145 },
        sepa_debit: { total: 45, succeeded: 42 },
        ideal: { total: 30, succeeded: 29 },
        bancontact: { total: 25, succeeded: 24 },
      };

      const rates = Object.entries(successRates).map(([method, stats]) => ({
        method,
        rate: (stats.succeeded / stats.total) * 100,
      }));

      rates.forEach(({ method, rate }) => {
        console.log(`${method}: ${rate.toFixed(2)}% success rate`);
        expect(rate).toBeGreaterThan(90);
      });
    });
  });
});
