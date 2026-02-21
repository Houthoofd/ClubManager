import React from "react";
import {
  Form,
  FormGroup,
  TextInput,
  TextArea,
  FormSelect,
  FormSelectOption,
  Button,
  Card,
  Title,
} from "@patternfly/react-core";
import { MultiImageUpload } from "@/shared/components/uploads";
import { PriceInput } from "@/shared/components/common-legacy/input/numberInput";
import NumberInputDefault from "@/shared/components/common-legacy/input/NumberInputDefault";
import { PlusIcon, SaveIcon } from "@patternfly/react-icons";

interface Stock {
  taille: string;
  quantite: number;
}

interface FormulaireArticleProps {
  nom: string;
  description: string;
  prix: string;
  categorieId: string | null;
  stocks: Stock[];
  imageUrls: string[];
  categories: any[];
  taillesDisponibles: string[];
  articleEnEdition: any;
  onNomChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPrixChange: (value: string) => void;
  onCategorieChange: (value: string) => void;
  onStocksChange: (stocks: Stock[]) => void;
  onImageUrlsChange: (urls: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const FormulaireArticle: React.FC<FormulaireArticleProps> = ({
  nom,
  description,
  prix,
  categorieId,
  stocks,
  imageUrls,
  categories,
  taillesDisponibles,
  articleEnEdition,
  onNomChange,
  onDescriptionChange,
  onPrixChange,
  onCategorieChange,
  onStocksChange,
  onImageUrlsChange,
  onSubmit,
}) => {
  const handleAddTaille = () => {
    const usedTailles = stocks.map((s) => s.taille);
    const nextTaille = taillesDisponibles.find((taille) => !usedTailles.includes(taille));
    if (!nextTaille) return;

    const updated = [...stocks, { taille: nextTaille, quantite: 0 }];
    updated.sort(
      (a, b) => taillesDisponibles.indexOf(a.taille) - taillesDisponibles.indexOf(b.taille),
    );
    onStocksChange(updated);
  };

  const handleStockChange = (
    index: number,
    field: "taille" | "quantite",
    value: string | number,
  ) => {
    const updated = stocks.map((stock, i) => (i === index ? { ...stock, [field]: value } : stock));
    updated.sort(
      (a, b) => taillesDisponibles.indexOf(a.taille) - taillesDisponibles.indexOf(b.taille),
    );
    onStocksChange(updated);
  };

  const handleRemoveTaille = (index: number) => {
    const updated = stocks.filter((_, i) => i !== index);
    updated.sort(
      (a, b) => taillesDisponibles.indexOf(a.taille) - taillesDisponibles.indexOf(b.taille),
    );
    onStocksChange(updated);
  };

  return (
    <Card style={{ padding: "1.5rem", marginTop: "1rem" }}>
      <Title headingLevel="h3" style={{ marginBottom: "1.5rem", color: "#333" }}>
        {articleEnEdition ? "Modifier l'article" : "Créer un nouvel article"}
      </Title>

      <Form onSubmit={onSubmit}>
        <div
          style={{
            background: "#f8f9fa",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
            marginBottom: "1.5rem",
          }}
        >
          <Title headingLevel="h4" size="md" style={{ marginBottom: "1rem", color: "#495057" }}>
            Informations de base
          </Title>

          <FormGroup label="Catégorie" isRequired fieldId="categorie-id">
            <FormSelect
              id="categorie-id"
              value={categorieId ?? ""}
              onChange={(_event, value) => onCategorieChange(value)}
              aria-label="Sélection de catégorie"
              style={{ borderRadius: "6px" }}
            >
              <FormSelectOption isDisabled value="" label="Sélectionner une catégorie" />
              {categories?.map((categorie) => (
                <FormSelectOption
                  key={categorie.id}
                  value={categorie.id.toString()}
                  label={categorie.nom}
                />
              ))}
            </FormSelect>
          </FormGroup>

          <FormGroup label="Nom de l'article" isRequired fieldId="nom-article">
            <TextInput
              isRequired
              type="text"
              id="nom-article"
              value={nom}
              onChange={(_event, value) => onNomChange(value)}
              style={{ borderRadius: "6px" }}
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="desc">
            <TextArea
              id="desc"
              value={description}
              onChange={(_event, value) => onDescriptionChange(value)}
              style={{ borderRadius: "6px", minHeight: "100px" }}
            />
          </FormGroup>

          <FormGroup label="Prix (€)" isRequired fieldId="prix">
            <PriceInput
              value={prix === "" ? 0 : Number(prix)}
              onChange={(val) => onPrixChange(val === "" ? "" : String(val))}
            />
          </FormGroup>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
            marginBottom: "1.5rem",
          }}
        >
          <Title headingLevel="h4" size="md" style={{ marginBottom: "1rem", color: "#495057" }}>
            Images
          </Title>
          <FormGroup label="Télécharger des images" fieldId="images-upload">
            <MultiImageUpload
              onImageUrlsChange={onImageUrlsChange}
              resetTrigger={
                articleEnEdition === null && nom === "" && description === "" && prix === "0"
              }
              initialImages={articleEnEdition?.images}
            />
          </FormGroup>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
            marginBottom: "1.5rem",
          }}
        >
          <Title headingLevel="h4" size="md" style={{ marginBottom: "1rem", color: "#495057" }}>
            Gestion des stocks
          </Title>
          <FormGroup label="Quantités par taille" fieldId="stocks">
            {stocks.map((stock, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "0.75rem",
                  padding: "0.75rem",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #dee2e6",
                }}
              >
                <div
                  style={{
                    minWidth: "80px",
                    fontWeight: "bold",
                    color: "#495057",
                  }}
                >
                  Taille {stock.taille}
                </div>
                <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <NumberInputDefault
                    value={stock.quantite}
                    onChange={(value) => handleStockChange(idx, "quantite", value)}
                    aria-label={`Quantité pour taille ${stock.taille}`}
                    style={{ width: "100px" }}
                  />
                  <span style={{ marginLeft: "0.5rem", color: "#6c757d" }}>unités</span>
                </div>
                <Button
                  variant="danger"
                  onClick={() => handleRemoveTaille(idx)}
                  aria-label="Supprimer la taille"
                  style={{
                    padding: "0.5rem",
                    minWidth: "40px",
                    height: "40px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={handleAddTaille}
              type="button"
              isDisabled={stocks.length >= taillesDisponibles.length}
              style={{ marginTop: "0.5rem" }}
              icon={<PlusIcon />}
            >
              Ajouter une taille
            </Button>
          </FormGroup>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "1rem",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            style={{ padding: "0.75rem 2rem" }}
            icon={<SaveIcon />}
          >
            {articleEnEdition ? "Modifier l'article" : "Ajouter l'article"}
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default FormulaireArticle;
