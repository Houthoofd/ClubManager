import React from 'react';
import {
  Gallery,
  GalleryItem,
  ExpandableSection,
  Title,
  Badge,
  Button,
} from '@patternfly/react-core';
import { EditIcon, TrashIcon } from '@patternfly/react-icons';
import ArticleCard from '../card';

interface Article {
  id: number;
  nom: string;
  description: string;
  prix: number;
  images?: string[];
  stocks?: Array<{ taille: string; quantite: number }>;
}

interface CategorieAvecArticles {
  id: string;
  nom: string;
  articles: Article[];
}

interface ListeArticlesProps {
  articlesParCategorie: CategorieAvecArticles[];
  expandedCategories: { [catId: string]: boolean };
  onToggleCategory: (catId: string) => void;
  onSelectArticle: (article: Article) => void;
  onEditArticle: (article: Article) => void;
  onDeleteArticle: (id: number) => void;
}

const ListeArticles: React.FC<ListeArticlesProps> = ({
  articlesParCategorie,
  expandedCategories,
  onToggleCategory,
  onSelectArticle,
  onEditArticle,
  onDeleteArticle,
}) => {
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

  return (
    <div style={{ 
      background: '#fff', 
      padding: '1.5rem', 
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      marginTop: '1rem'
    }}>
      <Title headingLevel="h3" style={{ marginBottom: '1.5rem', color: '#333' }}>
        Catalogue des articles
      </Title>
      
      {articlesParCategorie.map((categorie, idx) => (
        <React.Fragment key={categorie.id}>
          {idx > 0 && (
            <hr style={{ 
              margin: '2rem 0', 
              border: 0, 
              borderTop: '2px solid #dee2e6',
              borderRadius: '1px'
            }} />
          )}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              <Title headingLevel="h4" size="lg" style={{ margin: 0, color: '#495057' }}>
                {categorie.nom}
              </Title>
              <Badge style={{ 
                backgroundColor: '#007bff', 
                color: 'white',
                fontSize: '0.8rem',
                padding: '0.25rem 0.5rem'
              }}>
                {categorie.articles.length} article{categorie.articles.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            <ExpandableSection
              toggleText={expandedCategories[categorie.id] ? "Masquer les articles" : "Afficher les articles"}
              onToggle={() => onToggleCategory(categorie.id)}
              isExpanded={!!expandedCategories[categorie.id]}
              style={{ marginTop: '0.5rem' }}
            >
              {categorie.articles.length > 0 ? (
                <Gallery hasGutter minWidths={{ default: '280px' }} style={{ marginTop: '1rem' }}>
                  {categorie.articles.map(article => (
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
                          stocks={deduplicateStocks(article.stocks || [])}
                          onAddToCart={() => {}}
                          onOpenDetails={() => onSelectArticle(article)}
                        />
                        
                        <div style={{ 
                          padding: '0.75rem',
                          background: '#f8f9fa',
                          borderTop: '1px solid #dee2e6'
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onEditArticle(article)}
                              style={{ flex: 1 }}
                              icon={<EditIcon />}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => onDeleteArticle(article.id)}
                              style={{ flex: 1 }}
                              icon={<TrashIcon />}
                            >
                              Supprimer
                            </Button>
                          </div>
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
                  border: '1px solid #dee2e6',
                  marginTop: '1rem'
                }}>
                  Aucun article dans cette catégorie
                </div>
              )}
            </ExpandableSection>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ListeArticles;