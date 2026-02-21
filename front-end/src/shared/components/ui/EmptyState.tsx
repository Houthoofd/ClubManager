/**
 * ====================================================================
 * EMPTY STATE COMPONENT - ClubManager Front-End
 * ====================================================================
 *
 * Composant simple pour afficher des états vides (no data, search results, etc.)
 * Version simplifiée compatible avec PatternFly 6
 *
 * USAGE:
 * ```tsx
 * <EmptyState
 *   title="No users found"
 *   description="Try adjusting your search criteria"
 *   icon={SearchIcon}
 *   primaryAction={<Button onClick={handleAdd}>Add User</Button>}
 * />
 * ```
 */

import React from "react";
import { Button } from "@patternfly/react-core";

/**
 * EmptyState component props
 */
export interface EmptyStateProps {
  /**
   * Title of the empty state
   */
  title: string;

  /**
   * Optional description/message
   */
  description?: string;

  /**
   * Icon component to display
   */
  icon?: React.ComponentType<any>;

  /**
   * Primary action button
   */
  primaryAction?: React.ReactNode;

  /**
   * Secondary actions
   */
  secondaryActions?: React.ReactNode[];

  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * Icon color
   */
  iconColor?: string;
}

/**
 * Simple EmptyState component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryActions,
  className = "",
  iconColor,
}) => {
  return (
    <div
      className={`pf-v5-c-empty-state ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        minHeight: "300px",
      }}
    >
      {Icon && (
        <div
          style={{
            marginBottom: "1rem",
            fontSize: "3rem",
            color: iconColor || "var(--pf-v5-global--Color--200)",
          }}
        >
          <Icon />
        </div>
      )}
      <h4 style={{ marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>{title}</h4>
      {description && (
        <p style={{ marginBottom: "1.5rem", color: "var(--pf-v5-global--Color--200)" }}>
          {description}
        </p>
      )}
      {primaryAction && <div style={{ marginBottom: "0.5rem" }}>{primaryAction}</div>}
      {secondaryActions && secondaryActions.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {secondaryActions}
        </div>
      )}
    </div>
  );
};

/**
 * Pre-configured EmptyList component
 */
export const EmptyList: React.FC<{
  entityName?: string;
  onAdd?: () => void;
  addButtonText?: string;
  className?: string;
}> = ({ entityName = "items", onAdd, addButtonText = "Add", className }) => (
  <EmptyState
    title={`No ${entityName} yet`}
    description={`Get started by adding your first ${entityName}.`}
    primaryAction={
      onAdd ? (
        <Button variant="primary" onClick={onAdd}>
          {addButtonText}
        </Button>
      ) : undefined
    }
    className={className}
  />
);

/**
 * Pre-configured EmptySearch component
 */
export const EmptySearch: React.FC<{
  searchTerm?: string;
  onClear?: () => void;
  className?: string;
}> = ({ searchTerm, onClear, className }) => (
  <EmptyState
    title="No results found"
    description={
      searchTerm
        ? `No results found for "${searchTerm}". Try adjusting your search.`
        : "No results found"
    }
    primaryAction={
      onClear ? (
        <Button variant="link" onClick={onClear}>
          Clear search
        </Button>
      ) : undefined
    }
    className={className}
  />
);

/**
 * Pre-configured EmptyError component
 */
export const EmptyError: React.FC<{
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ message = "Something went wrong", onRetry, className }) => (
  <EmptyState
    title="Error"
    description={message}
    iconColor="var(--pf-v5-global--danger-color--100)"
    primaryAction={
      onRetry ? (
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      ) : undefined
    }
    className={className}
  />
);

export default EmptyState;
