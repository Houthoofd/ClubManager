import { useState, useEffect } from 'react';
import {
  Spinner,
  Alert,
} from '@patternfly/react-core';
import RightSidePanel from '../../components/common/panel/rightSidePanel';
import { useArticlesParCategorie, useCategoriesMagasin } from '../../hooks/useMagasin';
import ToolbarMagasin from '../../components/magasin/ToolbarMagasin';
import CatalogueMagasin from '../../components/magasin/CatalogueMagasin';
import DetailArticleModal from '../../components/magasin/DetailArticleModal';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { 
  ajouterArticle, 
  supprimerArticle, 
  modifierTaille, 
  modifierQuantite, 
  fermerPanier 
} from '../../redux/slices/panierSlice';
import React from 'react';
import { PageSection } from '@patternfly/react-core';
import { PageHeader } from '../../components/common/PageHeader';

// Import des types
import type { Article } from '@clubmanager/types';

const MagasinPage: React.FC = () => {
  const dispatch = useDispatch();
  const panier = useSelector((state: RootState) => state.panier.articles);
  const isPanelOpen = useSelector((state: RootState) => state.panier.isOpen);
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
    dispatch(ajouterArticle(nouvelArticle));
  };

  const supprimerDuPanier = (index: number) => {
    dispatch(supprimerArticle(index));
  };

  const changerTailleArticle = (index: number, nouvelleTaille: string) => {
    dispatch(modifierTaille({ index, taille: nouvelleTaille }));
  };

  const changerQuantiteArticle = (index: number, quantite: number) => {
    dispatch(modifierQuantite({ index, quantite }));
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
      <div className="store-page">
        <PageHeader
          title="Magasin"
          subtitle="Gérez votre inventaire et vos produits"
          variant="store"
        />
        <PageSection className="store-content">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh' 
          }}>
            <Spinner size="xl" />
          </div>
        </PageSection>
      </div>
    );
  }

  if (errorArticles || errorCategories) {
    return (
      <div className="store-page">
        <PageHeader
          title="Magasin"
          subtitle="Gérez votre inventaire et vos produits"
          variant="store"
        />
        <PageSection className="store-content">
          <Alert 
            variant="danger" 
            title="Erreur lors du chargement des données"
            style={{ borderRadius: '8px' }}
          />
        </PageSection>
      </div>
    );
  }

  return (
    <div className="store-page">
      <PageHeader
        title="Magasin"
        subtitle="Gérez votre inventaire et vos produits"
        variant="store"
      />

      <PageSection className="store-content">
        <RightSidePanel
          isExpanded={isPanelOpen}
          onClose={() => dispatch(fermerPanier())}
          articles={panier}
          onRemoveArticle={supprimerDuPanier}
          onUpdateTaille={changerTailleArticle}
          onUpdateQuantite={changerQuantiteArticle}
        >
          <div className="main-content-scrollable">
            <CatalogueMagasin
              articlesParCategorie={articlesParCategorie}
              expandedCategories={expandedCategories}
              onToggleCategorie={toggleCategorie}
              onAjouterAuPanier={ajouterAuPanier}
              onOpenInfoModal={openInfoModal}
            />
          </div>
        </RightSidePanel>

        <DetailArticleModal
          isOpen={isInfoModalOpen}
          selectedArticle={selectedArticle}
          selectedTaille={selectedTaille}
          isTailleOpen={isTailleOpen}
          onClose={closeInfoModal}
          onTailleSelect={setSelectedTaille}
          onTailleToggle={setIsTailleOpen}
          onAjouterAuPanier={() => {
            if (selectedArticle && selectedTaille) {
              ajouterAuPanier(selectedArticle, selectedTaille);
              closeInfoModal();
            }
          }}
        />
      </PageSection>
    </div>
  );
};

export default MagasinPage;