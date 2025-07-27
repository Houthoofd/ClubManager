import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Alert,
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
import { ExclamationTriangleIcon, TrashIcon } from '@patternfly/react-icons';
import { API_BASE_URL } from '../../../config';

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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [professeursUniques, setProfesseursUniques] = useState<string[]>([]);

  const [formData, setFormData] = useState({ type_id: '' });

  const selectOptions = {
    type_id: [
      { id: 'Judo', genre_name: 'Judo' },
      { id: 'JJB', genre_name: 'JJB' },
      { id: 'Grappling', genre_name: 'Grappling' }
    ]
  };

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === 'number') {
      setActiveTabKey(tabIndex);
    }
  };

  const onChange = (e: React.FormEvent<HTMLSelectElement>, key: string) => {
    setFormData(prev => ({ ...prev, [key]: e.currentTarget.value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsers.length || !formData.type_id) return;

    const selectedObjs = utilisateurs.filter((u) =>
      selectedUsers.includes(u.id.toString())
    );

    const nouveauCours: CoursAvecProfesseurs = {
      type_cours: formData.type_id,
      jour: 'Lundi', // Tu peux rendre ceci dynamique si besoin
      heure_debut: '18:00',
      heure_fin: '19:00',
      professeurs: selectedObjs.map((u) => `${u.first_name} ${u.last_name}`)
    };

    const updatedCours = [...cours, nouveauCours];
    setCours(updatedCours);
    setMessage(`Cours ajouté avec ${selectedObjs.length} professeur(s)`);
    setFormData({ type_id: '' });
    setSelectedUsers([]);

    // Met à jour les profs uniques
    const allProfs = updatedCours.flatMap(c => c.professeurs.map(p => p.trim()));
    setProfesseursUniques(Array.from(new Set(allProfs)));
  };

  useEffect(() => {
    if (activeTabKey !== 0 && activeTabKey !== 1) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [coursRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}api/cours/informations/planning`),
          fetch(`${API_BASE_URL}api/utilisateurs`)
        ]);
        const coursData = await coursRes.json();
        const usersData = await usersRes.json();

        setCours(coursData);
        setUtilisateurs(usersData.data);

        const allProfesseurs: string[] = coursData.flatMap((c: { professeurs: any }) =>
          Array.isArray(c.professeurs)
            ? c.professeurs.map((p: string) => p.trim())
            : []
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
              value={selectedUsers}
              onChange={(e) => {
                const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedUsers(selectedIds);
              }}
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
                  {utilisateurs
                    .filter((u) => selectedUsers.includes(u.id.toString()))
                    .map((user) => (
                      <Label
                        key={user.id}
                        onClose={() =>
                          setSelectedUsers(prev =>
                            prev.filter(id => id !== user.id.toString())
                          )
                        }
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
            <Spinner size="xl" />
          ) : professeursUniques.length > 0 ? (
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

                        const remaining = new Set(
                          updatedCours.flatMap(c => c.professeurs)
                        );
                        setProfesseursUniques(Array.from(remaining));
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
