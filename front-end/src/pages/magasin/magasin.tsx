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
  ToolbarItem
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
  taille?: string;
  quantite?: number;
};

const Magasin = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [panier, setPanier] = useState<Article[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/magasin/articles')
      .then((res) => res.json())
      .then((data) => setArticles(data))
      .catch((err) => console.error('Erreur de chargement des articles :', err));
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
      </PageSection>
    </RightSidePanel>
  );
};

export default Magasin;
