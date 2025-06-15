import React, { useState, useEffect } from 'react';
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
  renderItem?: (item: T) => React.ReactNode;
  availableTitle?: string;
  assignedTitle?: string;
}

function DualListSelectorGeneric<T>({
  label = 'Éléments assignés',
  availableItems,
  assignedItems,
  onChange = () => {},
  fieldId = 'dual-list',
  getText,
  renderItem,
  availableTitle = 'Disponibles',
  assignedTitle = 'Assignés'
}: DualListSelectorGenericProps<T>) {
  const [availableOptions, setAvailableOptions] = useState<Option<T>[]>(
    availableItems.map((item) => ({
      value: item,
      text: getText(item),
      selected: false,
      isVisible: true
    }))
  );

  const [chosenOptions, setChosenOptions] = useState<Option<T>[]>(
    assignedItems.map((item) => ({
      value: item,
      text: getText(item),
      selected: false,
      isVisible: true
    }))
  );

  console.log(availableOptions)

  const moveSelected = (fromAvailable: boolean) => {
    const source = fromAvailable ? availableOptions : chosenOptions;
    const destination = fromAvailable ? chosenOptions : availableOptions;
    const movedItems: Option<T>[] = [];

    const remaining = source.filter((item) => {
      if (item.selected && item.isVisible) {
        movedItems.push({ ...item, selected: false });
        return false;
      }
      return true;
    });

    if (fromAvailable) {
      setAvailableOptions(remaining);
      const updated = [...destination, ...movedItems];
      setChosenOptions(updated);
      onChange(updated.map((o) => o.value));
    } else {
      setChosenOptions(remaining);
      const updated = [...destination, ...movedItems];
      setAvailableOptions(updated);
      onChange(remaining.map((o) => o.value));
    }
  };

  // Met à jour les options quand availableItems change
  useEffect(() => {
    const chosenIds = new Set(chosenOptions.map(opt => getText(opt.value)));

    const newAvailableOptions = availableItems
      .filter(item => !chosenIds.has(getText(item))) // exclure les déjà assignés
      .map((item) => ({
        value: item,
        text: getText(item),
        selected: false,
        isVisible: true
      }));

    setAvailableOptions(newAvailableOptions);
  }, [availableItems, getText, chosenOptions]);


  const moveAll = (fromAvailable: boolean) => {
    const source = fromAvailable ? availableOptions : chosenOptions;
    const destination = fromAvailable ? chosenOptions : availableOptions;

    const movingItems = source.filter((item) => item.isVisible).map((item) => ({
      ...item,
      selected: false
    }));
    const remainingItems = source.filter((item) => !item.isVisible);

    if (fromAvailable) {
      setAvailableOptions(remainingItems);
      const updated = [...destination, ...movingItems];
      setChosenOptions(updated);
      onChange(updated.map((o) => o.value));
    } else {
      setChosenOptions(remainingItems);
      const updated = [...destination, ...movingItems];
      setAvailableOptions(updated);
      onChange(remainingItems.map((o) => o.value));
    }
  };

  const onOptionSelect = (
    event: React.MouseEvent | React.ChangeEvent | React.KeyboardEvent,
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
            {availableOptions.map((option, index) =>
              option.isVisible ? (
                <DualListSelectorListItem
                  key={getText(option.value)}
                  isSelected={option.selected}
                  id={`disponible-${getText(option.value)}`}
                  onOptionSelect={(e) => onOptionSelect(e, index, false)}
                >
                  {renderItem ? renderItem(option.value) : option.text}
                </DualListSelectorListItem>
              ) : null
            )}
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
            {chosenOptions.map((option, index) =>
              option.isVisible ? (
                <DualListSelectorListItem
                  key={getText(option.value)}
                  isSelected={option.selected}
                  id={`assigne-${getText(option.value)}`}
                  onOptionSelect={(e) => onOptionSelect(e, index, true)}
                >
                  {renderItem ? renderItem(option.value) : option.text}
                </DualListSelectorListItem>
              ) : null
            )}
          </DualListSelectorList>
        </DualListSelectorPane>
      </DualListSelector>
    </FormGroup>
  );
}

export default DualListSelectorGeneric;
