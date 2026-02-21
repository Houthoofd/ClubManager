/**
 * ManageProductsPage Component - REFACTORED WITH ATOMIC COMPONENTS
 *
 * Product management page for administrators.
 * Fully modularized with atomic components and custom hooks.
 *
 * @architecture
 * - GraphQL: useGetProductsQuery, useGetProductCategoriesQuery, useDeleteProductMutation
 * - Zustand: uiStore (notifications)
 * - HOCs: withAuthRole (admin), withAuth, withTracking, withErrorBoundary
 * - i18n: shop.manageProducts.*
 * - Atomic Components: ProductList, ProductSearch, ProductStats
 * - Custom Hooks: useProductSearch, useProductFilter
 *
 * @permissions Admin only
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageSection,
  Button,
  Alert,
  Modal,
  ModalVariant,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Flex,
  FlexItem,
  Divider,
} from "@patternfly/react-core";
import { PlusCircleIcon, TrashIcon, EditIcon } from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { SkeletonCard } from "@/shared/components/ui";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withAuthRole } from "@/shared/hocs/withAuthRole";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useGetProductsQuery,
  useGetProductCategoriesQuery,
  useDeleteProductMutation,
} from "@/core/api/graphql/generated/graphql";
import { ProductList, ProductSearch, ProductStats } from "../components";
import { useProductSearch, useProductFilter } from "../hooks";

interface Product {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  images?: Array<{ id: number; url: string }>;
  stocks?: Array<{ id: number; taille: string; quantite: number }>;
  categorie_id?: number;
}

/**
 * ManageProductsPage Component
 */
const ManageProductsPage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state: any) => state.addNotification);

  // Local state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<{ [key: number]: boolean }>({});

  // Custom hooks for search and filter
  const { searchValue, setSearchValue, clearSearch, filterProducts, hasSearch } =
    useProductSearch();
  const {
    selectedCategory,
    setSelectedCategory,
    selectedPriceRange,
    setSelectedPriceRange,
    selectedStockStatus,
    setSelectedStockStatus,
    filterProducts: applyFilters,
    clearFilters,
    hasActiveFilters,
  } = useProductFilter();

  // GraphQL queries
  const {
    data: productsData,
    loading: loadingProducts,
    error: errorProducts,
    refetch: refetchProducts,
  } = useGetProductsQuery({
    fetchPolicy: "cache-and-network",
  });

  const { data: categoriesData, loading: loadingCategories } = useGetProductCategoriesQuery({
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutations
  const [deleteProduct, { loading: deleting }] = useDeleteProductMutation();

  // Extract data from queries
  const products = useMemo(() => {
    return (productsData?.products || []) as Product[];
  }, [productsData]);

  const categories = useMemo(() => {
    return categoriesData?.productCategories || [];
  }, [categoriesData]);

  // Apply search and filters
  const filteredProducts = useMemo(() => {
    let result = products;

    // Apply search
    result = filterProducts(result);

    // Apply filters (category, price, stock)
    result = applyFilters(result);

    return result;
  }, [products, filterProducts, applyFilters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalCategories = categories.length;

    const lowStockProducts = products.filter((p) => {
      const totalStock = p.stocks?.reduce((sum, s) => sum + s.quantite, 0) || 0;
      return totalStock > 0 && totalStock <= 5;
    }).length;

    const outOfStockProducts = products.filter((p) => {
      const totalStock = p.stocks?.reduce((sum, s) => sum + s.quantite, 0) || 0;
      return totalStock === 0;
    }).length;

    return {
      totalProducts,
      totalCategories,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
    };
  }, [products, categories]);

  /**
   * Toggle action dropdown for a product
   */
  const toggleActionDropdown = (productId: number) => {
    setActionDropdownOpen((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  /**
   * Navigate to edit product page
   */
  const handleEditProduct = (productId: string | number) => {
    trackEvent("product_edit_clicked", { productId });
    navigate(`/pages/magasin/ajouter?id=${productId}`);
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteProduct = (productId: string | number) => {
    const product = products.find((p) => p.id === Number(productId));
    if (product) {
      setProductToDelete(product);
      setShowDeleteModal(true);
      trackEvent("product_delete_clicked", { productId: product.id });
    }
  };

  /**
   * Execute product deletion
   */
  const executeDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct({
        variables: { id: productToDelete.id },
      });

      addNotification({
        type: "success",
        message: t("shop.manageProducts.delete.success"),
      });

      trackEvent("product_deleted", {
        productId: productToDelete.id,
        name: productToDelete.nom,
      });

      setShowDeleteModal(false);
      setProductToDelete(null);
      await refetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);

      addNotification({
        type: "error",
        message: error?.message || t("shop.manageProducts.delete.error"),
      });

      trackEvent("product_delete_failed", {
        productId: productToDelete.id,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Render action buttons for each product card
   */
  const renderProductActions = (product: any) => {
    return (
      <Dropdown
        onSelect={() => toggleActionDropdown(product.id)}
        toggle={
          <KebabToggle
            onToggle={() => toggleActionDropdown(product.id)}
            id={`toggle-${product.id}`}
          />
        }
        isOpen={actionDropdownOpen[product.id] || false}
        isPlain
        dropdownItems={[
          <DropdownItem
            key="edit"
            icon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditProduct(product.id);
            }}
          >
            {t("shop.manageProducts.actions.edit")}
          </DropdownItem>,
          <DropdownItem
            key="delete"
            icon={<TrashIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProduct(product.id);
            }}
          >
            {t("shop.manageProducts.actions.delete")}
          </DropdownItem>,
        ]}
      />
    );
  };

  // Loading state
  if (loadingProducts || loadingCategories) {
    return (
      <div>
        <PageHeader
          title={t("shop.manageProducts.title")}
          subtitle={t("shop.manageProducts.subtitle")}
          variant="shop"
        />
        <PageSection>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
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
  if (errorProducts) {
    return (
      <div>
        <PageHeader
          title={t("shop.manageProducts.title")}
          subtitle={t("shop.manageProducts.subtitle")}
          variant="shop"
        />
        <PageSection>
          <Alert
            variant="danger"
            title={t("shop.manageProducts.loadingError")}
            style={{ borderRadius: "8px" }}
          >
            {errorProducts.message}
          </Alert>
        </PageSection>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("shop.manageProducts.title")}
        subtitle={t("shop.manageProducts.subtitle")}
        variant="shop"
      />

      <PageSection>
        {/* Add Product Button and Stats */}
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
          style={{ marginBottom: "1.5rem" }}
        >
          <FlexItem>
            <ProductStats
              totalProducts={stats.totalProducts}
              totalCategories={stats.totalCategories}
              lowStockProducts={stats.lowStock}
              outOfStockProducts={stats.outOfStock}
              showTotal={true}
              showCategories={true}
              showLowStock={true}
              showOutOfStock={true}
              variant="horizontal"
            />
          </FlexItem>

          <FlexItem>
            <Button
              variant="primary"
              icon={<PlusCircleIcon />}
              onClick={() => navigate("/pages/magasin/ajouter")}
            >
              {t("shop.manageProducts.addProduct")}
            </Button>
          </FlexItem>
        </Flex>

        <Divider style={{ marginBottom: "1.5rem" }} />

        {/* Search Component */}
        {products.length > 0 && (
          <ProductSearch
            value={searchValue}
            onChange={setSearchValue}
            onClear={clearSearch}
            resultsCount={filteredProducts.length}
            totalCount={products.length}
            showResultsInfo={hasSearch}
            placeholder={t("shop.products.searchPlaceholder")}
          />
        )}

        {/* Product List Component */}
        <ProductList
          products={filteredProducts.map((p) => ({
            id: p.id,
            name: p.nom,
            nom: p.nom,
            description: p.description,
            price: p.prix,
            prix: p.prix,
            image: p.images?.[0]?.url,
            category: categories.find((c: any) => c.id === p.categorie_id)?.nom || "",
            categorie: categories.find((c: any) => c.id === p.categorie_id)?.nom || "",
            stock: p.stocks?.reduce((sum, s) => sum + s.quantite, 0) || 0,
            stocks: p.stocks,
          }))}
          isFiltered={hasSearch || hasActiveFilters}
          onProductClick={handleEditProduct}
          renderActions={renderProductActions}
          isLoading={loadingProducts}
          layout="grid"
          showPrice={true}
          showStock={true}
          showCategory={true}
        />
      </PageSection>

      {/* Delete Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title={t("shop.manageProducts.delete.confirmTitle")}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        actions={[
          <Button key="confirm" variant="danger" onClick={executeDelete} isLoading={deleting}>
            {t("shop.manageProducts.delete.confirm")}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setShowDeleteModal(false)}
            isDisabled={deleting}
          >
            {t("shop.manageProducts.delete.cancel")}
          </Button>,
        ]}
      >
        <div>
          <p style={{ marginBottom: "1rem" }}>{t("shop.manageProducts.delete.confirmMessage")}</p>
          {productToDelete && (
            <Alert
              variant="warning"
              isInline
              title={t("shop.manageProducts.delete.productDetails", {
                name: productToDelete.nom,
                price: productToDelete.prix,
              })}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default withAuthRole(
  withAuth(withTracking(withErrorBoundary(ManageProductsPage), "ManageProductsPage")),
  ["admin"],
);
