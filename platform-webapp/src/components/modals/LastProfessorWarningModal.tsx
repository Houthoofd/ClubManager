import React from 'react';
import ModalConfirmation from '../common/modal/ModalConfirmation';

interface LastProfessorWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  professorName: string;
  courseName: string;
}

export const LastProfessorWarningModal: React.FC<LastProfessorWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  professorName,
  courseName
}) => {
  return (
    <ModalConfirmation
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="⚠️ Dernier professeur du cours"
      confirmText="Dissocier et supprimer le cours"
      cancelText="Annuler"
      variant="danger"
      showCancelButton={true}
    >
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <p style={{ fontSize: '1rem', fontWeight: 'normal', marginBottom: '1rem' }}>
          Vous êtes sur le point de dissocier le dernier professeur de ce cours.
        </p>
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#856404', margin: 0 }}>
            <strong>Professeur :</strong> {professorName}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#856404', margin: '0.25rem 0 0 0' }}>
            <strong>Cours :</strong> {courseName}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#721c24', margin: 0, fontWeight: 'bold' }}>
            ⚠️ Attention : Ce cours sera automatiquement supprimé car il n'aura plus de professeur assigné.
          </p>
          <p style={{ fontSize: '0.85rem', color: '#721c24', margin: '0.5rem 0 0 0' }}>
            Cette action est irréversible.
          </p>
        </div>
        
        {/* Boutons explicites au cas où ModalConfirmation ne les affiche pas */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem', 
          marginTop: '1.5rem' 
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dissocier et supprimer le cours
          </button>
        </div>
      </div>
    </ModalConfirmation>
  );
};
