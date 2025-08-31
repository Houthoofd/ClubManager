import { useEffect, useState } from 'react';
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
import { apiUrl } from '../apiUrl';
import { ModalWithHelp } from '../../components/modal/modalwithhelp';
import { Label } from '@patternfly/react-core';

// Import des types
import type { Article, Categorie } from '@clubmanager/types';

const Magasin = () => {
  const [articlesParCategorie, setArticlesParCategorie] = useState<Record<string, Article[]>>({});
  const [panier, setPanier] = useState<Article[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [selectedTaille, setSelectedTaille] = useState<string | null>(null);
  const [isTailleOpen, setIsTailleOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resArticles, resCategories] = await Promise.all([
          fetch(apiUrl('magasin/articles')),
          fetch(apiUrl('magasin/articles/categories')),
        ]);

        if (!resArticles.ok || !resCategories.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const articlesData: Record<string, Article[]> = await resArticles.json();
        const categoriesData: Categorie[] = await resCategories.json();

        setArticlesParCategorie(articlesData);

        const initExpanded: Record<string, boolean> = {};
        categoriesData.forEach((cat) => {
          initExpanded[cat.nom] = false;
        });
        setExpandedCategories(initExpanded);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les articles ou catégories.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        {loading ? (
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        ) : error ? (
          <Alert variant="danger" title={error} />
        ) : (
          Object.entries(articlesParCategorie).map(([categorie, articles]) => (
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
          ))
        )}
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