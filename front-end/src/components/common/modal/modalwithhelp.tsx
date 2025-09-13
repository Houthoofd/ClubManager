import React from 'react';
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
import { CheckCircleIcon, ExclamationTriangleIcon, TimesCircleIcon } from '@patternfly/react-icons';

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
}) => {
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

  const renderIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircleIcon color="#28a745" size="lg" />;
      case 'error':
        return <TimesCircleIcon color="#dc3545" size="lg" />;
      case 'loading':
        return <Spinner size="lg" />;
      case 'confirmation':
      default:
        return <ExclamationTriangleIcon color="#ffc107" size="lg" />;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="modal-help-loading">
          <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsLg' }}>
            <FlexItem>
              <Spinner size="xl" />
            </FlexItem>
            <FlexItem>
              <p>Création de l'utilisateur en cours...</p>
            </FlexItem>
          </Flex>
        </div>
      );
    }

    if (variant === 'success') {
      return (
        <div className="modal-help-success">
          <Alert variant="success" title="Utilisateur créé avec succès !" isInline>
            {successMessage && <p>{successMessage}</p>}
          </Alert>
          {data && Object.keys(data).length > 0 && (
            <div className="modal-help-data">
              <Title headingLevel="h4" size="md" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                Informations enregistrées :
              </Title>
              <div className="modal-help-summary">
                {Object.entries(data)
                  .filter(([key]) => key !== 'id' && key !== 'date_creation' && key !== 'date_modification')
                  .map(([key, value]) => (
                    <div key={key} className="modal-help-item">
                      <span className="modal-help-label">{formatLabel(key)} :</span>
                      <span className="modal-help-value">{getDisplayValue(key, value)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      );
    }

    if (variant === 'error') {
      return (
        <div className="modal-help-error">
          <Alert variant="danger" title="Erreur lors de la création" isInline>
            {error && <p>{error}</p>}
          </Alert>
        </div>
      );
    }

    // Confirmation par défaut
    return (
      <div className="modal-help-confirmation">
        <p className="modal-help-description">
          Veuillez vérifier les informations suivantes avant de confirmer la création de l'utilisateur :
        </p>
        
        <div className="modal-help-summary">
          {Object.entries(data)
            .filter(([key]) => key !== 'id' && key !== 'date_creation' && key !== 'date_modification')
            .map(([key, value]) => (
              <div key={key} className="modal-help-item">
                <span className="modal-help-label">{formatLabel(key)} :</span>
                <span className="modal-help-value">{getDisplayValue(key, value)}</span>
              </div>
            ))
          }
        </div>

        <Alert variant="info" title="Information" isInline style={{ marginTop: '1rem' }}>
          Une fois confirmé, l'utilisateur sera créé dans le système et pourra se connecter avec ses identifiants.
        </Alert>
      </div>
    );
  };

  const renderActions = () => {
    if (isLoading) {
      return [];
    }

    if (variant === 'success' || variant === 'error') {
      return [
        <Button key="close" variant="primary" onClick={onClose}>
          Fermer
        </Button>
      ];
    }

    // Confirmation
    return [
      <Button key="cancel" variant="link" onClick={onClose}>
        Annuler
      </Button>,
      <Button key="confirm" variant="primary" onClick={onConfirm}>
        Confirmer la création
      </Button>
    ];
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title=""
      isOpen={isOpen}
      onClose={onClose}
      actions={renderActions()}
      className="modal-with-help"
    >
      <div className="modal-help-header">
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            {renderIcon()}
          </FlexItem>
          <FlexItem>
            <Title headingLevel="h2" size="xl">
              {title}
            </Title>
          </FlexItem>
        </Flex>
      </div>

      <div className="modal-help-content">
        {renderContent()}
      </div>
    </Modal>
  );
};

// Ajout de l'export par défaut pour la compatibilité
export default ModalWithHelp;
