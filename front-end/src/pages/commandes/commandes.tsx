import React, { useMemo, useState } from 'react';
import { 
  Title, 
  Spinner, 
  Alert, 
  PageSection, 
  Button,
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Badge
} from '@patternfly/react-core';
import { 
  SearchIcon 
} from '@patternfly/react-icons';
import { 
  useCommandes, 
  useUpdateCommandeStatut, 
  useCommandesStats
  // SUPPRIMÉ: useBatchUpdateStatuts
} from '../../hooks/useCommandes';
import { useToast } from '../../hooks/useToast';
import TableauCommandes from '../../components/commandes/TableauCommandes';
import FiltrageCommandes from '../../components/commandes/FiltrageCommandes';
import StatistiquesCommandes from '../../components/commandes/StatistiquesCommandes';
import { PageHeader } from '../../components/common/PageHeader';

const Commandes = () => {
  const [filterInput, setFilterInput] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [activeSortIndex, setActiveSortIndex] = useState<number | undefined>(undefined);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | undefined>(undefined);
  const [isUpdatingStatut, setIsUpdatingStatut] = useState<string | null>(null);

  // Hooks React Query
  const { data: commandes = [], isLoading, error, refetch } = useCommandes();
  const updateCommandeStatut = useUpdateCommandeStatut();
  // SUPPRIMÉ: batchUpdateStatuts
  const { showToast } = useToast();
  const statistiques = useCommandesStats(commandes || []);

  const filteredData = useMemo(() => {
    // AJOUTÉ: Vérification de sécurité
    if (!Array.isArray(commandes) || !filterInput) return commandes || [];
    
    return commandes.filter(c => {
      if (!c) return false;
      
      const searchTerm = filterInput.toLowerCase();
      return (
        c.id?.toString().includes(searchTerm) ||
        c.unique_id?.toLowerCase().includes(searchTerm) ||
        c.numero_commande?.toLowerCase().includes(searchTerm) ||
        c.statut?.toLowerCase().includes(searchTerm) ||
        c.total?.toString().includes(searchTerm) ||
        c.nom_utilisateur?.toLowerCase().includes(searchTerm) ||
        c.first_name?.toLowerCase().includes(searchTerm) ||
        c.last_name?.toLowerCase().includes(searchTerm)
      );
    });
  }, [commandes, filterInput]);

  const getSortableRowValues = (commande: any): (string | number)[] => [
    commande?.id || 0,
    commande?.numero_commande || commande?.unique_id || '',
    new Date(commande?.date_commande || commande?.created_at || 0).getTime(),
    commande?.statut || '',
    // MODIFIÉ: Gérer le cas où articles n'existe pas
    Array.isArray(commande?.articles) ? commande.articles.length : 0,
    parseFloat(commande?.total || '0'),
  ];

  const sortedData = useMemo(() => {
    // AJOUTÉ: Vérification de sécurité
    if (!Array.isArray(filteredData) || activeSortIndex === undefined || activeSortDirection === undefined) {
      return filteredData || [];
    }

    return [...filteredData].sort((a, b) => {
      if (!a || !b) return 0;
      
      const aValue = getSortableRowValues(a)[activeSortIndex];
      const bValue = getSortableRowValues(b)[activeSortIndex];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return activeSortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, activeSortIndex, activeSortDirection]);

  // AJOUTÉ: Fonction pour forcer le rafraîchissement
  const handleForceRefresh = async () => {
    console.log('🔄 [Commandes] Rafraîchissement forcé demandé...');
    try {
      await refreshCommandes.mutateAsync();
      showToast('Données rafraîchies depuis la base de données', 'success');
    } catch (error) {
      showToast('Erreur lors du rafraîchissement', 'danger');
    }
  };

  // AJOUTÉ: Fonction pour exporter les commandes
  const exportCommandes = () => {
    const csvContent = [
      ['ID', 'Numéro', 'Date', 'Client', 'Statut', 'Total'].join(','),
      ...filteredData.map(c => [
        c.id || '',
        c.numero_commande || c.unique_id || '',
        new Date(c.date_commande || c.created_at).toLocaleDateString('fr-FR'),
        `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.nom_utilisateur || 'Inconnu',
        c.statut || '',
        c.total || '0'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // OPTIMISÉ: Fonction de changement de statut avec feedback utilisateur amélioré
  const onChangeStatut = async (commandeId: string, newStatut: string) => {
    try {
      setIsUpdatingStatut(commandeId);
      
      const commande = commandes.find(c => 
        c.id?.toString() === commandeId || 
        c.unique_id === commandeId || 
        c.numero_commande === commandeId
      );
      
      if (!commande) {
        showToast('Commande non trouvée', 'danger');
        return;
      }

      console.log('🚀 [Commandes] Changement statut OPTIMISÉ:', {
        commandeId,
        ancienStatut: commande.statut,
        nouveauStatut: newStatut
      });

      // AJOUTÉ: Feedback immédiat à l'utilisateur
      showToast('Mise à jour en cours...', 'info');

      const response = await updateCommandeStatut.mutateAsync({ 
        commandeId: commande.id?.toString() || commandeId, 
        newStatut 
      });
      
      // Message de succès avec détails
      let successMessage = `Commande ${newStatut}`;
      if (response.stocksAffectes) {
        successMessage += ` (${response.articlesTraites} stocks mis à jour)`;
      }
      
      showToast(successMessage, 'success');
      
    } catch (error: any) {
      console.error('❌ [Commandes] Erreur:', error);
      
      // Message d'erreur plus spécifique
      if (error.message.includes('timeout') || error.message.includes('lock')) {
        showToast('Serveur occupé, veuillez réessayer dans quelques secondes', 'warning');
      } else {
        showToast('Erreur lors de la mise à jour', 'danger');
      }
    } finally {
      setIsUpdatingStatut(null);
    }
  };

  // SUPPRIMÉ: handleBatchUpdate

  // AJOUTÉ: Debug pour voir les données récupérées
  React.useEffect(() => {
    if (commandes.length > 0) {
      console.log('📊 [Commandes] Données avec détails et impact stocks:', {
        total: commandes.length,
        statuts: statistiques.repartitionStatuts,
        totalArticles: commandes.reduce((sum, c) => sum + (c.articles?.length || 0), 0),
        commandesExpediees: commandes.filter(c => c.statut === 'expédiée').length,
        sample: commandes.slice(0, 2).map(c => ({
          id: c.id,
          numero: c.numero_commande,
          statut: c.statut,
          total: c.total,
          nbArticles: c.articles?.length || 0,
          impactStockSiExpediee: c.statut !== 'expédiée' ? 'Décrémentera les stocks' : 'Déjà expédiée'
        }))
      });
    }
  }, [commandes, statistiques]);

  const toggleRow = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const onSort = (_event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
  };

  if (isLoading) {
    return (
      <div className="commandes-page">
        <PageHeader
          title="Gestion des commandes"
          subtitle="Chargement des commandes en cours..."
          variant="commandes"
        />
        <PageSection>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <Spinner size="xl" />
            <Title headingLevel="h4" size="lg">
              Chargement des commandes...
            </Title>
          </div>
        </PageSection>
      </div>
    );
  }

  if (error) {
    return (
      <div className="commandes-page">
        <PageHeader
          title="Gestion des commandes"
          subtitle="Erreur lors du chargement"
          variant="commandes"
        />
        <PageSection>
          <Alert 
            variant="danger" 
            title="Erreur lors du chargement des commandes"
            style={{ borderRadius: '8px' }}
          >
            <p>{error?.message || 'Une erreur est survenue lors du chargement des données.'}</p>
            <div style={{ marginTop: '1rem' }}>
              <Button 
                variant="primary" 
                onClick={() => refetch()}
              >
                Réessayer
              </Button>
            </div>
          </Alert>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="commandes-page" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <PageHeader
        title="Gestion des commandes"
        subtitle={
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem>
              {statistiques.total} commandes au total
            </FlexItem>
            <FlexItem>•</FlexItem>
            <FlexItem>
              {statistiques.chiffreAffaires.toFixed(2)}€ de chiffre d'affaires
            </FlexItem>
            <FlexItem>•</FlexItem>
            <FlexItem>
              Dernière MAJ: {new Date().toLocaleTimeString('fr-FR')}
            </FlexItem>
          </Flex>
        }
        variant="commandes"
      />

      <PageSection style={{ paddingTop: '1.5rem' }}>
        <Grid hasGutter>
          {/* Section Statistiques */}
          <GridItem span={12}>
            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardTitle>
                <Title headingLevel="h3" size="lg">
                  Aperçu des commandes
                </Title>
              </CardTitle>
              <CardBody>
                <StatistiquesCommandes 
                  commandes={commandes} 
                  statistiques={statistiques}
                />
              </CardBody>
            </Card>
          </GridItem>

          {/* Section Filtrage */}
          <GridItem span={12}>
            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <SearchIcon style={{ marginRight: '0.5rem' }} />
                    Recherche et filtres
                  </FlexItem>
                  <FlexItem align={{ default: 'alignRight' }}>
                    <Badge color="blue">
                      {filteredData.length} / {commandes.length} commandes
                    </Badge>
                  </FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <FiltrageCommandes
                  filterInput={filterInput}
                  onFilterChange={setFilterInput}
                  totalCommandes={commandes.length}
                  commandesFiltrees={filteredData.length}
                />
              </CardBody>
            </Card>
          </GridItem>

          {/* Section Tableau */}
          <GridItem span={12}>
            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardBody style={{ padding: 0 }}>
                <TableauCommandes
                  commandes={sortedData}
                  expandedRows={expandedRows}
                  activeSortIndex={activeSortIndex}
                  activeSortDirection={activeSortDirection}
                  onToggleRow={toggleRow}
                  onSort={onSort}
                  onChangeStatut={onChangeStatut}
                  isUpdatingStatut={isUpdatingStatut}
                />
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </div>
  );
};

export default Commandes;