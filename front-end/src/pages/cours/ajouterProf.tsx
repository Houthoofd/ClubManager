import React, { useState } from 'react';
import {
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
} from '@patternfly/react-core';
import { PageHeader } from '../../components/common/PageHeader';
import { useProfesseurs, usePromouvoirProfesseurs, useRetirerPromotionProfesseur } from '../../hooks/useProfesseurs';
import { useTousLesUtilisateurs, useVerifierProfesseurs } from '../../hooks/useUtilisateurs';
import ProfesseurForm from '../../components/cours/ProfesseurForm';
import ProfesseursList from '../../components/cours/ProfesseursList';
import ModalWithHelp from '../../components/common/modal/modalwithhelp'; // Utilisez la casse correcte

const AjouterProfesseur = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [profToRemove, setProfToRemove] = useState<any | null>(null);
  const [selectedStatus] = useState<number>(1);
  const [promotionMessage, setPromotionMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Hooks React Query
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

  const handlePromouvoir = async (selectedUsers: any[], typeId: string) => {
    try {
      // Vérifier si les utilisateurs sont déjà professeurs
      const toCheck = selectedUsers.map(u => ({ nom: u.nom, prenom: u.prenom }));
      const verifResult = await verifierProfesseurs.mutateAsync(toCheck);
      const dejaProfs = verifResult.professeurs.filter((p: any) => p.isProf);
      
      if (dejaProfs.length > 0) {
        setPromotionMessage(`Déjà professeurs : ${dejaProfs.map((p: any) => p.prenom + ' ' + p.nom).join(', ')}`);
        setMessageType('error');
        return;
      }
      
      await promouvoirProfesseurs.mutateAsync(selectedUsers);
      setPromotionMessage('Promotion effectuée avec succès !');
      setMessageType('success');
    } catch (error) {
      setPromotionMessage('Erreur lors de la promotion des professeurs.');
      setMessageType('error');
      console.error('Erreur lors de la promotion des professeurs:', error);
    }
  };

  const handleRetirerPromotion = async () => {
    if (!profToRemove) return;
    try {
      await retirerPromotionProfesseur.mutateAsync({ 
        id: profToRemove.id, 
        status_id: selectedStatus 
      });
      setRemoveModalOpen(false);
      const profName = `${profToRemove.first_name} ${profToRemove.last_name}`;
      setSuccessMessage(`La promotion de ${profName} a été retirée avec succès.`);
      setSuccessModalOpen(true);
      setProfToRemove(null);
    } catch (error) {
      console.error('Erreur lors du retrait de la promotion:', error);
      setSuccessMessage('Erreur lors du retrait de la promotion.');
      setSuccessModalOpen(true);
    }
  };

  const handleRemoveProfesseur = (prof: any) => {
    setProfToRemove(prof);
    setRemoveModalOpen(true);
  };

  if (loadingProfesseurs || loadingUtilisateurs) {
    return (
      <PageSection>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh' 
        }}>
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  const utilisateurs = utilisateursData?.data || [];

  return (
    <div className="teachers-page">
      <PageHeader
        title="Gestion des professeurs"
        subtitle="Ajoutez de nouveaux professeurs et gérez les promotions"
        variant="teachers"
      />

      <PageSection className="teachers-content">
        {/* Tabs */}
        <Tabs 
          activeKey={activeTabKey} 
          onSelect={handleTabClick}
          className="modern-tabs"
        >
          <Tab 
            eventKey={0} 
            title={
              <TabTitleText>
                <span>Ajouter un professeur</span>
              </TabTitleText>
            }
          >
            <ProfesseurForm
              utilisateurs={utilisateurs}
              onSubmit={handlePromouvoir}
              isLoading={promouvoirProfesseurs.isPending}
              message={promotionMessage}
              messageType={messageType}
            />
          </Tab>

          <Tab 
            eventKey={1} 
            title={
              <TabTitleText>
                <span>Voir les professeurs</span>
              </TabTitleText>
            }
          >
            <ProfesseursList
              professeurs={professeurs}
              onRemoveProfesseur={handleRemoveProfesseur}
            />
          </Tab>
        </Tabs>

        {/* Modal de confirmation */}
        <Modal
          variant="small"
          isOpen={isModalOpen}
          onClose={() => { 
            setIsModalOpen(false); 
            setPromotionMessage(''); 
          }}
          className="modern-card"
        >
          <ModalHeader title="Confirmer la promotion" />
          <ModalBody>
            {promotionMessage || 'Êtes-vous sûr de vouloir promouvoir ces utilisateurs en professeurs ?'}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="link" 
              onClick={() => { 
                setIsModalOpen(false); 
                setPromotionMessage(''); 
              }}
            >
              Fermer
            </Button>
          </ModalFooter>
        </Modal>

        {/* Modal de retrait de promotion */}
        <Modal
          variant="small"
          isOpen={removeModalOpen}
          onClose={() => setRemoveModalOpen(false)}
          className="modern-card"
        >
          <ModalHeader title="Retirer la promotion" />
          <ModalBody>
            Êtes-vous sûr de vouloir retirer la promotion de ce professeur ?
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="danger" 
              onClick={handleRetirerPromotion}
              isLoading={retirerPromotionProfesseur.isPending}
            >
              Confirmer
            </Button>
            <Button 
              variant="link" 
              onClick={() => setRemoveModalOpen(false)}
            >
              Annuler
            </Button>
          </ModalFooter>
        </Modal>

        {/* Modal de succès */}
        <ModalWithHelp
          title="Ajout de professeur"
          isOpen={isModalOpen}
          onClose={() => setSuccessModalOpen(false)}
          variant="success"
          context="creation" // Ajout du contexte
          successMessage="Le professeur a été ajouté avec succès !"
          actions={[
            <Button key="close" variant="primary" onClick={() => setSuccessModalOpen(false)}>
              Fermer
            </Button>,
          ]}
        />
      </PageSection>
    </div>
  );
};

export default AjouterProfesseur;



