import React, { useState, useMemo } from 'react';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
} from '@patternfly/react-table';
import { 
  FormSelect, 
  FormSelectOption, 
  Title, 
  Card, 
  CardTitle,
  CardBody,
  Badge,
  Label,
  Button,
  EmptyState,
  EmptyStateBody,
  Grid,
  GridItem,
  Pagination,
  Flex,
  FlexItem,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Gallery,
  GalleryItem
} from '@patternfly/react-core';
import { 
  ShoppingCartIcon, 
  AngleUpIcon, 
  AngleDownIcon,
  UserIcon,
  CalendarAltIcon,
  TagIcon,
  CubeIcon,
  DollarSignIcon,
  InfoCircleIcon
} from '@patternfly/react-icons';

interface TableauCommandesProps {
  commandes: any[];
  expandedRows: Set<number>;
  activeSortIndex: number | undefined;
  activeSortDirection: 'asc' | 'desc' | undefined;
  onToggleRow: (rowIndex: number) => void;
  onSort: (event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => void;
  onChangeStatut: (commandeId: string, newStatut: string) => void;
  isUpdatingStatut?: string | null;
  stocks?: any;
}

const StatutSelector: React.FC<{
  currentStatut: string;
  onStatutChange: (newStatut: string) => void;
  isLoading?: boolean;
}> = ({ currentStatut, onStatutChange, isLoading }) => {
  const statutsOptions = [
    { value: 'en attente', label: 'En attente' },
    { value: 'payée', label: 'Payée' },
    { value: 'expédiée', label: 'Expédiée' },
    { value: 'annulée', label: 'Annulée' }
  ];

  return (
    <FormSelect
      value={currentStatut}
      onChange={(event, value) => onStatutChange(value)}
      isDisabled={isLoading}
      style={{ minWidth: '120px' }}
    >
      {statutsOptions.map((option) => (
        <FormSelectOption 
          key={option.value} 
          value={option.value} 
          label={option.label} 
        />
      ))}
    </FormSelect>
  );
};

const TableauCommandes: React.FC<TableauCommandesProps> = ({
  commandes,
  expandedRows,
  activeSortIndex,
  activeSortDirection,
  onToggleRow,
  onSort,
  onChangeStatut,
  isUpdatingStatut,
  stocks
}) => {
  // AJOUTÉ: États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // AJOUTÉ: Calculs pour la pagination
  const totalItems = commandes.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCommandes = commandes.slice(startIndex, endIndex);

  // AJOUTÉ: Gestion des changements de pagination
  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setCurrentPage(newPage);
  };

  const onPerPageSelect = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1);
  };

  // CORRIGÉ: Fonction pour obtenir les articles avec la vraie structure DB
  const getArticles = (commande: any): any[] => {
    if (!commande) return [];
    
    // Si les articles sont déjà un tableau (cas normal maintenant)
    if (Array.isArray(commande.articles)) {
      console.log(`📦 [Tableau] Commande ${commande.id}: ${commande.articles.length} articles avec structure DB`);
      return commande.articles.map((article: any) => ({
        ...article,
        // CORRIGÉ: Utiliser les vrais noms de champs de la DB
        nom: article.article_nom || article.nom || 'Article inconnu',
        prix: article.prix || article.prix_unitaire || '0', // Prix au moment de la commande
        prixActuel: article.prix_unitaire || article.prix || '0', // Prix actuel
        quantite: article.quantite || 0,
        taille: article.taille || 'N/A',
        description: article.article_description || '',
        categorie: article.categorie_nom || '',
        images: article.images || (article.image_url ? [article.image_url] : [])
      }));
    }
    
    // Fallback: Si les articles sont stockés en JSON string (ancien format)
    if (typeof commande.articles === 'string') {
      try {
        const parsed = JSON.parse(commande.articles);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    
    return [];
  };

  // CORRIGÉ: Fonction pour calculer le total avec les vrais prix de commande
  const calculateTotal = (commande: any): number => {
    if (!commande) return 0;
    
    // Priorité au total depuis la DB (plus fiable)
    if (commande.total) {
      return parseFloat(commande.total);
    }
    
    // Fallback: calculer depuis les articles
    const articles = getArticles(commande);
    return articles.reduce((sum: number, article: any) => {
      const prix = parseFloat(article.prix || 0); // Prix au moment de la commande
      const quantite = parseInt(article.quantite || 0);
      return sum + (prix * quantite);
    }, 0);
  };

  // AJOUTÉ: Fonction pour formater la date de manière sécurisée
  const formatDate = (commande: any): string => {
    if (!commande) return 'Date inconnue';
    
    const dateStr = commande.date_commande || commande.created_at;
    if (!dateStr) return 'Date inconnue';
    
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // AJOUTÉ: Fonction pour obtenir l'ID de commande
  const getCommandeId = (commande: any): string => {
    return commande?.numero_commande || commande?.unique_id || commande?.id?.toString() || 'N/A';
  };

  // AJOUTÉ: Fonction pour obtenir le nom du client
  const getClientName = (commande: any): string => {
    if (!commande) return 'Client inconnu';
    
    const firstName = commande.first_name || '';
    const lastName = commande.last_name || '';
    const username = commande.nom_utilisateur || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (username) {
      return username;
    }
    
    return `Utilisateur ${commande.utilisateur_id || 'inconnu'}`;
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Title headingLevel="h3" size="lg" style={{ marginBottom: '0.5rem' }}>
              Liste des commandes
            </Title>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              <span>
                {totalItems} commandes trouvées
              </span>
              {currentPage > 1 && (
                <>
                  <span>•</span>
                  <span>
                    Page {currentPage} sur {Math.ceil(totalItems / itemsPerPage)}
                  </span>
                </>
              )}
              {isUpdatingStatut && (
                <>
                  <span>•</span>
                  <Badge color="blue">
                    Mise à jour en cours...
                  </Badge>
                </>
              )}
            </div>
          </FlexItem>
          
          {/* AJOUTÉ: Pagination en haut */}
          {totalItems > 10 && (
            <FlexItem>
              <Pagination
                itemCount={totalItems}
                perPage={itemsPerPage}
                page={currentPage}
                onSetPage={onSetPage}
                onPerPageSelect={onPerPageSelect}
                perPageOptions={[
                  { title: '5', value: 5 },
                  { title: '10', value: 10 },
                  { title: '20', value: 20 },
                  { title: '50', value: 50 }
                ]}
                variant="top"
                isCompact
              />
            </FlexItem>
          )}
        </Flex>
      </div>

      {!Array.isArray(commandes) || commandes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6'
        }}>
          <ShoppingCartIcon style={{ 
            fontSize: '4rem', 
            color: '#6c757d', 
            marginBottom: '1rem',
            display: 'block',
            margin: '0 auto 1rem auto'
          }} />
          <Title headingLevel="h4" size="lg" style={{ marginBottom: '0.5rem' }}>
            Aucune commande trouvée
          </Title>
          <p style={{ color: '#6c757d', marginBottom: 0 }}>
            {!Array.isArray(commandes) 
              ? "Erreur de chargement des données" 
              : "Aucune commande n'a été passée pour le moment."
            }
          </p>
        </div>
      ) : (
        <>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden'
          }}>
            <Table aria-label="Tableau des commandes" variant="compact">
              <Thead style={{ backgroundColor: '#f8f9fa' }}>
                <Tr>
                  <Th 
                    sort={{
                      sortBy: { index: activeSortIndex, direction: activeSortDirection },
                      onSort: onSort,
                      columnIndex: 0
                    }}
                    style={{ fontWeight: 'bold' }}
                  >
                    Numéro
                  </Th>
                  <Th 
                    sort={{
                      sortBy: { index: activeSortIndex, direction: activeSortDirection },
                      onSort: onSort,
                      columnIndex: 1
                    }}
                    style={{ fontWeight: 'bold' }}
                  >
                    Date
                  </Th>
                  <Th style={{ fontWeight: 'bold' }}>Client</Th>
                  <Th 
                    sort={{
                      sortBy: { index: activeSortIndex, direction: activeSortDirection },
                      onSort: onSort,
                      columnIndex: 3
                    }}
                    style={{ fontWeight: 'bold' }}
                  >
                    Statut
                  </Th>
                  <Th 
                    sort={{
                      sortBy: { index: activeSortIndex, direction: activeSortDirection },
                      onSort: onSort,
                      columnIndex: 4
                    }}
                    style={{ fontWeight: 'bold' }}
                  >
                    Articles
                  </Th>
                  <Th 
                    sort={{
                      sortBy: { index: activeSortIndex, direction: activeSortDirection },
                      onSort: onSort,
                      columnIndex: 5
                    }}
                    style={{ fontWeight: 'bold' }}
                  >
                    Total
                  </Th>
                  <Th style={{ fontWeight: 'bold' }}>Actions</Th>
                  <Th style={{ fontWeight: 'bold' }}></Th>
                </Tr>
              </Thead>
              <Tbody>
                {/* MODIFIÉ: Utiliser paginatedCommandes au lieu de commandes */}
                {paginatedCommandes.map((commande: any, rowIndex: number) => {
                  // MODIFIÉ: Ajuster l'index pour la pagination
                  const globalRowIndex = startIndex + rowIndex;
                  const isExpanded = expandedRows.has(globalRowIndex);
                  const commandeId = getCommandeId(commande);
                  const articles = getArticles(commande);
                  const total = calculateTotal(commande);

                  return (
                    <React.Fragment key={`commande-${commande?.id || globalRowIndex}`}>
                      <Tr style={{ 
                        backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa',
                        transition: 'background-color 0.2s'
                      }}>
                        <Td dataLabel="Numéro">
                          <div style={{ 
                            fontWeight: 'bold',
                            color: '#0066cc',
                            fontSize: '0.9rem'
                          }}>
                            {commandeId}
                          </div>
                        </Td>
                        <Td dataLabel="Date">
                          <div style={{ fontSize: '0.85rem' }}>
                            {formatDate(commande)}
                          </div>
                        </Td>
                        <Td dataLabel="Client">
                          <div style={{ 
                            fontWeight: '500',
                            color: '#495057'
                          }}>
                            {getClientName(commande)}
                          </div>
                        </Td>
                        <Td dataLabel="Statut">
                          <Label 
                            color={getStatutColor(commande?.statut)}
                            variant="filled"
                            style={{ 
                              borderRadius: '6px',
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {commande?.statut || 'Inconnu'}
                          </Label>
                        </Td>
                        <Td dataLabel="Articles">
                          <Badge color="blue" style={{ borderRadius: '12px' }}>
                            {articles.length} article{articles.length > 1 ? 's' : ''}
                          </Badge>
                        </Td>
                        <Td dataLabel="Total">
                          <div style={{ 
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            color: '#28a745'
                          }}>
                            {total.toFixed(2)} €
                          </div>
                        </Td>
                        <Td dataLabel="Actions">
                          <StatutSelector
                            currentStatut={commande?.statut || 'en attente'}
                            onStatutChange={(newStatut) => onChangeStatut(commandeId, newStatut)}
                            isLoading={isUpdatingStatut === commandeId}
                          />
                        </Td>
                        <Td isActionCell>
                          <Button
                            variant="plain"
                            onClick={() => onToggleRow(globalRowIndex)}
                            icon={isExpanded ? <AngleUpIcon /> : <AngleDownIcon />}
                            style={{
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              minWidth: '32px',
                              padding: 0
                            }}
                          />
                        </Td>
                      </Tr>
                      
                      {/* AMÉLIORÉ: Ligne étendue avec design moderne */}
                      {isExpanded && (
                        <Tr isExpanded>
                          <Td colSpan={8} style={{ padding: 0 }}>
                            <ExpandableRowContent>
                              <div style={{ 
                                padding: '2rem',
                                backgroundColor: '#fafbfc',
                                borderTop: '3px solid #007bff'
                              }}>
                                {/* En-tête de la section détails */}
                                <div style={{ 
                                  marginBottom: '2rem',
                                  paddingBottom: '1rem',
                                  borderBottom: '2px solid #e9ecef'
                                }}>
                                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                                    <FlexItem>
                                      <Title headingLevel="h4" size="xl" style={{ color: '#007bff' }}>
                                        Commande {commandeId}
                                      </Title>
                                    </FlexItem>
                                    <FlexItem>
                                      <Label 
                                        color={getStatutColor(commande?.statut)}
                                        variant="filled"
                                        style={{ 
                                          fontSize: '0.9rem',
                                          padding: '0.4rem 1rem'
                                        }}
                                      >
                                        {commande?.statut || 'Inconnu'}
                                      </Label>
                                    </FlexItem>
                                  </Flex>
                                </div>

                                <Grid hasGutter>
                                  {/* Informations générales - Design amélioré */}
                                  <GridItem span={4}>
                                    <Card style={{ 
                                      height: '100%',
                                      border: '1px solid #dee2e6',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                      <CardTitle style={{ 
                                        padding: '1rem 1rem 0.5rem 1rem',
                                        borderBottom: '1px solid #f1f3f4'
                                      }}>
                                        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                          <InfoCircleIcon style={{ color: '#007bff' }} />
                                          <Title headingLevel="h5" size="md">
                                            Informations générales
                                          </Title>
                                        </Flex>
                                      </CardTitle>
                                      <CardBody>
                                        <DescriptionList isHorizontal isCompact>
                                          <DescriptionListGroup>
                                            <DescriptionListTerm>
                                              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                                                <TagIcon style={{ fontSize: '0.8rem', color: '#666' }} />
                                                ID interne
                                              </Flex>
                                            </DescriptionListTerm>
                                            <DescriptionListDescription>
                                              <Badge color="blue">{commande?.id || 'N/A'}</Badge>
                                            </DescriptionListDescription>
                                          </DescriptionListGroup>
                                          
                                          <DescriptionListGroup>
                                            <DescriptionListTerm>
                                              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                                                <TagIcon style={{ fontSize: '0.8rem', color: '#666' }} />
                                                ID unique
                                              </Flex>
                                            </DescriptionListTerm>
                                            <DescriptionListDescription>
                                              <code style={{ 
                                                backgroundColor: '#f8f9fa',
                                                padding: '0.2rem 0.4rem',
                                                borderRadius: '3px',
                                                fontSize: '0.85rem'
                                              }}>
                                                {commande?.unique_id || 'N/A'}
                                              </code>
                                            </DescriptionListDescription>
                                          </DescriptionListGroup>

                                          <DescriptionListGroup>
                                            <DescriptionListTerm>
                                              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                                                <UserIcon style={{ fontSize: '0.8rem', color: '#666' }} />
                                                Client
                                              </Flex>
                                            </DescriptionListTerm>
                                            <DescriptionListDescription>
                                              <strong>{getClientName(commande)}</strong>
                                              {commande?.utilisateur_email && (
                                                <div style={{ 
                                                  fontSize: '0.8rem', 
                                                  color: '#666',
                                                  marginTop: '0.2rem'
                                                }}>
                                                  {commande.utilisateur_email}
                                                </div>
                                              )}
                                            </DescriptionListDescription>
                                          </DescriptionListGroup>

                                          <DescriptionListGroup>
                                            <DescriptionListTerm>
                                              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                                                <CalendarAltIcon style={{ fontSize: '0.8rem', color: '#666' }} />
                                                Date
                                              </Flex>
                                            </DescriptionListTerm>
                                            <DescriptionListDescription>
                                              {formatDate(commande)}
                                            </DescriptionListDescription>
                                          </DescriptionListGroup>

                                          {commande?.ip_address && (
                                            <DescriptionListGroup>
                                              <DescriptionListTerm>Adresse IP</DescriptionListTerm>
                                              <DescriptionListDescription>
                                                <code style={{ 
                                                  backgroundColor: '#f8f9fa',
                                                  padding: '0.2rem 0.4rem',
                                                  borderRadius: '3px',
                                                  fontSize: '0.8rem'
                                                }}>
                                                  {commande.ip_address}
                                                </code>
                                              </DescriptionListDescription>
                                            </DescriptionListGroup>
                                          )}
                                        </DescriptionList>
                                      </CardBody>
                                    </Card>
                                  </GridItem>

                                  {/* Articles commandés - Design amélioré */}
                                  <GridItem span={8}>
                                    <Card style={{ 
                                      height: '100%',
                                      border: '1px solid #dee2e6',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                      <CardTitle style={{ 
                                        padding: '1rem 1rem 0.5rem 1rem',
                                        borderBottom: '1px solid #f1f3f4'
                                      }}>
                                        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                                          <FlexItem>
                                            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                              <CubeIcon style={{ color: '#007bff' }} />
                                              <Title headingLevel="h5" size="md">
                                                Articles commandés
                                              </Title>
                                              <Badge color="blue">{articles.length}</Badge>
                                            </Flex>
                                          </FlexItem>
                                          <FlexItem>
                                            <div style={{ 
                                              fontSize: '1.2rem',
                                              fontWeight: 'bold',
                                              color: '#28a745'
                                            }}>
                                              <DollarSignIcon style={{ marginRight: '0.25rem' }} />
                                              {total.toFixed(2)} €
                                            </div>
                                          </FlexItem>
                                        </Flex>
                                      </CardTitle>
                                      <CardBody>
                                        {articles.length > 0 ? (
                                          <div>
                                            {/* Articles en grille */}
                                            <Gallery hasGutter minWidths={{ default: '300px' }}>
                                              {articles.map((article: any, index: number) => (
                                                <GalleryItem key={`article-${article.commande_article_id || index}`}>
                                                  <Card style={{ 
                                                    border: '1px solid #e9ecef',
                                                    height: '100%'
                                                  }}>
                                                    <CardBody style={{ padding: '1rem' }}>
                                                      <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                                                        <FlexItem>
                                                          <div style={{ 
                                                            fontWeight: 'bold',
                                                            fontSize: '1rem',
                                                            color: '#343a40'
                                                          }}>
                                                            {article.nom}
                                                          </div>
                                                          {article.description && (
                                                            <div style={{ 
                                                              fontSize: '0.85rem',
                                                              color: '#6c757d',
                                                              marginTop: '0.25rem'
                                                            }}>
                                                              {article.description}
                                                            </div>
                                                          )}
                                                        </FlexItem>
                                                        
                                                        <FlexItem>
                                                          <Flex gap={{ default: 'gapSm' }} wrap={{ default: 'wrap' }}>
                                                            <Badge color="grey" style={{ 
                                                              padding: '0.3rem 0.6rem',
                                                              fontSize: '0.8rem'
                                                            }}>
                                                              Taille {article.taille}
                                                            </Badge>
                                                            <Badge color="blue" style={{ 
                                                              padding: '0.3rem 0.6rem',
                                                              fontSize: '0.8rem'
                                                            }}>
                                                              Qté: {article.quantite}
                                                            </Badge>
                                                            {article.categorie && (
                                                              <Badge color="purple" style={{ 
                                                                padding: '0.3rem 0.6rem',
                                                                fontSize: '0.8rem'
                                                              }}>
                                                                {article.categorie}
                                                              </Badge>
                                                            )}
                                                          </Flex>
                                                        </FlexItem>

                                                        <Divider />

                                                        <FlexItem>
                                                          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                                                            <FlexItem>
                                                              <div style={{ fontSize: '0.9rem' }}>
                                                                <strong>{parseFloat(article.prix || 0).toFixed(2)} €</strong> / unité
                                                                {article.prixActuel && article.prixActuel !== article.prix && (
                                                                  <div style={{ 
                                                                    fontSize: '0.75rem',
                                                                    color: '#28a745',
                                                                    fontStyle: 'italic'
                                                                  }}>
                                                                    Prix actuel: {parseFloat(article.prixActuel).toFixed(2)} €
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </FlexItem>
                                                            <FlexItem>
                                                              <div style={{ 
                                                                textAlign: 'right',
                                                                fontSize: '1.1rem',
                                                                fontWeight: 'bold',
                                                                color: '#28a745'
                                                              }}>
                                                                {(parseFloat(article.prix || 0) * parseInt(article.quantite || 0)).toFixed(2)} €
                                                              </div>
                                                            </FlexItem>
                                                          </Flex>
                                                        </FlexItem>
                                                      </Flex>
                                                    </CardBody>
                                                  </Card>
                                                </GalleryItem>
                                              ))}
                                            </Gallery>
                                            
                                            {/* Total final */}
                                            <div style={{ 
                                              marginTop: '1.5rem',
                                              padding: '1.5rem',
                                              backgroundColor: '#f8f9fa',
                                              borderRadius: '8px',
                                              border: '2px solid #28a745'
                                            }}>
                                              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                                                <FlexItem>
                                                  <Title headingLevel="h5" size="lg" style={{ color: '#28a745' }}>
                                                    Total de la commande
                                                  </Title>
                                                </FlexItem>
                                                <FlexItem>
                                                  <div style={{ 
                                                    fontSize: '1.8rem',
                                                    fontWeight: 'bold',
                                                    color: '#28a745'
                                                  }}>
                                                    {total.toFixed(2)} €
                                                  </div>
                                                </FlexItem>
                                              </Flex>
                                            </div>
                                          </div>
                                        ) : (
                                          <EmptyState>
                                            <EmptyStateBody>
                                              <div style={{ 
                                                textAlign: 'center',
                                                padding: '2rem',
                                                color: '#666'
                                              }}>
                                                <CubeIcon style={{ 
                                                  fontSize: '3rem',
                                                  color: '#dee2e6',
                                                  marginBottom: '1rem'
                                                }} />
                                                <div>Aucun détail d'article disponible</div>
                                              </div>
                                            </EmptyStateBody>
                                          </EmptyState>
                                        )}
                                      </CardBody>
                                    </Card>
                                  </GridItem>
                                </Grid>
                              </div>
                            </ExpandableRowContent>
                          </Td>
                        </Tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </Tbody>
            </Table>
          </div>
          
          {/* AJOUTÉ: Pagination en bas */}
          {totalItems > itemsPerPage && (
            <div style={{ 
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <Pagination
                itemCount={totalItems}
                perPage={itemsPerPage}
                page={currentPage}
                onSetPage={onSetPage}
                onPerPageSelect={onPerPageSelect}
                perPageOptions={[
                  { title: '5', value: 5 },
                  { title: '10', value: 10 },
                  { title: '20', value: 20 },
                  { title: '50', value: 50 }
                ]}
                variant="bottom"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// AJOUTÉ: Fonction helper pour obtenir la couleur du statut
const getStatutColor = (statut: string) => {
  switch (statut) {
    case 'en attente':
      return 'orange';
    case 'payée':
      return 'green';
    case 'expédiée':
      return 'blue';
    case 'annulée':
      return 'red';
    default:
      return 'grey';
  }
};

export default TableauCommandes;

