import React from 'react';
import { Bullseye, Title } from '@patternfly/react-core';
import EditableTable from '../common/table/editableTable';
import SearchInput from '../common/input/SearchInput';

interface OngletTableauUtilisateursProps {
  utilisateurs: any[];
  columns: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  userSchema: any;
  isLoading?: boolean;
}

const OngletTableauUtilisateurs: React.FC<OngletTableauUtilisateursProps> = ({
  utilisateurs,
  columns,
  searchTerm,
  onSearchChange,
  userSchema,
  isLoading = false
}) => {
  // Filtre les utilisateurs selon le terme de recherche
  const filteredUtilisateurs = utilisateurs.filter(u =>
    (u.nom_utilisateur && u.nom_utilisateur.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.first_name && String(u.first_name).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.last_name && String(u.last_name).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <Bullseye>Chargement...</Bullseye>;
  }

  if (!userSchema) {
    return <Bullseye>Chargement du schéma...</Bullseye>;
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
          placeholder="🔍 Rechercher un utilisateur par nom, prénom, email ou nom d'utilisateur"
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
          columns={columns}
        />
      </div>
    </>
  );
};

export default OngletTableauUtilisateurs;
