import React from 'react';
import { Bullseye, Title } from '@patternfly/react-core';
import EditableTable from '../common/table/editableTable';
import SearchInput from '../common/input/SearchInput';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  status_id: number;
  [key: string]: any;
}

interface OngletTableauUtilisateursProps {
  utilisateurs: UserData[];
  columns: Array<{ key: string; label: string }>;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  userSchema: Record<string, string>;
  isLoading?: boolean;
}

const OngletTableauUtilisateurs: React.FC<OngletTableauUtilisateursProps> = ({
  utilisateurs,
  columns: propColumns,
  searchTerm,
  onSearchChange,
  userSchema,
  isLoading = false
}) => {
  // Colonnes par défaut qui correspondent à la structure des données
  const defaultColumns = [
    { key: 'first_name', label: 'Prénom' },
    { key: 'last_name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'status_id', label: 'Statut' }
  ];

  // Utiliser les colonnes fournies ou les colonnes par défaut
  const columns = propColumns.length > 0 ? propColumns : defaultColumns;

  // Filtre les utilisateurs selon le terme de recherche
  const filteredUtilisateurs = utilisateurs.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (u.nom_utilisateur && u.nom_utilisateur.toString().toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toString().toLowerCase().includes(searchLower)) ||
      (u.first_name && u.first_name.toString().toLowerCase().includes(searchLower)) ||
      (u.last_name && u.last_name.toString().toLowerCase().includes(searchLower))
    );
  });

  console.log('Données brutes:', utilisateurs);
  console.log('Données filtrées:', filteredUtilisateurs);
  console.log('Colonnes utilisées:', columns);

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
          placeholder="🔍 Rechercher un utilisateur"
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
        />
      </div>
    </>
  );
};

export default OngletTableauUtilisateurs;
