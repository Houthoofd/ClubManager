/**
 * ====================================================================
 * LANGUAGE SELECTOR COMPONENT
 * ====================================================================
 *
 * Elegant language selector using PatternFly components.
 * Allows users to switch between EN, FR, and NL.
 *
 * Features:
 * - Dropdown menu with flags
 * - Current language indicator
 * - Smooth language switching
 * - PatternFly styling
 * - Accessible (keyboard navigation)
 * - Mobile-friendly
 *
 * Usage:
 * ```tsx
 * import { LanguageSelector } from '@/shared/components/LanguageSelector';
 *
 * <LanguageSelector />
 * ```
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { GlobeIcon } from '@/shared/icons';
import { changeLanguage, LANGUAGE_OPTIONS } from '@/core/i18n';
import type { SupportedLanguage } from '@/core/i18n';

// ====================================================================
// TYPES
// ====================================================================

export interface LanguageSelectorProps {
  /**
   * Display variant
   * - 'full': Show flag + full language name
   * - 'compact': Show flag + language code only
   * - 'minimal': Show globe icon only
   */
  variant?: 'full' | 'compact' | 'minimal';

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Callback when language changes
   */
  onLanguageChange?: (language: SupportedLanguage) => void;
}

// ====================================================================
// COMPONENT
// ====================================================================

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
  onLanguageChange,
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLanguage = i18n.language as SupportedLanguage;
  const currentOption = LANGUAGE_OPTIONS.find((opt) => opt.code === currentLanguage);

  // ================================================================
  // HANDLERS
  // ================================================================

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = async (_event: React.MouseEvent | undefined, value: string | number | undefined) => {
    const languageCode = value as SupportedLanguage;

    setIsOpen(false);

    // Change language
    await changeLanguage(languageCode);

    // Trigger callback
    onLanguageChange?.(languageCode);

    // Show success notification (optional)
    if (import.meta.env.DEV) {
      console.log(`🌍 Language changed to: ${languageCode}`);
    }
  };

  // ================================================================
  // RENDER TOGGLE
  // ================================================================

  const renderToggleContent = () => {
    if (variant === 'minimal') {
      return (
        <>
          <GlobeIcon /> {currentOption?.code.toUpperCase()}
        </>
      );
    }

    if (variant === 'compact') {
      return (
        <>
          <span style={{ marginRight: '8px' }}>{currentOption?.flag}</span>
          {currentOption?.code.toUpperCase()}
        </>
      );
    }

    // full variant
    return (
      <>
        <span style={{ marginRight: '8px' }}>{currentOption?.flag}</span>
        {currentOption?.nativeName}
      </>
    );
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={handleSelect}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={handleToggle}
          isExpanded={isOpen}
          className={className}
          aria-label={t('language.select')}
        >
          {renderToggleContent()}
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownItem
            key={option.code}
            value={option.code}
            isDisabled={option.code === currentLanguage}
            description={option.name}
          >
            <span style={{ marginRight: '8px' }}>{option.flag}</span>
            {option.nativeName}
            {option.code === currentLanguage && (
              <span style={{ marginLeft: '8px', opacity: 0.6 }}>✓</span>
            )}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};

// ====================================================================
// EXPORT DEFAULT
// ====================================================================

export default LanguageSelector;
