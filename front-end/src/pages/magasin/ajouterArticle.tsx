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
import { ModalWithHelp } from '../../components/modal/modalwithhelp';
import { Popover } from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editChanges, setEditChanges] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);
  const [addModalSuccess, setAddModalSuccess] = useState<string | null>(null);
  const [resetImageUploadKey, setResetImageUploadKey] = useState(0);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [editModalSuccess, setEditModalSuccess] = useState<string | null>(null);

  const tailles = ['S', 'M', 'L', 'XL'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(apiUrl('magasin/articles/categories'));
        if (!res.ok) throw new Error('Erreur lors du chargement des catégories');
        const data = await res.json();
        // Si data est un objet, transforme-le en tableau
        const categoriesArray = Array.isArray(data)
          ? data
          : Object.values(data).flat();
        setCategories(categoriesArray);
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

  // Fonction pour comparer les changements
  const getArticleChanges = (original: any, edited: any) => {
    const changes: any = {};
    if (!original) return changes;
    if (original.nom !== edited.nom) changes.nom = { before: original.nom, after: edited.nom };
    if (original.description !== edited.description) changes.description = { before: original.description, after: edited.description };
    if (original.prix !== edited.prix) changes.prix = { before: original.prix, after: edited.prix };
    if (original.categorie_id !== edited.categorie_id) {
      const beforeCat = categories.find(c => c.id === Number(original.categorie_id))?.nom;
      const afterCat = categories.find(c => c.id === Number(edited.categorie_id))?.nom;
      changes.categorie = { before: beforeCat, after: afterCat };
    }
    // Stocks comparison (simple: compare JSON)
    if (JSON.stringify(original.stocks) !== JSON.stringify(edited.stocks)) {
      changes.stocks = { before: original.stocks, after: edited.stocks };
    }
    // Images comparison
    if (JSON.stringify(original.images) !== JSON.stringify(edited.images)) {
      changes.images = { before: original.images, after: edited.images };
    }
    return changes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !categorieId || !prix) return;

    if (articleEnEdition) {
      // Prépare les changements à afficher
      const edited = {
        nom,
        description,
        prix,
        categorie_id: categorieId,
        images: imageUrls,
        stocks,
      };
      setEditChanges(getArticleChanges(articleEnEdition, edited));
      setIsEditModalOpen(true);
      return;
    }

    // Ajout : affiche la modal de confirmation avant d'ajouter
    setIsAddModalOpen(true);
  };

  // Fonction pour confirmer l'ajout
  const confirmAdd = async () => {
    const articlePayload = {
      nom,
      description,
      prix,
      categorie_id: categorieId,
      images: imageUrls,
      stocks,
    };

    try {
      // Vérification si l'article existe déjà dans la catégorie
      const checkRes = await fetch(
        apiUrl(`verification/magasin/article/categorie?nom=${encodeURIComponent(nom)}&categorie_id=${categorieId}`)
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setAddModalError("Un article avec ce nom existe déjà dans cette catégorie");
          setAddModalSuccess(null);
          return;
        }
      }

      const url = apiUrl('magasin/articles/ajouter');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articlePayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddModalError(data.message || "Erreur lors de l'ajout.");
        setAddModalSuccess(null);
        return;
      }

      setArticles((prev) => [...prev, data]);
      setAddModalSuccess(data.message || 'Article ajouté');
      setAddModalError(null);

      // Réinitialise le formulaire après succès
      setNom('');
      setDescription('');
      setPrix('0');
      setCategorieId(null);
      setCategorieNom(null);
      setStocks([{ taille: 'S', quantite: 0 }]);
      setImageUrls([]);
      setArticleEnEdition(null);
      setResetImageUploadKey(prev => prev + 1); // force le reset du fileUploader
    } catch (err) {
      console.error(err);
      setAddModalError("Erreur lors de l'ajout.");
      setAddModalSuccess(null);
    }
  };

  // Fonction pour confirmer la modification
  const confirmEdit = async () => {
    if (!articleEnEdition) return;
    const articlePayload = {
      nom,
      description,
      prix,
      categorie_id: categorieId,
      images: imageUrls,
      stocks,
    };

    try {
      // Vérification si le nom ou la catégorie sont modifiés
      if (
        (nom !== articleEnEdition.nom) ||
        (categorieId && categorieId !== String(articleEnEdition.categorie_id))
      ) {
        const checkRes = await fetch(
          apiUrl(`verification/magasin/article/categorie?nom=${encodeURIComponent(nom)}&categorie_id=${categorieId}`)
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          // Si un autre article existe dans cette catégorie avec ce nom
          if (checkData.exists && (!articleEnEdition.id || checkData.id !== articleEnEdition.id)) {
            setEditModalError("Un article avec ce nom existe déjà dans cette catégorie.");
            return;
          }
        }
      }

      const url = apiUrl(`magasin/modifier/article/${articleEnEdition.id}`);
      const method = 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articlePayload),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditModalError(data.message || "Erreur lors de la mise à jour.");
        setEditModalSuccess(null);
        return;
      }

      setEditModalSuccess(data.message || "Article mis à jour");
      setEditModalError(null);

      // Rafraîchir la liste des articles après modification
      await fetchArticles();

      setNom('');
      setDescription('');
      setPrix('0');
      setCategorieId(null);
      setStocks([{ taille: 'S', quantite: 0 }]);
      setArticleEnEdition(null);
      setEditChanges(null);
      // Ne ferme pas la modal tout de suite, laisse le message affiché
      // setIsEditModalOpen(false);
    } catch (err) {
      setEditModalError("Erreur lors de la mise à jour.");
      setEditModalSuccess(null);
      setIsEditModalOpen(false);
      setEditChanges(null);
    }
  };

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('magasin/articles'));
      if (!res.ok) throw new Error('Erreur de chargement des articles');
      const data = await res.json();

      // Correction : data est un objet { catégorie: Array }
      // On reconstruit le tableau d'articles avec la catégorie associée
      const articlesArray: any[] = [];
      Object.entries(data).forEach(([categorieNom, articles]) => {
        if (Array.isArray(articles)) {
          articles.forEach((article: any) => {
            articlesArray.push({
              ...article,
              categorie_nom: categorieNom
            });
          });
        }
      });
      setArticles(articlesArray);
    } catch (err) {
      console.error('Erreur lors du fetch des articles :', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCategorieSelect = (_e: any, value?: string | number) => {
    const valueStr = value ? value.toString() : '';
    setCategorieId(valueStr);
    const selected = categories.find(c => c.id.toString() === valueStr);
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
    // Si la quantité devient 0, retire la taille du tableau
    if (value === 0) {
      updated.splice(index, 1);
    }
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
    const cat = categories.find(c => c.id === article.categorie_id);
    setCategorieNom(cat ? cat.nom : null);
    setStocks(article.stocks || []);
    setImageUrls(article.images || []); // affiche les images existantes dans l'upload
    setActiveTabKey(0);
    setEditChanges(null);
    setIsEditModalOpen(false); // S'assure que la modal est fermée au départ
  };

  // Helper pour afficher les erreurs Zod
  function renderError(error: any) {
    if (!error) return null;
    if (typeof error === 'string') return <Alert title={error} variant="danger" isInline style={{ marginTop: '1rem' }} />;
    if (error.issues && Array.isArray(error.issues)) {
      return (
        <Alert title="Erreur de validation" variant="danger" isInline style={{ marginTop: '1rem' }}>
          <ul>
            {error.issues.map((issue: any, idx: number) => (
              <li key={idx}>{issue.message}</li>
            ))}
          </ul>
        </Alert>
      );
    }
    return <Alert title={JSON.stringify(error)} variant="danger" isInline style={{ marginTop: '1rem' }} />;
  }

  // Fusionne les stocks par taille (additionne les quantités)
  function getStocksFusionnes(stocks: { taille: string; quantite: number }[]) {
    const map = new Map<string, number>();
    stocks.forEach(({ taille, quantite }) => {
      map.set(taille, (map.get(taille) || 0) + quantite);
    });
    return Array.from(map.entries()).map(([taille, quantite]) => ({ taille, quantite }));
  }

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
            <MultiImageUpload
              onImageUrlsChange={setImageUrls}
              resetTrigger={resetImageUploadKey}
            />
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
                value={stock.quantite}
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
              // Filtre les articles par catégorie (en utilisant le nom si id non fiable)
              const categoryArticles = articles.filter(
                article =>
                  article.categorie_id === category.id ||
                  article.categorie_nom === category.nom
              );

              return (
                <div key={category.id}>
                  <ExpandableSection
                    toggleText={
                      `${category.nom} (${categoryArticles.length} article${categoryArticles.length > 1 ? 's' : ''})`
                    }
                  >
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
                                    {getStocksFusionnes(article.stocks || []).map((stock: any, i: any) => (
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

      {/* Modal de confirmation modification */}
      {isEditModalOpen && (
        <ModalWithHelp
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditChanges(null); setEditModalError(null); setEditModalSuccess(null); }}
          title="Confirmer la modification"
          help={
            <Popover
              headerContent={<div>Aide</div>}
              bodyContent={<div>Vérifiez les changements avant de confirmer la modification de l'article.</div>}
              footerContent="Popover Footer"
            >
              <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
            </Popover>
          }
          footer={
            <>
              {!editModalSuccess && (
                <Button variant="primary" onClick={confirmEdit}>
                  Modifier
                </Button>
              )}
              <Button variant="link" onClick={() => { setIsEditModalOpen(false); setEditChanges(null); setEditModalError(null); setEditModalSuccess(null); }}>
                Fermer
              </Button>
            </>
          }
        >
          <div>
            <strong>Changements détectés :</strong>
            {editChanges && Object.keys(editChanges).length > 0 ? (
              <ul>
                {Object.entries(editChanges).map(([key, value]: any) => (
                  <li key={key}>
                    <strong>{key} :</strong>
                    <div>
                      <span style={{ color: 'red' }}>Avant : {JSON.stringify(value.before)}</span>
                      <br />
                      <span style={{ color: 'green' }}>Après : {JSON.stringify(value.after)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div>Aucun changement détecté.</div>
            )}
            <div style={{ marginTop: '1rem' }}>
              Êtes-vous sûr de vouloir modifier cet article ?
            </div>
            <Title headingLevel="h4" style={{ marginTop: '1rem' }}>Stocks modifiés</Title>
            <ul>
              {getStocksFusionnes(stocks).map((stock, idx) => (
                <li key={idx}>
                  Taille <Label color="blue">{stock.taille}</Label> : {stock.quantite}
                </li>
              ))}
            </ul>
            {imageUrls && imageUrls.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Images ajoutées :</strong>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`image-${idx}`}
                      style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </div>
            )}
            {renderError(editModalError)}
            {editModalSuccess && (
              <Alert title={editModalSuccess} variant="success" isInline style={{ marginTop: '1rem' }} />
            )}
          </div>
        </ModalWithHelp>
      )}

      {/* Modal de confirmation ajout */}
      {isAddModalOpen && (
        <ModalWithHelp
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setAddModalError(null);
            setAddModalSuccess(null);
          }}
          title="Confirmer l'ajout"
          help={
            <Popover
              headerContent={<div>Aide</div>}
              bodyContent={<div>Confirmez l'ajout de cet article au magasin.</div>}
              footerContent="Popover Footer"
            >
              <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
            </Popover>
          }
          footer={
            <>
              {!addModalSuccess && (
                <Button variant="primary" onClick={confirmAdd}>
                  Ajouter
                </Button>
              )}
              <Button variant="link" onClick={() => {
                setIsAddModalOpen(false);
                setAddModalError(null);
                setAddModalSuccess(null);
              }}>
                Fermer
              </Button>
            </>
          }
        >
          <div>
            <strong>Résumé de l'article à ajouter :</strong>
            <ul>
              <li><strong>Nom :</strong> {nom}</li>
              <li><strong>Description :</strong> {description}</li>
              <li><strong>Prix :</strong> {prix} €</li>
              <li><strong>Catégorie :</strong> {categories.find(c => c.id.toString() === categorieId)?.nom || ''}</li>
              <li>
                <strong>Stocks :</strong>
                <ul>
                  {stocks.map((stock, idx) => (
                    <li key={idx}>{stock.taille} : {stock.quantite}</li>
                  ))}
                </ul>
              </li>
              <li>
                <strong>Images :</strong>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {imageUrls.length === 0 && <span>Aucune image</span>}
                  {imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`image-${idx}`}
                      style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              Êtes-vous sûr de vouloir ajouter cet article ?
            </div>
            {renderError(addModalError)}
            {addModalSuccess && (
              <Alert title={addModalSuccess} variant="success" isInline style={{ marginTop: '1rem' }} />
            )}
          </div>
        </ModalWithHelp>
      )}
    </Tabs>
  );
};

export default AjouterArticle;