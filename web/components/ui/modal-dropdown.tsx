import React, { useState, useEffect } from 'react';
import '../../app/styles/style-modal-dropdown.css';

interface ModalWithDropdownProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onApplyFilters: (filterType: string, filterValue: string) => void;
}

const ModalWithDropdown: React.FC<ModalWithDropdownProps> = ({ showModal, setShowModal, onApplyFilters }) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const handleApplyFilters = () => {
    if (!selectedType && !selectedStatus) {
      alert('Veuillez sélectionner un filtre.');
      return;
    }

    if (selectedType) {
      onApplyFilters('type', selectedType);
    }
    if (selectedStatus) {
      onApplyFilters('status', selectedStatus);
    }
    setShowModal(false); // Fermer la modale après application des filtres
  };

  const handleCancel = () => {
    console.log('Before setShowModal:', showModal); // Affiche l'ancienne valeur
    setShowModal(false); // Change l'état de showModal à false
  };

  useEffect(() => {
    console.log('Updated showModal:', showModal); // Affiche la nouvelle valeur après rerendu
  }, [showModal]); // Suivi du changement d'état de showModal

  return (
    showModal ? (
        <div className="modal-box">
          <div className="modal-header">
            <h3>Trier</h3>
            <div className='icon-close' onClick={handleCancel}>
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            </div>
          </div>
          <div className="modal-body">
            <div>
              <label htmlFor="type-dropdown">Abonnement :</label>
              <select
                id="type-dropdown"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                aria-label="Type d'abonnement"
              >
                <option value="">-- Sélectionner --</option>
                <option value="basic">Basique</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label htmlFor="status-dropdown">Status :</label>
              <select
                id="status-dropdown"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Status"
              >
                <option value="">-- Sélectionner --</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="pending">En attente</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={handleCancel} aria-label="Annuler">Reset</button>
            <button onClick={handleApplyFilters} aria-label="Appliquer les filtres">Appliquer</button>
          </div>
        </div>
    ) : null
  );
};

export default ModalWithDropdown;
