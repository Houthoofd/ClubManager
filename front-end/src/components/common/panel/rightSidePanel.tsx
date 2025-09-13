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
    if (selectedTaille && quantiteTemp > 0) {
      const updatedArticles = [...localArticles];
      updatedArticles[index].quantite = quantiteTemp;
      updatedArticles[index].taille = selectedTaille;
      setLocalArticles(updatedArticles);
      onUpdateQuantite(index, quantiteTemp, selectedTaille);
      setEditingIndex(null);
    } else {
      alert("Veuillez sélectionner une taille et une quantité valides.");
    }
  };

 const onPasserCommande = () => {
  const userData = localStorage.getItem('userData');
  if (!userData) {
    alert("Utilisateur non connecté.");
    return;
  }

  const user = JSON.parse(userData);
  const utilisateur_id = Number(user.data.id);

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
  console.log(nouvelleCommande)
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

  return (
    <Drawer isExpanded={isExpanded}>
      <DrawerContent
        panelContent={
          <DrawerPanelContent
            widths={{ default: 'width_33' }}
            className="right-panel"
          >
            <div className="panel-header">
              <Flex 
                justifyContent={{ default: 'justifyContentSpaceBetween' }} 
                alignItems={{ default: 'alignItemsCenter' }}
              >
                <Title 
                  headingLevel="h2" 
                  className="panel-title"
                >
                  Mon Panier
                </Title>
                <DrawerCloseButton 
                  onClick={onClose}
                  className="panel-close-button"
                />
              </Flex>
            </div>

            <Stack hasGutter style={{ padding: '1.5rem' }}>
              {localArticles.length === 0 ? (
                <div className="panel-empty-state">
                  <Title headingLevel="h4">
                    Votre panier est vide
                  </Title>
                  <p>
                    Ajoutez des articles depuis le magasin
                  </p>
                </div>
              ) : (
                <>
                  {localArticles.map((article, index) => (
                    <StackItem key={`${article.id}-${index}`}>
                      <div className="panel-article-card">
                        {/* Image et infos de base */}
                        <Flex alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '1rem' }}>
                          {article.images?.[0] && (
                            <FlexItem style={{ marginRight: '1rem' }}>
                              <img
                                src={article.images[0]}
                                alt={article.nom}
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '1px solid #dee2e6'
                                }}
                              />
                            </FlexItem>
                          )}
                          <FlexItem flex={{ default: 'flex_1' }}>
                            <Title headingLevel="h4" size="md" style={{ margin: 0, color: '#495057' }}>
                              {article.nom}
                            </Title>
                            <div style={{ 
                              fontSize: '1.1rem', 
                              fontWeight: 'bold', 
                              color: '#495057',
                              marginTop: '0.25rem'
                            }}>
                              {article.prix} €
                            </div>
                          </FlexItem>
                        </Flex>

                        {editingIndex === index ? (
                          /* Mode édition */
                          <div style={{
                            background: '#f8f9fa',
                            padding: '1rem',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                          }}>
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>
                                Taille :
                              </label>
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
                                  {article.stocks?.map((stock, i) => (
                                    <SelectOption key={i} value={stock.taille}>
                                      {stock.taille} ({stock.quantite} en stock)
                                    </SelectOption>
                                  ))}
                                </SelectList>
                              </Select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>
                                Quantité :
                              </label>
                              <TextInput
                                type="number"
                                value={quantiteTemp}
                                onChange={(_e, value) => setQuantiteTemp(Number(value))}
                                min="1"
                                max={article.stocks?.find(stock => stock.taille === selectedTaille)?.quantite || 1}
                                style={{ borderRadius: '4px' }}
                              />
                              <div style={{ 
                                fontSize: '0.9rem', 
                                color: '#6c757d',
                                marginTop: '0.5rem'
                              }}>
                                Sous-total: {(article.prix * quantiteTemp).toFixed(2)} €
                              </div>
                            </div>

                            <Flex gap={{ default: 'gapSm' }}>
                              <Button
                                variant="primary"
                                onClick={() => validerEdition(index)}
                                size="sm"
                                style={{ flex: 1 }}
                              >
                                Valider
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => setEditingIndex(null)}
                                size="sm"
                                style={{ flex: 1 }}
                              >
                                Annuler
                              </Button>
                            </Flex>
                          </div>
                        ) : (
                          /* Mode affichage */
                          <div>
                            <Flex 
                              justifyContent={{ default: 'justifyContentSpaceBetween' }}
                              alignItems={{ default: 'alignItemsCenter' }}
                              style={{ marginBottom: '1rem' }}
                            >
                              <div>
                                <span style={{ 
                                  background: '#6c757d',
                                  color: 'white',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  marginRight: '0.5rem'
                                }}>
                                  {article.taille}
                                </span>
                                <span style={{ color: '#495057' }}>
                                  Quantité: {article.quantite}
                                </span>
                              </div>
                              <div style={{
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>
                                {(article.prix * (article.quantite || 0)).toFixed(2)} €
                              </div>
                            </Flex>

                            <Flex gap={{ default: 'gapSm' }}>
                              <Button
                                variant="secondary"
                                onClick={() => startEditing(index)}
                                size="sm"
                                style={{ flex: 1 }}
                              >
                                Modifier
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => onRemoveArticle(index)}
                                size="sm"
                                style={{ flex: 1 }}
                              >
                                Supprimer
                              </Button>
                            </Flex>
                          </div>
                        )}
                      </div>
                    </StackItem>
                  ))}

                  {/* Résumé de la commande */}
                  <StackItem>
                    <div className="panel-total-section">
                      <Title headingLevel="h3" style={{ 
                        color: '#495057', 
                        margin: '0 0 1rem 0'
                      }}>
                        Total: {totalPrice.toFixed(2)} €
                      </Title>
                      <Button
                        variant="primary"
                        onClick={onPasserCommande}
                        size="lg"
                        style={{
                          width: '100%',
                          padding: '0.75rem'
                        }}
                      >
                        Passer la commande
                      </Button>
                    </div>
                  </StackItem>
                </>
              )}
            </Stack>
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
                    