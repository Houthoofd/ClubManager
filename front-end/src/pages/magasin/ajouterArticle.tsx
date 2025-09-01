import React, { useState } from 'react';
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
  Button,
  Spinner,
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Gallery,
  GalleryItem,
} from '@patternfly/react-core';
import { useArticles, useCategories, useAjouterArticle, useModifierArticle, useSupprimerArticle } from '../../hooks/useArticles';

const AjouterArticle = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('0');
  const [stocks, setStocks] = useState([{ taille: 'S', quantite: 0 }]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [articleEnEdition, setArticleEnEdition] = useState<any | null>(null);

  // Utilisation des hooks React Query
  const { data: articles, isLoading: loadingArticles } = useArticles();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const ajouterArticle = useAjouterArticle();
  const modifierArticle = useModifierArticle();
  const supprimerArticle = useSupprimerArticle();

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(Number(tabIndex));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const articlePayload = {
      nom,
      description,
      prix,
      categorie_id: categorieId,
      images: imageUrls,
      stocks
    };

    try {
      if (articleEnEdition) {
        await modifierArticle.mutateAsync({ id: articleEnEdition.id, article: articlePayload });
      } else {
        await ajouterArticle.mutateAsync(articlePayload);
      }
      setNom('');
      setDescription('');
      setPrix('0');
      setCategorieId(null);
      setStocks([{ taille: 'S', quantite: 0 }]);
      setImageUrls([]);
      setArticleEnEdition(null);
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'article:', error);
    }
  };

  const handleSupprimerArticle = async (id: number) => {
    if (window.confirm('Supprimer cet article ?')) {
      try {
        await supprimerArticle.mutateAsync(id);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'article:', error);
      }
    }
  };

  if (loadingArticles || loadingCategories) {
    return <Spinner size="xl" />;
  }

  return (
    <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
      <Tab eventKey={0} title={<TabTitleText>Ajouter un article</TabTitleText>}>
        <Form onSubmit={handleSubmit}>
          <FormGroup label="Catégorie" isRequired fieldId="categorie-id">
            <Select
              id="categorie-id"
              value={categorieId}
              onChange={(value) => setCategorieId(value)}
            >
              {categories?.map(categorie => (
                <SelectOption key={categorie.id} value={categorie.id.toString()}>
                  {categorie.nom}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Nom de l'article" isRequired fieldId="nom-article">
            <TextInput
              isRequired
              type="text"
              id="nom-article"
              value={nom}
              onChange={setNom}
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="desc">
            <TextArea
              id="desc"
              value={description}
              onChange={setDescription}
            />
          </FormGroup>
          <FormGroup label="Prix (€)" isRequired fieldId="prix">
            <TextInput
              isRequired
              type="number"
              id="prix"
              value={prix}
              onChange={(value) => setPrix(value)}
            />
          </FormGroup>
          <Button type="submit" variant="primary">
            {articleEnEdition ? 'Modifier l\'article' : 'Ajouter l\'article'}
          </Button>
        </Form>
      </Tab>
      <Tab eventKey={1} title={<TabTitleText>Voir les articles</TabTitleText>}>
        <Gallery hasGutter>
          {articles?.map((article) => (
            <GalleryItem key={article.id}>
              <Card>
                <CardTitle>{article.nom}</CardTitle>
                <CardBody>
                  <div><strong>Prix :</strong> {article.prix} €</div>
                  <div><strong>Description :</strong> {article.description || '—'}</div>
                </CardBody>
                <CardFooter>
                  <Button variant="secondary" onClick={() => setArticleEnEdition(article)}>
                    Modifier
                  </Button>
                  <Button variant="danger" onClick={() => handleSupprimerArticle(article.id)}>
                    Supprimer
                  </Button>
                </CardFooter>
              </Card>
            </GalleryItem>
          ))}
        </Gallery>
      </Tab>
    </Tabs>
  );
};

export default AjouterArticle;