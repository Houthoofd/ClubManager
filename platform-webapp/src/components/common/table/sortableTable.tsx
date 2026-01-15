import { useState } from 'react';
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
  columns?: { key: string; label: string }[];
}

export function SortableTable<T extends Record<string, any>>({
  data,
  ariaLabel = 'Table automatique',
  columns: customColumns
}: AutoTableProps<T>) {
  const [activeSortIndex, setActiveSortIndex] = useState<number | null>(null);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | null>(null);

  if (!data || data.length === 0) return <div>Aucune donnée à afficher.</div>;

  // Colonnes par défaut pour les paiements
  const defaultPaiementColumns = [
    { key: 'last_name', label: 'Nom' },
    { key: 'first_name', label: 'Prénom' },
    { key: 'nom_plan', label: "Type d'abonnement" },
    { key: 'periode_debut', label: 'Période début' },
    { key: 'periode_fin', label: 'Période fin' }
  ];

  // Utilise les colonnes passées en props ou celles par défaut
  const columns = customColumns ?? defaultPaiementColumns;

  let sortedData = [...data];
  if (activeSortIndex !== null) {
    const key = columns[activeSortIndex].key;
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

  // Helper pour formater les dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  return (
    <PfTable aria-label={ariaLabel} variant="compact">
      <Thead>
        <Tr>
          {columns.map((col, i) => (
            <Th key={i} sort={getSortParams(i)}>
              {col.label}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {sortedData.map((row, rowIndex) => (
          <Tr key={rowIndex}>
            {columns.map((col, colIndex) => (
              <Td key={colIndex} dataLabel={col.label}>
                {['periode_debut', 'periode_fin'].includes(col.key)
                  ? formatDate(row[col.key])
                  : String(row[col.key])}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </PfTable>
  );
}

export default SortableTable;