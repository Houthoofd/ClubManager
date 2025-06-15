import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Alert,
  List,
  ListItem,
  Spinner,
  EmptyState,
  EmptyStateBody,
  FormSelect,
  FormSelectOption,
  Label,
  LabelGroup,
  Button,
  Tooltip
} from '@patternfly/react-core';
import { ExclamationTriangleIcon, TrashIcon  } from '@patternfly/react-icons';

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

const AjouterProfesseur = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [message, setMessage] = useState('');
  const [cours, setCours] = useState<CoursAvecProfesseurs[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Utilisateur[]>([]);
  const [professeursUniques, setProfesseursUniques] = useState<string[]>([]);

  const [formData, setFormData] = useState({ type_id: '' });

  const selectOptions = {
    type_id: [
      { id: 'Judo', genre_name: 'Judo' },
      { id: 'JJB', genre_name: 'JJB' },
      { id: 'Grappling', genre_name: 'Grappling' }
    ]
  };

  const handleTabClick = (_event: React.MouseEvent, tabIndex: number) => {
    setActiveTabKey(tabIndex);
  };

  const onChange = (value: string, key: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsers.length || !formData.type_id) return;

    const nouveauCours: CoursAvecProfesseurs = {
      type_cours: formData.type_id,
      jour: 'Lundi',
      heure_debut: '18:00',
      heure_fin: '19:00',
      professeurs: selectedUsers.map((u) => `${u.first_name} ${u.last_name}`)
    };

    setCours(prev => [...prev, nouveauCours]);
    setMessage(`Cours ajouté avec ${selectedUsers.length} professeur(s)`);
    setFormData({ type_id: '' });
    setSelectedUsers([]);
  };

  useEffect(() => {
  if (activeTabKey !== 0 && activeTabKey !== 1) return;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coursRes, usersRes] = await Promise.all([
        fetch('http://localhost:3000/cours/informations/planning'),
        fetch('http://localhost:3000/utilisateurs')
      ]);
      const coursData = await coursRes.json();
      const usersData: Utilisateur[] = await usersRes.json();

      setCours(coursData);
      setUtilisateurs(usersData.data);

      const allProfesseurs = coursData.flatMap((c: CoursAvecProfesseurs) =>
        c.professeurs.map((p: string) => p.trim())
      );
      const uniques = Array.from(new Set(allProfesseurs));
      setProfesseursUniques(uniques);
    } catch (error) {
      console.error('Erreur :', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [activeTabKey]);



  console.log(professeursUniques)

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

            <label style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sélectionnez les utilisateurs :
              <Tooltip content="Maintenez Alt (ou Cmd sur Mac) pour en sélectionner plusieurs.">
                <ExclamationTriangleIcon color="#f0ab00" />
              </Tooltip>
            </label>
            <FormSelect
              value={selectedUsers.map((u) => u.id.toString())}
              onChange={(e) => {
                const selectedIds = Array.from(e.currentTarget.selectedOptions).map((opt) => opt.value);
                const selectedObjs = utilisateurs.filter((u) =>
                  selectedIds.includes(u.id.toString())
                );
                setSelectedUsers(selectedObjs);
              }}
              multiple
              aria-label="Sélection multiple"
              style={{ height: '200px' }}
            >
              {utilisateurs.map((user) => (
                <FormSelectOption
                  key={user.id}
                  value={user.id.toString()}
                  label={`${user.first_name} ${user.last_name}`}
                />
              ))}
            </FormSelect>

            {selectedUsers.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Utilisateurs sélectionnés :</strong>
                <LabelGroup numLabels={5}>
                  {selectedUsers.map((user) => (
                    <Label
                      key={user.id}
                      onClose={() => {
                        setSelectedUsers((prev) =>
                          prev.filter((u) => u.id !== user.id)
                        );
                      }}
                      closeBtnAriaLabel={`Retirer ${user.first_name} ${user.last_name}`}
                    >
                      {user.first_name} {user.last_name}
                    </Label>
                  ))}
                </LabelGroup>
              </div>
            )}

            <Button type="submit" variant="primary" style={{ marginTop: '1rem' }}>
              Ajouter
            </Button>
          </form>

          {message && (
            <Alert title={message} variant="success" isInline style={{ marginTop: '1rem' }} />
          )}
        </div>
      </Tab>

      <Tab eventKey={1} title={<TabTitleText>Voir les professeurs</TabTitleText>}>
        <div style={{ marginTop: '1rem' }}>
          {isLoading ? (
            <Spinner isSVG size="xl" />
          ) : cours.length > 0 ? (
            <>
              <h2 style={{ marginTop: '2rem' }}>Professeurs enregistrés</h2>
              {professeursUniques.map((nomProf) => (
                <div key={nomProf} style={{
                  border: '1px solid #d2d2d2',
                  borderRadius: '6px',
                  padding: '1rem',
                  width: '200px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{nomProf}</div>
                  <Tooltip content="Supprimer comme professeur">
                    <Button
                      variant="danger"
                      size="sm"
                      style={{ marginTop: '1rem' }}
                      onClick={() => {
                        const updatedCours = cours
                          .map(c => ({
                            ...c,
                            professeurs: c.professeurs.filter(p => p !== nomProf)
                          }))
                          .filter(c => c.professeurs.length > 0);
                        setCours(updatedCours);

                        // Met à jour la liste des professeurs uniques
                        const remainingProfesseurs = new Set(
                          updatedCours.flatMap(c => c.professeurs)
                        );
                        setProfesseursUniques(Array.from(remainingProfesseurs));
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </Tooltip>
                </div>
              ))}
            </>
          ) : (
            <EmptyState>
              <EmptyStateBody>
                Il n'y a actuellement aucun cours enregistré.
              </EmptyStateBody>
            </EmptyState>
          )}
        </div>
      </Tab>

    </Tabs>
  );
};

export default AjouterProfesseur;
