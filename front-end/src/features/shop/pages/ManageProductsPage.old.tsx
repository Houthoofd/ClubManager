import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageSection,
  Button,
  Alert,
  Card,
  CardBody,
  CardTitle,
  CardActions,
  CardHeader,
  Modal,
  ModalVariant,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  KebabToggle,
  Title,
  Divider,
  Label,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
} from "@patternfly/react-core";
import {
  PlusCircleIcon,
  TrashIcon,
  EditIcon,
  CubesIcon,
  TagIcon,
} from "@patternfly/react-icons";
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
 * ManageProductsPage Component
 *
 * Displays and manages all products in the shop
 * Allows editing, deleting products
 *
 * @architecture
 * - GraphQL: useGetProductsQuery, useGetProductCategoriesQuery, useDeleteProductMutation
 * - Zustand: uiStore (notifications)
 * - HOCs: withAuthRole (admin only), withAuth, withTracking, withErrorBoundary
 * - i18n: shop.manageProducts.*
 *
 * @permissions Admin only
 */
const ManageProductsPage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state) => state.addNotification);

  // Local state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<{ [key: number]: boolean }>({});

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

  // GraphQL mutations
  const [deleteProduct, { loading: deleting }] = useDeleteProductMutation();

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

  // Calculate stats
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
  const handleEditProduct = (product: Product) => {
    trackEvent("product_edit_clicked", { productId: product.id });
    navigate(`/pages/magasin/ajouter?id=${product.id}`);
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    trackEvent("product_delete_clicked", { productId: product.id });
  };

  /**
   * Execute product deletion
   */
  const executeDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct({
        variables: {
          id: productToDelete.id,
        },
      });

      addNotification({
        type: "success",
        message: t("shop.manageProducts.delete.success"),
      });

      trackEvent("product_deleted", {
        productId: productToDelete.id,
        name: productToDelete.nom,
        price: productToDelete.prix,
      });

      setShowDeleteModal(false);
      setProductToDelete(null);

      // Refetch products
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
   * Get total stock for a product
   */
  const getTotalStock = (product: Product): number => {
    return product.stocks?.reduce((sum, s) => sum + s.quantite, 0) || 0;
  };

  /**
   * Get stock status badge
   */
  const getStockStatus = (product: Product) => {
    const totalStock = getTotalStock(product);

    if (totalStock === 0) {
      return {
        label: t("shop.products.outOfStock"),
        color: "red" as const,
      };
    } else if (totalStock <= 5) {
      return {
        label: t("shop.products.lowStock"),
        color: "orange" as const,
      };
    } else {
      return {
        label: t("shop.products.inStock"),
        color: "green" as const,
      };
    }
  };

  /**
   * Format price
   */
  const formatPrice = (price: number): string => {
    return `${price.toFixed(2)}€`;
  };

  // Loading state
  if (loadingProducts || loadingCategories) {
    return (
      <div>
        <PageHeader
          title={t("shop.manageProducts.title")}
          subtitle={t("shop.manageProducts.subtitle")}
          variant="store"
        />
        <PageSection>
          <div className="pf-v5-u-p-lg">
            <Title headingLevel="h2" className="pf-v5-u-mb-md">
              {t("shop.manageProducts.loading")}
            </Title>
            <Gallery hasGutter minWidths={{ default: "300px" }}>
              {[...Array(6)].map((_, idx) => (
                <GalleryItem key={idx}>
                  <SkeletonCard hasImage hasTitle hasDescription />
                </GalleryItem>
              ))}
            </Gallery>
          </div>
        </PageSection>
      </div>
    );
  }

  // Error state
  if (errorProducts || errorCategories) {
    return (
      <div>
        <PageHeader
          title={t("shop.manageProducts.title")}
          subtitle={t("shop.manageProducts.subtitle")}
          variant="store"
        />
        <PageSection>
          <Alert
            variant="danger"
            title={t("shop.manageProducts.loadingError")}
            style={{ borderRadius: "8px" }}
          />
        </PageSection>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("shop.manageProducts.title")}
        subtitle={t("shop.manageProducts.subtitle")}
        variant="store"
      />

      <PageSection>
        {/* Stats and Add button */}
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
          style={{ marginBottom: "2rem" }}
        >
          <FlexItem>
            <Flex spaceItems={{ default: "spaceItemsLg" }}>
              <FlexItem>
                <div>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: "0.25rem" }}>
                    {stats.totalProducts}
                  </Title>
                  <p style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                    {t("shop.manageProducts.stats.totalProducts")}
                  </p>
                </div>
              </FlexItem>
              <FlexItem>
                <div>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: "0.25rem" }}>
                    {stats.totalCategories}
                  </Title>
                  <p style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                    {t("shop.manageProducts.stats.totalCategories")}
                  </p>
                </div>
              </FlexItem>
              <FlexItem>
                <div>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: "0.25rem", color: "#f0ab00" }}>
                    {stats.lowStock}
                  </Title>
                  <p style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                    {t("shop.manageProducts.stats.lowStock")}
                  </p>
                </div>
              </FlexItem>
              <FlexItem>
                <div>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: "0.25rem", color: "#c9190b" }}>
                    {stats.outOfStock}
                  </Title>
                  <p style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                    {t("shop.manageProducts.stats.outOfStock")}
                  </p>
                </div>
              </FlexItem>
            </Flex>
          </FlexItem>

          <FlexItem>
            <Button
              variant="primary"
              icon={<PlusCircleIcon />}
              onClick={() => navigate("/pages/magasin/ajouter")}
            >
              {t("shop.manageProducts.createFirst")}
            </Button>
          </FlexItem>
        </Flex>

        <Divider style={{ marginBottom: "2rem" }} />

        {/* Product groups by category */}
        {Object.keys(productsByCategory).length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <Title headingLevel="h3" style={{ color: "#6c757d", marginBottom: "1rem" }}>
              {t("shop.manageProducts.noProducts")}
            </Title>
            <p style={{ marginBottom: "1.5rem", color: "#6a6e73" }}>
              {t("shop.manageProducts.noProductsMessage")}
            </p>
            <Button
              variant="primary"
              icon={<PlusCircleIcon />}
              onClick={() => navigate("/pages/magasin/ajouter")}
            >
              {t("shop.manageProducts.createFirst")}
            </Button>
          </div>
        ) : (
          Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => {
            if (categoryProducts.length === 0) return null;

            return (
              <div key={categoryName} style={{ marginBottom: "2rem" }}>
                {/* Category header */}
                <div style={{ marginBottom: "1rem" }}>
                  <Title headingLevel="h2" size="lg">
                    <TagIcon style={{ marginRight: "0.5rem" }} />
                    {categoryName}
                  </Title>
                  <p style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                    {categoryProducts.length} {t("shop.products.title").toLowerCase()}
                  </p>
                </div>

                {/* Products gallery */}
                <Gallery hasGutter minWidths={{ default: "300px" }}>
                  {categoryProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const totalStock = getTotalStock(product);

                    return (
                      <GalleryItem key={product.id}>
                        <Card isRounded isCompact isFullHeight>
                          <CardHeader>
                            <CardTitle>
                              <Flex
                                justifyContent={{ default: "justifyContentSpaceBetween" }}
                                alignItems={{ default: "alignItemsCenter" }}
                              >
                                <FlexItem style={{ flex: 1 }}>
                                  <Title headingLevel="h4" size="md">
                                    {product.nom}
                                  </Title>
                                </FlexItem>
                                <FlexItem>
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
                                        onClick={() => handleEditProduct(product)}
                                      >
                                        {t("shop.manageProducts.actions.edit")}
                                      </DropdownItem>,
                                      <DropdownItem
                                        key="delete"
                                        icon={<TrashIcon />}
                                        onClick={() => handleDeleteProduct(product)}
                                      >
                                        {t("shop.manageProducts.actions.delete")}
                                      </DropdownItem>,
                                    ]}
                                  />
                                </FlexItem>
                              </Flex>
                            </CardTitle>
                          </CardHeader>

                          <CardBody>
                            {/* Product image */}
                            {product.images && product.images.length > 0 && (
                              <div style={{ marginBottom: "1rem" }}>
                                <img
                                  src={product.images[0].url}
                                  alt={product.nom}
                                  style={{
                                    width: "100%",
                                    height: "200px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                              </div>
                            )}

                            {/* Description */}
                            {product.description && (
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#6a6e73",
                                  marginBottom: "1rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {product.description}
                              </p>
                            )}

                            {/* Price */}
                            <Title headingLevel="h3" size="lg" style={{ marginBottom: "0.5rem" }}>
                              {formatPrice(product.prix)}
                            </Title>

                            {/* Stock status */}
                            <Flex spaceItems={{ default: "spaceItemsSm" }} style={{ marginBottom: "0.5rem" }}>
                              <FlexItem>
                                <Label color={stockStatus.color}>{stockStatus.label}</Label>
                              </FlexItem>
                              <FlexItem>
                                <Label icon={<CubesIcon />} isCompact>
                                  {totalStock} {t("shop.products.stock")}
                                </Label>
                              </FlexItem>
                            </Flex>

                            {/* Stock by size */}
                            {product.stocks && product.stocks.length > 0 && (
                              <div style={{ marginTop: "0.5rem" }}>
                                <Flex spaceItems={{ default: "spaceItemsXs" }} style={{ flexWrap: "wrap" }}>
                                  {product.stocks.map((stock) => (
                                    <FlexItem key={stock.id}>
                                      <Label isCompact>
                                        {stock.taille}: {stock.quantite}
                                      </Label>
                                    </FlexItem>
                                  ))}
                                </Flex>
                              </div>
                            )}
                          </CardBody>

                          <CardActions>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<EditIcon />}
                              onClick={() => handleEditProduct(product)}
                            >
                              {t("shop.manageProducts.actions.edit")}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<TrashIcon />}
                              onClick={() => handleDeleteProduct(product)}
                            >
                              {t("shop.manageProducts.actions.delete")}
                            </Button>
                          </CardActions>
                        </Card>
                      </GalleryItem>
                    );
                  })}
                </Gallery>
              </div>
            );
          })
        )}
      </PageSection>

      {/* Delete confirmation modal */}
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
          <p style={{ marginBottom: "1rem" }}>
            {t("shop.manageProducts.delete.confirmMessage")}
          </p>
          {productToDelete && (
            <>
              <Alert
                variant="warning"
                isInline
                title={t("shop.manageProducts.delete.confirmMessageDetails", {
                  name: productToDelete.nom,
                  price: formatPrice(productToDelete.prix),
                })}
              />
              <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6a6e73" }}>
                {t("shop.manageProducts.delete.permanent")}
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

// Export with HOCs: Role-based auth (admin only), Auth, Tracking, Error boundary
export default withAuthRole(
  withAuth(withTracking(withErrorBoundary(ManageProductsPage), "ManageProductsPage")),
  ["admin"]
);
