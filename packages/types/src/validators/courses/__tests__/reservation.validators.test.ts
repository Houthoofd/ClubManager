/**
 * Tests pour les validators de réservations de cours
 * Test de tous les schémas Zod dans reservation.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  createReservationSchema,
  cancelReservationSchema,
  searchReservationSchema,
  checkAvailabilitySchema,
  getUserReservationsSchema,
  getCourseReservationsSchema,
  convertReservationToInscriptionSchema,
  checkReservationConflictSchema,
} from "../reservation.validators.js";

describe("Reservation Validators", () => {
  describe("createReservationSchema", () => {
    it("devrait valider une réservation valide", () => {
      const validReservation = {
        utilisateur_id: 1,
        cours_id: 2,
      };
      const result = createReservationSchema.safeParse(validReservation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.cours_id).toBe(2);
      }
    });

    it("devrait valider avec des IDs élevés", () => {
      const validReservation = {
        utilisateur_id: 999999,
        cours_id: 888888,
      };
      const result = createReservationSchema.safeParse(validReservation);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidReservation = {
        cours_id: 2,
      };
      const result = createReservationSchema.safeParse(invalidReservation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter si cours_id est manquant", () => {
      const invalidReservation = {
        utilisateur_id: 1,
      };
      const result = createReservationSchema.safeParse(invalidReservation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_id");
      }
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidReservation = {
        utilisateur_id: 0,
        cours_id: 2,
      };
      const result = createReservationSchema.safeParse(invalidReservation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si cours_id est négatif", () => {
      const invalidReservation = {
        utilisateur_id: 1,
        cours_id: -5,
      };
      const result = createReservationSchema.safeParse(invalidReservation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est une string", () => {
      const invalidReservation = {
        utilisateur_id: "1",
        cours_id: 2,
      };
      const result = createReservationSchema.safeParse(invalidReservation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si cours_id est une string", () => {
      const invalidReservation = {
        utilisateur_id: 1,
        cours_id: "2",
      };
      const result = createReservationSchema.safeParse(invalidReservation);
      expect(result.success).toBe(false);
    });
  });

  describe("cancelReservationSchema", () => {
    it("devrait valider une annulation valide avec raison", () => {
      const validCancel = {
        id: 1,
        raison_annulation:
          "Je ne peux plus participer au cours pour raisons personnelles.",
      };
      const result = cancelReservationSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.raison_annulation).toBe(
          "Je ne peux plus participer au cours pour raisons personnelles.",
        );
      }
    });

    it("devrait valider une annulation sans raison (optionnelle)", () => {
      const validCancel = {
        id: 1,
      };
      const result = cancelReservationSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait valider une raison de 10 caractères exactement", () => {
      const validCancel = {
        id: 1,
        raison_annulation: "1234567890",
      };
      const result = cancelReservationSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une raison trop courte (< 10 caractères)", () => {
      const invalidCancel = {
        id: 1,
        raison_annulation: "Court",
      };
      const result = cancelReservationSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "au moins 10 caractères",
        );
      }
    });

    it("devrait rejeter une raison de 9 caractères", () => {
      const invalidCancel = {
        id: 1,
        raison_annulation: "123456789",
      };
      const result = cancelReservationSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une raison trop longue (> 500 caractères)", () => {
      const longReason = "a".repeat(501);
      const invalidCancel = {
        id: 1,
        raison_annulation: longReason,
      };
      const result = cancelReservationSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("500 caractères");
      }
    });

    it("devrait valider une raison de 500 caractères exactement", () => {
      const maxReason = "a".repeat(500);
      const validCancel = {
        id: 1,
        raison_annulation: maxReason,
      };
      const result = cancelReservationSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidCancel = {
        raison_annulation: "Raison valide pour annuler",
      };
      const result = cancelReservationSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidCancel = {
        id: 0,
        raison_annulation: "Raison valide pour annuler",
      };
      const result = cancelReservationSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidCancel = {
        id: -1,
        raison_annulation: "Raison valide pour annuler",
      };
      const result = cancelReservationSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });
  });

  describe("searchReservationSchema", () => {
    it("devrait valider une recherche avec tous les paramètres", () => {
      const validSearch = {
        utilisateur_id: 1,
        cours_id: 2,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        status: "active" as const,
        sort_by: "created_at" as const,
        sort_order: "desc" as const,
        page: 1,
        limit: 10,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.cours_id).toBe(2);
        expect(result.data.status).toBe("active");
      }
    });

    it("devrait valider une recherche minimale (sans filtres)", () => {
      const validSearch = {};
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      // Les valeurs par défaut sont appliquées seulement si explicitement passées comme undefined
      // ou si le schéma utilise .default() sur les champs individuels, pas sur .optional()
    });

    it("devrait valider avec status 'cancelled'", () => {
      const validSearch = {
        status: "cancelled" as const,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec status 'converted'", () => {
      const validSearch = {
        status: "converted" as const,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by 'date_cours'", () => {
      const validSearch = {
        sort_by: "date_cours" as const,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by 'utilisateur_id'", () => {
      const validSearch = {
        sort_by: "utilisateur_id" as const,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order 'asc'", () => {
      const validSearch = {
        sort_order: "asc" as const,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validSearch = {
        utilisateur_id: 5,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement cours_id", () => {
      const validSearch = {
        cours_id: 10,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une plage de dates valide", () => {
      const validSearch = {
        date_debut: "2024-01-01",
        date_fin: "2024-06-30",
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider quand date_debut et date_fin sont identiques", () => {
      const validSearch = {
        date_debut: "2024-03-15",
        date_fin: "2024-03-15",
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si date_fin est avant date_debut", () => {
      const invalidSearch = {
        date_debut: "2024-12-31",
        date_fin: "2024-01-01",
      };
      const result = searchReservationSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "date de fin doit être supérieure ou égale",
        );
      }
    });

    it("devrait rejeter un status invalide", () => {
      const invalidSearch = {
        status: "pending",
      };
      const result = searchReservationSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("active");
      }
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidSearch = {
        sort_by: "name",
      };
      const result = searchReservationSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidSearch = {
        sort_order: "random",
      };
      const result = searchReservationSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidSearch = {
        date_debut: "not-a-date",
      };
      const result = searchReservationSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidSearch = {
        date_fin: "2024/01/01",
      };
      const result = searchReservationSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec pagination personnalisée", () => {
      const validSearch = {
        page: 5,
        limit: 50,
      };
      const result = searchReservationSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidSearch = {
        page: 0,
      };
      const result = searchReservationSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit dépasse 100", () => {
      const invalidSearch = {
        limit: 101,
      };
      const result = searchReservationSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });
  });

  describe("checkAvailabilitySchema", () => {
    it("devrait valider une vérification de disponibilité avec cours_id", () => {
      const validCheck = {
        cours_id: 1,
      };
      const result = checkAvailabilitySchema.safeParse(validCheck);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_id).toBe(1);
      }
    });

    it("devrait valider avec cours_id et utilisateur_id", () => {
      const validCheck = {
        cours_id: 1,
        utilisateur_id: 5,
      };
      const result = checkAvailabilitySchema.safeParse(validCheck);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_id).toBe(1);
        expect(result.data.utilisateur_id).toBe(5);
      }
    });

    it("devrait valider avec seulement cours_id (utilisateur_id optionnel)", () => {
      const validCheck = {
        cours_id: 10,
      };
      const result = checkAvailabilitySchema.safeParse(validCheck);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si cours_id est manquant", () => {
      const invalidCheck = {
        utilisateur_id: 1,
      };
      const result = checkAvailabilitySchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_id");
      }
    });

    it("devrait rejeter si cours_id est 0", () => {
      const invalidCheck = {
        cours_id: 0,
      };
      const result = checkAvailabilitySchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si cours_id est négatif", () => {
      const invalidCheck = {
        cours_id: -1,
      };
      const result = checkAvailabilitySchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidCheck = {
        cours_id: 1,
        utilisateur_id: 0,
      };
      const result = checkAvailabilitySchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec des IDs élevés", () => {
      const validCheck = {
        cours_id: 999999,
        utilisateur_id: 888888,
      };
      const result = checkAvailabilitySchema.safeParse(validCheck);
      expect(result.success).toBe(true);
    });
  });

  describe("getUserReservationsSchema", () => {
    it("devrait valider une requête avec tous les paramètres", () => {
      const validRequest = {
        utilisateur_id: 1,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        status: "active" as const,
        page: 1,
        limit: 20,
      };
      const result = getUserReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.status).toBe("active");
      }
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validRequest = {
        utilisateur_id: 1,
      };
      const result = getUserReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec utilisateur_id et status", () => {
      const validRequest = {
        utilisateur_id: 1,
        status: "cancelled" as const,
      };
      const result = getUserReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec status 'converted'", () => {
      const validRequest = {
        utilisateur_id: 1,
        status: "converted" as const,
      };
      const result = getUserReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plage de dates", () => {
      const validRequest = {
        utilisateur_id: 1,
        date_debut: "2024-03-01",
        date_fin: "2024-03-31",
      };
      const result = getUserReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidRequest = {
        status: "active",
      };
      const result = getUserReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidRequest = {
        utilisateur_id: 0,
      };
      const result = getUserReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidRequest = {
        utilisateur_id: -5,
      };
      const result = getUserReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un status invalide", () => {
      const invalidRequest = {
        utilisateur_id: 1,
        status: "pending",
      };
      const result = getUserReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidRequest = {
        utilisateur_id: 1,
        date_debut: "invalid-date",
      };
      const result = getUserReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec pagination", () => {
      const validRequest = {
        utilisateur_id: 1,
        page: 3,
        limit: 25,
      };
      const result = getUserReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidRequest = {
        utilisateur_id: 1,
        page: 0,
      };
      const result = getUserReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit dépasse 100", () => {
      const invalidRequest = {
        utilisateur_id: 1,
        limit: 150,
      };
      const result = getUserReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("getCourseReservationsSchema", () => {
    it("devrait valider une requête avec tous les paramètres", () => {
      const validRequest = {
        cours_id: 1,
        status: "active" as const,
        page: 1,
        limit: 20,
      };
      const result = getCourseReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_id).toBe(1);
        expect(result.data.status).toBe("active");
      }
    });

    it("devrait valider avec seulement cours_id", () => {
      const validRequest = {
        cours_id: 1,
      };
      const result = getCourseReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec status 'cancelled'", () => {
      const validRequest = {
        cours_id: 1,
        status: "cancelled" as const,
      };
      const result = getCourseReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec status 'converted'", () => {
      const validRequest = {
        cours_id: 1,
        status: "converted" as const,
      };
      const result = getCourseReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec pagination personnalisée", () => {
      const validRequest = {
        cours_id: 1,
        page: 2,
        limit: 30,
      };
      const result = getCourseReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si cours_id est manquant", () => {
      const invalidRequest = {
        status: "active",
      };
      const result = getCourseReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_id");
      }
    });

    it("devrait rejeter si cours_id est 0", () => {
      const invalidRequest = {
        cours_id: 0,
      };
      const result = getCourseReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si cours_id est négatif", () => {
      const invalidRequest = {
        cours_id: -1,
      };
      const result = getCourseReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un status invalide", () => {
      const invalidRequest = {
        cours_id: 1,
        status: "pending",
      };
      const result = getCourseReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidRequest = {
        cours_id: 1,
        page: 0,
      };
      const result = getCourseReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit est négatif", () => {
      const invalidRequest = {
        cours_id: 1,
        limit: -10,
      };
      const result = getCourseReservationsSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec des IDs élevés", () => {
      const validRequest = {
        cours_id: 999999,
      };
      const result = getCourseReservationsSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe("convertReservationToInscriptionSchema", () => {
    it("devrait valider une conversion valide avec tous les paramètres", () => {
      const validConversion = {
        reservation_id: 1,
        status_id: 2,
        commentaire: "Conversion automatique après paiement",
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(validConversion);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reservation_id).toBe(1);
        expect(result.data.status_id).toBe(2);
        expect(result.data.commentaire).toBe(
          "Conversion automatique après paiement",
        );
      }
    });

    it("devrait valider avec seulement reservation_id", () => {
      const validConversion = {
        reservation_id: 1,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(validConversion);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec status_id null", () => {
      const validConversion = {
        reservation_id: 1,
        status_id: null,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(validConversion);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec commentaire optionnel", () => {
      const validConversion = {
        reservation_id: 1,
        commentaire: "Inscription validée",
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(validConversion);
      expect(result.success).toBe(true);
    });

    it("devrait valider un commentaire de 1 caractère", () => {
      const validConversion = {
        reservation_id: 1,
        commentaire: "A",
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(validConversion);
      expect(result.success).toBe(true);
    });

    it("devrait valider un commentaire de 1000 caractères exactement", () => {
      const maxCommentaire = "a".repeat(1000);
      const validConversion = {
        reservation_id: 1,
        commentaire: maxCommentaire,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(validConversion);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un commentaire vide", () => {
      const invalidConversion = {
        reservation_id: 1,
        commentaire: "",
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(invalidConversion);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "au moins 1 caractère",
        );
      }
    });

    it("devrait rejeter un commentaire trop long (> 1000 caractères)", () => {
      const longCommentaire = "a".repeat(1001);
      const invalidConversion = {
        reservation_id: 1,
        commentaire: longCommentaire,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(invalidConversion);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1000 caractères");
      }
    });

    it("devrait rejeter si reservation_id est manquant", () => {
      const invalidConversion = {
        status_id: 2,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(invalidConversion);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("reservation_id");
      }
    });

    it("devrait rejeter si reservation_id est 0", () => {
      const invalidConversion = {
        reservation_id: 0,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(invalidConversion);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si reservation_id est négatif", () => {
      const invalidConversion = {
        reservation_id: -1,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(invalidConversion);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si status_id est 0", () => {
      const invalidConversion = {
        reservation_id: 1,
        status_id: 0,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(invalidConversion);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si status_id est négatif", () => {
      const invalidConversion = {
        reservation_id: 1,
        status_id: -5,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(invalidConversion);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec des IDs élevés", () => {
      const validConversion = {
        reservation_id: 999999,
        status_id: 888888,
      };
      const result =
        convertReservationToInscriptionSchema.safeParse(validConversion);
      expect(result.success).toBe(true);
    });
  });

  describe("checkReservationConflictSchema", () => {
    it("devrait valider une vérification de conflit valide", () => {
      const validCheck = {
        utilisateur_id: 1,
        cours_id: 2,
        date_cours: "2024-06-15",
      };
      const result = checkReservationConflictSchema.safeParse(validCheck);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.cours_id).toBe(2);
        expect(result.data.date_cours).toBe("2024-06-15");
      }
    });

    it("devrait valider avec une autre date valide", () => {
      const validCheck = {
        utilisateur_id: 1,
        cours_id: 2,
        date_cours: "2024-12-25",
      };
      const result = checkReservationConflictSchema.safeParse(validCheck);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date au format ISO standard", () => {
      const validCheck = {
        utilisateur_id: 1,
        cours_id: 2,
        date_cours: "2024-01-01",
      };
      const result = checkReservationConflictSchema.safeParse(validCheck);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date seulement (sans heure)", () => {
      const validCheck = {
        utilisateur_id: 1,
        cours_id: 2,
        date_cours: "2024-06-15",
      };
      const result = checkReservationConflictSchema.safeParse(validCheck);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidCheck = {
        cours_id: 2,
        date_cours: "2024-06-15T10:00:00Z",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter si cours_id est manquant", () => {
      const invalidCheck = {
        utilisateur_id: 1,
        date_cours: "2024-06-15T10:00:00Z",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_id");
      }
    });

    it("devrait rejeter si date_cours est manquante", () => {
      const invalidCheck = {
        utilisateur_id: 1,
        cours_id: 2,
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_cours");
      }
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidCheck = {
        utilisateur_id: 0,
        cours_id: 2,
        date_cours: "2024-06-15T10:00:00Z",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si cours_id est négatif", () => {
      const invalidCheck = {
        utilisateur_id: 1,
        cours_id: -2,
        date_cours: "2024-06-15T10:00:00Z",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide", () => {
      const invalidCheck = {
        utilisateur_id: 1,
        cours_id: 2,
        date_cours: "not-a-date",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date au format incorrect", () => {
      const invalidCheck = {
        utilisateur_id: 1,
        cours_id: 2,
        date_cours: "15/06/2024",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date avec format américain", () => {
      const invalidCheck = {
        utilisateur_id: 1,
        cours_id: 2,
        date_cours: "06/15/2024",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec des IDs élevés", () => {
      const validCheck = {
        utilisateur_id: 999999,
        cours_id: 888888,
        date_cours: "2024-12-31",
      };
      const result = checkReservationConflictSchema.safeParse(validCheck);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est une string", () => {
      const invalidCheck = {
        utilisateur_id: "1",
        cours_id: 2,
        date_cours: "2024-06-15",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si cours_id est une string", () => {
      const invalidCheck = {
        utilisateur_id: 1,
        cours_id: "2",
        date_cours: "2024-06-15",
      };
      const result = checkReservationConflictSchema.safeParse(invalidCheck);
      expect(result.success).toBe(false);
    });
  });
});
