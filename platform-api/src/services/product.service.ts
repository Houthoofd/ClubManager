/**
 * Product Service
 * Core business logic for product management
 */

import { PrismaClient } from '@prisma/client';
import { ProductRepository } from '../repositories/product.repository.js';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductFilters,
  ProductStats,
  ProductStatus
} from '../types/shop.types.js';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  ShopValidationError
} from '../validators/shop.validator.js';
import { NotFoundError, ConflictError } from '../utils/errors.util.js';
import { auditService } from './auditService.js';

export class ProductService {
  private repository: ProductRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new ProductRepository(prisma);
  }

  /**
   * Get product by ID
   */
  async getById(id: number, tenantId: number) {
    validateProductId(id);

    const product = await this.repository.findById(id, tenantId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    return product;
  }

  /**
   * List products with filters and pagination
   */
  async list(filters: ProductFilters, page = 1, limit = 20) {
    return this.repository.findAll(filters, page, limit);
  }

  /**
   * Create new product
   */
  async create(data: CreateProductDTO, userId?: number) {
    // Validate input
    validateCreateProduct(data);

    // Check for duplicate product name in tenant
    const existing = await this.repository.findAll(
      { tenantId: data.tenantId, search: data.name },
      1,
      1
    );

    if (existing.products.length > 0 &&
        existing.products[0].name.toLowerCase() === data.name.toLowerCase()) {
      throw new ConflictError('A product with this name already exists');
    }

    // Set default status if not provided
    const productData = {
      ...data,
      status: data.status || ProductStatus.ACTIVE
    };

    // Create product
    const product = await this.repository.create({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      status: productData.status,
      imageUrl: productData.imageUrl,
      tenant: { connect: { id: productData.tenantId } },
      ...(productData.categoryId && {
        category: { connect: { id: productData.categoryId } }
      })
    });

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'PRODUCT_CREATE',
        userId,
        tenantId: data.tenantId,
        resourceType: 'Product',
        resourceId: product.id,
        details: { name: product.name, price: product.price }
      });
    }

    return product;
  }

  /**
   * Update product
   */
  async update(id: number, data: UpdateProductDTO, tenantId: number, userId?: number) {
    validateProductId(id);
    validateUpdateProduct(data);

    // Check if product exists
    const existing = await this.getById(id, tenantId);

    // Check for name conflict if name is being updated
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.repository.findAll(
        { tenantId, search: data.name },
        1,
        1
      );

      if (duplicate.products.length > 0 &&
          duplicate.products[0].id !== id &&
          duplicate.products[0].name.toLowerCase() === data.name.toLowerCase()) {
        throw new ConflictError('A product with this name already exists');
      }
    }

    // Auto-update status based on stock
    if (data.stock !== undefined) {
      if (data.stock === 0 && !data.status) {
        data.status = ProductStatus.OUT_OF_STOCK;
      } else if (data.stock > 0 && existing.status === ProductStatus.OUT_OF_STOCK) {
        data.status = ProductStatus.ACTIVE;
      }
    }

    // Update product
    const product = await this.repository.update(id, data, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'PRODUCT_UPDATE',
        userId,
        tenantId,
        resourceType: 'Product',
        resourceId: id,
        details: { changes: data }
      });
    }

    return product;
  }

  /**
   * Delete product (soft delete)
   */
  async delete(id: number, tenantId: number, userId?: number) {
    validateProductId(id);

    // Check if product exists
    await this.getById(id, tenantId);

    // Soft delete
    const product = await this.repository.delete(id, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'PRODUCT_DELETE',
        userId,
        tenantId,
        resourceType: 'Product',
        resourceId: id,
        details: { name: product.name }
      });
    }

    return product;
  }

  /**
   * Update product stock
   */
  async updateStock(id: number, quantity: number, tenantId: number, userId?: number) {
    validateProductId(id);

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new ShopValidationError('Stock quantity must be a positive integer', 'quantity');
    }

    // Check if product exists
    const existing = await this.getById(id, tenantId);
    const oldStock = existing.stock;

    // Update stock
    const product = await this.repository.updateStock(id, quantity, tenantId);

    // Auto-update status
    if (quantity === 0) {
      await this.repository.update(id, { status: ProductStatus.OUT_OF_STOCK }, tenantId);
    } else if (existing.status === ProductStatus.OUT_OF_STOCK) {
      await this.repository.update(id, { status: ProductStatus.ACTIVE }, tenantId);
    }

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'PRODUCT_STOCK_UPDATE',
        userId,
        tenantId,
        resourceType: 'Product',
        resourceId: id,
        details: { oldStock, newStock: quantity, difference: quantity - oldStock }
      });
    }

    return product;
  }

  /**
   * Get low stock products
   */
  async getLowStock(threshold = 10, tenantId?: number) {
    return this.repository.findLowStock(threshold, tenantId);
  }

  /**
   * Get out of stock products
   */
  async getOutOfStock(tenantId?: number) {
    return this.repository.findOutOfStock(tenantId);
  }

  /**
   * Get product statistics
   */
  async getStatistics(tenantId?: number): Promise<ProductStats> {
    const [statusCounts, totalValue, lowStock] = await Promise.all([
      this.repository.countByStatus(tenantId),
      this.repository.getTotalValue(tenantId),
      this.repository.findLowStock(10, tenantId)
    ]);

    const totalProducts = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const activeProducts = statusCounts[ProductStatus.ACTIVE] || 0;
    const outOfStock = statusCounts[ProductStatus.OUT_OF_STOCK] || 0;

    return {
      totalProducts,
      activeProducts,
      outOfStock,
      totalValue,
      lowStockProducts: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock
      }))
    };
  }

  /**
   * Check if product exists
   */
  async exists(id: number, tenantId?: number): Promise<boolean> {
    return this.repository.exists(id, tenantId);
  }

  /**
   * Activate product
   */
  async activate(id: number, tenantId: number, userId?: number) {
    validateProductId(id);

    const product = await this.getById(id, tenantId);

    if (product.stock === 0) {
      throw new ShopValidationError('Cannot activate product with zero stock', 'stock');
    }

    const updated = await this.repository.update(
      id,
      { status: ProductStatus.ACTIVE },
      tenantId
    );

    if (userId) {
      await auditService.log({
        action: 'PRODUCT_ACTIVATE',
        userId,
        tenantId,
        resourceType: 'Product',
        resourceId: id,
        details: { name: product.name }
      });
    }

    return updated;
  }

  /**
   * Deactivate product
   */
  async deactivate(id: number, tenantId: number, userId?: number) {
    validateProductId(id);

    const product = await this.getById(id, tenantId);

    const updated = await this.repository.update(
      id,
      { status: ProductStatus.INACTIVE },
      tenantId
    );

    if (userId) {
      await auditService.log({
        action: 'PRODUCT_DEACTIVATE',
        userId,
        tenantId,
        resourceType: 'Product',
        resourceId: id,
        details: { name: product.name }
      });
    }

    return updated;
  }
}

// Export singleton instance
export const productService = new ProductService(
  (await import('./prismaService.js')).prisma
);
