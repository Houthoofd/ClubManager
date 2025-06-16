import React, { ReactNode, useState } from 'react';
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
} from '@patternfly/react-core';

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

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setSelectedTaille(null);
    setQuantiteTemp(1);
  };

  const validerEdition = (index: number) => {
    if (selectedTaille && quantiteTemp > 0) {
      onUpdateQuantite(index, quantiteTemp, selectedTaille);
      setEditingIndex(null);
    } else {
      alert("Veuillez sélectionner une taille et une quantité valides.");
    }
  };

  const toggleSelect = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsSelectOpen(!isSelectOpen)}
      isExpanded={isSelectOpen}
    >
      {selectedTaille || 'Sélectionner une taille'}
    </MenuToggle>
  );

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

              {articles.length === 0 && <StackItem>Votre panier est vide.</StackItem>}

              {articles.map((article, index) => {
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
            </Stack>
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody>
          {children}
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default RightSidePanel;
