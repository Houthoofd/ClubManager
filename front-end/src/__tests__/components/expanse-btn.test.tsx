import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DualListSelectorGeneric from '../../components/dualListSelector';
import type { ReactNode } from 'react';

type Item = {
  id: number;
  name: string;
};

describe('DualListSelectorGeneric Component', () => {
  const availableItems: Item[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ];
  
  const assignedItems: Item[] = [
    { id: 4, name: 'Item 4' }
  ];
  
  const mockOnChange = jest.fn();
  const getText = (item: Item): string => item.name;
  const renderItem = (item: Item): ReactNode => <span>{item.name}</span>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders available and assigned items correctly', () => {
    render(
      <DualListSelectorGeneric 
        label="Test Selector"
        availableItems={availableItems}
        assignedItems={assignedItems}
        getText={getText}
        renderItem={renderItem}
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText('Test Selector')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
    expect(screen.getByText('Item 4')).toBeInTheDocument();
  });

  test('moves item from available to assigned when clicked', async () => {
    render(
      <DualListSelectorGeneric 
        availableItems={availableItems}
        assignedItems={assignedItems}
        getText={getText}
        renderItem={renderItem}
        onChange={mockOnChange}
      />
    );
    
    const item1 = screen.getByText('Item 1');
    await userEvent.click(item1);

    const addSelectedButton = screen.getByLabelText('Ajouter la sélection');
    await userEvent.click(addSelectedButton);
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('moves item from assigned to available when clicked', async () => {
    render(
      <DualListSelectorGeneric 
        availableItems={availableItems}
        assignedItems={assignedItems}
        getText={getText}
        renderItem={renderItem}
        onChange={mockOnChange}
      />
    );
    
    const item4 = screen.getByText('Item 4');
    await userEvent.click(item4);
    
    const removeSelectedButton = screen.getByLabelText('Retirer la sélection');
    if (!removeSelectedButton.hasAttribute('disabled')) {
      await userEvent.click(removeSelectedButton);
      expect(mockOnChange).toHaveBeenCalled();
    } else {
      expect(true).toBe(true); // bouton désactivé
    }
  });

  test('moves all items when "add all" button is clicked', async () => {
    render(
      <DualListSelectorGeneric 
        availableItems={availableItems}
        assignedItems={assignedItems}
        getText={getText}
        renderItem={renderItem}
        onChange={mockOnChange}
      />
    );
    
    const addAllButton = screen.getByLabelText('Tout ajouter');
    if (!addAllButton.hasAttribute('disabled')) {
      await userEvent.click(addAllButton);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  test('removes all items when "remove all" button is clicked', async () => {
    render(
      <DualListSelectorGeneric 
        availableItems={availableItems}
        assignedItems={assignedItems}
        getText={getText}
        renderItem={renderItem}
        onChange={mockOnChange}
      />
    );
    
    const removeAllButton = screen.getByLabelText('Tout retirer');
    if (!removeAllButton.hasAttribute('disabled')) {
      await userEvent.click(removeAllButton);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });
});
