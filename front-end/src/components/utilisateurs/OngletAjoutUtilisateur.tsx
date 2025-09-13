import React from 'react';
import { PageSection, Title } from '@patternfly/react-core';
import GenericForm from '../genericForm';

interface OngletAjoutUtilisateurProps {
  formData: any;
  selectOptions: any;
  selectOpenStates: { [key: string]: boolean };
  existenceMessages: { [key: string]: string };
  dernierUtilisateur: any;
  onChange: (value: string, key: string) => void;
  onSelectToggle: (key: string, isOpen: boolean) => void;
  onSubmit: (e: React.FormEvent) => Promise<any>;
}

const OngletAjoutUtilisateur: React.FC<OngletAjoutUtilisateurProps> = ({
  formData,
  selectOptions,
  selectOpenStates,
  existenceMessages,
  dernierUtilisateur,
  onChange,
  onSelectToggle,
  onSubmit
}) => {
  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Title headingLevel="h3" style={{ marginBottom: '0.5rem', color: '#333' }}>
          Créer un nouvel utilisateur
        </Title>
        <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
          Remplissez les informations ci-dessous pour ajouter un nouvel utilisateur au système
        </p>
      </div>

      <div style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        marginBottom: '2rem'
      }}>
        <GenericForm
          formData={formData}
          selectOptions={selectOptions}
          selectOpenStates={selectOpenStates}
          onChange={onChange}
          onSelectToggle={onSelectToggle}
          onSubmit={onSubmit}
          existenceMessages={existenceMessages}
        />
      </div>

      {dernierUtilisateur && (
        <div style={{
          background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid #28a745',
          boxShadow: '0 4px 8px rgba(40, 167, 69, 0.1)',
          marginTop: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              fontSize: '2rem', 
              marginRight: '1rem',
              filter: 'drop-shadow(0 2px 4px rgba(40, 167, 69, 0.3))'
            }}>
              ✅
            </div>
            <Title headingLevel="h2" size="lg" style={{ color: '#155724', margin: 0 }}>
              Utilisateur ajouté avec succès !
            </Title>
          </div>
          
          <div style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #c3e6cb',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            <div style={{ 
              marginBottom: '0.5rem', 
              fontWeight: 'bold', 
              color: '#155724',
              fontFamily: 'inherit'
            }}>
              Détails de l'utilisateur créé :
            </div>
            <pre style={{ margin: 0, color: '#495057' }}>
              {JSON.stringify(dernierUtilisateur, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
};

export default OngletAjoutUtilisateur;
