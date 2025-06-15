import {
  Table, Thead, Tr, Th, Tbody, Td,
} from '@patternfly/react-table';
import {
  TextInput, Button, Dropdown, DropdownItem, MenuToggle, DropdownList
} from '@patternfly/react-core';
import {
  PencilAltIcon, CheckIcon, TimesIcon, EllipsisVIcon
} from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import inlineEditStyles from '@patternfly/react-styles/css/components/InlineEdit/inline-edit';

import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface EditableTableProps<T> {
  data: T[];
}

export function EditableTable<T extends Record<string, any>>({ data }: EditableTableProps<T>) {
  const [rows, setRows] = useState(data);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<T | null>(null);
  const [dropdownOpenIndex, setDropdownOpenIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setRows(data);
  }, [data]);

  if (!data || data.length === 0) return <div>Aucune donnée</div>;

  const maxVisibleColumns = 5;
  const columns = Object.keys(data[0]).slice(0, maxVisibleColumns);

  const handleChange = (key: string, value: any) => {
    if (editedData) {
      setEditedData({ ...editedData, [key]: value });
    }
  };

  const handleSave = async (index: number) => {
    const updated = [...rows];
    if (!editedData || !editedData.id) return;

    updated[index] = editedData;
    setRows(updated);
    setEditIndex(null);
    setEditedData(null);
    setDropdownOpenIndex(null);

    try {
      const res = await fetch(`http://localhost:3000/utilisateurs/${editedData.id}/modifier`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });
      if (!res.ok) alert("Erreur lors de la mise à jour");
    } catch {
      alert("Erreur réseau");
    }
  };

  const handleDelete = async (row: T) => {
    if (!window.confirm("Confirmer la suppression ?")) return;

    const filtered = rows.filter(r => r.id !== row.id);
    setRows(filtered);

    try {
      await fetch(`http://localhost:3000/utilisateurs/${row.id}`, {
        method: 'DELETE',
      });
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditedData(rows[index]);
    setDropdownOpenIndex(null);
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditedData(null);
    setDropdownOpenIndex(null);
  };

  const renderCell = (row: T, key: string, rowIndex: number) => {
    const value = row[key];
    if (editIndex === rowIndex) {
      return (
        <TextInput
          ref={inputRef}
          value={editedData?.[key] || ''}
          onChange={(e) => handleChange(key, e.currentTarget.value)}
        />
      );
    }
    return value;
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
          <Tr
            key={index}
            className={css(
              inlineEditStyles.inlineEdit,
              editIndex === index && inlineEditStyles.modifiers.inlineEditable
            )}
          >
            {columns.map((col) => (
              <Td onClick={() => navigate(`/pages/utilisateurs/consulter/${row.id}`)} key={col}>{renderCell(row, col, index)}</Td>
            ))}

            <Td
              style={{
                position: 'sticky',
                right: 0,
                background: 'white',
                zIndex: 1,
                overflow: 'visible',
              }} // ← Pour voir le menu
              className={css(
                inlineEditStyles.inlineEditAction,
                inlineEditStyles.modifiers.iconGroup
              )}
            >
              <Button
                variant="plain"
                onClick={() => handleEdit(index)}
                aria-label="Edit row"
              >
                <PencilAltIcon />
              </Button>

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
                    style={{ padding: '6px' }} // ← Ajoute un padding
                  >
                    <EllipsisVIcon />
                  </MenuToggle>

                )}
              >
                <DropdownList>
                  {editIndex === index ? (
                    <>
                      <DropdownItem onClick={() => handleSave(index)}>
                        <CheckIcon /> Sauvegarder
                      </DropdownItem>
                      <DropdownItem onClick={handleCancel}>
                        <TimesIcon /> Annuler
                      </DropdownItem>
                    </>
                  ) : (
                    <DropdownItem onClick={() => handleEdit(index)}>Modifier</DropdownItem>
                  )}
                  <DropdownItem onClick={() => handleDelete(row)}>Supprimer</DropdownItem>
                </DropdownList>
              </Dropdown>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
    </div>
  );
}

export default EditableTable;
