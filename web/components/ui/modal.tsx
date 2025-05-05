import React, { useEffect, useState } from 'react';
import '../../app/styles/style-modal.css';

export interface ModalProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  message: string;
  title: string;
  type?: 'validation' | 'notification' | 'error'; // Types possibles
  onConfirm?: () => void; // Optionnel pour validation
  redirectUrl?: string;
}

export const Modal: React.FC<ModalProps> = ({
  showModal,
  setShowModal,
  message,
  title,
  type = 'notification', // Par défaut notification
  onConfirm,
  redirectUrl,
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isRedirecting]);

  if (!showModal) return null;

  const handleClose = () => {
    setShowModal(false);
    if (redirectUrl && !isRedirecting) {
      setIsRedirecting(true);
      window.location.href = redirectUrl;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    handleClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="modal-title">
      <div className={`modal-content modal-${type}`}>
        <h2 id="modal-title" className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">

          {type === 'validation' && (
            <>
              <button onClick={handleConfirm} className="modal-confirm-button">Confirmer</button>
              <button onClick={handleClose} className="modal-close-button">Annuler</button>
            </>
          )}

          {type !== 'validation' && (
            <button onClick={handleClose} className="modal-close-button">Fermer</button>
          )}

        </div>
      </div>
    </div>
  );
};

export default Modal;
