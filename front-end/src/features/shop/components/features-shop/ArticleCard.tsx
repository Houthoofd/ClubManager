import React, { useState } from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Button,
} from '@patternfly/react-core';

type Stock = {
  taille: string;
  quantite: number;
};

type ArticleCardProps = {
  title: string;
  description: string;
  imageUrl: string;
  prix: number;
  stocks: Stock[];
  onAddToCart: (taille: string) => void;
  onOpenDetails?: () => void;
};

const ArticleCard: React.FC<ArticleCardProps> = ({
  title,
  description,
  imageUrl,
  prix,
  stocks,
  onAddToCart,
  onOpenDetails,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickAddToCart = () => {
    // Ajouter automatiquement la première taille disponible
    const firstAvailableSize = stocks.find(stock => stock.quantite > 0)?.taille;
    if (firstAvailableSize) {
      onAddToCart(firstAvailableSize);
    }
  };

  // Fonction pour dédupliquer les stocks par taille
  const deduplicateStocks = (stocks: Array<{ taille: string; quantite: number }>) => {
    return stocks?.reduce((acc: any[], stock: any) => {
      const existingStock = acc.find(s => s.taille === stock.taille);
      if (existingStock) {
        existingStock.quantite += stock.quantite;
      } else {
        acc.push({ taille: stock.taille, quantite: stock.quantite });
      }
      return acc;
    }, []) || [];
  };

  const uniqueStocks = deduplicateStocks(stocks);

  return (
    <>
      <Card className="article-card" isHoverable>
        <div style={{ position: 'relative' }}>
          <img
            src={imageUrl}
            alt={title}
            className="article-card-image"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
          <div className="article-card-price-badge">
            {prix} €
          </div>
        </div>
        
        <CardTitle className="article-card-title">
          {title}
        </CardTitle>
        
        <CardBody style={{ padding: '0 1rem 1rem' }}>
          <p className="article-card-description">
            {description || 'Aucune description disponible'}
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <div className="form-section-title">
              Tailles disponibles :
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {uniqueStocks
                .filter(stock => stock.quantite > 0)
                .map((stock, index) => (
                  <span
                    key={index}
                    className="article-card-size-badge"
                  >
                    {stock.taille}
                  </span>
                ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              variant="primary" 
              onClick={handleQuickAddToCart}
              className="article-card-button"
              style={{ flex: 1 }}
              isDisabled={stocks.filter(s => s.quantite > 0).length === 0}
            >
              {stocks.filter(s => s.quantite > 0).length === 0 ? 'Rupture de stock' : 'Ajouter'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={onOpenDetails}
              className="article-card-button"
              style={{ minWidth: '100px' }}
              isDisabled={stocks.filter(s => s.quantite > 0).length === 0}
            >
              Détails
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* <Modal
        title="Sélectionner une taille"
        variant="medium"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="modern-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src={imageUrl}
            alt={title}
            className="modal-article-image"
          />
        </div>
        
        {/* ...existing code... */}
      {/* </Modal> */}
    </>
  );
};

export default ArticleCard;


