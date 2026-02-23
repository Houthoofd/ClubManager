import React, { useEffect } from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Title,
  Flex,
  FlexItem,
  Alert,
  Spinner,
} from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationTriangleIcon, TimesCircleIcon } from '@/shared/icons';

interface ModalWithHelpProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  variant?: 'confirmation' | 'success' | 'error' | 'loading';
  data?: any;
  selectOptions?: any;
  isLoading?: boolean;
  error?: string | null;
  successMessage?: string;
  context?: 'connexion' | 'creation' | 'ajout' | 'modification' | 'default';
  size?: 'small' | 'medium' | 'large';
  autoCloseDelay?: number;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

export const ModalWithHelp: React.FC<ModalWithHelpProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  variant = 'confirmation',
  data = {},
  selectOptions = {},
  isLoading = false,
  error = null,
  successMessage = '',
  context = 'default',
  size = 'medium',
  autoCloseDelay,
  confirmText,
  cancelText,
  children,
}) => {
  useEffect(() => {
    if (isOpen && autoCloseDelay) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  const formatLabel = (key: string) => {
    let formatted = key.replace(/_/g, ' ');
    if (formatted.endsWith(' id')) formatted = formatted.slice(0, -3);
    if (formatted.toLowerCase() === 'first name') return 'Prénom';
    if (formatted.toLowerCase() === 'last name') return 'Nom';
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getDisplayValue = (key: string, value: any) => {
    if (!value) return 'Non renseigné';

    // Pour les champs select (_id)
    if (key.endsWith('_id') && selectOptions[key]) {
      const option = selectOptions[key].find((opt: any) => opt.id == value);
      if (option) {
        // Gestion spécifique pour chaque type d'option
        if (key === 'genre_id' && option.genre_name) return option.genre_name;
        if (key === 'abonnement_id' && option.nom_plan) return option.nom_plan;
        if (key === 'role_id' && option.nom_role) return option.nom_role;
        if (key === 'status_id' && option.nom_status) return option.nom_status;
        if (key === 'grade_id' && option.grade_id) return option.grade_id; // Ajout pour les grades
        
        // Fallback générique
        return option.nom || option.name || option.label || option.genre_name || 
               option.nom_plan || option.nom_role || option.nom_status || option.grade_id || 
               `ID ${option.id}`;
      }
    }

    // Pour les mots de passe
    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('mot_de_passe')) {
      return '••••••••';
    }

    return value;
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    if (isLoading) {
      return (
        <div className="modal-help-loading">
          <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsLg' }}>
            <FlexItem>
              <Spinner size="xl" />
            </FlexItem>
            <FlexItem>
              <p>Chargement en cours...</p>
            </FlexItem>
          </Flex>
        </div>
      );
    }

    if (variant === 'success') {
      switch (context) {
        case 'connexion':
          return (
            <div className="modal-help-success">
              <Alert variant="success" title="Connexion réussie !" isInline />
              {data && Object.keys(data).length > 0 && (
                <div className="modal-help-data">
                  <Title headingLevel="h4" size="md" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                    Informations utilisateur :
                  </Title>
                  <div className="modal-help-summary">
                    {Object.entries(data).map(([key, value]) => (
                      <div key={key} className="modal-help-item">
                        <span className="modal-help-label">{formatLabel(key)} :</span>
                        <span className="modal-help-value">{getDisplayValue(key, value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );

        case 'creation':
          return (
            <div className="modal-help-success">
              <Alert variant="success" title="Création réussie !" isInline>
                {successMessage && <p>{successMessage}</p>}
              </Alert>
              {data && Object.keys(data).length > 0 && (
                <div className="modal-help-data">
                  <Title headingLevel="h4" size="md" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                    Informations enregistrées :
                  </Title>
                  <div className="modal-help-summary">
                    {Object.entries(data).map(([key, value]) => (
                      <div key={key} className="modal-help-item">
                        <span className="modal-help-label">{key} :</span>
                        <span className="modal-help-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );

        case 'ajout':
          return (
            <div className="modal-help-success">
              <Alert variant="success" title="Ajout réussi !" isInline>
                {successMessage && <p>{successMessage}</p>}
              </Alert>
              {data && (
                <div className="modal-help-data">
                  <p><strong>Élément ajouté :</strong> {data.nom}</p>
                </div>
              )}
            </div>
          );

        case 'modification':
          return (
            <div className="modal-help-success">
              <Alert variant="success" title="Modification réussie !" isInline>
                {successMessage && <p>{successMessage}</p>}
              </Alert>
              {data && (
                <div className="modal-help-data">
                  <p><strong>Élément modifié :</strong> {data.nom}</p>
                </div>
              )}
            </div>
          );

        default:
          return (
            <div className="modal-help-default">
              <p>Contenu par défaut de la modal.</p>
            </div>
          );
      }
    }

    if (variant === 'error') {
      return (
        <div className="modal-help-error">
          <Alert variant="danger" title="Erreur" isInline>
            {error && <p>{error}</p>}
          </Alert>
        </div>
      );
    }

    return (
      <div className="modal-help-default">
        <p>Contenu par défaut de la modal.</p>
      </div>
    );
  };

  // Supprimons la création complexe d'actions et utilisons directement
  const modalActions = [
    <Button key="close" variant="secondary" onClick={onClose}>
      {cancelText || 'Fermer'}
    </Button>
  ];

  return (
    <Modal
      variant={size === 'large' ? ModalVariant.large : size === 'small' ? ModalVariant.small : ModalVariant.medium}
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      actions={modalActions}
      className="modal-with-help"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          {variant === 'success' && <CheckCircleIcon color="#28a745" size="lg" />}
          {variant === 'error' && <TimesCircleIcon color="#dc3545" size="lg" />}
          {variant === 'loading' && <Spinner size="lg" />}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
          {variant === 'success' ? 'Opération réussie' : variant === 'error' ? 'Une erreur est survenue' : ''}
        </div>
      </div>
      <div>
        {renderContent()}
      </div>
    </Modal>
  );
};

export default ModalWithHelp;


