import { useState, useEffect } from "react";
import { Spinner, Alert } from "@patternfly/react-core";
import RightSidePanel from "../../../components/common/panel/rightSidePanel";
import {
  useArticlesParCategorie,
  useCategoriesMagasin,
} from "../hooks/useMagasin";
import {
  ToolbarMagasin,
  CatalogueMagasin,
  DetailArticleModal,
} from "../components";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../redux/store";
import {
  ajouterArticle,
  supprimerArticle,
  modifierTaille,
  modifierQuantite,
  fermerPanier,
  synchroniserArticle,
  viderPanier, // AJOUTÉ: Import de la nouvelle action
} from "../../../redux/slices/panierSlice";
import React from "react";
import { PageSection } from "@patternfly/react-core";
import { PageHeader } from "../../../components/common/PageHeader";
import { useNavigate } from "react-router-dom";

// Import des types
import type { Article } from "@clubmanager/types";

const MagasinPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const panier = useSelector((state: RootState) => state.panier.articles);
  const isPanelOpen = useSelector((state: RootState) => state.panier.isOpen);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [selectedTaille, setSelectedTaille] = useState<string | null>(null);
  const [isTailleOpen, setIsTailleOpen] = useState(false);

  // Utilisation des hooks React Query
  const {
    data: articlesParCategorie,
    isLoading: loadingArticles,
    error: errorArticles,
  } = useArticlesParCategorie();
  const {
    data: categories,
    isLoading: loadingCategories,
    error: errorCategories,
  } = useCategoriesMagasin();

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

  // AJOUTÉ: Synchroniser le panier quand les articles sont rechargés
  useEffect(() => {
    if (articlesParCategorie && panier.length > 0) {
      console.log("🔄 [Magasin] Synchronisation panier avec nouveaux articles");

      // Récupérer tous les articles à plat
      const tousLesArticles = Object.values(articlesParCategorie).flat();

      // Pour chaque article du panier, vérifier s'il faut le synchroniser
      panier.forEach((articlePanier, index) => {
        const articleActuel = tousLesArticles.find(
          (a: any) => a.id === articlePanier.id,
        );

        if (articleActuel) {
          // Vérifier si les stocks ont changé (comparer les stocks de base, pas ajustés)
          const stocksOriginals = JSON.stringify(
            articleActuel.stocks?.map((s: any) => ({
              taille: s.taille,
              quantite: s.quantite,
            })),
          );
          const stocksPanier = JSON.stringify(
            articlePanier.stocks?.map((s: any) => ({
              taille: s.taille,
              quantite: s.quantiteOriginale || s.quantite,
            })),
          );

          if (stocksOriginals !== stocksPanier) {
            console.log(
              "🔄 [Panier] Synchronisation article:",
              articleActuel.nom,
            );

            // Synchroniser avec les stocks de base (pas ajustés)
            const articleSynchronise = {
              ...articleActuel,
              // Garder les propriétés du panier
              taille: articlePanier.taille,
              quantite: articlePanier.quantite,
            };

            dispatch(
              synchroniserArticle({
                index,
                articleMisAJour: articleSynchronise,
              }),
            );
          }
        }
      });
    }
  }, [articlesParCategorie, dispatch]); // MODIFIÉ: Enlever panier des dépendances pour éviter les boucles

  const ajouterAuPanier = (
    article: Article,
    taille: string,
    quantite: number = 1,
  ) => {
    console.log("🛒 [Magasin] === AJOUT AU PANIER ===");
    console.log("🛒 [Magasin] Article à ajouter:", {
      id: article.id,
      nom: article.nom,
      taille,
      quantite,
      stocks: article.stocks,
    });

    const nouvelArticle: Article = {
      ...article,
      taille,
      quantite,
      // S'assurer que les stocks sont bien copiés
      stocks: article.stocks ? [...article.stocks] : [],
    };

    console.log("🛒 [Magasin] Nouvel article pour panier:", nouvelArticle);
    dispatch(ajouterArticle(nouvelArticle));

    // Debug: afficher l'état du panier après ajout
    setTimeout(() => {
      console.log("🛒 [Magasin] Panier après ajout:", panier);
    }, 100);
  };

  const supprimerDuPanier = (index: number) => {
    dispatch(supprimerArticle(index));
  };

  const changerTailleArticle = (index: number, nouvelleTaille: string) => {
    dispatch(modifierTaille({ index, taille: nouvelleTaille }));
  };

  const changerQuantiteArticle = (
    index: number,
    quantite: number,
    taille: string,
  ) => {
    console.log("🔄 [Magasin] Changement quantité article:", {
      index,
      quantite,
      taille,
    });

    // MODIFIÉ: Utiliser la nouvelle signature avec taille
    dispatch(modifierQuantite({ index, quantite }));
    dispatch(modifierTaille({ index, taille }));

    console.log("✅ [Magasin] Article mis à jour dans le panier");
  };

  const toggleCategorie = (nomCategorie: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [nomCategorie]: !prev[nomCategorie],
    }));
  };

  // Fonction pour ouvrir la modal d'informations
  const openInfoModal = (article: any) => {
    console.log("📋 [Magasin] Ouverture modal pour:", article.nom);

    // AJOUTÉ: Récupérer les données fraîches de l'article
    const articleActuel = articlesParCategorie
      ? Object.values(articlesParCategorie)
          .flat()
          .find((a: any) => a.id === article.id)
      : article;

    // AJOUTÉ: Calculer les stocks réels en tenant compte du panier
    const articleAvecStocksAjustes = articleActuel
      ? {
          ...articleActuel,
          stocks: calculerStocksAjustes(articleActuel, panier),
        }
      : article;

    setSelectedArticle(articleAvecStocksAjustes);
    setSelectedTaille(null); // MODIFIÉ: Toujours reset à null pour forcer la sélection manuelle
    setIsInfoModalOpen(true);
  };

  // AJOUTÉ: Fonction pour calculer les stocks en tenant compte des articles dans le panier
  const calculerStocksAjustes = (article: any, panier: Article[]) => {
    if (!article.stocks) return [];

    console.log("🔍 [Stocks] Calcul pour article:", article.nom);
    console.log("🔍 [Stocks] Stocks originaux:", article.stocks);
    console.log("🔍 [Panier] Articles dans le panier:", panier);

    // Calculer les quantités réservées dans le panier pour cet article
    const quantitesReservees: Record<string, number> = {};

    panier
      .filter((item) => item.id === article.id)
      .forEach((item) => {
        if (item.taille) {
          quantitesReservees[item.taille] =
            (quantitesReservees[item.taille] || 0) + item.quantite;
          console.log(
            `🔍 [Panier] Taille ${item.taille}: +${item.quantite} (total: ${quantitesReservees[item.taille]})`,
          );
        }
      });

    // Ajuster les stocks en soustrayant les quantités réservées
    const stocksAjustes = article.stocks.map((stock: any) => {
      const quantiteReservee = quantitesReservees[stock.taille] || 0;
      const nouvelleQuantite = Math.max(0, stock.quantite - quantiteReservee);

      console.log(
        `🔍 [Stocks] Taille ${stock.taille}: ${stock.quantite} - ${quantiteReservee} = ${nouvelleQuantite}`,
      );

      return {
        ...stock,
        quantiteOriginale: stock.quantite, // Garder l'original pour référence
        quantite: nouvelleQuantite,
      };
    });

    console.log("✅ [Stocks] Stocks ajustés:", stocksAjustes);
    return stocksAjustes;
  };

  // Fonction pour fermer la modal
  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
    setSelectedArticle(null);
  };

  // Fonction pour aller au checkout
  const allerAuCheckout = () => {
    navigate("/pages/magasin/checkout");
  };

  // MODIFIÉ: Recalculer les stocks en temps réel quand le panier change
  useEffect(() => {
    if (isInfoModalOpen && selectedArticle) {
      console.log("🔄 [Modal] Recalcul stocks en temps réel - panier changé");

      // Récupérer l'article actuel depuis le catalogue
      const articleActuel = articlesParCategorie
        ? Object.values(articlesParCategorie)
            .flat()
            .find((a: any) => a.id === selectedArticle.id)
        : selectedArticle;

      if (articleActuel) {
        // Recalculer les stocks ajustés avec le panier actuel
        const stocksMisAJour = calculerStocksAjustes(articleActuel, panier);

        // Mettre à jour l'article sélectionné avec les nouveaux stocks
        setSelectedArticle({
          ...articleActuel,
          stocks: stocksMisAJour,
        });

        console.log("✅ [Modal] Stocks mis à jour en temps réel");
      }
    }
  }, [panier, isInfoModalOpen]); // AJOUTÉ: Se déclenche quand le panier change

  // AJOUTÉ: Vérifier si le panier doit être vidé après un paiement réussi
  useEffect(() => {
    const checkPaymentSuccess = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get("payment_success");
      const shouldClearCart = localStorage.getItem("pendingOrderClearCart");

      if (paymentSuccess === "true" && shouldClearCart === "true") {
        console.log("✅ [Magasin] Paiement réussi - vidage du panier");

        // Vider le panier
        dispatch(viderPanier());

        // Nettoyer le localStorage
        localStorage.removeItem("pendingOrderClearCart");
        localStorage.removeItem("dernierPanier");

        // Nettoyer l'URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    checkPaymentSuccess();
  }, [dispatch]);

  // AJOUTÉ: Écouter les changements d'URL pour détecter le retour de paiement
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get("payment_success");
      const shouldClearCart = localStorage.getItem("pendingOrderClearCart");

      if (paymentSuccess === "true" && shouldClearCart === "true") {
        console.log(
          "✅ [Magasin] Retour de paiement réussi - vidage du panier",
        );
        dispatch(viderPanier());
        localStorage.removeItem("pendingOrderClearCart");
        localStorage.removeItem("dernierPanier");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [dispatch]);

  if (loadingArticles || loadingCategories) {
    return (
      <div className="store-page">
        <PageHeader
          title="Magasin"
          subtitle="Gérez votre inventaire et vos produits"
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
            style={{ borderRadius: "8px" }}
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
          onCheckout={allerAuCheckout} // Garde l'ancien système si besoin
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
          onTailleSelect={(taille) => {
            console.log("🔄 [Magasin] Sélection taille depuis modal:", taille);
            setSelectedTaille(taille);
          }}
          onTailleToggle={setIsTailleOpen}
          onAjouterAuPanier={(article, taille, quantite) => {
            console.log("🛒 [Modal] Ajout au panier:", {
              article: article.nom,
              taille,
              quantite,
            });
            ajouterAuPanier(article, taille, quantite);
            closeInfoModal();
          }}
        />
      </PageSection>
    </div>
  );
};

export default MagasinPage;
