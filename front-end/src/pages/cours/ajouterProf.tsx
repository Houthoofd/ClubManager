import React, { useState } from 'react';
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
import { useProfesseurs, usePromouvoirProfesseurs, useRetirerPromotionProfesseur } from '../../hooks/useProfesseurs';

const AjouterProfesseur = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; nom: string; prenom: string }[]>([]);
  const [formData, setFormData] = useState({ type_id: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [profToRemove, setProfToRemove] = useState<any | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number>(1);

  // Utilisation des hooks React Query
  const { data: professeurs = [], isLoading: loadingProfesseurs } = useProfesseurs();
  const promouvoirProfesseurs = usePromouvoirProfesseurs();
  const retirerPromotionProfesseur = useRetirerPromotionProfesseur();

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === 'number') {
      setActiveTabKey(tabIndex);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    const selectedObjs = professeurs
      .filter(u => selectedIds.includes(u.id.toString()))
      .map(u => ({
        id: u.id,
        nom: u.last_name,
        prenom: u.first_name
      }));
    setSelectedUsers(selectedObjs);
  };

  const handlePromouvoir = async () => {
    try {
      await promouvoirProfesseurs.mutateAsync(selectedUsers);
      setSelectedUsers([]);
      setFormData({ type_id: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la promotion des professeurs:', error);
    }
  };

  const handleRetirerPromotion = async () => {
    if (!profToRemove) return;
    try {
      await retirerPromotionProfesseur.mutateAsync({ id: profToRemove.id, status_id: selectedStatus });
      setRemoveModalOpen(false);
      setProfToRemove(null);
      setSelectedStatus(1);
    } catch (error) {
      console.error('Erreur lors du retrait de la promotion:', error);
    }
  };

  if (loadingProfesseurs) {
    return <Spinner size="xl" />;
  }

  return (
    <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
      <Tab eventKey={0} title={<TabTitleText>Ajouter un professeur</TabTitleText>}>
        <div style={{ maxWidth: '500px', marginTop: '1rem' }}>
          <form>
            <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Type de cours :
            </label>
            <FormSelect
              value={formData.type_id}
              onChange={(e) => setFormData(prev => ({ ...prev, type_id: e.target.value }))}
              aria-label="Type de cours"
            >
              <FormSelectOption isDisabled value="" label="Sélectionnez un type" />
              <FormSelectOption value="Judo" label="Judo" />
              <FormSelectOption value="JJB" label="JJB" />
              <FormSelectOption value="Grappling" label="Grappling" />
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
              {professeurs.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
            {selectedUsers.length > 0 && (
              <Button
                style={{ marginTop: '1rem' }}
                icon={<UserPlusIcon />}
                onClick={() => setIsModalOpen(true)}
                disabled={selectedUsers.length === 0}
              >
                Ajouter
              </Button>
            )}
          </form>
        </div>

        {/* Modal de confirmation */}
        <Modal
          variant="small"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <ModalHeader title="Confirmer la promotion" />
          <ModalBody>
            Êtes-vous sûr de vouloir promouvoir ces utilisateurs en professeurs ?
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={handlePromouvoir}>
              Confirmer
            </Button>
            <Button variant="link" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
          </ModalFooter>
        </Modal>
      </Tab>

      <Tab eventKey={1} title={<TabTitleText>Voir les professeurs</TabTitleText>}>
        {professeurs.length === 0 ? (
          <EmptyState>
            <EmptyStateBody>
              Aucun professeur enregistré.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <div>
            {professeurs.map((prof) => (
              <div key={prof.id}>
                <span>{prof.first_name} {prof.last_name}</span>
                <Button
                  variant="plain"
                  onClick={() => {
                    setProfToRemove(prof);
                    setRemoveModalOpen(true);
                  }}
                >
                  <TimesCircleIcon />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de retrait de promotion */}
        <Modal
          variant="small"
          isOpen={removeModalOpen}
          onClose={() => setRemoveModalOpen(false)}
        >
          <ModalHeader title="Retirer la promotion" />
          <ModalBody>
            Êtes-vous sûr de vouloir retirer la promotion de ce professeur ?
          </ModalBody>
          <ModalFooter>
            <Button variant="danger" onClick={handleRetirerPromotion}>
              Confirmer
            </Button>
            <Button variant="link" onClick={() => setRemoveModalOpen(false)}>
              Annuler
            </Button>
          </ModalFooter>
        </Modal>
      </Tab>
    </Tabs>
  );
};

export default AjouterProfesseur;
            

