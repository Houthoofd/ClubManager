import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageSection, Alert } from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { SkeletonCard } from "@/shared/components/ui";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useCartStore } from "@/core/store/cartStore";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useGetProductsQuery,
  useGetProductCategoriesQuery,
} from "@/core/api/graphql/generated/graphql";
import RightSidePanel from "@/shared/components/common-legacy/panel/rightSidePanel";
import { CatalogueMagasin, DetailArticleModal } from "../components";
import { shallow } from "zustand/shallow";

interface Product {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  images?: Array<{ id: number; url: string }>;
  stocks?: Array<{ id: number; taille: string; quantite: number }>;
  categorie_id?: number;
}

interface ProductsByCategory {
  [categoryName: string]: Product[];
}

/**
 * ShopPage Component
 *
 * Main shop page displaying product catalog organized by categories
 * Integrates with cart system via Zustand
 *
 * @architecture
 * - GraphQL: useGetProductsQuery, useGetProductCategoriesQuery
 * - Zustand: cartStore (items, actions), uiStore (notifications)
 * - HOCs: withAuth, withTracking, withErrorBoundary
 * - i18n: shop.*
 *
 * Features:
 * - Product catalog by category
 * - Add to cart functionality
 * - Product detail modal
 * - Real-time cart synchronization
 * - Stock management
 */
const ShopPage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useTracking();

  // Zustand cart store - optimized selectors
  const cartItems = useCartStore((state) => state.items);
  const isPanelOpen = useCartStore((state) => state.isOpen);
  const {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    closeCart,
    openCart,
  } = useCartStore(
    (state) => ({
      addItem: state.addItem,
      removeItem: state.removeItem,
      updateQuantity: state.updateQuantity,
      clearCart: state.clearCart,
      closeCart: state.closeCart,
      openCart: state.openCart,
    }),
    shallow
  );

  // Zustand UI store
  const addNotification = useUiStore((state) => state.addNotification);

  // Local state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isSizeSelectOpen, setIsSizeSelectOpen] = useState(false);

  // GraphQL queries
  const {
    data: productsData,
    loading: loadingProducts,
    error: errorProducts,
    refetch: refetchProducts,
  } = useGetProductsQuery({
    fetchPolicy: "cache-and-network",
  });

  const {
    data: categoriesData,
    loading: loadingCategories,
    error: errorCategories,
  } = useGetProductCategoriesQuery({
    fetchPolicy: "cache-and-network",
  });

  // Extract data from queries
  const products = useMemo(() => {
    return (productsData?.products || []) as Product[];
  }, [productsData]);

  const categories = useMemo(() => {
    return categoriesData?.productCategories || [];
  }, [categoriesData]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: ProductsByCategory = {};

    // Initialize all categories
    categories.forEach((cat: any) => {
      grouped[cat.nom || cat.name] = [];
    });

    // Group products
    products.forEach((product) => {
      const category = categories.find((c: any) => c.id === product.categorie_id);
      const categoryName = category?.nom || category?.name || "Autres";

      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(product);
    });

    return grouped;
  }, [products, categories]);

  // Initialize categories as collapsed
  useEffect(() => {
    if (categories.length > 0) {
      const initExpanded: Record<string, boolean> = {};
      categories.forEach((cat: any) => {
        initExpanded[cat.nom || cat.name] = false;
      });
      setExpandedCategories(initExpanded);
    }
  }, [categories]);

  // Synchronize cart with product updates (price changes, stock updates)
  useEffect(() => {
    if (products.length > 0 && cartItems.length > 0) {
      trackEvent("cart_sync_check", { productsCount: products.length, cartItemsCount: cartItems.length });

      cartItems.forEach((cartItem) => {
        const currentProduct = products.find((p) => p.id === cartItem.productId);

        if (currentProduct) {
          const priceChanged = currentProduct.prix !== cartItem.price;

          if (priceChanged) {
            // Update cart item with new price
            removeItem(cartItem.id);
            addItem({
              productId: cartItem.productId,
              productName: currentProduct.nom || cartItem.productName,
              price: currentProduct.prix,
              quantity: cartItem.quantity,
              stockId: cartItem.stockId,
              size: cartItem.size,
              imageUrl: currentProduct.images?.[0]?.url || cartItem.imageUrl,
              maxQuantity: cartItem.maxQuantity,
            });

            trackEvent("cart_item_price_synced", {
              productId: cartItem.productId,
              oldPrice: cartItem.price,
              newPrice: currentProduct.prix,
            });
          }
        }
      });
    }
  }, [products]);

  // Handle payment success - clear cart
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get("payment_success");
    const shouldClearCart = localStorage.getItem("pendingOrderClearCart");

    if (paymentSuccess === "true" && shouldClearCart === "true") {
      clearCart();
      localStorage.removeItem("pendingOrderClearCart");
      localStorage.removeItem("dernierPanier");

      addNotification({
        type: "success",
        message: t("shop.checkout.success"),
      });

      trackEvent("payment_success_cart_cleared");

      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [clearCart, addNotification, t, trackEvent]);

  /**
   * Calculate adjusted stock for a product considering cart items
   */
  const calculateAdjustedStocks = (product: Product) => {
    if (!product.stocks) return [];

    // Calculate reserved quantities in cart for this product
    const reservedQuantities: Record<string, number> = {};

    cartItems
      .filter((item) => item.productId === product.id)
      .forEach((item) => {
        if (item.size) {
          reservedQuantities[item.size] = (reservedQuantities[item.size] || 0) + item.quantity;
        }
      });

    // Adjust stocks by subtracting reserved quantities
    return product.stocks.map((stock) => {
      const reserved = reservedQuantities[stock.taille] || 0;
      const available = Math.max(0, stock.quantite - reserved);

      return {
        ...stock,
        quantiteOriginale: stock.quantite,
        quantite: available,
      };
    });
  };

  /**
   * Add product to cart
   */
  const handleAddToCart = (product: Product, size: string, quantity: number = 1) => {
    try {
      const stock = product.stocks?.find((s) => s.taille === size);

      if (!stock) {
        addNotification({
          type: "error",
          message: t("shop.products.selectSize"),
        });
        return;
      }

      const adjustedStocks = calculateAdjustedStocks(product);
      const adjustedStock = adjustedStocks.find((s) => s.taille === size);

      if (!adjustedStock || adjustedStock.quantite < quantity) {
        addNotification({
          type: "error",
          message: t("shop.products.outOfStock"),
        });
        return;
      }

      addItem({
        productId: product.id,
        productName: product.nom,
        price: product.prix || 0,
        quantity,
        stockId: stock.id,
        size,
        imageUrl: product.images?.[0]?.url || null,
        maxQuantity: adjustedStock.quantite,
      });

      addNotification({
        type: "success",
        message: t("shop.cart.addedSuccess", { product: product.nom }),
      });

      trackEvent("product_added_to_cart", {
        productId: product.id,
        productName: product.nom,
        size,
        quantity,
        price: product.prix,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);

      addNotification({
        type: "error",
        message: t("shop.cart.errors.addFailed"),
      });

      trackEvent("add_to_cart_failed", {
        productId: product.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Remove product from cart
   */
  const handleRemoveFromCart = (index: number) => {
    const item = cartItems[index];
    if (item) {
      removeItem(item.id);

      addNotification({
        type: "success",
        message: t("shop.cart.removed"),
      });

      trackEvent("product_removed_from_cart", {
        productId: item.productId,
        productName: item.productName,
      });
    }
  };

  /**
   * Update cart item size
   */
  const handleUpdateSize = (index: number, newSize: string) => {
    const item = cartItems[index];
    if (item) {
      removeItem(item.id);
      addItem({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        stockId: item.stockId,
        size: newSize,
        imageUrl: item.imageUrl,
        maxQuantity: item.maxQuantity,
      });

      trackEvent("cart_item_size_updated", {
        productId: item.productId,
        oldSize: item.size,
        newSize,
      });
    }
  };

  /**
   * Update cart item quantity
   */
  const handleUpdateQuantity = (index: number, quantity: number, size: string) => {
    const item = cartItems[index];
    if (item) {
      updateQuantity(item.id, quantity);

      if (item.size !== size) {
        handleUpdateSize(index, size);
      }

      trackEvent("cart_item_quantity_updated", {
        productId: item.productId,
        oldQuantity: item.quantity,
        newQuantity: quantity,
      });
    }
  };

  /**
   * Toggle category expansion
   */
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));

    trackEvent("category_toggled", {
      category: categoryName,
      expanded: !expandedCategories[categoryName],
    });
  };

  /**
   * Open product detail modal
   */
  const openProductModal = (product: Product) => {
    const adjustedStocks = calculateAdjustedStocks(product);
    const productWithAdjustedStocks = {
      ...product,
      stocks: adjustedStocks,
    };

    setSelectedProduct(productWithAdjustedStocks);
    setSelectedSize(null);
    setIsInfoModalOpen(true);

    trackEvent("product_detail_opened", {
      productId: product.id,
      productName: product.nom,
    });
  };

  /**
   * Close product detail modal
   */
  const closeProductModal = () => {
    setIsInfoModalOpen(false);
    setSelectedProduct(null);
    setSelectedSize(null);

    trackEvent("product_detail_closed");
  };

  /**
   * Navigate to checkout
   */
  const handleCheckout = () => {
    navigate("/pages/magasin/checkout");
    trackEvent("checkout_initiated", {
      itemCount: cartItems.length,
      totalValue: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    });
  };

  // Recalculate stocks in real-time when cart changes
  useEffect(() => {
    if (isInfoModalOpen && selectedProduct) {
      const currentProduct = products.find((p) => p.id === selectedProduct.id);

      if (currentProduct) {
        const updatedStocks = calculateAdjustedStocks(currentProduct);
        setSelectedProduct({
          ...currentProduct,
          stocks: updatedStocks,
        });
      }
    }
  }, [cartItems, isInfoModalOpen]);

  // Loading state
  if (loadingProducts || loadingCategories) {
    return (
      <div className="store-page">
        <PageHeader
          title={t("shop.title")}
          subtitle={t("shop.subtitle")}
          variant="store"
        />
        <PageSection className="store-content">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
              padding: "1rem",
            }}
          >
            {[...Array(6)].map((_, idx) => (
              <SkeletonCard key={idx} hasImage hasTitle hasDescription />
            ))}
          </div>
        </PageSection>
      </div>
    );
  }

  // Error state
  if (errorProducts || errorCategories) {
    return (
      <div className="store-page">
        <PageHeader
          title={t("shop.title")}
          subtitle={t("shop.subtitle")}
          variant="store"
        />
        <PageSection className="store-content">
          <Alert
            variant="danger"
            title={t("shop.loadingError")}
            style={{ borderRadius: "8px" }}
          />
        </PageSection>
      </div>
    );
  }

  return (
    <div className="store-page">
      <PageHeader
        title={t("shop.title")}
        subtitle={t("shop.subtitle")}
        variant="store"
      />

      <PageSection className="store-content">
        <RightSidePanel
          isExpanded={isPanelOpen}
          onClose={closeCart}
          articles={cartItems}
          onRemoveArticle={handleRemoveFromCart}
          onUpdateTaille={handleUpdateSize}
          onUpdateQuantite={handleUpdateQuantity}
          onCheckout={handleCheckout}
        >
          <div className="main-content-scrollable">
            <CatalogueMagasin
              articlesParCategorie={productsByCategory}
              expandedCategories={expandedCategories}
              onToggleCategorie={toggleCategory}
              onAjouterAuPanier={handleAddToCart}
              onOpenInfoModal={openProductModal}
            />
          </div>
        </RightSidePanel>

        <DetailArticleModal
          isOpen={isInfoModalOpen}
          selectedArticle={selectedProduct}
          selectedTaille={selectedSize}
          isTailleOpen={isSizeSelectOpen}
          onClose={closeProductModal}
          onTailleSelect={setSelectedSize}
          onTailleToggle={setIsSizeSelectOpen}
          onAjouterAuPanier={(product, size, quantity) => {
            handleAddToCart(product, size, quantity);
            closeProductModal();
          }}
        />
      </PageSection>
    </div>
  );
};

// Export with HOCs: Auth, Tracking, Error boundary
export default withAuth(withTracking(withErrorBoundary(ShopPage), "ShopPage"));
