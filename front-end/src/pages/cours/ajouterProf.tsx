import React, { useState, useEffect } from 'react';
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
import ModalWithHelp from '../../components/common/modal/ModalWithHelp'; // Utilisez la casse correcte
import SelectAllUsers from '../../components/cours/SelectAllUsers';
import ModalConfirmation from '../../components/common/modal/ModalConfirmation';

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
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteResult, setPromoteResult] = useState<{ success: boolean; message: string } | null>(null);
  const [verifMessage, setVerifMessage] = useState<string | null>(null);
  const [verifChecked, setVerifChecked] = useState(false);

  // Ajout de l'effet pour fermeture auto après succès
  useEffect(() => {
    if (showPromoteModal && promoteResult?.success) {
      const timer = setTimeout(() => {
        setShowPromoteModal(false);
        setPromoteResult(null);
        setSelectedUsers([]); // Optionnel : vide la sélection après succès
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showPromoteModal, promoteResult]);

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
      const toCheck = selectedUsers.map(u => ({ nom: u.nom, prenom: u.prenom }));
      const verifResult = await verifierProfesseurs.mutateAsync(toCheck);
      const dejaProfs = verifResult.professeurs.filter((p: any) => p.isProf);

      if (dejaProfs.length > 0) {
        setPromotionMessage(`Déjà professeurs : ${dejaProfs.map((p: any) => p.prenom + ' ' + p.nom).join(', ')}`);
        setMessageType('error');
        setPromoteResult({ success: false, message: `Déjà professeurs : ${dejaProfs.map((p: any) => p.prenom + ' ' + p.nom).join(', ')}` });
        return;
      }

      // Appel mutation et gestion du retour serveur
      const result = await promouvoirProfesseurs.mutateAsync(selectedUsers);
      if (result && result.isConfirm === false) {
        setPromotionMessage(result.message || 'Erreur lors de la promotion des professeurs.');
        setMessageType('error');
        setPromoteResult({ success: false, message: result.message || 'Erreur lors de la promotion des professeurs.' });
        return;
      }

      setPromotionMessage('Promotion effectuée avec succès !');
      setMessageType('success');
      setPromoteResult({ success: true, message: 'Promotion effectuée avec succès !' });
    } catch (error: any) {
      setPromotionMessage(error?.message || 'Erreur lors de la promotion des professeurs.');
      setMessageType('error');
      setPromoteResult({ success: false, message: error?.message || 'Erreur lors de la promotion des professeurs.' });
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

  const handleSelectAll = () => {
    setSelectedUsers(utilisateurs);
  };

  const handleUserSelect = (user: any) => {
    setSelectedUsers(prev =>
      prev.some(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  // Nouvelle fonction pour vérifier avant d'ouvrir la modal
  const handlePromouvoirSelected = async () => {
    if (selectedUsers.length === 0) return;
    setPromoteResult(null);
    setVerifMessage(null);
    setVerifChecked(false);

    // Utilisation du hook useVerifierProfesseurs
    try {
      const toCheck = selectedUsers.map(u => ({ nom: u.nom, prenom: u.prenom }));
      const verifResult = await verifierProfesseurs.mutateAsync(toCheck);
      const dejaProfs = verifResult.professeurs.filter((p: any) => p.isProf);

      if (dejaProfs.length > 0) {
        setVerifMessage(
          `Attention : déjà professeurs - ${dejaProfs.map((p: any) => p.prenom + ' ' + p.nom).join(', ')}`
        );
      }
      setVerifChecked(true);
      setShowPromoteModal(true);
    } catch (error: any) {
      setVerifMessage('Erreur lors de la vérification des professeurs.');
      setVerifChecked(true);
      setShowPromoteModal(true);
    }
  };

  const confirmPromoteUsers = async () => {
    await handlePromouvoir(selectedUsers, 'professeur');
    // La fermeture est gérée par l'effet ci-dessus
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
        <Tabs 
          activeKey={activeTabKey} 
          onSelect={handleTabClick}
          className="modern-tabs"
        >
          <Tab 
            eventKey={0} 
            title={<TabTitleText><span>Ajouter un professeur</span></TabTitleText>}
          >
            {/* Sélecteur multiple */}
            <SelectAllUsers
              utilisateurs={utilisateurs}
              selectedUsers={selectedUsers}
              onSelectAll={handleSelectAll}
              onUserSelect={setSelectedUsers}
            />

            {/* Visualisation des utilisateurs sélectionnés et bouton de promotion */}
            {selectedUsers.length > 0 && (
              <div style={{ margin: '1rem 0' }}>
                <strong>Utilisateurs sélectionnés :</strong>
                <ul>
                  {utilisateurs
                    .filter(u => selectedUsers.includes(String(u.id)))
                    .map(u => (
                      <li key={u.id}>{u.first_name} {u.last_name} ({u.email})</li>
                    ))}
                </ul>
                <Button
                  variant="primary"
                  onClick={handlePromouvoirSelected}
                  isLoading={promouvoirProfesseurs.isPending || verifierProfesseurs.isPending}
                  style={{ marginTop: 8 }}
                >
                  Promouvoir en professeur
                </Button>
                {/* Message de promotion */}
                {promotionMessage && (
                  <div style={{ marginTop: 8, color: messageType === 'success' ? 'green' : 'red' }}>
                    {promotionMessage}
                  </div>
                )}
              </div>
            )}

            {/* Supprime l'affichage du formulaire individuel */}
            {/* <ProfesseurForm ... /> */}
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

        {/* Modal de confirmation de promotion */}
        <ModalConfirmation
          title="Confirmer la promotion"
          isOpen={showPromoteModal}
          onClose={() => {
            setShowPromoteModal(false);
            setPromoteResult(null);
            setVerifMessage(null);
            setVerifChecked(false);
          }}
          onConfirm={confirmPromoteUsers}
          confirmText="Oui, promouvoir"
          variant={promoteResult?.success === false ? 'danger' : 'primary'}
        >
          <div style={{ padding: '1rem 0' }}>
            {/* Message de vérification avant promotion */}
            {verifChecked && verifMessage && (
              <div
                style={{
                  marginBottom: 12,
                  color: '#d9534f',
                  background: '#fbeaea',
                  borderRadius: 4,
                  padding: '8px 12px',
                  fontWeight: 500
                }}
              >
                {verifMessage}
              </div>
            )}
            {promoteResult ? (
              <div
                style={{
                  marginTop: 0,
                  color: promoteResult.success ? 'green' : 'red',
                  fontWeight: 500,
                  borderRadius: 4,
                  background: promoteResult.success ? '#e6f4ea' : '#fbeaea',
                  padding: '8px 12px'
                }}
              >
                {promoteResult.message}
              </div>
            ) : (
              <>
                <p style={{ marginBottom: '1rem', fontWeight: 500 }}>
                  Êtes-vous sûr de vouloir promouvoir ce ou ces utilisateurs au rôle de professeurs ?
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                  {utilisateurs
                    .filter(u => selectedUsers.includes(String(u.id)))
                    .map(u => (
                      <li key={u.id} style={{ marginBottom: '0.5rem', color: '#0066cc' }}>
                        {u.first_name} {u.last_name} ({u.email})
                      </li>
                    ))}
                </ul>
              </>
            )}
          </div>
        </ModalConfirmation>
      </PageSection>
    </div>
  );
};

export default AjouterProfesseur;



