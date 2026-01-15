import React, { useState, useEffect, useRef } from 'react';
import {
  DualListSelector,
  DualListSelectorPane,
  DualListSelectorList,
  DualListSelectorListItem,
  DualListSelectorControlsWrapper,
  DualListSelectorControl,
  FormGroup
} from '@patternfly/react-core';
import AngleDoubleLeftIcon from '@patternfly/react-icons/dist/esm/icons/angle-double-left-icon';
import AngleLeftIcon from '@patternfly/react-icons/dist/esm/icons/angle-left-icon';
import AngleDoubleRightIcon from '@patternfly/react-icons/dist/esm/icons/angle-double-right-icon';
import AngleRightIcon from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';

interface Option<T> {
  value: T;
  text: string;
  selected: boolean;
  isVisible: boolean;
}

interface DualListSelectorGenericProps<T> {
  label?: string;
  availableItems: T[];
  assignedItems: T[];
  onChange?: (newAssignedItems: T[]) => void;
  fieldId?: string;
  getText: (item: T) => string;
  getKey?: (item: T) => string | number;
  renderItem?: (item: T) => React.ReactNode;
  availableTitle?: string;
  assignedTitle?: string;
  resetKey?: number; // Ajoute la prop pour le reset
}

function DualListSelectorGeneric<T>({
  label = 'Éléments assignés',
  availableItems,
  assignedItems,
  onChange = () => {},
  fieldId = 'dual-list',
  getText,
  getKey = (item: T) => getText(item),
  renderItem,
  availableTitle = 'Disponibles',
  assignedTitle = 'Assignés',
  resetKey = 0, // valeur par défaut
}: DualListSelectorGenericProps<T>) {
  const [availableOptions, setAvailableOptions] = useState<Option<T>[]>([]);
  const [chosenOptions, setChosenOptions] = useState<Option<T>[]>([]);
  const prevAvailableItems = useRef<T[]>([]);
  const prevAssignedItems = useRef<T[]>([]);

  useEffect(() => {
    // Vérifiez si les props ont réellement changé
    const availableItemsChanged = JSON.stringify(prevAvailableItems.current) !== JSON.stringify(availableItems);
    const assignedItemsChanged = JSON.stringify(prevAssignedItems.current) !== JSON.stringify(assignedItems);

    if (availableItemsChanged || assignedItemsChanged || resetKey !== 0) {
      const assignedKeys = new Set(assignedItems.map(item => getKey(item)));

      const newAvailableOptions = availableItems
        .filter(item => !assignedKeys.has(getKey(item)))
        .map((item) => ({
          value: item,
          text: getText(item),
          selected: false,
          isVisible: true
        }));

      const newChosenOptions = assignedItems.map((item) => ({
        value: item,
        text: getText(item),
        selected: false,
        isVisible: true
      }));

      setAvailableOptions(newAvailableOptions);
      setChosenOptions(newChosenOptions);

      // Mettre à jour les références précédentes
      prevAvailableItems.current = availableItems;
      prevAssignedItems.current = assignedItems;
    }
  }, [availableItems, assignedItems, getText, getKey, resetKey]);

  const moveSelected = (fromAvailable: boolean) => {
    const source = fromAvailable ? [...availableOptions] : [...chosenOptions];
    const destination = fromAvailable ? [...chosenOptions] : [...availableOptions];

    const movedItems = source.filter(item => item.selected && item.isVisible);
    const remainingItems = source.filter(item => !(item.selected && item.isVisible));

    if (fromAvailable) {
      const updatedDestination = [...destination, ...movedItems.map(item => ({ ...item, selected: false }))];
      setAvailableOptions(remainingItems);
      setChosenOptions(updatedDestination);
      onChange(updatedDestination.map(o => o.value));
    } else {
      const updatedDestination = [...destination, ...movedItems.map(item => ({ ...item, selected: false }))];
      setChosenOptions(remainingItems);
      setAvailableOptions(updatedDestination);
      onChange(remainingItems.map(o => o.value));
    }
  };

  const moveAll = (fromAvailable: boolean) => {
    const source = fromAvailable ? [...availableOptions] : [...chosenOptions];
    const destination = fromAvailable ? [...chosenOptions] : [...availableOptions];

    const movingItems = source.filter(item => item.isVisible).map(item => ({ ...item, selected: false }));
    const remainingItems = source.filter(item => !item.isVisible);

    if (fromAvailable) {
      const updatedDestination = [...destination, ...movingItems];
      setAvailableOptions(remainingItems);
      setChosenOptions(updatedDestination);
      onChange(updatedDestination.map(o => o.value));
    } else {
      const updatedDestination = [...destination, ...movingItems];
      setChosenOptions(remainingItems);
      setAvailableOptions(updatedDestination);
      onChange(remainingItems.map(o => o.value));
    }
  };

  const onOptionSelect = (
    _event: React.MouseEvent | React.ChangeEvent | React.KeyboardEvent,
    index: number,
    isChosen: boolean
  ) => {
    const list = isChosen ? [...chosenOptions] : [...availableOptions];
    list[index].selected = !list[index].selected;
    isChosen ? setChosenOptions(list) : setAvailableOptions(list);
  };

  return (
    <FormGroup label={label} fieldId={fieldId}>
      <DualListSelector>
        <DualListSelectorPane
          title={availableTitle}
          status={`${availableOptions.filter((o) => o.selected && o.isVisible).length} sur ${
            availableOptions.filter((o) => o.isVisible).length
          } sélectionné(s)`}
        >
          <DualListSelectorList>
            {availableOptions.map((option, index) => (
              <DualListSelectorListItem
                key={getKey(option.value)}
                isSelected={option.selected}
                id={`disponible-${getKey(option.value)}`}
                onOptionSelect={(e) => onOptionSelect(e, index, false)}
              >
                {renderItem ? renderItem(option.value) : option.text}
              </DualListSelectorListItem>
            ))}
          </DualListSelectorList>
        </DualListSelectorPane>
        <DualListSelectorControlsWrapper>
          <DualListSelectorControl
            isDisabled={!availableOptions.some((opt) => opt.selected)}
            onClick={() => moveSelected(true)}
            aria-label="Ajouter la sélection"
            icon={<AngleRightIcon />}
          />
          <DualListSelectorControl
            isDisabled={availableOptions.length === 0}
            onClick={() => moveAll(true)}
            aria-label="Tout ajouter"
            icon={<AngleDoubleRightIcon />}
          />
          <DualListSelectorControl
            isDisabled={chosenOptions.length === 0}
            onClick={() => moveAll(false)}
            aria-label="Tout retirer"
            icon={<AngleDoubleLeftIcon />}
          />
          <DualListSelectorControl
            isDisabled={!chosenOptions.some((opt) => opt.selected)}
            onClick={() => moveSelected(false)}
            aria-label="Retirer la sélection"
            icon={<AngleLeftIcon />}
          />
        </DualListSelectorControlsWrapper>
        <DualListSelectorPane
          title={assignedTitle}
          isChosen
          status={`${chosenOptions.filter((o) => o.selected && o.isVisible).length} sur ${
            chosenOptions.filter((o) => o.isVisible).length
          } sélectionné(s)`}
        >
          <DualListSelectorList>
            {chosenOptions.map((option, index) => (
              <DualListSelectorListItem
                key={getKey(option.value)}
                isSelected={option.selected}
                id={`assigne-${getKey(option.value)}`}
                onOptionSelect={(e) => onOptionSelect(e, index, true)}
              >
                {renderItem ? renderItem(option.value) : option.text}
              </DualListSelectorListItem>
            ))}
          </DualListSelectorList>
        </DualListSelectorPane>
      </DualListSelector>
    </FormGroup>
  );
}

export default DualListSelectorGeneric;
