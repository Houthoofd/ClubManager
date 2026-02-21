/**
 * UserSearch Component
 *
 * Search input for filtering users by name, email, etc.
 * Features debounced search for performance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  SearchInput,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
  Spinner,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

/**
 * Props for UserSearch component
 */
export interface UserSearchProps {
  /**
   * Current search query
   */
  value: string;

  /**
   * Callback when search query changes
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Show clear button
   * @default true
   */
  showClearButton?: boolean;

  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceDelay?: number;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Disabled state
   */
  isDisabled?: boolean;

  /**
   * Loading state (shows spinner)
   */
  isLoading?: boolean;

  /**
   * Auto-focus on mount
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Search fields to display as hints
   */
  searchFields?: string[];

  /**
   * Callback when search is submitted (Enter key)
   */
  onSubmit?: (value: string) => void;
}

/**
 * UserSearch component
 */
export const UserSearch: React.FC<UserSearchProps> = ({
  value,
  onChange,
  placeholder,
  showClearButton = true,
  debounceDelay = 300,
  className,
  isDisabled = false,
  isLoading = false,
  autoFocus = false,
  searchFields = ['name', 'email', 'phone'],
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [localValue, debounceDelay, onChange, value]);

  const handleChange = useCallback(
    (_event: React.FormEvent<HTMLInputElement>, newValue: string) => {
      setLocalValue(newValue);
    },
    []
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  const handleSubmit = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && onSubmit) {
        onSubmit(localValue);
      }
    },
    [localValue, onSubmit]
  );

  const defaultPlaceholder = t('users.list.search', {
    defaultValue: 'Rechercher par nom, email, téléphone...',
  });

  return (
    <Flex
      direction={{ default: 'column' }}
      spaceItems={{ default: 'spaceItemsSm' }}
      className={className}
    >
      <FlexItem>
        <SearchInput
          placeholder={placeholder || defaultPlaceholder}
          value={localValue}
          onChange={handleChange}
          onClear={showClearButton ? handleClear : undefined}
          onKeyDown={handleSubmit}
          isDisabled={isDisabled}
          autoFocus={autoFocus}
        />
      </FlexItem>

      {/* Search hints */}
      {searchFields.length > 0 && !localValue && (
        <FlexItem>
          <TextContent>
            <Text component={TextVariants.small} style={{ color: 'var(--pf-global--Color--200)' }}>
              {t('users.search.hint', { defaultValue: 'Rechercher dans' })}: {searchFields.join(', ')}
            </Text>
          </TextContent>
        </FlexItem>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <FlexItem>
          <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Spinner size="sm" />
            </FlexItem>
            <FlexItem>
              <Text component={TextVariants.small}>
                {t('common.messages.loading', { defaultValue: 'Chargement...' })}
              </Text>
            </FlexItem>
          </Flex>
        </FlexItem>
      )}
    </Flex>
  );
};

export default UserSearch;
