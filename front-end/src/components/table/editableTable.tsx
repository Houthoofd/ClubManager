import {
  Table, Thead, Tr, Th, Tbody, Td,
} from '@patternfly/react-table';
import {
  Button, Dropdown, DropdownItem, MenuToggle, DropdownList
} from '@patternfly/react-core';
import {
  EllipsisVIcon
} from '@patternfly/react-icons';
import { Modal as PfModal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiUrl } from '../../pages/apiUrl';

interface EditableTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns?: { title: string; dataKey: string }[];
  onDeleteRequest?: (row: T) => void;
}


export function EditableTable<T extends Record<string, unknown>>({ data }: EditableTableProps<T>) {
  const [rows, setRows] = useState(data);
  const [dropdownOpenIndex, setDropdownOpenIndex] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<T | null>(null);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setRows(data);
  }, [data]);

  if (!data || data.length === 0) return <div>Aucune donnée</div>;

  const maxVisibleColumns = 5;
  const columns = Object.keys(data[0]).slice(0, maxVisibleColumns);

  // Supprime la confirmation via window.confirm dans handleDelete
  const handleDelete = async (row: T) => {
    try {
      const response = await fetch(apiUrl(`utilisateurs/supprimer/${row.id}`), {
        method: 'DELETE',
      });
      let apiMessage = '';
      if (response.ok) {
        const result = await response.json();
        apiMessage = result.message || `L'utilisateur ${row.first_name} ${row.last_name} a bien été supprimé.`;
        setRows(rows.filter(r => r.id !== row.id));
      } else {
        const result = await response.json().catch(() => null);
        apiMessage = result?.message || "Erreur lors de la suppression de l'utilisateur.";
      }
      setDeleteResult(apiMessage);
    } catch {
      setDeleteResult("Erreur lors de la suppression.");
    }
  };

  const handleDeleteClick = (row: T) => {
    setRowToDelete(row);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (rowToDelete) {
      await handleDelete(rowToDelete);
    }
    // Ne ferme pas la modal tout de suite, affiche le résultat
    // setConfirmDeleteOpen(false);
    setRowToDelete(null);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setRowToDelete(null);
    setDeleteResult(null);
  };

  // Affichage des cellules (readonly)
  const renderCell = (row: T, key: string): React.ReactNode => {
    return row[key] as React.ReactNode;
  };

  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <Table aria-label="Editable table">
        <Thead>
          <Tr>
            {columns.map((col) => <Th key={col}>{col}</Th>)}
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, index) => (
            <Tr key={index}>
              {columns.map((col) => (
                <Td onClick={() => navigate(`/pages/utilisateurs/consulter/${row.id}`)} key={col}>{renderCell(row, col)}</Td>
              ))}
              <Td
                style={{
                  position: 'sticky',
                  right: 0,
                  background: 'white',
                  zIndex: 1,
                  overflow: 'visible',
                }}
              >
                <Dropdown
                  isOpen={dropdownOpenIndex === index}
                  onSelect={() => setDropdownOpenIndex(null)}
                  onOpenChange={(isOpen) => setDropdownOpenIndex(isOpen ? index : null)}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      variant="plain"
                      onClick={() => setDropdownOpenIndex(dropdownOpenIndex === index ? null : index)}
                      aria-label="Actions"
                      className="pf-m-plain"
                      style={{ padding: '6px' }}
                    >
                      <EllipsisVIcon />
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem onClick={() => handleDeleteClick(row)}>Supprimer</DropdownItem>
                  </DropdownList>
                </Dropdown>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {/* Modal de confirmation de suppression */}
      <PfModal
        variant="small"
        isOpen={confirmDeleteOpen}
        onClose={cancelDelete}
        aria-labelledby="confirm-delete-modal-title"
        aria-describedby="confirm-delete-modal-body"
      >
        <ModalHeader title="Confirmer la suppression" labelId="confirm-delete-modal-title" />
        <ModalBody id="confirm-delete-modal-body">
          {deleteResult ? (
            <span>{deleteResult}</span>
          ) : rowToDelete ? (
            <span>
              Êtes-vous sûr de vouloir supprimer l'utilisateur&nbsp;
              <strong>
                {String((rowToDelete as Record<string, unknown>).first_name)} {String((rowToDelete as Record<string, unknown>).last_name)}
              </strong> ?
            </span>
          ) : null}
        </ModalBody>
        <ModalFooter>
          {!deleteResult ? (
            <>
              <Button variant="danger" onClick={confirmDelete}>
                Supprimer
              </Button>
              <Button variant="link" onClick={cancelDelete}>
                Annuler
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={cancelDelete}>
              OK
            </Button>
          )}
        </ModalFooter>
      </PfModal>
    </div>
  );
}

export default EditableTable;