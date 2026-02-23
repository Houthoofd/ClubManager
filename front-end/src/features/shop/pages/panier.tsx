import React, { useState } from "react";
import {
  Button,
  Select,
  SelectOption,
  SelectList,
  Label,
  TextInput, // AJOUTÉ: Import de TextInput
} from "@patternfly/react-core";
import { ShoppingCartIcon, ChevronLeftIcon, ChevronRightIcon } from '@/shared/icons';
import BaseModal from "@/shared/components/common-legacy/modal/BaseModal";

interface DetailArticleModalProps {
  isOpen: boolean;
  selectedArticle: any;
  selectedTaille: string | null;
  isTailleOpen: boolean;
  onClose: () => void;
  onTailleSelect: (taille: string) => void;
  onTailleToggle: (isOpen: boolean) => void;
  onAjouterAuPanier: (article: any, taille: string, quantite: number) => void; // Modifier pour passer les paramètres
}

const DetailArticleModal: React.FC<DetailArticleModalProps> = ({
  isOpen,
  selectedArticle,
  selectedTaille,
  isTailleOpen,
  onClose,
  onTailleSelect,
  onTailleToggle,
  onAjouterAuPanier,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedQuantite, setSelectedQuantite] = useState(1);
  // AJOUTÉ: État local pour les stocks qui se met à jour automatiquement
  const [stocksActuels, setStocksActuels] = useState(selectedArticle?.stocks || []);

  // AJOUTÉ: Mettre à jour les stocks locaux quand l'article change
  React.useEffect(() => {
    if (selectedArticle?.stocks) {
      console.log("📊 [Modal] Mise à jour stocks article:", selectedArticle.nom);
      setStocksActuels(selectedArticle.stocks);
    }
  }, [selectedArticle?.stocks]);

  const nextImage = () => {
    if (selectedArticle?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev === selectedArticle.images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    if (selectedArticle?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? selectedArticle.images.length - 1 : prev - 1));
    }
  };

  // Fonction pour obtenir le stock maximum pour la taille sélectionnée
  const getMaxStock = () => {
    if (!selectedTaille || !stocksActuels) return 0;
    const stock = stocksActuels.find((s: any) => s.taille === selectedTaille);
    return stock?.quantite || 0;
  };

  // Reset quantité quand la taille change
  React.useEffect(() => {
    setSelectedQuantite(1);
  }, [selectedTaille]);

  // Reset image index when modal opens with new article
  React.useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedQuantite(1);
  }, [selectedArticle?.id]);

  // MODIFIÉ: Reset la taille sélectionnée à chaque ouverture de modal
  React.useEffect(() => {
    if (isOpen && selectedArticle) {
      console.log("🔄 [Modal] Ouverture modal - reset taille");

      // MODIFIÉ: Ne pas sélectionner automatiquement une taille
      // Laisser l'utilisateur choisir explicitement
      onTailleSelect(""); // Reset à vide
    }
  }, [isOpen, selectedArticle?.id]); // MODIFIÉ: Se déclencher à chaque ouverture

  // CORRIGÉ: Fonction pour gérer les changements de quantité avec NumberInput
  const handleQuantiteChange = (event: React.FormEvent<HTMLInputElement>, value: number) => {
    const maxStock = getMaxStock();
    if (value >= 1 && value <= maxStock) {
      setSelectedQuantite(value);
    }
  };

  // AJOUTÉ: Fonction alternative pour gérer les changements directs de valeur
  const handleQuantiteDirectChange = (value: number) => {
    const maxStock = getMaxStock();
    const newValue = Math.min(Math.max(1, value), maxStock);
    setSelectedQuantite(newValue);
  };

  const incrementQuantite = () => {
    const maxStock = getMaxStock();
    if (selectedQuantite < maxStock) {
      setSelectedQuantite((prev) => prev + 1);
    }
  };

  const decrementQuantite = () => {
    if (selectedQuantite > 1) {
      setSelectedQuantite((prev) => prev - 1);
    }
  };

  const handleAjouterAuPanier = () => {
    if (selectedArticle && selectedTaille && selectedQuantite > 0) {
      // MODIFIÉ: S'assurer que l'article contient les stocks à jour
      const articleAvecStockActuel = {
        ...selectedArticle,
        // Forcer le rechargement des stocks si nécessaire
        stocks: selectedArticle.stocks || [],
      };

      onAjouterAuPanier(articleAvecStockActuel, selectedTaille, selectedQuantite);

      // Reset des valeurs pour la prochaine utilisation
      setSelectedQuantite(1);
      setCurrentImageIndex(0);

      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedArticle?.nom || "Informations sur l'article"}
      size="large"
      actions={[
        <Button
          key="add-to-cart"
          variant="primary"
          onClick={handleAjouterAuPanier} // Utiliser la fonction locale
          isDisabled={!selectedTaille || selectedQuantite < 1}
          size="lg"
          style={{ padding: "0.75rem 2rem" }}
          icon={<ShoppingCartIcon />}
        >
          Ajouter au panier ({selectedQuantite})
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Annuler
        </Button>,
      ]}
    >
      {selectedArticle ? (
        <div style={{ lineHeight: "1.6" }}>
          {selectedArticle.images?.length > 0 && (
            <div
              style={{
                marginBottom: "1.5rem",
                position: "relative",
                width: "100%",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                }}
              >
                <img
                  src={selectedArticle.images[currentImageIndex]}
                  alt={`${selectedArticle.nom} - Image ${currentImageIndex + 1}`}
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #dee2e6",
                  }}
                />

                {/* Navigation buttons pour plusieurs images */}
                {selectedArticle.images.length > 1 && (
                  <>
                    <Button
                      variant="control"
                      onClick={prevImage}
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        color: "white",
                        borderRadius: "50%",
                        width: "45px",
                        height: "45px",
                        minWidth: "45px",
                        padding: 0,
                        zIndex: 2,
                      }}
                      icon={<ChevronLeftIcon />}
                    />
                    <Button
                      variant="control"
                      onClick={nextImage}
                      style={{
                        position: "absolute",
                        right: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        color: "white",
                        borderRadius: "50%",
                        width: "45px",
                        height: "45px",
                        minWidth: "45px",
                        padding: 0,
                        zIndex: 2,
                      }}
                      icon={<ChevronRightIcon />}
                    />
                  </>
                )}

                {/* Compteur d'images */}
                {selectedArticle.images.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "15px",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      zIndex: 2,
                    }}
                  >
                    {currentImageIndex + 1} / {selectedArticle.images.length}
                  </div>
                )}
              </div>

              {/* Indicateurs de pagination */}
              {selectedArticle.images.length > 1 && (
                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.6rem",
                  }}
                >
                  {selectedArticle.images.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: index === currentImageIndex ? "#007bff" : "#dee2e6",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        boxShadow:
                          index === currentImageIndex ? "0 0 0 2px rgba(0, 123, 255, 0.3)" : "none",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <strong>Prix :</strong>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#495057",
                marginLeft: "0.5rem",
              }}
            >
              {selectedArticle.prix} €
            </span>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Description :</strong>
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                background: "#f8f9fa",
                borderRadius: "6px",
                border: "1px solid #dee2e6",
                color: "#495057",
              }}
            >
              {selectedArticle.description || "Aucune description disponible"}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <strong>Stock disponible :</strong>
            <div
              style={{
                marginTop: "0.5rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {/* MODIFIÉ: Utiliser stocksActuels au lieu de selectedArticle.stocks */}
              {stocksActuels
                ?.reduce((acc: any[], stock: any) => {
                  const existingStock = acc.find((s) => s.taille === stock.taille);
                  if (existingStock) {
                    existingStock.quantite += stock.quantite;
                  } else {
                    acc.push({
                      taille: stock.taille,
                      quantite: stock.quantite,
                    });
                  }
                  return acc;
                }, [])
                ?.map((stock: any, i: any) => (
                  <div
                    key={`${selectedArticle.id}-${stock.taille}-${i}-${stock.quantite}-${Date.now()}`} // MODIFIÉ: Clé unique avec timestamp
                    style={{
                      padding: "0.5rem 0.75rem",
                      background: stock.quantite > 0 ? "#e8f5e8" : "#ffebee",
                      color: stock.quantite > 0 ? "#2e7d32" : "#c62828",
                      borderRadius: "6px",
                      border: `1px solid ${stock.quantite > 0 ? "#4caf50" : "#f44336"}`,
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    Taille {stock.taille} : {stock.quantite} en stock
                    {/* Indicateur si stock ajusté */}
                    {stock.quantite !== stock.quantiteOriginale && stock.quantiteOriginale && (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "normal",
                          color: "#666",
                          marginLeft: "0.25rem",
                        }}
                      >
                        (était {stock.quantiteOriginale})
                      </span>
                    )}
                  </div>
                ))}
            </div>
            {/* Message informatif */}
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                color: "#666",
                fontStyle: "italic",
              }}
            >
              * Les stocks affichés se mettent à jour en temps réel selon votre panier
            </div>
          </div>

          <div
            style={{
              padding: "1rem",
              background: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            <strong style={{ color: "#495057" }}>Choisir la taille :</strong>
            <Select
              isOpen={isTailleOpen}
              selected={selectedTaille}
              onSelect={(_e, value) => {
                console.log("🔄 [Modal] Sélection taille:", value);
                onTailleSelect(value as string);
                onTailleToggle(false);
              }}
              onOpenChange={onTailleToggle}
              toggle={(toggleRef) => (
                <Button
                  ref={toggleRef}
                  variant="secondary"
                  onClick={() => onTailleToggle(!isTailleOpen)}
                  style={{
                    width: "100%",
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "6px",
                  }}
                >
                  {selectedTaille || "Sélectionner une taille"}{" "}
                  {/* MODIFIÉ: Toujours afficher le placeholder si rien n'est sélectionné */}
                </Button>
              )}
              shouldFocusToggleOnSelect
            >
              <SelectList>
                {/* MODIFIÉ: Utiliser stocksActuels et s'assurer que toutes les tailles disponibles sont affichées */}
                {stocksActuels
                  ?.reduce((acc: any[], stock: any) => {
                    const existingStock = acc.find((s) => s.taille === stock.taille);
                    if (existingStock) {
                      existingStock.quantite += stock.quantite;
                    } else if (stock.quantite > 0) {
                      // MODIFIÉ: Afficher toutes les tailles avec stock > 0
                      acc.push({
                        taille: stock.taille,
                        quantite: stock.quantite,
                      });
                    }
                    return acc;
                  }, [])
                  ?.sort((a, b) => a.taille.localeCompare(b.taille)) // AJOUTÉ: Trier les tailles
                  ?.map((stock: any, i: any) => (
                    <SelectOption key={`option-${stock.taille}-${i}`} value={stock.taille}>
                      Taille {stock.taille} ({stock.quantite} en stock)
                    </SelectOption>
                  ))}
              </SelectList>
            </Select>

            {/* Section quantité */}
            {selectedTaille && (
              <div style={{ marginTop: "1rem" }}>
                <strong style={{ color: "#495057" }}>Quantité :</strong>
                <div
                  style={{
                    marginTop: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={decrementQuantite}
                    isDisabled={selectedQuantite <= 1}
                    style={{
                      minWidth: "40px",
                      height: "40px",
                      padding: 0,
                    }}
                  >
                    -
                  </Button>

                  <TextInput
                    type="number"
                    value={selectedQuantite.toString()}
                    onChange={(event, value) => {
                      const numValue = parseInt(value) || 1;
                      handleQuantiteDirectChange(numValue);
                    }}
                    min={1}
                    max={getMaxStock()}
                    style={{
                      width: "80px",
                      textAlign: "center",
                    }}
                  />

                  <Button
                    variant="secondary"
                    onClick={incrementQuantite}
                    isDisabled={selectedQuantite >= getMaxStock()}
                    style={{
                      minWidth: "40px",
                      height: "40px",
                      padding: 0,
                    }}
                  >
                    +
                  </Button>

                  <span
                    style={{
                      marginLeft: "0.5rem",
                      color: "#6c757d",
                      fontSize: "0.9rem",
                    }}
                  >
                    (max: {getMaxStock()})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "#6c757d",
            fontStyle: "italic",
          }}
        >
          Aucun article sélectionné.
        </div>
      )}
    </BaseModal>
  );
};

export default DetailArticleModal;
