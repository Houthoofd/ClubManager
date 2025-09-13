import React from 'react';
import {
  Button,
  Select,
  SelectOption,
  SelectList,
  Label,
} from '@patternfly/react-core';
import { ModalWithHelp } from '../common/modal/modalwithhelp';

interface DetailArticleModalProps {
  isOpen: boolean;
  selectedArticle: any;
  selectedTaille: string | null;
  isTailleOpen: boolean;
  onClose: () => void;
  onTailleSelect: (taille: string) => void;
  onTailleToggle: (isOpen: boolean) => void;
  onAjouterAuPanier: () => void;
}

const DetailArticleModal: React.FC<DetailArticleModalProps> = ({
  isOpen,
  selectedArticle,
  selectedTaille,
  isTailleOpen,
  onClose,
  onTailleSelect,
  onTailleToggle,
  onAjouterAuPanier,
}) => {
  return (
    <ModalWithHelp
      isOpen={isOpen}
      onClose={onClose}
      title={selectedArticle?.nom || "Informations sur l'article"}
      footer={
        <>
          <Button 
            variant="primary" 
            onClick={onAjouterAuPanier}
            isDisabled={!selectedTaille}
            size="lg"
            style={{ padding: '0.75rem 2rem' }}
          >
            Ajouter au panier
          </Button>
          <Button variant="link" onClick={onClose}>
            Annuler
          </Button>
        </>
      }
    >
      {selectedArticle ? (
        <div style={{ lineHeight: '1.6' }}>
          {selectedArticle.images?.length > 0 && (
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <img
                src={selectedArticle.images[0]}
                alt={selectedArticle.nom}
                style={{ 
                  width: '100%', 
                  maxHeight: '300px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}
              />
            </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Prix :</strong> 
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#495057',
              marginLeft: '0.5rem'
            }}>
              {selectedArticle.prix} €
            </span>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Description :</strong>
            <div style={{ 
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              color: '#495057'
            }}>
              {selectedArticle.description || 'Aucune description disponible'}
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <strong>Stock disponible :</strong>
            <div style={{ 
              marginTop: '0.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {selectedArticle.stocks?.map((stock: any, i: any) => (
                <div
                  key={i}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: stock.quantite > 0 ? '#e8f5e8' : '#ffebee',
                    color: stock.quantite > 0 ? '#2e7d32' : '#c62828',
                    borderRadius: '6px',
                    border: `1px solid ${stock.quantite > 0 ? '#4caf50' : '#f44336'}`,
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  Taille {stock.taille} : {stock.quantite} en stock
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ 
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <strong style={{ color: '#495057' }}>Choisir la taille :</strong>
            <Select
              isOpen={isTailleOpen}
              selected={selectedTaille}
              onSelect={(_e, value) => {
                onTailleSelect(value as string);
                onTailleToggle(false);
              }}
              onOpenChange={onTailleToggle}
              toggle={(toggleRef) => (
                <Button
                  ref={toggleRef}
                  variant="secondary"
                  onClick={() => onTailleToggle(!isTailleOpen)}
                  style={{ 
                    width: '100%', 
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '6px'
                  }}
                >
                  {selectedTaille || 'Sélectionner une taille'}
                </Button>
              )}
              shouldFocusToggleOnSelect
            >
              <SelectList>
                {selectedArticle.stocks
                  ?.filter((stock: any) => stock.quantite > 0)
                  ?.map((stock: any, i: any) => (
                    <SelectOption key={i} value={stock.taille}>
                      Taille {stock.taille} ({stock.quantite} en stock)
                    </SelectOption>
                  ))}
              </SelectList>
            </Select>
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center',
          padding: '2rem',
          color: '#6c757d',
          fontStyle: 'italic'
        }}>
          Aucun article sélectionné.
        </div>
      )}
    </ModalWithHelp>
  );
};

export default DetailArticleModal;
