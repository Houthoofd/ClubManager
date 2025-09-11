import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  Button,
  Spinner,
  Card,
  EmptyState,
  EmptyStateBody,
  Gallery,
  GalleryItem,
  Badge,
  Flex,
  FlexItem,
  Title,
  CardTitle,
  CardBody,
  CardFooter,
} from '@patternfly/react-core';
import { PencilAltIcon, ClockIcon, UserIcon, CalendarAltIcon } from '@patternfly/react-icons';
import { useAjouterCours, useProfesseurs, useJoursDeCours } from '../../hooks/useCours';
import { useSupprimerCoursRecurrent, useRetirerProfesseursDuCours } from '../../hooks/useProfesseurs';
import DualListSelectorGeneric from '../../components/dualListSelector';
import { ModalWithHelp } from '../../components/modal/modalwithhelp';

const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const AjouterCours = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [jour, setJour] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [professeurADissocier, setProfesseurADissocier] = useState<{ cours: any; prof: any } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [coursASupprimer, setCoursASupprimer] = useState<any | null>(null);
  const [showSupprimerModal, setShowSupprimerModal] = useState(false);

  // Utilisation des hooks React Query
  const { data: professeurs = [], isLoading: loadingProfesseurs } = useProfesseurs();
  const { data: planningCours = [], isLoading: loadingPlanning } = useJoursDeCours();
  const ajouterCours = useAjouterCours();
  const supprimerCoursRecurrent = useSupprimerCoursRecurrent();
  const retirerProfesseursDuCours = useRetirerProfesseursDuCours();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !selectedType || !jour || !heureDebut || !heureFin) return;

    const nouveauCours = {
      nom,
      type_cours: selectedType,
      jour,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      professeurs: selectedUsers.map(u => u.name)
    };

    try {
      await ajouterCours.mutateAsync(nouveauCours);
      setNom('');
      setSelectedType(null);
      setJour(null);
      setHeureDebut('');
      setHeureFin('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du cours:', error);
    }
  };

  const handleSupprimerCours = async (jourSemaine: string | null | undefined) => {
    try {
      if (!jourSemaine) throw new Error('Jour non défini');
      await supprimerCoursRecurrent.mutateAsync(jourSemaine.toLowerCase().trim());
    } catch (error) {
      console.error('Erreur lors de la suppression du cours:', error);
    }
  };

  // Ouvre la modal de confirmation avant dissociation
  const ouvrirModalDissociation = (cours: any, prof: string) => {
    setProfesseurADissocier({ cours, prof: { name: prof } });
    setIsModalOpen(true);
  };

  // Confirme et effectue la dissociation
  const confirmerDissociation = async () => {
    if (!professeurADissocier) return;
    
    try {
      const professeursNoms = [professeurADissocier.prof.name];
      await retirerProfesseursDuCours.mutateAsync({ 
        professeursNoms, 
        jour: professeurADissocier.cours.jour 
      });
      setSuccessMessage(`Le professeur ${professeurADissocier.prof.name} a bien été dissocié du cours ${professeurADissocier.cours.type_cours} du ${professeurADissocier.cours.jour}.`);
    } catch (error) {
      console.error('Erreur lors de la dissociation du professeur:', error);
      setSuccessMessage("Erreur lors de la dissociation du professeur.");
    }
  };

  // Ferme la modal sans dissocier
  const annulerDissociation = () => {
    setIsModalOpen(false);
    setProfesseurADissocier(null);
    setSuccessMessage(null);
  };

  // Ouvre la modal de confirmation avant suppression
  const ouvrirModalSuppression = (cours: any) => {
    setCoursASupprimer(cours);
    setShowSupprimerModal(true);
  };

  // Confirme et effectue la suppression
  const confirmerSuppression = async () => {
    if (!coursASupprimer) return;
    
    try {
      await supprimerCoursRecurrent.mutateAsync(coursASupprimer.jour.toLowerCase().trim());
      setSuccessMessage(`Le cours ${coursASupprimer.type_cours} du ${coursASupprimer.jour} a bien été supprimé.`);
      setShowSupprimerModal(false);
      setCoursASupprimer(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du cours:', error);
      setSuccessMessage("Erreur lors de la suppression du cours.");
      setShowSupprimerModal(false);
    }
  };

  // Ferme la modal sans supprimer
  const annulerSuppression = () => {
    setShowSupprimerModal(false);
    setCoursASupprimer(null);
  };

  if (loadingProfesseurs || loadingPlanning) {
    return <Spinner size="xl" />;
  }

  return (
    <>
      <Tabs activeKey={activeTabKey} onSelect={(_e, key) => setActiveTabKey(key as number)}>
        <Tab eventKey={0} title={<TabTitleText>Ajouter un cours</TabTitleText>}>
          <Form onSubmit={handleSubmit}>
            <FormGroup label="Type de cours" isRequired fieldId="type-cours">
              <FormSelect
                id="type-cours"
                value={selectedType || ''}
                onChange={(_event, value) => setSelectedType(value)}
                aria-label="Type de cours"
              >
                <FormSelectOption isDisabled value="" label="Sélectionnez un type" />
                <FormSelectOption value="Judo" label="Judo" />
                <FormSelectOption value="JJB" label="JJB" />
                <FormSelectOption value="Grappling" label="Grappling" />
              </FormSelect>
            </FormGroup>
            <FormGroup label="Nom du cours" isRequired fieldId="nom-cours">
              <TextInput
                isRequired
                type="text"
                id="nom-cours"
                value={nom}
                onChange={(_e, value) => setNom(value)}
              />
            </FormGroup>
            <FormGroup label="Jour" isRequired fieldId="jour-cours">
              <FormSelect
                id="jour-cours"
                value={jour || ''}
                onChange={(_event, value) => setJour(value)}
                aria-label="Jour du cours"
              >
                <FormSelectOption isDisabled value="" label="Sélectionnez un jour" />
                {joursSemaine.map((j) => (
                  <FormSelectOption key={j} value={j} label={j} />
                ))}
              </FormSelect>
            </FormGroup>
            <FormGroup label="Horaire" isRequired fieldId="horaire-cours">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <TextInput
                  isRequired
                  type="time"
                  id="heure-debut"
                  value={heureDebut}
                  onChange={(_e, value) => setHeureDebut(value)}
                />
                <TextInput
                  isRequired
                  type="time"
                  id="heure-fin"
                  value={heureFin}
                  onChange={(_e, value) => setHeureFin(value)}
                />
              </div>
            </FormGroup>
            <FormGroup label="Professeurs" fieldId="professeurs-cours">
              <DualListSelectorGeneric
                availableItems={professeurs}
                assignedItems={selectedUsers}
                onChange={(newAssigned) => setSelectedUsers(newAssigned.map((u: any) => ({ id: u.id, name: u.last_name ? u.last_name : u.name })))}
                getText={(item: any) => item.first_name ? `${item.first_name} ${item.last_name}` : item.name}
                getKey={(item: any) => item.id}
                availableTitle="Professeurs disponibles"
                assignedTitle="Professeurs assignés"
              />
            </FormGroup>
            <Button type="submit" variant="primary">
              Ajouter le cours
            </Button>
          </Form>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Voir les cours</TabTitleText>}>
          {planningCours.length === 0 ? (
            <EmptyState>
              <EmptyStateBody>Aucun cours enregistré.</EmptyStateBody>
            </EmptyState>
          ) : (
            <>
              <Title headingLevel="h2" size="lg" style={{ marginBottom: '1rem' }}>
                Planning des cours
              </Title>
              <Gallery hasGutter maxWidths={{ default: '350px' }}>
                {planningCours.map((c, index) => {
                  let typeColor = '#007bff';
                  let typeBgColor = '#e3f2fd';
                  if (c.type_cours === 'JJB') {
                    typeColor = '#2e7d32';
                    typeBgColor = '#e8f5e8';
                  } else if (c.type_cours === 'Grappling') {
                    typeColor = '#f57c00';
                    typeBgColor = '#fff3e0';
                  } else if (c.type_cours === 'Judo') {
                    typeColor = '#1565c0';
                    typeBgColor = '#e1f5fe';
                  }

                  return (
                    <GalleryItem key={index}>
                      <Card 
                        isHoverable 
                        style={{ 
                          height: '100%',
                          border: `2px solid ${typeColor}`,
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}
                      >
                        <div 
                          style={{ 
                            background: typeBgColor,
                            padding: '0.75rem',
                            borderBottom: `1px solid ${typeColor}`
                          }}
                        >
                          <CardTitle>
                            <Flex alignItems={{ default: 'alignItemsCenter' }}>
                              <FlexItem>
                                <Badge 
                                  style={{ 
                                    backgroundColor: typeColor, 
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    padding: '0.25rem 0.75rem'
                                  }}
                                >
                                  {c.type_cours}
                                </Badge>
                              </FlexItem>
                            </Flex>
                          </CardTitle>
                        </div>
                        
                        <CardBody style={{ padding: '1rem' }}>
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                                <CalendarAltIcon 
                                  style={{ marginRight: 8, color: typeColor, fontSize: '1.1rem' }} 
                                />
                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                  {c.jour}
                                </span>
                              </Flex>
                            </FlexItem>
                            
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                                <ClockIcon 
                                  style={{ marginRight: 8, color: '#6a6e73', fontSize: '1rem' }} 
                                />
                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                  {c.heure_debut} - {c.heure_fin}
                                </span>
                              </Flex>
                            </FlexItem>
                            
                            {Array.isArray(c.professeurs) && c.professeurs.length > 0 && (
                              <FlexItem>
                                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                  <UserIcon 
                                    style={{ marginRight: 8, color: '#6a6e73', fontSize: '1rem' }} 
                                  />
                                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                    Professeur{c.professeurs.length > 1 ? 's' : ''}:
                                  </span>
                                </Flex>
                                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  {c.professeurs.map((prof: string, idx: number) => (
                                    <Badge 
                                      key={idx}
                                      style={{ 
                                        backgroundColor: '#f5f5f5',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '6px'
                                      }}
                                      onClick={() => ouvrirModalDissociation(c, prof)}
                                    >
                                      {prof}
                                      <span style={{ marginLeft: '0.25rem', fontWeight: 'bold' }}>×</span>
                                    </Badge>
                                  ))}
                                </div>
                              </FlexItem>
                            )}
                          </Flex>
                        </CardBody>
                        
                        <CardFooter style={{ padding: '0.75rem 1rem', background: '#fafafa' }}>
                          <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                            <Button variant="secondary" size="sm">
                              <PencilAltIcon style={{ marginRight: '0.25rem' }} />
                              Modifier
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => ouvrirModalSuppression(c)}
                            >
                              Supprimer
                            </Button>
                          </Flex>
                        </CardFooter>
                      </Card>
                    </GalleryItem>
                  );
                })}
              </Gallery>
            </>
          )}
        </Tab>
      </Tabs>
      
      {/* Modal de confirmation pour dissocier un professeur */}
      <ModalWithHelp
        title={successMessage ? "Dissociation effectuée" : "Confirmer la dissociation"}
        isOpen={isModalOpen}
        onClose={annulerDissociation}
        onConfirm={successMessage ? undefined : confirmerDissociation}
        confirmText={successMessage ? undefined : "Oui, dissocier"}
        cancelText={successMessage ? undefined : "Annuler"}
      >
        {successMessage ? (
          <p style={{ color: 'green' }}>{successMessage}</p>
        ) : (
          professeurADissocier && (
            <p>
              Êtes-vous sûr de vouloir dissocier <strong>{professeurADissocier.prof.name}</strong> du cours <strong>{professeurADissocier.cours.type_cours}</strong> du <strong>{professeurADissocier.cours.jour}</strong> ?
            </p>
          )
        )}
      </ModalWithHelp>

      {/* Modal de confirmation pour supprimer un cours */}
      <ModalWithHelp
        title="Confirmer la suppression"
        isOpen={showSupprimerModal}
        onClose={annulerSuppression}
        onConfirm={confirmerSuppression}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
      >
        {coursASupprimer && (
          <p>
            Êtes-vous sûr de vouloir supprimer le cours <strong>{coursASupprimer.type_cours}</strong> du <strong>{coursASupprimer.jour}</strong> ?
            <br />
            <span style={{ color: 'red', fontSize: '0.9rem' }}>Cette action est irréversible.</span>
          </p>
        )}
      </ModalWithHelp>
    </>
  );
};

export default AjouterCours;
