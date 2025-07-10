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

type RightSidePanelProps = {
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

  const totalPrice = localArticles.reduce((total, article) => {
    return total + article.prix * (article.quantite || 0);
  }, 0);

  console.log(totalPrice)

  return (
    <Drawer isExpanded={isExpanded} style={{ height: '100vh' }}>
      <DrawerContent
        panelContent={
          <DrawerPanelContent
            widths={{ default: 'width_33' }}
            style={{ padding: '1rem', overflowY: 'auto', height: '100vh' }}
          >
            <Stack hasGutter>
              <StackItem>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <Title headingLevel="h2">Panier</Title>
                  <DrawerCloseButton onClick={onClose} />
                </Flex>
              </StackItem>

              {localArticles.length === 0 ? (
                <StackItem>Votre panier est vide.</StackItem>
              ) : (
                <>
                  {localArticles.map((article, index) => {
                    const stockDisponible = article.stocks;
                    const selectedStock = stockDisponible.find(stock => stock.taille === selectedTaille);

                    return (
                      <StackItem
                        key={`${article.id}-${index}`}
                        style={{ borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}
                      >
                        <div>
                          <b>{article.nom}</b>
                          <p>{article.description}</p>
                          <p>Prix : {article.prix} €</p>

                          {editingIndex === index ? (
                            <>
                              <Select
                                toggle={toggleSelect}
                                isOpen={isSelectOpen}
                                onSelect={(_event, value) => {
                                  setSelectedTaille(value as Taille);
                                  setIsSelectOpen(false);
                                }}
                                onOpenChange={setIsSelectOpen}
                              >
                                <SelectList>
                                  {stockDisponible.map((stock, idx) => (
                                    <SelectOption key={idx} value={stock.taille} />
                                  ))}
                                </SelectList>
                              </Select>

                              {selectedTaille && (
                                <TextInput
                                  id={`quantite-input-${index}`}
                                  type="number"
                                  min={1}
                                  max={selectedStock?.quantite || 1}
                                  value={quantiteTemp}
                                  onChange={(_e, val) => setQuantiteTemp(Number(val))}
                                  style={{ width: '80px', marginLeft: '0.5rem' }}
                                />
                              )}

                              <Button
                                variant="primary"
                                onClick={() => validerEdition(index)}
                                style={{ marginLeft: '0.5rem' }}
                              >
                                Valider
                              </Button>
                              <Button
                                variant="link"
                                onClick={() => setEditingIndex(null)}
                                style={{ marginLeft: '0.5rem' }}
                              >
                                Annuler
                              </Button>
                            </>
                          ) : (
                            <>
                              <p>Taille : {article.taille}</p>
                              <p>Quantité : {article.quantite}</p>
                            </>
                          )}

                          <Flex spaceItems={{ default: 'spaceItemsSm' }} style={{ marginTop: '0.5rem' }}>
                            <FlexItem>
                              <Button
                                variant="secondary"
                                onClick={() => startEditing(index)}
                              >
                                Modifier
                              </Button>
                            </FlexItem>
                            <FlexItem>
                              <Button variant="danger" onClick={() => onRemoveArticle(index)}>
                                Supprimer
                              </Button>
                            </FlexItem>
                          </Flex>
                        </div>
                      </StackItem>
                    );
                  })}
                </>
              )}

              <StackItem>
                <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                  <Title headingLevel="h4">Prix Total: {totalPrice.toFixed(2)} €</Title>
                </Flex>
              </StackItem>

              <StackItem>
                <Button variant="primary" onClick={() => onPasserCommande()} style={{ width: '100%' }}>
                  Passer Commande
                </Button>
              </StackItem>
            </Stack>
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody>
          {children}
          <Modal
            title="Paiement"
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            variant="medium"
            aria-label="Formulaire de paiement"
          >
            <PaymentForm totalAmount={totalPrice} commande={commande} onClose={() => setIsPaymentModalOpen(false)} />
          </Modal>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>

    
  );
};

export default RightSidePanel;
