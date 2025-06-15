import React, { useState, useEffect } from 'react';
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
  EmptyStateBody
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';
import type { MenuToggleElement } from '@patternfly/react-core';
import DualListSelectorGeneric from '../../components/dualListSelector';

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

  const getTypeCoursStyle = (type: string) => {
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
    if (activeTabKey === 1) {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
    }
  }, [activeTabKey]);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:3000/cours/informations/planning');
      const data = await res.json();
      const tousLesNoms = data.flatMap((cours: any) =>
        cours.professeurs.map((p: string, index: number) => ({
          id: index,
          name: p.trim()
        }))
      );
      const nomsUniques = Array.from(new Map(tousLesNoms.map(item => [item.name, item])).values());

      setAllUsers(nomsUniques);
      setCours(data);
    } catch (err) {
      console.error('Erreur de récupération des données', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !selectedType || !jour || !heureDebut || !heureFin) return;

    const horaire = `${heureDebut} - ${heureFin}`;
    const nouveauCours = {
      nom,
      type: selectedType,
      jour,
      horaire,
      professeurs: selectedUsers.map(u => u.name)
    };

    setCours((prev) => [...prev, nouveauCours]);
    setMessage(`Cours ajouté : ${nom} (${selectedType})`);
    setNom('');
    setSelectedType(null);
    setJour(null);
    setHeureDebut('');
    setHeureFin('');
    setSelectedUsers([]);
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

  const handleRemoveProfesseur = (coursIndex: number, profIndex: number) => {
    const newCours = [...cours];
    newCours[coursIndex].professeurs = newCours[coursIndex].professeurs.filter((_, i) => i !== profIndex);
    setCours(newCours);
  };

  const handleRemoveCours = (index: number) => {
    setCours(cours.filter((_, i) => i !== index));
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
            assignedItems={selectedUsers}
            getText={(user) => user.name}
            renderItem={(user) => (
              <span>
                {user.name} <small>({user.id})</small>
              </span>
            )}
            onChange={setSelectedUsers}
          />

          <Button type="submit" variant="primary" style={{ marginTop: '1rem' }}>
            Ajouter
          </Button>
        </Form>

        {message && (
          <Alert title={message} variant="success" isInline style={{ marginTop: '1rem' }} />
        )}
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
            onClick={() => handleRemoveCours(index)}
          >
            <TrashIcon />
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
                  onClose={() => handleRemoveProfesseur(index, pIndex)}
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
      </Tab>
    </Tabs>
  );
};

export default AjouterCours;
