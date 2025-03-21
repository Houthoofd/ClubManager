import React, { useEffect, useState } from 'react';
import '../../app/styles/style-modal.css';

export interface ModalProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  message: string;
  title: string;
  redirectUrl?: string; // Redirection optionnelle vers une page spécifique
}

export const Modal: React.FC<ModalProps> = ({
  showModal,
  setShowModal,
  message,
  title,
  redirectUrl = "/", // Si aucune URL n'est passée, redirection vers la racine '/'
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false); // Pour éviter une double redirection

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        if (redirectUrl && !isRedirecting) {
          setIsRedirecting(true);
          window.location.href = redirectUrl; // Redirection vers l'URL donnée
        }
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [setShowModal, redirectUrl, isRedirecting]);

  if (!showModal) return null;

  const handleClose = () => {
    setShowModal(false);
    if (redirectUrl && !isRedirecting) {
      setIsRedirecting(true);
      window.location.href = redirectUrl; // Redirection vers l'URL donnée
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="modal-title">
      <div className="modal-content">
        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button
            onClick={handleClose}
            className="modal-close-button"
            aria-label="Close modal"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
