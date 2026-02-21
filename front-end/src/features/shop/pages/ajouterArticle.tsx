import React, { useState } from "react";
import { Tabs, Tab, TabTitleText, PageSection, Spinner } from "@patternfly/react-core";
import {
  useArticlesParCategorie,
  useCategoriesMagasin,
  useAjouterArticleMagasin,
  useModifierArticleMagasin,
  useSupprimerArticleMagasin,
  useTaillesMagasin,
} from "../hooks/useMagasin";
import { useCheckArticleByNomAndCategorie } from "@/features/auth/hooks/useVerification";
import { FormulaireArticle, ListeArticles, DetailArticleModal } from "../components";
import ModalsArticle from "@/shared/components/common-legacy/modal/ModalsArticle";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import ResultModal from "@/shared/components/common-legacy/modal/ResultModal";
import ConfirmModal from "@/shared/components/common-legacy/modal/ConfirmModal";
import ResumeConfirmModal from "@/shared/components/common-legacy/modal/ResumeConfirmModal";
import RightSidePanel from "@/shared/components/common-legacy/panel/rightSidePanel";

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

const AjouterArticlePage: React.FC = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("0");
  const [stocks, setStocks] = useState([{ taille: "S", quantite: 0 }]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [articleEnEdition, setArticleEnEdition] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState("");
  const [resultModalSuccess, setResultModalSuccess] = useState(false);
  const [modificationsResume, setModificationsResume] = useState<ModificationItem[]>([]);
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState<React.FormEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{
    [catId: string]: boolean;
  }>({});

  // Ajouter les états pour la modal de confirmation de suppression
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<any | null>(null);

  // Ajouter les états pour la modal de détails
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailArticle, setSelectedDetailArticle] = useState<any | null>(null);
  const [selectedTaille, setSelectedTaille] = useState<string | null>(null);
  const [isTailleOpen, setIsTailleOpen] = useState(false);

  // Ajouter l'état pour gérer le panier
  const [panierArticles, setPanierArticles] = useState<any[]>([]);
  // Ajouter un état pour contrôler l'affichage du panier
  const [showPanier, setShowPanier] = useState(false);

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

  // Fonction pour formater les modifications d'article
  const formatModifications = (): ModificationItem[] => {
    const modifications: ModificationItem[] = [];

    if (articleEnEdition) {
      if (nom !== articleEnEdition.nom) {
        modifications.push({
          field: "Nom",
          oldValue: articleEnEdition.nom || "Non défini",
          newValue: nom,
        });
      }

      if (description !== articleEnEdition.description) {
        modifications.push({
          field: "Description",
          oldValue: articleEnEdition.description || "Non défini",
          newValue: description,
        });
      }

      if (prix !== String(articleEnEdition.prix || 0)) {
        modifications.push({
          field: "Prix",
          oldValue: `${articleEnEdition.prix || 0}€`,
          newValue: `${prix}€`,
        });
      }

      if (categorieId !== String(articleEnEdition.categorie_id || "")) {
        const oldCategorie = categories?.find(
          (c) => String(c.id) === String(articleEnEdition.categorie_id),
        );
        const newCategorie = categories?.find((c) => String(c.id) === categorieId);

        modifications.push({
          field: "Catégorie",
          oldValue: oldCategorie?.nom || "Non défini",
          newValue: newCategorie?.nom || "Non défini",
        });
      }

      // Vérifier les changements d'images
      const originalImages = articleEnEdition.images || [];
      const filteredImages = imageUrls.filter((url) => url && url.trim() !== "");

      if (JSON.stringify(originalImages.sort()) !== JSON.stringify(filteredImages.sort())) {
        modifications.push({
          field: "Images",
          oldValue:
            originalImages.length > 0 ? `${originalImages.length} image(s)` : "Aucune image",
          newValue:
            filteredImages.length > 0 ? `${filteredImages.length} image(s)` : "Aucune image",
        });
      }

      // Vérifier les changements de stocks
      const originalStocks = articleEnEdition.stocks || [];
      const filteredStocks = stocks.filter((stock) => stock.quantite > 0);

      if (JSON.stringify(originalStocks) !== JSON.stringify(filteredStocks)) {
        const originalStockText =
          originalStocks.length > 0
            ? originalStocks.map((s) => `${s.taille}: ${s.quantite}`).join(", ")
            : "Aucun stock";
        const newStockText =
          filteredStocks.length > 0
            ? filteredStocks.map((s) => `${s.taille}: ${s.quantite}`).join(", ")
            : "Aucun stock";

        modifications.push({
          field: "Stocks",
          oldValue: originalStockText,
          newValue: newStockText,
        });
      }
    } else {
      // Pour un nouvel article, afficher les informations principales
      modifications.push({
        field: "Nom",
        oldValue: "Nouvel article",
        newValue: nom,
      });

      if (categorieId) {
        const categorie = categories?.find((c) => String(c.id) === categorieId);
        modifications.push({
          field: "Catégorie",
          oldValue: "Nouvel article",
          newValue: categorie?.nom || "Non défini",
        });
      }

      modifications.push({
        field: "Prix",
        oldValue: "Nouvel article",
        newValue: `${prix}€`,
      });

      // Afficher les images pour un nouvel article
      const filteredImages = imageUrls.filter((url) => url && url.trim() !== "");
      if (filteredImages.length > 0) {
        modifications.push({
          field: "Images",
          oldValue: "Nouvel article",
          newValue: `${filteredImages.length} image(s) ajoutée(s)`,
        });
      }

      // Afficher les stocks pour un nouvel article
      const filteredStocks = stocks.filter((stock) => stock.quantite > 0);
      if (filteredStocks.length > 0) {
        const stockText = filteredStocks.map((s) => `${s.taille}: ${s.quantite}`).join(", ");
        modifications.push({
          field: "Stocks",
          oldValue: "Nouvel article",
          newValue: stockText,
        });
      }
    }

    return modifications;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const modifications = formatModifications();
    setModificationsResume(modifications);
    setShowConfirmModal(true);
  };

  const confirmerAjout = async () => {
    setShowConfirmModal(false);

    try {
      if (!articleEnEdition) {
        const exists = await checkArticleByNomAndCategorie(nom, categorieId);
        if (exists) {
          setResultModalMessage("Un article avec ce nom existe déjà dans cette catégorie.");
          setResultModalSuccess(false);
          setShowResultModal(true);
          return;
        }
      }

      // Toujours envoyer le champ images, même vide
      const articlePayload = {
        nom,
        description,
        prix,
        categorie_id: categorieId,
        images: imageUrls.filter((url) => url && url.trim() !== ""), // Array vide si pas d'images
        stocks: stocks.filter((stock) => stock.quantite > 0),
      };

      if (articleEnEdition) {
        await modifierArticle.mutateAsync({
          id: articleEnEdition.id,
          article: articlePayload,
        });
        setResultModalMessage("Les modifications apportées ont été sauvegardées avec succès.");
      } else {
        await ajouterArticle.mutateAsync(articlePayload);
        setResultModalMessage("L'article a été ajouté avec succès à votre inventaire.");
      }

      setResultModalSuccess(true);
      resetForm();
    } catch (error) {
      console.error("Erreur lors de l'ajout/modification:", error);
      setResultModalMessage("Une erreur est survenue lors de l'opération. Veuillez réessayer.");
      setResultModalSuccess(false);
    }

    setShowResultModal(true);
  };

  const annulerModifications = () => {
    setShowConfirmModal(false);
    setModificationsResume([]);
  };

  // Modifier handleSupprimerArticle pour demander confirmation
  const handleSupprimerArticle = (id: number) => {
    // Trouver l'article complet à partir de son ID
    const article = articlesParCategorie
      .flatMap((cat) => cat.articles)
      .find((art) => art.id === id);

    setArticleToDelete(article || { id, nom: "Article inconnu" });
    setShowDeleteConfirmModal(true);
  };

  // Nouvelle fonction pour confirmer la suppression
  const confirmerSuppression = async () => {
    setShowDeleteConfirmModal(false);

    if (!articleToDelete) return;

    try {
      await supprimerArticle.mutateAsync(articleToDelete.id);
      setResultModalMessage(
        `L'article "${articleToDelete.nom}" a été supprimé avec succès de votre inventaire.`,
      );
      setResultModalSuccess(true);
    } catch (error) {
      setResultModalMessage(
        "Une erreur est survenue lors de la suppression de l'article. Veuillez réessayer.",
      );
      setResultModalSuccess(false);
    }

    setArticleToDelete(null);
    setShowResultModal(true);
  };

  const annulerSuppression = () => {
    setShowDeleteConfirmModal(false);
    setArticleToDelete(null);
  };

  // Nouvelle fonction pour ouvrir la modal de détails
  const handleShowDetails = (article: any) => {
    setSelectedDetailArticle(article);
    setShowDetailModal(true);
    setSelectedTaille(null); // Reset taille selection
  };

  // Fonctions pour la modal de détails
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedDetailArticle(null);
    setSelectedTaille(null);
    setIsTailleOpen(false);
  };

  const handleTailleSelect = (taille: string) => {
    setSelectedTaille(taille);
  };

  const handleTailleToggle = (isOpen: boolean) => {
    setIsTailleOpen(isOpen);
  };

  // Modifier la fonction handleAjouterAuPanier
  const handleAjouterAuPanier = (article: any, taille: string, quantite: number) => {
    const nouvelArticle = {
      ...article,
      taille,
      quantite,
    };

    setPanierArticles((prev) => [...prev, nouvelArticle]);
    setShowPanier(true); // Ouvrir automatiquement le panier

    console.log(`Article "${article.nom}" ajouté au panier (${taille}, quantité: ${quantite})`);
  };

  // Fonctions pour gérer le panier
  const handleRemoveArticle = (index: number) => {
    setPanierArticles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantite = (index: number, quantite: number, taille: string) => {
    setPanierArticles((prev) =>
      prev.map((article, i) => (i === index ? { ...article, quantite, taille } : article)),
    );
  };

  const resetForm = () => {
    setNom("");
    setDescription("");
    setPrix("0");
    setCategorieId(null);
    setStocks([{ taille: "S", quantite: 0 }]);
    setImageUrls([]);
    setArticleEnEdition(null);
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const articlesParCategorie = React.useMemo(() => {
    if (!articles || !categories) return [];
    if (!Array.isArray(articles)) {
      return categories.map((categorie) => ({
        ...categorie,
        articles: articles[categorie.nom] || [],
      }));
    }
    return categories.map((categorie) => ({
      ...categorie,
      articles: articles.filter((a: any) => String(a.categorie_id) === String(categorie.id)),
    }));
  }, [articles, categories]);

  const taillesDisponibles = tailles?.map((t: any) => t.nom) || [];

  React.useEffect(() => {
    if (articleEnEdition) {
      setNom(articleEnEdition.nom ?? "");
      setDescription(articleEnEdition.description ?? "");
      setPrix(articleEnEdition.prix !== undefined ? String(articleEnEdition.prix) : "0");
      setCategorieId(
        articleEnEdition.categorie_id !== undefined ? String(articleEnEdition.categorie_id) : null,
      );
      setStocks(articleEnEdition.stocks ?? [{ taille: "S", quantite: 0 }]);
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <Spinner size="xl" />
          </div>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="store-page" style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <PageHeader
          title="Ajouter un article"
          subtitle="Ajoutez un nouvel article à votre inventaire"
          variant="store"
        />

        <PageSection className="store-content" style={{ flex: 1 }}>
          <Tabs activeKey={activeTabKey} onSelect={handleTabClick} className="modern-tabs">
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
                onSelectArticle={handleShowDetails}
                onEditArticle={setArticleEnEdition}
                onDeleteArticle={handleSupprimerArticle}
              />
            </Tab>
          </Tabs>

          <DetailArticleModal
            isOpen={showDetailModal}
            selectedArticle={selectedDetailArticle}
            selectedTaille={selectedTaille}
            isTailleOpen={isTailleOpen}
            onClose={handleCloseDetailModal}
            onTailleSelect={handleTailleSelect}
            onTailleToggle={handleTailleToggle}
            onAjouterAuPanier={handleAjouterAuPanier} // Passer la nouvelle fonction
          />

          {/* Supprimer ou commenter ModalsArticle */}
          {/*
          <ModalsArticle
            // ... props
          />
          */}

          <ResumeConfirmModal
            isOpen={showConfirmModal}
            onClose={annulerModifications}
            onConfirm={confirmerAjout}
            title={articleEnEdition ? "Confirmer les modifications" : "Confirmer l'ajout d'article"}
            message={
              articleEnEdition
                ? `Vous êtes sur le point de modifier l'article "${articleEnEdition.nom}".`
                : `Vous êtes sur le point d'ajouter un nouvel article "${nom}".`
            }
            modificationsResume={modificationsResume}
            confirmText={articleEnEdition ? "Modifier" : "Ajouter"}
          />

          <ConfirmModal
            isOpen={showDeleteConfirmModal}
            onClose={annulerSuppression}
            onConfirm={confirmerSuppression}
            title="Confirmer la suppression"
            message={`Êtes-vous sûr de vouloir supprimer l'article "${articleToDelete?.nom}" ? Cette action est irréversible.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="danger"
          />

          <ResultModal
            isOpen={showResultModal}
            onClose={() => setShowResultModal(false)}
            title={resultModalSuccess ? "Succès" : "Erreur"}
            message={resultModalMessage}
            isSuccess={resultModalSuccess}
          />
        </PageSection>
      </div>

      {/* Panier latéral */}
      <RightSidePanel
        isExpanded={showPanier}
        onClose={() => setShowPanier(false)}
        articles={panierArticles}
        onRemoveArticle={handleRemoveArticle}
        onUpdateQuantite={handleUpdateQuantite}
        onUpdateTaille={(index: number, nouvelleTaille: string) => {
          // Implémenter si nécessaire
        }}
      />
    </div>
  );
};

export default AjouterArticlePage;
