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
  List,
  ListItem,
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
  Label
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';
import { MultiImageUpload } from '../../components/fileUploader'; // 🔁 Vérifie le chemin
import { PriceInput } from '../../components/input/numberInput';

const AjouterArticle = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [isCategorieOpen, setIsCategorieOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [fileUploads, setFileUploads] = useState<string[]>(['']);
  const [stocks, setStocks] = useState([{ taille: 'S', quantite: 0 }]);
  const [message, setMessage] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [prix, setPrix] = useState('0');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: number; nom: string }[]>([]);


  const tailles = ['S', 'M', 'L', 'XL'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:3000/magasin/articles/categories');
        if (!res.ok) throw new Error('Erreur lors du chargement des catégories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Erreur de chargement des catégories :', err);
      }
    };

    fetchCategories();
  }, []);

  const handleTabClick = (_event: React.MouseEvent, tabIndex: number) => {
    setActiveTabKey(tabIndex);
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
      ? `http://localhost:3000/magasin/articles/${articleEnEdition.id}`
      : 'http://localhost:3000/magasin/articles/ajouter';

    const method = articleEnEdition ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articlePayload),
    });

    if (!res.ok) throw new Error("Erreur lors de l'envoi");

    const data = await res.json();

    if (articleEnEdition) {
      // Mise à jour
      setArticles((prev) =>
        prev.map((a) => (a.id === articleEnEdition.id ? data : a))
      );
      setMessage('Article mis à jour');
    } else {
      // Ajout
      setArticles((prev) => [...prev, data]);
      setMessage('Article ajouté');
    }

    // Reset
    setNom('');
    setDescription('');
    setPrix('0');
    setCategorieId(null);
    setStocks([{ taille: 'S', quantite: 0 }]);
    setFileUploads(['']);
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
        const res = await fetch('http://localhost:3000/magasin/articles');
        if (!res.ok) throw new Error('Erreur de chargement des articles');
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error('Erreur lors du fetch des articles :', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);


  const toggleCategorie = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsCategorieOpen(prev => !prev)}
      isExpanded={isCategorieOpen}
      style={{ width: '100%' }}
    >
      {categorieId || 'Sélectionner une catégorie'}
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
    const res = await fetch(`http://localhost:3000/magasin/articles/${id}`, {
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

const [articleEnEdition, setArticleEnEdition] = useState<any | null>(null);

const ouvrirEdition = (article: any) => {
  setArticleEnEdition(article);
  setNom(article.nom);
  setDescription(article.description);
  setPrix(article.prix);
  setCategorieId(article.categorie_id?.toString());
  setStocks(article.stocks || []);
  setActiveTabKey(0); // Aller à l'onglet "ajouter/modifier"
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
              onSelect={(_e, value) => {
                setCategorieId(value as string);
                setIsCategorieOpen(false);
              }}
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
            <PriceInput value={prix} onChange={setPrix} />
          </FormGroup>



          <FormGroup label="Image (texte ou fichier)" fieldId="image-upload">
            <MultiImageUpload onImageUrlsChange={setImageUrls}/>
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
                value={stock.quantite.toString()}
                min={0}
                onChange={(event) => {
                  const input = event.currentTarget.value.replace(',', '.').replace(/[^\d]/g, '');
                  // Permet les chaînes vides temporairement
                  if (input === '') {
                    updateQuantite(index, 0);
                    return;
                  }
                  const parsed = parseInt(input, 10);
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
      <Spinner isSVG size="xl" />
    ) : articles.length > 0 ? (
      <Gallery hasGutter>
        {Array.isArray(articles) &&
          articles.map((article, index) => (
            <GalleryItem key={index}>
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
                  <div><strong>Catégorie :</strong> {article.categorie_id}</div>
                  <div><strong>Prix :</strong> {article.prix} €</div>
                  <div><strong>Description :</strong> {article.description || '—'}</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Stocks :</strong>
                    <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                      {article.stocks?.map((stock: any, i: number) => (
                        <li key={i}>
                          Taille <Label color="blue">{stock.taille}</Label> : {stock.quantite}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardBody>

                <CardFooter style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" isSmall onClick={() => ouvrirEdition(article)}>
                    Modifier
                  </Button>
                  <Button variant="danger" isSmall onClick={() => supprimerArticle(article.id)}>
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
          Il n'y a actuellement aucun article enregistré.
        </EmptyStateBody>
      </EmptyState>
    )}
  </div>
</Tab>


    </Tabs>
  );
};

export default AjouterArticle;
