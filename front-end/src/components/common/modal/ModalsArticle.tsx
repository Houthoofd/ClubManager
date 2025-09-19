import React from 'react';
import { Button } from '@patternfly/react-core';
import ModalWithHelp from './modalwithhelp';
import { EditIcon, TrashIcon, CheckIcon } from '@patternfly/react-icons';

interface ModalsArticleProps {
  // Modal détails article
  selectedArticle: any;
  categories: any[];
  onCloseDetailsModal: () => void;
  onEditFromModal: (article: any) => void;
  onDeleteFromModal: (id: number) => void;

  // Modal confirmation
  showConfirmModal: boolean;
  articleEnEdition: any;
  nom: string;
  description: string;
  prix: string;
  categorieId: string | null;
  stocks: Array<{ taille: string; quantite: number }>;
  onCloseConfirmModal: () => void;
  onConfirmAction: () => void;

  // Modal messages
  successMessage: string | null;
  errorMessage: string | null;
  onCloseMessageModal: () => void;
}

const ModalsArticle: React.FC<ModalsArticleProps> = ({
  selectedArticle,
  categories,
  onCloseDetailsModal,
  onEditFromModal,
  onDeleteFromModal,
  showConfirmModal,
  articleEnEdition,
  nom,
  description,
  prix,
  categorieId,
  stocks,
  onCloseConfirmModal,
  onConfirmAction,
  successMessage,
  errorMessage,
  onCloseMessageModal,
}) => {
  return (
    <>
      {/* Modal détails article */}
      <ModalWithHelp
        isOpen={!!selectedArticle}
        title={selectedArticle?.nom || ''}
        description={
          selectedArticle && (
            <div style={{ lineHeight: '1.6' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Description :</strong> 
                <div style={{ marginTop: '0.25rem', color: '#6c757d' }}>
                  {selectedArticle.description || 'Aucune description'}
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong>Prix :</strong> 
                <span style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  color: '#007bff',
                  marginLeft: '0.5rem'
                }}>
                  {selectedArticle.prix} €
                </span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong>Catégorie :</strong> 
                <span style={{ marginLeft: '0.5rem' }}>
                  {categories?.find(c => String(c.id) === String(selectedArticle.categorie_id))?.nom || 'Non définie'}
                </span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong>Stock par taille :</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {selectedArticle.stocks?.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedArticle.stocks.map((s: any, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: s.quantite > 0 ? '#e8f5e8' : '#ffebee',
                            color: s.quantite > 0 ? '#2e7d32' : '#c62828',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {s.taille}: {s.quantite}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Aucun stock défini</span>
                  )}
                </div>
              </div>
              
              <div>
                <strong>Images :</strong>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedArticle.images?.length ? (
                    selectedArticle.images.map((img: string, idx: number) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Image ${idx + 1}`} 
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          objectFit: 'cover', 
                          borderRadius: '6px',
                          border: '1px solid #dee2e6'
                        }} 
                      />
                    ))
                  ) : (
                    <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Aucune image</span>
                  )}
                </div>
              </div>
            </div>
          )
        }
        onClose={onCloseDetailsModal}
        footer={
          selectedArticle && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  onEditFromModal(selectedArticle);
                  onCloseDetailsModal();
                }}
                icon={<EditIcon />}
              >
                Modifier
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  onDeleteFromModal(selectedArticle.id);
                  onCloseDetailsModal();
                }}
                icon={<TrashIcon />}
              >
                Supprimer
              </Button>
              <Button variant="link" onClick={onCloseDetailsModal}>
                Fermer
              </Button>
            </div>
          )
        }
      />

      {/* Modal de confirmation */}
      <ModalWithHelp
        isOpen={showConfirmModal}
        title="Confirmation"
        description={
          articleEnEdition ? (
            <div>
              <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                Vous allez appliquer les modifications suivantes :
              </p>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                <div><strong>Nom :</strong> {nom}</div>
                <div><strong>Description :</strong> {description || 'Aucune'}</div>
                <div><strong>Prix :</strong> {prix} €</div>
                <div><strong>Catégorie :</strong> {categories?.find(c => String(c.id) === String(categorieId))?.nom || 'Non définie'}</div>
                <div><strong>Stock :</strong> {stocks.map(s => `${s.taille}(${s.quantite})`).join(', ')}</div>
              </div>
              <p style={{ fontStyle: 'italic', color: '#666' }}>
                Êtes-vous sûr de vouloir appliquer ces changements ?
              </p>
            </div>
          ) : (
            <div>
              <p>Êtes-vous sûr de vouloir ajouter cet article ?</p>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '6px',
                marginTop: '1rem'
              }}>
                <div><strong>{nom}</strong> - {prix} €</div>
              </div>
            </div>
          )
        }
        onClose={onCloseConfirmModal}
        onConfirm={onConfirmAction}
        confirmText="Confirmer"
        cancelText="Annuler"
      />

      {/* Modal de message (succès/erreur) */}
      <ModalWithHelp
        isOpen={!!(successMessage || errorMessage)}
        title={successMessage ? "Succès" : "Erreur"}
        description={
          <div style={{ 
            padding: '1rem',
            textAlign: 'center'
          }}>
            {successMessage ? (
              <div style={{ color: '#28a745', fontSize: '1.1rem' }}>
                <CheckIcon style={{ marginRight: '0.5rem' }} />
                {successMessage}
              </div>
            ) : errorMessage ? (
              <div style={{ color: '#dc3545', fontSize: '1.1rem' }}>
                {errorMessage}
              </div>
            ) : null}
          </div>
        }
        onClose={onCloseMessageModal}
        confirmText="OK"
      />
    </>
  );
};

export default ModalsArticle;
