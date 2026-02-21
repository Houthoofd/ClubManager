import React from 'react';
import { DualListSelector } from '@patternfly/react-core';

interface DualListSelectorGenericProps<T> {
  label?: string;
  availableItems: T[];
  assignedItems: T[];
  onChange: (assigned: T[]) => void;
  getText: (item: T) => string;
  getKey: (item: T) => string | number;
  availableTitle?: string;
  assignedTitle?: string;
}

const DualListSelectorGeneric = <T,>({
  availableItems,
  assignedItems,
  onChange,
  getText,
  getKey,
  availableTitle = "Available",
  assignedTitle = "Assigned",
}: DualListSelectorGenericProps<T>) => {
  // Convert items to PatternFly DualListSelector format
  const availableOptions = availableItems.map((item) => ({
    text: getText(item),
    value: String(getKey(item)),
    _originalItem: item,
  }));

  const chosenOptions = assignedItems.map((item) => ({
    text: getText(item),
    value: String(getKey(item)),
    _originalItem: item,
  }));

  const onListChange = (
    _event: React.MouseEvent<HTMLElement>,
    newAvailableOptions: any[],
    newChosenOptions: any[]
  ) => {
    // Extract original items from chosen options
    const newAssignedItems = newChosenOptions.map((opt) => opt._originalItem);
    onChange(newAssignedItems);
  };

  return (
    <DualListSelector
      availableOptions={availableOptions}
      chosenOptions={chosenOptions}
      onListChange={onListChange}
      availableOptionsTitle={availableTitle}
      chosenOptionsTitle={assignedTitle}
      addAllTooltip="Ajouter tous"
      addSelectedTooltip="Ajouter sélectionnés"
      removeSelectedTooltip="Retirer sélectionnés"
      removeAllTooltip="Retirer tous"
    />
  );
};

export default DualListSelectorGeneric;
