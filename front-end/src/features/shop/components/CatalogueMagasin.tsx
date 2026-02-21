import React from "react";
import {
  Gallery,
  GalleryItem,
  PageSection,
  Title,
  ExpandableSection,
  Divider,
  Button,
  Badge,
} from "@patternfly/react-core";
import ArticleCard from "./features-shop/ArticleCard";
import type { Article } from "@clubmanager/types";
import { useMediaQuery } from "@/shared/hooks/utils";

interface CatalogueMagasinProps {
  articlesParCategorie: Record<string, Article[]>;
  expandedCategories: Record<string, boolean>;
  onToggleCategorie: (nomCategorie: string) => void;
  onAjouterAuPanier: (article: Article, taille: string) => void;
  onOpenInfoModal: (article: Article) => void;
  // AJOUTÉ: Pour forcer le rechargement si nécessaire
  refreshKey?: string | number;
}

const CatalogueMagasin: React.FC<CatalogueMagasinProps> = ({
  articlesParCategorie,
  expandedCategories,
  onToggleCategorie,
  onAjouterAuPanier,
  onOpenInfoModal,
  refreshKey,
}) => {
  // Détection responsive pour adapter la grille
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

  // Adapter la largeur minimale des cartes selon l'écran
  const minCardWidth = isMobile ? "100%" : isTablet ? "280px" : "300px";

  return (
    <PageSection>
      {Object.entries(articlesParCategorie || {}).map(([categorie, articles], idx) => (
        <div key={`${categorie}-${refreshKey || 0}`}>
          {idx > 0 && <Divider style={{ margin: "2rem 0", borderTop: "2px solid #dee2e6" }} />}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <Title headingLevel="h2" size="xl" style={{ margin: 0, color: "#495057" }}>
              {categorie}
            </Title>
            <Badge
              style={{
                backgroundColor: "#007bff",
                color: "white",
                fontSize: "0.9rem",
                padding: "0.25rem 0.75rem",
              }}
            >
              {Array.isArray(articles) ? articles.length : 0} article
              {Array.isArray(articles) && articles.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <ExpandableSection
            toggleText={
              expandedCategories[categorie] ? "Masquer les articles" : "Voir les articles"
            }
            onToggle={() => onToggleCategorie(categorie)}
            isExpanded={expandedCategories[categorie]}
            style={{
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            {Array.isArray(articles) && articles.length > 0 ? (
              <Gallery
                hasGutter
                minWidths={{ default: minCardWidth }}
                style={{ marginTop: "1rem" }}
              >
                {articles.map((article: Article) => {
                  // CORRIGÉ: Créer une clé basée sur les stocks sans utiliser JSON.stringify dans JSX
                  const stocksHash =
                    article.stocks?.map((s) => `${s.taille}-${s.quantite}`).join("|") || "";

                  return (
                    <GalleryItem key={`${article.id}-${refreshKey || 0}`}>
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: "12px",
                          overflow: "hidden",
                          border: "1px solid #dee2e6",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          transition: "transform 0.2s ease-in-out",
                        }}
                      >
                        <ArticleCard
                          key={`card-${article.id}-${stocksHash}`} // CORRIGÉ: Clé simplifiée basée sur les stocks
                          title={article.nom}
                          description={article.description}
                          imageUrl={article.images?.[0] || ""}
                          prix={article.prix}
                          stocks={article.stocks}
                          onAddToCart={(taille: string) => onAjouterAuPanier(article, taille)}
                          onOpenDetails={() => onOpenInfoModal(article)}
                        />
                        <div
                          style={{
                            padding: "0.75rem",
                            background: "#f8f9fa",
                            borderTop: "1px solid #dee2e6",
                          }}
                        ></div>
                      </div>
                    </GalleryItem>
                  );
                })}
              </Gallery>
            ) : (
              <div
                style={{
                  color: "#6c757d",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "2rem",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                Aucun article dans cette catégorie
              </div>
            )}
          </ExpandableSection>
        </div>
      ))}
    </PageSection>
  );
};

export default CatalogueMagasin;
