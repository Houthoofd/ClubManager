import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Thead, Tr, Th, Tbody, Td
} from '@patternfly/react-table';
import {
  Button, Dropdown, DropdownItem, DropdownList, DropdownGroup,
  Alert, Popover, Pagination, PaginationVariant,
  Toolbar, ToolbarContent, ToolbarItem,
  Select, SelectGroup, SelectList, SelectOption,
  MenuToggle, Bullseye, EmptyState, Title as PfTitle
} from '@patternfly/react-core';
import { SortAmountDownIcon, EllipsisVIcon, CubesIcon } from '@patternfly/react-icons';
import { Modal as PfModal, ModalBody, ModalHeader, ModalFooter } from '@patternfly/react-core';
import { useUserContext } from '../../../context/UserContext';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  date_of_birth?: string;
  date_inscription?: string;
  status_id: number;
  [key: string]: any;
}

interface Column {
  title: string;
  dataKey: keyof UserData;
}

interface EditableTableProps {
  data: UserData[];
  columns?: Column[];
  onDelete?: (row: UserData) => void;
  // Ajoute une prop pour déléguer la gestion de la modale au parent
  onRequestDelete?: (row: UserData) => void;
}

export function EditableTable({
  data,
  columns: propColumns,
  onDelete: propOnDelete,
  onRequestDelete // nouvelle prop
}: EditableTableProps) {
  // États
  const [rows, setRows] = useState<UserData[]>(data);
  const [dropdownOpenIndex, setDropdownOpenIndex] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<UserData | null>(null);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  const [messageTypes, setMessageTypes] = useState<string[]>([]);
  const [showMessagePopoverIndex, setShowMessagePopoverIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [activeSortIndex, setActiveSortIndex] = useState<number | null>(null);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | null>(null);

  const { setSelectedUserId } = useUserContext();
  const navigate = useNavigate();

  // Colonnes par défaut qui correspondent exactement à la structure des données
  const defaultColumns: Column[] = [
    { title: 'Prénom', dataKey: 'first_name' },
    { title: 'Nom', dataKey: 'last_name' },
    { title: "Nom d'utilisateur", dataKey: 'nom_utilisateur' },
    { title: 'Email', dataKey: 'email' },
    { title: 'Statut', dataKey: 'status_id' },
  ];

  const columns = propColumns || defaultColumns;

  // Mise à jour des données quand le prop change
  useEffect(() => {
    setRows(data);
  }, [data]);

  // Tri des données
  const getSortableRowValues = (row: UserData): (string | number)[] => {
    return columns.map(col => {
      const value = row[col.dataKey];
      return value !== undefined && value !== null ? value : '';
    });
  };

  const sortedRows = activeSortIndex !== null
    ? [...rows].sort((a, b) => {
        const aValue = getSortableRowValues(a)[activeSortIndex];
        const bValue = getSortableRowValues(b)[activeSortIndex];
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return activeSortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      })
    : rows;

  // Pagination
  const paginatedRows = sortedRows.slice((page - 1) * perPage, page * perPage);

  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const onPerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number
  ) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  // Gestion du tri
  const getSortParams = (columnIndex: number) => ({
    sortBy: activeSortIndex !== null ? {
      index: activeSortIndex,
      direction: activeSortDirection || 'asc'
    } : undefined,
    onSort: (_event: any, index: number, direction: any) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex
  });

  // Formatage des valeurs pour l'affichage
  const formatValue = (value: any, key: keyof UserData): React.ReactNode => {
    if (value === undefined || value === null) return 'Non renseigné';

    // Formatage spécial pour les dates
    if ((key === 'date_of_birth' || key === 'date_inscription') && typeof value === 'string') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
      } catch {
        return value;
      }
    }

    // Formatage spécial pour status_id
    if (key === 'status_id' && typeof value === 'number') {
      const statusMap: Record<number, string> = {
        1: 'Actif',
        2: 'Inactif',
        3: 'Suspendu'
      };
      return statusMap[value] || 'Inconnu';
    }

    return String(value);
  };

  if (!rows || rows.length === 0) {
    return (
      <Bullseye>
        <EmptyState>
          <CubesIcon size="lg" />
          <PfTitle headingLevel="h4" size="lg">
            Aucune donnée disponible
          </PfTitle>
        </EmptyState>
      </Bullseye>
    );
  }

  return (
    <>
      {/* Barre d'outils avec tri */}
      <Toolbar id="toolbar">
        <ToolbarContent>
          <ToolbarItem>
            <Select
              isOpen={isSortDropdownOpen}
              onOpenChange={(isOpen) => setIsSortDropdownOpen(isOpen)}
              onSelect={(_event, value) => {
                if (value === 'asc' || value === 'desc') {
                  setActiveSortDirection(value as 'asc' | 'desc');
                } else {
                  setActiveSortIndex(Number(value));
                  setActiveSortDirection(activeSortDirection || 'asc');
                }
              }}
              toggle={(toggleRef: React.Ref<any>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  isExpanded={isSortDropdownOpen}
                  variant="plain"
                  aria-label="Trier les colonnes"
                  icon={<SortAmountDownIcon />}
                />
              )}
            >
              <SelectGroup label="Trier par colonne">
                <SelectList>
                  {columns.map((col, columnIndex) => (
                    <SelectOption
                      key={`col-${columnIndex}`}
                      value={columnIndex}
                    >
                      {col.title}
                    </SelectOption>
                  ))}
                </SelectList>
              </SelectGroup>
              <SelectGroup label="Ordre de tri">
                <SelectList>
                  <SelectOption key="asc" value="asc">Ascendant</SelectOption>
                  <SelectOption key="desc" value="desc">Descendant</SelectOption>
                </SelectList>
              </SelectGroup>
            </Select>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {/* Tableau */}
      <div style={{ overflowX: 'auto' }}>
        <Table aria-label="Tableau des utilisateurs" borders={false}>
          <Thead>
            <Tr>
              {columns.map((col, idx) => (
                <Th
                  key={`th-${idx}`}
                  sort={getSortParams(idx)}
                >
                  {col.title}
                </Th>
              ))}
              <Th key="th-actions" />
            </Tr>
          </Thead>
          <Tbody>
            {paginatedRows.map((row, rowIndex) => (
              <Tr key={`row-${row.id}`}>
                {columns.map((col) => (
                  <Td
                    key={`cell-${row.id}-${String(col.dataKey)}`}
                    onClick={() => navigate(`/pages/utilisateurs/consulter/${row.id}`)}
                  >
                    {formatValue(row[col.dataKey], col.dataKey)}
                  </Td>
                ))}
                <Td isActionCell>
                  <Dropdown
                    isOpen={dropdownOpenIndex === rowIndex}
                    onSelect={() => setDropdownOpenIndex(null)}
                    onOpenChange={(isOpen) => setDropdownOpenIndex(isOpen ? rowIndex : null)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        variant="plain"
                        onClick={() => setDropdownOpenIndex(dropdownOpenIndex === rowIndex ? null : rowIndex)}
                        aria-label="Actions"
                      >
                        <EllipsisVIcon />
                      </MenuToggle>
                    )}
                    position="right"
                  >
                    <DropdownList>
                      <DropdownItem onClick={() => {
                        console.log('editableTable - Utilisateur sélectionné pour suppression :', row);
                        if (row.id) {
                          setSelectedUserId(row.id); // Sauvegarde l'id dans le contexte
                          // Délègue la gestion de la modale au parent
                          if (onRequestDelete) {
                            onRequestDelete(row); // Le parent ouvrira ModalConfirmation
                          }
                        } else {
                          console.error('editableTable - L\'utilisateur sélectionné n\'a pas d\'ID.');
                        }
                      }}>
                        Supprimer
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* Pagination */}
        <Pagination
          itemCount={sortedRows.length}
          widgetId="bottom-table-pagination"
          perPage={perPage}
          page={page}
          variant={PaginationVariant.bottom}
          onSetPage={onSetPage}
          onPerPageSelect={onPerPageSelect}
          perPageOptions={[
            { title: '10', value: 10 },
            { title: '20', value: 20 },
            { title: '50', value: 50 }
          ]}
        />
      </div>
    </>
  );
}

export default EditableTable;