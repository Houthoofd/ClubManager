import React from 'react';
import { Alert, AlertActionCloseButton, Button, AlertActionLink } from '@patternfly/react-core';

interface FormStatusAlertsProps {
  isFormComplete: boolean;
  isCheckingUser: boolean;
  backendVerificationDone: boolean;
  userExists: boolean;
  existingUserData: any;
  onCloseUserExistsAlert: () => void;
  onGoToLogin: () => void;
  onModifyData: () => void;
}

export const FormStatusAlerts: React.FC<FormStatusAlertsProps> = ({
  isFormComplete,
  isCheckingUser,
  backendVerificationDone,
  userExists,
  existingUserData,
  onCloseUserExistsAlert,
  onGoToLogin,
  onModifyData,
}) => {
  // ÉTAPE 1 : Alerte de vérification en cours
  if (isCheckingUser) {
    return (
      <Alert 
        variant="info" 
        title="🔍 Vérification en cours" 
        isInline
      >
        <div>
          <p>1️⃣ Vérification si ces informations existent déjà en base...</p>
          <p>2️⃣ Validation des données avec le schéma de sécurité...</p>
        </div>
      </Alert>
    );
  }

  // ÉTAPE 2 : Alerte utilisateur existant (BLOCAGE)
  if (userExists && existingUserData) {
    return (
      <Alert 
        variant="danger" 
        title="🚫 Inscription bloquée - Utilisateur existant" 
        isInline
        actionClose={<AlertActionCloseButton onClose={onCloseUserExistsAlert} />}
        actionLinks={
          <>
            <AlertActionLink onClick={onGoToLogin}>
              Se connecter
            </AlertActionLink>
            <AlertActionLink onClick={onModifyData}>
              Modifier les données
            </AlertActionLink>
          </>
        }
      >
        <div>
          <p><strong>❌ Inscription impossible</strong></p>
          <p>Une personne avec le nom "{existingUserData.prenom} {existingUserData.nom}" 
          née le {existingUserData.date_naissance} est déjà inscrite dans notre système.</p>
          <p><em>Vous devez soit vous connecter, soit modifier les informations.</em></p>
        </div>
      </Alert>
    );
  }

  // ÉTAPE 3 : Alerte succès complet (AUTORISATION)
  if (isFormComplete && backendVerificationDone && !userExists) {
    return (
      <Alert 
        variant="success" 
        title="✅ Inscription autorisée" 
        isInline
      >
        <div>
          <p><strong>🎉 Toutes les vérifications sont passées !</strong></p>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>✓ Aucun compte existant trouvé avec ces informations</li>
            <li>✓ Toutes les données respectent les critères de sécurité</li>
            <li>✓ Vous pouvez procéder à l'inscription</li>
          </ul>
        </div>
      </Alert>
    );
  }

  // ÉTAPE 0 : Alerte formulaire en cours de saisie
  if (!isFormComplete) {
    return (
      <Alert 
        variant="info" 
        title="📝 Formulaire en cours de saisie" 
        isInline
      >
        <p>Veuillez remplir tous les champs obligatoires pour démarrer la vérification automatique.</p>
      </Alert>
    );
  }

  return null;
};