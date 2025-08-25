import React, { useState, useEffect, Fragment } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Form,
  FormGroup,
  TextInput,
  Select,
  SelectOption,
  SelectList,
  Button,
  Alert,
  Spinner,
  Label,
  MenuToggle,
  Card,
  EmptyState,
  EmptyStateBody,
  Modal as PFModal,
  ModalHeader as PFModalHeader,
  ModalBody as PFModalBody,
  ModalFooter as PFModalFooter,
  Popover
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import type { MenuToggleElement } from '@patternfly/react-core';
import DualListSelectorGeneric from '../../components/dualListSelector';
import { apiUrl } from '../apiUrl';

const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];


const AjouterCours = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [jour, setJour] = useState<string | null>(null);
  const [isJourOpen, setIsJourOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [message, setMessage] = useState('');
  const [cours, setCours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [allUsers, setAllUsers] = useState<{ id: number; name: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; name: string }[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [coursToDeleteIndex, setCoursToDeleteIndex] = useState<number | null>(null);
  const [deleteResultMessage, setDeleteResultMessage] = useState<string | null>(null);
  const [profRemoveModalOpen, setProfRemoveModalOpen] = useState(false);
  const [profRemoveResult, setProfRemoveResult] = useState<string | null>(null);
  const [profToRemove, setProfToRemove] = useState<{ coursIndex: number; profIndex: number } | null>(null);
  const [profConfirmModalOpen, setProfConfirmModalOpen] = useState(false);
  const [addResultModalOpen, setAddResultModalOpen] = useState(false);
  const [addResultMessage, setAddResultMessage] = useState<string | null>(null);

  const [coursEnEdition, setCoursEnEdition] = useState<any | null>(null);

  // Ajoute un état pour la modal de confirmation de modification
  const [isEditConfirmModalOpen, setIsEditConfirmModalOpen] = useState(false);
  const [editChanges, setEditChanges] = useState<any | null>(null);

  // Ajoute un état pour la modal de résultat de modification
  const [editResultModalOpen, setEditResultModalOpen] = useState(false);
  const [editResultMessage, setEditResultMessage] = useState<string | null>(null);

  const getTypeCoursStyle = (type?: string) => {
    if (!type || typeof type !== 'string') {
      return {
        badge: {
          backgroundColor: '#e0e0e0',
          color: '#333',
        },
        borderColor: '#999',
        icon: '📚',
      };
    }
    switch (type.toLowerCase()) {
      case 'grappling':
        return {
          badge: {
            backgroundColor: '#e3f2fd',
            color: '#0d47a1',
          },
          borderColor: '#0d47a1',
          icon: '🤼',
        };
      case 'jjb':
      case 'jiu-jitsu brésilien':
        return {
          badge: {
            backgroundColor: '#f3e5f5',
            color: '#6a1b9a',
          },
          borderColor: '#6a1b9a',
          icon: '🧘‍♂️',
        };
      case 'judo':
        return {
          badge: {
            backgroundColor: '#fff3e0',
            color: '#ef6c00',
          },
          borderColor: '#ef6c00',
          icon: '🥋',
        };
      default:
        return {
          badge: {
            backgroundColor: '#e0e0e0',
            color: '#333',
          },
          borderColor: '#999',
          icon: '📚',
        };
    }
  };



  useEffect(() => {
    // Récupère les données dès le chargement de la page
    fetchData();
  }, []);

  useEffect(() => {
    // Optionnel : recharge les cours/planning si on change de tab
    if (activeTabKey === 1) {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
    }
  }, [activeTabKey]);
type CoursData = {
  professeurs: string[];
  [key: string]: any;
};

  const fetchData = async () => {
    try {
      // Récupère tous les professeurs
      const res = await fetch(apiUrl('professeurs'));
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const professeursRes = await res.json();
      const professeurs = professeursRes.data || [];

      setAllUsers(
        professeurs.map((prof: any) => ({
          id: prof.id,
          name: `${prof.first_name ? prof.first_name : ''} ${prof.last_name ? prof.last_name : ''}`.trim()
        }))
      );

      // Récupère les cours/planning
      const resCours = await fetch(apiUrl('cours/informations/planning'));
      if (!resCours.ok) throw new Error(`Erreur HTTP: ${resCours.status}`);
      const data: CoursData[] = await resCours.json();
      setCours(data);
    } catch (err) {
      console.error('Erreur de récupération des données :', err);
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !selectedType || !jour || !heureDebut || !heureFin) return;
    setIsConfirmModalOpen(true);
  };

  // Fonction pour envoyer au backend après confirmation
  const handleConfirmSend = async () => {
    // Vérification avant création
    try {
      const verifRes = await fetch(apiUrl('verification/planning'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jour,
          heure_debut: heureDebut,
          heure_fin: heureFin,
          type_cours: selectedType
        })
      });
      const verifResult = await verifRes.json();
      console.log(verifResult)
      if (verifResult.exists) {
        setMessage(verifResult.message || "Ce créneau de cours existe déjà dans le planning.");
        setIsConfirmModalOpen(false);
        return;
      }
    } catch {
      setMessage("Erreur lors de la vérification du planning.");
      setIsConfirmModalOpen(false);
      return;
    }

    const nouveauCours = {
      nom,
      type_cours: selectedType,
      jour,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      // Récupère le nom complet depuis le formulaire (nom + prénom)
      professeurs: selectedUsers.map(u => u.name)
    };

    console.log(nouveauCours);
    try {
      const res = await fetch(apiUrl('cours/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nouveauCours)
      });
      const result = await res.json();
      if (res.ok) {
        setAddResultMessage(result.message || `Cours ajouté : ${nom} (${selectedType})`);
        setCours((prev) => [...prev, nouveauCours]);
      } else {
        setAddResultMessage(result.message || "Erreur lors de l'ajout du cours.");
      }
    } catch {
      setAddResultMessage("Erreur lors de l'ajout du cours.");
    }

    setNom('');
    setSelectedType(null);
    setJour(null);
    setHeureDebut('');
    setHeureFin('');
    setSelectedUsers([]);
    setIsConfirmModalOpen(false);
    setAddResultModalOpen(true);
  };

  const toggleType = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={() => setIsTypeOpen(prev => !prev)} isExpanded={isTypeOpen} style={{ width: '100%' }}>
      {selectedType || 'Sélectionner un type'}
    </MenuToggle>
  );

  const toggleJour = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={() => setIsJourOpen(prev => !prev)} isExpanded={isJourOpen} style={{ width: '100%' }}>
      {jour || 'Sélectionner un jour'}
    </MenuToggle>
  );

  // Demande confirmation avant dissociation
  const askConfirmRemoveProfesseur = (coursIndex: number, profIndex: number) => {
    setProfToRemove({ coursIndex, profIndex });
    setProfConfirmModalOpen(true);
  };

  // Effectue la dissociation après confirmation
  const handleRemoveProfesseurConfirmed = async () => {
    if (!profToRemove) return;
    const { coursIndex, profIndex } = profToRemove;
    const coursTarget = cours[coursIndex];
    const profName = coursTarget.professeurs[profIndex]?.trim();
    const jourCours = coursTarget.jour;

    // Retire localement le professeur
    setCours((prevCours: typeof cours) => {
      const newCours = [...prevCours];
      const updatedCours = { ...newCours[coursIndex] };
      updatedCours.professeurs = updatedCours.professeurs.filter((_: string, i: number) => i !== profIndex);
      newCours[coursIndex] = updatedCours;
      return newCours;
    });

    // Envoie au backend si on a les infos nécessaires
    if (jourCours && profName) {
      try {
        const res = await fetch(apiUrl('cours/retirer-professeur'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jour: jourCours,
            professeursNoms: [profName]
          })
        });
        const result = await res.json();
        setProfRemoveResult(result.message || "Professeur dissocié.");
      } catch {
        setProfRemoveResult("Erreur lors du retrait du professeur en base.");
      }
      setProfRemoveModalOpen(true);
    }
    setProfConfirmModalOpen(false);
    setProfToRemove(null);
  };

  const handleCloseProfRemoveModal = () => {
    setProfRemoveModalOpen(false);
    setProfRemoveResult(null);
  };

  const handleCancelRemoveProfesseur = () => {
    setProfConfirmModalOpen(false);
    setProfToRemove(null);
  };



  const handleAskDeleteCours = (index: number) => {
    setCoursToDeleteIndex(index);
    setIsDeleteModalOpen(true);
    setDeleteResultMessage(null);
  };

  const handleConfirmDeleteCours = async () => {
    if (coursToDeleteIndex === null) return;
    const coursToDelete = cours[coursToDeleteIndex];
    try {
      const res = await fetch(apiUrl('cours/supprimer'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jourSemaine: coursToDelete.jour
        })
      });
      const result = await res.json();
      setCours(cours.filter((_, i) => i !== coursToDeleteIndex));
      if (res.ok && result.message) {
        setDeleteResultMessage(result.message);
      } else {
        setDeleteResultMessage("Erreur lors de la suppression du cours.");
      }
    } catch {
      setDeleteResultMessage("Erreur lors de la suppression du cours.");
    }
    setCoursToDeleteIndex(null);
  };

  const handleCancelDeleteCours = () => {
    setIsDeleteModalOpen(false);
    setCoursToDeleteIndex(null);
    setDeleteResultMessage(null);
  };

  // Ajoute la fonction manquante pour fermer la modal d'ajout
  const handleCloseAddResultModal = () => {
    setAddResultModalOpen(false);
    setAddResultMessage(null);
  };



  // Modifie handleEditCours pour sauvegarder l'objet et remplir les champs
  const handleEditCours = (index: number) => {
    const coursEdit = cours[index];
    setCoursEnEdition(coursEdit); // sauvegarde l'objet complet
    setNom(coursEdit.nom || "");
    setSelectedType(coursEdit.type_cours || null);
    setJour(coursEdit.jour || null);
    setHeureDebut(coursEdit.heure_debut || "");
    setHeureFin(coursEdit.heure_fin || "");
    setSelectedUsers(
      coursEdit.professeurs
        ? allUsers.filter(u =>
            coursEdit.professeurs.some(
              (profName: string) => profName.trim().toLowerCase() === u.name.trim().toLowerCase()
            )
          )
        : []
    );
    setActiveTabKey(0);
  };

  // Ajoute une fonction pour ouvrir la modal de confirmation de modification
  const handleAskEditConfirm = () => {
    // Compare coursEnEdition (avant) et les champs actuels (après)
    if (!coursEnEdition) return;
    setEditChanges({
      nomAvant: coursEnEdition.nom,
      nomApres: nom,
      typeAvant: coursEnEdition.type_cours,
      typeApres: selectedType,
      jourAvant: coursEnEdition.jour,
      jourApres: jour,
      heureDebutAvant: coursEnEdition.heure_debut,
      heureDebutApres: heureDebut,
      heureFinAvant: coursEnEdition.heure_fin,
      heureFinApres: heureFin,
      profsAvant: coursEnEdition.professeurs,
      profsApres: selectedUsers.map(u => u.name)
    });
    setIsEditConfirmModalOpen(true);
  };

  // Ajoute une fonction pour confirmer la modification (envoi au backend)
  const handleConfirmEditSend = async () => {
    if (!coursEnEdition) return;

    // Vérifie si le créneau est disponible avant modification
    try {
      const verifRes = await fetch(apiUrl('verification/planning'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jour,
          heure_debut: heureDebut,
          heure_fin: heureFin,
          type_cours: selectedType
        })
      });
      const verifResult = await verifRes.json();
      if (verifResult.exists && (
        jour !== coursEnEdition.jour ||
        heureDebut !== coursEnEdition.heure_debut ||
        heureFin !== coursEnEdition.heure_fin ||
        selectedType !== coursEnEdition.type_cours
      )) {
        setMessage(verifResult.message || "Ce créneau de cours existe déjà dans le planning.");
        return;
      }
    } catch {
      setMessage("Erreur lors de la vérification du planning.");
      return;
    }

    const modifCours = {
      ...coursEnEdition,
      nom,
      type_cours: selectedType,
      jour,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      professeurs: selectedUsers.map(u => u.name)
    };
    try {
      const res = await fetch(apiUrl('cours/modifier'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifCours)
      });
      const result = await res.json();
      if (res.ok && result.isConfirm) {
        setEditResultMessage(result.message || "Cours modifié avec succès.");
        setEditResultModalOpen(true);
        setCours(prev =>
          prev.map(c => c === coursEnEdition ? modifCours : c)
        );
        setIsEditConfirmModalOpen(false); // Ferme la modal de confirmation
        setMessage('');
      } else {
        setMessage(result.message || "Erreur lors de la modification du cours.");
      }
    } catch {
      setMessage("Erreur lors de la modification du cours.");
    }
    setCoursEnEdition(null);
  };



  return (
    <Tabs activeKey={activeTabKey} onSelect={(_e, key) => setActiveTabKey(key as number)}>
      <Tab eventKey={0} title={<TabTitleText>Ajouter un cours</TabTitleText>}>
        <Form onSubmit={handleSubmit} isWidthLimited maxWidth="500px" style={{ marginTop: '1rem' }}>
          <FormGroup label="Type de cours" isRequired fieldId="type-cours">
            <Select
              id="type-cours"
              isOpen={isTypeOpen}
              selected={selectedType}
              onSelect={(_e, value) => {
                setSelectedType(value as string);
                setIsTypeOpen(false);
              }}
              onOpenChange={setIsTypeOpen}
              toggle={toggleType}
              shouldFocusToggleOnSelect
            >
              <SelectList>
                <SelectOption value="Judo">Judo</SelectOption>
                <SelectOption value="JJB">JJB</SelectOption>
                <SelectOption value="Grappling">Grappling</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Nom du cours" isRequired fieldId="nom-cours">
            <TextInput
              isRequired
              type="text"
              id="nom-cours"
              name="nom"
              value={nom}
              onChange={(_event, value) => setNom(value)}
            />
          </FormGroup>

          <FormGroup label="Jour" isRequired fieldId="jour-cours">
            <Select
              id="jour-cours"
              isOpen={isJourOpen}
              selected={jour}
              onSelect={(_e, value) => {
                setJour(value as string);
                setIsJourOpen(false);
              }}
              onOpenChange={setIsJourOpen}
              toggle={toggleJour}
              shouldFocusToggleOnSelect
            >
              <SelectList>
                {joursSemaine.map((j) => (
                  <SelectOption key={j} value={j}>
                    {j}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Horaire" isRequired fieldId="horaire-cours">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <TextInput
                isRequired
                type="time"
                id="heure-debut"
                name="heureDebut"
                value={heureDebut}
                onChange={(_e, value) => setHeureDebut(value)}
              />
              <span>à</span>
              <TextInput
                isRequired
                type="time"
                id="heure-fin"
                name="heureFin"
                value={heureFin}
                onChange={(_e, value) => setHeureFin(value)}
              />
            </div>
          </FormGroup>

          <DualListSelectorGeneric
            label="Professeurs assignés"
            availableItems={allUsers}
            assignedItems={
              coursEnEdition && coursEnEdition.professeurs
                ? allUsers.filter(u =>
                    coursEnEdition.professeurs.some(
                      (profName: string) => profName.trim().toLowerCase() === u.name.trim().toLowerCase()
                    )
                  )
                : selectedUsers
            }
            getText={(user) => user.name}
            renderItem={(user) => (
              <span>
                {user.name}
              </span>
            )}
            onChange={setSelectedUsers}
          />
          {/* Affiche la liste des professeurs associés au cours en édition */}
          {coursEnEdition && coursEnEdition.professeurs && coursEnEdition.professeurs.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Professeurs associés à ce cours :</strong>
              <ul>
                {coursEnEdition.professeurs.map((prof: string, idx: number) => (
                  <li key={idx}>{prof}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="button"
            variant={coursEnEdition ? "warning" : "primary"}
            style={{ marginTop: '1rem' }}
            onClick={coursEnEdition ? handleAskEditConfirm : handleSubmit}
          >
            {coursEnEdition ? "Modifier" : "Ajouter"}
          </Button>
        </Form>

        {/* Modal de confirmation avant envoi */}
        <PFModal
          variant="small"
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          aria-labelledby="with-help-modal-title"
          aria-describedby="modal-box-body-with-help"
        >
          <PFModalHeader
            title="Confirmer l'ajout du cours"
            labelId="with-help-modal-title"
            help={
              <Popover
                headerContent={<div>Aide</div>}
                bodyContent={
                  <div>
                    Vérifiez les informations du cours avant de confirmer l'ajout.
                  </div>
                }
                footerContent="Vérification finale"
              >
                <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
              </Popover>
            }
          />
          <PFModalBody id="modal-box-body-with-help">
            <div>
              <strong>Nom :</strong> {nom}<br />
              <strong>Type :</strong> {selectedType}<br />
              <strong>Jour :</strong> {jour}<br />
              <strong>Horaire :</strong> {heureDebut} - {heureFin}<br />
              <strong>Professeurs :</strong>
              <ul>
                {selectedUsers.map(u => (
                  <li key={u.id}>{u.name}</li>
                ))}
              </ul>
            </div>
          </PFModalBody>
          <PFModalFooter>
            <Button key="confirm" variant="primary" onClick={handleConfirmSend}>
              Confirmer
            </Button>
            <Button key="cancel" variant="link" onClick={() => setIsConfirmModalOpen(false)}>
              Annuler
            </Button>
          </PFModalFooter>
        </PFModal>

        {/* Supprime l'affichage du message hors modal */}
        {/* {message && (
          <Alert title={message} variant="success" isInline style={{ marginTop: '1rem' }} />
        )} */}

      </Tab>

      <Tab eventKey={1} title={<TabTitleText>Voir les cours</TabTitleText>}>
        {isLoading ? (
          <Spinner size="xl" />
        ) : cours.length === 0 ? (
          <EmptyState>
            <EmptyStateBody>Aucun cours enregistré.</EmptyStateBody>
          </EmptyState>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
  {cours.map((c, index) => {
    const { badge, borderColor, icon } = getTypeCoursStyle(c.type_cours);

    return (
      <Card
        key={index}
        style={{
          padding: '1.5rem',
          borderLeft: `6px solid ${borderColor}`,
          borderRadius: '0.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          {/* CONTENU PRINCIPAL */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {c.nom}
            </div>

            {/* Type de cours avec style dynamique */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 'bold',
                padding: '0.2rem 0.6rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                marginBottom: '0.5rem',
                gap: '0.4rem',
                ...badge,
              }}
            >
              <span>{icon}</span>
              <span>{c.type_cours}</span>
            </div>

            {/* Jour et horaire */}
            <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '0.25rem' }}>
              <strong>{c.jour}</strong> — {c.heure_debut} à {c.heure_fin}
            </div>
          </div>

          {/* BOUTON SUPPRIMER */}
          <Button
            variant="danger"
            aria-label="Supprimer le cours"
            onClick={() => handleAskDeleteCours(index)}
          >
            <TrashIcon />
          </Button>
          <Button
            variant="secondary"
            aria-label="Modifier le cours"
            onClick={() => handleEditCours(index)}
            style={{ marginLeft: '0.5rem' }}
          >
            Modifier
          </Button>
        </div>

        {/* PROFESSEURS */}
        {c?.professeurs?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Professeurs :</strong>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              {c.professeurs.map((prof: string, pIndex: number) => (
                <Label
                  key={pIndex}
                  color="blue"
                  onClose={() => askConfirmRemoveProfesseur(index, pIndex)}
                >
                  {prof}
                </Label>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  })}
</div>
        )}
        {/* Modal de confirmation suppression */}
        <Fragment>
          <PFModal
            variant="small"
            isOpen={isDeleteModalOpen}
            onClose={handleCancelDeleteCours}
            aria-labelledby="delete-cours-modal-title"
            aria-describedby="delete-cours-modal-body"
          >
            <PFModalHeader
              title="Confirmer la suppression du cours"
              labelId="delete-cours-modal-title"
              help={
                <Popover
                  headerContent={<div>Aide</div>}
                  bodyContent={
                    <div>
                      Cette action supprimera définitivement le cours et ses dépendances. Voulez-vous continuer ?
                    </div>
                  }
                  footerContent="Suppression définitive"
                >
                  <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
                </Popover>
              }
            />
            <PFModalBody id="delete-cours-modal-body">
              {deleteResultMessage
                ? <Alert title={deleteResultMessage} variant={deleteResultMessage.startsWith("Erreur") ? "danger" : "success"} isInline />
                : <>Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.</>
              }
            </PFModalBody>
            <PFModalFooter>
              {!deleteResultMessage && (
                <Button variant="danger" onClick={handleConfirmDeleteCours}>Supprimer</Button>
              )}
              <Button variant="link" onClick={handleCancelDeleteCours}>Fermer</Button>
            </PFModalFooter>
          </PFModal>
        </Fragment>

        {/* Modal confirmation dissociation professeur */}
        <PFModal
          variant="small"
          isOpen={profConfirmModalOpen}
          onClose={handleCancelRemoveProfesseur}
          aria-labelledby="prof-confirm-modal-title"
        >
          <PFModalHeader
            title="Confirmer la dissociation du professeur"
            labelId="prof-confirm-modal-title"
            help={
              <Popover
                headerContent={<div>Aide</div>}
                bodyContent={<div>Êtes-vous sûr de vouloir dissocier ce professeur du cours ?</div>}
                footerContent="Action irréversible"
              >
                <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
              </Popover>
            }
          />
          <PFModalBody>
            Êtes-vous sûr de vouloir dissocier ce professeur du cours ? Cette action est irréversible.
          </PFModalBody>
          <PFModalFooter>
            <Button variant="danger" onClick={handleRemoveProfesseurConfirmed}>Dissocier</Button>
            <Button variant="link" onClick={handleCancelRemoveProfesseur}>Annuler</Button>
          </PFModalFooter>
        </PFModal>

        {/* Modal dissociation professeur */}
        <PFModal
          variant="small"
          isOpen={profRemoveModalOpen}
          onClose={handleCloseProfRemoveModal}
          aria-labelledby="prof-remove-modal-title"
        >
          <PFModalHeader
            title="Dissociation du professeur"
            labelId="prof-remove-modal-title"
            help={
              <Popover
                headerContent={<div>Aide</div>}
                bodyContent={<div>Ce message indique le résultat de la dissociation du professeur du cours.</div>}
                footerContent="Action terminée"
              >
                <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
              </Popover>
            }
          />
          <PFModalBody>
            <Alert
              title={profRemoveResult || ""}
              variant={profRemoveResult && profRemoveResult.toLowerCase().includes("erreur") ? "danger" : "success"}
              isInline
            />
          </PFModalBody>
          <PFModalFooter>
            <Button variant="link" onClick={handleCloseProfRemoveModal}>Fermer</Button>
          </PFModalFooter>
        </PFModal>

        {/* Modal résultat ajout cours */}
        <PFModal
          variant="small"
          isOpen={addResultModalOpen}
          onClose={handleCloseAddResultModal}
          aria-labelledby="add-result-modal-title"
        >
          <PFModalHeader
            title="Ajout du cours au planning"
            labelId="add-result-modal-title"
            help={
              <Popover
                headerContent={<div>Aide</div>}
                bodyContent={<div>Ce message indique le résultat de l'ajout du cours au planning.</div>}
                footerContent="Action terminée"
              >
                <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
              </Popover>
            }
          />
          <PFModalBody>
            <Alert
              title={addResultMessage || ""}
              variant={addResultMessage && addResultMessage.toLowerCase().includes("erreur") ? "danger" : "success"}
              isInline
            />
          </PFModalBody>
          <PFModalFooter>
            <Button variant="link" onClick={handleCloseAddResultModal}>Fermer</Button>
          </PFModalFooter>
        </PFModal>

        {/* Modal confirmation modification */}
        <PFModal
          variant="small"
          isOpen={isEditConfirmModalOpen}
          onClose={() => {
            setIsEditConfirmModalOpen(false);
            setMessage("");
          }}
          aria-labelledby="edit-confirm-modal-title"
          aria-describedby="edit-confirm-modal-body"
        >
          <PFModalHeader
            title="Confirmer la modification du cours"
            labelId="edit-confirm-modal-title"
            help={
              <Popover
                headerContent={<div>Aide</div>}
                bodyContent={<div>Vérifiez les changements avant de confirmer la modification.</div>}
                footerContent="Vérification finale"
              >
                <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
              </Popover>
            }
          />
          <PFModalBody id="edit-confirm-modal-body">
            {/* Affiche le message du backend (succès ou erreur) dans la même modal */}
            {message && (
              <Alert
                title={message}
                variant={message.toLowerCase().includes("erreur") ? "danger" : "success"}
                isInline
                style={{ marginBottom: '1rem' }}
              />
            )}
            {editChanges && (
              <div>
                <strong>Changements apportés :</strong>
                <ul>
                  {editChanges.nomAvant !== editChanges.nomApres && (
                    <li>
                      <strong>Nom :</strong> {editChanges.nomAvant} &rarr; {editChanges.nomApres}
                    </li>
                  )}
                  {editChanges.typeAvant !== editChanges.typeApres && (
                    <li>
                      <strong>Type :</strong> {editChanges.typeAvant} &rarr; {editChanges.typeApres}
                    </li>
                  )}
                  {editChanges.jourAvant !== editChanges.jourApres && (
                    <li>
                      <strong>Jour :</strong> {editChanges.jourAvant} &rarr; {editChanges.jourApres}
                    </li>
                  )}
                  {editChanges.heureDebutAvant !== editChanges.heureDebutApres && (
                    <li>
                      <strong>Heure début :</strong> {editChanges.heureDebutAvant} &rarr; {editChanges.heureDebutApres}
                    </li>
                  )}
                  {editChanges.heureFinAvant !== editChanges.heureFinApres && (
                    <li>
                      <strong>Heure fin :</strong> {editChanges.heureFinAvant} &rarr; {editChanges.heureFinApres}
                    </li>
                  )}
                  {JSON.stringify(editChanges.profsAvant) !== JSON.stringify(editChanges.profsApres) && (
                    <li>
                      <strong>Professeurs :</strong>
                      <br />
                      <span style={{ color: "#888" }}>Avant :</span>
                      <ul>
                        {editChanges.profsAvant.map((p: string, idx: number) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                      <span style={{ color: "#888" }}>Après :</span>
                      <ul>
                        {editChanges.profsApres.map((p: string, idx: number) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </li>
                  )}
                </ul>
                {/* Si aucun changement, affiche un message */}
                {!(editChanges.nomAvant !== editChanges.nomApres ||
                   editChanges.typeAvant !== editChanges.typeApres ||
                   editChanges.jourAvant !== editChanges.jourApres ||
                   editChanges.heureDebutAvant !== editChanges.heureDebutApres ||
                   editChanges.heureFinAvant !== editChanges.heureFinApres ||
                   JSON.stringify(editChanges.profsAvant) !== JSON.stringify(editChanges.profsApres)) && (
                  <div>Aucun changement détecté.</div>
                )}
              </div>
            )}
          </PFModalBody>
          <PFModalFooter>
            <Button key="confirm" variant="primary" onClick={handleConfirmEditSend}>
              Confirmer
            </Button>
            <Button key="cancel" variant="link" onClick={() => {
              setIsEditConfirmModalOpen(false);
              setMessage("");
            }}>
              Annuler
            </Button>
          </PFModalFooter>
        </PFModal>

        {/* Modal résultat modification cours */}
        <PFModal
          variant="small"
          isOpen={editResultModalOpen}
          onClose={() => {
            setEditResultModalOpen(false);
            setEditResultMessage(null);
            setNom('');
            setSelectedType(null);
            setJour(null);
            setHeureDebut('');
            setHeureFin('');
            setSelectedUsers([]);
            setCoursEnEdition(null);
            setEditChanges(null);
            setMessage('');
          }}
          aria-labelledby="edit-result-modal-title"
        >
          <PFModalHeader
            title="Modification du cours"
            labelId="edit-result-modal-title"
            help={
              <Popover
                headerContent={<div>Aide</div>}
                bodyContent={<div>Ce message indique le résultat de la modification du cours.</div>}
                footerContent="Action terminée"
              >
                <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
              </Popover>
            }
          />
          <PFModalBody>
            <Alert
              title={editResultMessage || ""}
              variant={editResultMessage && editResultMessage.toLowerCase().includes("erreur") ? "danger" : "success"}
              isInline
            />
          </PFModalBody>
          <PFModalFooter>
            <Button
              variant="link"
              onClick={() => {
                setEditResultModalOpen(false);
                setEditResultMessage(null);
                setNom('');
                setSelectedType(null);
                setJour(null);
                setHeureDebut('');
                setHeureFin('');
                setSelectedUsers([]);
                setCoursEnEdition(null);
                setEditChanges(null);
                setMessage('');
              }}
              autoFocus
            >
              Fermer
            </Button>
          </PFModalFooter>
        </PFModal>
      </Tab>
    </Tabs>
  );
};



export default AjouterCours;
