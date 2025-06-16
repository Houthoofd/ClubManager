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

type Stock = {
  taille: string;
  quantite: number;
};

type Article = {
  id: number;
  nom: string;
  description: string;
  prix: number;
  images: string[];
  stocks: Stock[];
  categorie_id: number;
  // taille et quantite sont optionnels pour le panier
  taille?: string;
  quantite?: number;
};

type Categorie = {
  id: number;
  nom: string;
};

const Magasin = () => {
  // articles devient un objet où clé = nom catégorie, valeur = array d'articles
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

        // Ici on récupère l'objet avec les clés catégories
        const articlesData: Record<string, Article[]> = await resArticles.json();
        const categoriesData: Categorie[] = await resCategories.json();

        setArticlesParCategorie(articlesData);
        setCategories(categoriesData);

        // Initialise l'état d'expansion avec toutes les catégories à false
        const initExpanded: Record<string, boolean> = {};
        Object.keys(articlesData).forEach((cat) => {
          initExpanded[cat] = false;
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
    const nouvelArticle = { ...article, taille, quantite: 1 };
    setPanier((prev) => [...prev, nouvelArticle]);
  };

  const supprimerDuPanier = (index: number) => {
    const copie = [...panier];
    copie.splice(index, 1);
    setPanier(copie);
  };

  const changerTailleArticle = (index: number, nouvelleTaille: string) => {
    const copie = [...panier];
    copie[index].taille = nouvelleTaille;
    setPanier(copie);
  };

  const changerQuantiteArticle = (index: number, quantite: number) => {
    const copie = [...panier];
    copie[index].quantite = quantite;
    setPanier(copie);
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
          Object.entries(articlesParCategorie).map(([nomCategorie, articles]) => (
            <div key={nomCategorie}>
              <Divider />
              <Title headingLevel="h2" size="xl" style={{ marginTop: '1rem' }}>
                {nomCategorie}
              </Title>
              <ExpandableSection
                toggleText={expandedCategories[nomCategorie] ? 'Réduire' : 'Voir les articles'}
                onToggle={() => toggleCategorie(nomCategorie)}
                isExpanded={expandedCategories[nomCategorie]}
              >
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
              </ExpandableSection>
            </div>
          ))
        )}
      </PageSection>
    </RightSidePanel>
  );
};

export default Magasin;
