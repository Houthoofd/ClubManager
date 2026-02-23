/**
 * ====================================================================
 * OrdersPage - IMPROVED WITH CUSTOM HOOKS
 * ====================================================================
 *
 * Enhanced version using custom business hooks for better performance
 * and maintainability.
 *
 * Custom Hooks Used:
 * - useTableControls (filter + sort + pagination combined)
 * - useDebounce (search optimization)
 * - useExport (CSV/PDF export)
 * - useLocalStorage (filters persistence)
 *
 * @architecture
 * - GraphQL: useGetOrdersQuery, useUpdateOrderStatusMutation
 * - Zustand: uiStore (notifications)
 * - Custom Hooks: useTableControls, useDebounce, useExport
 * - HOCs: withAuthRole (admin only), withAuth, withTracking, withErrorBoundary
 * - i18n: orders.*
 *
 * @permissions Admin only
 */

import { useState, useMemo, useEffect } from "react";
import {
  PageSection,
  Card,
  CardBody,
  CardTitle,
  Alert,
  Grid,
  GridItem,
  Title,
  Badge,
  Flex,
  FlexItem,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Select,
  SelectOption,
  SelectVariant,
  Pagination,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
  Modal,
  ModalVariant,
  Spinner,
  Bullseye,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  List,
  ListItem,
  Divider,
} from "@patternfly/react-core";
import {
  SearchIcon,
  SyncIcon,
  DownloadIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  BanIcon,
} from '@/shared/icons';
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withAuthRole } from "@/shared/hocs/withAuthRole";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
} from "@/core/api/graphql/generated/graphql";

// ============================================================================
// CUSTOM HOOKS IMPORTS
// ============================================================================
import { useTableControls, useExport } from "@/shared/hooks/business";
import { useDebounce, useLocalStorage } from "@/shared/hooks/utils";

// ============================================================================
// Types
// ============================================================================

interface Order {
  id: number;
  numero_commande?: string;
  unique_id?: string;
  date_commande?: string;
  created_at?: string;
  statut: string;
  total: number;
  nom_utilisateur?: string;
  first_name?: string;
  last_name?: string;
  utilisateur_id?: number;
  articles?: Array<{
    id: number;
    nom: string;
    quantite: number;
    prix: number;
  }>;
}

interface OrderStats {
  total: number;
  chiffreAffaires: number;
  valeurMoyenne: number;
  repartitionStatuts: Record<string, number>;
}

const ORDER_STATUSES = [
  { value: "en_attente", label: "En attente", color: "orange", icon: ClockIcon },
  { value: "confirmee", label: "Confirmée", color: "blue", icon: CheckCircleIcon },
  { value: "en_preparation", label: "En préparation", color: "cyan", icon: ShoppingCartIcon },
  { value: "expediee", label: "Expédiée", color: "purple", icon: ShoppingCartIcon },
  { value: "livree", label: "Livrée", color: "green", icon: CheckCircleIcon },
  { value: "annulee", label: "Annulée", color: "red", icon: BanIcon },
] as const;

// ============================================================================
// Component
// ============================================================================

const OrdersPageImproved = () => {
  const { t } = useTypedTranslation();
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state) => state.addNotification);

  // ============================================================================
  // CUSTOM HOOK: useLocalStorage - Persist status filter
  // ============================================================================
  const [savedStatusFilter, setSavedStatusFilter] = useLocalStorage<string>(
    "orders-status-filter",
    ""
  );

  // ============================================================================
  // Local State
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(savedStatusFilter);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isUpdatingStatut, setIsUpdatingStatut] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // ============================================================================
  // CUSTOM HOOK: useDebounce - Optimize search
  // ============================================================================
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ============================================================================
  // GraphQL Queries
  // ============================================================================
  const {
    data: ordersData,
    loading: loadingOrders,
    error: errorOrders,
    refetch: refetchOrders,
  } = useGetOrdersQuery({
    fetchPolicy: "cache-and-network",
  });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // ============================================================================
  // Extract Data
  // ============================================================================
  const orders = useMemo((): Order[] => {
    return (ordersData?.orders || []) as Order[];
  }, [ordersData]);

  // ============================================================================
  // CUSTOM HOOK: useTableControls - Combined filter + sort + pagination
  // ============================================================================
  const {
    displayData,
    sortKey,
    sortDirection,
    handleSort,
    setFilter,
    removeFilter,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    filters,
  } = useTableControls(orders, {
    itemsPerPage: 20,
    defaultSortKey: "date_commande",
  });

  // ============================================================================
  // CUSTOM HOOK: useExport - Export functionality
  // ============================================================================
  const { exportToCSV, exportToPDF, isExporting } = useExport();

  // ============================================================================
  // Apply Filters (Debounced Search + Status)
  // ============================================================================
  useEffect(() => {
    // Search filter - search across multiple fields
    if (debouncedSearch) {
      setFilter({
        field: "numero_commande",
        operator: "contains",
        value: debouncedSearch,
        caseSensitive: false,
      });
    } else {
      removeFilter("numero_commande");
    }
  }, [debouncedSearch, setFilter, removeFilter]);

  useEffect(() => {
    // Status filter
    if (selectedStatus) {
      setFilter({
        field: "statut",
        operator: "equals",
        value: selectedStatus,
      });
      setSavedStatusFilter(selectedStatus); // Persist
    } else {
      removeFilter("statut");
      setSavedStatusFilter("");
    }
  }, [selectedStatus, setFilter, removeFilter, setSavedStatusFilter]);

  // ============================================================================
  // Statistics
  // ============================================================================
  const statistics = useMemo((): OrderStats => {
    if (orders.length === 0) {
      return {
        total: 0,
        chiffreAffaires: 0,
        valeurMoyenne: 0,
        repartitionStatuts: {},
      };
    }

    const total = orders.length;
    const chiffreAffaires = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const valeurMoyenne = chiffreAffaires / total;

    const repartitionStatuts: Record<string, number> = {};
    orders.forEach((order) => {
      const status = order.statut || "unknown";
      repartitionStatuts[status] = (repartitionStatuts[status] || 0) + 1;
    });

    return {
      total,
      chiffreAffaires,
      valeurMoyenne,
      repartitionStatuts,
    };
  }, [orders]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const toggleRow = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.statut);
    setShowStatusModal(true);
  };

  const handleChangeStatut = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setIsUpdatingStatut(selectedOrder.id.toString());

      addNotification({
        type: "info",
        message: t("orders.status.updating"),
      });

      await updateOrderStatus({
        variables: {
          orderId: selectedOrder.id,
          status: newStatus,
        },
      });

      addNotification({
        type: "success",
        message: t("orders.status.updateSuccess", { status: newStatus }),
      });

      trackEvent("order_status_updated", {
        orderId: selectedOrder.id,
        oldStatus: selectedOrder.statut,
        newStatus,
      });

      setShowStatusModal(false);
      setSelectedOrder(null);
      await refetchOrders();
    } catch (error: any) {
      console.error("Error updating order status:", error);

      addNotification({
        type: "error",
        message: error?.message || t("orders.status.updateError"),
      });

      trackEvent("order_status_update_failed", {
        orderId: selectedOrder.id,
        error: error?.message || "unknown",
      });
    } finally {
      setIsUpdatingStatut(null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    trackEvent("orders_filters_cleared");
  };

  // ============================================================================
  // Export Handlers
  // ============================================================================

  const handleExportCSV = () => {
    const exportData = displayData.map((order) => ({
      numero: order.numero_commande || order.unique_id,
      date: order.date_commande || order.created_at,
      client: order.nom_utilisateur || `${order.first_name} ${order.last_name}`,
      statut: order.statut,
      articles: order.articles?.length || 0,
      total: order.total,
    }));

    exportToCSV(exportData, {
      filename: `commandes-${new Date().toISOString().split("T")[0]}`,
      columns: ["numero", "date", "client", "statut", "articles", "total"],
      columnLabels: {
        numero: "N° Commande",
        date: "Date",
        client: "Client",
        statut: "Statut",
        articles: "Articles",
        total: "Total (€)",
      },
    });
    trackEvent("orders_export_csv", { count: displayData.length });
  };

  const handleExportPDF = () => {
    const exportData = displayData.map((order) => ({
      numero: order.numero_commande || order.unique_id,
      date: new Date(order.date_commande || order.created_at || "").toLocaleDateString("fr-FR"),
      client: order.nom_utilisateur || `${order.first_name} ${order.last_name}`,
      statut: order.statut,
      total: `${order.total.toFixed(2)} €`,
    }));

    exportToPDF(exportData, {
      filename: `commandes-${new Date().toISOString().split("T")[0]}`,
      title: "Liste des Commandes",
      columns: ["numero", "date", "client", "statut", "total"],
      columnLabels: {
        numero: "N° Commande",
        date: "Date",
        client: "Client",
        statut: "Statut",
        total: "Total",
      },
    });
    trackEvent("orders_export_pdf", { count: displayData.length });
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loadingOrders) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner size="xl" />
        </Bullseye>
      </PageSection>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (errorOrders) {
    return (
      <PageSection>
        <Alert variant="danger" title={t("orders.list.loadError")} isInline>
          {errorOrders.message}
        </Alert>
      </PageSection>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <PageHeader
        title={t("orders.list.title")}
        subtitle={t("orders.list.subtitle")}
        variant="orders"
      />

      <PageSection>
        {/* ================================================================ */}
        {/* STATISTICS CARDS */}
        {/* ================================================================ */}
        <Grid hasGutter style={{ marginBottom: "1rem" }}>
          <GridItem span={3}>
            <Card isCompact>
              <CardBody>
                <Flex direction={{ default: "column" }}>
                  <FlexItem>
                    <ShoppingCartIcon size="lg" />
                  </FlexItem>
                  <FlexItem>
                    <Title headingLevel="h4" size="2xl">
                      {statistics.total}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                      Total commandes
                    </span>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={3}>
            <Card isCompact>
              <CardBody>
                <Flex direction={{ default: "column" }}>
                  <FlexItem>
                    <Title headingLevel="h4" size="2xl">
                      {statistics.chiffreAffaires.toFixed(2)} €
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                      Chiffre d'affaires
                    </span>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={3}>
            <Card isCompact>
              <CardBody>
                <Flex direction={{ default: "column" }}>
                  <FlexItem>
                    <Title headingLevel="h4" size="2xl">
                      {statistics.valeurMoyenne.toFixed(2)} €
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                      Valeur moyenne
                    </span>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={3}>
            <Card isCompact>
              <CardBody>
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                  {Object.entries(statistics.repartitionStatuts).map(([status, count]) => {
                    const statusInfo = getStatusInfo(status);
                    return (
                      <FlexItem key={status}>
                        <Badge color={statusInfo.color}>
                          {statusInfo.label}: {count}
                        </Badge>
                      </FlexItem>
                    );
                  })}
                </Flex>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* ================================================================ */}
        {/* TOOLBAR: Search + Filters + Export */}
        {/* ================================================================ */}
        <Card>
          <CardBody>
            <Toolbar>
              <ToolbarContent>
                {/* Search with debounce */}
                <ToolbarItem style={{ flexGrow: 1, minWidth: "300px" }}>
                  <SearchInput
                    placeholder={t("orders.list.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(_event, value) => setSearchTerm(value)}
                    onClear={() => setSearchTerm("")}
                  />
                </ToolbarItem>

                {/* Status filter */}
                <ToolbarItem>
                  <Select
                    variant={SelectVariant.single}
                    onToggle={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                    onSelect={(_, value) => {
                      setSelectedStatus(value.toString());
                      setIsStatusFilterOpen(false);
                    }}
                    selections={selectedStatus}
                    isOpen={isStatusFilterOpen}
                    placeholderText={t("orders.list.filterByStatus")}
                  >
                    <SelectOption value="">Tous les statuts</SelectOption>
                    {ORDER_STATUSES.map((status) => (
                      <SelectOption key={status.value} value={status.value}>
                        {status.label}
                      </SelectOption>
                    ))}
                  </Select>
                </ToolbarItem>

                {/* Refresh */}
                <ToolbarItem>
                  <Button
                    variant="plain"
                    icon={<SyncIcon />}
                    onClick={() => refetchOrders()}
                  >
                    Actualiser
                  </Button>
                </ToolbarItem>

                {/* Export buttons */}
                <ToolbarItem>
                  <Button
                    variant="secondary"
                    icon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    isDisabled={isExporting || displayData.length === 0}
                  >
                    CSV
                  </Button>
                </ToolbarItem>

                <ToolbarItem>
                  <Button
                    variant="secondary"
                    icon={<DownloadIcon />}
                    onClick={handleExportPDF}
                    isDisabled={isExporting || displayData.length === 0}
                  >
                    PDF
                  </Button>
                </ToolbarItem>

                {/* Clear filters */}
                {(searchTerm || selectedStatus) && (
                  <ToolbarItem>
                    <Button variant="link" onClick={handleClearFilters}>
                      Effacer les filtres
                    </Button>
                  </ToolbarItem>
                )}
              </ToolbarContent>
            </Toolbar>

            {/* Active filters info */}
            {filters.length > 0 && (
              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                  {displayData.length} commande(s) affichée(s) sur {orders.length}
                </span>
              </div>
            )}

            <Divider style={{ margin: "1rem 0" }} />

            {/* ============================================================ */}
            {/* ORDERS TABLE */}
            {/* ============================================================ */}

            {displayData.length === 0 ? (
              <EmptyState>
                <EmptyStateIcon icon={SearchIcon} />
                <Title headingLevel="h4" size="lg">
                  {searchTerm || selectedStatus
                    ? t("orders.list.noResults")
                    : t("orders.list.noOrders")}
                </Title>
                <EmptyStateBody>
                  {searchTerm || selectedStatus
                    ? "Essayez de modifier vos filtres"
                    : "Aucune commande pour le moment"}
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <Table variant="compact">
                <Thead>
                  <Tr>
                    <Th />
                    <Th
                      sort={{
                        sortBy: {
                          index: sortKey === "id" ? 0 : undefined,
                          direction: sortDirection === "asc" ? "asc" : "desc",
                        },
                        onSort: () => handleSort("id"),
                        columnIndex: 0,
                      }}
                    >
                      N° Commande
                    </Th>
                    <Th
                      sort={{
                        sortBy: {
                          index: sortKey === "date_commande" ? 1 : undefined,
                          direction: sortDirection === "asc" ? "asc" : "desc",
                        },
                        onSort: () => handleSort("date_commande"),
                        columnIndex: 1,
                      }}
                    >
                      Date
                    </Th>
                    <Th>Client</Th>
                    <Th>Articles</Th>
                    <Th
                      sort={{
                        sortBy: {
                          index: sortKey === "total" ? 4 : undefined,
                          direction: sortDirection === "asc" ? "asc" : "desc",
                        },
                        onSort: () => handleSort("total"),
                        columnIndex: 4,
                      }}
                    >
                      Total
                    </Th>
                    <Th>Statut</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayData.map((order, rowIndex) => {
                    const statusInfo = getStatusInfo(order.statut);
                    const StatusIcon = statusInfo.icon;
                    const isExpanded = expandedRows.has(rowIndex);

                    return (
                      <>
                        <Tr key={order.id}>
                          <Td
                            expand={{
                              rowIndex,
                              isExpanded,
                              onToggle: () => toggleRow(rowIndex),
                            }}
                          />
                          <Td>{order.numero_commande || order.unique_id || order.id}</Td>
                          <Td>
                            {new Date(
                              order.date_commande || order.created_at || ""
                            ).toLocaleDateString("fr-FR")}
                          </Td>
                          <Td>
                            {order.nom_utilisateur ||
                              `${order.first_name || ""} ${order.last_name || ""}`.trim() ||
                              "N/A"}
                          </Td>
                          <Td>{order.articles?.length || 0}</Td>
                          <Td>{order.total.toFixed(2)} €</Td>
                          <Td>
                            <Badge color={statusInfo.color} icon={<StatusIcon />}>
                              {statusInfo.label}
                            </Badge>
                          </Td>
                          <Td>
                            <Button
                              variant="link"
                              onClick={() => handleOpenStatusModal(order)}
                              isDisabled={isUpdatingStatut === order.id.toString()}
                            >
                              Modifier
                            </Button>
                          </Td>
                        </Tr>
                        {isExpanded && (
                          <Tr isExpanded={isExpanded}>
                            <Td colSpan={8}>
                              <ExpandableRowContent>
                                <Card isCompact>
                                  <CardTitle>Détails de la commande</CardTitle>
                                  <CardBody>
                                    {order.articles && order.articles.length > 0 ? (
                                      <List>
                                        {order.articles.map((article) => (
                                          <ListItem key={article.id}>
                                            <strong>{article.nom}</strong> - Quantité:{" "}
                                            {article.quantite} - Prix: {article.prix.toFixed(2)} €
                                          </ListItem>
                                        ))}
                                      </List>
                                    ) : (
                                      <p>Aucun article</p>
                                    )}
                                  </CardBody>
                                </Card>
                              </ExpandableRowContent>
                            </Td>
                          </Tr>
                        )}
                      </>
                    );
                  })}
                </Tbody>
              </Table>
            )}

            {/* ============================================================ */}
            {/* PAGINATION */}
            {/* ============================================================ */}

            {displayData.length > 0 && (
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
                <Pagination
                  itemCount={orders.length}
                  perPage={20}
                  page={currentPage}
                  onSetPage={(_, page) => goToPage(page)}
                  onPerPageSelect={() => {}}
                  onNextClick={nextPage}
                  onPreviousClick={prevPage}
                  onFirstClick={() => goToPage(1)}
                  onLastClick={() => goToPage(totalPages)}
                  variant="bottom"
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* ================================================================ */}
        {/* STATUS CHANGE MODAL */}
        {/* ================================================================ */}
        <Modal
          variant={ModalVariant.small}
          title="Modifier le statut de la commande"
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          actions={[
            <Button
              key="confirm"
              variant="primary"
              onClick={handleChangeStatut}
              isLoading={isUpdatingStatut !== null}
              isDisabled={isUpdatingStatut !== null || newStatus === selectedOrder?.statut}
            >
              Mettre à jour
            </Button>,
            <Button
              key="cancel"
              variant="link"
              onClick={() => setShowStatusModal(false)}
              isDisabled={isUpdatingStatut !== null}
            >
              Annuler
            </Button>,
          ]}
        >
          {selectedOrder && (
            <div>
              <p>
                <strong>Commande:</strong> {selectedOrder.numero_commande || selectedOrder.unique_id}
              </p>
              <p>
                <strong>Statut actuel:</strong>{" "}
                <Badge color={getStatusInfo(selectedOrder.statut).color}>
                  {getStatusInfo(selectedOrder.statut).label}
                </Badge>
              </p>
              <Divider style={{ margin: "1rem 0" }} />
              <p>
                <strong>Nouveau statut:</strong>
              </p>
              <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                {ORDER_STATUSES.map((status) => (
                  <FlexItem key={status.value}>
                    <Button
                      variant={newStatus === status.value ? "primary" : "secondary"}
                      isBlock
                      onClick={() => setNewStatus(status.value)}
                      icon={<status.icon />}
                    >
                      {status.label}
                    </Button>
                  </FlexItem>
                ))}
              </Flex>
            </div>
          )}
        </Modal>
      </PageSection>
    </>
  );
};

// ============================================================================
// Exports with HOCs
// ============================================================================

export default withErrorBoundary(
  withTracking(
    withAuthRole(
      withAuth(OrdersPageImproved, {
        requireAuth: true,
        redirectTo: "/login",
      }),
      ["admin"]
    ),
    "orders"
  )
);
