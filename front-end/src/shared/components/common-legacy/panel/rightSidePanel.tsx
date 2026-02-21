import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/shared/utils/apiUrl";
import { useGetStockSizesQuery } from "@/core/api/apollo/generated/graphql";
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerCloseButton,
  Title,
  Stack,
  StackItem,
  Button,
  Flex,
  FlexItem,
  TextInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Modal,
} from "@patternfly/react-core";
import PaymentForm from "../../common/form/paymentForm";
import { useCart } from "@/app/providers/CartProvider";
import { getUser } from "@/shared/utils/storage";

// Import des types (à ajuster selon ton arborescence)
import type { Article, Taille } from "@clubmanager/types";

export type RightSidePanelProps = {
  isExpanded: boolean;
  onClose: () => void;
  articles: Article[];
  onRemoveArticle: (index: number) => void;
  onUpdateQuantite: (index: number, quantite: number, taille: string) => void;
  onUpdateTaille: (index: number, nouvelleTaille: string) => void;
  onViderPanier?: () => void; // AJOUTÉ: Prop optionnelle pour vider le panier
  children?: ReactNode;
};

const RightSidePanel = ({
  isExpanded,
  onClose,
  articles: propsArticles,
  onRemoveArticle,
  onUpdateQuantite,
  onViderPanier,
  children,
}: RightSidePanelProps) => {
  // Récupérer les tailles disponibles avec GraphQL
  const { data: sizesData } = useGetStockSizesQuery({
    fetchPolicy: "cache-first",
  });
  const navigate = useNavigate();
  const { articles, removeArticle, updateQuantite, clearCart, total, closeCart } = useCart();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedTaille, setSelectedTaille] = useState<Taille | null>(null);
  const [quantiteTemp, setQuantiteTemp] = useState<number>(1);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [commande, setCommande] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const user = getUser();

  // AJOUTÉ: Fonction locale pour vider le panier si la prop n'est pas fournie
  const viderPanier = () => {
    if (onViderPanier) {
      onViderPanier();
    } else {
      // Fallback: retirer tous les articles un par un
      for (let i = articles.length - 1; i >= 0; i--) {
        onRemoveArticle(i);
      }
    }
  };

  // NETTOYÉ: Fonction pour calculer les stocks disponibles en tenant compte du panier
  const calculerStocksDisponibles = (article: Article, articleIndex: number) => {
    if (!article.stocks) return [];

    // Calculer les quantités réservées dans le panier pour cet article (INCLUANT l'article en cours d'édition)
    const quantitesReservees: Record<string, number> = {};

    articles.forEach((item, index) => {
      const sameArticle = item.id === article.id;
      const isCurrentlyEditing = index === articleIndex;

      if (sameArticle && item.taille) {
        if (isCurrentlyEditing) {
          const quantiteActuelle = item.quantite || 0;
          quantitesReservees[item.taille] =
            (quantitesReservees[item.taille] || 0) + quantiteActuelle;
        } else {
          quantitesReservees[item.taille] =
            (quantitesReservees[item.taille] || 0) + (item.quantite || 0);
        }
      }
    });

    // Ajuster les stocks en soustrayant les quantités réservées
    const stocksAjustes = article.stocks.map((stock: any) => {
      const quantiteReservee = quantitesReservees[stock.taille] || 0;
      const nouvelleQuantite = Math.max(0, stock.quantite - quantiteReservee);

      return {
        ...stock,
        quantiteOriginale: stock.quantite,
        quantite: nouvelleQuantite,
      };
    });

    return stocksAjustes;
  };

  // AJOUTÉ: Fonction pour obtenir le stock maximum disponible pour une taille
  const getMaxStockForTaille = (article: Article, taille: string, articleIndex: number): number => {
    const stocksDisponibles = calculerStocksDisponibles(article, articleIndex);
    const stock = stocksDisponibles.find((s: any) => s.taille === taille);
    return stock?.quantite || 0;
  };

  // CORRIGÉ: Fonction pour obtenir le stock maximum disponible pour une taille en tenant compte de la quantité temporaire
  const getMaxStockForTailleAvecQuantiteTemp = (
    article: Article,
    taille: string,
    articleIndex: number,
  ): number => {
    if (!article.stocks) return 0;

    // Calculer manuellement pour tenir compte de quantiteTemp
    const stockOriginal = article.stocks.find((s: any) => s.taille === taille);
    if (!stockOriginal) return 0;

    // Calculer les quantités réservées par les AUTRES articles du même type (même taille)
    let quantiteReserveeParAutres = 0;
    articles.forEach((item, index) => {
      if (item.id === article.id && index !== articleIndex && item.taille === taille) {
        quantiteReserveeParAutres += item.quantite || 0;
      }
    });

    // CORRIGÉ: Le stock disponible = stock original - quantité réservée par autres
    // (on ne soustrait PAS la quantité en cours d'édition car on calcule combien on PEUT mettre)
    const stockDisponible = Math.max(0, stockOriginal.quantite - quantiteReserveeParAutres);

    console.log(`🔢 [RightPanel] Calcul stock pour taille ${taille}:`, {
      stockOriginal: stockOriginal.quantite,
      quantiteReserveeParAutres,
      stockDisponible,
      note: "Stock disponible = stock original - réservé par autres (sans compter l'article en cours)",
    });

    return stockDisponible;
  };

  // ALTERNATIVE: Si vous voulez vraiment soustraire la quantité de l'article en cours d'édition
  const getMaxStockForTailleAvecQuantiteActuelle = (
    article: Article,
    taille: string,
    articleIndex: number,
  ): number => {
    if (!article.stocks) return 0;

    const stockOriginal = article.stocks.find((s: any) => s.taille === taille);
    if (!stockOriginal) return 0;

    // Calculer TOUTES les quantités réservées pour cette taille (y compris l'article en cours)
    let quantiteReserveeTotal = 0;
    articles.forEach((item, index) => {
      if (item.id === article.id && item.taille === taille) {
        if (index === articleIndex) {
          // Pour l'article en cours d'édition, utiliser sa quantité ACTUELLE (avant modification)
          quantiteReserveeTotal += item.quantite || 0;
        } else {
          // Pour les autres articles
          quantiteReserveeTotal += item.quantite || 0;
        }
      }
    });

    // Le stock disponible = stock original - TOUTES les quantités réservées
    const stockDisponible = Math.max(0, stockOriginal.quantite - quantiteReserveeTotal);

    console.log(`🔢 [RightPanel] Calcul stock AVEC quantité actuelle pour taille ${taille}:`, {
      stockOriginal: stockOriginal.quantite,
      quantiteReserveeTotal,
      stockDisponible,
      note: "Stock disponible = stock original - TOUTES les réservations",
    });

    // AJOUTÉ: Ajouter la quantité actuelle de l'article en cours car on peut la "récupérer"
    const quantiteActuelle = articles[articleIndex]?.quantite || 0;
    const stockMaxPossible = stockDisponible + quantiteActuelle;

    console.log(
      `🔢 [RightPanel] Stock max possible: ${stockDisponible} + ${quantiteActuelle} = ${stockMaxPossible}`,
    );

    return stockMaxPossible;
  };

  // CORRIGÉ: Fonction pour afficher le stock disponible en tenant compte de TOUTES les réservations
  const getStockReellementDisponible = (
    article: Article,
    taille: string,
    articleIndex: number,
  ): number => {
    if (!article.stocks) return 0;

    const stockOriginal = article.stocks.find((s: any) => s.taille === taille);
    if (!stockOriginal) return 0;

    // Calculer TOUTES les quantités réservées pour cette taille
    let quantiteReserveeTotal = 0;
    articles.forEach((item, index) => {
      if (item.id === article.id && item.taille === taille) {
        quantiteReserveeTotal += item.quantite || 0;
      }
    });

    return Math.max(0, stockOriginal.quantite - quantiteReserveeTotal);
  };

  // NETTOYÉ: Fonction pour calculer le maximum qu'on peut mettre pour cet article
  const getMaxQuantitePossible = (
    article: Article,
    taille: string,
    articleIndex: number,
  ): number => {
    if (!article.stocks) return 0;

    const stockOriginal = article.stocks.find((s: any) => s.taille === taille);
    if (!stockOriginal) return 0;

    // Calculer les quantités réservées par les AUTRES articles du même type
    let quantiteReserveeParAutres = 0;
    articles.forEach((item, index) => {
      if (item.id === article.id && index !== articleIndex && item.taille === taille) {
        quantiteReserveeParAutres += item.quantite || 0;
      }
    });

    return Math.max(0, stockOriginal.quantite - quantiteReserveeParAutres);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setSelectedTaille((articles[index].taille as Taille) || null);
    setQuantiteTemp(articles[index].quantite || 1);
  };

  const validerEdition = (index: number) => {
    const tailleAUtiliser = selectedTaille || articles[index].taille;
    const quantiteAUtiliser = quantiteTemp > 0 ? quantiteTemp : 1;

    // Vérifier si la quantité est disponible
    const maxStock = getMaxStockForTaille(articles[index], tailleAUtiliser as string, index);

    if (quantiteAUtiliser > maxStock) {
      alert(
        `Stock insuffisant ! Maximum disponible pour la taille ${tailleAUtiliser}: ${maxStock}`,
      );
      return;
    }

    if (tailleAUtiliser && quantiteAUtiliser > 0) {
      onUpdateQuantite(index, quantiteAUtiliser, tailleAUtiliser as string);

      setEditingIndex(null);
      setSelectedTaille(null);
      setQuantiteTemp(1);
      setIsSelectOpen(false);
    } else {
      alert("Veuillez sélectionner une taille et une quantité valides.");
    }
  };

  const onPasserCommande = async () => {
    console.log("🛒 [Panier] DÉMARRAGE onPasserCommande");

    // AJOUTÉ: Debug Redux avant tout traitement
    console.log("🔍 [Panier] DEBUG REDUX - Déclenchement debug panier...");

    // CRITIQUE: Sauvegarder IMMÉDIATEMENT dans userData avant tout traitement
    const articlesSnapshot = [...articles];

    // NOUVEAU: Sauvegarder dans userData avec structure enrichie
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");

      // CRITIQUE: Sauvegarder à plusieurs endroits pour récupération
      userData.panierCommande = {
        articles: articlesSnapshot,
        timestamp: new Date().toISOString(),
        utilisateur_id: user?.id || userData.id || userData.data?.id,
        source: "rightSidePanel_onPasserCommande",
      };

      userData.lastArticles = articlesSnapshot; // Sauvegarde simple
      userData.commandeInProgress = true; // Flag de commande en cours

      localStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem(
        "panierBackup",
        JSON.stringify({
          articles: articlesSnapshot,
          timestamp: new Date().toISOString(),
          source: "onPasserCommande",
        }),
      );

      console.log("💾 [Panier] SAUVEGARDE CRITIQUE effectuée dans userData et localStorage:", {
        articlesCount: articlesSnapshot.length,
        userData_panierCommande: !!userData.panierCommande,
        userData_lastArticles: !!userData.lastArticles,
        localStorage_panierBackup: !!localStorage.getItem("panierBackup"),
      });
    } catch (saveError) {
      console.error("❌ [Panier] ERREUR CRITIQUE sauvegarde:", saveError);
      // Continuer quand même car les articles sont encore dans articlesSnapshot
    }

    // CORRIGÉ: Utiliser articlesSnapshot pour toute la logique
    console.log("🔍 [Panier] Articles snapshot:", {
      articles: articlesSnapshot,
      length: articlesSnapshot?.length || 0,
      sample: articlesSnapshot?.[0],
    });

    if (!articlesSnapshot || articlesSnapshot.length === 0) {
      console.error("❌ [Panier] STOP: Snapshot panier vide!");
      alert("Votre panier est vide.");
      return;
    }

    // Validation des articles individuellement
    console.log("🔍 [Panier] Validation détaillée de chaque article:");
    for (let i = 0; i < articlesSnapshot.length; i++) {
      const article = articlesSnapshot[i];
      console.log(`🔍 [Panier] Article ${i}:`, {
        id: article.id,
        nom: article.nom,
        prix: article.prix,
        quantite: article.quantite,
        taille: article.taille,
        hasStocks: !!article.stocks,
        stocksLength: article.stocks?.length || 0,
      });

      if (!article.id) {
        console.error(`❌ [Panier] Article ${i}: ID manquant`);
        alert(`Article ${i + 1}: ID manquant`);
        return;
      }
      if (!article.taille) {
        console.error(`❌ [Panier] Article ${i}: Taille manquante`);
        alert(`Article ${i + 1}: Taille manquante`);
        return;
      }
      if (!article.quantite || article.quantite <= 0) {
        console.error(`❌ [Panier] Article ${i}: Quantité invalide (${article.quantite})`);
        alert(`Article ${i + 1}: Quantité invalide`);
        return;
      }
      if (!article.prix || article.prix <= 0) {
        console.error(`❌ [Panier] Article ${i}: Prix invalide (${article.prix})`);
        alert(`Article ${i + 1}: Prix invalide`);
        return;
      }
    }

    // Récupérer les données utilisateur
    const userData = localStorage.getItem("userData");
    if (!userData) {
      console.error("❌ [Panier] Utilisateur non connecté");
      alert("Utilisateur non connecté.");
      return;
    }

    const user = JSON.parse(userData);
    const utilisateur_id = Number(user.id || user.data?.id || user.user?.id);

    if (!utilisateur_id || isNaN(utilisateur_id)) {
      console.error("❌ [Panier] ID utilisateur non trouvé dans:", user);
      alert("Erreur: ID utilisateur non trouvé.");
      return;
    }

    console.log("✅ [Panier] Utilisateur validé:", utilisateur_id);

    // CRITIQUE: Fonction pour récupérer taille_id depuis GraphQL (migré)
    const getTailleIdFromAPI = async (tailleName: string): Promise<number | null> => {
      try {
        console.log(`🔍 [Panier] Recherche taille_id pour "${tailleName}" (GraphQL)`);

        if (!sizesData?.stockSizes) {
          console.warn(`⚠️ [Panier] Tailles GraphQL non chargées`);
          return null;
        }

        console.log(`📋 [Panier] Tailles GraphQL:`, sizesData.stockSizes);

        const tailleTrouvee = sizesData.stockSizes.find(
          (t: any) => t.name && t.name.toLowerCase() === tailleName.toLowerCase(),
        );

        if (tailleTrouvee?.id) {
          console.log(
            `✅ [Panier] taille_id trouvé (GraphQL): "${tailleName}" -> ${tailleTrouvee.id}`,
          );
          return Number(tailleTrouvee.id);
        }

        console.warn(`⚠️ [Panier] Taille "${tailleName}" non trouvée dans GraphQL`);
        return null;
      } catch (error) {
        console.error(`❌ [Panier] Erreur GraphQL tailles:`, error);
        return null;
      }
    };

    // CRITIQUE: Préparation des articles avec le snapshot
    console.log("📝 [Panier] Préparation des articles pour la commande (depuis snapshot)...");
    const articlesCommande = [];

    for (let index = 0; index < articlesSnapshot.length; index++) {
      const article = articlesSnapshot[index];
      console.log(`📝 [Panier] Traitement article ${index}:`, article);

      // ÉTAPE 1: Recherche du taille_id via différentes méthodes
      let taille_id = null;

      // Méthode 1: Dans les stocks de l'article
      if (article.stocks && Array.isArray(article.stocks)) {
        const stockTrouve = article.stocks.find(
          (stock: any) =>
            stock.taille && stock.taille.toLowerCase() === article.taille.toLowerCase(),
        );

        if (stockTrouve && stockTrouve.id) {
          taille_id = Number(stockTrouve.id);
          console.log(`✅ [Panier] taille_id depuis stock article: ${taille_id}`);
        }
      }

      // Méthode 2: Via l'API si pas trouvé
      if (!taille_id) {
        taille_id = await getTailleIdFromAPI(article.taille);
      }

      // Méthode 3: Mapping de fallback hardcodé
      if (!taille_id) {
        const tailleMapping: Record<string, number> = {
          XS: 1,
          S: 2,
          M: 3,
          L: 4,
          XL: 5,
          XXL: 6,
          "34": 7,
          "36": 8,
          "38": 9,
          "40": 10,
          "42": 11,
          "44": 12,
        };

        taille_id = tailleMapping[article.taille.toUpperCase()];

        if (taille_id) {
          console.log(`✅ [Panier] taille_id depuis mapping: ${taille_id}`);
        }
      }

      // ÉTAPE 2: Validation finale du taille_id
      if (!taille_id || isNaN(taille_id) || taille_id <= 0) {
        console.error(`❌ [Panier] IMPOSSIBLE de trouver taille_id pour "${article.taille}"`);
        alert(
          `Erreur: Impossible de traiter la taille "${article.taille}" pour l'article "${article.nom}". Veuillez contacter le support.`,
        );
        return;
      }

      // ÉTAPE 3: Créer l'objet article avec TOUS les champs requis
      const articleCommande = {
        article_id: Number(article.id),
        taille_id: Number(taille_id),
        quantite: Number(article.quantite),
        prix: Number(article.prix),
      };

      console.log(`✅ [Panier] Article ${index} préparé avec taille_id:`, articleCommande);

      // ÉTAPE 4: Validation finale
      if (isNaN(articleCommande.article_id) || articleCommande.article_id <= 0) {
        console.error(
          `❌ [Panier] article_id invalide pour article ${index}:`,
          articleCommande.article_id,
        );
        alert(`Erreur: ID article invalide pour "${article.nom}"`);
        return;
      }

      if (isNaN(articleCommande.taille_id) || articleCommande.taille_id <= 0) {
        console.error(
          `❌ [Panier] taille_id invalide pour article ${index}:`,
          articleCommande.taille_id,
        );
        alert(`Erreur: ID taille invalide pour "${article.nom}" taille "${article.taille}"`);
        return;
      }

      if (isNaN(articleCommande.quantite) || articleCommande.quantite <= 0) {
        console.error(
          `❌ [Panier] quantite invalide pour article ${index}:`,
          articleCommande.quantite,
        );
        alert(`Erreur: Quantité invalide pour "${article.nom}"`);
        return;
      }

      if (isNaN(articleCommande.prix) || articleCommande.prix <= 0) {
        console.error(`❌ [Panier] prix invalide pour article ${index}:`, articleCommande.prix);
        alert(`Erreur: Prix invalide pour "${article.nom}"`);
        return;
      }

      articlesCommande.push(articleCommande);
    }

    console.log("📋 [Panier] Articles finaux pour commande avec taille_id:", articlesCommande);

    // ÉTAPE 5: Vérification finale
    if (articlesCommande.length === 0) {
      console.error("❌ [Panier] Aucun article valide après préparation!");
      alert("Erreur: Aucun article valide dans le panier.");
      return;
    }

    // ÉTAPE 6: Calculer le total
    const total = articlesCommande.reduce(
      (acc, article) => acc + article.prix * article.quantite,
      0,
    );

    // ÉTAPE 7: Créer la commande avec la structure EXACTE attendue par le backend
    const nouvelleCommande = {
      utilisateur_id: utilisateur_id,
      articles: articlesCommande,
      total: Number(total.toFixed(2)),
      statut: "en_attente",
      date: new Date().toISOString(),
    };

    // NOUVEAU: Sauvegarder la commande finale dans userData pour récupération
    try {
      const userDataObj = JSON.parse(localStorage.getItem("userData") || "{}");
      userDataObj.commandeFinale = {
        commande: nouvelleCommande,
        articlesOriginaux: articlesSnapshot,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("userData", JSON.stringify(userDataObj));
      console.log("💾 [Panier] Commande finale sauvegardée dans userData");
    } catch (finalSaveError) {
      console.warn("⚠️ [Panier] Erreur sauvegarde finale:", finalSaveError);
    }

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        JSON.parse(localStorage.getItem("userData") || "{}").token;

      const requestBody = {
        amount: Math.round(total * 100),
        currency: "eur",
        commande: nouvelleCommande,
        description: `Commande magasin - ${articlesCommande.length} article(s)`,
      };

      console.log("📡 [Panier] Requête finale avec articles sauvegardés:", requestBody);

      const response = await fetch(apiUrl("paiements/stripe/create-payment-intent-commande"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ [Panier] PaymentIntent créé:", data);

        // CORRIGÉ: Récupérer l'ID de commande depuis la réponse avec priorités
        const commandeId = data.commande_id || data.commande?.id || data.commandeId;

        if (!commandeId) {
          console.error("❌ [Panier] ID de commande manquant dans la réponse:", {
            response: data,
            hasCommandeId: !!data.commande_id,
            hasCommandeObj: !!data.commande,
            hasCommandeObjId: !!data.commande?.id,
            hasOldCommandeId: !!data.commandeId,
            allKeys: Object.keys(data),
          });

          // AJOUTÉ: Fallback - essayer de récupérer depuis userData si disponible
          try {
            const userDataObj = JSON.parse(localStorage.getItem("userData") || "{}");
            const fallbackCommandeId =
              userDataObj.dernierCommandeId || userDataObj.derniereCommande?.commandeId;

            if (fallbackCommandeId) {
              console.log(
                "🔄 [Panier] Utilisation fallback commandeId depuis userData:",
                fallbackCommandeId,
              );
              const paiementUrl = `/pages/paiement?commande=${fallbackCommandeId}&userId=${utilisateur_id}`;
              console.log("🔄 [Panier] Redirection avec fallback vers:", paiementUrl);
              navigate(paiementUrl);
              viderPanier();
              return;
            }
          } catch (fallbackError) {
            console.error("❌ [Panier] Erreur fallback userData:", fallbackError);
          }

          alert("Erreur: ID de commande non retourné par le serveur. Veuillez réessayer.");
          return;
        }

        console.log("✅ [Panier] ID de commande récupéré:", commandeId);

        // CRITIQUE: Sauvegarder l'ID de commande dans userData
        try {
          const userDataObj = JSON.parse(localStorage.getItem("userData") || "{}");
          userDataObj.dernierCommandeId = commandeId;
          userDataObj.derniereCommande = {
            commandeId,
            paymentIntentId: data.payment_intent_id,
            articles: articlesSnapshot,
            total: total,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem("userData", JSON.stringify(userDataObj));
          console.log("💾 [Panier] ID de commande sauvegardé:", commandeId);
        } catch (idSaveError) {
          console.warn("⚠️ [Panier] Erreur sauvegarde ID commande:", idSaveError);
        }

        const paiementUrl = `/pages/paiement?commande=${commandeId}&userId=${utilisateur_id}`;
        console.log("🔄 [Panier] Redirection vers:", paiementUrl);

        navigate(paiementUrl);

        // CRITIQUE: Vider le panier SEULEMENT après le succès
        viderPanier();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ [Panier] Erreur API:", errorData);

        if (errorData.error?.includes("Articles manquants")) {
          console.error("❌ [Panier] DEBUG ARTICLES MANQUANTS AVEC SAUVEGARDES:");
          console.error("❌ [Panier] Snapshot articles (sauvegardé):", articlesSnapshot);
          console.error("❌ [Panier] Articles props (actuels):", articles);
          console.error("❌ [Panier] Articles Redux (actuels):", panierRedux.articles);
          console.error("❌ [Panier] Articles préparés:", articlesCommande);
          console.error("❌ [Panier] Requête envoyée:", JSON.stringify(requestBody, null, 2));

          alert(`Erreur: Articles manquants côté serveur.
Vos articles ont été sauvegardés et vous pouvez réessayer.`);
        } else {
          alert(
            `Erreur: ${errorData.error || errorData.message || "Erreur lors de la création de la commande"}`,
          );
        }
      }
    } catch (error: any) {
      console.error("❌ [Panier] Erreur réseau:", error);
      alert(`Erreur réseau: ${error.message}
Vos articles ont été sauvegardés et vous pouvez réessayer.`);
    }
  };

  const toggleSelect = (toggleRef: React.Ref<any>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsSelectOpen(!isSelectOpen)}
      isExpanded={isSelectOpen}
    >
      {selectedTaille || "Sélectionner une taille"}
    </MenuToggle>
  );

  // MODIFIÉ: Calculer le total avec articles au lieu de localArticles
  const totalPrice = articles.reduce((total, article, index) => {
    // Si l'article est en cours d'édition, utilise la quantité temporaire
    const quantite = editingIndex === index ? quantiteTemp : article.quantite || 0;
    return total + article.prix * quantite;
  }, 0);

  // Fonction pour dédupliquer les stocks par taille
  const deduplicateStocks = (stocks: Array<{ taille: string; quantite: number }>) => {
    return (
      stocks?.reduce((acc: any[], stock: any) => {
        const existingStock = acc.find((s) => s.taille === stock.taille);
        if (existingStock) {
          existingStock.quantite += stock.quantite;
        } else {
          acc.push({ taille: stock.taille, quantite: stock.quantite });
        }
        return acc;
      }, []) || []
    );
  };

  // Ajouter une fonction pour annuler l'édition proprement
  const annulerEdition = () => {
    setEditingIndex(null);
    setSelectedTaille(null);
    setQuantiteTemp(1);
    setIsSelectOpen(false);
  };

  // Calculer le total du panier
  const calculerTotal = () => {
    return articles.reduce((total, article) => {
      return total + article.prix * (article.quantite || 1);
    }, 0);
  };

  // Créer l'objet commande pour le paiement
  const creerCommande = () => {
    return {
      utilisateur_id: user?.id,
      articles: articles.map((article) => ({
        article_id: article.id,
        nom: article.nom,
        prix: article.prix,
        quantite: article.quantite || 1,
        taille: article.taille,
      })),
      total: calculerTotal(),
      date_commande: new Date().toISOString(),
    };
  };

  // Gérer le passage au paiement
  const handleProceedToPayment = () => {
    if (articles.length === 0) {
      alert("Votre panier est vide");
      return;
    }

    if (!user) {
      alert("Vous devez être connecté pour effectuer un achat");
      return;
    }

    setShowPaymentForm(true);
  };

  // Fermer le formulaire de paiement
  const handleClosePayment = () => {
    setShowPaymentForm(false);
  };

  return (
    <Drawer
      isExpanded={isExpanded}
      style={{
        position: "relative",
      }}
    >
      <DrawerContent
        panelContent={
          <DrawerPanelContent
            widths={{ default: "width_33" }}
            className="right-panel"
            style={{
              background: "#f8f9fa",
              borderLeft: "1px solid #e0e0e0",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* AJOUTÉ: Bouton debug en développement */}
            {process.env.NODE_ENV === "development" && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  zIndex: 1000,
                }}
              >
                <button
                  style={{
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    cursor: "pointer",
                  }}
                >
                  🔍 Debug
                </button>
              </div>
            )}

            {/* Header avec background différent */}
            <div
              style={{
                padding: "1.5rem 1.5rem 1rem",
                borderBottom: "1px solid #e9ecef",
                background: "#ffffff",
                flexShrink: 0,
              }}
            >
              <Flex
                justifyContent={{ default: "justifyContentSpaceBetween" }}
                alignItems={{ default: "alignItemsCenter" }}
              >
                <Title
                  headingLevel="h2"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#2c3e50",
                    margin: 0,
                  }}
                >
                  Panier
                  {/* AJOUTÉ: Affichage debug du nombre d'articles */}
                  {process.env.NODE_ENV === "development" && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#007bff",
                        marginLeft: "10px",
                        background: "#e3f2fd",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {articles?.length || 0} articles
                    </span>
                  )}
                </Title>
                <DrawerCloseButton
                  onClick={onClose}
                  style={{
                    color: "#7f8c8d",
                    fontSize: "1.2rem",
                  }}
                />
              </Flex>
            </div>

            {/* Contenu scrollable */}
            <div
              style={{
                padding: "1rem",
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* MODIFIÉ: Utiliser articles au lieu de localArticles */}
              {articles.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    color: "#95a5a6",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "3rem",
                      marginBottom: "1rem",
                      opacity: 0.3,
                    }}
                  >
                    🛒
                  </div>
                  <Title headingLevel="h4" style={{ color: "#7f8c8d", marginBottom: "0.5rem" }}>
                    Panier vide
                  </Title>
                  <p style={{ fontSize: "0.9rem", margin: 0 }}>
                    Ajoutez des articles depuis le magasin
                  </p>
                </div>
              ) : (
                <>
                  {/* Articles - Zone scrollable */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      marginBottom: "1rem",
                    }}
                  >
                    {/* MODIFIÉ: Utiliser articles au lieu de localArticles */}
                    {articles.map((article, index) => (
                      <div
                        key={`${article.id}-${index}`}
                        style={{
                          background: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #f0f0f0",
                          marginBottom: "0.75rem",
                          transition: "all 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        {editingIndex === index ? (
                          /* Mode édition avec stocks ajustés */
                          <div style={{ padding: "1.25rem" }}>
                            <div style={{ marginBottom: "1rem" }}>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: "500",
                                  color: "#34495e",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                Taille
                              </div>

                              <Select
                                isOpen={isSelectOpen}
                                selected={selectedTaille}
                                onSelect={(_e, value) => {
                                  setSelectedTaille(value as Taille);
                                  setIsSelectOpen(false);
                                  setQuantiteTemp(1);
                                }}
                                onOpenChange={setIsSelectOpen}
                                toggle={toggleSelect}
                                style={{ width: "100%" }}
                              >
                                <SelectList>
                                  {article.stocks
                                    ?.filter((stock: any) => {
                                      const maxPossible = getMaxQuantitePossible(
                                        article,
                                        stock.taille,
                                        index,
                                      );
                                      return maxPossible > 0;
                                    })
                                    .map((stock: any, i: number) => {
                                      const stockReellement = getStockReellementDisponible(
                                        article,
                                        stock.taille,
                                        index,
                                      );
                                      const maxPossible = getMaxQuantitePossible(
                                        article,
                                        stock.taille,
                                        index,
                                      );

                                      return (
                                        <SelectOption
                                          key={`${stock.taille}-${i}-${quantiteTemp}`}
                                          value={stock.taille}
                                        >
                                          Taille {stock.taille} ({stockReellement} dispo, max{" "}
                                          {maxPossible})
                                        </SelectOption>
                                      );
                                    })}
                                </SelectList>
                              </Select>
                            </div>

                            <div style={{ marginBottom: "1.25rem" }}>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: "500",
                                  color: "#34495e",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                Quantité
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setQuantiteTemp(Math.max(1, quantiteTemp - 1))}
                                  isDisabled={quantiteTemp <= 1}
                                  style={{
                                    minWidth: "32px",
                                    height: "32px",
                                    padding: 0,
                                    borderRadius: "6px",
                                  }}
                                >
                                  -
                                </Button>
                                <TextInput
                                  type="number"
                                  value={quantiteTemp}
                                  onChange={(_e, value) => {
                                    const newValue = parseInt(value) || 1;
                                    const maxStock = selectedTaille
                                      ? getMaxQuantitePossible(article, selectedTaille, index)
                                      : 0;
                                    setQuantiteTemp(Math.min(Math.max(1, newValue), maxStock));
                                  }}
                                  min="1"
                                  max={
                                    selectedTaille
                                      ? getMaxQuantitePossible(article, selectedTaille, index)
                                      : 1
                                  }
                                  style={{
                                    width: "60px",
                                    textAlign: "center",
                                    borderRadius: "6px",
                                    border: "1px solid #e0e0e0",
                                    fontSize: "0.9rem",
                                  }}
                                />
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    const maxStock = selectedTaille
                                      ? getMaxQuantitePossible(article, selectedTaille, index)
                                      : 0;
                                    setQuantiteTemp(Math.min(quantiteTemp + 1, maxStock));
                                  }}
                                  isDisabled={
                                    !selectedTaille ||
                                    quantiteTemp >=
                                      getMaxQuantitePossible(article, selectedTaille, index)
                                  }
                                  style={{
                                    minWidth: "32px",
                                    height: "32px",
                                    padding: 0,
                                    borderRadius: "6px",
                                  }}
                                >
                                  +
                                </Button>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#7f8c8d",
                                    marginLeft: "0.5rem",
                                  }}
                                >
                                  {selectedTaille &&
                                    `max: ${getMaxQuantitePossible(article, selectedTaille, index)}`}
                                </div>
                              </div>

                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#7f8c8d",
                                  fontWeight: "500",
                                }}
                              >
                                Sous-total: {(article.prix * quantiteTemp).toFixed(2)} €
                              </div>
                            </div>

                            <Flex gap={{ default: "gapSm" }}>
                              <Button
                                variant="primary"
                                onClick={() => validerEdition(index)}
                                size="sm"
                                style={{
                                  flex: 1,
                                  borderRadius: "8px",
                                  fontWeight: "500",
                                  fontSize: "0.85rem",
                                }}
                              >
                                Valider
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={annulerEdition}
                                size="sm"
                                style={{
                                  flex: 1,
                                  borderRadius: "8px",
                                  fontWeight: "500",
                                  fontSize: "0.85rem",
                                }}
                              >
                                Annuler
                              </Button>
                            </Flex>
                          </div>
                        ) : (
                          /* Mode affichage - Design minimal */
                          <div style={{ padding: "1.25rem" }}>
                            <Flex
                              alignItems={{ default: "alignItemsCenter" }}
                              style={{ marginBottom: "1rem" }}
                            >
                              {article.images?.[0] && (
                                <div
                                  style={{
                                    marginRight: "1rem",
                                    flexShrink: 0,
                                  }}
                                >
                                  <img
                                    src={article.images[0]}
                                    alt={article.nom}
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      objectFit: "cover",
                                      borderRadius: "8px",
                                      border: "1px solid #f0f0f0",
                                    }}
                                  />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "0.95rem",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "0.25rem",
                                    lineHeight: "1.2",
                                  }}
                                >
                                  {article.nom}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.85rem",
                                    color: "#7f8c8d",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      background: "#ecf0f1",
                                      color: "#34495e",
                                      padding: "0.15rem 0.4rem",
                                      borderRadius: "4px",
                                      fontSize: "0.75rem",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {article.taille}
                                  </span>
                                  <span>×{article.quantite}</span>
                                </div>
                              </div>
                              <div
                                style={{
                                  fontSize: "1rem",
                                  fontWeight: "600",
                                  color: "#2c3e50",
                                  textAlign: "right",
                                }}
                              >
                                {(article.prix * (article.quantite || 0)).toFixed(2)} €
                              </div>
                            </Flex>

                            <Flex gap={{ default: "gapSm" }}>
                              <Button
                                variant="link"
                                onClick={() => startEditing(index)}
                                size="sm"
                                style={{
                                  flex: 1,
                                  fontSize: "0.8rem",
                                  color: "#3498db",
                                  padding: "0.5rem",
                                }}
                              >
                                Modifier
                              </Button>
                              <Button
                                variant="link"
                                onClick={() => onRemoveArticle(index)}
                                size="sm"
                                style={{
                                  flex: 1,
                                  fontSize: "0.8rem",
                                  color: "#e74c3c",
                                  padding: "0.5rem",
                                }}
                              >
                                Retirer
                              </Button>
                            </Flex>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Total et commande - Fixé en bas */}
            {/* MODIFIÉ: Utiliser articles au lieu de localArticles */}
            {articles.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  borderTop: "1px solid #e9ecef",
                  padding: "1.25rem",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#2c3e50",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "700",
                      color: "#2c3e50",
                    }}
                  >
                    {totalPrice.toFixed(2)} €
                  </span>
                </div>

                {/* MODIFIÉ: Bouton simplifié qui redirige vers la page de paiement */}
                <Button
                  variant="primary"
                  onClick={onPasserCommande}
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    background: "#3498db",
                    border: "none",
                  }}
                >
                  🛒 Finaliser la commande
                </Button>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#7f8c8d",
                    textAlign: "center",
                    marginTop: "0.5rem",
                  }}
                >
                  Vous serez redirigé vers la page de paiement sécurisée
                </div>
              </div>
            )}
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody style={{ padding: 0 }}>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default RightSidePanel;
