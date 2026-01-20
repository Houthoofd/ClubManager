/**
 * Inventory Service
 * Stock management and inventory operations
 */

import { PrismaClient } from '@prisma/client';
import { ProductRepository } from '../repositories/product.repository.js';
import { InventoryUpdate } from '../types/shop.types.js';
import { validateProductId, ShopValidationError } from '../validators/shop.validator.js';
import { NotFoundError } from '../utils/errors.util.js';
import { auditService } from './auditService.js';
import {
  validateStockOperation,
  calculateNewStock,
  needsReorder
} from './product.helpers.js';

export class InventoryService {
  private repository: ProductRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new ProductRepository(prisma);
  }

  /**
   * Add stock to product
   */
  async addStock(
    productId: number,
    quantity: number,
    tenantId: number,
    userId?: number,
    reason?: string
  ) {
    validateProductId(productId);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ShopValidationError('Quantity must be a positive integer', 'quantity');
    }

    const product = await this.repository.findById(productId, tenantId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const validation = validateStockOperation(product.stock, 'add', quantity);
    if (!validation.valid) {
      throw new ShopValidationError(validation.error!, 'quantity');
    }

    const newStock = calculateNewStock(product.stock, 'add', quantity);
    const updated = await this.repository.incrementStock(productId, quantity, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'INVENTORY_ADD',
        userId,
        tenantId,
        resourceType: 'Product',
        resourceId: productId,
        details: {
          productName: product.name,
          oldStock: product.stock,
          addedQuantity: quantity,
          newStock,
          reason
        }
      });
    }

    return updated;
  }

  /**
   * Remove stock from product
   */
  async removeStock(
    productId: number,
    quantity: number,
    tenantId: number,
    userId?: number,
    reason?: string
  ) {
    validateProductId(productId);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ShopValidationError('Quantity must be a positive integer', 'quantity');
    }

    const product = await this.repository.findById(productId, tenantId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const validation = validateStockOperation(product.stock, 'remove', quantity);
    if (!validation.valid) {
      throw new ShopValidationError(validation.error!, 'quantity');
    }

    const newStock = calculateNewStock(product.stock, 'remove', quantity);
    const updated = await this.repository.decrementStock(productId, quantity, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'INVENTORY_REMOVE',
        userId,
        tenantId,
        resourceType: 'Product',
        resourceId: productId,
        details: {
          productName: product.name,
          oldStock: product.stock,
          removedQuantity: quantity,
          newStock,
          reason
        }
      });
    }

    return updated;
  }

  /**
   * Set stock to specific value
   */
  async setStock(
    productId: number,
    quantity: number,
    tenantId: number,
    userId?: number,
    reason?: string
  ) {
    validateProductId(productId);

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new ShopValidationError('Quantity must be a non-negative integer', 'quantity');
    }

    const product = await this.repository.findById(productId, tenantId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const oldStock = product.stock;
    const updated = await this.repository.updateStock(productId, quantity, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'INVENTORY_SET',
        userId,
        tenantId,
        resourceType: 'Product',
        resourceId: productId,
        details: {
          productName: product.name,
          oldStock,
          newStock: quantity,
          difference: quantity - oldStock,
          reason
        }
      });
    }

    return updated;
  }

  /**
   * Bulk update inventory
   */
  async bulkUpdate(
    updates: InventoryUpdate[],
    tenantId: number,
    userId?: number
  ) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ShopValidationError('Updates array cannot be empty', 'updates');
    }

    if (updates.length > 100) {
      throw new ShopValidationError('Cannot update more than 100 products at once', 'updates');
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        validateProductId(update.productId);

        const product = await this.repository.findById(update.productId, tenantId);
        if (!product) {
          errors.push({
            productId: update.productId,
            error: 'Product not found'
          });
          continue;
        }

        let newStock: number;
        switch (update.type) {
          case 'ADD':
            newStock = calculateNewStock(product.stock, 'add', update.quantity);
            break;
          case 'REMOVE':
            const validation = validateStockOperation(product.stock, 'remove', update.quantity);
            if (!validation.valid) {
              errors.push({
                productId: update.productId,
                error: validation.error
              });
              continue;
            }
            newStock = calculateNewStock(product.stock, 'remove', update.quantity);
            break;
          case 'SET':
            newStock = update.quantity;
            break;
          default:
            errors.push({
              productId: update.productId,
              error: 'Invalid update type'
            });
            continue;
        }

        const updated = await this.repository.updateStock(
          update.productId,
          newStock,
          tenantId
        );

        results.push({
          productId: update.productId,
          oldStock: product.stock,
          newStock,
          success: true
        });

        // Audit log
        if (userId) {
          await auditService.log({
            action: 'INVENTORY_BULK_UPDATE',
            userId,
            tenantId,
            resourceType: 'Product',
            resourceId: update.productId,
            details: {
              type: update.type,
              oldStock: product.stock,
              newStock,
              reason: update.reason
            }
          });
        }
      } catch (error) {
        errors.push({
          productId: update.productId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      total: updates.length,
      successCount: results.length,
      failureCount: errors.length
    };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(threshold = 10, tenantId?: number) {
    const products = await this.repository.findLowStock(threshold, tenantId);

    return products.map(product => ({
      id: product.id,
      name: product.name,
      currentStock: product.stock,
      threshold,
      severity: product.stock <= threshold / 2 ? 'critical' : 'warning',
      needsReorder: needsReorder(product.stock, threshold)
    }));
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(tenantId?: number) {
    return this.repository.findOutOfStock(tenantId);
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(tenantId?: number) {
    const [totalValue, lowStock, outOfStock, statusCounts] = await Promise.all([
      this.repository.getTotalValue(tenantId),
      this.repository.findLowStock(10, tenantId),
      this.repository.findOutOfStock(tenantId),
      this.repository.countByStatus(tenantId)
    ]);

    const totalProducts = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      totalProducts,
      totalValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      statusBreakdown: statusCounts,
      alerts: {
        critical: lowStock.filter(p => p.stock <= 5).length,
        warning: lowStock.filter(p => p.stock > 5 && p.stock <= 10).length
      }
    };
  }

  /**
   * Check stock availability for multiple products
   */
  async checkAvailability(
    items: Array<{ productId: number; quantity: number }>,
    tenantId: number
  ) {
    const results = [];

    for (const item of items) {
      const product = await this.repository.findById(item.productId, tenantId);

      if (!product) {
        results.push({
          productId: item.productId,
          available: false,
          reason: 'Product not found'
        });
        continue;
      }

      const available = product.stock >= item.quantity;
      results.push({
        productId: item.productId,
        productName: product.name,
        requestedQuantity: item.quantity,
        availableStock: product.stock,
        available,
        reason: available ? null : 'Insufficient stock'
      });
    }

    const allAvailable = results.every(r => r.available);

    return {
      allAvailable,
      items: results
    };
  }

  /**
   * Reserve stock for order
   */
  async reserveStock(
    items: Array<{ productId: number; quantity: number }>,
    tenantId: number,
    userId?: number,
    orderId?: number
  ) {
    // Check availability first
    const availability = await this.checkAvailability(items, tenantId);
    if (!availability.allAvailable) {
      throw new ShopValidationError(
        'Cannot reserve stock: some items are not available',
        'items'
      );
    }

    // Reserve stock (decrement)
    const reservations = [];
    for (const item of items) {
      const updated = await this.repository.decrementStock(
        item.productId,
        item.quantity,
        tenantId
      );

      reservations.push({
        productId: item.productId,
        quantity: item.quantity,
        reservedAt: new Date()
      });

      // Audit log
      if (userId) {
        await auditService.log({
          action: 'INVENTORY_RESERVE',
          userId,
          tenantId,
          resourceType: 'Product',
          resourceId: item.productId,
          details: {
            quantity: item.quantity,
            orderId,
            newStock: updated.stock
          }
        });
      }
    }

    return {
      reservations,
      success: true
    };
  }

  /**
   * Release reserved stock (e.g., when order is cancelled)
   */
  async releaseStock(
    items: Array<{ productId: number; quantity: number }>,
    tenantId: number,
    userId?: number,
    orderId?: number
  ) {
    for (const item of items) {
      await this.repository.incrementStock(item.productId, item.quantity, tenantId);

      // Audit log
      if (userId) {
        await auditService.log({
          action: 'INVENTORY_RELEASE',
          userId,
          tenantId,
          resourceType: 'Product',
          resourceId: item.productId,
          details: {
            quantity: item.quantity,
            orderId
          }
        });
      }
    }

    return { success: true };
  }
}

// Export singleton instance
export const inventoryService = new InventoryService(
  (await import('./prismaService.js')).prisma
);
