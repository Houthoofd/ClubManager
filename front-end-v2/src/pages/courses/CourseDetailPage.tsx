/**
 * CourseDetailPage
 *
 * Page displaying detailed information about a specific course.
 * Following FSD architecture with PatternFly components.
 */

import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Page,
  PageSection,
  Title,
  Text,
  TextContent,
  TextVariants,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Divider,
  Progress,
  ProgressSize,
  ProgressVariant,
  Breadcrumb,
  BreadcrumbItem,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateHeader,
  Alert,
  AlertVariant,
  AlertActionLink,
  Grid,
  GridItem,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { CalendarAltIcon } from "@patternfly/react-icons";
import { useCourseDetail } from "@/features/courses";
import { COURSE_TYPE_LABELS, COURSE_LEVEL_LABELS } from "@/features/courses";
import { EnrollButton, useCourseCapacity } from "@/features/enrollment";

/**
 * Page de détails d'un cours
 */
export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseId = id ? parseInt(id, 10) : 0;

  const { data: course, isLoading, error } = useCourseDetail(courseId);
  const { data: capacity, isLoading: isLoadingCapacity } =
    useCourseCapacity(courseId);

  // ========================================
  // Loading State
  // ========================================

  if (isLoading) {
    return (
      <Page>
        <PageSection isCenterAligned>
          <EmptyState>
            <EmptyStateHeader
              titleText="Chargement du cours..."
              icon={<EmptyStateIcon icon={Spinner} />}
              headingLevel="h1"
            />
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  // ========================================
  // Error State
  // ========================================

  if (error || !course) {
    return (
      <Page>
        <PageSection>
          <Alert
            variant={AlertVariant.danger}
            title="Cours introuvable"
            actionLinks={
              <AlertActionLink onClick={() => navigate("/courses")}>
                Retour à la liste
              </AlertActionLink>
            }
          >
            <p>{error?.message || "Le cours demandé n'existe pas."}</p>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  // ========================================
  // Computed Values
  // ========================================

  const availableSpots =
    capacity?.availableSpots ?? course.capacity - course.enrolled;
  const isFull = capacity?.isFull ?? availableSpots <= 0;
  const isAlmostFull = !isFull && availableSpots > 0 && availableSpots <= 3;

  // ========================================
  // Helper Functions
  // ========================================

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "green";
      case "intermediate":
        return "orange";
      case "advanced":
        return "red";
      default:
        return "grey";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "full":
        return "orange";
      case "inactive":
        return "grey";
      default:
        return "grey";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "full":
        return "Complet";
      case "inactive":
        return "Inactif";
      default:
        return status;
    }
  };

  const getProgressVariant = (): ProgressVariant => {
    if (isFull) return ProgressVariant.danger;
    if (isAlmostFull) return ProgressVariant.warning;
    return ProgressVariant.success;
  };

  // ========================================
  // Render
  // ========================================

  return (
    <Page>
      {/* Breadcrumb Navigation */}
      <PageSection variant="light" padding={{ default: "noPadding" }}>
        <Breadcrumb style={{ padding: "1rem 1.5rem" }}>
          <BreadcrumbItem to="/courses" component={Link}>
            Cours
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{course.name}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      {/* Header Section */}
      <PageSection variant="light">
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsFlexStart" }}
        >
          <FlexItem flex={{ default: "flex_1" }}>
            <Title headingLevel="h1" size="2xl">
              {course.name}
            </Title>
            <Flex
              spaceItems={{ default: "spaceItemsSm" }}
              style={{ marginTop: "0.5rem" }}
            >
              <FlexItem>
                <Label color="blue">
                  {
                    COURSE_TYPE_LABELS[
                      course.type as keyof typeof COURSE_TYPE_LABELS
                    ]
                  }
                </Label>
              </FlexItem>
              <FlexItem>
                <Label color={getLevelColor(course.level)}>
                  {
                    COURSE_LEVEL_LABELS[
                      course.level as keyof typeof COURSE_LEVEL_LABELS
                    ]
                  }
                </Label>
              </FlexItem>
              <FlexItem>
                <Label color={getStatusColor(course.status)}>
                  {getStatusLabel(course.status)}
                </Label>
              </FlexItem>
            </Flex>
          </FlexItem>

          <FlexItem style={{ textAlign: "right" }}>
            <Title
              headingLevel="h2"
              size="2xl"
              style={{
                color: "var(--pf-v5-global--primary-color--100)",
                marginBottom: "0.5rem",
              }}
            >
              {course.price} €
            </Title>
            <EnrollButton
              courseId={courseId}
              size="large"
              disabled={course.status !== "active"}
              showCapacity={false}
              variant="primary"
            />
          </FlexItem>
        </Flex>
      </PageSection>

      <Divider />

      {/* Alert for low availability */}
      {isAlmostFull && !isFull && (
        <PageSection>
          <Alert
            variant={AlertVariant.warning}
            title="Places limitées"
            isInline
          >
            Il ne reste que {availableSpots} place
            {availableSpots > 1 ? "s" : ""} disponible
            {availableSpots > 1 ? "s" : ""} !
          </Alert>
        </PageSection>
      )}

      {/* Main Content */}
      <PageSection>
        <Grid hasGutter span={12}>
          {/* Left Column - Main Content */}
          <GridItem span={8} spanSm={12}>
            {/* Description Card */}
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardTitle>
                <Title headingLevel="h2" size="lg">
                  Description
                </Title>
              </CardTitle>
              <CardBody>
                <TextContent>
                  <Text component={TextVariants.p}>{course.description}</Text>
                </TextContent>
              </CardBody>
            </Card>

            {/* Sessions Card - Placeholder */}
            <Card>
              <CardTitle>
                <Title headingLevel="h2" size="lg">
                  Prochaines sessions
                </Title>
              </CardTitle>
              <CardBody>
                <EmptyState variant="sm">
                  <EmptyStateHeader
                    titleText="Aucune session disponible"
                    icon={<EmptyStateIcon icon={CalendarAltIcon} />}
                    headingLevel="h3"
                  />
                  <EmptyStateBody>
                    Les sessions seront disponibles prochainement.
                  </EmptyStateBody>
                </EmptyState>
              </CardBody>
            </Card>
          </GridItem>

          {/* Right Column - Sidebar */}
          <GridItem span={4} spanSm={12}>
            {/* Course Information Card */}
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardTitle>
                <Title headingLevel="h2" size="lg">
                  Informations
                </Title>
              </CardTitle>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Durée</DescriptionListTerm>
                    <DescriptionListDescription>
                      {course.duration} minutes
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Capacité</DescriptionListTerm>
                    <DescriptionListDescription>
                      {course.capacity} personnes max
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Inscrits</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Text
                        component={TextVariants.p}
                        style={{
                          fontWeight: 600,
                          color: isFull
                            ? "var(--pf-v5-global--danger-color--100)"
                            : isAlmostFull
                              ? "var(--pf-v5-global--warning-color--100)"
                              : "var(--pf-v5-global--success-color--100)",
                        }}
                      >
                        {course.enrolled} / {course.capacity}
                      </Text>
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  {course.professor && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Professeur</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Link
                          to={`/professors/${course.professor.id}`}
                          style={{ color: "var(--pf-v5-global--link--Color)" }}
                        >
                          {course.professor.firstName}{" "}
                          {course.professor.lastName}
                        </Link>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </CardBody>
            </Card>

            {/* Capacity Progress Card */}
            <Card>
              <CardTitle>
                <Title headingLevel="h2" size="lg">
                  Disponibilité
                </Title>
              </CardTitle>
              <CardBody>
                {isLoadingCapacity ? (
                  <Spinner size="md" />
                ) : (
                  <>
                    <Progress
                      value={course.enrolled}
                      max={course.capacity}
                      title="Taux de remplissage"
                      label={`${course.enrolled} / ${course.capacity}`}
                      valueText={`${course.enrolled} inscrits sur ${course.capacity}`}
                      variant={getProgressVariant()}
                      size={ProgressSize.lg}
                    />
                    <div style={{ marginTop: "1rem" }}>
                      <TextContent>
                        <Text component={TextVariants.small}>
                          {isFull ? (
                            <span
                              style={{
                                color: "var(--pf-v5-global--danger-color--100)",
                                fontWeight: 600,
                              }}
                            >
                              Cours complet
                              {capacity?.waitlistCount &&
                                capacity.waitlistCount > 0 && (
                                  <>
                                    {" "}
                                    - {capacity.waitlistCount} personne
                                    {capacity.waitlistCount > 1 ? "s" : ""} sur
                                    liste d'attente
                                  </>
                                )}
                            </span>
                          ) : (
                            <span>
                              {availableSpots} place
                              {availableSpots > 1 ? "s" : ""} disponible
                              {availableSpots > 1 ? "s" : ""}
                            </span>
                          )}
                        </Text>
                      </TextContent>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </Page>
  );
};
