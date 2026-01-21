/**
 * Inventory Service
 * Business logic for inventory management
 */

import { ProductRepository } from "../repositories/product.repository.js";
import { auditService, AuditAction } from "./auditService.js";
import {
  validateProductId,
  validateStockOperation,
  calculateNewStock,
  NotFoundError,
  ShopValidationError,
} from "../utils/shopHelpers.js";

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
    validateProductId(productId);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ShopValidationError(
        "Quantity must be a positive integer",
        "quantity",
      );
    }

    const product = await this.repository.getWithStock(productId);
    if (!product) {
      throw new NotFoundError("Product");
    }

    const currentStock = product.stock[0]?.quantite || 0;
    const validation = validateStockOperation(currentStock, "add", quantity);
    if (!validation.valid) {
      throw new ShopValidationError(validation.error!, "quantity");
    }

    const newStock = calculateNewStock(currentStock, "add", quantity);
    const updated = await this.repository.incrementStock(productId, quantity);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.INVENTORY_ADD,
        userId,
        tenantId,
        resource: "Product",
        resourceType: "Product",
        resourceId: productId.toString(),
        details: {
          productName: product.nom,
          oldStock: currentStock,
          addedQuantity: quantity,
          newStock,
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
    validateProductId(productId);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ShopValidationError(
        "Quantity must be a positive integer",
        "quantity",
      );
    }

    const product = await this.repository.getWithStock(productId);
    if (!product) {
      throw new NotFoundError("Product");
    }

    const currentStock = product.stock[0]?.quantite || 0;
    const validation = validateStockOperation(currentStock, "remove", quantity);
    if (!validation.valid) {
      throw new ShopValidationError(validation.error!, "quantity");
    }

    const newStock = calculateNewStock(currentStock, "remove", quantity);
    const updated = await this.repository.decrementStock(productId, quantity);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.INVENTORY_REMOVE,
        userId,
        tenantId,
        resource: "Product",
        resourceType: "Product",
        resourceId: productId.toString(),
        details: {
          productName: product.nom,
          oldStock: currentStock,
          removedQuantity: quantity,
          newStock,
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
    validateProductId(productId);

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new ShopValidationError(
        "Quantity must be a non-negative integer",
        "quantity",
      );
    }

    const product = await this.repository.getWithStock(productId);
    if (!product) {
      throw new NotFoundError("Product");
    }

    const currentStock = product.stock[0]?.quantite || 0;
    const updated = await this.repository.updateStock(productId, quantity);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.INVENTORY_SET,
        userId,
        tenantId,
        resource: "Product",
        resourceType: "Product",
        resourceId: productId.toString(),
        details: {
          productName: product.nom,
          oldStock: currentStock,
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
    validateProductId(productId);

    const product = await this.repository.getWithStock(productId);
    if (!product) {
      throw new NotFoundError("Product");
    }

    return product.stock[0]?.quantite || 0;
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
        throw new ShopValidationError(
          `Insufficient stock for product ${item.productId}. Available: ${stock}, Required: ${item.quantity}`,
          "stock",
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
    const [totalValue, lowStock] = await Promise.all([
      this.repository.getTotalInventoryValue(),
      this.repository.findLowStock(),
    ]);

    return {
      totalValue,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map((p) => ({
        id: p.id,
        nom: p.nom,
        stock: p.stock[0]?.quantite || 0,
        seuil: p.stock[0]?.seuil_min || 5,
      })),
    };
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(tenantId: string) {
    const result = await this.repository.findAll({ tenantId });
    const products = result.products;

    let totalProducts = 0;
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;

    for (const product of products) {
      totalProducts++;
      const stock = product.stock[0]?.quantite || 0;
      const threshold = product.stock[0]?.seuil_min || 5;

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

    return lowStock.map((product) => ({
      id: product.id,
      nom: product.nom,
      currentStock: product.stock[0]?.quantite || 0,
      threshold: product.stock[0]?.seuil_min || 5,
      status:
        (product.stock[0]?.quantite || 0) === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
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

      const stock = product.stock[0]?.quantite || 0;
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
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const productRepository = new ProductRepository(prisma);
export const inventoryService = new InventoryService(productRepository);
