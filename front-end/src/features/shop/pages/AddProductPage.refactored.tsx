import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PageSection,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button,
  Select,
  SelectOption,
  SelectVariant,
  Alert,
  Modal,
  ModalVariant,
  List,
  ListItem,
  Card,
  CardBody,
  Title,
} from "@patternfly/react-core";
import { PlusCircleIcon, TrashIcon } from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withAuthRole } from "@/shared/hocs/withAuthRole";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useGetProductCategoriesQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/core/api/graphql/generated/graphql";
import { useCheckProductByNameAndCategory } from "@/features/auth/hooks/useVerification";

interface StockItem {
  taille: string;
  quantite: number;
}

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

/**
 * AddProductPage Component
 *
 * Form to create or edit a product
 * Supports both create and edit modes via URL parameter ?id=X
 *
 * @architecture
 * - GraphQL: useCreateProductMutation, useUpdateProductMutation, useGetProductQuery
 * - Zustand: uiStore (notifications)
 * - HOCs: withAuthRole (admin only), withAuth, withTracking, withErrorBoundary
 * - i18n: shop.addProduct.*
 *
 * @permissions Admin only
 */
const AddProductPage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  const isEditMode = !!productId;
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state) => state.addNotification);

  // Form state
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string>("");
  const [stocks, setStocks] = useState<StockItem[]>([{ taille: "", quantite: 0 }]);

  // UI state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showModificationsModal, setShowModificationsModal] = useState(false);
  const [modifications, setModifications] = useState<ModificationItem[]>([]);
  const [originalData, setOriginalData] = useState<any>(null);

  // GraphQL queries
  const { data: categoriesData } = useGetProductCategoriesQuery();
  const {
    data: productData,
    loading: loadingProduct,
    error: productError,
  } = useGetProductQuery({
    variables: { id: Number(productId) },
    skip: !isEditMode || !productId,
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutations
  const [createProduct, { loading: creating }] = useCreateProductMutation();
  const [updateProduct, { loading: updating }] = useUpdateProductMutation();
  const checkProductByNameAndCategory = useCheckProductByNameAndCategory();

  // Extract categories from query
  const categories = useMemo(() => {
    return categoriesData?.productCategories || [];
  }, [categoriesData]);

  // Load existing product data in edit mode
  useEffect(() => {
    if (isEditMode && productData?.product) {
      const product = productData.product;

      setName(product.nom || "");
      setDescription(product.description || "");
      setPrice(product.prix?.toString() || "");
      setSelectedCategory(product.categorie_id?.toString() || "");

      const imageUrlsText = product.images?.map((img: any) => img.url).join("\n") || "";
      setImageUrls(imageUrlsText);

      const productStocks =
        product.stocks?.map((s: any) => ({
          taille: s.taille || "",
          quantite: s.quantite || 0,
        })) || [{ taille: "", quantite: 0 }];
      setStocks(productStocks);

      setOriginalData({
        name: product.nom,
        description: product.description,
        price: product.prix,
        categoryId: product.categorie_id,
        imageUrls: imageUrlsText,
        stocks: productStocks,
      });

      trackEvent("product_edit_started", { productId });
    }
  }, [isEditMode, productData, trackEvent, productId]);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      addNotification({
        type: "error",
        message: t("shop.addProduct.validation.nameRequired"),
      });
      return false;
    }

    if (!description.trim()) {
      addNotification({
        type: "error",
        message: t("shop.addProduct.validation.descriptionRequired"),
      });
      return false;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      addNotification({
        type: "error",
        message: t("shop.addProduct.validation.priceInvalid"),
      });
      return false;
    }

    if (!selectedCategory) {
      addNotification({
        type: "error",
        message: t("shop.addProduct.validation.categoryRequired"),
      });
      return false;
    }

    // Validate at least one stock item
    const validStocks = stocks.filter((s) => s.taille.trim() && s.quantite > 0);
    if (validStocks.length === 0) {
      addNotification({
        type: "error",
        message: t("shop.addProduct.validation.stockRequired"),
      });
      return false;
    }

    return true;
  };

  /**
   * Detect modifications for edit mode
   */
  const detectModifications = (): ModificationItem[] => {
    if (!originalData) return [];

    const changes: ModificationItem[] = [];

    if (name !== originalData.name) {
      changes.push({
        field: t("shop.addProduct.form.name"),
        oldValue: originalData.name,
        newValue: name,
      });
    }

    if (description !== originalData.description) {
      changes.push({
        field: t("shop.addProduct.form.description"),
        oldValue: originalData.description,
        newValue: description,
      });
    }

    if (parseFloat(price) !== originalData.price) {
      changes.push({
        field: t("shop.addProduct.form.price"),
        oldValue: `${originalData.price}€`,
        newValue: `${price}€`,
      });
    }

    if (selectedCategory !== originalData.categoryId?.toString()) {
      const oldCategory = categories.find(
        (c: any) => c.id === originalData.categoryId
      );
      const newCategory = categories.find(
        (c: any) => c.id === Number(selectedCategory)
      );
      changes.push({
        field: t("shop.addProduct.form.category"),
        oldValue: oldCategory?.nom || oldCategory?.name || "",
        newValue: newCategory?.nom || newCategory?.name || "",
      });
    }

    if (imageUrls !== originalData.imageUrls) {
      changes.push({
        field: t("shop.addProduct.form.images"),
        oldValue: originalData.imageUrls || t("common.none"),
        newValue: imageUrls || t("common.none"),
      });
    }

    // Check stock changes
    const originalStocksText = originalData.stocks
      .map((s: StockItem) => `${s.taille}: ${s.quantite}`)
      .join(", ");
    const currentStocksText = stocks
      .filter((s) => s.taille.trim() && s.quantite > 0)
      .map((s) => `${s.taille}: ${s.quantite}`)
      .join(", ");

    if (originalStocksText !== currentStocksText) {
      changes.push({
        field: t("shop.addProduct.form.stock"),
        oldValue: originalStocksText,
        newValue: currentStocksText,
      });
    }

    return changes;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode) {
      // Detect modifications
      const detectedChanges = detectModifications();

      if (detectedChanges.length === 0) {
        addNotification({
          type: "info",
          message: t("shop.addProduct.modifications.noChanges"),
        });
        return;
      }

      // Show confirmation modal for modifications
      setModifications(detectedChanges);
      setShowModificationsModal(true);
    } else {
      // Check if product already exists
      const exists = await checkProductByNameAndCategory(
        name,
        Number(selectedCategory)
      );

      if (exists) {
        addNotification({
          type: "error",
          message: t("shop.addProduct.error.alreadyExists"),
        });
        return;
      }

      await executeCreate();
    }
  };

  /**
   * Execute product creation
   */
  const executeCreate = async () => {
    try {
      const imageUrlsArray = imageUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const validStocks = stocks.filter((s) => s.taille.trim() && s.quantite > 0);

      await createProduct({
        variables: {
          input: {
            nom: name,
            description,
            prix: parseFloat(price),
            categorie_id: Number(selectedCategory),
            images: imageUrlsArray,
            stocks: validStocks,
          },
        },
      });

      addNotification({
        type: "success",
        message: t("shop.addProduct.success.created", { name }),
      });

      trackEvent("product_created", {
        name,
        categoryId: selectedCategory,
        price: parseFloat(price),
        stockCount: validStocks.length,
      });

      // Redirect to manage products page
      setTimeout(() => {
        navigate("/pages/magasin/gerer");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating product:", error);

      addNotification({
        type: "error",
        message: error?.message || t("shop.addProduct.error.createFailed"),
      });

      trackEvent("product_create_failed", {
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Execute product update
   */
  const executeUpdate = async () => {
    try {
      const imageUrlsArray = imageUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const validStocks = stocks.filter((s) => s.taille.trim() && s.quantite > 0);

      await updateProduct({
        variables: {
          id: Number(productId),
          input: {
            nom: name,
            description,
            prix: parseFloat(price),
            categorie_id: Number(selectedCategory),
            images: imageUrlsArray,
            stocks: validStocks,
          },
        },
      });

      addNotification({
        type: "success",
        message: t("shop.addProduct.success.updated"),
      });

      trackEvent("product_updated", {
        productId,
        modificationsCount: modifications.length,
      });

      setShowModificationsModal(false);

      // Redirect to manage products page
      setTimeout(() => {
        navigate("/pages/magasin/gerer");
      }, 1500);
    } catch (error: any) {
      console.error("Error updating product:", error);

      addNotification({
        type: "error",
        message: error?.message || t("shop.addProduct.error.updateFailed"),
      });

      trackEvent("product_update_failed", {
        productId,
        error: error?.message || "unknown",
      });

      setShowModificationsModal(false);
    }
  };

  /**
   * Add new stock item
   */
  const handleAddStock = () => {
    setStocks([...stocks, { taille: "", quantite: 0 }]);
  };

  /**
   * Remove stock item
   */
  const handleRemoveStock = (index: number) => {
    const newStocks = stocks.filter((_, i) => i !== index);
    setStocks(newStocks.length > 0 ? newStocks : [{ taille: "", quantite: 0 }]);
  };

  /**
   * Update stock item
   */
  const handleUpdateStock = (index: number, field: "taille" | "quantite", value: any) => {
    const newStocks = [...stocks];
    if (field === "quantite") {
      newStocks[index][field] = parseInt(value) || 0;
    } else {
      newStocks[index][field] = value;
    }
    setStocks(newStocks);
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    if (isEditMode && originalData) {
      setName(originalData.name);
      setDescription(originalData.description);
      setPrice(originalData.price.toString());
      setSelectedCategory(originalData.categoryId?.toString() || "");
      setImageUrls(originalData.imageUrls);
      setStocks(originalData.stocks);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setSelectedCategory("");
      setImageUrls("");
      setStocks([{ taille: "", quantite: 0 }]);
    }
  };

  // Loading state
  if (isEditMode && loadingProduct) {
    return (
      <div>
        <PageHeader
          title={t("shop.addProduct.titleEdit")}
          subtitle={t("shop.addProduct.subtitleEdit")}
          variant="store"
        />
        <PageSection>
          <Alert variant="info" title={t("common.loading")} />
        </PageSection>
      </div>
    );
  }

  // Error state
  if (isEditMode && productError) {
    return (
      <div>
        <PageHeader
          title={t("shop.addProduct.titleEdit")}
          subtitle={t("shop.addProduct.subtitleEdit")}
          variant="store"
        />
        <PageSection>
          <Alert variant="danger" title={t("shop.addProduct.error.loadFailed")} />
        </PageSection>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditMode ? t("shop.addProduct.titleEdit") : t("shop.addProduct.title")}
        subtitle={
          isEditMode ? t("shop.addProduct.subtitleEdit") : t("shop.addProduct.subtitle")
        }
        variant="store"
      />

      <PageSection>
        <Form onSubmit={handleSubmit} style={{ maxWidth: "800px" }}>
          {/* Product Name */}
          <FormGroup label={t("shop.addProduct.form.name")} isRequired>
            <TextInput
              type="text"
              value={name}
              onChange={(value) => setName(value)}
              placeholder={t("shop.addProduct.form.namePlaceholder")}
            />
          </FormGroup>

          {/* Description */}
          <FormGroup label={t("shop.addProduct.form.description")} isRequired>
            <TextArea
              value={description}
              onChange={(value) => setDescription(value)}
              placeholder={t("shop.addProduct.form.descriptionPlaceholder")}
              rows={4}
            />
          </FormGroup>

          {/* Price */}
          <FormGroup label={t("shop.addProduct.form.price")} isRequired>
            <TextInput
              type="number"
              step="0.01"
              value={price}
              onChange={(value) => setPrice(value)}
              placeholder={t("shop.addProduct.form.pricePlaceholder")}
            />
          </FormGroup>

          {/* Category */}
          <FormGroup label={t("shop.addProduct.form.category")} isRequired>
            <Select
              variant={SelectVariant.single}
              onToggle={() => setIsCategoryOpen(!isCategoryOpen)}
              onSelect={(_, value) => {
                setSelectedCategory(value as string);
                setIsCategoryOpen(false);
              }}
              selections={selectedCategory}
              isOpen={isCategoryOpen}
              placeholderText={t("shop.addProduct.form.categoryPlaceholder")}
            >
              {categories.map((category: any) => (
                <SelectOption key={category.id} value={category.id.toString()}>
                  {category.nom || category.name}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          {/* Image URLs */}
          <FormGroup label={t("shop.addProduct.form.images")}>
            <TextArea
              value={imageUrls}
              onChange={(value) => setImageUrls(value)}
              placeholder={t("shop.addProduct.form.imagesPlaceholder")}
              rows={3}
            />
          </FormGroup>

          {/* Stock Management */}
          <FormGroup label={t("shop.addProduct.form.stock")} isRequired>
            <Card isCompact>
              <CardBody>
                {stocks.map((stock, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginBottom: "1rem",
                      alignItems: "flex-end",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                        {t("shop.addProduct.form.size")}
                      </label>
                      <TextInput
                        type="text"
                        value={stock.taille}
                        onChange={(value) => handleUpdateStock(index, "taille", value)}
                        placeholder="S, M, L, XL..."
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                        {t("shop.addProduct.form.quantity")}
                      </label>
                      <TextInput
                        type="number"
                        value={stock.quantite}
                        onChange={(value) => handleUpdateStock(index, "quantite", value)}
                        placeholder="0"
                      />
                    </div>
                    <Button
                      variant="danger"
                      icon={<TrashIcon />}
                      onClick={() => handleRemoveStock(index)}
                      isDisabled={stocks.length === 1}
                    >
                      {t("shop.addProduct.form.removeStock")}
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  icon={<PlusCircleIcon />}
                  onClick={handleAddStock}
                  style={{ marginTop: "0.5rem" }}
                >
                  {t("shop.addProduct.form.addStock")}
                </Button>
              </CardBody>
            </Card>
          </FormGroup>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <Button
              type="submit"
              variant="primary"
              isDisabled={creating || updating}
              isLoading={creating || updating}
            >
              {isEditMode
                ? t("shop.addProduct.submitEdit")
                : t("shop.addProduct.submit")}
            </Button>

            <Button
              variant="secondary"
              onClick={resetForm}
              isDisabled={creating || updating}
            >
              {t("shop.addProduct.reset")}
            </Button>

            <Button
              variant="link"
              onClick={() => navigate("/pages/magasin/gerer")}
              isDisabled={creating || updating}
            >
              {t("shop.addProduct.cancel")}
            </Button>
          </div>
        </Form>
      </PageSection>

      {/* Modifications confirmation modal */}
      <Modal
        variant={ModalVariant.small}
        title={t("shop.addProduct.modifications.title")}
        isOpen={showModificationsModal}
        onClose={() => setShowModificationsModal(false)}
        actions={[
          <Button key="confirm" variant="primary" onClick={executeUpdate} isLoading={updating}>
            {t("shop.addProduct.modifications.confirm")}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setShowModificationsModal(false)}
            isDisabled={updating}
          >
            {t("shop.addProduct.modifications.cancel")}
          </Button>,
        ]}
      >
        <div>
          <p style={{ marginBottom: "1rem" }}>
            {t("shop.addProduct.modifications.subtitle")}
          </p>
          <List>
            {modifications.map((mod, idx) => (
              <ListItem key={idx}>
                <strong>{mod.field}:</strong>{" "}
                {mod.oldValue && (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#6a6e73" }}>
                      {mod.oldValue}
                    </span>{" "}
                    →{" "}
                  </>
                )}
                <span style={{ color: "#06c" }}>{mod.newValue}</span>
              </ListItem>
            ))}
          </List>
        </div>
      </Modal>
    </div>
  );
};

// Export with HOCs: Role-based auth (admin only), Auth, Tracking, Error boundary
export default withAuthRole(
  withAuth(withTracking(withErrorBoundary(AddProductPage), "AddProductPage")),
  ["admin"]
);
