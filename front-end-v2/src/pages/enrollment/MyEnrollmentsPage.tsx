/**
 * @page MyEnrollmentsPage
 * @description Page affichant toutes les inscriptions de l'utilisateur connecté
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Page,
  PageSection,
  Title,
  Text,
  TextContent,
  Button,
  ButtonVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
} from "@patternfly/react-core";
import {
  MyEnrollmentsList,
  EnrollmentStatus,
  type EnrollmentFilters,
  type Enrollment,
} from "@/features/enrollment";

/**
 * Page "Mes Inscriptions"
 *
 * Affiche la liste complète des inscriptions de l'utilisateur avec :
 * - Filtres par statut
 * - Recherche par nom de cours
 * - Navigation vers les détails
 */
export default function MyEnrollmentsPage() {
  const navigate = useNavigate();

  // État des filtres
  const [filters, setFilters] = useState<EnrollmentFilters>({
    status: [
      EnrollmentStatus.CONFIRMED,
      EnrollmentStatus.PENDING,
      EnrollmentStatus.WAITLIST,
    ],
  });

  // Handler pour le clic sur une inscription
  const handleEnrollmentClick = (enrollment: Enrollment) => {
    // Navigation vers le détail du cours
    navigate(`/courses/${enrollment.courseId}`);
  };

  // Handler pour changer les filtres de statut
  const handleStatusFilterChange = (statuses: EnrollmentStatus[]) => {
    setFilters((prev) => ({
      ...prev,
      status: statuses,
    }));
  };

  // Helpers pour déterminer si un filtre est actif
  const isAllActiveSelected =
    filters.status?.length === 3 &&
    filters.status.includes(EnrollmentStatus.CONFIRMED) &&
    filters.status.includes(EnrollmentStatus.PENDING) &&
    filters.status.includes(EnrollmentStatus.WAITLIST);

  const isConfirmedOnlySelected =
    filters.status?.length === 1 &&
    filters.status[0] === EnrollmentStatus.CONFIRMED;

  const isWaitlistOnlySelected =
    filters.status?.length === 1 &&
    filters.status[0] === EnrollmentStatus.WAITLIST;

  const isHistorySelected =
    filters.status?.length === 2 &&
    filters.status.includes(EnrollmentStatus.CANCELLED) &&
    filters.status.includes(EnrollmentStatus.REJECTED);

  return (
    <Page>
      {/* Header Section */}
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Mes Inscriptions
        </Title>
        <TextContent>
          <Text>Gérez vos inscriptions aux cours et suivez leur statut</Text>
        </TextContent>
      </PageSection>

      {/* Filters Section */}
      <PageSection>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <Button
                  variant={
                    isAllActiveSelected
                      ? ButtonVariant.primary
                      : ButtonVariant.secondary
                  }
                  onClick={() =>
                    handleStatusFilterChange([
                      EnrollmentStatus.CONFIRMED,
                      EnrollmentStatus.PENDING,
                      EnrollmentStatus.WAITLIST,
                    ])
                  }
                >
                  Toutes les inscriptions actives
                </Button>
              </ToolbarItem>

              <ToolbarItem>
                <Button
                  variant={
                    isConfirmedOnlySelected
                      ? ButtonVariant.primary
                      : ButtonVariant.secondary
                  }
                  onClick={() =>
                    handleStatusFilterChange([EnrollmentStatus.CONFIRMED])
                  }
                >
                  Confirmées uniquement
                </Button>
              </ToolbarItem>

              <ToolbarItem>
                <Button
                  variant={
                    isWaitlistOnlySelected
                      ? ButtonVariant.primary
                      : ButtonVariant.secondary
                  }
                  onClick={() =>
                    handleStatusFilterChange([EnrollmentStatus.WAITLIST])
                  }
                >
                  Liste d'attente
                </Button>
              </ToolbarItem>

              <ToolbarItem>
                <Button
                  variant={
                    isHistorySelected
                      ? ButtonVariant.primary
                      : ButtonVariant.secondary
                  }
                  onClick={() =>
                    handleStatusFilterChange([
                      EnrollmentStatus.CANCELLED,
                      EnrollmentStatus.REJECTED,
                    ])
                  }
                >
                  Historique
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>

        {/* Liste des inscriptions */}
        <MyEnrollmentsList
          filters={filters}
          showFilters={true}
          onEnrollmentClick={handleEnrollmentClick}
          emptyMessage="Aucune inscription trouvée. Explorez nos cours et inscrivez-vous !"
          className="pf-v5-u-mt-md"
        />

        {/* Actions rapides */}
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <Button
                  variant={ButtonVariant.primary}
                  onClick={() => navigate("/courses")}
                >
                  Découvrir les cours
                </Button>
              </ToolbarItem>

              <ToolbarItem>
                <Button
                  variant={ButtonVariant.secondary}
                  onClick={() => navigate("/dashboard")}
                >
                  Retour au tableau de bord
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </PageSection>
    </Page>
  );
}
