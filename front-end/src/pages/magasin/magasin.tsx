import { useState, useEffect } from 'react';
import {
  Gallery,
  GalleryItem,
  PageSection,
  PageSectionVariants,
  Title,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ExpandableSection,
  Divider,
  Spinner,
  Bullseye,
  Alert,
  Select,
  SelectOption,
  SelectList,
} from '@patternfly/react-core';
import ArticleCard from '../../components/card';
import RightSidePanel from '../../components/panel/rightSidePanel';
import { ModalWithHelp } from '../../components/modal/modalwithhelp';
import { Label } from '@patternfly/react-core';
import { useArticlesParCategorie, useCategoriesMagasin } from '../../hooks/useMagasin';

// Import des types
import type { Article } from '@clubmanager/types';

const Magasin = () => {
  const [panier, setPanier] = useState<Article[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [selectedTaille, setSelectedTaille] = useState<string | null>(null);
  const [isTailleOpen, setIsTailleOpen] = useState(false);

  // Utilisation des hooks React Query
  const { data: articlesParCategorie, isLoading: loadingArticles, error: errorArticles } = useArticlesParCategorie();
  const { data: categories, isLoading: loadingCategories, error: errorCategories } = useCategoriesMagasin();

  // Initialiser les catégories comme réduites
  useEffect(() => {
    if (categories) {
      const initExpanded: Record<string, boolean> = {};
      categories.forEach((cat: any) => {
        initExpanded[cat.nom] = false;
      });
      setExpandedCategories(initExpanded);
    }
  }, [categories]);

  const ajouterAuPanier = (article: Article, taille: string) => {
    const nouvelArticle: Article = { ...article, taille, quantite: 1 };
    setPanier((prev) => [...prev, nouvelArticle]);
  };

  const supprimerDuPanier = (index: number) => {
    setPanier((prev) => prev.filter((_, i) => i !== index));
  };

  const changerTailleArticle = (index: number, nouvelleTaille: string) => {
    setPanier((prev) =>
      prev.map((article, i) => (i === index ? { ...article, taille: nouvelleTaille } : article))
    );
  };

  const changerQuantiteArticle = (index: number, quantite: number) => {
    setPanier((prev) =>
      prev.map((article, i) => (i === index ? { ...article, quantite } : article))
    );
  };

  const toggleCategorie = (nomCategorie: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [nomCategorie]: !prev[nomCategorie],
    }));
  };

  // Fonction pour ouvrir la modal d'informations
  const openInfoModal = (article: any) => {
    setSelectedArticle(article);
    setIsInfoModalOpen(true);
  };

  // Fonction pour fermer la modal
  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
    setSelectedArticle(null);
  };

  // Reset la taille sélectionnée à chaque ouverture de modal
  useEffect(() => {
    if (isInfoModalOpen && selectedArticle?.stocks?.length > 0) {
      setSelectedTaille(selectedArticle.stocks[0].taille);
    }
  }, [isInfoModalOpen, selectedArticle]);

  if (loadingArticles || loadingCategories) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (errorArticles || errorCategories) {
    return <Alert variant="danger" title="Erreur lors du chargement des données" />;
  }

  return (
    <RightSidePanel
      isExpanded={isPanelOpen}
      onClose={() => setIsPanelOpen(false)}
      articles={panier}
      onRemoveArticle={supprimerDuPanier}
      onUpdateTaille={changerTailleArticle}
      onUpdateQuantite={changerQuantiteArticle}
    >
      <PageSection variant={PageSectionVariants.default}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Title headingLevel="h1">Magasin</Title>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="secondary" onClick={() => setIsPanelOpen(true)}>
                Voir le panier ({panier.length})
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </PageSection>

      <PageSection>
        {Object.entries(articlesParCategorie || {}).map(([categorie, articles]) => (
          <div key={categorie}>
            <Divider />
            <Title headingLevel="h2" size="xl" style={{ marginTop: '1rem' }}>
              {categorie}
            </Title>
            <ExpandableSection
              toggleText={
                expandedCategories[categorie] ? 'Réduire' : 'Voir les articles'
              }
              onToggle={() => toggleCategorie(categorie)}
              isExpanded={expandedCategories[categorie]}
            >
              {Array.isArray(articles) && articles.length > 0 ? (
                <Gallery hasGutter minWidths={{ default: '300px' }}>
                  {articles.map((article: Article) => (
                    <GalleryItem key={article.id}>
                      <ArticleCard
                        title={article.nom}
                        description={article.description}
                        imageUrl={article.images?.[0] || ''}
                        prix={article.prix}
                        stocks={article.stocks}
                        onAddToCart={(taille: string) => ajouterAuPanier(article, taille)}
                      />
                      <Button variant="secondary" onClick={() => openInfoModal(article)}>
                        Info
                      </Button>
                    </GalleryItem>
                  ))}
                </Gallery>
              ) : (
                <div>Aucun article</div>
              )}
            </ExpandableSection>
          </div>
        ))}
      </PageSection>

      {/* ModalWithHelp pour afficher les infos d'un article */}
      <ModalWithHelp
        isOpen={isInfoModalOpen}
        onClose={closeInfoModal}
        title={selectedArticle?.nom || "Informations sur l'article"}
        footer={
          <>
            <Button variant="primary" onClick={() => {
              if (selectedArticle && selectedTaille) {
                ajouterAuPanier(selectedArticle, selectedTaille);
                closeInfoModal();
              }
            }} isDisabled={!selectedTaille}>
              Ajouter au panier
            </Button>
            <Button variant="link" onClick={closeInfoModal}>
              Annuler
            </Button>
          </>
        }
      >
        {selectedArticle ? (
          <div>
            {selectedArticle.images?.length > 0 && (
              <img
                src={selectedArticle.images[0]}
                alt={selectedArticle.nom}
                style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }}
              />
            )}
            <div><strong>Prix :</strong> {selectedArticle.prix} €</div>
            <div><strong>Description :</strong> {selectedArticle.description || '—'}</div>
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Stocks :</strong>
              <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                {selectedArticle.stocks?.map((stock:any, i:any) => (
                  <li key={i}>
                    Taille <Label color="blue">{stock.taille}</Label> : {stock.quantite}
                  </li>
                ))}
              </ul>
            </div>
            {/* Dropdown pour sélectionner la taille */}
            <div style={{ marginTop: '1rem' }}>
              <strong>Choisir la taille :</strong>
              <Select
                isOpen={isTailleOpen}
                selected={selectedTaille}
                onSelect={(_e, value) => {
                  setSelectedTaille(value as string);
                  setIsTailleOpen(false);
                }}
                onOpenChange={setIsTailleOpen}
                toggle={(toggleRef) => (
                  <Button
                    ref={toggleRef}
                    variant="secondary"
                    onClick={() => setIsTailleOpen(prev => !prev)}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    {selectedTaille || 'Sélectionner une taille'}
                  </Button>
                )}
                shouldFocusToggleOnSelect
              >
                <SelectList>
                  {selectedArticle.stocks?.map((stock:any, i:any) => (
                    <SelectOption key={i} value={stock.taille}>
                      {stock.taille} ({stock.quantite} en stock)
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </div>
          </div>
        ) : (
          <div>Aucun article sélectionné.</div>
        )}
      </ModalWithHelp>
    </RightSidePanel>
  );
};

export default Magasin;