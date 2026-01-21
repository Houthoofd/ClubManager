/**
 * Product Service
 * Business logic for product (Article) management
 * Uses French model names: Article, Taille, Stock
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { ProductRepository } from "../../../../repositories/product.repository.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/index.js";
import { auditService, AuditAction } from "../../../infrastructure/audit/audit.service.js";

export interface CreateProductDTO {
  nom: string;
  description?: string;
  prix: number;
  tailleId?: number;
  imageUrl?: string;
  actif?: boolean;
  initialStock?: number;
}

export interface UpdateProductDTO {
  nom?: string;
  description?: string;
  prix?: number;
  tailleId?: number;
  imageUrl?: string;
  actif?: boolean;
}

export class ProductService {
  private repository: ProductRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new ProductRepository(prisma);
  }

  /**
   * Get product by ID
   */
  async getById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError("Invalid parameters");
    }

    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError("Product");
    }

    return product;
  }

  /**
   * List products with filters
   */
  async list(filters: any = {}, page = 1, limit = 20): Promise<{
    products: any[]; 
    pagination: { page: number; limit: number; total: number; totalPages: number; };
  }> {
    return this.repository.findAll(filters, page, limit);
  }

  /**
   * Search products
   */
  async search(query: string, page = 1, limit = 20) {
    return this.repository.search(query, page, limit);
  }

  /**
   * Get active products
   */
  async getActive(page = 1, limit = 20) {
    return this.repository.findActive(page, limit);
  }

  /**
   * Create new product
   */
  async create(data: CreateProductDTO, tenantId: string, userId?: number) {
    // Validation
    if (!data.nom || data.nom.trim().length === 0) {
      throw new ValidationError("Invalid parameters");
    }

    if (!data.prix || data.prix <= 0) {
      throw new ValidationError("Invalid parameters");
    }

    // Create product
    const productData: Prisma.ArticleCreateInput = {
      nom: data.nom.trim(),
      description: data.description?.trim() || null,
      prix: data.prix,
      actif: data.actif !== undefined ? data.actif : true,
      imageUrl: data.imageUrl || null,
    };

    // Add taille relation if provided
    if (data.tailleId) {
      productData.taille = {
        connect: { id: data.tailleId },
      };
    }

    const product = await this.repository.create(productData);

    // Initialize stock if provided
    if (data.initialStock !== undefined && data.initialStock >= 0) {
      await this.repository.updateStock(product.id, data.initialStock);
    }

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.PRODUCT_CREATE,
        userId,
        tenantId,
        resource: "Product",
        resourceType: "Product",
        resourceId: product.id.toString(),
        details: {
          productName: product.nom,
          price: Number(product.prix),
          initialStock: data.initialStock,
        },
      });
    }

    return product;
  }

  /**
   * Update product
   */
  async update(
    id: number,
    data: UpdateProductDTO,
    tenantId: string,
    userId?: number,
  ) {
    const product = await this.getById(id);

    // Validation
    if (data.nom !== undefined && data.nom.trim().length === 0) {
      throw new ValidationError("Invalid parameters");
    }

    if (data.prix !== undefined && data.prix <= 0) {
      throw new ValidationError("Invalid parameters");
    }

    // Build update data
    const updateData: Prisma.ArticleUpdateInput = {};

    if (data.nom !== undefined) {
      updateData.nom = data.nom.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }
    if (data.prix !== undefined) {
      updateData.prix = data.prix;
    }
    if (data.actif !== undefined) {
      updateData.actif = data.actif;
    }
    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl || null;
    }
    if (data.tailleId !== undefined) {
      updateData.taille = data.tailleId
        ? { connect: { id: data.tailleId } }
        : { disconnect: true };
    }

    const updated = await this.repository.update(id, updateData);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.PRODUCT_UPDATE,
        userId,
        tenantId,
        resource: "Product",
        resourceType: "Product",
        resourceId: id.toString(),
        details: {
          productName: product.nom,
          changes: data,
        },
      });
    }

    return updated;
  }

  /**
   * Delete product
   */
  async delete(id: number, tenantId: string, userId?: number) {
    const product = await this.getById(id);

    await this.repository.delete(id);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.PRODUCT_DELETE,
        userId,
        tenantId,
        resource: "Product",
        resourceType: "Product",
        resourceId: id.toString(),
        details: {
          productName: product.nom,
        },
      });
    }

    return { success: true };
  }

  /**
   * Soft delete (deactivate)
   */
  async deactivate(id: number, tenantId: string, userId?: number) {
    return this.update(id, { actif: false }, tenantId, userId);
  }

  /**
   * Activate product
   */
  async activate(id: number, tenantId: string, userId?: number) {
    return this.update(id, { actif: true }, tenantId, userId);
  }

  /**
   * Update product stock
   */
  async updateStock(
    id: number,
    quantity: number,
    tenantId: string,
    userId?: number,
  ) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new ValidationError("Quantity must be a non-negative integer");
    }

    const product = await this.getWithStock(id);
    const oldStock = (product as any)?.stock?.[0]?.quantite || 0;

    await this.repository.updateStock(id, quantity);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.STOCK_UPDATE,
        userId,
        tenantId,
        resource: "Product",
        resourceType: "Product",
        resourceId: id.toString(),
        details: {
          productName: product.nom,
          oldStock,
          newStock: quantity,
          difference: quantity - oldStock,
        },
      });
    }

    return { success: true, oldStock, newStock: quantity };
  }

  /**
   * Get product with stock info
   */
  async getWithStock(id: number) {
    const product = await this.repository.getWithStock(id);
    if (!product) {
      throw new NotFoundError("Product");
    }
    return product;
  }

  /**
   * Get low stock products
   */
  async getLowStock(threshold = 5) {
    return this.repository.findLowStock(threshold);
  }

  /**
   * Get products by taille
   */
  async getByTaille(tailleId: number, page = 1, limit = 20) {
    return this.repository.findByTaille(tailleId, page, limit);
  }

  /**
   * Get best selling products
   */
  async getBestSelling(limit = 10) {
    return this.repository.getBestSelling(limit);
  }

  /**
   * Count products by status
   */
  async countByStatus() {
    return this.repository.countByStatus();
  }

  /**
   * Get total inventory value
   */
  async getTotalInventoryValue() {
    return this.repository.getTotalInventoryValue();
  }

  /**
   * Check if product exists
   */
  async exists(id: number): Promise<boolean> {
    return this.repository.exists(id);
  }

  /**
   * Get product statistics
   */
  async getStatistics() {
    const [statusCounts, totalValue, lowStock, bestSelling] = await Promise.all(
      [
        this.repository.countByStatus(),
        this.repository.getTotalInventoryValue(),
        this.repository.findLowStock(5),
        this.repository.getBestSelling(10),
      ],
    );

    return {
      totalProducts: statusCounts.total,
      activeProducts: statusCounts.active,
      inactiveProducts: statusCounts.inactive,
      totalInventoryValue: totalValue,
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock.map((p: any) => ({
        id: p.id,
        nom: p.nom,
        stock: p.stock[0]?.quantite || 0,
      })),
      bestSelling: bestSelling.map((p: any) => ({
        id: p.id,
        nom: p.nom,
        totalSold: p.totalSold,
      })),
    };
  }

  /**
   * Get all tailles (sizes)
   */
  async getAllTailles() {
    return this.repository.getAllTailles();
  }

  /**
   * Create taille
   */
  async createTaille(nom: string, tenantId: string, userId?: number) {
    if (!nom || nom.trim().length === 0) {
      throw new ValidationError("Invalid parameters");
    }

    const taille = await this.repository.createTaille(nom.trim());

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.TAILLE_CREATE,
        userId,
        tenantId,
        resource: "Taille",
        resourceType: "Taille",
        resourceId: taille.id.toString(),
        details: {
          nom: taille.nom,
        },
      });
    }

    return taille;
  }

  /**
   * Check stock availability
   */
  async checkStockAvailability(
    productId: number,
    quantity: number,
  ): Promise<{ available: boolean; currentStock: number }> {
    const product = await this.getWithStock(productId);
    const currentStock = (product as any)?.stock?.[0]?.quantite || 0;

    return {
      available: currentStock >= quantity,
      currentStock,
    };
  }

  /**
   * Bulk check stock availability
   */
  async bulkCheckStockAvailability(
    items: Array<{ productId: number; quantity: number }>,
  ) {
    const results = [];

    for (const item of items) {
      try {
        const check = await this.checkStockAvailability(
          item.productId,
          item.quantity,
        );
        results.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          ...check,
        });
      } catch (error) {
        results.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          available: false,
          currentStock: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const allAvailable = results.every((r) => r.available);

    return {
      allAvailable,
      items: results,
    };
  }
}

// Create singleton instance
const prisma = new PrismaClient();
export const productService = new ProductService(prisma);
