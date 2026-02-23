import { useState, useMemo } from "react";
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
} from "@patternfly/react-core";
import { SearchIcon, SyncIcon, DownloadIcon } from '@/shared/icons';
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
import TableauCommandes from "../components/TableauCommandes";
import FiltrageCommandes from "../components/FiltrageCommandes";
import StatistiquesCommandes from "../components/StatistiquesCommandes";

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

/**
 * OrdersPage Component
 *
 * Displays and manages all orders with filtering, stats and status updates
 *
 * @architecture
 * - GraphQL: useGetOrdersQuery, useUpdateOrderStatusMutation
 * - Zustand: uiStore (notifications)
 * - HOCs: withAuthRole (admin only), withAuth, withTracking, withErrorBoundary
 * - i18n: orders.*
 *
 * Features:
 * - Orders table with sorting and filtering
 * - Order statistics dashboard
 * - Status updates
 * - Export to CSV
 *
 * @permissions Admin only
 */
const OrdersPage = () => {
  const { t } = useTypedTranslation();
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state) => state.addNotification);

  // Local state
  const [filterInput, setFilterInput] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [activeSortIndex, setActiveSortIndex] = useState<number | undefined>(undefined);
  const [activeSortDirection, setActiveSortDirection] = useState<"asc" | "desc" | undefined>(
    undefined
  );
  const [isUpdatingStatut, setIsUpdatingStatut] = useState<string | null>(null);

  // GraphQL queries
  const {
    data: ordersData,
    loading: loadingOrders,
    error: errorOrders,
    refetch: refetchOrders,
  } = useGetOrdersQuery({
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutations
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Extract orders from query
  const orders = useMemo((): Order[] => {
    return (ordersData?.orders || []) as Order[];
  }, [ordersData]);

  // Calculate statistics
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

  // Filter orders
  const filteredData = useMemo(() => {
    if (!filterInput || !Array.isArray(orders)) return orders;

    const searchTerm = filterInput.toLowerCase();
    return orders.filter((order) => {
      if (!order) return false;

      return (
        order.id?.toString().includes(searchTerm) ||
        order.unique_id?.toLowerCase().includes(searchTerm) ||
        order.numero_commande?.toLowerCase().includes(searchTerm) ||
        order.statut?.toLowerCase().includes(searchTerm) ||
        order.total?.toString().includes(searchTerm) ||
        order.nom_utilisateur?.toLowerCase().includes(searchTerm) ||
        order.first_name?.toLowerCase().includes(searchTerm) ||
        order.last_name?.toLowerCase().includes(searchTerm)
      );
    });
  }, [orders, filterInput]);

  // Get sortable values for an order
  const getSortableRowValues = (order: Order): (string | number)[] => [
    order?.id || 0,
    order?.numero_commande || order?.unique_id || "",
    new Date(order?.date_commande || order?.created_at || 0).getTime(),
    order?.statut || "",
    Array.isArray(order?.articles) ? order.articles.length : 0,
    parseFloat(order?.total?.toString() || "0"),
  ];

  // Sort orders
  const sortedData = useMemo(() => {
    if (
      !Array.isArray(filteredData) ||
      activeSortIndex === undefined ||
      activeSortDirection === undefined
    ) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      if (!a || !b) return 0;

      const aValue = getSortableRowValues(a)[activeSortIndex];
      const bValue = getSortableRowValues(b)[activeSortIndex];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return activeSortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return activeSortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, activeSortIndex, activeSortDirection]);

  /**
   * Handle status change for an order
   */
  const handleChangeStatut = async (orderId: string, newStatut: string) => {
    try {
      setIsUpdatingStatut(orderId);

      const order = orders.find(
        (o) =>
          o.id?.toString() === orderId ||
          o.unique_id === orderId ||
          o.numero_commande === orderId
      );

      if (!order) {
        addNotification({
          type: "error",
          message: t("orders.list.noOrders"),
        });
        return;
      }

      addNotification({
        type: "info",
        message: t("orders.status.updating"),
      });

      const response = await updateOrderStatus({
        variables: {
          orderId: order.id,
          status: newStatut,
        },
      });

      // Check if response includes stock update info
      const stocksAffected = (response.data?.updateOrderStatus as any)?.stocksAffected;
      const itemsProcessed = (response.data?.updateOrderStatus as any)?.itemsProcessed;

      let successMessage = t("orders.status.updateSuccess", { status: newStatut });
      if (stocksAffected) {
        successMessage = t("orders.status.updateSuccessWithStock", {
          status: newStatut,
          count: itemsProcessed,
        });
      }

      addNotification({
        type: "success",
        message: successMessage,
      });

      trackEvent("order_status_updated", {
        orderId: order.id,
        oldStatus: order.statut,
        newStatus: newStatut,
        stocksAffected: stocksAffected || false,
      });

      await refetchOrders();
    } catch (error: any) {
      console.error("Error updating order status:", error);

      let errorMessage = t("orders.status.updateError");
      if (error.message?.includes("timeout") || error.message?.includes("lock")) {
        errorMessage = t("orders.status.serverBusy");
      }

      addNotification({
        type: "error",
        message: errorMessage,
      });

      trackEvent("order_status_update_failed", {
        orderId,
        error: error?.message || "unknown",
      });
    } finally {
      setIsUpdatingStatut(null);
    }
  };

  /**
   * Toggle row expansion
   */
  const toggleRow = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  /**
   * Handle sort
   */
  const onSort = (_event: React.MouseEvent, index: number, direction: "asc" | "desc") => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
    trackEvent("orders_sorted", { columnIndex: index, direction });
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    try {
      await refetchOrders();
      addNotification({
        type: "success",
        message: t("orders.actions.refresh"),
      });
      trackEvent("orders_refreshed");
    } catch (error) {
      addNotification({
        type: "error",
        message: t("orders.loadingError"),
      });
    }
  };

  /**
   * Export orders to CSV
   */
  const handleExport = () => {
    const csvContent = [
      ["ID", "Numéro", "Date", "Client", "Statut", "Total"].join(","),
      ...filteredData.map((order) =>
        [
          order.id || "",
          order.numero_commande || order.unique_id || "",
          new Date(order.date_commande || order.created_at || "").toLocaleDateString("fr-FR"),
          `${order.first_name || ""} ${order.last_name || ""}`.trim() ||
            order.nom_utilisateur ||
            t("orders.details.unknown"),
          order.statut || "",
          order.total || "0",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    trackEvent("orders_exported", { count: filteredData.length });
  };

  // Loading state
  if (loadingOrders) {
    return (
      <div>
        <PageHeader
          title={t("orders.title")}
          subtitle={t("orders.loading")}
          variant="orders"
        />
        <PageSection>
          <Alert variant="info" title={t("orders.loading")} />
        </PageSection>
      </div>
    );
  }

  // Error state
  if (errorOrders) {
    return (
      <div>
        <PageHeader title={t("orders.title")} subtitle={t("orders.loadingError")} variant="orders" />
        <PageSection>
          <Alert variant="danger" title={t("orders.loadingError")}>
            <p>{errorOrders?.message || t("common.error")}</p>
            <div style={{ marginTop: "1rem" }}>
              <Button variant="primary" onClick={() => refetchOrders()}>
                {t("orders.actions.refresh")}
              </Button>
            </div>
          </Alert>
        </PageSection>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <PageHeader
        title={t("orders.title")}
        subtitle={
          <Flex alignItems={{ default: "alignItemsCenter" }} spaceItems={{ default: "spaceItemsSm" }}>
            <FlexItem>
              {t("orders.list.totalOrders", { count: statistics.total })}
            </FlexItem>
            <FlexItem>•</FlexItem>
            <FlexItem>
              {statistics.chiffreAffaires.toFixed(2)}€ {t("orders.stats.revenue").toLowerCase()}
            </FlexItem>
            <FlexItem>•</FlexItem>
            <FlexItem>
              {t("orders.list.lastUpdate", { time: new Date().toLocaleTimeString("fr-FR") })}
            </FlexItem>
          </Flex>
        }
        variant="orders"
      />

      <PageSection style={{ paddingTop: "1.5rem" }}>
        <Grid hasGutter>
          {/* Statistics Section */}
          <GridItem span={12}>
            <Card style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <CardTitle>
                <Title headingLevel="h3" size="lg">
                  {t("orders.stats.overview")}
                </Title>
              </CardTitle>
              <CardBody>
                <StatistiquesCommandes commandes={orders} statistiques={statistics} />
              </CardBody>
            </Card>
          </GridItem>

          {/* Filtering Section */}
          <GridItem span={12}>
            <Card style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <CardTitle>
                <Flex
                  justifyContent={{ default: "justifyContentSpaceBetween" }}
                  alignItems={{ default: "alignItemsCenter" }}
                >
                  <FlexItem>
                    <Flex alignItems={{ default: "alignItemsCenter" }}>
                      <FlexItem>
                        <SearchIcon style={{ marginRight: "0.5rem" }} />
                        {t("orders.list.search")}
                      </FlexItem>
                      <FlexItem>
                        <Badge color="blue">
                          {t("orders.list.filteredOrders", {
                            filtered: filteredData.length,
                            total: orders.length,
                          })}
                        </Badge>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                  <FlexItem>
                    <Flex spaceItems={{ default: "spaceItemsSm" }}>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<SyncIcon />}
                          onClick={handleRefresh}
                        >
                          {t("orders.actions.refresh")}
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<DownloadIcon />}
                          onClick={handleExport}
                          isDisabled={filteredData.length === 0}
                        >
                          {t("orders.actions.export")}
                        </Button>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <FiltrageCommandes
                  filterInput={filterInput}
                  onFilterChange={setFilterInput}
                  totalCommandes={orders.length}
                  commandesFiltrees={filteredData.length}
                />
              </CardBody>
            </Card>
          </GridItem>

          {/* Table Section */}
          <GridItem span={12}>
            <Card style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <CardBody style={{ padding: 0 }}>
                <TableauCommandes
                  commandes={sortedData}
                  expandedRows={expandedRows}
                  activeSortIndex={activeSortIndex}
                  activeSortDirection={activeSortDirection}
                  onToggleRow={toggleRow}
                  onSort={onSort}
                  onChangeStatut={handleChangeStatut}
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

// Export with HOCs: Role-based auth (admin only), Auth, Tracking, Error boundary
export default withAuthRole(
  withAuth(withTracking(withErrorBoundary(OrdersPage), "OrdersPage")),
  ["admin"]
);
