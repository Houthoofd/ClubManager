/**
 * Inventory Routes
 * REST API endpoints for inventory and stock management
 */

import { Router, Request, Response } from "express";
import { inventoryService } from "../services/inventory.service.js";
import { getTenantId } from "../utils/tenant.util.js";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { ShopValidationError } from "../validators/shop.validator.js";
import { NotFoundError } from "../utils/errors.util.js";

const router = Router();

/**
 * GET /api/inventory/summary
 * Get inventory summary
 */
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const summary = await inventoryService.getInventorySummary(tenantId);

    sendSuccess(res, summary);
  } catch (error) {
    console.error("Error getting inventory summary:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : "Failed to get inventory summary",
    );
  }
});

/**
 * GET /api/inventory/alerts
 * Get low stock alerts
 */
router.get("/alerts", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold as string)
      : 10;

    const alerts = await inventoryService.getLowStockAlerts(
      tenantId,
      threshold,
    );

    sendSuccess(res, alerts);
  } catch (error) {
    console.error("Error getting stock alerts:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to get stock alerts",
    );
  }
});

/**
 * GET /api/inventory/out-of-stock
 * Get out of stock products
 */
router.get("/out-of-stock", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const products = await inventoryService.getLowStockProducts(0);

    sendSuccess(res, products);
  } catch (error) {
    console.error("Error getting out of stock products:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : "Failed to get out of stock products",
    );
  }
});

/**
 * POST /api/inventory/check-availability
 * Check stock availability for multiple products
 */
router.post("/check-availability", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Items array is required",
        { field: "items" },
        400,
      );
    }

    const result = await inventoryService.checkAvailability(items, tenantId);

    sendSuccess(res, result);
  } catch (error) {
    console.error("Error checking availability:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to check availability",
    );
  }
});

/**
 * POST /api/inventory/:productId/add
 * Add stock to product
 */
router.post("/:productId/add", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { quantity, reason } = req.body;

    if (isNaN(productId)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    if (!quantity || quantity <= 0) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Valid quantity is required",
        { field: "quantity" },
        400,
      );
    }

    const product = await inventoryService.addStock(
      productId,
      quantity,
      tenantId,
      userId,
      reason,
    );

    sendSuccess(res, product, "Stock added successfully");
  } catch (error) {
    if (error instanceof ShopValidationError) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        error.message,
        { field: error.field },
        400,
      );
    }
    if (error instanceof NotFoundError) {
      return sendError(res, "NOT_FOUND", error.message, undefined, 404);
    }

    console.error("Error adding stock:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to add stock",
    );
  }
});

/**
 * POST /api/inventory/:productId/remove
 * Remove stock from product
 */
router.post("/:productId/remove", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { quantity, reason } = req.body;

    if (isNaN(productId)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    if (!quantity || quantity <= 0) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Valid quantity is required",
        { field: "quantity" },
        400,
      );
    }

    const product = await inventoryService.removeStock(
      productId,
      quantity,
      tenantId,
      userId,
      reason,
    );

    sendSuccess(res, product, "Stock removed successfully");
  } catch (error) {
    if (error instanceof ShopValidationError) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        error.message,
        { field: error.field },
        400,
      );
    }
    if (error instanceof NotFoundError) {
      return sendError(res, "NOT_FOUND", error.message, undefined, 404);
    }

    console.error("Error removing stock:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to remove stock",
    );
  }
});

/**
 * PUT /api/inventory/:productId/set
 * Set stock to specific value
 */
router.put("/:productId/set", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { quantity, reason } = req.body;

    if (isNaN(productId)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    if (quantity === undefined || quantity === null || quantity < 0) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Valid quantity is required",
        { field: "quantity" },
        400,
      );
    }

    const product = await inventoryService.setStock(
      productId,
      quantity,
      tenantId,
      userId,
      reason,
    );

    sendSuccess(res, product, "Stock set successfully");
  } catch (error) {
    if (error instanceof ShopValidationError) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        error.message,
        { field: error.field },
        400,
      );
    }
    if (error instanceof NotFoundError) {
      return sendError(res, "NOT_FOUND", error.message, undefined, 404);
    }

    console.error("Error setting stock:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to set stock",
    );
  }
});

/**
 * POST /api/inventory/bulk-update
 * Bulk update inventory
 */
router.post("/bulk-update", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Updates array is required",
        { field: "updates" },
        400,
      );
    }

    const result = await inventoryService.bulkUpdate(updates, tenantId, userId);

    const successCount = result.filter((r) => r.success).length;
    const failureCount = result.filter((r) => !r.success).length;

    sendSuccess(
      res,
      result,
      `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
    );
  } catch (error) {
    if (error instanceof ShopValidationError) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        error.message,
        { field: error.field },
        400,
      );
    }

    console.error("Error bulk updating inventory:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : "Failed to bulk update inventory",
    );
  }
});

/**
 * POST /api/inventory/reserve
 * Reserve stock for order
 */
router.post("/reserve", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { items, orderId } = req.body;

    if (!items || !Array.isArray(items)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Items array is required",
        { field: "items" },
        400,
      );
    }

    const result = await inventoryService.reserveStock(items, tenantId, userId);

    sendSuccess(res, result, "Stock reserved successfully");
  } catch (error) {
    if (error instanceof ShopValidationError) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        error.message,
        { field: error.field },
        400,
      );
    }

    console.error("Error reserving stock:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to reserve stock",
    );
  }
});

/**
 * POST /api/inventory/release
 * Release reserved stock
 */
router.post("/release", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { items, orderId } = req.body;

    if (!items || !Array.isArray(items)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Items array is required",
        { field: "items" },
        400,
      );
    }

    const result = await inventoryService.releaseStock(items, tenantId, userId);

    sendSuccess(res, result, "Stock released successfully");
  } catch (error) {
    console.error("Error releasing stock:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to release stock",
    );
  }
});

export default router;
