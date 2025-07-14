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
} from '@patternfly/react-core';
import ArticleCard from '../../components/card';
import RightSidePanel from '../../components/panel/rightSidePanel';

// Import des types
import type { Article, Categorie } from '@clubmanager/types';

const Magasin = () => {
  const [articlesParCategorie, setArticlesParCategorie] = useState<Record<string, Article[]>>({});
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [panier, setPanier] = useState<Article[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resArticles, resCategories] = await Promise.all([
          fetch('http://localhost:3000/magasin/articles'),
          fetch('http://localhost:3000/magasin/articles/categories'),
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
    </RightSidePanel>
  );
};

export default Magasin;
