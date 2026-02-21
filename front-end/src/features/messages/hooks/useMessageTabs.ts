/**
 * useMessageTabs Hook
 *
 * Custom hook for managing tab state in message pages.
 * Handles tab navigation and state persistence.
 */

import { useState, useCallback } from "react";

export interface UseMessageTabsOptions {
  /** Initial active tab key */
  initialTab?: number | string;

  /** Callback when tab changes */
  onTabChange?: (tabKey: number | string) => void;
}

export interface UseMessageTabsReturn {
  /** Current active tab key */
  activeTabKey: number | string;

  /** Set active tab key */
  setActiveTabKey: (tabKey: number | string) => void;

  /** Handle tab click event */
  handleTabClick: (event: React.MouseEvent, tabIndex: string | number) => void;

  /** Check if a tab is active */
  isTabActive: (tabKey: number | string) => boolean;
}

/**
 * Hook for managing message page tabs
 * @param options - Configuration options
 * @returns Tab state and methods
 */
export const useMessageTabs = (
  options: UseMessageTabsOptions = {}
): UseMessageTabsReturn => {
  const { initialTab = 0, onTabChange } = options;

  const [activeTabKey, setActiveTabKey] = useState<number | string>(initialTab);

  const handleTabClick = useCallback(
    (_event: React.MouseEvent, tabIndex: string | number) => {
      if (typeof tabIndex === "number" || typeof tabIndex === "string") {
        setActiveTabKey(tabIndex);

        // Trigger callback if provided
        if (onTabChange) {
          onTabChange(tabIndex);
        }
      }
    },
    [onTabChange]
  );

  const isTabActive = useCallback(
    (tabKey: number | string): boolean => {
      return activeTabKey === tabKey;
    },
    [activeTabKey]
  );

  return {
    activeTabKey,
    setActiveTabKey,
    handleTabClick,
    isTabActive,
  };
};

export default useMessageTabs;
