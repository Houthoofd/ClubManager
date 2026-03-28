/**
 * Tests pour les validators d'images du store
 * Test de tous les schémas Zod dans image.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  imageSchema,
  createImageSchema,
  updateImageSchema,
  imageIdParamSchema,
  imagesByArticleParamSchema,
  bulkImageSchema,
  reorderImagesSchema,
  bulkCreateImagesSchema,
} from "../image.validators.js";
import { IMAGE_CONSTRAINTS } from "../../../constants/store.constants.js";

describe("Image Validators", () => {
  describe("imageSchema", () => {
    it("devrait valider une image valide avec tous les champs", () => {
      const validImage = {
        id: 1,
        article_id: 10,
        url: "https://example.com/image.jpg",
        ordre: 1,
      };
      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.article_id).toBe(10);
        expect(result.data.url).toBe("https://example.com/image.jpg");
        expect(result.data.ordre).toBe(1);
      }
    });

    it("devrait valider avec ordre par défaut à 0", () => {
      const validImage = {
        id: 2,
        article_id: 20,
        url: "https://example.com/photo.png",
      };
      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ordre).toBe(0);
      }
    });

    it("devrait valider avec ordre à 0", () => {
      const validImage = {
        id: 3,
        article_id: 30,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ordre).toBe(0);
      }
    });

    it("devrait valider avec un grand nombre pour ordre", () => {
      const validImage = {
        id: 4,
        article_id: 40,
        url: "https://example.com/image.jpg",
        ordre: 999999,
      };
      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ordre).toBe(999999);
      }
    });

    it("devrait valider avec URL de longueur minimale (1 caractère)", () => {
      const validImage = {
        id: 5,
        article_id: 50,
        url: "https://a.co/i",
        ordre: 0,
      };
      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec URL de longueur maximale (255 caractères)", () => {
      const longUrl =
        "https://example.com/" + "a".repeat(235); // Total 255
      const validImage = {
        id: 6,
        article_id: 60,
        url: longUrl,
        ordre: 0,
      };
      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
    });

    it("devrait valider différents formats d'URL valides", () => {
      const urls = [
        "http://example.com/image.jpg",
        "https://example.com/image.png",
        "https://cdn.example.com/path/to/image.gif",
        "https://example.com/image?query=param",
        "https://example.com/image#fragment",
      ];

      urls.forEach((url) => {
        const validImage = {
          id: 7,
          article_id: 70,
          url,
          ordre: 0,
        };
        const result = imageSchema.safeParse(validImage);
        expect(result.success).toBe(true);
      });
    });

    it("devrait trim les espaces de l'URL", () => {
      const validImage = {
        id: 8,
        article_id: 80,
        url: "  https://example.com/image.jpg  ",
        ordre: 0,
      };
      const result = imageSchema.safeParse(validImage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://example.com/image.jpg");
      }
    });

    it("devrait rejeter une URL vide", () => {
      const invalidImage = {
        id: 9,
        article_id: 90,
        url: "",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("URL est requise");
      }
    });

    it("devrait rejeter une URL qui devient vide après trim", () => {
      const invalidImage = {
        id: 10,
        article_id: 100,
        url: "   ",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL trop longue (> 255 caractères)", () => {
      const longUrl =
        "https://example.com/" + "a".repeat(236); // Total 256
      const invalidImage = {
        id: 11,
        article_id: 110,
        url: longUrl,
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("255 caractères");
      }
    });

    it("devrait rejeter une URL invalide (pas de protocole)", () => {
      const invalidImage = {
        id: 12,
        article_id: 120,
        url: "example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("URL doit être valide");
      }
    });

    it("devrait rejeter une URL invalide (pas un URL)", () => {
      const invalidImage = {
        id: 13,
        article_id: 130,
        url: "not-a-url",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre négatif", () => {
      const invalidImage = {
        id: 14,
        article_id: 140,
        url: "https://example.com/image.jpg",
        ordre: -1,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("supérieur ou égal à 0");
      }
    });

    it("devrait rejeter un ordre décimal", () => {
      const invalidImage = {
        id: 15,
        article_id: 150,
        url: "https://example.com/image.jpg",
        ordre: 1.5,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nombre entier");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidImage = {
        article_id: 160,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const invalidImage = {
        id: 17,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si url est manquante", () => {
      const invalidImage = {
        id: 18,
        article_id: 180,
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidImage = {
        id: 0,
        article_id: 190,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidImage = {
        id: -1,
        article_id: 200,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0", () => {
      const invalidImage = {
        id: 21,
        article_id: 0,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est négatif", () => {
      const invalidImage = {
        id: 22,
        article_id: -1,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un id qui n'est pas un nombre", () => {
      const invalidImage = {
        id: "abc",
        article_id: 230,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id qui n'est pas un nombre", () => {
      const invalidImage = {
        id: 24,
        article_id: "abc",
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL qui n'est pas une string", () => {
      const invalidImage = {
        id: 25,
        article_id: 250,
        url: 12345,
        ordre: 0,
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre qui n'est pas un nombre", () => {
      const invalidImage = {
        id: 26,
        article_id: 260,
        url: "https://example.com/image.jpg",
        ordre: "abc",
      };
      const result = imageSchema.safeParse(invalidImage);
      expect(result.success).toBe(false);
    });
  });

  describe("createImageSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        article_id: 10,
        url: "https://example.com/image.jpg",
        ordre: 1,
      };
      const result = createImageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(10);
        expect(result.data.url).toBe("https://example.com/image.jpg");
        expect(result.data.ordre).toBe(1);
      }
    });

    it("devrait valider avec seulement article_id et url (ordre optionnel)", () => {
      const validCreate = {
        article_id: 20,
        url: "https://example.com/image.jpg",
      };
      const result = createImageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(20);
        expect(result.data.url).toBe("https://example.com/image.jpg");
        expect(result.data.ordre).toBeUndefined();
      }
    });

    it("devrait valider avec ordre à 0", () => {
      const validCreate = {
        article_id: 30,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ordre).toBe(0);
      }
    });

    it("devrait valider avec un grand nombre pour ordre", () => {
      const validCreate = {
        article_id: 40,
        url: "https://example.com/image.jpg",
        ordre: 999999,
      };
      const result = createImageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec URL de longueur minimale", () => {
      const validCreate = {
        article_id: 50,
        url: "https://a.co/i",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec URL de longueur maximale (255 caractères)", () => {
      const longUrl = "https://example.com/" + "a".repeat(235);
      const validCreate = {
        article_id: 60,
        url: longUrl,
        ordre: 0,
      };
      const result = createImageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces de l'URL", () => {
      const validCreate = {
        article_id: 70,
        url: "  https://example.com/image.jpg  ",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://example.com/image.jpg");
      }
    });

    it("devrait valider différents formats d'URL", () => {
      const urls = [
        "http://example.com/image.jpg",
        "https://example.com/image.png",
        "https://cdn.example.com/path/to/image.gif",
      ];

      urls.forEach((url) => {
        const validCreate = {
          article_id: 80,
          url,
        };
        const result = createImageSchema.safeParse(validCreate);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter si article_id est manquant", () => {
      const invalidCreate = {
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si url est manquante", () => {
      const invalidCreate = {
        article_id: 100,
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL vide", () => {
      const invalidCreate = {
        article_id: 110,
        url: "",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL qui devient vide après trim", () => {
      const invalidCreate = {
        article_id: 120,
        url: "   ",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL trop longue (> 255 caractères)", () => {
      const longUrl = "https://example.com/" + "a".repeat(236);
      const invalidCreate = {
        article_id: 130,
        url: longUrl,
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL invalide", () => {
      const invalidCreate = {
        article_id: 140,
        url: "not-a-url",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0", () => {
      const invalidCreate = {
        article_id: 0,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est négatif", () => {
      const invalidCreate = {
        article_id: -1,
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre négatif", () => {
      const invalidCreate = {
        article_id: 170,
        url: "https://example.com/image.jpg",
        ordre: -1,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre décimal", () => {
      const invalidCreate = {
        article_id: 180,
        url: "https://example.com/image.jpg",
        ordre: 1.5,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id qui n'est pas un nombre", () => {
      const invalidCreate = {
        article_id: "abc",
        url: "https://example.com/image.jpg",
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL qui n'est pas une string", () => {
      const invalidCreate = {
        article_id: 200,
        url: 12345,
        ordre: 0,
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre qui n'est pas un nombre", () => {
      const invalidCreate = {
        article_id: 210,
        url: "https://example.com/image.jpg",
        ordre: "abc",
      };
      const result = createImageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  describe("updateImageSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const validUpdate = {
        url: "https://example.com/new-image.jpg",
        ordre: 5,
      };
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://example.com/new-image.jpg");
        expect(result.data.ordre).toBe(5);
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validUpdate = {};
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement l'URL", () => {
      const validUpdate = {
        url: "https://example.com/updated.jpg",
      };
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://example.com/updated.jpg");
      }
    });

    it("devrait valider avec seulement l'ordre", () => {
      const validUpdate = {
        ordre: 10,
      };
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ordre).toBe(10);
      }
    });

    it("devrait valider avec ordre à 0", () => {
      const validUpdate = {
        ordre: 0,
      };
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ordre).toBe(0);
      }
    });

    it("devrait valider avec un grand nombre pour ordre", () => {
      const validUpdate = {
        ordre: 999999,
      };
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec URL de longueur minimale", () => {
      const validUpdate = {
        url: "https://a.co/i",
      };
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec URL de longueur maximale (255 caractères)", () => {
      const longUrl = "https://example.com/" + "a".repeat(235);
      const validUpdate = {
        url: longUrl,
      };
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces de l'URL", () => {
      const validUpdate = {
        url: "  https://example.com/image.jpg  ",
      };
      const result = updateImageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://example.com/image.jpg");
      }
    });

    it("devrait rejeter une URL vide", () => {
      const invalidUpdate = {
        url: "",
      };
      const result = updateImageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL qui devient vide après trim", () => {
      const invalidUpdate = {
        url: "   ",
      };
      const result = updateImageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL trop longue (> 255 caractères)", () => {
      const longUrl = "https://example.com/" + "a".repeat(236);
      const invalidUpdate = {
        url: longUrl,
      };
      const result = updateImageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL invalide", () => {
      const invalidUpdate = {
        url: "not-a-url",
      };
      const result = updateImageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre négatif", () => {
      const invalidUpdate = {
        ordre: -1,
      };
      const result = updateImageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre décimal", () => {
      const invalidUpdate = {
        ordre: 1.5,
      };
      const result = updateImageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL qui n'est pas une string", () => {
      const invalidUpdate = {
        url: 12345,
      };
      const result = updateImageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre qui n'est pas un nombre", () => {
      const invalidUpdate = {
        ordre: "abc",
      };
      const result = updateImageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("imageIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "123",
      };
      const result = imageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
      }
    });

    it("devrait valider un ID de 1", () => {
      const validParam = {
        id: "1",
      };
      const result = imageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "999999999",
      };
      const result = imageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(999999999);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "456",
      };
      const result = imageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
        expect(result.data.id).toBe(456);
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positif");
      }
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-1",
      };
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "123abc",
      };
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nombre");
      }
    });

    it("devrait rejeter un ID avec des caractères alphanumériques", () => {
      const invalidParam = {
        id: "abc123",
      };
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "12.34",
      };
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const invalidParam = {
        id: " 123 ",
      };
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID qui est un nombre (doit être string)", () => {
      const invalidParam = {
        id: 123,
      };
      const result = imageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  describe("imagesByArticleParamSchema", () => {
    it("devrait valider un article_id valide en string", () => {
      const validParam = {
        article_id: "123",
      };
      const result = imagesByArticleParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(123);
      }
    });

    it("devrait valider un article_id de 1", () => {
      const validParam = {
        article_id: "1",
      };
      const result = imagesByArticleParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(1);
      }
    });

    it("devrait valider un grand article_id", () => {
      const validParam = {
        article_id: "999999999",
      };
      const result = imagesByArticleParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(999999999);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        article_id: "456",
      };
      const result = imagesByArticleParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.article_id).toBe("number");
        expect(result.data.article_id).toBe(456);
      }
    });

    it("devrait rejeter si article_id est manquant", () => {
      const invalidParam = {};
      const result = imagesByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id à 0", () => {
      const invalidParam = {
        article_id: "0",
      };
      const result = imagesByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id négatif", () => {
      const invalidParam = {
        article_id: "-1",
      };
      const result = imagesByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id avec des caractères non numériques", () => {
      const invalidParam = {
        article_id: "123abc",
      };
      const result = imagesByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id décimal", () => {
      const invalidParam = {
        article_id: "12.34",
      };
      const result = imagesByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        article_id: "",
      };
      const result = imagesByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id avec espaces", () => {
      const invalidParam = {
        article_id: " 123 ",
      };
      const result = imagesByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id qui est un nombre (doit être string)", () => {
      const invalidParam = {
        article_id: 123,
      };
      const result = imagesByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkImageSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const validBulk = {
        ids: [1, 2, 3],
      };
      const result = bulkImageSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toEqual([1, 2, 3]);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        ids: [1],
      };
      const result = bulkImageSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toEqual([1]);
      }
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        ids: [1, 2, 3, 4, 5],
      };
      const result = bulkImageSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de nombreux IDs", () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      const validBulk = {
        ids: manyIds,
      };
      const result = bulkImageSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        ids: [5, 1, 3, 2, 4],
      };
      const result = bulkImageSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués (pas de contrainte unique)", () => {
      const validBulk = {
        ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkImageSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si ids est manquant", () => {
      const invalidBulk = {};
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        ids: [],
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins un ID");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        ids: [1, 0, 3],
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        ids: [1, -1, 3],
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        ids: [1, "2", 3],
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        ids: [1, 2.5, 3],
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        ids: [1, null, 3],
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        ids: [1, undefined, 3],
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ids n'est pas un array", () => {
      const invalidBulk = {
        ids: "1,2,3",
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ids est un nombre", () => {
      const invalidBulk = {
        ids: 123,
      };
      const result = bulkImageSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  describe("reorderImagesSchema", () => {
    it("devrait valider un réordonnancement valide", () => {
      const validReorder = {
        images: [
          { id: 1, ordre: 0 },
          { id: 2, ordre: 1 },
          { id: 3, ordre: 2 },
        ],
      };
      const result = reorderImagesSchema.safeParse(validReorder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.images).toHaveLength(3);
        expect(result.data.images[0]).toEqual({ id: 1, ordre: 0 });
      }
    });

    it("devrait valider avec une seule image", () => {
      const validReorder = {
        images: [{ id: 1, ordre: 0 }],
      };
      const result = reorderImagesSchema.safeParse(validReorder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs images", () => {
      const validReorder = {
        images: [
          { id: 1, ordre: 0 },
          { id: 2, ordre: 1 },
          { id: 3, ordre: 2 },
          { id: 4, ordre: 3 },
          { id: 5, ordre: 4 },
        ],
      };
      const result = reorderImagesSchema.safeParse(validReorder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les ordres à 0", () => {
      const validReorder = {
        images: [
          { id: 1, ordre: 0 },
          { id: 2, ordre: 0 },
          { id: 3, ordre: 0 },
        ],
      };
      const result = reorderImagesSchema.safeParse(validReorder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des ordres non consécutifs", () => {
      const validReorder = {
        images: [
          { id: 1, ordre: 0 },
          { id: 2, ordre: 5 },
          { id: 3, ordre: 10 },
        ],
      };
      const result = reorderImagesSchema.safeParse(validReorder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des ordres en désordre", () => {
      const validReorder = {
        images: [
          { id: 1, ordre: 2 },
          { id: 2, ordre: 0 },
          { id: 3, ordre: 1 },
        ],
      };
      const result = reorderImagesSchema.safeParse(validReorder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de grands nombres pour ordre", () => {
      const validReorder = {
        images: [
          { id: 1, ordre: 999999 },
          { id: 2, ordre: 999998 },
        ],
      };
      const result = reorderImagesSchema.safeParse(validReorder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de nombreuses images", () => {
      const manyImages = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        ordre: i,
      }));
      const validReorder = {
        images: manyImages,
      };
      const result = reorderImagesSchema.safeParse(validReorder);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si images est manquant", () => {
      const invalidReorder = {};
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidReorder = {
        images: [],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins une image");
      }
    });

    it("devrait rejeter si id est manquant dans un élément", () => {
      const invalidReorder = {
        images: [{ ordre: 0 }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ordre est manquant dans un élément", () => {
      const invalidReorder = {
        images: [{ id: 1 }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidReorder = {
        images: [{ id: 0, ordre: 0 }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidReorder = {
        images: [
          { id: 1, ordre: 0 },
          { id: -1, ordre: 1 },
        ],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ordre est négatif", () => {
      const invalidReorder = {
        images: [{ id: 1, ordre: -1 }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est décimal", () => {
      const invalidReorder = {
        images: [{ id: 1.5, ordre: 0 }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ordre est décimal", () => {
      const invalidReorder = {
        images: [{ id: 1, ordre: 1.5 }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si images n'est pas un array", () => {
      const invalidReorder = {
        images: { id: 1, ordre: 0 },
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un élément avec des propriétés manquantes", () => {
      const invalidReorder = {
        images: [{ id: 1, ordre: 0 }, { id: 2 }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est une string", () => {
      const invalidReorder = {
        images: [{ id: "1", ordre: 0 }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ordre est une string", () => {
      const invalidReorder = {
        images: [{ id: 1, ordre: "0" }],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidReorder = {
        images: [{ id: 1, ordre: 0 }, null],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidReorder = {
        images: [{ id: 1, ordre: 0 }, undefined],
      };
      const result = reorderImagesSchema.safeParse(invalidReorder);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkCreateImagesSchema", () => {
    it("devrait valider une création bulk valide", () => {
      const validBulkCreate = {
        article_id: 10,
        images: [
          { url: "https://example.com/image1.jpg", ordre: 0 },
          { url: "https://example.com/image2.jpg", ordre: 1 },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(10);
        expect(result.data.images).toHaveLength(2);
      }
    });

    it("devrait valider avec une seule image", () => {
      const validBulkCreate = {
        article_id: 20,
        images: [{ url: "https://example.com/image.jpg" }],
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec ordre optionnel", () => {
      const validBulkCreate = {
        article_id: 30,
        images: [
          { url: "https://example.com/image1.jpg" },
          { url: "https://example.com/image2.jpg" },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec ordre mixte (certains avec, certains sans)", () => {
      const validBulkCreate = {
        article_id: 40,
        images: [
          { url: "https://example.com/image1.jpg", ordre: 0 },
          { url: "https://example.com/image2.jpg" },
          { url: "https://example.com/image3.jpg", ordre: 2 },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 20 images (maximum)", () => {
      const twentyImages = Array.from({ length: 20 }, (_, i) => ({
        url: `https://example.com/image${i + 1}.jpg`,
        ordre: i,
      }));
      const validBulkCreate = {
        article_id: 50,
        images: twentyImages,
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les ordres à 0", () => {
      const validBulkCreate = {
        article_id: 60,
        images: [
          { url: "https://example.com/image1.jpg", ordre: 0 },
          { url: "https://example.com/image2.jpg", ordre: 0 },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des ordres non consécutifs", () => {
      const validBulkCreate = {
        article_id: 70,
        images: [
          { url: "https://example.com/image1.jpg", ordre: 0 },
          { url: "https://example.com/image2.jpg", ordre: 5 },
          { url: "https://example.com/image3.jpg", ordre: 10 },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec URL de longueur maximale (255 caractères)", () => {
      const longUrl = "https://example.com/" + "a".repeat(235);
      const validBulkCreate = {
        article_id: 80,
        images: [{ url: longUrl, ordre: 0 }],
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces des URLs", () => {
      const validBulkCreate = {
        article_id: 90,
        images: [
          { url: "  https://example.com/image1.jpg  ", ordre: 0 },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(validBulkCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.images[0].url).toBe("https://example.com/image1.jpg");
      }
    });

    it("devrait rejeter si article_id est manquant", () => {
      const invalidBulkCreate = {
        images: [{ url: "https://example.com/image.jpg" }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si images est manquant", () => {
      const invalidBulkCreate = {
        article_id: 100,
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulkCreate = {
        article_id: 110,
        images: [],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins une image");
      }
    });

    it("devrait rejeter plus de 20 images", () => {
      const tooManyImages = Array.from({ length: 21 }, (_, i) => ({
        url: `https://example.com/image${i + 1}.jpg`,
      }));
      const invalidBulkCreate = {
        article_id: 120,
        images: tooManyImages,
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Maximum 20 images");
      }
    });

    it("devrait rejeter si article_id est 0", () => {
      const invalidBulkCreate = {
        article_id: 0,
        images: [{ url: "https://example.com/image.jpg" }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est négatif", () => {
      const invalidBulkCreate = {
        article_id: -1,
        images: [{ url: "https://example.com/image.jpg" }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL vide", () => {
      const invalidBulkCreate = {
        article_id: 140,
        images: [{ url: "", ordre: 0 }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL qui devient vide après trim", () => {
      const invalidBulkCreate = {
        article_id: 150,
        images: [{ url: "   ", ordre: 0 }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL trop longue (> 255 caractères)", () => {
      const longUrl = "https://example.com/" + "a".repeat(236);
      const invalidBulkCreate = {
        article_id: 160,
        images: [{ url: longUrl, ordre: 0 }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL invalide", () => {
      const invalidBulkCreate = {
        article_id: 170,
        images: [{ url: "not-a-url", ordre: 0 }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre négatif", () => {
      const invalidBulkCreate = {
        article_id: 180,
        images: [
          { url: "https://example.com/image.jpg", ordre: -1 },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre décimal", () => {
      const invalidBulkCreate = {
        article_id: 190,
        images: [
          { url: "https://example.com/image.jpg", ordre: 1.5 },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si url est manquante dans une image", () => {
      const invalidBulkCreate = {
        article_id: 200,
        images: [{ ordre: 0 }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulkCreate = {
        article_id: 210,
        images: [
          { url: "https://example.com/image.jpg" },
          null,
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulkCreate = {
        article_id: 220,
        images: [
          { url: "https://example.com/image.jpg" },
          undefined,
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si images n'est pas un array", () => {
      const invalidBulkCreate = {
        article_id: 230,
        images: { url: "https://example.com/image.jpg" },
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id qui n'est pas un nombre", () => {
      const invalidBulkCreate = {
        article_id: "abc",
        images: [{ url: "https://example.com/image.jpg" }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une URL qui n'est pas une string", () => {
      const invalidBulkCreate = {
        article_id: 250,
        images: [{ url: 12345, ordre: 0 }],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre qui n'est pas un nombre", () => {
      const invalidBulkCreate = {
        article_id: 260,
        images: [
          { url: "https://example.com/image.jpg", ordre: "abc" },
        ],
      };
      const result = bulkCreateImagesSchema.safeParse(invalidBulkCreate);
      expect(result.success).toBe(false);
    });
  });
});
