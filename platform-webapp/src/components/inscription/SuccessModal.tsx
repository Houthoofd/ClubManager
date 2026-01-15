import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Alert,
  ModalVariant
} from '@patternfly/react-core';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      variant={ModalVariant.medium}
      title=""
      isOpen={isOpen}
      onClose={onClose}
      hasNoBodyWrapper
    >
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: '#28a745', marginBottom: '1rem' }}>
          Inscription réussie !
        </h2>
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Votre compte a été créé avec succès.<br/>
          <strong>Un email avec vos identifiants de connexion vous a été envoyé.</strong>
        </p>
        
        <Alert variant="info" title="📧 Vérifiez votre boîte email" isInline style={{ marginBottom: '1.5rem' }}>
          <p>L'email contient :</p>
          <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
            <li>Votre identifiant unique (userId)</li>
            <li>Votre nom d'utilisateur</li>
            <li>Votre mot de passe temporaire</li>
            <li>Un lien direct vers la page de connexion</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            <strong>Important :</strong> Changez votre mot de passe lors de votre première connexion.
          </p>
        </Alert>

        <Alert variant="warning" title="📬 Email non reçu ?" isInline style={{ marginBottom: '1.5rem' }}>
          <ul style={{ textAlign: 'left' }}>
            <li>Vérifiez votre dossier spam/courrier indésirable</li>
            <li>L'email peut prendre quelques minutes à arriver</li>
            <li>Depuis la page de connexion, vous pouvez demander un renvoi</li>
          </ul>
        </Alert>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/pages/connexion'}
            size="lg"
          >
            🚀 Aller à la connexion
          </Button>
          <Button 
            variant="secondary" 
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
