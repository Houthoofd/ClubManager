import React, { useState } from 'react';
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
    setShowModal(false); // Fermer la modale sans appliquer de filtres
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false); // Fermer la modale si on clique en dehors
    }
  };

  return (
    showModal ? (
        <div className="modal-box" onClick={handleOverlayClick}>
          <div className="modal-header">
            <h3>Trier par...</h3>
          </div>
          <div className="modal-body">
            <div>
              <label htmlFor="type-dropdown">Type d'abonnement :</label>
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
