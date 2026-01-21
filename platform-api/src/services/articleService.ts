/**
 * Article Service
 * Service for managing articles, stock, and shop operations
 * Replaces the old Magasin client
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
export const articleCreationSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  prix: z.number().positive("Le prix doit être positif"),
  tailleId: z.number().optional(),
  imageUrl: z.string().url().optional(),
  actif: z.boolean().default(true),
});

export const articleUpdateSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().optional(),
  prix: z.number().positive().optional(),
  tailleId: z.number().optional(),
  imageUrl: z.string().url().optional(),
  actif: z.boolean().optional(),
});

export const stockUpdateSchema = z.object({
  quantite: z.number().int().min(0),
  seuil_min: z.number().int().min(0).optional(),
});

export type ArticleCreationData = z.infer<typeof articleCreationSchema>;
export type ArticleUpdateData = z.infer<typeof articleUpdateSchema>;
export type StockUpdateData = z.infer<typeof stockUpdateSchema>;

export class ArticleService {
  /**
   * Get all articles with stock information
   */
  async getAllArticles(filters: { actif?: boolean; tailleId?: number } = {}) {
    const where: Prisma.ArticleWhereInput = {};
    
    if (filters.actif !== undefined) {
      where.actif = filters.actif;
    }
    
    if (filters.tailleId) {
      where.tailleId = filters.tailleId;
    }

    return prisma.article.findMany({
      where,
      include: {
        taille: true,
        stock: true,
      },
      orderBy: { nom: 'asc' },
    });
  }

  /**
   * Get article by ID
   */
  async getArticleById(id: number) {
    return prisma.article.findUnique({
      where: { id },
      include: {
        taille: true,
        stock: true,
      },
    });
  }

  /**
   * Create new article
   */
  async createArticle(data: ArticleCreationData) {
    return prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data,
        include: {
          taille: true,
        },
      });

      // Create initial stock entry
      await tx.stock.create({
        data: {
          articleId: article.id,
          quantite: 0,
          seuil_min: 5,
        },
      });

      return article;
    });
  }

  /**
   * Update article
   */
  async updateArticle(id: number, data: ArticleUpdateData) {
    return prisma.article.update({
      where: { id },
      data,
      include: {
        taille: true,
        stock: true,
      },
    });
  }

  /**
   * Delete article (soft delete by setting actif to false)
   */
  async deleteArticle(id: number) {
    return prisma.article.update({
      where: { id },
      data: { actif: false },
    });
  }

  /**
   * Get all sizes
   */
  async getAllTailles() {
    return prisma.taille.findMany({
      orderBy: { nom: 'asc' },
    });
  }

  /**
   * Create new size
   */
  async createTaille(nom: string) {
    return prisma.taille.create({
      data: { nom },
    });
  }

  /**
   * Update stock for an article
   */
  async updateStock(articleId: number, data: StockUpdateData) {
    return prisma.stock.upsert({
      where: { articleId },
      update: data,
      create: {
        articleId,
        ...data,
      },
    });
  }

  /**
   * Get stock information for an article
   */
  async getStock(articleId: number) {
    return prisma.stock.findUnique({
      where: { articleId },
      include: {
        article: true,
      },
    });
  }

  /**
   * Get articles with low stock
   */
  async getLowStockArticles() {
    return prisma.article.findMany({
      where: {
        actif: true,
        stock: {
          some: {
            quantite: {
              lte: 10, // Pour le moment, utilisons une valeur statique
            },
          },
        },
      },
      include: {
        stock: true,
        taille: true,
      },
    });
  }

  /**
   * Check if article has sufficient stock
   */
  async checkStock(articleId: number, requestedQuantity: number): Promise<boolean> {
    const stock = await prisma.stock.findUnique({
      where: { articleId },
    });

    return stock ? stock.quantite >= requestedQuantity : false;
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(articleId: number, quantity: number) {
    return prisma.stock.update({
      where: { articleId },
      data: {
        quantite: {
          decrement: quantity,
        },
      },
    });
  }

  /**
   * Release reserved stock (if order is cancelled)
   */
  async releaseStock(articleId: number, quantity: number) {
    return prisma.stock.update({
      where: { articleId },
      data: {
        quantite: {
          increment: quantity,
        },
      },
    });
  }

  /**
   * Get articles for catalog/shop display
   */
  async getShopCatalog() {
    return prisma.article.findMany({
      where: { 
        actif: true,
        stock: {
          some: {
            quantite: {
              gt: 0,
            },
          },
        },
      },
      include: {
        taille: true,
        stock: true,
      },
      orderBy: { nom: 'asc' },
    });
  }

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      // For now, return static categories. In a real app, this would come from a database table
      return [
        { id: 1, nom: 'Vêtements', description: 'Articles vestimentaires' },
        { id: 2, nom: 'Équipements', description: 'Équipements sportifs' },
        { id: 3, nom: 'Accessoires', description: 'Accessoires divers' },
        { id: 4, nom: 'Nutrition', description: 'Suppléments et nutrition' },
      ];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
}

// Export singleton instance
export const articleService = new ArticleService();