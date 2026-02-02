/**
 * Mocks pour les tests du service Stock
 */

import { jest } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";
import type {
  StockAvecDetails,
  MouvementStockAvecDetails,
  ResumeStock,
  StatistiquesStocks,
  StatistiquesArticle,
} from "@clubmanager/types";

/**
 * Données de test pour les stocks
 */
export const mockStockData = {
  stock1: {
    article_id: 1,
    taille: "M",
    stock_physique: 50,
    stock_reserve: 10,
    stock_disponible: 40,
    seuil_alerte: 5,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-15"),
    articles: {
      id: 1,
      nom: "Kimono Blanc",
      code: "KIM-BLANC-001",
      prix: 49.99,
      active: 1,
    },
  },
  stock2: {
    article_id: 1,
    taille: "L",
    stock_physique: 30,
    stock_reserve: 5,
    stock_disponible: 25,
    seuil_alerte: 5,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-15"),
    articles: {
      id: 1,
      nom: "Kimono Blanc",
      code: "KIM-BLANC-001",
      prix: 49.99,
      active: 1,
    },
  },
  stock3: {
    article_id: 2,
    taille: "M",
    stock_physique: 3,
    stock_reserve: 1,
    stock_disponible: 2,
    seuil_alerte: 5,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-15"),
    articles: {
      id: 2,
      nom: "Ceinture Noire",
      code: "CEIN-NOIR-001",
      prix: 15.99,
      active: 1,
    },
  },
  stockRupture: {
    article_id: 3,
    taille: "S",
    stock_physique: 0,
    stock_reserve: 0,
    stock_disponible: 0,
    seuil_alerte: 5,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-15"),
    articles: {
      id: 3,
      nom: "Protège-tibias",
      code: "PROT-TIB-001",
      prix: 25.99,
      active: 1,
    },
  },
};

/**
 * Données de test pour les mouvements
 */
export const mockMouvementData = {
  mouvement1: {
    id: 1,
    article_id: 1,
    taille: "M",
    type_mouvement: "commande" as const,
    quantite_avant: 40,
    quantite_apres: 50,
    quantite_mouvement: 10,
    commande_id: "CMD-001",
    motif: "Réservation stock pour commande",
    utilisateur_id: 1,
    created_at: new Date("2024-01-15"),
    articles: {
      id: 1,
      nom: "Kimono Blanc",
    },
    utilisateurs: {
      id: 1,
      nom: "Dupont",
      prenom: "Jean",
    },
  },
  mouvement2: {
    id: 2,
    article_id: 1,
    taille: "M",
    type_mouvement: "livraison" as const,
    quantite_avant: 50,
    quantite_apres: 40,
    quantite_mouvement: -10,
    commande_id: "CMD-001",
    motif: "Livraison confirmée",
    utilisateur_id: 1,
    created_at: new Date("2024-01-16"),
    articles: {
      id: 1,
      nom: "Kimono Blanc",
    },
    utilisateurs: {
      id: 1,
      nom: "Dupont",
      prenom: "Jean",
    },
  },
  mouvement3: {
    id: 3,
    article_id: 2,
    taille: "M",
    type_mouvement: "reception" as const,
    quantite_avant: 0,
    quantite_apres: 100,
    quantite_mouvement: 100,
    commande_id: null,
    motif: "Réception de marchandises",
    utilisateur_id: 2,
    created_at: new Date("2024-01-10"),
    articles: {
      id: 2,
      nom: "Ceinture Noire",
    },
    utilisateurs: {
      id: 2,
      nom: "Martin",
      prenom: "Sophie",
    },
  },
};

/**
 * Données de test pour les commandes
 */
export const mockCommandeData = {
  commande1: {
    commande_id: "CMD-001",
    articles: JSON.stringify([
      { article_id: 1, taille: "M", quantite: 2 },
      { article_id: 2, taille: "L", quantite: 1 },
    ]),
    statut: "en_attente",
    date_livraison: null,
    motif_annulation: null,
  },
  commande2: {
    commande_id: "CMD-002",
    articles: JSON.stringify([{ article_id: 1, taille: "L", quantite: 1 }]),
    statut: "livre",
    date_livraison: new Date("2024-01-20"),
    motif_annulation: null,
  },
  commande3: {
    commande_id: "CMD-003",
    articles: JSON.stringify([{ article_id: 3, taille: "S", quantite: 5 }]),
    statut: "annule",
    date_livraison: null,
    motif_annulation: "Client a annulé",
  },
};

/**
 * Mock Prisma Client pour les tests
 */
export const createMockPrisma = (): jest.Mocked<PrismaClient> => {
  return {
    stocks: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    articles: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    mouvements_stock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    commandes: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => {
      // Mock transaction - exécute le callback avec le mock prisma
      return callback({
        stocks: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          findFirst: jest.fn(),
          upsert: jest.fn(),
        },
        articles: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          findFirst: jest.fn(),
          upsert: jest.fn(),
        },
        mouvements_stock: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          findFirst: jest.fn(),
          upsert: jest.fn(),
        },
        commandes: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          findFirst: jest.fn(),
          upsert: jest.fn(),
        },
      });
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  } as any;
};

/**
 * Helper pour créer un StockAvecDetails de test
 */
export const createMockStockAvecDetails = (
  overrides?: Partial<StockAvecDetails>,
): StockAvecDetails => ({
  article_id: 1,
  taille: "M",
  stock_physique: 50,
  stock_reserve: 10,
  stock_disponible: 40,
  seuil_alerte: 5,
  statut: "disponible",
  article_nom: "Kimono Blanc",
  article_code: "KIM-BLANC-001",
  article_prix: 49.99,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-15"),
  ...overrides,
});

/**
 * Helper pour créer un MouvementStockAvecDetails de test
 */
export const createMockMouvementAvecDetails = (
  overrides?: Partial<MouvementStockAvecDetails>,
): MouvementStockAvecDetails => ({
  id: 1,
  article_id: 1,
  taille: "M",
  type_mouvement: "commande",
  quantite_avant: 40,
  quantite_apres: 50,
  quantite_mouvement: 10,
  commande_id: "CMD-001",
  motif: "Réservation stock pour commande",
  utilisateur_id: 1,
  created_at: new Date("2024-01-15"),
  article_nom: "Kimono Blanc",
  utilisateur_nom: "Dupont",
  utilisateur_prenom: "Jean",
  ...overrides,
});

/**
 * Helper pour créer un ResumeStock de test
 */
export const createMockResumeStock = (
  overrides?: Partial<ResumeStock>,
): ResumeStock => ({
  article_id: 1,
  article_nom: "Kimono Blanc",
  article_code: "KIM-BLANC-001",
  tailles: [
    {
      taille: "S",
      stock_physique: 20,
      stock_reserve: 5,
      stock_disponible: 15,
      statut: "disponible",
    },
    {
      taille: "M",
      stock_physique: 50,
      stock_reserve: 10,
      stock_disponible: 40,
      statut: "disponible",
    },
    {
      taille: "L",
      stock_physique: 30,
      stock_reserve: 5,
      stock_disponible: 25,
      statut: "disponible",
    },
  ],
  stock_total_physique: 100,
  stock_total_disponible: 80,
  valeur_totale: 4999.0,
  ...overrides,
});

/**
 * Helper pour créer des StatistiquesStocks de test
 */
export const createMockStatistiquesStocks = (
  overrides?: Partial<StatistiquesStocks>,
): StatistiquesStocks => ({
  nombre_articles_total: 50,
  nombre_articles_actifs: 45,
  nombre_articles_en_rupture: 3,
  nombre_articles_alerte: 5,
  valeur_stock_total: 25000.5,
  nombre_mouvements_total: 1500,
  nombre_mouvements_mois: 150,
  top_articles_vendus: [
    { article_id: 1, article_nom: "Kimono Blanc", quantite_vendue: 45 },
    { article_id: 2, article_nom: "Ceinture Noire", quantite_vendue: 38 },
    { article_id: 3, article_nom: "Protège-tibias", quantite_vendue: 25 },
  ],
  alertes_actives: [
    {
      article_id: 3,
      article_nom: "Protège-tibias",
      taille: "S",
      stock_disponible: 0,
      seuil_alerte: 5,
      statut: "rupture",
    },
    {
      article_id: 2,
      article_nom: "Ceinture Noire",
      taille: "M",
      stock_disponible: 2,
      seuil_alerte: 5,
      statut: "alerte",
    },
  ],
  ...overrides,
});

/**
 * Helper pour créer des StatistiquesArticle de test
 */
export const createMockStatistiquesArticle = (
  overrides?: Partial<StatistiquesArticle>,
): StatistiquesArticle => ({
  article_id: 1,
  article_nom: "Kimono Blanc",
  stock_total_physique: 100,
  stock_total_reserve: 20,
  stock_total_disponible: 80,
  valeur_stock: 4999.0,
  nombre_tailles: 3,
  mouvements_30_jours: 25,
  quantite_vendue_30_jours: 15,
  quantite_recue_30_jours: 50,
  rotation_stock: 0.15,
  derniere_vente: new Date("2024-01-20"),
  dernier_approvisionnement: new Date("2024-01-10"),
  ...overrides,
});
