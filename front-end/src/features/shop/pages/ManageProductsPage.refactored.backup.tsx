/**
 * ====================================================================
 * ManageProductsPage - IMPROVED WITH CUSTOM HOOKS
 * ====================================================================
 *
 * Enhanced version using custom business hooks for better performance
 * and maintainability.
 *
 * Custom Hooks Used:
 * - useTableControls (filter + sort + pagination combined)
 * - useDebounce (search optimization)
 * - useExport (CSV/PDF export)
 * - useLocalStorage (view preference persistence)
 *
 * @architecture
 * - GraphQL: useGetProductsQuery, useDeleteProductMutation
 * - Zustand: uiStore (notifications)
 * - Custom Hooks: usePagination, useTableSort, useTableFilter, useExport
 * - HOCs: withAuthRole (admin only), withAuth, withTracking, withErrorBoundary
 * - i18n: shop.manageProducts.*
 *
 * @permissions Admin only
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageSection,
  Button,
  Alert,
  Card,
  CardBody,
  CardTitle,
  CardHeader,
  Modal,
  ModalVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Select,
  SelectOption,
  SelectVariant,
  Pagination,
  Gallery,
  GalleryItem,
  Flex,
  FlexItem,
  Label,
  Badge,
  Divider,
  Dropdown,
  DropdownItem,
  KebabToggle,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
  Spinner,
  Bullseye,
} from "@patternfly/react-core";
import {
  PlusCircleIcon,
  TrashIcon,
  EditIcon,
  CubesIcon,
  TagIcon,
  DownloadIcon,
  SearchIcon,
  SortAmountDownIcon,
  SortAmountUpIcon,
} from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
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

// ============================================================================
// CUSTOM HOOKS IMPORTS
// ============================================================================
import {
  useTableControls,
  useExport,
  type FilterConfig,
} from "@/shared/hooks/business";
import { useDebounce, useLocalStorage } from "@/shared/hooks/utils";

// ============================================================================
// Types
// ============================================================================

interface Product {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  images?: Array<{ id: number; url: string }>;
  stocks?: Array<{ id: number; taille: string; quantite: number }>;
  categorie_id?: number;
}

type ViewMode = "gallery" | "list";
type SortField = "nom" | "prix" | "stock";

// ============================================================================
// Component
// ============================================================================

const ManageProductsPageImproved = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state) => state.addNotification);

  // ============================================================================
  // CUSTOM HOOK: useLocalStorage - Persist view preference
  // ============================================================================
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    "products-view-mode",
    "gallery"
  );

  // ============================================================================
  // Local State
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<{
    [key: number]: boolean;
  }>({});

  // ============================================================================
  // CUSTOM HOOK: useDebounce - Optimize search
  // ============================================================================
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ============================================================================
  // GraphQL Queries
  // ============================================================================
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
  } = useGetProductCategoriesQuery({
    fetchPolicy: "cache-and-network",
  });

  const [deleteProduct, { loading: deleting }] = useDeleteProductMutation();

  // ============================================================================
  // Extract Data
  // ============================================================================
  const products = useMemo(() => {
    return (productsData?.products || []) as Product[];
  }, [productsData]);

  const categories = useMemo(() => {
    return categoriesData?.productCategories || [];
  }, [categoriesData]);

  // ============================================================================
  // CUSTOM HOOK: useTableControls - Combined filter + sort + pagination
  // ============================================================================
  const {
    displayData,
    sortKey,
    sortDirection,
    handleSort,
    setFilter,
    removeFilter,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    filters,
  } = useTableControls(products, {
    itemsPerPage: 12,
    defaultSortKey: "nom",
  });

  // ============================================================================
  // CUSTOM HOOK: useExport - Export functionality
  // ============================================================================
  const { exportToCSV, exportToPDF, isExporting } = useExport();

  // ============================================================================
  // Apply Filters (Debounced Search + Category)
  // ============================================================================
  useEffect(() => {
    // Search filter
    if (debouncedSearch) {
      setFilter({
        field: "nom",
        operator: "contains",
        value: debouncedSearch,
        caseSensitive: false,
      });
    } else {
      removeFilter("nom");
    }
  }, [debouncedSearch, setFilter, removeFilter]);

  useEffect(() => {
    // Category filter
    if (selectedCategory) {
      setFilter({
        field: "categorie_id",
        operator: "equals",
        value: parseInt(selectedCategory),
      });
    } else {
      removeFilter("categorie_id");
    }
  }, [selectedCategory, setFilter, removeFilter]);

  // ============================================================================
  // Statistics
  // ============================================================================
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

  // ============================================================================
  // Handlers
  // ============================================================================

  const toggleActionDropdown = (productId: number) => {
    setActionDropdownOpen((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleEditProduct = (product: Product) => {
    trackEvent("product_edit_clicked", { productId: product.id });
    navigate(`/pages/magasin/ajouter?id=${product.id}`);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    trackEvent("product_delete_clicked", { productId: product.id });
  };

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
    }
  };

  const getTotalStock = (product: Product): number => {
    return product.stocks?.reduce((sum, s) => sum + s.quantite, 0) || 0;
  };

  const getStockStatus = (product: Product) => {
    const totalStock = getTotalStock(product);

    if (totalStock === 0) {
      return { label: t("shop.products.outOfStock"), color: "red" as const };
    } else if (totalStock <= 5) {
      return { label: t("shop.products.lowStock"), color: "orange" as const };
    } else {
      return { label: t("shop.products.inStock"), color: "green" as const };
    }
  };

  // ============================================================================
  // Export Handlers (Using useExport hook)
  // ============================================================================

  const handleExportCSV = () => {
    exportToCSV(displayData, {
      filename: `products-export-${new Date().toISOString().split("T")[0]}`,
      columns: ["nom", "prix", "categorie_id"],
      columnLabels: {
        nom: "Nom du Produit",
        prix: "Prix (€)",
        categorie_id: "Catégorie ID",
      },
    });
    trackEvent("products_export_csv", { count: displayData.length });
  };

  const handleExportPDF = () => {
    exportToPDF(displayData, {
      filename: `products-export-${new Date().toISOString().split("T")[0]}`,
      title: "Liste des Produits",
      columns: ["nom", "prix"],
      columnLabels: {
        nom: "Nom du Produit",
        prix: "Prix (€)",
      },
    });
    trackEvent("products_export_pdf", { count: displayData.length });
  };

  // ============================================================================
  // Clear Filters
  // ============================================================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    trackEvent("products_filters_cleared");
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loadingProducts || loadingCategories) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner size="xl" />
        </Bullseye>
      </PageSection>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (errorProducts) {
    return (
      <PageSection>
        <Alert variant="danger" title={t("shop.manageProducts.loadingError")} isInline>
          {errorProducts.message}
        </Alert>
      </PageSection>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <PageHeader
        title={t("shop.manageProducts.title")}
        subtitle={t("shop.manageProducts.subtitle")}
        variant="manage-products"
      />

      <PageSection>
        {/* ================================================================ */}
        {/* STATS CARDS */}
        {/* ================================================================ */}
        <Flex gap={{ default: "gapMd" }} style={{ marginBottom: "1rem" }}>
          <FlexItem>
            <Card isCompact>
              <CardBody>
                <Flex direction={{ default: "column" }}>
                  <FlexItem>
                    <CubesIcon size="lg" />
                  </FlexItem>
                  <FlexItem>
                    <Title headingLevel="h4" size="2xl">
                      {stats.totalProducts}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                      {t("shop.manageProducts.stats.totalProducts")}
                    </span>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>

          <FlexItem>
            <Card isCompact>
              <CardBody>
                <Flex direction={{ default: "column" }}>
                  <FlexItem>
                    <TagIcon size="lg" />
                  </FlexItem>
                  <FlexItem>
                    <Title headingLevel="h4" size="2xl">
                      {stats.totalCategories}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                      {t("shop.manageProducts.stats.totalCategories")}
                    </span>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>

          {stats.lowStock > 0 && (
            <FlexItem>
              <Card isCompact>
                <CardBody>
                  <Flex direction={{ default: "column" }}>
                    <FlexItem>
                      <Badge color="orange">{stats.lowStock}</Badge>
                    </FlexItem>
                    <FlexItem>
                      <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                        Stock faible
                      </span>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          )}

          {stats.outOfStock > 0 && (
            <FlexItem>
              <Card isCompact>
                <CardBody>
                  <Flex direction={{ default: "column" }}>
                    <FlexItem>
                      <Badge color="red">{stats.outOfStock}</Badge>
                    </FlexItem>
                    <FlexItem>
                      <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                        Rupture de stock
                      </span>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          )}
        </Flex>

        {/* ================================================================ */}
        {/* TOOLBAR: Search + Filters + Export + Actions */}
        {/* ================================================================ */}
        <Card>
          <CardBody>
            <Toolbar>
              <ToolbarContent>
                {/* Search with debounce */}
                <ToolbarItem style={{ flexGrow: 1, minWidth: "300px" }}>
                  <SearchInput
                    placeholder={t("shop.manageProducts.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(_event, value) => setSearchTerm(value)}
                    onClear={() => setSearchTerm("")}
                  />
                </ToolbarItem>

                {/* Category filter */}
                <ToolbarItem>
                  <Select
                    variant={SelectVariant.single}
                    onToggle={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
                    onSelect={(_, value) => {
                      setSelectedCategory(value.toString());
                      setIsCategoryFilterOpen(false);
                    }}
                    selections={selectedCategory}
                    isOpen={isCategoryFilterOpen}
                    placeholderText={t("shop.manageProducts.filterByCategory")}
                  >
                    <SelectOption value="">
                      {t("shop.manageProducts.allCategories")}
                    </SelectOption>
                    {categories.map((cat: any) => (
                      <SelectOption key={cat.id} value={cat.id.toString()}>
                        {cat.nom || cat.name}
                      </SelectOption>
                    ))}
                  </Select>
                </ToolbarItem>

                {/* Sort buttons */}
                <ToolbarItem>
                  <Button
                    variant="plain"
                    onClick={() => handleSort("nom")}
                    icon={
                      sortKey === "nom" && sortDirection === "asc" ? (
                        <SortAmountUpIcon />
                      ) : (
                        <SortAmountDownIcon />
                      )
                    }
                  >
                    Nom
                  </Button>
                </ToolbarItem>

                <ToolbarItem>
                  <Button
                    variant="plain"
                    onClick={() => handleSort("prix")}
                    icon={
                      sortKey === "prix" && sortDirection === "asc" ? (
                        <SortAmountUpIcon />
                      ) : (
                        <SortAmountDownIcon />
                      )
                    }
                  >
                    Prix
                  </Button>
                </ToolbarItem>

                {/* Export buttons */}
                <ToolbarItem>
                  <Button
                    variant="secondary"
                    icon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    isDisabled={isExporting || displayData.length === 0}
                  >
                    CSV
                  </Button>
                </ToolbarItem>

                <ToolbarItem>
                  <Button
                    variant="secondary"
                    icon={<DownloadIcon />}
                    onClick={handleExportPDF}
                    isDisabled={isExporting || displayData.length === 0}
                  >
                    PDF
                  </Button>
                </ToolbarItem>

                {/* Add product button */}
                <ToolbarItem>
                  <Button
                    variant="primary"
                    icon={<PlusCircleIcon />}
                    onClick={() => navigate("/pages/magasin/ajouter")}
                  >
                    {t("shop.manageProducts.addProduct")}
                  </Button>
                </ToolbarItem>

                {/* Clear filters */}
                {(searchTerm || selectedCategory) && (
                  <ToolbarItem>
                    <Button variant="link" onClick={handleClearFilters}>
                      {t("shop.manageProducts.clearFilters")}
                    </Button>
                  </ToolbarItem>
                )}
              </ToolbarContent>
            </Toolbar>

            {/* Active filters info */}
            {filters.length > 0 && (
              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                  {displayData.length} produit(s) affiché(s) sur {products.length}
                </span>
              </div>
            )}

            <Divider style={{ margin: "1rem 0" }} />

            {/* ============================================================ */}
            {/* PRODUCTS GALLERY */}
            {/* ============================================================ */}

            {displayData.length === 0 ? (
              <EmptyState>
                <EmptyStateIcon icon={SearchIcon} />
                <Title headingLevel="h4" size="lg">
                  {searchTerm || selectedCategory
                    ? t("shop.manageProducts.noResults")
                    : t("shop.manageProducts.noProducts")}
                </Title>
                <EmptyStateBody>
                  {searchTerm || selectedCategory
                    ? t("shop.manageProducts.tryDifferentFilters")
                    : t("shop.manageProducts.noProductsMessage")}
                </EmptyStateBody>
                {!searchTerm && !selectedCategory && (
                  <Button
                    variant="primary"
                    icon={<PlusCircleIcon />}
                    onClick={() => navigate("/pages/magasin/ajouter")}
                  >
                    {t("shop.manageProducts.createFirst")}
                  </Button>
                )}
              </EmptyState>
            ) : (
              <Gallery hasGutter minWidths={{ default: "250px" }}>
                {displayData.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const totalStock = getTotalStock(product);
                  const imageUrl =
                    product.images?.[0]?.url || "/placeholder-product.png";

                  return (
                    <GalleryItem key={product.id}>
                      <Card isCompact isHoverable>
                        <CardHeader
                          actions={{
                            actions: (
                              <Dropdown
                                isPlain
                                onSelect={() => toggleActionDropdown(product.id)}
                                toggle={
                                  <KebabToggle
                                    onToggle={() => toggleActionDropdown(product.id)}
                                  />
                                }
                                isOpen={actionDropdownOpen[product.id] || false}
                                dropdownItems={[
                                  <DropdownItem
                                    key="edit"
                                    icon={<EditIcon />}
                                    onClick={() => handleEditProduct(product)}
                                  >
                                    {t("common.actions.edit")}
                                  </DropdownItem>,
                                  <DropdownItem
                                    key="delete"
                                    icon={<TrashIcon />}
                                    onClick={() => handleDeleteProduct(product)}
                                  >
                                    {t("common.actions.delete")}
                                  </DropdownItem>,
                                ]}
                              />
                            ),
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={product.nom}
                            style={{
                              width: "100%",
                              height: "200px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                        </CardHeader>
                        <CardTitle>{product.nom}</CardTitle>
                        <CardBody>
                          <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                            <FlexItem>
                              <Title headingLevel="h4" size="lg">
                                {product.prix.toFixed(2)} €
                              </Title>
                            </FlexItem>
                            <FlexItem>
                              <Label color={stockStatus.color}>
                                {stockStatus.label} ({totalStock})
                              </Label>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      </Card>
                    </GalleryItem>
                  );
                })}
              </Gallery>
            )}

            {/* ============================================================ */}
            {/* PAGINATION */}
            {/* ============================================================ */}

            {displayData.length > 0 && (
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
                <Pagination
                  itemCount={products.length}
                  perPage={12}
                  page={currentPage}
                  onSetPage={(_, page) => goToPage(page)}
                  onPerPageSelect={() => {}}
                  onNextClick={nextPage}
                  onPreviousClick={prevPage}
                  onFirstClick={() => goToPage(1)}
                  onLastClick={() => goToPage(totalPages)}
                  variant="bottom"
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* ================================================================ */}
        {/* DELETE CONFIRMATION MODAL */}
        {/* ================================================================ */}
        <Modal
          variant={ModalVariant.small}
          title={t("shop.manageProducts.delete.title")}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          actions={[
            <Button
              key="confirm"
              variant="danger"
              onClick={executeDelete}
              isLoading={deleting}
              isDisabled={deleting}
            >
              {t("common.actions.delete")}
            </Button>,
            <Button
              key="cancel"
              variant="link"
              onClick={() => setShowDeleteModal(false)}
              isDisabled={deleting}
            >
              {t("common.actions.cancel")}
            </Button>,
          ]}
        >
          {productToDelete && (
            <p>
              {t("shop.manageProducts.delete.confirm", {
                name: productToDelete.nom,
              })}
            </p>
          )}
        </Modal>
      </PageSection>
    </>
  );
};

// ============================================================================
// Exports with HOCs
// ============================================================================

export default withErrorBoundary(
  withTracking(
    withAuthRole(
      withAuth(ManageProductsPageImproved, {
        requireAuth: true,
        redirectTo: "/login",
      }),
      ["admin"]
    ),
    "manage_products"
  )
);
