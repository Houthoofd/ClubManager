import React, { useState } from 'react';
import { 
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  PageSection,
  Card,
  CardBody,
  Grid,
  GridItem,
  Badge,
  Button,
  TextInput,
  FormSelect,
  FormSelectOption
} from '@patternfly/react-core';
import { 
  DollarSignIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  PlusIcon,
  TableIcon,
  CreditCardIcon
} from '@patternfly/react-icons';
import { SortableTable } from '../components/common/table/sortableTable';
import { usePaiements } from '../hooks/usePaiements';
import { PageHeader } from '../components/common/PageHeader';
import ResultModal from '../components/common/modal/ResultModal';
import ModalConfirmation from '../components/common/modal/ModalConfirmation';
import { TabContainer } from '../components/common/TabContainer';

export const Paiements: React.FC = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultSuccess, setResultSuccess] = useState(false);

  // États pour le formulaire d'ajout de paiement
  const [newPayment, setNewPayment] = useState({
    utilisateur_id: '',
    montant: '',
    methode_paiement: 'stripe',
    stripe_payment_intent_id: ''
  });

  // Utilisation du hook React Query pour récupérer les paiements
  const { data: paiements = [], isLoading, error } = usePaiements();

  if (isLoading) {
    return (
      <PageSection>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}>
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}>
          <p>Erreur lors du chargement des paiements. Veuillez réessayer.</p>
        </div>
      </PageSection>
    );
  }

  // Calcul des statistiques
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const stats = {
    total: paiements.reduce((sum, p) => sum + (p.montant || 0), 0),
    thisMonth: paiements
      .filter(p => {
        const paymentDate = new Date(p.date_paiement);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.montant || 0), 0),
    pending: paiements.filter(p => p.statut === 'en_attente').length,
    overdue: paiements.filter(p => {
      const endDate = new Date(p.periode_fin);
      return endDate < today && p.statut !== 'complete';
    }).length,
    completed: paiements.filter(p => p.statut === 'complete').length
  };

  // Fonction pour déterminer le statut d'un paiement
  const getPaymentStatus = (paiement: any) => {
    const endDate = new Date(paiement.periode_fin);
    const today = new Date();
    
    if (paiement.statut === 'complete') return 'complete';
    if (endDate < today) return 'overdue';
    if (paiement.statut === 'en_attente') return 'pending';
    return 'active';
  };

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge color="green" icon={<CheckCircleIcon />}>Payé</Badge>;
      case 'overdue':
        return <Badge color="red" icon={<ExclamationTriangleIcon />}>En retard</Badge>;
      case 'pending':
        return <Badge color="orange" icon={<ClockIcon />}>En attente</Badge>;
      default:
        return <Badge color="blue">Actif</Badge>;
    }
  };

  // Colonnes enrichies pour la table des paiements
  const columns = [
    { key: 'last_name', label: 'Nom' },
    { key: 'first_name', label: 'Prénom' },
    { key: 'nom_plan', label: "Type d'abonnement" },
    { 
      key: 'montant', 
      label: 'Montant',
      render: (value: number) => `${value}€`
    },
    { 
      key: 'periode_debut', 
      label: 'Période début',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
    },
    { 
      key: 'periode_fin', 
      label: 'Période fin',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string, row: any) => getStatusBadge(getPaymentStatus(row))
    },
    {
      key: 'methode_paiement',
      label: 'Méthode',
      render: (value: string) => value === 'stripe' ? 'Carte bancaire' : 'Autre'
    }
  ];

  // Filtrage avancé
  const filteredData = paiements.filter(paiement => {
    const status = getPaymentStatus(paiement);
    
    // Filtre par recherche
    const matchesSearch = search.trim() === '' || 
      `${paiement.first_name} ${paiement.last_name} ${paiement.nom_plan}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());

    // Filtre par statut
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    // Filtre par période
    let matchesPeriod = true;
    if (periodFilter !== 'all') {
      const paymentDate = new Date(paiement.date_paiement);
      const now = new Date();
      
      switch (periodFilter) {
        case 'thisMonth':
          matchesPeriod = paymentDate.getMonth() === now.getMonth() && 
                         paymentDate.getFullYear() === now.getFullYear();
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          matchesPeriod = paymentDate.getMonth() === lastMonth.getMonth() && 
                         paymentDate.getFullYear() === lastMonth.getFullYear();
          break;
        case 'thisYear':
          matchesPeriod = paymentDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Fonction pour exporter les données
  const exportToCSV = () => {
    const headers = ['Nom', 'Prénom', 'Abonnement', 'Montant', 'Début', 'Fin', 'Statut'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(p => [
        p.last_name,
        p.first_name,
        p.nom_plan,
        p.montant,
        new Date(p.periode_debut).toLocaleDateString('fr-FR'),
        new Date(p.periode_fin).toLocaleDateString('fr-FR'),
        getPaymentStatus(p)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Fonction pour ajouter un paiement manuel
  const handleAddPayment = async () => {
    try {
      // Ici vous ajouteriez l'appel API pour créer le paiement
      // await addPayment(newPayment);
      
      setResultSuccess(true);
      setResultMessage('Paiement ajouté avec succès');
      setShowAddPaymentModal(false);
      setNewPayment({ utilisateur_id: '', montant: '', methode_paiement: 'stripe', stripe_payment_intent_id: '' });
    } catch (error: any) {
      setResultSuccess(false);
      setResultMessage('Erreur lors de l\'ajout du paiement');
    }
    setShowResultModal(true);
  };

  const breadcrumbItems = [
    { title: 'Accueil', to: '/' },
    { title: 'Paiements', isActive: true },
  ];

  // Composant des statistiques
  const StatisticsCards = () => (
    <Grid hasGutter style={{ marginBottom: '2rem' }}>
      <GridItem span={3}>
        <Card className="stat-card">
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <DollarSignIcon size="lg" color="#28a745" />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  {stats.total.toFixed(2)}€
                </div>
                <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                  Revenus totaux
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </GridItem>
      
      <GridItem span={3}>
        <Card className="stat-card">
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <DollarSignIcon size="lg" color="#007bff" />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                  {stats.thisMonth.toFixed(2)}€
                </div>
                <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                  Ce mois-ci
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem span={3}>
        <Card className="stat-card">
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ExclamationTriangleIcon size="lg" color="#ffc107" />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
                  {stats.overdue}
                </div>
                <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                  Paiements en retard
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem span={3}>
        <Card className="stat-card">
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CheckCircleIcon size="lg" color="#28a745" />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  {stats.completed}
                </div>
                <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                  Paiements confirmés
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );

  // Composant de la liste des paiements
  const PaymentsList = () => (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <TextInput
          type="text"
          placeholder="Rechercher par nom ou abonnement..."
          value={search}
          onChange={(_event, value) => setSearch(value)}
          style={{ maxWidth: '300px' }}
        />
        
        <FormSelect
          value={statusFilter}
          onChange={(_event, value) => setStatusFilter(value)}
          aria-label="Filtrer par statut"
          style={{ maxWidth: '200px' }}
        >
          <FormSelectOption value="all" label="Tous les statuts" />
          <FormSelectOption value="complete" label="Payés" />
          <FormSelectOption value="pending" label="En attente" />
          <FormSelectOption value="overdue" label="En retard" />
        </FormSelect>

        <FormSelect
          value={periodFilter}
          onChange={(_event, value) => setPeriodFilter(value)}
          aria-label="Filtrer par période"
          style={{ maxWidth: '200px' }}
        >
          <FormSelectOption value="all" label="Toutes les périodes" />
          <FormSelectOption value="thisMonth" label="Ce mois-ci" />
          <FormSelectOption value="lastMonth" label="Mois dernier" />
          <FormSelectOption value="thisYear" label="Cette année" />
        </FormSelect>

        <Button 
          variant="secondary" 
          icon={<DownloadIcon />}
          onClick={exportToCSV}
        >
          Exporter CSV
        </Button>
      </div>

      <SortableTable 
        data={filteredData} 
        ariaLabel="Table des paiements" 
        columns={columns}
      />
    </div>
  );

  // Composant du formulaire d'ajout de paiement
  const AddPaymentForm = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Card>
        <CardBody>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCardIcon />
            Ajouter un paiement manuel
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="utilisateur-id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                ID Utilisateur <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <TextInput
                id="utilisateur-id"
                value={newPayment.utilisateur_id}
                onChange={(_event, value) => setNewPayment({...newPayment, utilisateur_id: value})}
                placeholder="Entrez l'ID de l'utilisateur"
              />
            </div>
            
            <div>
              <label htmlFor="montant" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Montant (€) <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <TextInput
                id="montant"
                type="number"
                value={newPayment.montant}
                onChange={(_event, value) => setNewPayment({...newPayment, montant: value})}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label htmlFor="methode" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Méthode de paiement
              </label>
              <FormSelect
                id="methode"
                value={newPayment.methode_paiement}
                onChange={(_event, value) => setNewPayment({...newPayment, methode_paiement: value})}
                aria-label="Méthode de paiement"
              >
                <FormSelectOption value="stripe" label="Carte bancaire" />
                <FormSelectOption value="cash" label="Espèces" />
                <FormSelectOption value="check" label="Chèque" />
                <FormSelectOption value="transfer" label="Virement" />
              </FormSelect>
            </div>

            <Button 
              variant="primary" 
              onClick={handleAddPayment}
              style={{ marginTop: '1rem' }}
              isDisabled={!newPayment.utilisateur_id || !newPayment.montant}
            >
              <PlusIcon style={{ marginRight: '0.5rem' }} />
              Ajouter le paiement
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const tabs = [
    {
      key: 0,
      title: 'Vue d\'ensemble',
      icon: <TableIcon />,
      content: (
        <div>
          <StatisticsCards />
          <PaymentsList />
        </div>
      )
    },
    {
      key: 1,
      title: 'Ajouter un paiement',
      icon: <PlusIcon />,
      content: <AddPaymentForm />
    }
  ];

  return (
    <div className="payments-page">
      <PageHeader
        title="Gestion des Paiements"
        subtitle="Suivez les paiements, abonnements et revenus du club"
        variant="payments"
      />
      
      <PageSection>
        <TabContainer
          tabs={tabs}
          activeKey={activeTabKey}
          onTabSelect={setActiveTabKey}
          variant="modern"
        />
      </PageSection>

      {/* Modal de résultat */}
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={resultSuccess ? 'Succès' : 'Erreur'}
        message={resultMessage}
        isSuccess={resultSuccess}
      />
    </div>
  );
};

export default Paiements;

