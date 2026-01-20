/**
 * Product Repository
 * Data access layer for products
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { ProductFilters, ProductStatus } from '../types/shop.types.js';

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find product by ID
   */
  async findById(id: number, tenantId?: number) {
    const where: Prisma.ProductWhereInput = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.product.findFirst({ where });
  }

  /**
   * Find all products with filters
   */
  async findAll(filters: ProductFilters, page = 1, limit = 20) {
    const where: Prisma.ProductWhereInput = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } }
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.inStock) {
      where.stock = { gt: 0 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create new product
   */
  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  /**
   * Update product
   */
  async update(id: number, data: Prisma.ProductUpdateInput, tenantId?: number) {
    const where: Prisma.ProductWhereUniqueInput = { id };

    // Verify tenant ownership if provided
    if (tenantId) {
      const product = await this.findById(id, tenantId);
      if (!product) {
        throw new Error('Product not found or access denied');
      }
    }

    return this.prisma.product.update({
      where,
      data
    });
  }

  /**
   * Delete product (soft delete by setting status)
   */
  async delete(id: number, tenantId?: number) {
    return this.update(id, { status: ProductStatus.DISCONTINUED }, tenantId);
  }

  /**
   * Hard delete product
   */
  async hardDelete(id: number, tenantId?: number) {
    const where: Prisma.ProductWhereUniqueInput = { id };

    if (tenantId) {
      const product = await this.findById(id, tenantId);
      if (!product) {
        throw new Error('Product not found or access denied');
      }
    }

    return this.prisma.product.delete({ where });
  }

  /**
   * Update stock
   */
  async updateStock(id: number, quantity: number, tenantId?: number) {
    return this.update(id, { stock: quantity }, tenantId);
  }

  /**
   * Increment stock
   */
  async incrementStock(id: number, amount: number, tenantId?: number) {
    const product = await this.findById(id, tenantId);
    if (!product) {
      throw new Error('Product not found');
    }

    return this.update(id, { stock: product.stock + amount }, tenantId);
  }

  /**
   * Decrement stock
   */
  async decrementStock(id: number, amount: number, tenantId?: number) {
    const product = await this.findById(id, tenantId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < amount) {
      throw new Error('Insufficient stock');
    }

    return this.update(id, { stock: product.stock - amount }, tenantId);
  }

  /**
   * Get products with low stock
   */
  async findLowStock(threshold = 10, tenantId?: number) {
    const where: Prisma.ProductWhereInput = {
      stock: { lte: threshold },
      status: ProductStatus.ACTIVE
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { stock: 'asc' }
    });
  }

  /**
   * Get out of stock products
   */
  async findOutOfStock(tenantId?: number) {
    const where: Prisma.ProductWhereInput = {
      stock: 0,
      status: ProductStatus.ACTIVE
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Count products by status
   */
  async countByStatus(tenantId?: number) {
    const where: Prisma.ProductWhereInput = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const counts = await this.prisma.product.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    return counts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get total inventory value
   */
  async getTotalValue(tenantId?: number) {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const products = await this.prisma.product.findMany({
      where,
      select: { price: true, stock: true }
    });

    return products.reduce((total, product) => {
      return total + (product.price * product.stock);
    }, 0);
  }

  /**
   * Check if product exists
   */
  async exists(id: number, tenantId?: number): Promise<boolean> {
    const product = await this.findById(id, tenantId);
    return product !== null;
  }

  /**
   * Bulk update stock
   */
  async bulkUpdateStock(updates: Array<{ id: number; stock: number }>, tenantId?: number) {
    const operations = updates.map(({ id, stock }) => {
      const where: Prisma.ProductWhereUniqueInput = { id };
      return this.prisma.product.update({
        where,
        data: { stock }
      });
    });

    return Promise.all(operations);
  }
}
