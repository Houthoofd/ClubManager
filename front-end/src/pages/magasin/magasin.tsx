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
import ModalWithHelp from '../../components/modal';
import { Popover, Label } from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';

// Import des types
import type { Article, Categorie } from '@clubmanager/types';

const Magasin = () => {
  const [articlesParCategorie, setArticlesParCategorie] = useState<Record<string, Article>>({});
  const [categories, setCategories] = useState<Categorie[]>([]);
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
        setCategories(categoriesData);

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
          categories.map((categorie) => {
            const articles = articlesParCategorie[categorie.nom] || [];

            return (
              <div key={categorie.id}>
                <Divider />
                <Title headingLevel="h2" size="xl" style={{ marginTop: '1rem' }}>
                  {categorie.nom}
                </Title>
                <ExpandableSection
                  toggleText={
                    expandedCategories[categorie.nom] ? 'Réduire' : 'Voir les articles'
                  }
                  onToggle={() => toggleCategorie(categorie.nom)}
                  isExpanded={expandedCategories[categorie.nom]}
                >
                  {articles.length > 0 ? (
                    <Gallery hasGutter minWidths={{ default: '300px' }}>
                      {articles.map((article) => (
                        <GalleryItem key={article.id}>
                          <ArticleCard
                            title={article.nom}
                            description={article.description}
                            imageUrl={article.images[0]}
                            prix={article.prix}
                            stocks={article.stocks}
                            onAddToCart={(taille) => ajouterAuPanier(article, taille)}
                            extraActions={
                              <Button variant="info" onClick={() => openInfoModal(article)}>
                                Plus d'informations
                              </Button>
                            }
                          />
                        </GalleryItem>
                      ))}
                    </Gallery>
                  ) : (
                    <p>Aucun article dans cette catégorie.</p>
                  )}
                </ExpandableSection>
              </div>
            );
          })
        )}
      </PageSection>

      {/* ModalWithHelp pour afficher les infos d'un article */}
      <ModalWithHelp
        isOpen={isInfoModalOpen}
        onClose={closeInfoModal}
        title={selectedArticle?.nom || "Informations sur l'article"}
        help={
          <Popover
            headerContent={<div>Help Popover</div>}
            bodyContent={
              <div>
                Affiche toutes les informations détaillées sur l'article sélectionné.
              </div>
            }
            footerContent="Popover Footer"
          >
            <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
          </Popover>
        }
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