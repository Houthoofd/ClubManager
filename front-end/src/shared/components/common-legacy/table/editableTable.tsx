import React, { useState } from 'react';
import {
  Table as TableComposable, 
  Thead, 
  Tr, 
  Th, 
  Tbody, 
  Td
} from '@patternfly/react-table';
import {
  Bullseye, 
  EmptyState, 
  Title as PfTitle, 
  Spinner,
  EmptyStateBody
} from '@patternfly/react-core';
import { SearchIcon } from '@/shared/icons';

interface Column {
  key: string;
  label: string;
  ariaLabel: string;
  cell?: (item: any) => React.ReactNode;
  sortable?: boolean;
}

interface EditableTableProps {
  data: any[];
  columns: Column[];
  isLoading?: boolean;
  emptyStateMessage?: string;
  onRowClick?: (item: any) => void;
}

const EditableTable: React.FC<EditableTableProps> = ({
  data,
  columns,
  isLoading = false,
  emptyStateMessage = "Aucune donnée disponible",
  onRowClick
}) => {
  const [activeSortIndex, setActiveSortIndex] = useState<number | null>(null);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | null>(null);

  const handleRowClick = (item: any, event: React.MouseEvent) => {
    // Vérifier si le clic provient d'un élément avec la classe 'action-cell'
    const target = event.target as HTMLElement;
    const isActionClick = target.closest('.action-cell') || target.closest('[data-ouia-component-type="Dropdown"]');
    
    if (!isActionClick && onRowClick) {
      onRowClick(item);
    }
  };

  const getSortParams = (columnKey: string) => {
    const columnIndex = columns.findIndex(col => col.key === columnKey);
    return {
      sortBy: activeSortIndex !== null ? {
        index: activeSortIndex,
        direction: activeSortDirection || 'asc'
      } : undefined,
      onSort: (_event: any, index: number, direction: 'asc' | 'desc') => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      },
      columnIndex
    };
  };

  const renderCell = (item: any, column: Column) => {
    // Si une fonction cell personnalisée est fournie, l'utiliser
    if (column.cell) {
      const cellContent = column.cell(item);
      
      // Ajouter une classe spéciale pour les cellules d'actions
      if (column.key === 'actions') {
        return (
          <div className="action-cell" onClick={(e) => e.stopPropagation()}>
            {cellContent}
          </div>
        );
      }
      
      return cellContent;
    }
    
    // Sinon, afficher la valeur brute avec fallback
    const value = item[column.key];
    if (value === null || value === undefined || value === '') {
      return 'Non renseigné';
    }
    
    return String(value);
  };

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Bullseye>
        <EmptyState variant="small">
          <div style={{ textAlign: 'center' }}>
            <SearchIcon size="lg" style={{ color: '#6a6e73', marginBottom: '1rem' }} />
            <PfTitle headingLevel="h4" size="lg" style={{ marginBottom: '0.5rem' }}>
              Aucune donnée
            </PfTitle>
            <EmptyStateBody>
              {emptyStateMessage}
            </EmptyStateBody>
          </div>
        </EmptyState>
      </Bullseye>
    );
  }

  // Tri des données si nécessaire
  const sortedData = activeSortIndex !== null && activeSortDirection ? 
    [...data].sort((a, b) => {
      const column = columns[activeSortIndex];
      const aValue = a[column.key];
      const bValue = b[column.key];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      return activeSortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    }) : data;

  return (
    <TableComposable aria-label="Table des données">
      <Thead>
        <Tr>
          {columns.map((column) => (
            <Th 
              key={column.key} 
              sort={column.sortable ? getSortParams(column.key) : undefined}
            >
              {column.label}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {sortedData.map((item, rowIndex) => (
          <Tr 
            key={item.id || rowIndex}
            onClick={(e) => handleRowClick(item, e)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((column) => (
              <Td key={column.key} dataLabel={column.ariaLabel}>
                {renderCell(item, column)}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </TableComposable>
  );
};

export default EditableTable;