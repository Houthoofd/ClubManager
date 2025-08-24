import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  EmptyState,
  EmptyStateBody,
  FormSelect,
  FormSelectOption,
  Label,
  LabelGroup,
  Button,
  Tooltip,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Popover
} from '@patternfly/react-core';
import { ExclamationTriangleIcon, UserPlusIcon, TimesCircleIcon } from '@patternfly/react-icons';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { apiUrl } from '../apiUrl';

type CoursAvecProfesseurs = {
  heure_debut: string;
  heure_fin: string;
  jour: string;
  professeurs: string[];
  type_cours: string;
};

type Utilisateur = {
  id: number;
  first_name: string;
  last_name: string;
};

type SelectedUser = {
  id: number;
  nom: string;
  prenom: string;
};

const AjouterProfesseur = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [cours, setCours] = useState<CoursAvecProfesseurs[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [professeursExistants, setProfesseursExistants] = useState<any[]>([]);

  const [formData, setFormData] = useState({ type_id: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [profToRemove, setProfToRemove] = useState<any | null>(null);
  const [removeResult, setRemoveResult] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<string | null>(null);

  const selectOptions = {
    type_id: [
      { id: 'Judo', genre_name: 'Judo' },
      { id: 'JJB', genre_name: 'JJB' },
      { id: 'Grappling', genre_name: 'Grappling' }
    ]
  };

  const [statusOptions, setStatusOptions] = useState<{ value: number; label: string; description?: string }[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [coursRes, usersRes, profsRes] = await Promise.all([
          fetch(apiUrl('cours/informations/planning')),
          fetch(apiUrl('utilisateurs')),
          fetch(apiUrl('professeurs'))
        ]);
        const coursData = await coursRes.json();
        const usersData = await usersRes.json();
        const profsData = await profsRes.json();

        setCours(coursData);
        setUtilisateurs(usersData.data);

        // Pour l'affichage des professeurs existants (récupère .data du backend)
        if (profsData && Array.isArray(profsData.data)) {
          setProfesseursExistants(profsData.data);
        }
      } catch (error) {
        console.error('Erreur :', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTabKey]);

  useEffect(() => {
    // Récupère les statuts/rôles dynamiquement
    fetch(apiUrl('informations/status'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStatusOptions(
            data.map((status: any) => ({
              value: status.id,
              label: status.nom_role,
              description: status.description
            }))
          );
        }
      })
      .catch(() => setStatusOptions([
        { value: 1, label: "visiteur" }
      ]));
  }, []);

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === 'number') {
      setActiveTabKey(tabIndex);
    }
  };

  console.log(selectedUsers)

  const onChange = (e: React.FormEvent<HTMLSelectElement>, key: string) => {
    setFormData(prev => ({ ...prev, [key]: e.currentTarget.value }));
  };

  // Modifie la sélection pour stocker des objets
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    const selectedObjs = utilisateurs
      .filter(u => selectedIds.includes(u.id.toString()))
      .map(u => ({
        id: u.id,
        nom: u.last_name,
        prenom: u.first_name
      }));
    setSelectedUsers(selectedObjs);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsers.length || !formData.type_id) return;

    // Ouvre la modal pour afficher les professeurs sélectionnés AVANT d'envoyer
    setIsModalOpen(true);
  };

  // Fonction appelée quand on confirme dans la modal
  const handleConfirmModal = async () => {
    try {
      // Envoie les utilisateurs sélectionnés au backend pour ajout
      const res = await fetch(apiUrl('professeurs/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utilisateurs: selectedUsers.map(u => ({
            id: u.id,
            nom: u.nom,
            prenom: u.prenom
          }))
        }),
      });
      const result = await res.json();
      if (result.success) {
        setAddResult(result.message || 'Promotion réussie.');
      } else {
        setAddResult(result.message || 'Erreur lors de la promotion.');
      }
    } catch {
      setAddResult('Erreur serveur lors de la promotion.');
    }

    // Ajoute localement les professeurs au cours
    const nouveauCours: CoursAvecProfesseurs = {
      type_cours: formData.type_id,
      jour: 'Lundi',
      heure_debut: '18:00',
      heure_fin: '19:00',
      professeurs: selectedUsers.map(u => `${u.prenom} ${u.nom}`)
    };

    const updatedCours = [...cours, nouveauCours];
    setCours(updatedCours);
    setFormData({ type_id: '' });
    setSelectedUsers([]);
  };

  console.log(professeursExistants)
  return (
    <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
      <Tab eventKey={0} title={<TabTitleText>Ajouter un professeur</TabTitleText>}>
        <div style={{ maxWidth: '500px', marginTop: '1rem' }}>
          <form onSubmit={onSubmit}>
            <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Type de cours :
            </label>
            <FormSelect
              value={formData.type_id}
              onChange={(value) => onChange(value, 'type_id')}
              aria-label="Type de cours"
            >
              <FormSelectOption isDisabled value="" label="Sélectionnez un type" />
              {selectOptions.type_id.map((opt) => (
                <FormSelectOption key={opt.id} value={opt.id} label={opt.genre_name} />
              ))}
            </FormSelect>

            <label style={{
              fontWeight: 'bold',
              margin: '1rem 0 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Sélectionnez les utilisateurs :
              <Tooltip content="Maintenez Ctrl (ou Cmd sur Mac) pour en sélectionner plusieurs.">
                <ExclamationTriangleIcon color="#f0ab00" />
              </Tooltip>
            </label>

            <select
              multiple
              value={selectedUsers.map(u => u.id.toString())}
              onChange={handleSelectChange}
              style={{ height: '200px', width: '100%' }}
            >
              {utilisateurs.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>

            {selectedUsers.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Utilisateurs sélectionnés :</strong>
                <LabelGroup numLabels={5}>
                  {selectedUsers.map((user) => (
                    <Label
                      key={user.id}
                      onClose={() =>
                        setSelectedUsers(prev =>
                          prev.filter(u => u.id !== user.id)
                        )
                      }
                    >
                      {user.prenom} {user.nom}
                    </Label>
                  ))}
                </LabelGroup>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              style={{ marginTop: '1rem' }}
              icon={<UserPlusIcon />}
              onClick={() => setIsModalOpen(true)}
              disabled={selectedUsers.length === 0}
            >
              Promouvoir
            </Button>
          </form>
        </div>
        {/* Modal affichant les professeurs sélectionnés */}
        <Modal
          variant="small"
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setAddResult(null);
          }}
          aria-labelledby="with-help-modal-title"
          aria-describedby="modal-box-body-with-help"
        >
          <ModalHeader
            title="Professeurs sélectionnés"
            labelId="with-help-modal-title"
            help={
              <Popover
                headerContent={<div>Aide</div>}
                bodyContent={
                  <div>
                    Cette liste affiche les utilisateurs sélectionnés afin d'être promu professeurs. Vous pouvez vérifier avant de valider.
                  </div>
                }
                footerContent="Sélection temporaire"
              >
                <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
              </Popover>
            }
          />
          <ModalBody id="modal-box-body-with-help">
            {addResult ? (
              <span>{addResult}</span>
            ) : selectedUsers.length === 0 ? (
              <div>Aucun utilisateurs sélectionné.</div>
            ) : (
              <div>
                <strong>Êtes-vous surs de vouloir promouvoir ces utilisateurs au rôle de professeurs</strong>
                <ul style={{ marginTop: 8 }}>
                  {selectedUsers.map(user => (
                    <li key={user.id}>
                      <span style={{ fontWeight: 500 }}>{user.prenom} {user.nom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {!addResult ? (
              <>
                <Button key="confirm" variant="primary" onClick={handleConfirmModal}>
                  Confirmer
                </Button>
                <Button key="cancel" variant="link" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => {
                setIsModalOpen(false);
                setAddResult(null);
              }}>
                OK
              </Button>
            )}
          </ModalFooter>
        </Modal>
      </Tab>

      <Tab eventKey={1} title={<TabTitleText>Voir les professeurs</TabTitleText>}>
        <div style={{ marginTop: '1rem' }}>
          {isLoading ? (
            <Spinner size="xl" />
          ) : professeursExistants.length > 0 ? (
            <>
              <h2 style={{ marginTop: '2rem' }}>Professeurs existants</h2>
              {professeursExistants.map((prof) => (
                <div key={prof.id} style={{
                  border: '1px solid #d2d2d2',
                  borderRadius: '6px',
                  padding: '1rem',
                  width: '220px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>
                    <span style={{ fontWeight: 'bold' }}>{prof.first_name} {prof.last_name}</span>
                  </span>
                  <Button
                    variant="plain"
                    aria-label="Retirer la promotion"
                    icon={<TimesCircleIcon color="#c9190b" />}
                    onClick={() => {
                      setProfToRemove(prof);
                      setRemoveModalOpen(true);
                    }}
                  />
                </div>
              ))}
              {/* Modal de confirmation de retrait de promotion */}
              <Modal
                variant="small"
                isOpen={removeModalOpen}
                onClose={() => {
                  setRemoveModalOpen(false);
                  setRemoveResult(null);
                  setProfToRemove(null);
                  setSelectedStatus(statusOptions[0]?.value ?? 1);
                }}
                aria-labelledby="remove-prof-modal-title"
                aria-describedby="remove-prof-modal-body"
              >
                <ModalHeader title="Retirer la promotion" labelId="remove-prof-modal-title" />
                <ModalBody id="remove-prof-modal-body">
                  {removeResult ? (
                    <span>{removeResult}</span>
                  ) : profToRemove ? (
                    <div>
                      <span>
                        Êtes-vous sûr de vouloir enlever la promotion de&nbsp;
                        <strong>{profToRemove.first_name} {profToRemove.last_name}</strong> ?
                      </span>
                      <div style={{ marginTop: 16 }}>
                        <label htmlFor="status-select" style={{ fontWeight: 'bold', marginRight: 8 }}>
                          Sélectionnez le nouveau statut :
                        </label>
                        <select
                          id="status-select"
                          value={selectedStatus}
                          onChange={e => setSelectedStatus(Number(e.target.value))}
                          style={{ padding: '4px 8px', borderRadius: 4 }}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {/* Ne pas afficher la description du rôle */}
                      </div>
                    </div>
                  ) : null}
                </ModalBody>
                <ModalFooter>
                  {!removeResult ? (
                    <>
                      <Button
                        variant="danger"
                        onClick={async () => {
                          if (profToRemove) {
                            const res = await fetch(apiUrl(`professeurs/modifier`), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: profToRemove.id, status_id: selectedStatus })
                            });
                            const result = await res.json();
                            if (result.isConfirm) {
                              setProfesseursExistants(prev => prev.filter(p => p.id !== profToRemove.id));
                              setRemoveResult("La promotion a été retirée avec succès.");
                            } else {
                              setRemoveResult(result.message || "Erreur lors du retrait.");
                            }
                          }
                        }}
                      >
                        Confirmer
                      </Button>
                      <Button variant="link" onClick={() => {
                        setRemoveModalOpen(false);
                        setRemoveResult(null);
                        setProfToRemove(null);
                        setSelectedStatus(statusOptions[0]?.value ?? 1);
                      }}>
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" onClick={() => {
                      setRemoveModalOpen(false);
                      setRemoveResult(null);
                      setProfToRemove(null);
                      setSelectedStatus(statusOptions[0]?.value ?? 1);
                    }}>
                      OK
                    </Button>
                  )}
                </ModalFooter>
              </Modal>
            </>
          ) : (
            <EmptyState>
              <EmptyStateBody>
                Il n'y a actuellement aucun professeur enregistré.
              </EmptyStateBody>
            </EmptyState>
          )}
        </div>
      </Tab>
    </Tabs>
  );
};
export default AjouterProfesseur;

