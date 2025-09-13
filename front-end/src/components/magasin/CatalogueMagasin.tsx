import React from 'react';
import {
  Gallery,
  GalleryItem,
  PageSection,
  Title,
  ExpandableSection,
  Divider,
  Button,
  Badge,
} from '@patternfly/react-core';
import ArticleCard from '../card';
import type { Article } from '@clubmanager/types';

interface CatalogueMagasinProps {
  articlesParCategorie: Record<string, Article[]>;
  expandedCategories: Record<string, boolean>;
  onToggleCategorie: (nomCategorie: string) => void;
  onAjouterAuPanier: (article: Article, taille: string) => void;
  onOpenInfoModal: (article: Article) => void;
}

const CatalogueMagasin: React.FC<CatalogueMagasinProps> = ({
  articlesParCategorie,
  expandedCategories,
  onToggleCategorie,
  onAjouterAuPanier,
  onOpenInfoModal,
}) => {
  return (
    <PageSection>
      {Object.entries(articlesParCategorie || {}).map(([categorie, articles], idx) => (
        <div key={categorie} style={{ marginBottom: '2rem' }}>
          {idx > 0 && (
            <Divider style={{ margin: '2rem 0', borderTop: '2px solid #dee2e6' }} />
          )}
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Title headingLevel="h2" size="xl" style={{ margin: 0, color: '#495057' }}>
              {categorie}
            </Title>
            <Badge style={{ 
              backgroundColor: '#007bff', 
              color: 'white',
              fontSize: '0.9rem',
              padding: '0.25rem 0.75rem'
            }}>
              {Array.isArray(articles) ? articles.length : 0} article{Array.isArray(articles) && articles.length > 1 ? 's' : ''}
            </Badge>
          </div>
          
          <ExpandableSection
            toggleText={
              expandedCategories[categorie] 
                ? 'Masquer les articles' 
                : 'Voir les articles'
            }
            onToggle={() => onToggleCategorie(categorie)}
            isExpanded={expandedCategories[categorie]}
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '1rem'
            }}
          >
            {Array.isArray(articles) && articles.length > 0 ? (
              <Gallery hasGutter minWidths={{ default: '300px' }} style={{ marginTop: '1rem' }}>
                {articles.map((article: Article) => (
                  <GalleryItem key={article.id}>
                    <div style={{ 
                      background: '#fff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #dee2e6',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease-in-out'
                    }}>
                      <ArticleCard
                        title={article.nom}
                        description={article.description}
                        imageUrl={article.images?.[0] || ''}
                        prix={article.prix}
                        stocks={article.stocks}
                        onAddToCart={(taille: string) => onAjouterAuPanier(article, taille)}
                        onOpenDetails={() => onOpenInfoModal(article)}
                      />
                      <div style={{ 
                        padding: '0.75rem',
                        background: '#f8f9fa',
                        borderTop: '1px solid #dee2e6'
                      }}>
                      </div>
                    </div>
                  </GalleryItem>
                ))}
              </Gallery>
            ) : (
              <div style={{ 
                color: '#6c757d', 
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '2rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                Aucun article dans cette catégorie
              </div>
            )}
          </ExpandableSection>
        </div>
      ))}
    </PageSection>
  );
};

export default CatalogueMagasin;

