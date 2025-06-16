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

type Stock = {
  taille: string;
  quantite: number;
};

type Article = {
  id: number;
  nom: string;
  description: string;
  prix: number;
  images: string[];
  stocks: Stock[];
  taille?: string;
  quantite?: number;
};

type RightSidePanelProps = {
  isExpanded: boolean;
  onClose: () => void;
  articles: Article[];
  onRemoveArticle: (index: number) => void;
  onUpdateQuantite: (index: number, quantite: number, taille: string) => void;
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
  const [selectedTaille, setSelectedTaille] = useState<string | null>(null);
  const [quantiteTemp, setQuantiteTemp] = useState<number>(1);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [localArticles, setLocalArticles] = useState<Article[]>(articles);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    setLocalArticles(articles);
  }, [articles]);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setSelectedTaille(localArticles[index].taille || null);
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

  const onPasserCommande = async () => {
    try {
      // Calculer le total avec localArticles
      setIsPaymentModalOpen(true);
      const total = localArticles.reduce((sum, article) => {
        return sum + article.prix * (article.quantite || 0);
      }, 0);
      const amountInCents = Math.round(total * 100);

      const response = await fetch('http://localhost:3000/paiements/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: amountInCents, currency: 'eur' })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du paiement');
      }

      const data = await response.json();
      console.log('Client secret reçu :', data.clientSecret);

      // TODO: Intégrer Stripe.js ici pour confirmer le paiement avec data.clientSecret
    } catch (error: any) {
      console.error(error);
      alert("Erreur lors de la commande : " + error.message);
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

  const totalPrice = localArticles.reduce((total, article) => {
    return total + article.prix * (article.quantite || 0);
  }, 0);

  return (
    <Drawer isExpanded={isExpanded} style={{ height: '100vh' }}>
      <DrawerContent
        panelContent={
          <DrawerPanelContent
            widths={{ default: '30%' }}
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
                                onSelect={(event, value) => {
                                  setSelectedTaille(value as string);
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
            hasNoBodyPadding
          >
            <PaymentForm />
          </Modal>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>

    
  );
};

export default RightSidePanel;
