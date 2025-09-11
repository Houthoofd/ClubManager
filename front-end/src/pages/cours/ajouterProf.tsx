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
  Button,
  Tooltip,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon, UserPlusIcon, TimesCircleIcon } from '@patternfly/react-icons';
import { useProfesseurs, usePromouvoirProfesseurs, useRetirerPromotionProfesseur } from '../../hooks/useProfesseurs';
import { useTousLesUtilisateurs, useVerifierProfesseurs } from '../../hooks/useUtilisateurs';

const AjouterProfesseur = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; nom: string; prenom: string }[]>([]);
  const [formData, setFormData] = useState({ type_id: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [profToRemove, setProfToRemove] = useState<any | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number>(1);
  const [promotionMessage, setPromotionMessage] = useState<string>('');

  // Utilisation des hooks React Query
  const { data: professeurs = [], isLoading: loadingProfesseurs } = useProfesseurs();
  const { data: utilisateursData, isLoading: loadingUtilisateurs } = useTousLesUtilisateurs();
  const promouvoirProfesseurs = usePromouvoirProfesseurs();
  const retirerPromotionProfesseur = useRetirerPromotionProfesseur();
  const verifierProfesseurs = useVerifierProfesseurs();

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === 'number') {
      setActiveTabKey(tabIndex);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    const selectedObjs = utilisateurs
      .filter((u: any) => selectedIds.includes(u.id.toString()))
      .map((u: any) => ({
        id: u.id,
        nom: u.last_name,
        prenom: u.first_name
      }));
    setSelectedUsers(selectedObjs);
  };

  const handlePromouvoir = async () => {
    try {
      // Vérifier si les utilisateurs sont déjà professeurs
      const toCheck = selectedUsers.map(u => ({ nom: u.nom, prenom: u.prenom }));
      const verifResult = await verifierProfesseurs.mutateAsync(toCheck);
      const dejaProfs = verifResult.professeurs.filter((p: any) => p.isProf);
      if (dejaProfs.length > 0) {
        setPromotionMessage(`Déjà professeurs : ${dejaProfs.map((p: any) => p.prenom + ' ' + p.nom).join(', ')}`);
        return;
      }
      await promouvoirProfesseurs.mutateAsync(selectedUsers);
      setPromotionMessage('Promotion effectuée avec succès !');
      setSelectedUsers([]);
      setFormData({ type_id: '' });
    } catch (error) {
      setPromotionMessage('Erreur lors de la promotion des professeurs.');
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

  if (loadingProfesseurs || loadingUtilisateurs) {
    return <Spinner size="xl" />;
  }

  const utilisateurs = utilisateursData?.data || [];

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
              onChange={(_event, value) => setFormData(prev => ({ ...prev, type_id: value }))}
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
              {utilisateurs.map((user: any) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
            <Button
              style={{ marginTop: '1rem' }}
              icon={<UserPlusIcon />}
              onClick={() => setIsModalOpen(true)}
              disabled={selectedUsers.length === 0}
            >
              Ajouter
            </Button>
          </form>
        </div>

        {/* Modal de confirmation */}
        <Modal
          variant="small"
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setPromotionMessage(''); }}
        >
          <ModalHeader title="Confirmer la promotion" />
          <ModalBody>
            {promotionMessage
              ? promotionMessage
              : 'Êtes-vous sûr de vouloir promouvoir ces utilisateurs en professeurs ?'}
          </ModalBody>
          <ModalFooter>
            {!promotionMessage && (
              <Button variant="primary" onClick={handlePromouvoir}>
                Confirmer
              </Button>
            )}
            <Button variant="link" onClick={() => { setIsModalOpen(false); setPromotionMessage(''); }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {professeurs.map((prof) => (
              <div key={prof.id} style={{
                minWidth: 220,
                background: '#f5f5f5',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.5rem',
                position: 'relative'
              }}>
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>{prof.first_name} {prof.last_name}</span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                  <Button
                    variant="plain"
                    onClick={() => {
                      setProfToRemove(prof);
                      setRemoveModalOpen(true);
                    }}
                    aria-label="Retirer la promotion"
                  >
                    <TimesCircleIcon />
                  </Button>
                </div>
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


