import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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
import PaymentForm from '../form/paymentForm';
// Import des types (à ajuster selon ton arborescence)
import type { Article, Taille } from '@clubmanager/types';

export type RightSidePanelProps = {
  isExpanded: boolean;
  onClose: () => void;
  articles: Article[];
  onRemoveArticle: (index: number) => void;
  onUpdateQuantite: (index: number, quantite: number, taille: string) => void;
  onUpdateTaille: (index: number, nouvelleTaille: string) => void; // à ajouter
  children?: ReactNode;
};

const RightSidePanel = ({
  isExpanded,
  onClose,
  articles,
  onRemoveArticle,
  onUpdateQuantite,
  children
}: RightSidePanelProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedTaille, setSelectedTaille] = useState<Taille | null>(null);
  const [quantiteTemp, setQuantiteTemp] = useState<number>(1);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [localArticles, setLocalArticles] = useState<Article[]>(articles);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [commande, setCommande] = useState<any>(null);


  useEffect(() => {
    setLocalArticles(articles);
  }, [articles]);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setSelectedTaille(localArticles[index].taille as Taille || null);
    setQuantiteTemp(localArticles[index].quantite || 1);
  };

  const validerEdition = (index: number) => {
    console.log('=== DEBUT VALIDATION ===');
    console.log('Index:', index);
    console.log('selectedTaille:', selectedTaille);
    console.log('quantiteTemp:', quantiteTemp);
    console.log('localArticles[index]:', localArticles[index]);
    
    // Utiliser la taille actuelle si selectedTaille n'est pas définie
    const tailleAUtiliser = selectedTaille || localArticles[index].taille;
    const quantiteAUtiliser = quantiteTemp > 0 ? quantiteTemp : 1;
    
    console.log('tailleAUtiliser:', tailleAUtiliser);
    console.log('quantiteAUtiliser:', quantiteAUtiliser);
    console.log('Condition (tailleAUtiliser && quantiteAUtiliser > 0):', tailleAUtiliser && quantiteAUtiliser > 0);
    
    if (tailleAUtiliser && quantiteAUtiliser > 0) {
      console.log('Condition validée - Mise à jour...');
      
      const updatedArticles = [...localArticles];
      // Créer une copie complète de l'objet article au lieu de modifier directement
      updatedArticles[index] = {
        ...updatedArticles[index],
        quantite: quantiteAUtiliser,
        taille: tailleAUtiliser
      };
      
      console.log('updatedArticles[index] AVANT setLocalArticles:', updatedArticles[index]);
      
      setLocalArticles(updatedArticles);
      
      console.log('Appel onUpdateQuantite avec:', index, quantiteAUtiliser, tailleAUtiliser);
      onUpdateQuantite(index, quantiteAUtiliser, tailleAUtiliser as string);
      
      console.log('Réinitialisation des états...');
      // Réinitialiser les états d'édition
      setEditingIndex(null);
      setSelectedTaille(null);
      setQuantiteTemp(1);
      setIsSelectOpen(false);
      
      console.log('=== FIN VALIDATION SUCCESS ===');
    } else {
      console.log('Condition échouée - Alert...');
      alert("Veuillez sélectionner une taille et une quantité valides.");
      console.log('=== FIN VALIDATION ECHEC ===');
    }
  };

 const onPasserCommande = () => {
  const userData = localStorage.getItem('userData');
  if (!userData) {
    alert("Utilisateur non connecté.");
    return;
  }

  const user = JSON.parse(userData);
  console.log('User data from localStorage:', user); // Debug log
  
  // Corriger l'accès à l'ID utilisateur selon la structure réelle
  const utilisateur_id = Number(user.id || user.data?.id || user.user?.id);
  
  if (!utilisateur_id || isNaN(utilisateur_id)) {
    console.error('ID utilisateur non trouvé dans:', user);
    alert("Erreur: ID utilisateur non trouvé.");
    return;
  }

  const articles = localArticles.map(article => ({
    article_id: Number(article.id),
    quantite: Number(article.quantite),
    prix: Number(article.prix),
    taille: article.taille ?? undefined,  // taille reste string ou undefined
  }));

  const total = articles.reduce((acc, article) => acc + article.prix * article.quantite, 0);

  const nouvelleCommande = {
    utilisateur_id,
    articles,
    total: Number(total.toFixed(2)),
    statut: 'en_attente',
    date: new Date().toISOString(),
  };
  console.log('Commande à envoyer:', nouvelleCommande);
  setCommande(nouvelleCommande);
  setIsPaymentModalOpen(true);
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

  const totalPrice = localArticles.reduce((total, article, index) => {
    // Si l'article est en cours d'édition, utilise la quantité temporaire
    const quantite = editingIndex === index ? quantiteTemp : (article.quantite || 0);
    return total + article.prix * quantite;
  }, 0);

  console.log(totalPrice)

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

  return (
    <Drawer 
      isExpanded={isExpanded}
      style={{
        // Supprimer le style qui perturbait le layout
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
              {localArticles.length === 0 ? (
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
                    {localArticles.map((article, index) => (
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
                          /* Mode édition - Design épuré */
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
                                }}
                                onOpenChange={setIsSelectOpen}
                                toggle={toggleSelect}
                                style={{ width: '100%' }}
                              >
                                <SelectList>
                                  {deduplicateStocks(article.stocks || []).map((stock, i) => (
                                    <SelectOption key={i} value={stock.taille}>
                                      {stock.taille} ({stock.quantite} disponible)
                                    </SelectOption>
                                  ))}
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
                              <TextInput
                                type="number"
                                value={quantiteTemp}
                                onChange={(_e, value) => setQuantiteTemp(Number(value))}
                                min="1"
                                max={article.stocks?.find(stock => stock.taille === selectedTaille)?.quantite || 1}
                                style={{ 
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0',
                                  fontSize: '0.9rem'
                                }}
                              />
                              <div style={{ 
                                fontSize: '0.8rem', 
                                color: '#7f8c8d',
                                marginTop: '0.5rem',
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
            {localArticles.length > 0 && (
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
                  Passer la commande
                </Button>
              </div>
            )}
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody style={{ padding: 0 }}>
          {children}
        </DrawerContentBody>
      </DrawerContent>

      {/* Modal de paiement */}
      <Modal
        variant="large"
        title="Finaliser votre commande"
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      >
        {commande && (
          <PaymentForm
            commande={commande}
            onSuccess={() => {
              setIsPaymentModalOpen(false);
              onClose();
            }}
            onCancel={() => setIsPaymentModalOpen(false)}
          />
        )}
      </Modal>
    </Drawer>
  );
};

export default RightSidePanel;
