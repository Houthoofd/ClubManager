import React, { useState } from "react";
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Card,
  CardBody,
  Title,
  Divider,
  Alert,
  Select,
  SelectOption,
} from "@patternfly/react-core";
import { useCartItems } from "@/store/cartStore";

interface CheckoutFormProps {
  onSubmit: (formData: CheckoutFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface CheckoutFormData {
  email: string;
  prenom: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  pays: string;
  telephone?: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit, isLoading = false, error }) => {
  const panier = useCartItems();
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    prenom: "",
    nom: "",
    adresse: "",
    ville: "",
    codePostal: "",
    pays: "Belgique",
    telephone: "",
  });

  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const countries = ["Belgique", "France", "Pays-Bas", "Luxembourg", "Allemagne", "Suisse"];

  const handleInputChange = (value: string, field: keyof CheckoutFormData) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const calculerTotal = () => {
    return panier.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  return (
    <div style={{ display: "flex", gap: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Formulaire de livraison */}
      <Card style={{ flex: 2 }}>
        <CardBody>
          <Title headingLevel="h2" size="lg" style={{ marginBottom: "1.5rem" }}>
            Informations de livraison
          </Title>

          {error && (
            <Alert variant="danger" title="Erreur" isInline style={{ marginBottom: "1rem" }}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <FormGroup label="Email" isRequired fieldId="email">
              <TextInput
                isRequired
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange(e.currentTarget.value, "email")}
                placeholder="votre@email.com"
              />
            </FormGroup>

            <div style={{ display: "flex", gap: "1rem" }}>
              <FormGroup label="Prénom" isRequired fieldId="prenom" style={{ flex: 1 }}>
                <TextInput
                  isRequired
                  type="text"
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => handleInputChange(e.currentTarget.value, "prenom")}
                  placeholder="Prénom"
                />
              </FormGroup>

              <FormGroup label="Nom" isRequired fieldId="nom" style={{ flex: 1 }}>
                <TextInput
                  isRequired
                  type="text"
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleInputChange(e.currentTarget.value, "nom")}
                  placeholder="Nom"
                />
              </FormGroup>
            </div>

            <FormGroup label="Adresse" isRequired fieldId="adresse">
              <TextInput
                isRequired
                type="text"
                id="adresse"
                value={formData.adresse}
                onChange={(e) => handleInputChange(e.currentTarget.value, "adresse")}
                placeholder="123 Rue de la Paix"
              />
            </FormGroup>

            <div style={{ display: "flex", gap: "1rem" }}>
              <FormGroup label="Code postal" isRequired fieldId="codePostal" style={{ flex: 1 }}>
                <TextInput
                  isRequired
                  type="text"
                  id="codePostal"
                  value={formData.codePostal}
                  onChange={(e) => handleInputChange(e.currentTarget.value, "codePostal")}
                  placeholder="1000"
                />
              </FormGroup>

              <FormGroup label="Ville" isRequired fieldId="ville" style={{ flex: 2 }}>
                <TextInput
                  isRequired
                  type="text"
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => handleInputChange(e.currentTarget.value, "ville")}
                  placeholder="Bruxelles"
                />
              </FormGroup>
            </div>

            <FormGroup label="Pays" isRequired fieldId="pays">
              <Select
                variant={SelectVariant.single}
                isOpen={isCountryOpen}
                onToggle={setIsCountryOpen}
                selections={formData.pays}
                onSelect={(_, selection) => {
                  handleInputChange(selection as string, "pays");
                  setIsCountryOpen(false);
                }}
              >
                {countries.map((country) => (
                  <SelectOption key={country} value={country}>
                    {country}
                  </SelectOption>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Téléphone (optionnel)" fieldId="telephone">
              <TextInput
                type="tel"
                id="telephone"
                value={formData.telephone}
                onChange={(e) => handleInputChange(e.currentTarget.value, "telephone")}
                placeholder="+32 123 45 67 89"
              />
            </FormGroup>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              isDisabled={isLoading || panier.length === 0}
              style={{ width: "100%", marginTop: "1rem" }}
            >
              {isLoading ? "Traitement..." : `Payer ${calculerTotal()}€`}
            </Button>
          </Form>
        </CardBody>
      </Card>

      {/* Résumé de commande */}
      <Card style={{ flex: 1, height: "fit-content" }}>
        <CardBody>
          <Title headingLevel="h3" size="md" style={{ marginBottom: "1rem" }}>
            Résumé de commande
          </Title>

          <div style={{ marginBottom: "1rem" }}>
            {panier.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{item.productName}</div>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>
                    {item.size && `Taille: ${item.size} | `}Qté: {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: "bold" }}>{(item.price * item.quantity).toFixed(2)}€</div>
              </div>
            ))}
          </div>

          <Divider />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 0",
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
          >
            <span>Total</span>
            <span>{calculerTotal()}€</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CheckoutForm;
