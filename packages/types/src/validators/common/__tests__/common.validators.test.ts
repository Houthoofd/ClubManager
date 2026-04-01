/**
 * Tests pour les validators communs
 * Test de tous les schémas Zod dans common.validators.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  idSchema,
  idStringSchema,
  userIdSchema,
  dateISOSchema,
  dateISOOptionalSchema,
  dateSchema,
  dateOptionalSchema,
  pastDateSchema,
  futureDateSchema,
  ageValidationSchema,
  paginationSchema,
  paginationQuerySchema,
  booleanSchema,
  idsArraySchema,
  searchQuerySchema,
  sortOrderSchema,
  idParamSchema,
  userIdParamSchema,
} from '../common.validators.js';

describe('Common Validators', () => {
  describe('idSchema', () => {
    it('devrait valider un ID positif', () => {
      const result = idSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it('devrait valider un grand ID', () => {
      const result = idSchema.safeParse(999999);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter 0', () => {
      const result = idSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nombre négatif', () => {
      const result = idSchema.safeParse(-5);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nombre décimal', () => {
      const result = idSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une string', () => {
      const result = idSchema.safeParse('123');
      expect(result.success).toBe(false);
    });
  });

  describe('idStringSchema', () => {
    it('devrait valider une string numérique et la convertir en number', () => {
      const result = idStringSchema.safeParse('42');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
        expect(typeof result.data).toBe('number');
      }
    });

    it('devrait valider "1"', () => {
      const result = idStringSchema.safeParse('1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it('devrait rejeter "0"', () => {
      const result = idStringSchema.safeParse('0');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une string non-numérique', () => {
      const result = idStringSchema.safeParse('abc');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une string avec décimales', () => {
      const result = idStringSchema.safeParse('12.5');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une string négative', () => {
      const result = idStringSchema.safeParse('-5');
      expect(result.success).toBe(false);
    });
  });

  describe('userIdSchema', () => {
    it('devrait valider un userId au format U-YYYY-XXXX', () => {
      const result = userIdSchema.safeParse('U-2024-0001');
      expect(result.success).toBe(true);
    });

    it('devrait valider différentes années', () => {
      expect(userIdSchema.safeParse('U-2023-1234').success).toBe(true);
      expect(userIdSchema.safeParse('U-2025-9999').success).toBe(true);
    });

    it('devrait rejeter un format invalide (sans tirets)', () => {
      const result = userIdSchema.safeParse('U20240001');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un format invalide (préfixe incorrect)', () => {
      const result = userIdSchema.safeParse('A-2024-0001');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un format invalide (année à 2 chiffres)', () => {
      const result = userIdSchema.safeParse('U-24-0001');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un format invalide (numéro à 3 chiffres)', () => {
      const result = userIdSchema.safeParse('U-2024-001');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une string vide', () => {
      const result = userIdSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('dateISOSchema', () => {
    it('devrait valider une date ISO valide (YYYY-MM-DD)', () => {
      const result = dateISOSchema.safeParse('2024-01-15');
      expect(result.success).toBe(true);
    });

    it('devrait valider différentes dates', () => {
      expect(dateISOSchema.safeParse('2023-12-31').success).toBe(true);
      expect(dateISOSchema.safeParse('2000-01-01').success).toBe(true);
      expect(dateISOSchema.safeParse('1990-06-15').success).toBe(true);
    });

    it('devrait rejeter un format invalide (DD/MM/YYYY)', () => {
      const result = dateISOSchema.safeParse('15/01/2024');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un format invalide (MM/DD/YYYY)', () => {
      const result = dateISOSchema.safeParse('01/15/2024');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un format invalide (YYYY/MM/DD)', () => {
      const result = dateISOSchema.safeParse('2024/01/15');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une date sans zéros (YYYY-M-D)', () => {
      const result = dateISOSchema.safeParse('2024-1-5');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une string vide', () => {
      const result = dateISOSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('dateISOOptionalSchema', () => {
    it('devrait valider une date ISO valide', () => {
      const result = dateISOOptionalSchema.safeParse('2024-01-15');
      expect(result.success).toBe(true);
    });

    it('devrait valider undefined', () => {
      const result = dateISOOptionalSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('devrait rejeter un format invalide', () => {
      const result = dateISOOptionalSchema.safeParse('invalid-date');
      expect(result.success).toBe(false);
    });
  });

  describe('dateSchema', () => {
    it('devrait valider un objet Date', () => {
      const date = new Date('2024-01-15');
      const result = dateSchema.safeParse(date);
      expect(result.success).toBe(true);
    });

    it('devrait valider Date.now()', () => {
      const result = dateSchema.safeParse(new Date());
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une string', () => {
      const result = dateSchema.safeParse('2024-01-15');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un timestamp', () => {
      const result = dateSchema.safeParse(Date.now());
      expect(result.success).toBe(false);
    });
  });

  describe('dateOptionalSchema', () => {
    it('devrait valider un objet Date', () => {
      const result = dateOptionalSchema.safeParse(new Date());
      expect(result.success).toBe(true);
    });

    it('devrait valider undefined', () => {
      const result = dateOptionalSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('devrait valider null', () => {
      const result = dateOptionalSchema.safeParse(null);
      expect(result.success).toBe(true);
    });
  });

  describe('pastDateSchema', () => {
    it('devrait valider une date dans le passé', () => {
      const result = pastDateSchema.safeParse('2020-01-01');
      expect(result.success).toBe(true);
    });

    it('devrait valider hier', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      const result = pastDateSchema.safeParse(dateStr);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une date future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      const result = pastDateSchema.safeParse(dateStr);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un format invalide', () => {
      const result = pastDateSchema.safeParse('01/01/2020');
      expect(result.success).toBe(false);
    });
  });

  describe('futureDateSchema', () => {
    it('devrait valider une date future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      const result = futureDateSchema.safeParse(dateStr);
      expect(result.success).toBe(true);
    });

    it('devrait valider une date loin dans le futur', () => {
      const result = futureDateSchema.safeParse('2050-12-31');
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une date passée', () => {
      const result = futureDateSchema.safeParse('2020-01-01');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter hier', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      const result = futureDateSchema.safeParse(dateStr);
      expect(result.success).toBe(false);
    });
  });

  describe('ageValidationSchema', () => {
    it('devrait valider un âge valide (25 ans)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      const dateStr = birthDate.toISOString().split('T')[0];
      const result = ageValidationSchema.safeParse(dateStr);
      expect(result.success).toBe(true);
    });

    it('devrait valider 5 ans (âge minimum)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 5);
      const dateStr = birthDate.toISOString().split('T')[0];
      const result = ageValidationSchema.safeParse(dateStr);
      expect(result.success).toBe(true);
    });

    it('devrait valider 120 ans (âge maximum)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 120);
      const dateStr = birthDate.toISOString().split('T')[0];
      const result = ageValidationSchema.safeParse(dateStr);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter moins de 5 ans', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 3);
      const dateStr = birthDate.toISOString().split('T')[0];
      const result = ageValidationSchema.safeParse(dateStr);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter plus de 120 ans', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 125);
      const dateStr = birthDate.toISOString().split('T')[0];
      const result = ageValidationSchema.safeParse(dateStr);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un format invalide', () => {
      const result = ageValidationSchema.safeParse('invalid-date');
      expect(result.success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('devrait valider une pagination valide', () => {
      const result = paginationSchema.safeParse({ page: 1, limit: 20 });
      expect(result.success).toBe(true);
    });

    it('devrait utiliser les valeurs par défaut si absentes', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('devrait valider page 1, limit 50', () => {
      const result = paginationSchema.safeParse({ page: 1, limit: 50 });
      expect(result.success).toBe(true);
    });

    it('devrait valider page 10, limit 100 (max)', () => {
      const result = paginationSchema.safeParse({ page: 10, limit: 100 });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une page 0', () => {
      const result = paginationSchema.safeParse({ page: 0, limit: 20 });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une page négative', () => {
      const result = paginationSchema.safeParse({ page: -1, limit: 20 });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une limit > 100', () => {
      const result = paginationSchema.safeParse({ page: 1, limit: 150 });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une limit 0', () => {
      const result = paginationSchema.safeParse({ page: 1, limit: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe('paginationQuerySchema', () => {
    it('devrait valider et transformer des query strings', () => {
      const result = paginationQuerySchema.safeParse({ page: '2', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('devrait utiliser les valeurs par défaut', () => {
      const result = paginationQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une string non-numérique', () => {
      const result = paginationQuerySchema.safeParse({ page: 'abc', limit: '20' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une limit > 100', () => {
      const result = paginationQuerySchema.safeParse({ page: '1', limit: '200' });
      expect(result.success).toBe(false);
    });
  });

  describe('booleanSchema', () => {
    it('devrait valider true', () => {
      const result = booleanSchema.safeParse(true);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('devrait valider false', () => {
      const result = booleanSchema.safeParse(false);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('devrait transformer "true" en true', () => {
      const result = booleanSchema.safeParse('true');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('devrait transformer "1" en true', () => {
      const result = booleanSchema.safeParse('1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('devrait transformer "false" en false', () => {
      const result = booleanSchema.safeParse('false');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('devrait transformer "0" en false', () => {
      const result = booleanSchema.safeParse('0');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('idsArraySchema', () => {
    it('devrait valider un array d\'IDs valides', () => {
      const result = idsArraySchema.safeParse([1, 2, 3, 4, 5]);
      expect(result.success).toBe(true);
    });

    it('devrait valider un seul ID', () => {
      const result = idsArraySchema.safeParse([42]);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un array vide', () => {
      const result = idsArraySchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un array avec 0', () => {
      const result = idsArraySchema.safeParse([1, 2, 0, 4]);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un array avec un nombre négatif', () => {
      const result = idsArraySchema.safeParse([1, 2, -3, 4]);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un array avec une string', () => {
      const result = idsArraySchema.safeParse([1, 2, '3', 4]);
      expect(result.success).toBe(false);
    });
  });

  describe('searchQuerySchema', () => {
    it('devrait valider une recherche valide', () => {
      const result = searchQuerySchema.safeParse('test');
      expect(result.success).toBe(true);
    });

    it('devrait valider une recherche avec espaces', () => {
      const result = searchQuerySchema.safeParse('test search query');
      expect(result.success).toBe(true);
    });

    it('devrait valider undefined (optionnel)', () => {
      const result = searchQuerySchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une string vide', () => {
      const result = searchQuerySchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une string trop longue (> 100 caractères)', () => {
      const longString = 'a'.repeat(101);
      const result = searchQuerySchema.safeParse(longString);
      expect(result.success).toBe(false);
    });
  });

  describe('sortOrderSchema', () => {
    it('devrait valider "asc"', () => {
      const result = sortOrderSchema.safeParse('asc');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('asc');
      }
    });

    it('devrait valider "desc"', () => {
      const result = sortOrderSchema.safeParse('desc');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('desc');
      }
    });

    it('devrait rejeter "ASC" (majuscules)', () => {
      const result = sortOrderSchema.safeParse('ASC');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter "ascending"', () => {
      const result = sortOrderSchema.safeParse('ascending');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une valeur invalide', () => {
      const result = sortOrderSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('idParamSchema', () => {
    it('devrait valider un paramètre ID valide', () => {
      const result = idParamSchema.safeParse({ id: '42' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(42);
        expect(typeof result.data.id).toBe('number');
      }
    });

    it('devrait valider ID = 1', () => {
      const result = idParamSchema.safeParse({ id: '1' });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter ID = 0', () => {
      const result = idParamSchema.safeParse({ id: '0' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un ID négatif', () => {
      const result = idParamSchema.safeParse({ id: '-5' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une string non-numérique', () => {
      const result = idParamSchema.safeParse({ id: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('userIdParamSchema', () => {
    it('devrait valider un userId param valide', () => {
      const result = userIdParamSchema.safeParse({ userId: 'U-2024-0001' });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un format invalide', () => {
      const result = userIdParamSchema.safeParse({ userId: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un userId manquant', () => {
      const result = userIdParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
