import {
  Table, Thead, Tr, Th, Tbody, Td,
} from '@patternfly/react-table';
import {
  Button, Dropdown, DropdownItem, MenuToggle, DropdownList, DropdownGroup, Alert, Popover
} from '@patternfly/react-core';
import {
  EllipsisVIcon,
  LockIcon,
  WarningTriangleIcon
} from '@patternfly/react-icons';
import { Modal as PfModal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiUrl } from '../../pages/apiUrl';

interface EditableTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns?: { title: string; dataKey: string }[];
}

export function EditableTable<T extends Record<string, unknown>>({ data }: EditableTableProps<T>) {
  const [rows, setRows] = useState<any[]>([]);
  const [dropdownOpenIndex, setDropdownOpenIndex] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<T | null>(null);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  const [secureAlert, setSecureAlert] = useState<string | null>(null); // état pour l'alerte sécurité
  const [messageTypes, setMessageTypes] = useState<string[]>([]); // Ajoute le state pour les types de messages
  const [showMessagePopoverIndex, setShowMessagePopoverIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  // Récupère les types de messages disponibles au montage
  useEffect(() => {
    fetch(apiUrl('messages'))
      .then(res => res.json())
      .then(types => {
        if (Array.isArray(types)) setMessageTypes(types);
      })
      .catch(() => setMessageTypes([]));
  }, []);

  // Récupère les informations détaillées pour chaque utilisateur
  useEffect(() => {
    async function fetchAllInfos() {
      const infos = await Promise.all(
        data.map(async (user) => {
          const prenom = user.first_name || user.prenom;
          const nom = user.last_name || user.nom;
          if (prenom && nom) {
            const res = await fetch(apiUrl('compte/informations'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prenom, nom }),
            });
            const result = await res.json();
            // On suppose que result.utilisateur est un objet ou un tableau
            if (result.utilisateur) {
              // Fusionne les infos récupérées avec l'utilisateur de base
              return { ...user, ...result.utilisateur };
            }
          }
          return user;
        })
      );
      setRows(infos);
    }
    fetchAllInfos();
  }, [data]);

  if (!rows || rows.length === 0) return <div>Aucune donnée</div>;

  // Colonnes à afficher
  const columns = [
    { title: 'Nom', dataKey: 'last_name' },
    { title: 'Prénom', dataKey: 'first_name' },
    { title: 'Abonnement', dataKey: 'abonnement' },
    { title: 'Genre', dataKey: 'genres' }, // <-- utilise 'genres' pour le genre
    { title: 'Date de naissance', dataKey: 'date_of_birth' },
    { title: 'Sécurité', dataKey: 'password' }
  ];

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

  // Ajoute une fonction utilitaire pour formater la date
  function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Format : JJ-MM-AAAA
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Affichage des cellules (readonly)
  const renderCell = (row: any, key: string): React.ReactNode => {
    if (key === 'date_of_birth' || key === 'date_naissance') {
      return formatDate(row[key]);
    }
    if (key === 'password') {
      if (row.password) {
        return <LockIcon color="green" title="Compte sécurisé" />;
      } else {
        return (
          <span>
            <WarningTriangleIcon color="orange" title="Compte non sécurisé" />
            <span style={{ marginLeft: 4, color: 'orange', fontSize: '0.95rem' }}>Non sécurisé</span>
          </span>
        );
      }
    }
    return row[key] as React.ReactNode;
  };

  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      {secureAlert && (
        <Alert variant="warning" title={secureAlert} isInline />
      )}
      <Table aria-label="Editable table">
        <Thead>
          <Tr>
            {columns.map((col) => <Th key={col.dataKey}>{col.title}</Th>)}
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, index) => (
            <Tr key={index}>
              {columns.map((col) => (
                <Td onClick={() => navigate(`/pages/utilisateurs/consulter/${row.id}`)} key={col.dataKey}>
                  {renderCell(row, col.dataKey)}
                </Td>
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
                    <div style={{ height: 8 }} />
                    <DropdownGroup label="Messages">
                      {!row.password && (
                        <DropdownItem
                          onClick={() => setShowMessagePopoverIndex(index)}
                        >
                          Messages
                        </DropdownItem>
                      )}
                    </DropdownGroup>
                  </DropdownList>
                </Dropdown>
                {/* Popover pour les types de messages */}
                {showMessagePopoverIndex === index && (
                  <Popover
                    isVisible
                    position="right"
                    headerContent="Types de messages"
                    bodyContent={
                      <div>
                        {messageTypes.map((type) => (
                          <Button
                            key={type}
                            variant="link"
                            style={{ display: 'block', marginBottom: 4 }}
                            onClick={() => {
                              setSecureAlert(`Message "${type}" envoyé à ${row.first_name} ${row.last_name}`);
                              setShowMessagePopoverIndex(null);
                            }}
                          >
                            Envoyer : {type}
                          </Button>
                        ))}
                      </div>
                    }
                    shouldClose={() => setShowMessagePopoverIndex(null)}
                  >
                    {/* Cible invisible, le popover s'affiche à côté du menu */}
                    <span />
                  </Popover>
                )}
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