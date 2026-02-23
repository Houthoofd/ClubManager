/**
 * ====================================================================
 * CUSTOM HOOKS DEMO
 * ====================================================================
 *
 * Demonstration component showing all custom business hooks in action.
 * This serves as a reference implementation and testing ground.
 *
 * Hooks demonstrated:
 * - usePagination
 * - useTableSort
 * - useTableFilter
 * - useExport
 * - useDebounce
 * - useLocalStorage
 * - useTableControls (combined)
 */

import React, { useState } from 'react';
import {
  PageSection,
  Card,
  CardTitle,
  CardBody,
  Button,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Select,
  SelectOption,
  SelectVariant,
  Pagination,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Badge,
} from '@patternfly/react-core';
import {
  SortAmountDownIcon,
  SortAmountUpIcon,
  DownloadIcon,
} from '@/shared/icons';
import {
  usePagination,
  useTableSort,
  useTableFilter,
  useExport,
  useTableControls,
} from '@/shared/hooks/business';
import { useDebounce, useLocalStorage } from '@/shared/hooks/utils';

// ============================================================================
// Mock Data
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  registrationDate: string;
  lastLogin: string;
}

const MOCK_USERS: User[] = [
  {
    id: 1,
    name: 'Alice Martin',
    email: 'alice@example.com',
    role: 'admin',
    status: 'active',
    registrationDate: '2023-01-15',
    lastLogin: '2024-02-20',
  },
  {
    id: 2,
    name: 'Bob Dupont',
    email: 'bob@example.com',
    role: 'instructor',
    status: 'active',
    registrationDate: '2023-03-20',
    lastLogin: '2024-02-19',
  },
  {
    id: 3,
    name: 'Charlie Lefèvre',
    email: 'charlie@example.com',
    role: 'member',
    status: 'inactive',
    registrationDate: '2023-06-10',
    lastLogin: '2024-01-15',
  },
  {
    id: 4,
    name: 'Diana Bernard',
    email: 'diana@example.com',
    role: 'member',
    status: 'active',
    registrationDate: '2023-09-05',
    lastLogin: '2024-02-21',
  },
  {
    id: 5,
    name: 'Étienne Moreau',
    email: 'etienne@example.com',
    role: 'instructor',
    status: 'active',
    registrationDate: '2023-11-12',
    lastLogin: '2024-02-18',
  },
  // Add more mock users...
  ...Array.from({ length: 45 }, (_, i) => ({
    id: i + 6,
    name: `User ${i + 6}`,
    email: `user${i + 6}@example.com`,
    role: ['admin', 'instructor', 'member'][i % 3],
    status: (i % 2 === 0 ? 'active' : 'inactive') as 'active' | 'inactive',
    registrationDate: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    lastLogin: `2024-02-${String(Math.floor(Math.random() * 21) + 1).padStart(2, '0')}`,
  })),
];

// ============================================================================
// Demo Component
// ============================================================================

export const CustomHooksDemo: React.FC = () => {
  // ============================================================================
  // EXAMPLE 1: useDebounce + useLocalStorage
  // ============================================================================

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300); // Wait 300ms after typing stops

  const [savedView, setSavedView] = useLocalStorage<'table' | 'card'>(
    'users-view-preference',
    'table'
  );

  // ============================================================================
  // EXAMPLE 2: useTableControls (Combined: Filter + Sort + Pagination)
  // ============================================================================

  const {
    displayData,
    sortKey,
    sortDirection,
    handleSort,
    setFilter,
    clearFilters,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
  } = useTableControls(MOCK_USERS, {
    itemsPerPage: 10,
    defaultSortKey: 'name',
  });

  // Apply debounced search filter
  React.useEffect(() => {
    if (debouncedSearch) {
      setFilter({
        field: 'name',
        operator: 'contains',
        value: debouncedSearch,
        caseSensitive: false,
      });
    } else {
      clearFilters();
    }
  }, [debouncedSearch, setFilter, clearFilters]);

  // ============================================================================
  // EXAMPLE 3: useExport
  // ============================================================================

  const { exportToCSV, exportToPDF, exportToExcel, isExporting } = useExport();

  const handleExportCSV = () => {
    exportToCSV(displayData, {
      filename: 'users-export',
      columns: ['name', 'email', 'role', 'status'],
      columnLabels: {
        name: 'Nom',
        email: 'Email',
        role: 'Rôle',
        status: 'Statut',
      },
    });
  };

  const handleExportPDF = () => {
    exportToPDF(displayData, {
      filename: 'users-export',
      title: 'Liste des Utilisateurs',
      columns: ['name', 'email', 'role', 'status'],
      columnLabels: {
        name: 'Nom',
        email: 'Email',
        role: 'Rôle',
        status: 'Statut',
      },
    });
  };

  // ============================================================================
  // Role Filter
  // ============================================================================

  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const handleRoleFilter = (value: string) => {
    setSelectedRole(value);
    if (value) {
      setFilter({
        field: 'role',
        operator: 'equals',
        value,
      });
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <PageSection>
      <Card>
        <CardTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Custom Hooks Demo - Users Table</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Badge>{MOCK_USERS.length} utilisateurs</Badge>
              <Badge isRead>{displayData.length} affichés</Badge>
            </div>
          </div>
        </CardTitle>

        <CardBody>
          {/* ============================================================ */}
          {/* TOOLBAR: Search + Filters + Export */}
          {/* ============================================================ */}

          <Toolbar>
            <ToolbarContent>
              {/* Search with debounce */}
              <ToolbarItem style={{ flexGrow: 1, minWidth: '300px' }}>
                <SearchInput
                  placeholder="Rechercher par nom... (debounced 300ms)"
                  value={searchTerm}
                  onChange={(_event, value) => setSearchTerm(value)}
                  onClear={() => setSearchTerm('')}
                />
              </ToolbarItem>

              {/* Role filter */}
              <ToolbarItem>
                <Select
                  variant={SelectVariant.single}
                  onToggle={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                  onSelect={(_, value) => {
                    handleRoleFilter(value.toString());
                    setIsRoleFilterOpen(false);
                  }}
                  selections={selectedRole}
                  isOpen={isRoleFilterOpen}
                  placeholderText="Filtrer par rôle"
                >
                  <SelectOption value="">Tous les rôles</SelectOption>
                  <SelectOption value="admin">Admin</SelectOption>
                  <SelectOption value="instructor">Instructeur</SelectOption>
                  <SelectOption value="member">Membre</SelectOption>
                </Select>
              </ToolbarItem>

              {/* Export buttons */}
              <ToolbarItem>
                <Button
                  variant="secondary"
                  icon={<DownloadIcon />}
                  onClick={handleExportCSV}
                  isDisabled={isExporting}
                >
                  CSV
                </Button>
              </ToolbarItem>

              <ToolbarItem>
                <Button
                  variant="secondary"
                  icon={<DownloadIcon />}
                  onClick={handleExportPDF}
                  isDisabled={isExporting}
                >
                  PDF
                </Button>
              </ToolbarItem>

              {/* Clear filters */}
              {(searchTerm || selectedRole) && (
                <ToolbarItem>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedRole('');
                      clearFilters();
                    }}
                  >
                    Effacer les filtres
                  </Button>
                </ToolbarItem>
              )}
            </ToolbarContent>
          </Toolbar>

          {/* ============================================================ */}
          {/* TABLE: With Sorting */}
          {/* ============================================================ */}

          <Table variant="compact">
            <Thead>
              <Tr>
                <Th
                  sort={{
                    sortBy: {
                      index: sortKey === 'name' ? 0 : undefined,
                      direction: sortDirection === 'asc' ? 'asc' : 'desc',
                    },
                    onSort: () => handleSort('name'),
                    columnIndex: 0,
                  }}
                >
                  Nom
                  {sortKey === 'name' && (
                    sortDirection === 'asc' ? <SortAmountUpIcon /> : <SortAmountDownIcon />
                  )}
                </Th>
                <Th
                  sort={{
                    sortBy: {
                      index: sortKey === 'email' ? 1 : undefined,
                      direction: sortDirection === 'asc' ? 'asc' : 'desc',
                    },
                    onSort: () => handleSort('email'),
                    columnIndex: 1,
                  }}
                >
                  Email
                </Th>
                <Th
                  sort={{
                    sortBy: {
                      index: sortKey === 'role' ? 2 : undefined,
                      direction: sortDirection === 'asc' ? 'asc' : 'desc',
                    },
                    onSort: () => handleSort('role'),
                    columnIndex: 2,
                  }}
                >
                  Rôle
                </Th>
                <Th>Statut</Th>
                <Th
                  sort={{
                    sortBy: {
                      index: sortKey === 'lastLogin' ? 4 : undefined,
                      direction: sortDirection === 'asc' ? 'asc' : 'desc',
                    },
                    onSort: () => handleSort('lastLogin'),
                    columnIndex: 4,
                  }}
                >
                  Dernière connexion
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayData.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Badge color={user.role === 'admin' ? 'blue' : user.role === 'instructor' ? 'green' : 'grey'}>
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge color={user.status === 'active' ? 'green' : 'red'}>
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </Td>
                  <Td>{new Date(user.lastLogin).toLocaleDateString('fr-FR')}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {/* ============================================================ */}
          {/* PAGINATION */}
          {/* ============================================================ */}

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              itemCount={MOCK_USERS.length}
              perPage={10}
              page={currentPage}
              onSetPage={(_, page) => goToPage(page)}
              onPerPageSelect={() => {}}
              onNextClick={nextPage}
              onPreviousClick={prevPage}
              onFirstClick={() => goToPage(1)}
              onLastClick={() => goToPage(totalPages)}
              variant="bottom"
            />
          </div>

          {/* ============================================================ */}
          {/* STATS */}
          {/* ============================================================ */}

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h4>📊 Hooks Statistics</h4>
            <ul style={{ marginTop: '0.5rem' }}>
              <li>✅ <strong>useDebounce:</strong> Search debounced by 300ms</li>
              <li>✅ <strong>useLocalStorage:</strong> View preference saved (value: {savedView})</li>
              <li>✅ <strong>useTableControls:</strong> Combined filter + sort + pagination</li>
              <li>✅ <strong>usePagination:</strong> Page {currentPage}/{totalPages}</li>
              <li>✅ <strong>useTableSort:</strong> Sorted by {sortKey || 'none'} ({sortDirection})</li>
              <li>✅ <strong>useTableFilter:</strong> {searchTerm ? `Filtering "${searchTerm}"` : 'No filter'}</li>
              <li>✅ <strong>useExport:</strong> CSV/PDF export ready</li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </PageSection>
  );
};

export default CustomHooksDemo;
