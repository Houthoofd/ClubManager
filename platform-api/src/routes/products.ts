/**
 * Product Routes
 * REST API endpoints for product management
 */

import { Router, Request, Response } from "express";
import { productService } from "../services/product/product.service.js";
import { inventoryService } from "../services/inventory/inventory.service.js";
import { getTenantId } from "../utils/tenant.util.js";
import { getPaginationParams } from "../utils/pagination.util.js";
import { sendSuccess, sendError, sendList } from "../utils/response.util.js";
import { ShopValidationError } from "../validators/shop.validator.js";
import { NotFoundError } from "../utils/errors.util.js";

const router = Router();

/**
 * GET /api/products
 * List all products with filters and pagination
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { page, limit } = getPaginationParams(req.query);

    // Parse filters
    const filters: any = { tenantId };

    if (req.query.status) filters.status = req.query.status;
    if (req.query.categoryId)
      filters.categoryId = parseInt(req.query.categoryId as string);
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.minPrice)
      filters.minPrice = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice)
      filters.maxPrice = parseFloat(req.query.maxPrice as string);
    if (req.query.inStock === "true") filters.inStock = true;

    const result = await productService.list(filters, page, limit);

    sendList(res, result.products, result.pagination);
  } catch (error) {
    console.error("Error listing products:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to list products",
    );
  }
});

/**
 * GET /api/products/stats
 * Get product statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = await productService.getStatistics();

    sendSuccess(res, stats);
  } catch (error) {
    console.error("Error getting product stats:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : "Failed to get product statistics",
    );
  }
});

/**
 * GET /api/products/low-stock
 * Get low stock products
 */
router.get("/low-stock", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold as string)
      : 10;

    const products = await productService.getLowStock(threshold);

    sendSuccess(res, products);
  } catch (error) {
    console.error("Error getting low stock products:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : "Failed to get low stock products",
    );
  }
});

/**
 * GET /api/products/out-of-stock
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
 * GET /api/products/:id
 * Get product by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);

    if (isNaN(id)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    const product = await productService.getById(id);

    sendSuccess(res, product);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, "NOT_FOUND", error.message, undefined, 404);
    }

    console.error("Error getting product:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to get product",
    );
  }
});

/**
 * POST /api/products
 * Create new product
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    const productData = {
      ...req.body,
      tenantId,
    };

    const product = await productService.create(productData, userId);

    sendSuccess(res, product, "Product created successfully", 201);
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

    console.error("Error creating product:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to create product",
    );
  }
});

/**
 * PUT /api/products/:id
 * Update product
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    const product = await productService.update(id, req.body, tenantId, userId);

    sendSuccess(res, product, "Product updated successfully");
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

    console.error("Error updating product:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to update product",
    );
  }
});

/**
 * PATCH /api/products/:id/stock
 * Update product stock
 */
router.patch("/:id/stock", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;
    const { stock } = req.body;

    if (isNaN(id)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    if (stock === undefined || stock === null) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Stock quantity is required",
        { field: "stock" },
        400,
      );
    }

    const product = await productService.updateStock(
      id,
      stock,
      tenantId,
      userId,
    );

    sendSuccess(res, product, "Stock updated successfully");
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

    console.error("Error updating stock:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to update stock",
    );
  }
});

/**
 * PATCH /api/products/:id/activate
 * Activate product
 */
router.patch("/:id/activate", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    const product = await productService.activate(id, tenantId, userId);

    sendSuccess(res, product, "Product activated successfully");
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

    console.error("Error activating product:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to activate product",
    );
  }
});

/**
 * PATCH /api/products/:id/deactivate
 * Deactivate product
 */
router.patch("/:id/deactivate", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    const product = await productService.deactivate(id, tenantId, userId);

    sendSuccess(res, product, "Product deactivated successfully");
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, "NOT_FOUND", error.message, undefined, 404);
    }

    console.error("Error deactivating product:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to deactivate product",
    );
  }
});

/**
 * DELETE /api/products/:id
 * Delete product (soft delete)
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tenantId = getTenantId(req);
    const userId = (req.user as any)?.id;

    if (isNaN(id)) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Invalid product ID",
        undefined,
        400,
      );
    }

    await productService.delete(id, tenantId, userId);

    sendSuccess(res, null, "Product deleted successfully");
  } catch (error) {
    if (error instanceof NotFoundError) {
      return sendError(res, "NOT_FOUND", error.message, undefined, 404);
    }

    console.error("Error deleting product:", error);
    sendError(
      res,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to delete product",
    );
  }
});

export default router;
