import React from "react";
import { Card, CardBody } from "@patternfly/react-core";
import { ArrowUpIcon, ArrowDownIcon } from "@patternfly/react-icons";
import { SkeletonStats } from "@/shared/components/ui";

interface MetricCardProps {
  title: string;
  value: number;
  type: "number" | "currency" | "percentage";
  suffix?: string;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  type,
  suffix,
  trend,
  trendType,
  isLoading = false,
}) => {
  // Show skeleton while loading
  if (isLoading) {
    return <SkeletonStats hasIcon={false} />;
  }
  const formatValue = () => {
    if (typeof value !== "number") return "N/A";

    switch (type) {
      case "currency":
        return `${value.toLocaleString()} €`;
      case "percentage":
        return `${value}%`;
      case "number":
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (!trend || trendType === "neutral") return null;
    return trendType === "positive" ? <ArrowUpIcon /> : <ArrowDownIcon />;
  };

  const getTrendClass = () => {
    if (!trendType) return "";
    return `metric-trend--${trendType}`;
  };

  return (
    <Card className="metric-card">
      <CardBody>
        <div className="metric-card__header">
          <span className="metric-card__title">{title}</span>
        </div>

        <div className="metric-card__content">
          <div className="metric-card__value">
            {formatValue()}
            {suffix && <span className="metric-card__suffix"> {suffix}</span>}
          </div>

          {trend && (
            <div className={`metric-card__trend ${getTrendClass()}`}>
              {getTrendIcon()}
              <span>{trend}</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
