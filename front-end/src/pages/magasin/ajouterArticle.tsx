import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  FormSelect,
  FormSelectOption,
  Button,
  Spinner,
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Gallery,
  GalleryItem,
  ExpandableSection,
} from '@patternfly/react-core';
import {
  useArticlesParCategorie,
  useCategoriesMagasin,
  useAjouterArticleMagasin,
  useModifierArticleMagasin,
  useSupprimerArticleMagasin,
  useTaillesMagasin
} from '../../hooks/useMagasin';
import MultiImageUpload from '../../components/fileUploader';
import { PriceInput } from '../../components/input/numberInput';
import NumberInputDefault from '../../components/input/NumberInputDefault';
import { ModalWithHelp } from '../../components/modal/modalwithhelp';
import { useCheckArticleByNomAndCategorie, useCheckArticleByNom } from '../../hooks/useVerification';

const AjouterArticle = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('0');
  const [stocks, setStocks] = useState([{ taille: 'S', quantite: 0 }]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [articleEnEdition, setArticleEnEdition] = useState<any | null>(null);
  const [isCategorieOpen, setIsCategorieOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState<React.FormEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  // Gère l'état d'expansion de chaque catégorie
  const [expandedCategories, setExpandedCategories] = useState<{ [catId: string]: boolean }>({});

  // Utilisation des hooks React Query
  const { data: articles, isLoading: loadingArticles } = useArticlesParCategorie();
  const { data: categories, isLoading: loadingCategories } = useCategoriesMagasin();
  const { data: tailles, isLoading: loadingTailles } = useTaillesMagasin();
  const ajouterArticle = useAjouterArticleMagasin();
  const modifierArticle = useModifierArticleMagasin();
  const supprimerArticle = useSupprimerArticleMagasin();

  // Hook pour vérifier l'article par nom et catégorie
  const checkArticleByNomAndCategorie = useCheckArticleByNomAndCategorie();
  const checkArticleByNom = useCheckArticleByNom();

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(Number(tabIndex));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingSubmitEvent(e);
    setShowConfirmModal(true);
  };

  const handleConfirmAdd = async () => {
    setShowConfirmModal(false);
    if (!pendingSubmitEvent) return;

    setErrorMessage(null);

    // Vérification uniquement en création, pas en modification
    if (!articleEnEdition) {
      try {
        const exists = await checkArticleByNomAndCategorie(nom, categorieId);
        if (exists) {
          setErrorMessage("Un article avec ce nom existe déjà dans cette catégorie.");
          setPendingSubmitEvent(null);
          return;
        }
      } catch (err) {
        setErrorMessage("Erreur lors de la vérification de l'article.");
        setPendingSubmitEvent(null);
        return;
      }
    }

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
        setSuccessMessage("L'article a bien été modifié.");
      } else {
        await ajouterArticle.mutateAsync(articlePayload);
        setSuccessMessage("L'article a bien été ajouté.");
      }
      setNom('');
      setDescription('');
      setPrix('0');
      setCategorieId(null);
      setStocks([{ taille: 'S', quantite: 0 }]);
      setImageUrls([]);
      setArticleEnEdition(null);
    } catch (error) {
      setErrorMessage('Erreur lors de la soumission de l\'article.');
    }
    setPendingSubmitEvent(null);
  };

  const handleSupprimerArticle = async (id: number) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await supprimerArticle.mutateAsync(id);
      setSuccessMessage("L'article a bien été supprimé.");
    } catch (error) {
      setErrorMessage('Erreur lors de la suppression de l\'article.');
    }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Trie les articles par catégorie comme dans la page 'magasin'
  const articlesParCategorie = React.useMemo(() => {
    if (!articles || !categories) return [];
    // Si articles est déjà groupé par catégorie (objet), on le transforme en tableau [{...categorie, articles: [...] }]
    if (!Array.isArray(articles)) {
      return categories.map(categorie => ({
        ...categorie,
        articles: articles[categorie.nom] || []
      }));
    }
    // Sinon, on filtre comme avant (cas fallback)
    return categories.map(categorie => ({
      ...categorie,
      articles: articles.filter((a: any) => String(a.categorie_id) === String(categorie.id))
    }));
  }, [articles, categories]);

  // Remplace la constante statique par les tailles dynamiques
  // const taillesDisponibles = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const taillesDisponibles = tailles?.map((t: any) => t.nom) || [];

  // Ajoute une nouvelle ligne taille/quantité en respectant l'ordre croissant des tailles dynamiques
  const handleAddTaille = () => {
    const usedTailles = stocks.map(s => s.taille);
    const nextTaille = taillesDisponibles.find(taille => !usedTailles.includes(taille));
    if (!nextTaille) return;

    setStocks(prev => {
      const updated = [...prev, { taille: nextTaille, quantite: 0 }];
      // Trie les stocks selon l'ordre des taillesDisponibles
      updated.sort(
        (a, b) =>
          taillesDisponibles.indexOf(a.taille) - taillesDisponibles.indexOf(b.taille)
      );
      return updated;
    });
  };

  // Modifie une taille ou quantité
  const handleStockChange = (index: number, field: 'taille' | 'quantite', value: string | number) => {
    setStocks(prev => {
      const updated = prev.map((stock, i) =>
        i === index ? { ...stock, [field]: value } : stock
      );
      // Trie après modification
      updated.sort(
        (a, b) =>
          taillesDisponibles.indexOf(a.taille) - taillesDisponibles.indexOf(b.taille)
      );
      return updated;
    });
  };

  // Supprime une ligne de taille
  const handleRemoveTaille = (index: number) => {
    setStocks(prev => {
      const updated = prev.filter((_, i) => i !== index);
      updated.sort(
        (a, b) =>
          taillesDisponibles.indexOf(a.taille) - taillesDisponibles.indexOf(b.taille)
      );
      return updated;
    });
  };

  // Remplit les champs avec l'article à modifier
  React.useEffect(() => {
    if (articleEnEdition) {
      setNom(articleEnEdition.nom ?? '');
      setDescription(articleEnEdition.description ?? '');
      setPrix(articleEnEdition.prix !== undefined ? String(articleEnEdition.prix) : '0');
      setCategorieId(articleEnEdition.categorie_id !== undefined ? String(articleEnEdition.categorie_id) : null);
      setStocks(articleEnEdition.stocks ?? [{ taille: 'S', quantite: 0 }]);
      setImageUrls(articleEnEdition.images ?? []);
      setActiveTabKey(0); // Bascule sur l'onglet "Ajouter un article"
    }
  }, [articleEnEdition]);

  if (loadingArticles || loadingCategories || loadingTailles) {
    return <Spinner size="xl" />;
  }

  return (
    <>
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Ajouter un article</TabTitleText>}>
          <Form onSubmit={handleSubmit}>
            <FormGroup label="Catégorie" isRequired fieldId="categorie-id">
              <FormSelect
                id="categorie-id"
                value={categorieId ?? ''}
                onChange={(_event, value) => setCategorieId(value)}
                aria-label="Sélection de catégorie"
              >
                <FormSelectOption isDisabled value="" label="Sélectionner une catégorie" />
                {categories?.map(categorie => (
                  <FormSelectOption key={categorie.id} value={categorie.id.toString()} label={categorie.nom} />
                ))}
              </FormSelect>
            </FormGroup>
            <FormGroup label="Nom de l'article" isRequired fieldId="nom-article">
              <TextInput
                isRequired
                type="text"
                id="nom-article"
                value={nom}
                onChange={(_event, value) => setNom(value)}
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="desc">
              <TextArea
                id="desc"
                value={description}
                onChange={(_event, value) => setDescription(value)}
              />
            </FormGroup>
            <FormGroup label="Prix (€)" isRequired fieldId="prix">
              <PriceInput
                value={prix === '' ? 0 : Number(prix)}
                onChange={val => setPrix(val === '' ? '' : String(val))}
              />
            </FormGroup>
            <FormGroup label="Images" fieldId="images-upload">
              <MultiImageUpload
                onImageUrlsChange={setImageUrls}
                resetTrigger={articleEnEdition === null && nom === '' && description === '' && prix === '0'}
                initialImages={articleEnEdition?.images}
              />
            </FormGroup>
            <FormGroup label="Quantités par taille" fieldId="stocks">
              {stocks.map((stock, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ minWidth: 60 }}>
                    {stock.taille ? `${stock.taille} :` : 'Nouvelle taille'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <NumberInputDefault
                      value={stock.quantite}
                      onChange={value => handleStockChange(idx, 'quantite', value)}
                      aria-label={`Quantité pour taille ${stock.taille || idx + 1}`}
                      style={{ width: 80 }}
                    />
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveTaille(idx)}
                    aria-label="Supprimer la taille"
                    style={{
                      padding: '0 8px',
                      marginLeft: 8,
                      alignSelf: 'center',
                      height: 32,
                      minWidth: 32,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    &times;
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={handleAddTaille}
                type="button"
                isDisabled={stocks.length >= taillesDisponibles.length}
              >
                Ajouter quantité
              </Button>
            </FormGroup>
            <Button type="submit" variant="primary">
              {articleEnEdition ? "Modifier l'article" : "Ajouter l'article"}
            </Button>
          </Form>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Voir les articles</TabTitleText>}>
          {articlesParCategorie.map((categorie, idx) => (
            <React.Fragment key={categorie.id}>
              {idx > 0 && (
                <hr style={{ margin: '32px 0 24px 0', border: 0, borderTop: '2px solid #d2d2d2' }} />
              )}
              <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 600 }}>
                {categorie.nom}
              </h2>
              <ExpandableSection
                toggleText={`${categorie.nom} (${categorie.articles.length})`}
                onToggle={() => toggleCategory(categorie.id)}
                isExpanded={!!expandedCategories[categorie.id]}
                style={{ marginBottom: 24 }}
              >
                <Gallery hasGutter>
                  {categorie.articles.length > 0 ? (
                    categorie.articles.map(article => (
                      <GalleryItem key={article.id}>
                        <Card
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedArticle(article)}
                        >
                          {/* Affiche la première image si disponible */}
                          {article.images && article.images.length > 0 && (
                            <img
                              src={article.images[0]}
                              alt={article.nom}
                              style={{
                                width: '100%',
                                height: 120,
                                objectFit: 'cover',
                                borderTopLeftRadius: 4,
                                borderTopRightRadius: 4,
                                marginBottom: 8
                              }}
                            />
                          )}
                          <CardTitle>{article.nom}</CardTitle>
                          <CardBody>
                            <div><strong>Prix :</strong> {article.prix} €</div>
                            <div><strong>Description :</strong> {article.description || '—'}</div>
                          </CardBody>
                          <CardFooter>
                            <Button
                              variant="secondary"
                              onClick={e => {
                                e.stopPropagation();
                                setArticleEnEdition(article);
                              }}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="danger"
                              onClick={e => {
                                e.stopPropagation();
                                handleSupprimerArticle(article.id);
                              }}
                            >
                              Supprimer
                            </Button>
                          </CardFooter>
                        </Card>
                      </GalleryItem>
                    ))
                  ) : (
                    <div style={{ color: '#888', margin: 16 }}>Aucun article dans cette catégorie.</div>
                  )}
                </Gallery>
              </ExpandableSection>
            </React.Fragment>
          ))}
        </Tab>
      </Tabs>
      {/* Modal pour afficher les détails d'un article sélectionné */}
      <ModalWithHelp
        isOpen={!!selectedArticle}
        title={selectedArticle?.nom || ''}
        description={
          selectedArticle && (
            <div>
              <div><strong>Description :</strong> {selectedArticle.description || '—'}</div>
              <div><strong>Prix :</strong> {selectedArticle.prix} €</div>
              <div><strong>Catégorie :</strong> {categories?.find(c => String(c.id) === String(selectedArticle.categorie_id))?.nom || ''}</div>
              <div>
                <strong>Tailles/Quantités :</strong>{' '}
                {selectedArticle.stocks?.map((s: any) => `${s.taille}: ${s.quantite}`).join(', ') || '—'}
              </div>
              <div>
                <strong>Images :</strong>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {selectedArticle.images?.length
                    ? selectedArticle.images.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                      ))
                    : '—'}
                </div>
              </div>
            </div>
          )
        }
        onClose={() => setSelectedArticle(null)}
        footer={
          selectedArticle && (
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setArticleEnEdition(selectedArticle);
                  setSelectedArticle(null);
                }}
              >
                Modifier
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleSupprimerArticle(selectedArticle.id);
                  setSelectedArticle(null);
                }}
              >
                Supprimer
              </Button>
              <Button variant="link" onClick={() => setSelectedArticle(null)}>
                Fermer
              </Button>
            </div>
          )
        }
      />
      <ModalWithHelp
        isOpen={showConfirmModal || !!successMessage}
        title={successMessage ? "Succès" : "Confirmation"}
        description={
          successMessage ? (
            <span style={{ color: 'green' }}>{successMessage}</span>
          ) : errorMessage
          ? <span style={{ color: 'red' }}>{errorMessage}</span>
          : articleEnEdition
            ? (
              <div>
                <div>Vous allez appliquer les modifications suivantes :</div>
                <ul>
                  <li><strong>Nom :</strong> {nom}</li>
                  <li><strong>Description :</strong> {description}</li>
                  <li><strong>Prix :</strong> {prix} €</li>
                  <li><strong>Catégorie :</strong> {categories?.find(c => String(c.id) === String(categorieId))?.nom || ''}</li>
                  <li><strong>Tailles/Quantités :</strong> {stocks.map(s => `${s.taille}: ${s.quantite}`).join(', ')}</li>
                </ul>
                <div style={{ marginTop: 8 }}>Êtes-vous sûr d'appliquer ces changements ?</div>
              </div>
            )
            : "Êtes-vous sûr de vouloir ajouter l'article ?"
        }
        onClose={() => {
          setShowConfirmModal(false);
          setErrorMessage(null);
          setSuccessMessage(null);
        }}
        onConfirm={
          successMessage
            ? undefined
            : async () => {
                setErrorMessage(null);
                // Vérification uniquement en création
                if (!articleEnEdition) {
                  try {
                    const exists = await checkArticleByNomAndCategorie(nom, categorieId);
                    if (exists) {
                      setErrorMessage("Un article avec ce nom existe déjà dans cette catégorie.");
                      return;
                    }
                  } catch (err) {
                    setErrorMessage("Erreur lors de la vérification de l'article.");
                    return;
                  }
                }
                setShowConfirmModal(false);
                await handleConfirmAdd();
              }
        }
        confirmText={successMessage ? undefined : "Confirmer"}
        cancelText={successMessage ? undefined : "Annuler"}
      />
    </>
  );
};

export default AjouterArticle;