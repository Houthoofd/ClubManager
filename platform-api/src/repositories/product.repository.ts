/**
 * Product Repository
 * Data access layer for products (Articles)
 * Uses French model names from Prisma schema: Article, Taille, Stock
 */

import { PrismaClient, Prisma } from "@prisma/client";

export interface ProductFilters {
  tenantId?: string;
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tailleId?: number;
  search?: string;
}

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find product by ID
   */
  async findById(id: number) {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        taille: true,
        stock: true,
        commandesArticles: {
          include: {
            commande: true,
          },
        },
      },
    });
  }

  /**
   * Find all products with filters
   */
  async findAll(filters: ProductFilters = {}, page = 1, limit = 20) {
    const where: Prisma.ArticleWhereInput = {};

    if (filters.active !== undefined) {
      where.actif = filters.active;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.prix = {};
      if (filters.minPrice !== undefined) {
        where.prix.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.prix.lte = filters.maxPrice;
      }
    }

    if (filters.tailleId) {
      where.tailleId = filters.tailleId;
    }

    if (filters.search) {
      where.OR = [
        {
          nom: {
            contains: filters.search,
          },
        },
        {
          description: {
            contains: filters.search,
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        include: {
          taille: true,
          stock: true,
        },
        orderBy: { nom: "asc" },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create new product
   */
  async create(data: Prisma.ArticleCreateInput) {
    return this.prisma.article.create({
      data,
      include: {
        taille: true,
        stock: true,
      },
    });
  }

  /**
   * Update product
   */
  async update(id: number, data: Prisma.ArticleUpdateInput) {
    return this.prisma.article.update({
      where: { id },
      data,
      include: {
        taille: true,
        stock: true,
      },
    });
  }

  /**
   * Delete product
   */
  async delete(id: number) {
    // Delete related stock first
    await this.prisma.stock.deleteMany({
      where: { articleId: id },
    });

    return this.prisma.article.delete({
      where: { id },
    });
  }

  /**
   * Get products by taille
   */
  async findByTaille(tailleId: number, page = 1, limit = 20) {
    return this.findAll({ tailleId }, page, limit);
  }

  /**
   * Get active products
   */
  async findActive(page = 1, limit = 20) {
    return this.findAll({ active: true }, page, limit);
  }

  /**
   * Get low stock products
   */
  async findLowStock(threshold = 5) {
    return this.prisma.article.findMany({
      where: {
        actif: true,
        stock: {
          some: {
            quantite: {
              lte: threshold,
            },
          },
        },
      },
      include: {
        taille: true,
        stock: true,
      },
      orderBy: {
        nom: "asc",
      },
    });
  }

  /**
   * Count products by status
   */
  async countByStatus() {
    const [active, inactive, total] = await Promise.all([
      this.prisma.article.count({ where: { actif: true } }),
      this.prisma.article.count({ where: { actif: false } }),
      this.prisma.article.count(),
    ]);

    return {
      active,
      inactive,
      total,
    };
  }

  /**
   * Get total inventory value
   */
  async getTotalInventoryValue() {
    const products = await this.prisma.article.findMany({
      where: { actif: true },
      include: {
        stock: true,
      },
    });

    return products.reduce((total: number, product: any) => {
      const stockQuantity = product.stock[0]?.quantite || 0;
      return total + Number(product.prix) * stockQuantity;
    }, 0);
  }

  /**
   * Search products
   */
  async search(query: string, page = 1, limit = 20) {
    return this.findAll({ search: query }, page, limit);
  }

  /**
   * Check if product exists
   */
  async exists(id: number): Promise<boolean> {
    const product = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true },
    });
    return product !== null;
  }

  /**
   * Update product stock
   */
  async updateStock(articleId: number, quantite: number) {
    // Check if stock entry exists
    const existingStock = await this.prisma.stock.findUnique({
      where: { articleId },
    });

    if (existingStock) {
      return this.prisma.stock.update({
        where: { articleId },
        data: { quantite },
      });
    } else {
      return this.prisma.stock.create({
        data: {
          articleId,
          quantite,
          seuil_min: 5,
        },
      });
    }
  }

  /**
   * Increment product stock
   */
  async incrementStock(articleId: number, amount: number) {
    const currentStock = await this.prisma.stock.findUnique({
      where: { articleId },
    });

    if (!currentStock) {
      return this.updateStock(articleId, amount);
    }

    return this.prisma.stock.update({
      where: { articleId },
      data: {
        quantite: currentStock.quantite + amount,
      },
    });
  }

  /**
   * Decrement product stock
   */
  async decrementStock(articleId: number, amount: number) {
    const currentStock = await this.prisma.stock.findUnique({
      where: { articleId },
    });

    if (!currentStock) {
      throw new Error("Stock not found for this product");
    }

    if (currentStock.quantite < amount) {
      throw new Error("Insufficient stock");
    }

    return this.prisma.stock.update({
      where: { articleId },
      data: {
        quantite: currentStock.quantite - amount,
      },
    });
  }

  /**
   * Get product with stock info
   */
  async getWithStock(id: number) {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        taille: true,
        stock: true,
      },
    });
  }

  /**
   * Get best selling products
   */
  async getBestSelling(limit = 10) {
    const products = await this.prisma.article.findMany({
      where: { actif: true },
      include: {
        taille: true,
        stock: true,
        commandesArticles: {
          select: {
            quantite: true,
          },
        },
      },
    });

    // Calculate total quantity sold for each product
    const productsWithSales = products.map((product) => ({
      ...product,
      totalSold: product.commandesArticles.reduce(
        (sum, item) => sum + item.quantite,
        0,
      ),
    }));

    // Sort by total sold and return top N
    return productsWithSales
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  /**
   * Get all tailles (sizes)
   */
  async getAllTailles() {
    return this.prisma.taille.findMany({
      orderBy: { nom: "asc" },
    });
  }

  /**
   * Create taille
   */
  async createTaille(nom: string) {
    return this.prisma.taille.create({
      data: { nom },
    });
  }
}
