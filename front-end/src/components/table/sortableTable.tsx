import React, { useState } from 'react';
import {
  Table as PfTable,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@patternfly/react-table';
import type { ThProps } from '@patternfly/react-table';

interface AutoTableProps<T> {
  data: T[];
  ariaLabel?: string;
}

export function SortableTable<T extends Record<string, any>>({
  data,
  ariaLabel = 'Table automatique'
}: AutoTableProps<T>) {
  const [activeSortIndex, setActiveSortIndex] = useState<number | null>(null);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | null>(null);

  if (!data || data.length === 0) return <div>Aucune donnée à afficher.</div>;

  // Récupère dynamiquement les colonnes à partir du premier objet
  const columns = Object.keys(data[0]);

  let sortedData = [...data];
  if (activeSortIndex !== null) {
    const key = columns[activeSortIndex];
    sortedData.sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return activeSortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex ?? undefined,
      direction: activeSortDirection ?? 'asc',
      defaultDirection: 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex
  });

  return (
    <PfTable aria-label={ariaLabel} variant="compact">
      <Thead>
        <Tr>
          {columns.map((col, i) => (
            <Th key={i} sort={getSortParams(i)}>
              {col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {sortedData.map((row, rowIndex) => (
          <Tr key={rowIndex}>
            {columns.map((col, colIndex) => (
              <Td key={colIndex} dataLabel={col}>
                {String(row[col])}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </PfTable>
  );
}

export default SortableTable;