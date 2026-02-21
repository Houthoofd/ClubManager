import { useState, useEffect } from "react";
import { Alert } from "@patternfly/react-core";
import { SkeletonCard } from "@/shared/components/ui";
import RightSidePanel from "@/shared/components/common-legacy/panel/rightSidePanel";
import { useArticlesParCategorie, useCategoriesMagasin } from "../hooks/useMagasin";
import { ToolbarMagasin, CatalogueMagasin, DetailArticleModal } from "../components";
import React from "react";
import { PageSection } from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { shallow } from "zustand/shallow";

// Import des types
import type { Article } from "@clubmanager/types";

const MagasinPage: React.FC = () => {
  const navigate = useNavigate();

  // Zustand store - remplacement de Redux
  // Optimisation: sélection du state uniquement (reactive)
  const cartItems = useCartStore((state) => state.items);
  const isPanelOpen = useCartStore((state) => state.isOpen);

  // Optimisation: sélection des actions avec shallow (non-reactive, stable references)
  const { addItem, removeItem, updateQuantity, clearCart, closeCart } = useCartStore(
    (state) => ({
      addItem: state.addItem,
      removeItem: state.removeItem,
      updateQuantity: state.updateQuantity,
      clearCart: state.clearCart,
      closeCart: state.closeCart,
    }),
    shallow,
  );
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
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
    if (articlesParCategorie && cartItems.length > 0) {
      console.log("🔄 [Magasin] Synchronisation panier avec nouveaux articles");

      // Récupérer tous les articles à plat
      const tousLesArticles = Object.values(articlesParCategorie).flat();

      // Pour chaque article du panier, vérifier s'il faut le synchroniser
      cartItems.forEach((cartItem) => {
        const articleActuel = tousLesArticles.find((a: any) => a.id === cartItem.productId);

        if (articleActuel) {
          // Vérifier si le prix ou les stocks ont changé
          const prixChange = articleActuel.prix !== cartItem.price;

          if (prixChange) {
            console.log("🔄 [Panier] Synchronisation prix article:", cartItem.productName);

            // Mettre à jour l'article avec le nouveau prix
            removeItem(cartItem.id);
            addItem({
              productId: cartItem.productId,
              productName: articleActuel.nom || cartItem.productName,
              price: articleActuel.prix,
              quantity: cartItem.quantity,
              stockId: cartItem.stockId,
              size: cartItem.size,
              imageUrl: cartItem.imageUrl,
              maxQuantity: cartItem.maxQuantity,
            });
          }
        }
      });
    }
  }, [articlesParCategorie]); // MODIFIÉ: Enlever cartItems des dépendances pour éviter les boucles

  const ajouterAuPanier = (article: Article, taille: string, quantite: number = 1) => {
    console.log("🛒 [Magasin] === AJOUT AU PANIER ===");
    console.log("🛒 [Magasin] Article à ajouter:", {
      id: article.id,
      nom: article.nom,
      taille,
      quantite,
      stocks: article.stocks,
    });

    // Trouver le stock correspondant à la taille
    const stock = article.stocks?.find((s: any) => s.taille === taille);

    addItem({
      productId: article.id,
      productName: article.nom,
      price: article.prix || 0,
      quantity: quantite,
      stockId: stock?.id || null,
      size: taille,
      imageUrl: article.images?.[0]?.url || null,
      maxQuantity: stock?.quantite || 999,
    });

    // Debug: afficher l'état du panier après ajout
    setTimeout(() => {
      console.log("🛒 [Magasin] Panier après ajout:", cartItems);
    }, 100);
  };

  const supprimerDuPanier = (index: number) => {
    const item = cartItems[index];
    if (item) {
      removeItem(item.id);
    }
  };

  const changerTailleArticle = (index: number, nouvelleTaille: string) => {
    const item = cartItems[index];
    if (item) {
      // Supprimer l'ancien item et ajouter un nouveau avec la nouvelle taille
      removeItem(item.id);
      addItem({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        stockId: item.stockId,
        size: nouvelleTaille,
        imageUrl: item.imageUrl,
        maxQuantity: item.maxQuantity,
      });
    }
  };

  const changerQuantiteArticle = (index: number, quantite: number, taille: string) => {
    console.log("🔄 [Magasin] Changement quantité article:", {
      index,
      quantite,
      taille,
    });

    const item = cartItems[index];
    if (item) {
      updateQuantity(item.id, quantite);

      // Si la taille a changé aussi, mettre à jour
      if (item.size !== taille) {
        changerTailleArticle(index, taille);
      }
    }

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
          stocks: calculerStocksAjustes(articleActuel, cartItems),
        }
      : article;

    setSelectedArticle(articleAvecStocksAjustes);
    setSelectedTaille(null); // MODIFIÉ: Toujours reset à null pour forcer la sélection manuelle
    setIsInfoModalOpen(true);
  };

  // AJOUTÉ: Fonction pour calculer les stocks en tenant compte des articles dans le panier
  const calculerStocksAjustes = (article: any, items: any[]) => {
    if (!article.stocks) return [];

    console.log("🔍 [Stocks] Calcul pour article:", article.nom);
    console.log("🔍 [Stocks] Stocks originaux:", article.stocks);
    console.log("🔍 [Panier] Articles dans le panier:", items);

    // Calculer les quantités réservées dans le panier pour cet article
    const quantitesReservees: Record<string, number> = {};

    items
      .filter((item) => item.productId === article.id)
      .forEach((item) => {
        if (item.size) {
          quantitesReservees[item.size] = (quantitesReservees[item.size] || 0) + item.quantity;
          console.log(
            `🔍 [Panier] Taille ${item.size}: +${item.quantity} (total: ${quantitesReservees[item.size]})`,
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
        const stocksMisAJour = calculerStocksAjustes(articleActuel, cartItems);

        // Mettre à jour l'article sélectionné avec les nouveaux stocks
        setSelectedArticle({
          ...articleActuel,
          stocks: stocksMisAJour,
        });

        console.log("✅ [Modal] Stocks mis à jour en temps réel");
      }
    }
  }, [cartItems, isInfoModalOpen]); // AJOUTÉ: Se déclenche quand le panier change

  // AJOUTÉ: Vérifier si le panier doit être vidé après un paiement réussi
  useEffect(() => {
    const checkPaymentSuccess = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get("payment_success");
      const shouldClearCart = localStorage.getItem("pendingOrderClearCart");

      if (paymentSuccess === "true" && shouldClearCart === "true") {
        console.log("✅ [Magasin] Paiement réussi - vidage du panier");

        // Vider le panier
        clearCart();

        // Nettoyer le localStorage
        localStorage.removeItem("pendingOrderClearCart");
        localStorage.removeItem("dernierPanier");

        // Nettoyer l'URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    checkPaymentSuccess();
  }, [clearCart]);

  // AJOUTÉ: Écouter les changements d'URL pour détecter le retour de paiement
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get("payment_success");
      const shouldClearCart = localStorage.getItem("pendingOrderClearCart");

      if (paymentSuccess === "true" && shouldClearCart === "true") {
        console.log("✅ [Magasin] Retour de paiement réussi - vidage du panier");
        clearCart();
        localStorage.removeItem("pendingOrderClearCart");
        localStorage.removeItem("dernierPanier");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [clearCart]);

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
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
              padding: "1rem",
            }}
          >
            <SkeletonCard hasImage hasTitle hasDescription />
            <SkeletonCard hasImage hasTitle hasDescription />
            <SkeletonCard hasImage hasTitle hasDescription />
            <SkeletonCard hasImage hasTitle hasDescription />
            <SkeletonCard hasImage hasTitle hasDescription />
            <SkeletonCard hasImage hasTitle hasDescription />
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
          onClose={() => closeCart()}
          articles={cartItems}
          onRemoveArticle={supprimerDuPanier}
          onUpdateTaille={changerTailleArticle}
          onUpdateQuantite={changerQuantiteArticle}
          onCheckout={allerAuCheckout}
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
