/**
 * Tests unitaires pour les validators Zod du domaine Paiements
 * @module __tests__/domains/paiements.validators.test
 */

import { describe, it, expect } from "@jest/globals";
import {
  // Main schemas
  PaiementSchema,
  EcheancePaiementSchema,
  CreerPaiementInputSchema,
  ValiderPaiementInputSchema,
  // Payment intent schemas
  createPaymentIntentEcheanceSchema,
  createPaymentIntentCommandeSchema,
  confirmEcheancePaymentSchema,
  confirmCommandePaymentSchema,
  // Query schemas
  getEcheanceByIdSchema,
  getHistoriqueSchema,
  getPaiementByIdSchema,
  paiementsFiltresSchema,
  statistiquesPaiementsSchema,
  statistiquesPaiementsUtilisateurSchema,
  // Action schemas
  creerPaiementSchema,
  validerPaiementSchema,
  refuserPaiementSchema,
  rembourserPaiementSchema,
  annulerPaiementSchema,
  // Helper function
  toStripeAmount,
} from "../validators.js";
import { MethodePaiement, StatutPaiement } from "../types.js";

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe("Paiements Validators - toStripeAmount", () => {
  it("should convert euros to cents", () => {
    expect(toStripeAmount(10)).toBe(1000);
    expect(toStripeAmount(25.5)).toBe(2550);
    expect(toStripeAmount(100)).toBe(10000);
  });

  it("should round to nearest cent", () => {
    expect(toStripeAmount(10.005)).toBe(1001);
    expect(toStripeAmount(10.004)).toBe(1000);
  });

  it("should handle zero", () => {
    expect(toStripeAmount(0)).toBe(0);
  });

  it("should handle small amounts", () => {
    expect(toStripeAmount(0.01)).toBe(1);
    expect(toStripeAmount(0.99)).toBe(99);
  });
});

// ============================================================================
// CREATE PAYMENT SCHEMAS TESTS
// ============================================================================

describe("Paiements Validators - creerPaiementSchema", () => {
  it("should validate valid payment creation", () => {
    const validPaiement = {
      utilisateurId: 1,
      montant: 50.0,
      methodePaiement: "carte_bancaire",
    };

    const result = creerPaiementSchema.safeParse(validPaiement);
    expect(result.success).toBe(true);
  });

  it("should accept optional commandeId", () => {
    const validPaiement = {
      commandeId: 10,
      utilisateurId: 1,
      montant: 50.0,
    };

    const result = creerPaiementSchema.safeParse(validPaiement);
    expect(result.success).toBe(true);
  });

  it("should accept optional description", () => {
    const validPaiement = {
      utilisateurId: 1,
      montant: 50.0,
      description: "Paiement mensuel",
    };

    const result = creerPaiementSchema.safeParse(validPaiement);
    expect(result.success).toBe(true);
  });

  it("should reject negative montant", () => {
    const invalid = {
      utilisateurId: 1,
      montant: -10,
    };

    const result = creerPaiementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject montant exceeding maximum", () => {
    const invalid = {
      utilisateurId: 1,
      montant: 1000000,
    };

    const result = creerPaiementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing utilisateurId", () => {
    const invalid = {
      montant: 50.0,
    };

    const result = creerPaiementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject zero montant", () => {
    const invalid = {
      utilisateurId: 1,
      montant: 0,
    };

    const result = creerPaiementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should accept maximum allowed montant", () => {
    const valid = {
      utilisateurId: 1,
      montant: 999999.99,
    };

    const result = creerPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe("Paiements Validators - CreerPaiementInputSchema", () => {
  it("should validate payment with Stripe", () => {
    const valid = {
      utilisateurId: 1,
      montant: 100,
      methodePaiement: MethodePaiement.STRIPE,
      stripePaymentIntentId: "pi_123abc",
    };

    const result = CreerPaiementInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate payment with PayPal", () => {
    const valid = {
      utilisateurId: 1,
      montant: 100,
      methodePaiement: MethodePaiement.PAYPAL,
      paypalOrderId: "ORDER-123",
    };

    const result = CreerPaiementInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate payment with Bitcoin", () => {
    const valid = {
      utilisateurId: 1,
      montant: 100,
      methodePaiement: MethodePaiement.BITCOIN,
      bitcoinAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    };

    const result = CreerPaiementInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// PAYMENT INTENT SCHEMAS TESTS
// ============================================================================

describe("Paiements Validators - createPaymentIntentEcheanceSchema", () => {
  it("should validate valid payment intent for echeance", () => {
    const valid = {
      amount: 50.0,
      echeanceId: 10,
      userId: 1,
    };

    const result = createPaymentIntentEcheanceSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing amount", () => {
    const invalid = {
      echeanceId: 10,
      userId: 1,
    };

    const result = createPaymentIntentEcheanceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject negative amount", () => {
    const invalid = {
      amount: -10,
      echeanceId: 10,
      userId: 1,
    };

    const result = createPaymentIntentEcheanceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject amount exceeding maximum", () => {
    const invalid = {
      amount: 1000000,
      echeanceId: 10,
      userId: 1,
    };

    const result = createPaymentIntentEcheanceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - createPaymentIntentCommandeSchema", () => {
  it("should validate valid payment intent for commande", () => {
    const valid = {
      amount: 100,
      commandeId: 5,
      userId: 1,
    };

    const result = createPaymentIntentCommandeSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing commandeId", () => {
    const invalid = {
      amount: 100,
      userId: 1,
    };

    const result = createPaymentIntentCommandeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - confirmEcheancePaymentSchema", () => {
  it("should validate valid Stripe payment intent ID", () => {
    const valid = {
      paymentIntentId: "pi_1234567890abcdef",
      echeanceId: 10,
      userId: 1,
      amount: 50.0,
    };

    const result = confirmEcheancePaymentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject payment intent ID not starting with pi_", () => {
    const invalid = {
      paymentIntentId: "invalid_123",
      echeanceId: 10,
      userId: 1,
      amount: 50.0,
    };

    const result = confirmEcheancePaymentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject short payment intent ID", () => {
    const invalid = {
      paymentIntentId: "pi_short",
      echeanceId: 10,
      userId: 1,
      amount: 50.0,
    };

    const result = confirmEcheancePaymentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject payment intent ID with invalid characters", () => {
    const invalid = {
      paymentIntentId: "pi_invalid@#$",
      echeanceId: 10,
      userId: 1,
      amount: 50.0,
    };

    const result = confirmEcheancePaymentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - confirmCommandePaymentSchema", () => {
  it("should validate valid payment confirmation", () => {
    const valid = {
      paymentIntentId: "pi_1234567890abcdef",
      commandeId: 5,
      userId: 1,
      amount: 100.0,
    };

    const result = confirmCommandePaymentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// PAYMENT VALIDATION SCHEMAS TESTS
// ============================================================================

describe("Paiements Validators - validerPaiementSchema", () => {
  it("should validate payment validation", () => {
    const valid = {
      paiementId: 10,
    };

    const result = validerPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should accept optional reference", () => {
    const valid = {
      paiementId: 10,
      referenceTransaction: "REF-123",
    };

    const result = validerPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject negative paiementId", () => {
    const invalid = {
      paiementId: -1,
    };

    const result = validerPaiementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject zero paiementId", () => {
    const invalid = {
      paiementId: 0,
    };

    const result = validerPaiementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - ValiderPaiementInputSchema", () => {
  it("should validate payment with reference", () => {
    const valid = {
      paiementId: 10,
      referenceTransaction: "TXN-ABC123",
    };

    const result = ValiderPaiementInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// PAYMENT ACTIONS SCHEMAS TESTS
// ============================================================================

describe("Paiements Validators - refuserPaiementSchema", () => {
  it("should validate payment refusal", () => {
    const valid = {
      paiementId: 10,
      raison: "Fonds insuffisants",
    };

    const result = refuserPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should accept without raison", () => {
    const valid = {
      paiementId: 10,
    };

    const result = refuserPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe("Paiements Validators - rembourserPaiementSchema", () => {
  it("should validate full refund", () => {
    const valid = {
      paiementId: 10,
    };

    const result = rembourserPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate partial refund", () => {
    const valid = {
      paiementId: 10,
      montant: 25.0,
      raison: "Remboursement partiel",
    };

    const result = rembourserPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject negative refund amount", () => {
    const invalid = {
      paiementId: 10,
      montant: -10,
    };

    const result = rembourserPaiementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - annulerPaiementSchema", () => {
  it("should validate payment cancellation", () => {
    const valid = {
      paiementId: 10,
      raison: "Annulation par le client",
    };

    const result = annulerPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// QUERY SCHEMAS TESTS
// ============================================================================

describe("Paiements Validators - getPaiementByIdSchema", () => {
  it("should validate payment retrieval by id", () => {
    const valid = {
      id: 10,
    };

    const result = getPaiementByIdSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject negative id", () => {
    const invalid = {
      id: -1,
    };

    const result = getPaiementByIdSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - getEcheanceByIdSchema", () => {
  it("should validate echeance retrieval", () => {
    const valid = {
      echeanceId: 10,
      userId: 1,
    };

    const result = getEcheanceByIdSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing userId", () => {
    const invalid = {
      echeanceId: 10,
    };

    const result = getEcheanceByIdSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - getHistoriqueSchema", () => {
  it("should validate history query with defaults", () => {
    const valid = {};

    const result = getHistoriqueSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(0);
    }
  });

  it("should validate with utilisateurId", () => {
    const valid = {
      utilisateurId: 1,
      limit: 20,
      offset: 10,
    };

    const result = getHistoriqueSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject limit exceeding maximum", () => {
    const invalid = {
      limit: 200,
    };

    const result = getHistoriqueSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject negative offset", () => {
    const invalid = {
      offset: -1,
    };

    const result = getHistoriqueSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - paiementsFiltresSchema", () => {
  it("should validate empty filters with defaults", () => {
    const valid = {};

    const result = paiementsFiltresSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(0);
    }
  });

  it("should validate complete filters", () => {
    const valid = {
      utilisateurId: 1,
      statut: "VALIDE",
      dateDebut: "2024-01-01",
      dateFin: "2024-12-31",
      abonnementId: 5,
      montantMin: 10,
      montantMax: 1000,
      limit: 50,
      offset: 20,
    };

    const result = paiementsFiltresSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject limit exceeding maximum", () => {
    const invalid = {
      limit: 101,
    };

    const result = paiementsFiltresSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject negative montantMin", () => {
    const invalid = {
      montantMin: -10,
    };

    const result = paiementsFiltresSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Paiements Validators - statistiquesPaiementsSchema", () => {
  it("should validate statistics query", () => {
    const valid = {
      dateDebut: "2024-01-01",
      dateFin: "2024-12-31",
    };

    const result = statistiquesPaiementsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should accept optional dates", () => {
    const valid = {};

    const result = statistiquesPaiementsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe("Paiements Validators - statistiquesPaiementsUtilisateurSchema", () => {
  it("should validate user statistics query", () => {
    const valid = {
      utilisateurId: 1,
    };

    const result = statistiquesPaiementsUtilisateurSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing utilisateurId", () => {
    const invalid = {};

    const result = statistiquesPaiementsUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject negative utilisateurId", () => {
    const invalid = {
      utilisateurId: -1,
    };

    const result = statistiquesPaiementsUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe("Paiements Validators - Edge Cases", () => {
  it("should handle decimal amounts correctly", () => {
    const amounts = [0.01, 10.99, 99.99, 999.99];

    amounts.forEach((montant) => {
      const result = creerPaiementSchema.safeParse({
        utilisateurId: 1,
        montant,
      });
      expect(result.success).toBe(true);
    });
  });

  it("should handle large valid payment intent IDs", () => {
    const longId = "pi_" + "a".repeat(100);
    const result = confirmEcheancePaymentSchema.safeParse({
      paymentIntentId: longId,
      echeanceId: 1,
      userId: 1,
      amount: 100.0,
    });
    expect(result.success).toBe(true);
  });

  it("should handle boundary amounts", () => {
    const valid = {
      utilisateurId: 1,
      montant: 999999.99,
    };

    const result = creerPaiementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should properly convert small amounts to Stripe cents", () => {
    expect(toStripeAmount(0.01)).toBe(1);
    expect(toStripeAmount(0.1)).toBe(10);
    expect(toStripeAmount(1.0)).toBe(100);
  });

  it("should handle various date formats in filters", () => {
    const dateFormats = ["2024-01-01", "2024-12-31", "2024-06-15"];

    dateFormats.forEach((date) => {
      const result = paiementsFiltresSchema.safeParse({
        dateDebut: date,
        dateFin: date,
      });
      expect(result.success).toBe(true);
    });
  });
});
