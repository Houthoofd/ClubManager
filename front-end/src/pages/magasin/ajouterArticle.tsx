import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  PageSection,
  Spinner,
} from '@patternfly/react-core';
import {
  useArticlesParCategorie,
  useCategoriesMagasin,
  useAjouterArticleMagasin,
  useModifierArticleMagasin,
  useSupprimerArticleMagasin,
  useTaillesMagasin
} from '../../hooks/useMagasin';
import { useCheckArticleByNomAndCategorie } from '../../hooks/useVerification';
import FormulaireArticle from '../../components/magasin/FormulaireArticle';
import ListeArticles from '../../components/magasin/ListeArticles';
import ModalsArticle from '../../components/common/modal/ModalsArticle';
import { PageHeader } from '../../components/common/PageHeader';

const AjouterArticlePage: React.FC = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('0');
  const [stocks, setStocks] = useState([{ taille: 'S', quantite: 0 }]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [articleEnEdition, setArticleEnEdition] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState<React.FormEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{ [catId: string]: boolean }>({});

  // Hooks React Query
  const { data: articles, isLoading: loadingArticles } = useArticlesParCategorie();
  const { data: categories, isLoading: loadingCategories } = useCategoriesMagasin();
  const { data: tailles, isLoading: loadingTailles } = useTaillesMagasin();
  const ajouterArticle = useAjouterArticleMagasin();
  const modifierArticle = useModifierArticleMagasin();
  const supprimerArticle = useSupprimerArticleMagasin();
  const checkArticleByNomAndCategorie = useCheckArticleByNomAndCategorie();

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(Number(tabIndex));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingSubmitEvent(e);
    setShowConfirmModal(true);
  };

  const handleConfirmAdd = async () => {
    setShowConfirmModal(false);
    if (!pendingSubmitEvent) return;

    setErrorMessage(null);

    if (!articleEnEdition) {
      try {
        const exists = await checkArticleByNomAndCategorie(nom, categorieId);
        if (exists) {
          setErrorMessage("Un article avec ce nom existe déjà dans cette catégorie.");
          setPendingSubmitEvent(null);
          return;
        }
      } catch (err) {
        setErrorMessage("Erreur lors de la vérification de l'article.");
        setPendingSubmitEvent(null);
        return;
      }
    }

    const articlePayload = {
      nom,
      description,
      prix,
      categorie_id: categorieId,
      images: imageUrls,
      stocks
    };

    try {
      if (articleEnEdition) {
        await modifierArticle.mutateAsync({ id: articleEnEdition.id, article: articlePayload });
        setSuccessMessage("L'article a bien été modifié.");
      } else {
        await ajouterArticle.mutateAsync(articlePayload);
        setSuccessMessage("L'article a bien été ajouté.");
      }
      resetForm();
    } catch (error) {
      setErrorMessage('Erreur lors de la soumission de l\'article.');
    }
    setPendingSubmitEvent(null);
  };

  const handleSupprimerArticle = async (id: number) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await supprimerArticle.mutateAsync(id);
      setSuccessMessage("L'article a bien été supprimé.");
    } catch (error) {
      setErrorMessage('Erreur lors de la suppression de l\'article.');
    }
  };

  const resetForm = () => {
    setNom('');
    setDescription('');
    setPrix('0');
    setCategorieId(null);
    setStocks([{ taille: 'S', quantite: 0 }]);
    setImageUrls([]);
    setArticleEnEdition(null);
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const articlesParCategorie = React.useMemo(() => {
    if (!articles || !categories) return [];
    if (!Array.isArray(articles)) {
      return categories.map(categorie => ({
        ...categorie,
        articles: articles[categorie.nom] || []
      }));
    }
    return categories.map(categorie => ({
      ...categorie,
      articles: articles.filter((a: any) => String(a.categorie_id) === String(categorie.id))
    }));
  }, [articles, categories]);

  const taillesDisponibles = tailles?.map((t: any) => t.nom) || [];

  React.useEffect(() => {
    if (articleEnEdition) {
      setNom(articleEnEdition.nom ?? '');
      setDescription(articleEnEdition.description ?? '');
      setPrix(articleEnEdition.prix !== undefined ? String(articleEnEdition.prix) : '0');
      setCategorieId(articleEnEdition.categorie_id !== undefined ? String(articleEnEdition.categorie_id) : null);
      setStocks(articleEnEdition.stocks ?? [{ taille: 'S', quantite: 0 }]);
      setImageUrls(articleEnEdition.images ?? []);
      setActiveTabKey(0);
    }
  }, [articleEnEdition]);

  if (loadingArticles || loadingCategories || loadingTailles) {
    return (
      <div className="store-page">
        <PageHeader
          title="Ajouter un article"
          subtitle="Ajoutez un nouvel article à votre inventaire"
          variant="store"
        />
        <PageSection className="store-content">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <Spinner size="xl" />
          </div>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="store-page">
      <PageHeader
        title="Ajouter un article"
        subtitle="Ajoutez un nouvel article à votre inventaire"
        variant="store"
      />

      <PageSection className="store-content">
        <Tabs 
          activeKey={activeTabKey} 
          onSelect={handleTabClick}
          className="modern-tabs"
        >
          <Tab 
            eventKey={0} 
            title={
              <TabTitleText>
                <span>Ajouter un article</span>
              </TabTitleText>
            }
          >
            <FormulaireArticle
              nom={nom}
              description={description}
              prix={prix}
              categorieId={categorieId}
              stocks={stocks}
              imageUrls={imageUrls}
              categories={categories || []}
              taillesDisponibles={taillesDisponibles}
              articleEnEdition={articleEnEdition}
              onNomChange={setNom}
              onDescriptionChange={setDescription}
              onPrixChange={setPrix}
              onCategorieChange={setCategorieId}
              onStocksChange={setStocks}
              onImageUrlsChange={setImageUrls}
              onSubmit={handleSubmit}
            />
          </Tab>
          
          <Tab 
            eventKey={1} 
            title={
              <TabTitleText>
                <span>Voir les articles</span>
              </TabTitleText>
            }
          >
            <ListeArticles
              articlesParCategorie={articlesParCategorie}
              expandedCategories={expandedCategories}
              onToggleCategory={toggleCategory}
              onSelectArticle={setSelectedArticle}
              onEditArticle={setArticleEnEdition}
              onDeleteArticle={handleSupprimerArticle}
            />
          </Tab>
        </Tabs>

        <ModalsArticle
          selectedArticle={selectedArticle}
          categories={categories || []}
          onCloseDetailsModal={() => setSelectedArticle(null)}
          onEditFromModal={setArticleEnEdition}
          onDeleteFromModal={handleSupprimerArticle}
          showConfirmModal={showConfirmModal}
          articleEnEdition={articleEnEdition}
          nom={nom}
          description={description}
          prix={prix}
          categorieId={categorieId}
          stocks={stocks}
          onCloseConfirmModal={() => setShowConfirmModal(false)}
          onConfirmAction={handleConfirmAdd}
          successMessage={successMessage}
          errorMessage={errorMessage}
          onCloseMessageModal={() => {
            setSuccessMessage(null);
            setErrorMessage(null);
          }}
        />
      </PageSection>
    </div>
  );
};

export default AjouterArticlePage;