import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Select,
  SelectOption,
  SelectList,
  Button,
  Alert,
  Spinner,
  EmptyState,
  EmptyStateBody,
  MenuToggle,
  NumberInput,
  Title,
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Gallery,
  GalleryItem,
  Label,
  ExpandableSection,
  Divider
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';
import { MultiImageUpload } from '../../components/fileUploader';
import { PriceInput } from '../../components/input/numberInput';

import { apiUrl } from '../apiUrl';

const AjouterArticle = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [categorieNom, setCategorieNom] = useState<string | null>(null);
  const [isCategorieOpen, setIsCategorieOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [stocks, setStocks] = useState([{ taille: 'S', quantite: 0 }]);
  const [message, setMessage] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [prix, setPrix] = useState('0');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: number; nom: string }[]>([]);
  const [articleEnEdition, setArticleEnEdition] = useState<any | null>(null);

  const tailles = ['S', 'M', 'L', 'XL'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(apiUrl('magasin/articles/categories'));
        if (!res.ok) throw new Error('Erreur lors du chargement des catégories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Erreur de chargement des catégories :', err);
      }
    };

    fetchCategories();
  }, []);

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    const parsedIndex = typeof tabIndex === 'string' ? parseInt(tabIndex, 10) : tabIndex;
    setActiveTabKey(parsedIndex);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !categorieId || !prix) return;

    const articlePayload = {
      nom,
      description,
      prix,
      categorie_id: categorieId,
      images: imageUrls,
      stocks,
    };

    try {
      const url = articleEnEdition
        ? apiUrl(`magasin/articles/${articleEnEdition.id}`)
        : apiUrl('magasin/articles/ajouter');
      const method = articleEnEdition ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articlePayload),
      });

      if (!res.ok) throw new Error("Erreur lors de l'envoi");

      const data = await res.json();

      if (articleEnEdition) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleEnEdition.id ? data : a))
        );
        setMessage('Article mis à jour');
      } else {
        setArticles((prev) => [...prev, data]);
        setMessage('Article ajouté');
      }

      setNom('');
      setDescription('');
      setPrix('0');
      setCategorieId(null);
      setStocks([{ taille: 'S', quantite: 0 }]);
      setArticleEnEdition(null);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l'ajout / mise à jour.");
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(apiUrl('magasin/articles'));
        if (!res.ok) throw new Error('Erreur de chargement des articles');
        const data = await res.json();

        // Transformer l'objet en tableau
        const articlesArray = Object.values(data).flat();
        setArticles(articlesArray);
      } catch (err) {
        console.error('Erreur lors du fetch des articles :', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleCategorieSelect = (_e: any, value: string) => {
    setCategorieId(value);
    const selected = categories.find(c => c.id.toString() === value);
    setCategorieNom(selected ? selected.nom : null);
    setIsCategorieOpen(false);
  };

  const toggleCategorie = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsCategorieOpen(prev => !prev)}
      isExpanded={isCategorieOpen}
      style={{ width: '100%' }}
    >
      {categorieNom || 'Sélectionner une catégorie'}
    </MenuToggle>
  );

  const updateQuantite = (index: number, value: number) => {
    const updated = [...stocks];
    updated[index].quantite = value;
    setStocks(updated);
  };

  const addNextTaille = () => {
    const taillesUtilisées = stocks.map(s => s.taille);
    const prochaineTaille = tailles.find(t => !taillesUtilisées.includes(t));
    if (prochaineTaille) {
      setStocks([...stocks, { taille: prochaineTaille, quantite: 0 }]);
    }
  };

  const supprimerArticle = async (id: number) => {
    if (!window.confirm('Supprimer cet article ?')) return;

    try {
      const res = await fetch(apiUrl(`magasin/articles/${id}`), {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setArticles((prev) => prev.filter(article => article.id !== id));
      setMessage('Article supprimé avec succès');
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la suppression de l'article.");
    }
  };

  const ouvrirEdition = (article: any) => {
    setArticleEnEdition(article);
    setNom(article.nom);
    setDescription(article.description);
    setPrix(article.prix);
    setCategorieId(article.categorie_id?.toString());
    setStocks(article.stocks || []);
    setActiveTabKey(0);
  };

  return (
    <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
      <Tab eventKey={0} title={<TabTitleText>Ajouter un article</TabTitleText>}>
        <Form onSubmit={handleSubmit} isWidthLimited maxWidth="500px" style={{ marginTop: '1rem' }}>
          <FormGroup label="Catégorie" isRequired fieldId="categorie-id">
            <Select
              id="categorie-id"
              isOpen={isCategorieOpen}
              selected={categorieId}
              onSelect={handleCategorieSelect}
              onOpenChange={setIsCategorieOpen}
              toggle={toggleCategorie}
              shouldFocusToggleOnSelect
            >
              <SelectList>
                {categories.map(categorie => (
                  <SelectOption key={categorie.id} value={categorie.id.toString()}>
                    {categorie.nom}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Nom de l'article" isRequired fieldId="nom-article">
            <TextInput
              isRequired
              type="text"
              id="nom-article"
              value={nom}
              onChange={(_e, value) => setNom(value)}
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="desc">
            <TextArea
              id="desc"
              value={description}
              onChange={(_e, value) => setDescription(value)}
            />
          </FormGroup>

          <FormGroup label="Prix (€)" isRequired fieldId="prix">
            <PriceInput 
              value={prix === "" ? "" : Number(prix)} 
              onChange={(newValue) => setPrix(newValue === "" ? "" : String(newValue))} 
            />
          </FormGroup>


          <FormGroup label="Image (texte ou fichier)" fieldId="image-upload">
            <MultiImageUpload onImageUrlsChange={setImageUrls} />
          </FormGroup>


          <Title headingLevel="h3">Quantités par taille</Title>
          {stocks.map((stock, index) => (
            <FormGroup
              key={index}
              label={`Taille ${stock.taille}`}
              fieldId={`taille-${stock.taille}-${index}`}
            >
              <NumberInput
                id={`taille-${stock.taille}-${index}`}
                value={stock.quantite}  // un nombre
                min={0}
                onChange={(event) => {
                  const valueAsString = event.currentTarget.value;

                  // On autorise la chaîne vide pour permettre effacement
                  if (valueAsString === '') {
                    updateQuantite(index, 0);
                    return;
                  }

                  // On nettoie la chaîne pour ne garder que des chiffres
                  const cleaned = valueAsString.replace(',', '.').replace(/[^\d]/g, '');

                  const parsed = parseInt(cleaned, 10);
                  if (!isNaN(parsed)) {
                    updateQuantite(index, parsed);
                  }
                }}
                onMinus={() => updateQuantite(index, Math.max(0, stock.quantite - 1))}
                onPlus={() => updateQuantite(index, stock.quantite + 1)}
              />
            </FormGroup>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={addNextTaille}
            isDisabled={stocks.length >= tailles.length}
            style={{ marginBottom: '1rem' }}
          >
            + Ajouter une taille
          </Button>

          <Button type="submit" variant="primary">
            {articleEnEdition ? 'Modifier l\'article' : 'Ajouter l\'article'}
          </Button>

          {articleEnEdition && (
            <Button
              variant="link"
              onClick={() => {
                setArticleEnEdition(null);
                setNom('');
                setDescription('');
                setPrix('0');
                setCategorieId(null);
                setStocks([{ taille: 'S', quantite: 0 }]);
              }}
              style={{ marginTop: '1rem' }}
            >
              Annuler la modification
            </Button>
          )}
        </Form>

        {message && (
          <Alert title={message} variant="success" isInline style={{ marginTop: '1rem' }} />
        )}
      </Tab>

      <Tab eventKey={1} title={<TabTitleText>Voir les articles</TabTitleText>}>
        <div style={{ marginTop: '1rem' }}>
          {isLoading ? (
            <Spinner size="xl" />
          ) : (
            categories.map((category, index) => {
              const categoryArticles = articles.filter(article => article.categorie_id === category.id);

              return (
                <div key={category.id}>
                  <ExpandableSection toggleText={category.nom}>
                    {categoryArticles.length > 0 ? (
                      <Gallery hasGutter>
                        {categoryArticles.map((article, idx) => (
                          <GalleryItem key={idx}>
                            <Card isCompact style={{ width: '250px' }}>
                              <CardTitle>{article.nom}</CardTitle>
                              <CardBody>
                                {article.images?.length > 0 && (
                                  <img
                                    src={article.images[0]}
                                    alt={article.nom}
                                    style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }}
                                  />
                                )}
                                <div><strong>Prix :</strong> {article.prix} €</div>
                                <div><strong>Description :</strong> {article.description || '—'}</div>
                                <div style={{ marginTop: '0.5rem' }}>
                                  <strong>Stocks :</strong>
                                  <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                                    {article.stocks?.map((stock:any, i:any) => (
                                      <li key={i}>
                                        Taille <Label color="blue">{stock.taille}</Label> : {stock.quantite}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </CardBody>
                              <CardFooter style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="secondary" onClick={() => ouvrirEdition(article)}>
                                  Modifier
                                </Button>
                                <Button variant="danger" onClick={() => supprimerArticle(article.id)}>
                                  Supprimer
                                </Button>
                              </CardFooter>
                            </Card>
                          </GalleryItem>
                        ))}
                      </Gallery>
                    ) : (
                      <EmptyState>
                        <EmptyStateBody>
                          Il n'y a actuellement aucun article dans cette catégorie.
                        </EmptyStateBody>
                      </EmptyState>
                    )}
                  </ExpandableSection>
                  {index < categories.length - 1 && <Divider />}
                </div>
              );
            })
          )}
        </div>
      </Tab>
    </Tabs>
  );
};

export default AjouterArticle;