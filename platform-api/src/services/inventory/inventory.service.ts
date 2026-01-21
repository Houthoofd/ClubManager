/**
 * Inventory Service
 * Business logic for inventory management
 */

import { ProductRepository } from "../repositories/product.repository.js";
import { auditService, AuditAction } from "../auditService.js";
import { ValidationError } from "../shared/errors/index.js";

export class InventoryService {
  constructor(private repository: ProductRepository) {}

  /**
   * Add stock to a product
   */
  async addStock(
    productId: number,
    quantity: number,
    tenantId: string,
    userId?: number,
    reason?: string,
  ) {
    if (!productId || productId <= 0) {
      throw new ValidationError('Invalid product ID');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError(
        "Quantity must be a positive integer",
      );
    }

    const product = await this.repository.getWithStock(productId);
    if (!product) {
      throw new ValidationError("Product not found");
    }

    const updated = await this.repository.incrementStock(productId, quantity);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.INVENTORY_ADD,
        userId,
        entityType: "inventory",
        entityId: productId,
        details: {
          productName: product.nom,
          addedQuantity: quantity,
          reason,
        },
      });
    }

    return updated;
  }

  /**
   * Remove stock from a product
   */
  async removeStock(
    productId: number,
    quantity: number,
    tenantId: string,
    userId?: number,
    reason?: string,
  ) {
    if (!productId || productId <= 0) {
      throw new ValidationError('Invalid product ID');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError(
        "Quantity must be a positive integer",
      );
    }

    const product = await this.repository.getWithStock(productId);
    if (!product) {
      throw new ValidationError("Product not found");
    }

    const updated = await this.repository.decrementStock(productId, quantity);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.INVENTORY_REMOVE,
        userId,
        entityType: "inventory",
        entityId: productId,
        details: {
          productName: product.nom,
          removedQuantity: quantity,
          reason,
        },
      });
    }

    return updated;
  }

  /**
   * Set stock to a specific value
   */
  async setStock(
    productId: number,
    quantity: number,
    tenantId: string,
    userId?: number,
    reason?: string,
  ) {
    if (!productId || productId <= 0) {
      throw new ValidationError('Invalid product ID');
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new ValidationError(
        "Quantity must be a non-negative integer",
      );
    }

    const product = await this.repository.getWithStock(productId);
    if (!product) {
      throw new ValidationError("Product not found");
    }

    const updated = await this.repository.updateStock(productId, quantity);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.INVENTORY_SET,
        userId,
        entityType: "inventory",
        entityId: productId,
        details: {
          productName: product.nom,
          newStock: quantity,
          reason,
        },
      });
    }

    return updated;
  }

  /**
   * Get current stock for a product
   */
  async getStock(productId: number): Promise<number> {
    if (!productId || productId <= 0) {
      throw new ValidationError('Invalid product ID');
    }

    const product = await this.repository.getWithStock(productId);
    if (!product) {
      throw new ValidationError("Product not found");
    }

    return product.stock?.[0]?.quantite || 0;
  }

  /**
   * Check if product is in stock
   */
  async isInStock(productId: number, quantity = 1): Promise<boolean> {
    const stock = await this.getStock(productId);
    return stock >= quantity;
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold?: number) {
    return this.repository.findLowStock(threshold);
  }

  /**
   * Bulk update stock for multiple products
   */
  async bulkUpdateStock(
    updates: Array<{
      productId: number;
      quantity: number;
      operation: "add" | "remove" | "set";
    }>,
    tenantId: string,
    userId?: number,
  ) {
    const results = [];

    for (const update of updates) {
      try {
        let result;
        switch (update.operation) {
          case "add":
            result = await this.addStock(
              update.productId,
              update.quantity,
              tenantId,
              userId,
            );
            break;
          case "remove":
            result = await this.removeStock(
              update.productId,
              update.quantity,
              tenantId,
              userId,
            );
            break;
          case "set":
            result = await this.setStock(
              update.productId,
              update.quantity,
              tenantId,
              userId,
            );
            break;
          default:
            throw new Error(`Invalid operation: ${update.operation}`);
        }
        results.push({ success: true, productId: update.productId, result });
      } catch (error: any) {
        results.push({
          success: false,
          productId: update.productId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(
    items: Array<{ productId: number; quantity: number }>,
    tenantId: string,
    userId?: number,
  ) {
    const reservations = [];

    for (const item of items) {
      const stock = await this.getStock(item.productId);
      if (stock < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for product ${item.productId}. Available: ${stock}, Required: ${item.quantity}`,
        );
      }

      const updated = await this.removeStock(
        item.productId,
        item.quantity,
        tenantId,
        userId,
        "Stock reserved for order",
      );

      reservations.push({
        productId: item.productId,
        quantity: item.quantity,
        updated,
      });
    }

    return reservations;
  }

  /**
   * Release reserved stock (e.g., when order is cancelled)
   */
  async releaseStock(
    items: Array<{ productId: number; quantity: number }>,
    tenantId: string,
    userId?: number,
  ) {
    const releases = [];

    for (const item of items) {
      const updated = await this.addStock(
        item.productId,
        item.quantity,
        tenantId,
        userId,
        "Stock released from cancelled order",
      );

      releases.push({
        productId: item.productId,
        quantity: item.quantity,
        updated,
      });
    }

    return releases;
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats() {
    const lowStock = await this.repository.findLowStock();
    const totalValue = await this.repository.getTotalInventoryValue();

    return {
      totalValue,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map((item: any) => ({
        id: item.article?.id || item.id,
        nom: item.article?.nom || item.nom,
        stock: item.quantite || 0,
        seuil: item.seuil_min || 5,
      })),
    };
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(tenantId: string) {
    const articles = await this.repository.findAll();

    let totalProducts = 0;
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;

    for (const product of articles) {
      totalProducts++;
      // Simuler un stock de 0 car pas de relation stock définie
      const stock = 0;
      const threshold = 5;

      totalStock += stock;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= threshold) {
        lowStockCount++;
      }

      totalValue += stock * Number(product.prix);
    }

    return {
      totalProducts,
      totalStock,
      lowStockCount,
      outOfStockCount,
      totalValue,
    };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(tenantId: string, threshold?: number) {
    const lowStock = await this.repository.findLowStock(threshold);

    return lowStock.map((item: any) => ({
      id: item.article?.id || item.id,
      nom: item.article?.nom || item.nom,
      currentStock: item.quantite || 0,
      threshold: item.seuil_min || threshold || 5,
      status: (item.quantite || 0) === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
    }));
  }

  /**
   * Check availability for multiple products
   */
  async checkAvailability(
    items: Array<{ productId: number; quantity: number }>,
    tenantId: string,
  ) {
    const results = [];

    for (const item of items) {
      const product = await this.repository.getWithStock(item.productId);

      if (!product) {
        results.push({
          productId: item.productId,
          available: false,
          reason: "Product not found",
        });
        continue;
      }

      const stock = product.stock?.[0]?.quantite || 0;
      const available = stock >= item.quantity;

      results.push({
        productId: item.productId,
        productName: product.nom,
        requestedQuantity: item.quantity,
        availableStock: stock,
        available,
        reason: available
          ? null
          : `Insufficient stock. Available: ${stock}, Required: ${item.quantity}`,
      });
    }

    return {
      allAvailable: results.every((r) => r.available),
      items: results,
    };
  }

  /**
   * Bulk update stock
   */
  async bulkUpdate(
    updates: Array<{
      productId: number;
      quantity: number;
      operation?: "add" | "remove" | "set";
    }>,
    tenantId: string,
    userId?: number,
  ) {
    return this.bulkUpdateStock(
      updates.map((u) => ({
        productId: u.productId,
        quantity: u.quantity,
        operation: u.operation || "set",
      })),
      tenantId,
      userId,
    );
  }
}

// Create singleton instance
const productRepository = new ProductRepository();
export const inventoryService = new InventoryService(productRepository);
