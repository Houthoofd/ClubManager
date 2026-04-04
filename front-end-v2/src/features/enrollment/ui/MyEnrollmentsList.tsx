/**
 * Enrollment Feature - MyEnrollmentsList Component
 *
 * List component for displaying the current user's enrollments.
 * Includes filtering, sorting, and status-based views.
 * Refactored to use PatternFly components.
 */

import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateHeader,
  Spinner,
  Grid,
  GridItem,
  Select,
  SelectOption,
  SelectVariant,
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  Label,
  Alert,
  Title,
  Text,
  TextContent,
  TextVariants,
  Divider,
} from "@patternfly/react-core";
import {
  FilterIcon,
  CalendarAltIcon,
  MapMarkerAltIcon,
  UserIcon,
  ListIcon,
} from "@patternfly/react-icons";
import { useMyEnrollments } from "../model/useEnrollment";
import { EnrollmentStatus, formatEnrollmentDate } from "../model/types";
import { EnrollmentStatusBadge } from "./EnrollmentStatusBadge";
import { UnenrollButton } from "./UnenrollButton";
import type { EnrollmentFilters } from "../model/types";

// ============================================================================
// Props
// ============================================================================

export interface MyEnrollmentsListProps {
  /** Initial filters to apply */
  initialFilters?: EnrollmentFilters;

  /** Show filter controls */
  showFilters?: boolean;

  /** Show unenroll button for active enrollments */
  showUnenrollButton?: boolean;

  /** Custom className */
  className?: string;

  /** Callback when enrollment is clicked */
  onEnrollmentClick?: (enrollmentId: number) => void;

  /** Show course details */
  showCourseDetails?: boolean;

  /** Empty state message */
  emptyMessage?: string;
}

// ============================================================================
// MyEnrollmentsList Component
// ============================================================================

export const MyEnrollmentsList: React.FC<MyEnrollmentsListProps> = ({
  initialFilters,
  showFilters = true,
  showUnenrollButton = true,
  className = "",
  onEnrollmentClick,
  showCourseDetails = true,
  emptyMessage = "Vous n'avez aucune inscription pour le moment.",
}) => {
  // ========================================
  // State
  // ========================================

  const [filters, setFilters] = useState<EnrollmentFilters>({
    includeCourse: showCourseDetails,
    sortBy: "enrolledAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const [selectedStatus, setSelectedStatus] = useState<
    EnrollmentStatus | "all"
  >("all");
  const [isSortSelectOpen, setIsSortSelectOpen] = useState(false);

  // ========================================
  // Hooks
  // ========================================

  const { data: enrollments, isLoading, error } = useMyEnrollments(filters);

  // ========================================
  // Handlers
  // ========================================

  const handleStatusFilter = (status: EnrollmentStatus | "all") => {
    setSelectedStatus(status);
    setFilters({
      ...filters,
      status: status === "all" ? undefined : status,
    });
  };

  const handleSortChange = (sortBy: EnrollmentFilters["sortBy"]) => {
    setFilters({
      ...filters,
      sortBy,
    });
    setIsSortSelectOpen(false);
  };

  // ========================================
  // Computed Values
  // ========================================

  const activeEnrollments =
    enrollments?.filter(
      (e) =>
        e.status === EnrollmentStatus.CONFIRMED ||
        e.status === EnrollmentStatus.PENDING,
    ) || [];

  const waitlistedEnrollments =
    enrollments?.filter((e) => e.status === EnrollmentStatus.WAITLIST) || [];

  // ========================================
  // Render Helpers
  // ========================================

  const renderEnrollmentCard = (enrollment: (typeof enrollments)[0]) => {
    const canUnenroll =
      enrollment.status === EnrollmentStatus.CONFIRMED ||
      enrollment.status === EnrollmentStatus.PENDING ||
      enrollment.status === EnrollmentStatus.WAITLIST;

    return (
      <GridItem span={12} key={enrollment.id}>
        <Card
          isClickable={!!onEnrollmentClick}
          isSelectable
          onClick={() => onEnrollmentClick?.(enrollment.id)}
        >
          <CardTitle>
            <Flex
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              alignItems={{ default: "alignItemsFlexStart" }}
            >
              <FlexItem flex={{ default: "flex_1" }}>
                {enrollment.course && (
                  <Title headingLevel="h3" size="lg">
                    {enrollment.course.title}
                  </Title>
                )}
              </FlexItem>
              <FlexItem>
                <EnrollmentStatusBadge
                  status={enrollment.status}
                  waitlistPosition={enrollment.waitlistPosition}
                  size="medium"
                />
              </FlexItem>
            </Flex>
          </CardTitle>
          <CardBody>
            <Flex
              direction={{ default: "column" }}
              spaceItems={{ default: "spaceItemsSm" }}
            >
              {enrollment.course && (
                <>
                  {enrollment.course.code && (
                    <FlexItem>
                      <TextContent>
                        <Text component={TextVariants.small}>
                          <strong>Code:</strong> {enrollment.course.code}
                        </Text>
                      </TextContent>
                    </FlexItem>
                  )}
                  {enrollment.course.professorName && (
                    <FlexItem>
                      <Flex
                        spaceItems={{ default: "spaceItemsXs" }}
                        alignItems={{ default: "alignItemsCenter" }}
                      >
                        <FlexItem>
                          <UserIcon />
                        </FlexItem>
                        <FlexItem>
                          <TextContent>
                            <Text component={TextVariants.small}>
                              <strong>Professeur:</strong>{" "}
                              {enrollment.course.professorName}
                            </Text>
                          </TextContent>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  )}
                  {enrollment.course.schedule && (
                    <FlexItem>
                      <Flex
                        spaceItems={{ default: "spaceItemsXs" }}
                        alignItems={{ default: "alignItemsCenter" }}
                      >
                        <FlexItem>
                          <CalendarAltIcon />
                        </FlexItem>
                        <FlexItem>
                          <TextContent>
                            <Text component={TextVariants.small}>
                              {enrollment.course.schedule}
                            </Text>
                          </TextContent>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  )}
                  {enrollment.course.location && (
                    <FlexItem>
                      <Flex
                        spaceItems={{ default: "spaceItemsXs" }}
                        alignItems={{ default: "alignItemsCenter" }}
                      >
                        <FlexItem>
                          <MapMarkerAltIcon />
                        </FlexItem>
                        <FlexItem>
                          <TextContent>
                            <Text component={TextVariants.small}>
                              {enrollment.course.location}
                            </Text>
                          </TextContent>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  )}
                </>
              )}

              <Divider />

              {/* Enrollment Info */}
              <FlexItem>
                <TextContent>
                  <Text component={TextVariants.small}>
                    <strong>Inscrit le:</strong>{" "}
                    {formatEnrollmentDate(enrollment.enrolledAt)}
                  </Text>
                </TextContent>
              </FlexItem>

              {enrollment.notes && (
                <FlexItem>
                  <TextContent>
                    <Text component={TextVariants.small}>
                      <em>Note: {enrollment.notes}</em>
                    </Text>
                  </TextContent>
                </FlexItem>
              )}

              {showUnenrollButton && canUnenroll && (
                <FlexItem>
                  <UnenrollButton
                    enrollmentId={enrollment.id}
                    courseId={enrollment.courseId}
                    variant="outline"
                    size="small"
                  />
                </FlexItem>
              )}
            </Flex>
          </CardBody>
        </Card>
      </GridItem>
    );
  };

  // ========================================
  // Render Loading State
  // ========================================

  if (isLoading) {
    return (
      <div className={className}>
        <EmptyState>
          <EmptyStateHeader
            titleText="Chargement en cours..."
            icon={<EmptyStateIcon icon={Spinner} />}
            headingLevel="h2"
          />
        </EmptyState>
      </div>
    );
  }

  // ========================================
  // Render Error State
  // ========================================

  if (error) {
    return (
      <div className={className}>
        <Alert
          variant="danger"
          title="Erreur lors du chargement des inscriptions"
          isInline
        >
          {error.message}
        </Alert>
      </div>
    );
  }

  // ========================================
  // Render Empty State
  // ========================================

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className={className}>
        <EmptyState>
          <EmptyStateHeader
            titleText="Aucune inscription"
            icon={<EmptyStateIcon icon={ListIcon} />}
            headingLevel="h2"
          />
          <EmptyStateBody>{emptyMessage}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  // ========================================
  // Render Main Content
  // ========================================

  return (
    <div className={className}>
      {/* Filters */}
      {showFilters && (
        <Card style={{ marginBottom: "1.5rem" }}>
          <CardBody>
            <Flex
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              alignItems={{ default: "alignItemsCenter" }}
              spaceItems={{ default: "spaceItemsMd" }}
            >
              {/* Status Filter */}
              <FlexItem>
                <Flex
                  spaceItems={{ default: "spaceItemsSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
                  flexWrap={{ default: "wrap" }}
                >
                  <FlexItem>
                    <FilterIcon /> <strong>Statut:</strong>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant={
                        selectedStatus === "all"
                          ? ButtonVariant.primary
                          : ButtonVariant.secondary
                      }
                      onClick={() => handleStatusFilter("all")}
                      isSmall
                    >
                      Tous ({enrollments.length})
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant={
                        selectedStatus === EnrollmentStatus.CONFIRMED
                          ? ButtonVariant.primary
                          : ButtonVariant.secondary
                      }
                      onClick={() =>
                        handleStatusFilter(EnrollmentStatus.CONFIRMED)
                      }
                      isSmall
                    >
                      Confirmé ({activeEnrollments.length})
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant={
                        selectedStatus === EnrollmentStatus.WAITLIST
                          ? ButtonVariant.primary
                          : ButtonVariant.secondary
                      }
                      onClick={() =>
                        handleStatusFilter(EnrollmentStatus.WAITLIST)
                      }
                      isSmall
                    >
                      Liste d'attente ({waitlistedEnrollments.length})
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>

              {/* Sort Options */}
              <FlexItem>
                <Flex
                  spaceItems={{ default: "spaceItemsSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
                >
                  <FlexItem>
                    <strong>Trier par:</strong>
                  </FlexItem>
                  <FlexItem>
                    <Select
                      variant={SelectVariant.single}
                      onToggle={(_event, isOpen) => setIsSortSelectOpen(isOpen)}
                      onSelect={(_event, selection) =>
                        handleSortChange(
                          selection as EnrollmentFilters["sortBy"],
                        )
                      }
                      selections={filters.sortBy}
                      isOpen={isSortSelectOpen}
                      aria-label="Sort enrollments"
                    >
                      <SelectOption key="enrolledAt" value="enrolledAt">
                        Date d'inscription
                      </SelectOption>
                      <SelectOption key="updatedAt" value="updatedAt">
                        Dernière mise à jour
                      </SelectOption>
                      <SelectOption key="status" value="status">
                        Statut
                      </SelectOption>
                    </Select>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* Enrollments List */}
      <Grid hasGutter>{enrollments.map(renderEnrollmentCard)}</Grid>

      {/* Summary */}
      <Divider style={{ marginTop: "1.5rem", marginBottom: "1rem" }} />
      <Flex
        justifyContent={{ default: "justifyContentSpaceBetween" }}
        alignItems={{ default: "alignItemsCenter" }}
      >
        <FlexItem>
          <TextContent>
            <Text component={TextVariants.small}>
              <strong>Total:</strong> {enrollments.length} inscription(s)
            </Text>
          </TextContent>
        </FlexItem>
        {activeEnrollments.length > 0 && (
          <FlexItem>
            <Label color="green">{activeEnrollments.length} active(s)</Label>
          </FlexItem>
        )}
        {waitlistedEnrollments.length > 0 && (
          <FlexItem>
            <Label color="blue">
              {waitlistedEnrollments.length} en attente
            </Label>
          </FlexItem>
        )}
      </Flex>
    </div>
  );
};

export default MyEnrollmentsList;
