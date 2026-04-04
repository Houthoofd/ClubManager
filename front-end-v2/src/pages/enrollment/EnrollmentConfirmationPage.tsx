/**
 * @page EnrollmentConfirmationPage
 * @description Page de confirmation après inscription à un cours
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  Button,
  Spinner,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Alert,
  AlertVariant,
  AlertActionCloseButton,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import {
  useEnrollment,
  EnrollmentStatusBadge,
  UnenrollButton,
  EnrollmentStatus,
} from "@/features/enrollment";

/**
 * Page de confirmation d'inscription
 *
 * Affichée après une inscription réussie, elle montre :
 * - Les détails de l'inscription
 * - Le statut (confirmé ou liste d'attente)
 * - Les informations du cours
 * - Les actions possibles
 */
export default function EnrollmentConfirmationPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();

  const {
    data: enrollment,
    isLoading,
    error,
  } = useEnrollment(enrollmentId || "");

  useEffect(() => {
    if (!enrollmentId) {
      navigate("/my-enrollments");
    }
  }, [enrollmentId, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <Page>
        <PageSection variant="light" isFilled>
          <EmptyState>
            <EmptyStateHeader
              titleText="Chargement..."
              headingLevel="h1"
              icon={<EmptyStateIcon icon={Spinner} />}
            />
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  // Error state
  if (error || !enrollment) {
    return (
      <Page>
        <PageSection variant="light" isFilled>
          <EmptyState>
            <EmptyStateHeader
              titleText="Inscription introuvable"
              headingLevel="h1"
              icon={
                <EmptyStateIcon
                  icon={ExclamationTriangleIcon}
                  color="var(--pf-v5-global--danger-color--100)"
                />
              }
            />
            <EmptyStateBody>
              Nous n'avons pas pu trouver les détails de cette inscription.
            </EmptyStateBody>
            <Button
              variant="primary"
              onClick={() => navigate("/my-enrollments")}
            >
              Voir mes inscriptions
            </Button>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  const isConfirmed = enrollment.status === EnrollmentStatus.CONFIRMED;
  const isWaitlisted = enrollment.status === EnrollmentStatus.WAITLIST;
  const isPending = enrollment.status === EnrollmentStatus.PENDING;

  // Determine icon based on status
  let statusIcon = CheckCircleIcon;
  let statusIconColor = "var(--pf-v5-global--success-color--100)";
  if (isWaitlisted) {
    statusIcon = ClockIcon;
    statusIconColor = "var(--pf-v5-global--warning-color--100)";
  } else if (isPending) {
    statusIcon = ClockIcon;
    statusIconColor = "var(--pf-v5-global--info-color--100)";
  }

  return (
    <Page>
      {/* Header Section */}
      <PageSection variant="light">
        <EmptyState>
          <EmptyStateHeader
            titleText={
              <>
                {isConfirmed && "Inscription confirmée !"}
                {isWaitlisted && "Ajouté à la liste d'attente"}
                {isPending && "Inscription en attente"}
              </>
            }
            headingLevel="h1"
            icon={
              <EmptyStateIcon
                icon={statusIcon}
                color={statusIconColor}
                style={{ fontSize: "4rem" }}
              />
            }
          />
          <EmptyStateBody>
            <TextContent>
              <Text component={TextVariants.p}>
                {isConfirmed &&
                  "Vous êtes maintenant inscrit(e) à ce cours. Un email de confirmation vous a été envoyé."}
                {isWaitlisted &&
                  `Vous êtes en position ${enrollment.waitlistPosition || "-"} sur la liste d'attente. Nous vous notifierons dès qu'une place se libère.`}
                {isPending &&
                  "Votre inscription est en attente de validation. Vous recevrez une notification dès qu'elle sera confirmée."}
              </Text>
            </TextContent>
          </EmptyStateBody>
        </EmptyState>
      </PageSection>

      {/* Details Section */}
      <PageSection>
        <Card isFullHeight>
          <CardTitle>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <span>Détails de l'inscription</span>
              <EnrollmentStatusBadge
                status={enrollment.status}
                waitlistPosition={enrollment.waitlistPosition}
                showLabel={true}
                size="md"
              />
            </div>
          </CardTitle>
          <CardBody>
            {/* Course Info */}
            {enrollment.course && (
              <>
                <Title
                  headingLevel="h3"
                  size="lg"
                  style={{ marginBottom: "1rem" }}
                >
                  {enrollment.course.name}
                </Title>

                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Date de début</DescriptionListTerm>
                    <DescriptionListDescription>
                      {new Date(enrollment.course.startDate).toLocaleDateString(
                        "fr-FR",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Date de fin</DescriptionListTerm>
                    <DescriptionListDescription>
                      {new Date(enrollment.course.endDate).toLocaleDateString(
                        "fr-FR",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  {enrollment.course.professorName && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Professeur</DescriptionListTerm>
                      <DescriptionListDescription>
                        {enrollment.course.professorName}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}

                  {enrollment.course.maxCapacity && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Capacité</DescriptionListTerm>
                      <DescriptionListDescription>
                        {enrollment.course.currentEnrollments || 0} /{" "}
                        {enrollment.course.maxCapacity} inscrits
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>

                <div
                  style={{
                    marginTop: "1.5rem",
                    paddingTop: "1.5rem",
                    borderTop:
                      "1px solid var(--pf-v5-global--BorderColor--100)",
                  }}
                >
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Numéro d'inscription
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        <Text
                          component={TextVariants.small}
                          style={{ fontFamily: "monospace" }}
                        >
                          {enrollment.id}
                        </Text>
                      </DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Date d'inscription
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {new Date(enrollment.enrolledAt).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>

                    {enrollment.notes && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Notes</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Text
                            component={TextVariants.small}
                            style={{ fontStyle: "italic" }}
                          >
                            {enrollment.notes}
                          </Text>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                  </DescriptionList>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </PageSection>

      {/* Next Steps / Info Boxes */}
      {isConfirmed && (
        <PageSection>
          <Alert
            variant={AlertVariant.success}
            title="Prochaines étapes"
            isInline
          >
            <ul style={{ marginLeft: "1.5rem" }}>
              <li>Consultez votre email pour les détails du cours</li>
              <li>Ajoutez les dates à votre calendrier</li>
              <li>Vous pouvez annuler jusqu'à 24h avant le début du cours</li>
            </ul>
          </Alert>
        </PageSection>
      )}

      {isWaitlisted && (
        <PageSection>
          <Alert
            variant={AlertVariant.warning}
            title="Liste d'attente"
            isInline
          >
            <ul style={{ marginLeft: "1.5rem" }}>
              <li>
                Vous êtes en position {enrollment.waitlistPosition} sur la liste
              </li>
              <li>Vous serez notifié par email si une place se libère</li>
              <li>
                Votre position peut évoluer si d'autres personnes se
                désinscrivent
              </li>
              <li>Vous pouvez annuler votre demande à tout moment</li>
            </ul>
          </Alert>
        </PageSection>
      )}

      {/* Actions */}
      <PageSection>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <Button
            variant="primary"
            onClick={() => navigate(`/courses/${enrollment.courseId}`)}
            style={{ flex: "1 1 auto", minWidth: "200px" }}
          >
            Voir le cours
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate("/my-enrollments")}
            style={{ flex: "1 1 auto", minWidth: "200px" }}
          >
            Mes inscriptions
          </Button>

          {(isConfirmed || isWaitlisted) && (
            <div style={{ flex: "1 1 auto", minWidth: "200px" }}>
              <UnenrollButton
                enrollmentId={enrollment.id}
                courseName={enrollment.course?.name}
                onSuccess={() => navigate("/my-enrollments")}
                confirmMessage={
                  isWaitlisted
                    ? "Êtes-vous sûr de vouloir quitter la liste d'attente ?"
                    : "Êtes-vous sûr de vouloir annuler cette inscription ?"
                }
                className="pf-v5-u-w-100"
              />
            </div>
          )}
        </div>
      </PageSection>

      {/* Contact Support */}
      <PageSection>
        <TextContent style={{ textAlign: "center" }}>
          <Text component={TextVariants.small}>
            Une question ?{" "}
            <Button
              variant="link"
              isInline
              onClick={() => navigate("/contact")}
            >
              Contactez-nous
            </Button>
          </Text>
        </TextContent>
      </PageSection>
    </Page>
  );
}
