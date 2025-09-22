import React from 'react';
import { Bullseye, Title } from '@patternfly/react-core';
import EditableTable from '../common/table/editableTable';
import SearchInput from '../common/input/SearchInput';
import type { UserData } from '@clubmanager/types';

// Ajoute la prop onRequestDelete dans les props du composant
export interface OngletTableauUtilisateursProps {
  utilisateurs: UserData[];
  columns: { key: string; label: string; ariaLabel: string }[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  onDeleteUser?: (user: UserData) => void; // <-- Ajout ici
  // ...autres props éventuelles...
}

const OngletTableauUtilisateurs: React.FC<OngletTableauUtilisateursProps> = ({
  utilisateurs,
  columns: propColumns, // Renomme la prop ici pour éviter le conflit
  searchTerm,
  onSearchChange,
  isLoading,
  onDeleteUser, // <-- Ajout ici
  // ...autres props éventuelles...
}: OngletTableauUtilisateursProps) => {
  // Colonnes par défaut
  const defaultColumns = [
    { key: 'first_name', label: 'Prénom' },
    { key: 'last_name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Statut' }
  ];

  // Utiliser les colonnes fournies ou les colonnes par défaut
  const columns = propColumns && propColumns.length > 0 ? propColumns : defaultColumns;

  // Filtre les utilisateurs selon le terme de recherche
  const filteredUtilisateurs = utilisateurs.filter(u => {
    if (!u) return false;

    const searchLower = searchTerm.toLowerCase();
    return (
      (u.nom_utilisateur && u.nom_utilisateur.toString().toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toString().toLowerCase().includes(searchLower)) ||
      (u.first_name && u.first_name.toString().toLowerCase().includes(searchLower)) ||
      (u.last_name && u.last_name.toString().toLowerCase().includes(searchLower)) ||
      (u.status && u.status.toString().toLowerCase().includes(searchLower))
    );
  });

  // Vérification de sécurité pour éviter les erreurs
  if (isLoading) {
    return <Bullseye>Chargement...</Bullseye>;
  }

  if (!utilisateurs || utilisateurs.length === 0) {
    return (
      <Bullseye>
        <Title headingLevel="h4">Aucun utilisateur trouvé</Title>
      </Bullseye>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Title headingLevel="h3" style={{ marginBottom: '1rem', color: '#333' }}>
          Liste des utilisateurs
        </Title>
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Rechercher un utilisateur"
          style={{ marginBottom: '1rem' }}
        />
        <div style={{
          fontSize: '0.9rem',
          color: '#6c757d',
          marginBottom: '0.5rem'
        }}>
          {filteredUtilisateurs.length} utilisateur{filteredUtilisateurs.length > 1 ? 's' : ''} trouvé{filteredUtilisateurs.length > 1 ? 's' : ''}
        </div>
      </div>
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <EditableTable
          data={filteredUtilisateurs}
          columns={columns.map(col => ({
            title: col.label,
            dataKey: col.key as keyof UserData
          }))}
          onRequestDelete={onDeleteUser} // <-- Passe la prop ici
          renderRowActions={(user) => (
            <button
              onClick={() => onDeleteUser && onDeleteUser(user)}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Supprimer
            </button>
          )}
        />
      </div>
    </>
  );
};

export default OngletTableauUtilisateurs;
