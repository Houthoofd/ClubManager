import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../../pages/apiUrl'; // AJOUTÉ: Import de la fonction apiUrl
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
  Modal
} from '@patternfly/react-core';
import PaymentForm from '../../common/form/paymentForm';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

// Import des types (à ajuster selon ton arborescence)
import type { Article, Taille } from '@clubmanager/types';

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
  articles,
  onRemoveArticle,
  onUpdateQuantite,
  onViderPanier, // AJOUTÉ: Récupération de la prop
  children
}: RightSidePanelProps) => {
  const navigate = useNavigate();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedTaille, setSelectedTaille] = useState<Taille | null>(null);
  const [quantiteTemp, setQuantiteTemp] = useState<number>(1);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [commande, setCommande] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

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
          quantitesReservees[item.taille] = (quantitesReservees[item.taille] || 0) + quantiteActuelle;
        } else {
          quantitesReservees[item.taille] = (quantitesReservees[item.taille] || 0) + (item.quantite || 0);
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
        quantite: nouvelleQuantite
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
  const getMaxStockForTailleAvecQuantiteTemp = (article: Article, taille: string, articleIndex: number): number => {
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
      note: "Stock disponible = stock original - réservé par autres (sans compter l'article en cours)"
    });
    
    return stockDisponible;
  };

  // ALTERNATIVE: Si vous voulez vraiment soustraire la quantité de l'article en cours d'édition
  const getMaxStockForTailleAvecQuantiteActuelle = (article: Article, taille: string, articleIndex: number): number => {
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
      note: "Stock disponible = stock original - TOUTES les réservations"
    });
    
    // AJOUTÉ: Ajouter la quantité actuelle de l'article en cours car on peut la "récupérer"
    const quantiteActuelle = articles[articleIndex]?.quantite || 0;
    const stockMaxPossible = stockDisponible + quantiteActuelle;
    
    console.log(`🔢 [RightPanel] Stock max possible: ${stockDisponible} + ${quantiteActuelle} = ${stockMaxPossible}`);
    
    return stockMaxPossible;
  };

  // CORRIGÉ: Fonction pour afficher le stock disponible en tenant compte de TOUTES les réservations
  const getStockReellementDisponible = (article: Article, taille: string, articleIndex: number): number => {
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
  const getMaxQuantitePossible = (article: Article, taille: string, articleIndex: number): number => {
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
    setSelectedTaille(articles[index].taille as Taille || null);
    setQuantiteTemp(articles[index].quantite || 1);
  };

  const validerEdition = (index: number) => {
    const tailleAUtiliser = selectedTaille || articles[index].taille;
    const quantiteAUtiliser = quantiteTemp > 0 ? quantiteTemp : 1;

    // Vérifier si la quantité est disponible
    const maxStock = getMaxStockForTaille(articles[index], tailleAUtiliser as string, index);

    if (quantiteAUtiliser > maxStock) {
      alert(`Stock insuffisant ! Maximum disponible pour la taille ${tailleAUtiliser}: ${maxStock}`);
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
  const userData = localStorage.getItem('userData');
  if (!userData) {
    alert("Utilisateur non connecté.");
    return;
  }

  const user = JSON.parse(userData);
  console.log('🛒 [Panier] User data from localStorage:', user);
  
  // Corriger l'accès à l'ID utilisateur selon la structure réelle
  const utilisateur_id = Number(user.id || user.data?.id || user.user?.id);
  
  if (!utilisateur_id || isNaN(utilisateur_id)) {
    console.error('ID utilisateur non trouvé dans:', user);
    alert("Erreur: ID utilisateur non trouvé.");
    return;
  }

  // MODIFIÉ: Utiliser articles au lieu de localArticles
  if (articles.length === 0) {
    alert("Votre panier est vide.");
    return;
  }

  // Préparer les articles pour la commande
  const articlesCommande = articles.map(article => ({
    article_id: Number(article.id),
    quantite: Number(article.quantite),
    prix: Number(article.prix),
    taille: article.taille ?? undefined,
  }));

  const total = articlesCommande.reduce((acc, article) => acc + article.prix * article.quantite, 0);

  // Créer la commande temporaire pour le panier
  const nouvelleCommande = {
    utilisateur_id,
    articles: articlesCommande,
    total: Number(total.toFixed(2)),
    statut: 'en_attente',
    date: new Date().toISOString(),
  };
  
  console.log('🛒 [Panier] Commande préparée:', nouvelleCommande);

  try {
    // MODIFIÉ: Utiliser articles au lieu de localArticles
    const panierPourSauvegarde = {
      articles: articles.map(article => ({
        id: article.id,
        nom: article.nom,
        prix: article.prix,
        quantite: article.quantite,
        taille: article.taille,
        image: article.images?.[0] || null
      })),
      total: total,
      timestamp: Date.now(),
      utilisateur_id: utilisateur_id
    };
    
    localStorage.setItem('dernierPanier', JSON.stringify(panierPourSauvegarde));
    console.log('💾 [Panier] Données sauvegardées dans localStorage:', panierPourSauvegarde);

    console.log('🔄 [Panier] Création PaymentIntent pour commande...');
    
    const token = localStorage.getItem('token') || 
                 localStorage.getItem('authToken') || 
                 JSON.parse(localStorage.getItem('userData') || '{}').token;

    const response = await fetch(apiUrl('paiements'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({
        amount: Math.round(total * 100), // Montant en centimes
        currency: 'eur',
        commande: nouvelleCommande,
        utilisateur_id: utilisateur_id,
        description: `Commande magasin - ${articlesCommande.length} article(s)`
      })
    });

    console.log('📡 [Panier] Réponse API:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ [Panier] Paiement créé avec succès:', data);

      // CORRIGÉ: Gérer les différents formats de réponse
      const commandeId = data.commandeId || data.commande_id;
      const paymentIntentId = data.paymentIntentId || data.payment_intent_id;
      
      if (!commandeId) {
        console.error('❌ [Panier] ID de commande manquant dans la réponse:', data);
        throw new Error('ID de commande manquant dans la réponse du serveur');
      }

      // Sauvegarder les données dans localStorage pour le processus de paiement
      localStorage.setItem('dernierPanier', JSON.stringify({
        articles: articles,
        total: total,
        commandeId: commandeId,
        paymentIntentId: paymentIntentId
      }));

      // Rediriger vers la page de paiement
      const paiementUrl = `/pages/paiement?commande=${commandeId}&userId=${utilisateur_id}`;
      console.log('🔄 [Panier] Redirection vers:', paiementUrl);
      
      navigate(paiementUrl);
      
      // CORRIGÉ: Utiliser la fonction locale viderPanier
      viderPanier();
      
    } else {
      let errorMessage = 'Erreur lors de la création de la commande';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('❌ [Panier] Détails erreur API:', errorData);
      } catch (parseError) {
        console.error('❌ [Panier] Impossible de parser l\'erreur:', parseError);
      }
      
      setError(errorMessage);
    }

  } catch (error: any) {
    console.error('❌ [Panier] Erreur création commande:', error);
    localStorage.removeItem('dernierPanier');
    alert(`Erreur lors de la création de la commande: ${error.message}`);
  }
};

  const toggleSelect = (toggleRef: React.Ref<any>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsSelectOpen(!isSelectOpen)}
      isExpanded={isSelectOpen}
    >
      {selectedTaille || 'Sélectionner une taille'}
    </MenuToggle>
  );

  // MODIFIÉ: Calculer le total avec articles au lieu de localArticles
  const totalPrice = articles.reduce((total, article, index) => {
    // Si l'article est en cours d'édition, utilise la quantité temporaire
    const quantite = editingIndex === index ? quantiteTemp : (article.quantite || 0);
    return total + article.prix * quantite;
  }, 0);

  // Fonction pour dédupliquer les stocks par taille
  const deduplicateStocks = (stocks: Array<{ taille: string; quantite: number }>) => {
    return stocks?.reduce((acc: any[], stock: any) => {
      const existingStock = acc.find(s => s.taille === stock.taille);
      if (existingStock) {
        existingStock.quantite += stock.quantite;
      } else {
        acc.push({ taille: stock.taille, quantite: stock.quantite });
      }
      return acc;
    }, []) || [];
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
      return total + (article.prix * (article.quantite || 1));
    }, 0);
  };

  // Créer l'objet commande pour le paiement
  const creerCommande = () => {
    return {
      utilisateur_id: user?.id,
      articles: articles.map(article => ({
        article_id: article.id,
        nom: article.nom,
        prix: article.prix,
        quantite: article.quantite || 1,
        taille: article.taille
      })),
      total: calculerTotal(),
      date_commande: new Date().toISOString()
    };
  };

  // Gérer le passage au paiement
  const handleProceedToPayment = () => {
    if (articles.length === 0) {
      alert('Votre panier est vide');
      return;
    }
    
    if (!user) {
      alert('Vous devez être connecté pour effectuer un achat');
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
        position: 'relative'
      }}
    >
      <DrawerContent
        panelContent={
          <DrawerPanelContent
            widths={{ default: 'width_33' }}
            className="right-panel"
            style={{
              background: '#f8f9fa',
              borderLeft: '1px solid #e0e0e0',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Header avec background différent */}
            <div style={{
              padding: '1.5rem 1.5rem 1rem',
              borderBottom: '1px solid #e9ecef',
              background: '#ffffff',
              flexShrink: 0
            }}>
              <Flex 
                justifyContent={{ default: 'justifyContentSpaceBetween' }} 
                alignItems={{ default: 'alignItemsCenter' }}
              >
                <Title 
                  headingLevel="h2" 
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#2c3e50',
                    margin: 0
                  }}
                >
                  Panier
                </Title>
                <DrawerCloseButton 
                  onClick={onClose}
                  style={{
                    color: '#7f8c8d',
                    fontSize: '1.2rem'
                  }}
                />
              </Flex>
            </div>

            {/* Contenu scrollable */}
            <div style={{ 
              padding: '1rem',
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* MODIFIÉ: Utiliser articles au lieu de localArticles */}
              {articles.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: '#95a5a6',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🛒</div>
                  <Title headingLevel="h4" style={{ color: '#7f8c8d', marginBottom: '0.5rem' }}>
                    Panier vide
                  </Title>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>
                    Ajoutez des articles depuis le magasin
                  </p>
                </div>
              ) : (
                <>
                  {/* Articles - Zone scrollable */}
                  <div style={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    marginBottom: '1rem'
                  }}>
                    {/* MODIFIÉ: Utiliser articles au lieu de localArticles */}
                    {articles.map((article, index) => (
                      <div 
                        key={`${article.id}-${index}`}
                        style={{
                          background: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #f0f0f0',
                          marginBottom: '0.75rem',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        {editingIndex === index ? (
                          /* Mode édition avec stocks ajustés */
                          <div style={{ padding: '1.25rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                color: '#34495e',
                                marginBottom: '0.5rem'
                              }}>
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
                                style={{ width: '100%' }}
                              >
                                <SelectList>
                                  {article.stocks
                                    ?.filter((stock: any) => {
                                      const maxPossible = getMaxQuantitePossible(article, stock.taille, index);
                                      return maxPossible > 0;
                                    })
                                    .map((stock: any, i: number) => {
                                      const stockReellement = getStockReellementDisponible(article, stock.taille, index);
                                      const maxPossible = getMaxQuantitePossible(article, stock.taille, index);
                                      
                                      return (
                                        <SelectOption key={`${stock.taille}-${i}-${quantiteTemp}`} value={stock.taille}>
                                          Taille {stock.taille} ({stockReellement} dispo, max {maxPossible})
                                        </SelectOption>
                                      );
                                    })}
                                </SelectList>
                              </Select>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                              <div style={{
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                color: '#34495e',
                                marginBottom: '0.5rem'
                              }}>
                                Quantité
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                marginBottom: '0.5rem'
                              }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setQuantiteTemp(Math.max(1, quantiteTemp - 1))}
                                  isDisabled={quantiteTemp <= 1}
                                  style={{
                                    minWidth: '32px',
                                    height: '32px',
                                    padding: 0,
                                    borderRadius: '6px'
                                  }}
                                >
                                  -
                                </Button>
                                <TextInput
                                  type="number"
                                  value={quantiteTemp}
                                  onChange={(_e, value) => {
                                    const newValue = parseInt(value) || 1;
                                    const maxStock = selectedTaille ? 
                                      getMaxQuantitePossible(article, selectedTaille, index) : 
                                      0;
                                    setQuantiteTemp(Math.min(Math.max(1, newValue), maxStock));
                                  }}
                                  min="1"
                                  max={selectedTaille ? getMaxQuantitePossible(article, selectedTaille, index) : 1}
                                  style={{ 
                                    width: '60px',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    border: '1px solid #e0e0e0',
                                    fontSize: '0.9rem'
                                  }}
                                />
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    const maxStock = selectedTaille ? 
                                      getMaxQuantitePossible(article, selectedTaille, index) : 
                                      0;
                                    setQuantiteTemp(Math.min(quantiteTemp + 1, maxStock));
                                  }}
                                  isDisabled={
                                    !selectedTaille || 
                                    quantiteTemp >= getMaxQuantitePossible(article, selectedTaille, index)
                                  }
                                  style={{
                                    minWidth: '32px',
                                    height: '32px',
                                    padding: 0,
                                    borderRadius: '6px'
                                  }}
                                >
                                  +
                                </Button>
                                <div style={{ 
                                  fontSize: '0.8rem', 
                                  color: '#7f8c8d',
                                  marginLeft: '0.5rem'
                                }}>
                                  {selectedTaille && (
                                    `max: ${getMaxQuantitePossible(article, selectedTaille, index)}`
                                  )}
                                </div>
                              </div>
                              
                              <div style={{ 
                                fontSize: '0.8rem', 
                                color: '#7f8c8d',
                                fontWeight: '500'
                              }}>
                                Sous-total: {(article.prix * quantiteTemp).toFixed(2)} €
                              </div>
                            </div>

                            <Flex gap={{ default: 'gapSm' }}>
                              <Button
                                variant="primary"
                                onClick={() => validerEdition(index)}
                                size="sm"
                                style={{ 
                                  flex: 1,
                                  borderRadius: '8px',
                                  fontWeight: '500',
                                  fontSize: '0.85rem'
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
                                  borderRadius: '8px',
                                  fontWeight: '500',
                                  fontSize: '0.85rem'
                                }}
                              >
                                Annuler
                              </Button>
                            </Flex>
                          </div>
                        ) : (
                          /* Mode affichage - Design minimal */
                          <div style={{ padding: '1.25rem' }}>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '1rem' }}>
                              {article.images?.[0] && (
                                <div style={{ 
                                  marginRight: '1rem',
                                  flexShrink: 0
                                }}>
                                  <img
                                    src={article.images[0]}
                                    alt={article.nom}
                                    style={{
                                      width: '50px',
                                      height: '50px',
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                      border: '1px solid #f0f0f0'
                                    }}
                                  />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '0.95rem',
                                  fontWeight: '600',
                                  color: '#2c3e50',
                                  marginBottom: '0.25rem',
                                  lineHeight: '1.2'
                                }}>
                                  {article.nom}
                                </div>
                                <div style={{
                                  fontSize: '0.85rem',
                                  color: '#7f8c8d',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <span style={{
                                    background: '#ecf0f1',
                                    color: '#34495e',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }}>
                                    {article.taille}
                                  </span>
                                  <span>×{article.quantite}</span>
                                </div>
                              </div>
                              <div style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#2c3e50',
                                textAlign: 'right'
                              }}>
                                {(article.prix * (article.quantite || 0)).toFixed(2)} €
                              </div>
                            </Flex>

                            <Flex gap={{ default: 'gapSm' }}>
                              <Button
                                variant="link"
                                onClick={() => startEditing(index)}
                                size="sm"
                                style={{ 
                                  flex: 1,
                                  fontSize: '0.8rem',
                                  color: '#3498db',
                                  padding: '0.5rem'
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
                                  fontSize: '0.8rem',
                                  color: '#e74c3c',
                                  padding: '0.5rem'
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
              <div style={{
                background: '#ffffff',
                borderTop: '1px solid #e9ecef',
                padding: '1.25rem',
                flexShrink: 0
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Total
                  </span>
                  <span style={{
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    color: '#2c3e50'
                  }}>
                    {totalPrice.toFixed(2)} €
                  </span>
                </div>
                
                {/* MODIFIÉ: Bouton simplifié qui redirige vers la page de paiement */}
                <Button
                  variant="primary"
                  onClick={onPasserCommande}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    background: '#3498db',
                    border: 'none'
                  }}
                >
                  🛒 Finaliser la commande
                </Button>
                
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#7f8c8d',
                  textAlign: 'center',
                  marginTop: '0.5rem'
                }}>
                  Vous serez redirigé vers la page de paiement sécurisée
                </div>
              </div>
            )}
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody style={{ padding: 0 }}>
          {children}
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default RightSidePanel;

