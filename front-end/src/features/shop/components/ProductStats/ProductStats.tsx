/**
 * ProductStats Component
 *
 * Displays product statistics (total, low stock, out of stock, categories).
 * Atomic component with single responsibility: display product stats.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Flex, FlexItem, Title } from "@patternfly/react-core";
import { CubesIcon, ExclamationTriangleIcon, BanIcon, TagIcon } from '@/shared/icons';
import { useTranslation } from "react-i18next";
import type { ProductStatsProps } from "./ProductStats.types";

export const ProductStats: React.FC<ProductStatsProps> = ({
  totalProducts = 0,
  totalCategories = 0,
  lowStockProducts = 0,
  outOfStockProducts = 0,
  showTotal = true,
  showCategories = true,
  showLowStock = true,
  showOutOfStock = true,
  variant = "horizontal",
  className = "",
}) => {
  const { t } = useTranslation();

  const stats = [];

  if (showTotal) {
    stats.push({
      key: "total",
      label: t("shop.stats.totalProducts"),
      value: totalProducts,
      icon: CubesIcon,
      color: "#0066cc",
    });
  }

  if (showCategories) {
    stats.push({
      key: "categories",
      label: t("shop.stats.totalCategories"),
      value: totalCategories,
      icon: TagIcon,
      color: "#6a6e73",
    });
  }

  if (showLowStock) {
    stats.push({
      key: "lowStock",
      label: t("shop.stats.lowStock"),
      value: lowStockProducts,
      icon: ExclamationTriangleIcon,
      color: "#f0ab00",
    });
  }

  if (showOutOfStock) {
    stats.push({
      key: "outOfStock",
      label: t("shop.stats.outOfStock"),
      value: outOfStockProducts,
      icon: BanIcon,
      color: "#c9190b",
    });
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <Flex
      direction={{ default: variant === "horizontal" ? "row" : "column" }}
      spaceItems={{ default: variant === "horizontal" ? "spaceItemsLg" : "spaceItemsMd" }}
      className={`product-stats product-stats--${variant} ${className}`}
      style={{ marginBottom: "1.5rem" }}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <FlexItem key={stat.key}>
            <Flex
              direction={{ default: "column" }}
              spaceItems={{ default: "spaceItemsNone" }}
            >
              <FlexItem>
                <Flex
                  alignItems={{ default: "alignItemsCenter" }}
                  spaceItems={{ default: "spaceItemsSm" }}
                >
                  <FlexItem>
                    <Icon style={{ color: stat.color }} />
                  </FlexItem>
                  <FlexItem>
                    <Title
                      headingLevel="h3"
                      size="2xl"
                      style={{ color: stat.color, marginBottom: 0 }}
                    >
                      {stat.value}
                    </Title>
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6a6e73",
                    marginTop: "0.25rem",
                    marginBottom: 0,
                  }}
                >
                  {stat.label}
                </p>
              </FlexItem>
            </Flex>
          </FlexItem>
        );
      })}
    </Flex>
  );
};

export default ProductStats;
