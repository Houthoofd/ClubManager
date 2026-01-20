/**
 * Order Service
 * Core business logic for order management
 */

import { PrismaClient } from '@prisma/client';
import { OrderRepository } from '../repositories/order.repository.js';
import { ProductRepository } from '../repositories/product.repository.js';
import {
  CreateOrderDTO,
  OrderFilters,
  OrderStatus,
  OrderSummary
} from '../types/shop.types.js';
import {
  validateCreateOrder,
  validateOrderId,
  validateOrderStatusTransition,
  ShopValidationError
} from '../validators/shop.validator.js';
import { NotFoundError, BadRequestError } from '../utils/errors.util.js';
import { auditService } from './auditService.js';
import { inventoryService } from './inventory.service.js';
import { emailService } from './emailService.js';

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
  async getById(id: number, tenantId: number) {
    validateOrderId(id);

    const order = await this.repository.findById(id, tenantId);
    if (!order) {
      throw new NotFoundError('Order');
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
  async getByUser(userId: number, tenantId: number, page = 1, limit = 20) {
    return this.repository.findByUser(userId, tenantId, page, limit);
  }

  /**
   * Create new order
   */
  async create(data: CreateOrderDTO, userId?: number) {
    // Validate input
    validateCreateOrder(data);

    // Check stock availability for all items
    const availability = await inventoryService.checkAvailability(
      data.items,
      data.tenantId
    );

    if (!availability.allAvailable) {
      const unavailable = availability.items
        .filter(item => !item.available)
        .map(item => `${item.productName}: requested ${item.requestedQuantity}, available ${item.availableStock}`)
        .join('; ');

      throw new ShopValidationError(
        `Insufficient stock: ${unavailable}`,
        'items'
      );
    }

    // Calculate order total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of data.items) {
      const product = await this.productRepository.findById(item.productId, data.tenantId);
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId}`);
      }

      const itemPrice = item.price !== undefined ? item.price : product.price;
      const itemTotal = itemPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: { connect: { id: item.productId } },
        quantity: item.quantity,
        price: itemPrice,
        subtotal: itemTotal
      });
    }

    // Create order with items
    const order = await this.repository.create({
      user: { connect: { id: data.userId } },
      tenant: { connect: { id: data.tenantId } },
      status: OrderStatus.PENDING,
      totalAmount,
      notes: data.notes,
      items: {
        create: orderItems
      }
    });

    // Reserve stock
    try {
      await inventoryService.reserveStock(
        data.items,
        data.tenantId,
        userId || data.userId,
        order.id
      );
    } catch (error) {
      // Rollback order if stock reservation fails
      await this.repository.delete(order.id, data.tenantId);
      throw error;
    }

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'ORDER_CREATE',
        userId,
        tenantId: data.tenantId,
        resourceType: 'Order',
        resourceId: order.id,
        details: {
          totalAmount,
          itemCount: data.items.length,
          status: OrderStatus.PENDING
        }
      });
    }

    // Send confirmation email (async, don't wait)
    this.sendOrderConfirmationEmail(order.id, data.tenantId).catch(err => {
      console.error('Failed to send order confirmation email:', err);
    });

    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(
    id: number,
    newStatus: OrderStatus,
    tenantId: number,
    userId?: number
  ) {
    validateOrderId(id);

    const order = await this.getById(id, tenantId);

    // Validate status transition
    try {
      validateOrderStatusTransition(order.status as OrderStatus, newStatus);
    } catch (error) {
      throw new BadRequestError(
        error instanceof Error ? error.message : 'Invalid status transition'
      );
    }

    // Handle stock release if order is cancelled
    if (newStatus === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      await inventoryService.releaseStock(
        order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        tenantId,
        userId,
        order.id
      );
    }

    // Update status
    const updated = await this.repository.updateStatus(id, newStatus, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'ORDER_STATUS_UPDATE',
        userId,
        tenantId,
        resourceType: 'Order',
        resourceId: id,
        details: {
          oldStatus: order.status,
          newStatus,
          orderId: order.id
        }
      });
    }

    // Send status update email
    this.sendOrderStatusEmail(id, newStatus, tenantId).catch(err => {
      console.error('Failed to send order status email:', err);
    });

    return updated;
  }

  /**
   * Cancel order
   */
  async cancel(id: number, tenantId: number, userId?: number, reason?: string) {
    return this.updateStatus(id, OrderStatus.CANCELLED, tenantId, userId);
  }

  /**
   * Confirm order
   */
  async confirm(id: number, tenantId: number, userId?: number) {
    return this.updateStatus(id, OrderStatus.CONFIRMED, tenantId, userId);
  }

  /**
   * Mark order as delivered
   */
  async deliver(id: number, tenantId: number, userId?: number) {
    return this.updateStatus(id, OrderStatus.DELIVERED, tenantId, userId);
  }

  /**
   * Delete order
   */
  async delete(id: number, tenantId: number, userId?: number) {
    validateOrderId(id);

    const order = await this.getById(id, tenantId);

    // Only allow deletion of pending or cancelled orders
    if (![OrderStatus.PENDING, OrderStatus.CANCELLED].includes(order.status as OrderStatus)) {
      throw new BadRequestError('Only pending or cancelled orders can be deleted');
    }

    // Release stock if order was not cancelled
    if (order.status === OrderStatus.PENDING) {
      await inventoryService.releaseStock(
        order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        tenantId,
        userId,
        order.id
      );
    }

    await this.repository.delete(id, tenantId);

    // Audit log
    if (userId) {
      await auditService.log({
        action: 'ORDER_DELETE',
        userId,
        tenantId,
        resourceType: 'Order',
        resourceId: id,
        details: {
          orderId: order.id,
          status: order.status
        }
      });
    }

    return { success: true };
  }

  /**
   * Get order statistics
   */
  async getStatistics(
    tenantId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<OrderSummary> {
    return this.repository.getStatistics(tenantId, startDate, endDate);
  }

  /**
   * Get recent orders
   */
  async getRecent(limit = 10, tenantId?: number) {
    return this.repository.getRecent(limit, tenantId);
  }

  /**
   * Get orders by product
   */
  async getByProduct(productId: number, tenantId: number, page = 1, limit = 20) {
    return this.repository.findByProduct(productId, tenantId, page, limit);
  }

  /**
   * Calculate order total
   */
  async calculateTotal(items: Array<{ productId: number; quantity: number }>, tenantId: number) {
    let total = 0;

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId, tenantId);
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId}`);
      }

      total += product.price * item.quantity;
    }

    return {
      subtotal: total,
      tax: 0, // TODO: Implement tax calculation
      total
    };
  }

  /**
   * Send order confirmation email
   */
  private async sendOrderConfirmationEmail(orderId: number, tenantId: number) {
    try {
      const order = await this.repository.findById(orderId, tenantId);
      if (!order || !order.user) return;

      await emailService.sendEmail({
        to: order.user.email,
        subject: `Confirmation de commande #${orderId}`,
        html: `
          <h2>Votre commande a été créée</h2>
          <p>Bonjour ${order.user.firstName || ''},</p>
          <p>Votre commande #${orderId} a été créée avec succès.</p>
          <p><strong>Montant total:</strong> ${order.totalAmount.toFixed(2)} €</p>
          <p><strong>Statut:</strong> ${order.status}</p>
          <h3>Articles commandés:</h3>
          <ul>
            ${order.items.map(item => `
              <li>${item.product.name} x ${item.quantity} - ${item.subtotal.toFixed(2)} €</li>
            `).join('')}
          </ul>
          <p>Merci pour votre commande!</p>
        `
      });
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
    }
  }

  /**
   * Send order status update email
   */
  private async sendOrderStatusEmail(
    orderId: number,
    status: OrderStatus,
    tenantId: number
  ) {
    try {
      const order = await this.repository.findById(orderId, tenantId);
      if (!order || !order.user) return;

      const statusLabels: Record<OrderStatus, string> = {
        [OrderStatus.PENDING]: 'En attente',
        [OrderStatus.CONFIRMED]: 'Confirmée',
        [OrderStatus.PREPARING]: 'En préparation',
        [OrderStatus.READY]: 'Prête',
        [OrderStatus.DELIVERED]: 'Livrée',
        [OrderStatus.CANCELLED]: 'Annulée',
        [OrderStatus.REFUNDED]: 'Remboursée'
      };

      await emailService.sendEmail({
        to: order.user.email,
        subject: `Mise à jour de votre commande #${orderId}`,
        html: `
          <h2>Mise à jour de commande</h2>
          <p>Bonjour ${order.user.firstName || ''},</p>
          <p>Le statut de votre commande #${orderId} a été mis à jour.</p>
          <p><strong>Nouveau statut:</strong> ${statusLabels[status]}</p>
          <p><strong>Montant:</strong> ${order.totalAmount.toFixed(2)} €</p>
        `
      });
    } catch (error) {
      console.error('Error sending order status email:', error);
    }
  }

  /**
   * Check if order exists
   */
  async exists(id: number, tenantId?: number): Promise<boolean> {
    return this.repository.exists(id, tenantId);
  }
}

// Export singleton instance
export const orderService = new OrderService(
  (await import('./prismaService.js')).prisma
);
