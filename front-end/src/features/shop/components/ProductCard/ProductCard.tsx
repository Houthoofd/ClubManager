/**
 * ProductCard Component
 *
 * Displays product information in a card format.
 * Atomic component with single responsibility: render product data.
 * Fully internationalized with i18n support.
 */

import React from "react";
import {
  Card,
  CardBody,
  Title,
  Label,
  Flex,
  FlexItem,
  Button,
} from "@patternfly/react-core";
import {
  ShoppingCartIcon,
  CubeIcon,
  TagIcon,
  ImageIcon,
} from '@/shared/icons';
import { useTranslation } from "react-i18next";
import type { ProductCardProps } from "./ProductCard.types";
import {
  formatPrice,
  formatStock,
  getStockColor,
  truncateDescription,
  formatImageUrl,
} from "../../utils/product-formatters";

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  price,
  category,
  images = [],
  stock,
  sizes = [],
  onClick,
  onAddToCart,
  actions,
  className = "",
  showAddToCart = true,
  compact = false,
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(id);
    }
  };

  const formattedPrice = formatPrice(price);
  const formattedStock = formatStock(stock);
  const stockColor = getStockColor(stock);
  const mainImage = images.length > 0 ? formatImageUrl(images[0]) : null;
  const isOutOfStock = stock === 0;

  return (
    <Card
      className={`product-card ${compact ? "product-card--compact" : ""} ${className}`}
      style={{
        marginBottom: "1rem",
        cursor: onClick ? "pointer" : "default",
        opacity: isOutOfStock ? 0.7 : 1,
      }}
      onClick={handleClick}
      isClickable={!!onClick}
    >
      <CardBody>
        <Flex
          direction={{ default: "column" }}
          spaceItems={{ default: "spaceItemsSm" }}
        >
          {/* Product Image */}
          {!compact && mainImage && (
            <FlexItem>
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={mainImage}
                  alt={name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div style="text-align: center; color: #6a6e73;"><svg style="width: 64px; height: 64px;" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>`;
                    }
                  }}
                />
              </div>
            </FlexItem>
          )}

          {/* Header with Product Name and Actions */}
          <Flex
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem flex={{ default: "flex_1" }}>
              <Title headingLevel="h4" size="md">
                <CubeIcon style={{ marginRight: "0.5rem" }} />
                {name}
              </Title>
            </FlexItem>
            {actions && <FlexItem>{actions}</FlexItem>}
          </Flex>

          {/* Category */}
          {category && (
            <FlexItem>
              <Label color="blue" icon={<TagIcon />}>
                {category}
              </Label>
            </FlexItem>
          )}

          {/* Price */}
          <FlexItem>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#151515",
              }}
            >
              {formattedPrice}
            </div>
          </FlexItem>

          {/* Stock Status */}
          <FlexItem>
            <Label color={stockColor}>
              {formattedStock}
            </Label>
          </FlexItem>

          {/* Sizes */}
          {sizes.length > 0 && (
            <FlexItem>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6a6e73",
                }}
              >
                <strong>{t("shop.products.size")}:</strong>{" "}
                {sizes.join(", ")}
              </div>
            </FlexItem>
          )}

          {/* Description */}
          {!compact && description && (
            <FlexItem>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6a6e73",
                  marginTop: "0.5rem",
                }}
              >
                {truncateDescription(description, 120)}
              </div>
            </FlexItem>
          )}

          {/* Add to Cart Button */}
          {showAddToCart && onAddToCart && (
            <FlexItem style={{ marginTop: "0.5rem" }}>
              <Button
                variant="primary"
                icon={<ShoppingCartIcon />}
                onClick={handleAddToCart}
                isDisabled={isOutOfStock}
                style={{ width: "100%" }}
              >
                {isOutOfStock
                  ? t("shop.products.outOfStock")
                  : t("shop.products.addToCart")}
              </Button>
            </FlexItem>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};

export default ProductCard;
