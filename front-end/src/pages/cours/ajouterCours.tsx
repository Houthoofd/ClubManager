import React, { useState } from 'react';
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
  Spinner,
  Card,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core';
import { useCours, useAjouterCours, useModifierCours, useSupprimerCours, useProfesseurs } from '../../hooks/useCours';

const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const AjouterCours = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [jour, setJour] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; name: string }[]>([]);

  // Utilisation des hooks React Query
  const { data: cours = [], isLoading: loadingCours } = useCours();
  const { data: professeurs = [], isLoading: loadingProfesseurs } = useProfesseurs();
  const ajouterCours = useAjouterCours();
  const modifierCours = useModifierCours();
  const supprimerCours = useSupprimerCours();

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

  const handleSupprimerCours = async (jourSemaine: string) => {
    try {
      await supprimerCours.mutateAsync(jourSemaine);
    } catch (error) {
      console.error('Erreur lors de la suppression du cours:', error);
    }
  };

  if (loadingCours || loadingProfesseurs) {
    return <Spinner size="xl" />;
  }

  return (
    <Tabs activeKey={activeTabKey} onSelect={(_e, key) => setActiveTabKey(key as number)}>
      <Tab eventKey={0} title={<TabTitleText>Ajouter un cours</TabTitleText>}>
        <Form onSubmit={handleSubmit}>
          <FormGroup label="Type de cours" isRequired fieldId="type-cours">
            <Select
              id="type-cours"
              selected={selectedType}
              onSelect={(_e, value) => setSelectedType(value as string)}
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
              value={nom}
              onChange={(_e, value) => setNom(value)}
            />
          </FormGroup>
          <FormGroup label="Jour" isRequired fieldId="jour-cours">
            <Select
              id="jour-cours"
              selected={jour}
              onSelect={(_e, value) => setJour(value as string)}
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
          <Button type="submit" variant="primary">
            Ajouter le cours
          </Button>
        </Form>
      </Tab>
      <Tab eventKey={1} title={<TabTitleText>Voir les cours</TabTitleText>}>
        {cours.length === 0 ? (
          <EmptyState>
            <EmptyStateBody>Aucun cours enregistré.</EmptyStateBody>
          </EmptyState>
        ) : (
          <div>
            {cours.map((c, index) => (
              <Card key={index}>
                <div>
                  <strong>{c.nom}</strong> - {c.type_cours} - {c.jour} - {c.heure_debut} à {c.heure_fin}
                </div>
                <Button variant="danger" onClick={() => handleSupprimerCours(c.jour)}>
                  Supprimer
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Tab>
    </Tabs>
  );
};

export default AjouterCours;
