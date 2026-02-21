/**
 * ====================================================================
 * Skeleton Component
 * ====================================================================
 *
 * Loading skeleton placeholder component.
 * Provides visual feedback while content is loading.
 *
 * Usage:
 * ```tsx
 * <Skeleton width="100px" height="20px" />
 * <SkeletonText lines={3} />
 * <SkeletonCircle size="50px" />
 * ```
 */

import React from "react";
import { Skeleton as PFSkeleton } from "@patternfly/react-core";

/**
 * Skeleton shape variants
 */
export type SkeletonShape = "circle" | "square" | "rectangle";

/**
 * Skeleton component props
 */
export interface SkeletonProps {
  /**
   * Width of the skeleton
   */
  width?: string | number;

  /**
   * Height of the skeleton
   */
  height?: string | number;

  /**
   * Shape variant
   * @default 'rectangle'
   */
  shape?: SkeletonShape;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Screen reader text
   */
  screenReaderText?: string;
}

/**
 * Basic skeleton placeholder
 *
 * @example
 * ```tsx
 * <Skeleton width="200px" height="20px" />
 * <Skeleton width={100} height={100} shape="circle" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  shape = "rectangle",
  className = "",
  screenReaderText = "Loading...",
}) => {
  const style: React.CSSProperties = {};

  if (width) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }

  if (height) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  if (shape === "circle") {
    style.borderRadius = "50%";
  } else if (shape === "square") {
    style.borderRadius = "4px";
    if (width && !height) {
      style.height = style.width;
    }
  }

  return <PFSkeleton className={className} style={style} screenreaderText={screenReaderText} />;
};

/**
 * Skeleton text component (multiple lines)
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} />
 * <SkeletonText lines={2} width="80%" />
 * ```
 */
export const SkeletonText: React.FC<{
  lines?: number;
  width?: string;
  className?: string;
}> = ({ lines = 3, width = "100%", className = "" }) => {
  return (
    <div className={className} style={{ width }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width="100%"
          height="16px"
          className={index < lines - 1 ? "pf-v5-u-mb-sm" : ""}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton circle (for avatars, icons)
 *
 * @example
 * ```tsx
 * <SkeletonCircle size="50px" />
 * <SkeletonCircle size={64} />
 * ```
 */
export const SkeletonCircle: React.FC<{
  size?: string | number;
  className?: string;
}> = ({ size = "40px", className = "" }) => {
  const sizeValue = typeof size === "number" ? `${size}px` : size;

  return <Skeleton width={sizeValue} height={sizeValue} shape="circle" className={className} />;
};

/**
 * Skeleton card placeholder
 *
 * @example
 * ```tsx
 * <SkeletonCard />
 * <SkeletonCard hasImage={false} />
 * ```
 */
export const SkeletonCard: React.FC<{
  hasImage?: boolean;
  hasTitle?: boolean;
  hasDescription?: boolean;
  className?: string;
}> = ({ hasImage = true, hasTitle = true, hasDescription = true, className = "" }) => {
  return (
    <div className={`pf-v5-c-card ${className}`}>
      <div className="pf-v5-c-card__body">
        {hasImage && <Skeleton width="100%" height="200px" className="pf-v5-u-mb-md" />}
        {hasTitle && <Skeleton width="70%" height="24px" className="pf-v5-u-mb-sm" />}
        {hasDescription && <SkeletonText lines={3} className="pf-v5-u-mt-sm" />}
      </div>
    </div>
  );
};

/**
 * Skeleton table row
 *
 * @example
 * ```tsx
 * <table>
 *   <tbody>
 *     <SkeletonTableRow columns={4} />
 *     <SkeletonTableRow columns={4} />
 *   </tbody>
 * </table>
 * ```
 */
export const SkeletonTableRow: React.FC<{
  columns?: number;
  className?: string;
}> = ({ columns = 3, className = "" }) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="pf-v5-u-p-md">
          <Skeleton width="100%" height="16px" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton list item
 *
 * @example
 * ```tsx
 * <ul>
 *   <SkeletonListItem />
 *   <SkeletonListItem hasAvatar={false} />
 * </ul>
 * ```
 */
export const SkeletonListItem: React.FC<{
  hasAvatar?: boolean;
  className?: string;
}> = ({ hasAvatar = true, className = "" }) => {
  return (
    <li className={`pf-v5-u-display-flex pf-v5-u-align-items-center pf-v5-u-p-md ${className}`}>
      {hasAvatar && <SkeletonCircle size="40px" className="pf-v5-u-mr-md" />}
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height="16px" className="pf-v5-u-mb-sm" />
        <Skeleton width="40%" height="14px" />
      </div>
    </li>
  );
};

/**
 * Skeleton form field
 *
 * @example
 * ```tsx
 * <SkeletonFormField />
 * <SkeletonFormField hasLabel={false} />
 * ```
 */
export const SkeletonFormField: React.FC<{
  hasLabel?: boolean;
  className?: string;
}> = ({ hasLabel = true, className = "" }) => {
  return (
    <div className={`pf-v5-c-form__group ${className}`}>
      {hasLabel && <Skeleton width="120px" height="16px" className="pf-v5-u-mb-sm" />}
      <Skeleton width="100%" height="36px" />
    </div>
  );
};

/**
 * Full page skeleton loader
 *
 * @example
 * ```tsx
 * <SkeletonPage />
 * ```
 */
export const SkeletonPage: React.FC<{
  hasHeader?: boolean;
  hasSidebar?: boolean;
}> = ({ hasHeader = true, hasSidebar = false }) => {
  return (
    <div className="pf-v5-u-p-lg">
      {hasHeader && (
        <div className="pf-v5-u-mb-lg">
          <Skeleton width="300px" height="32px" className="pf-v5-u-mb-md" />
          <Skeleton width="500px" height="20px" />
        </div>
      )}
      <div className="pf-v5-u-display-flex">
        {hasSidebar && (
          <div className="pf-v5-u-mr-lg" style={{ width: "250px" }}>
            <SkeletonText lines={8} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <SkeletonCard />
          <SkeletonCard className="pf-v5-u-mt-md" />
          <SkeletonCard className="pf-v5-u-mt-md" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton table (complete table with header and rows)
 *
 * @example
 * ```tsx
 * <SkeletonTable rows={5} columns={4} />
 * ```
 */
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}> = ({ rows = 5, columns = 4, hasHeader = true, className = "" }) => {
  return (
    <table className={`pf-v5-c-table pf-m-grid-md ${className}`}>
      {hasHeader && (
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="pf-v5-u-p-md">
                <Skeleton width="80%" height="16px" />
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <SkeletonTableRow key={rowIndex} columns={columns} />
        ))}
      </tbody>
    </table>
  );
};

/**
 * Skeleton stats card (for dashboard metrics)
 *
 * @example
 * ```tsx
 * <SkeletonStats />
 * <SkeletonStats hasIcon={false} />
 * ```
 */
export const SkeletonStats: React.FC<{
  hasIcon?: boolean;
  className?: string;
}> = ({ hasIcon = true, className = "" }) => {
  return (
    <div className={`pf-v5-c-card ${className}`}>
      <div className="pf-v5-c-card__body pf-v5-u-display-flex pf-v5-u-align-items-center">
        {hasIcon && <SkeletonCircle size="48px" className="pf-v5-u-mr-md" />}
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="14px" className="pf-v5-u-mb-sm" />
          <Skeleton width="40%" height="28px" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton data list (PatternFly DataList style)
 *
 * @example
 * ```tsx
 * <SkeletonDataList items={3} />
 * ```
 */
export const SkeletonDataList: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 3, className = "" }) => {
  return (
    <div className={`pf-v5-c-data-list ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="pf-v5-c-data-list__item pf-v5-u-p-md pf-v5-u-mb-sm">
          <div className="pf-v5-c-data-list__item-content pf-v5-u-display-flex pf-v5-u-align-items-center">
            <SkeletonCircle size="40px" className="pf-v5-u-mr-md" />
            <div style={{ flex: 1 }}>
              <Skeleton width="70%" height="18px" className="pf-v5-u-mb-sm" />
              <Skeleton width="50%" height="14px" />
            </div>
            <Skeleton width="80px" height="32px" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton gallery grid (for image galleries)
 *
 * @example
 * ```tsx
 * <SkeletonGallery items={6} columns={3} />
 * ```
 */
export const SkeletonGallery: React.FC<{
  items?: number;
  columns?: number;
  className?: string;
}> = ({ items = 6, columns = 3, className = "" }) => {
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "1rem",
  };

  return (
    <div style={gridStyle} className={className}>
      {Array.from({ length: items }).map((_, index) => (
        <Skeleton key={index} width="100%" height="200px" />
      ))}
    </div>
  );
};

/**
 * Skeleton profile header
 *
 * @example
 * ```tsx
 * <SkeletonProfile />
 * ```
 */
export const SkeletonProfile: React.FC<{
  className?: string;
}> = ({ className = "" }) => {
  return (
    <div className={`pf-v5-u-display-flex pf-v5-u-align-items-center pf-v5-u-p-lg ${className}`}>
      <SkeletonCircle size="80px" className="pf-v5-u-mr-lg" />
      <div style={{ flex: 1 }}>
        <Skeleton width="200px" height="24px" className="pf-v5-u-mb-sm" />
        <Skeleton width="150px" height="16px" className="pf-v5-u-mb-sm" />
        <Skeleton width="300px" height="14px" />
      </div>
      <Skeleton width="100px" height="36px" />
    </div>
  );
};

/**
 * Skeleton button
 *
 * @example
 * ```tsx
 * <SkeletonButton />
 * <SkeletonButton size="lg" />
 * ```
 */
export const SkeletonButton: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className = "" }) => {
  const heights = {
    sm: "32px",
    md: "36px",
    lg: "40px",
  };

  const widths = {
    sm: "80px",
    md: "100px",
    lg: "120px",
  };

  return <Skeleton width={widths[size]} height={heights[size]} className={className} />;
};

export default Skeleton;
