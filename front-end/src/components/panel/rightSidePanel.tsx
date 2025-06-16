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
  TextInput
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
  onUpdateQuantite: (index: number, quantite: number) => void;
  children?: ReactNode; // <--- ici
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
  const [quantiteTemp, setQuantiteTemp] = useState<number>(1);

  const startEditing = (index: number, quantiteInitiale?: number) => {
    setEditingIndex(index);
    setQuantiteTemp(quantiteInitiale || 1);
  };

  const validerEdition = (index: number) => {
    if (quantiteTemp > 0) {
      onUpdateQuantite(index, quantiteTemp);
    }
    setEditingIndex(null);
  };

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

              {articles.map((article, index) => (
                <StackItem
                  key={`${article.id}-${index}`}
                  style={{ borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}
                >
                  <div>
                    <b>{article.nom}</b>
                    <p>{article.description}</p>
                    <p>Prix : {article.prix} €</p>
                    <p>Taille : {article.taille}</p>

                    {editingIndex === index ? (
                      <>
                        <TextInput
                          type="number"
                          min={1}
                          value={quantiteTemp}
                          onChange={(_e, val) => setQuantiteTemp(Number(val))}
                          style={{ width: '80px' }}
                        />
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
                      <p>Quantité : {article.quantite}</p>
                    )}

                    <Flex spaceItems={{ default: 'spaceItemsSm' }} style={{ marginTop: '0.5rem' }}>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          onClick={() => startEditing(index, article.quantite)}
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
              ))}
            </Stack>
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody>
          {children /* Ici le contenu enfant si nécessaire */}
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default RightSidePanel;
