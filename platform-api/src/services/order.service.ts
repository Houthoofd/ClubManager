/**
 * Order Service
 * Core business logic for order management
 * Uses French model names: Commande, CommandeArticle, Article
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { OrderFilters, OrderStatus } from "../types/shop.types.js";
import { NotFoundError } from "../utils/shopHelpers.js";
import { auditService, AuditAction } from "./auditService.js";
import { inventoryService } from "./inventory.service.js";

export interface CreateOrderDTO {
  userId: number;
  tenantId: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  shippingAddress?: string;
  notes?: string;
}

export interface UpdateOrderDTO {
  statut?: string;
  adresseLivraison?: string;
  notes?: string;
}

export class OrderService {
  private repository: OrderRepository;
  private productRepository: ProductRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new OrderRepository(prisma);
    this.productRepository = new ProductRepository(prisma);
  }

  /**
   * Get order by ID
   */
  async getById(id: number, tenantId: string) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid order ID");
    }

    const order = await this.repository.findById(id, tenantId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    return order;
  }

  /**
   * List orders with filters and pagination
   */
  async list(filters: OrderFilters, page = 1, limit = 20) {
    return this.repository.findAll(filters, page, limit);
  }

  /**
   * Get orders by user
   */
  async getByUser(userId: number, tenantId: string, page = 1, limit = 20) {
    return this.repository.findByUser(userId, tenantId, page, limit);
  }

  /**
   * Create new order
   */
  async create(data: CreateOrderDTO, auditUserId?: number) {
    // Validate input
    if (!data.userId || !data.tenantId) {
      throw new Error("userId and tenantId are required");
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    // Check stock availability and reserve
    try {
      await inventoryService.reserveStock(
        data.items,
        data.tenantId,
        auditUserId,
      );
    } catch (error: any) {
      throw new Error(`Stock reservation failed: ${error.message}`);
    }

    // Get products and calculate total
    let totalAmount = 0;
    const orderItems: Array<{
      articleId: number;
      quantite: number;
      prixUnitaire: number;
    }> = [];

    for (const item of data.items) {
      const product = await this.productRepository.getWithStock(item.productId);
      if (!product) {
        // Release reserved stock before throwing error
        await inventoryService.releaseStock(
          data.items.slice(0, orderItems.length),
          data.tenantId,
          auditUserId,
        );
        throw new NotFoundError(`Product ${item.productId}`);
      }

      const itemTotal = Number(product.prix) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        articleId: product.id,
        quantite: item.quantity,
        prixUnitaire: Number(product.prix),
      });
    }

    // Create order
    const orderData: Prisma.CommandeCreateInput = {
      utilisateur: {
        connect: { id: data.userId },
      },
      statut: "en attente",
      montantTotal: totalAmount,
      adresseLivraison: data.shippingAddress || null,
      notes: data.notes || null,
      articles: {
        create: orderItems,
      },
    };

    const order = await this.repository.create(orderData);

    // Audit log
    if (auditUserId) {
      await auditService.log({
        action: AuditAction.ORDER_CREATE,
        userId: auditUserId,
        tenantId: data.tenantId,
        resource: "Order",
        resourceType: "Order",
        resourceId: order.id.toString(),
        details: {
          userId: data.userId,
          itemCount: data.items.length,
          totalAmount,
        },
      });
    }

    return order;
  }

  /**
   * Update order
   */
  async update(
    id: number,
    data: UpdateOrderDTO,
    tenantId: string,
    userId?: number,
  ) {
    const order = await this.getById(id, tenantId);

    const updateData: Prisma.CommandeUpdateInput = {};

    if (data.statut !== undefined) {
      updateData.statut = data.statut;
    }
    if (data.adresseLivraison !== undefined) {
      updateData.adresseLivraison = data.adresseLivraison;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const updated = await this.repository.update(id, updateData, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.ORDER_UPDATE,
        userId,
        tenantId,
        resource: "Order",
        resourceType: "Order",
        resourceId: id.toString(),
        details: {
          orderId: id,
          changes: data,
        },
      });
    }

    return updated;
  }

  /**
   * Update order status
   */
  async updateStatus(
    id: number,
    status: OrderStatus,
    tenantId: string,
    userId?: number,
  ) {
    const order = await this.getById(id, tenantId);

    // Map English status to French
    const statusMap: Record<string, string> = {
      PENDING: "en attente",
      CONFIRMED: "confirmée",
      PREPARING: "en préparation",
      READY: "prête",
      DELIVERED: "livrée",
      CANCELLED: "annulée",
      REFUNDED: "remboursée",
    };

    const frenchStatus = statusMap[status] || status;

    // If cancelling, release reserved stock
    if (
      status === OrderStatus.CANCELLED &&
      order.statut !== "annulée" &&
      order.statut !== "livrée"
    ) {
      const items = order.articles.map((item) => ({
        productId: item.articleId,
        quantity: item.quantite,
      }));

      await inventoryService.releaseStock(items, tenantId, userId);
    }

    const updated = await this.repository.updateStatus(
      id,
      frenchStatus,
      tenantId,
    );

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.ORDER_STATUS_UPDATE,
        userId,
        tenantId,
        resource: "Order",
        resourceType: "Order",
        resourceId: id.toString(),
        details: {
          orderId: id,
          reason,
          oldStatus: order.statut,
          newStatus,
        },
      });
    }

    return updated;
  }

  /**
   * Cancel order
   */
  async cancel(id: number, tenantId: string, userId?: number, reason?: string) {
    const order = await this.getById(id, tenantId);

    if (order.statut === "annulée") {
      throw new Error("Order is already cancelled");
    }

    if (order.statut === "livrée") {
      throw new Error("Cannot cancel delivered order");
    }

    // Release stock
    const items = order.articles.map((item) => ({
      productId: item.articleId,
      quantity: item.quantite,
    }));
    await inventoryService.releaseStock(items, tenantId, userId);

    const updated = await this.repository.updateStatus(
      id,
      "annulée" as OrderStatus,
      tenantId,
    );

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.ORDER_CANCEL,
        userId,
        tenantId,
        resource: "Order",
        resourceType: "Order",
        resourceId: id.toString(),
        details: {
          orderId: id,
          reason,
          oldStatus: order.statut,
        },
      });
    }

    return updated;
  }

  /**
   * Delete order
   */
  async delete(id: number, tenantId: string, userId?: number) {
    const order = await this.getById(id, tenantId);

    // Release stock if not delivered or cancelled
    if (order.statut !== "annulée" && order.statut !== "livrée") {
      const items = order.articles.map((item) => ({
        productId: item.articleId,
        quantity: item.quantite,
      }));

      await inventoryService.releaseStock(items, tenantId, userId);
    }

    await this.repository.delete(id, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: AuditAction.ORDER_DELETE,
        userId,
        tenantId,
        resource: "Order",
        resourceType: "Order",
        resourceId: id.toString(),
        details: {
          orderId: id,
          status: order.statut,
        },
      });
    }

    return { success: true };
  }

  /**
   * Get order statistics
   */
  async getStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    return this.repository.getStatistics(tenantId, startDate, endDate);
  }

  /**
   * Calculate total for order items
   */
  async calculateTotal(
    items: Array<{ productId: number; quantity: number }>,
    tenantId: string,
  ) {
    let subtotal = 0;
    const itemDetails = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId}`);
      }

      const itemTotal = Number(product.prix) * item.quantity;
      subtotal += itemTotal;

      itemDetails.push({
        productId: product.id,
        productName: product.nom,
        quantity: item.quantity,
        unitPrice: Number(product.prix),
        total: itemTotal,
      });
    }

    // Calculate tax (example: 20% VAT)
    const taxRate = 0.2;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      items: itemDetails,
      subtotal,
      tax,
      taxRate,
      total,
    };
  }

  /**
   * Confirm an order
   */
  async confirm(id: number, tenantId: string, userId?: number) {
    const order = await this.getById(id, tenantId);

    if (order.statut === "confirmée") {
      throw new Error("Order is already confirmed");
    }

    if (order.statut === "annulée") {
      throw new Error("Cannot confirm a cancelled order");
    }

    const updated = await this.updateStatus(
      id,
      "confirmée" as OrderStatus,
      tenantId,
      userId,
      "Order confirmed",
    );

    return updated;
  }

  /**
   * Mark order as delivered
   */
  async deliver(id: number, tenantId: string, userId?: number) {
    const order = await this.getById(id, tenantId);

    if (order.statut === "livrée") {
      throw new Error("Order is already delivered");
    }

    if (order.statut === "annulée") {
      throw new Error("Cannot deliver a cancelled order");
    }

    const updated = await this.updateStatus(
      id,
      "livrée" as OrderStatus,
      tenantId,
      userId,
      "Order delivered",
    );

    return updated;
  }

  /**
   * Get total revenue
   */
  async getTotalRevenue(tenantId: string, startDate?: Date, endDate?: Date) {
    return this.repository.getTotalRevenue(tenantId, startDate, endDate);
  }

  /**
   * Get recent orders
   */
  async getRecent(limit = 10, tenantId?: string) {
    return this.repository.getRecent(limit, tenantId);
  }

  /**
   * Check if order exists
   */
  async exists(id: number, tenantId: string): Promise<boolean> {
    return this.repository.exists(id, tenantId);
  }

  /**
   * Get orders by product
   */
  async getByProduct(
    productId: number,
    tenantId: string,
    page = 1,
    limit = 20,
  ) {
    return this.repository.findByProduct(productId, tenantId, page, limit);
  }

  /**
   * Count orders by status
   */
  async countByStatus(tenantId: string, status: string) {
    return this.repository.countByStatus(tenantId, status);
  }

  /**
   * Get order summary for user
   */
  async getUserOrderSummary(userId: number, tenantId: string) {
    const orders = await this.repository.findByUser(userId, tenantId, 1, 1000);

    const summary = {
      totalOrders: orders.orders.length,
      pending: 0,
      confirmed: 0,
      delivered: 0,
      cancelled: 0,
      totalSpent: 0,
    };

    orders.orders.forEach((order) => {
      summary.totalSpent += Number(order.montantTotal);

      switch (order.statut) {
        case "en attente":
          summary.pending++;
          break;
        case "confirmée":
        case "en préparation":
        case "prête":
          summary.confirmed++;
          break;
        case "livrée":
          summary.delivered++;
          break;
        case "annulée":
        case "remboursée":
          summary.cancelled++;
          break;
      }
    });

    return summary;
  }
}

// Create singleton instance
const prisma = new PrismaClient();
export const orderService = new OrderService(prisma);
