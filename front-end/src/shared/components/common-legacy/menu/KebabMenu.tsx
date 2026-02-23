import React, { useState } from 'react';
import {
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@/shared/icons';

interface KebabMenuItem {
  title: React.ReactNode | string;
  onClick: () => void;
  isDisabled?: boolean;
  isDanger?: boolean;
}

interface KebabMenuProps {
  items: KebabMenuItem[];
  isDisabled?: boolean;
}

const KebabMenu: React.FC<KebabMenuProps> = ({ items, isDisabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onToggleClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Empêche la propagation vers la ligne
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}> {/* Conteneur qui empêche la propagation */}
      <Dropdown
        isOpen={isOpen}
        onSelect={onSelect}
        onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            aria-label="Actions"
            variant="plain"
            onClick={onToggleClick}
            isExpanded={isOpen}
            isDisabled={isDisabled}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        shouldFocusToggleOnSelect
      >
        <DropdownList>
          {items.map((item, index) => (
            <DropdownItem
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.onClick();
                setIsOpen(false); // Fermer le menu après clic
              }}
              isDisabled={item.isDisabled}
              className={item.isDanger ? 'pf-m-danger' : ''}
            >
              {item.title}
            </DropdownItem>
          ))}
        </DropdownList>
      </Dropdown>
    </div>
  );
};

export default KebabMenu;
