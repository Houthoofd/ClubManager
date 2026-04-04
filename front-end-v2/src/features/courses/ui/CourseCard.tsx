/**
 * CourseCard Component
 *
 * Displays a course in a card format with key information.
 * Following FSD architecture and using PatternFly React components.
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Label,
  Button,
  Flex,
  FlexItem,
  Text,
  TextContent,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import {
  CalendarAltIcon,
  UserIcon,
  ClockIcon,
  UsersIcon,
} from "@patternfly/react-icons";
import type { Course } from "../model/types";
import { COURSE_TYPE_LABELS, COURSE_LEVEL_LABELS } from "../model/types";

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
}

/**
 * Carte d'affichage d'un cours
 *
 * @example
 * ```tsx
 * <CourseCard course={course} />
 * ```
 */
export const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const availableSpots = course.capacity - course.enrolled;
  const isFull = availableSpots <= 0;
  const isAlmostFull = availableSpots > 0 && availableSpots <= 3;

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "active":
        return "green";
      case "full":
        return "orange";
      case "inactive":
      default:
        return "grey";
    }
  };

  const getStatusLabel = (status: Course["status"]) => {
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

  const getLevelColor = (level: Course["level"]) => {
    switch (level) {
      case "beginner":
        return "green";
      case "intermediate":
        return "orange";
      case "advanced":
        return "red";
      default:
        return "blue";
    }
  };

  const getSpotsColor = () => {
    if (isFull) return "red";
    if (isAlmostFull) return "orange";
    return "green";
  };

  return (
    <Card isClickable={!!onClick} isCompact isRounded>
      <CardTitle>
        <Flex
          alignItems={{ default: "alignItemsCenter" }}
          spaceItems={{ default: "spaceItemsSm" }}
        >
          <FlexItem flex={{ default: "flex_1" }}>
            <Title headingLevel="h3" size="lg">
              {course.name}
            </Title>
          </FlexItem>
          <FlexItem>
            <Label color={getStatusColor(course.status)}>
              {getStatusLabel(course.status)}
            </Label>
          </FlexItem>
        </Flex>
      </CardTitle>

      <CardBody>
        <TextContent>
          <Text
            component="p"
            style={{ marginBottom: "var(--pf-v5-global--spacer--md)" }}
          >
            {course.description.length > 120
              ? `${course.description.substring(0, 120)}...`
              : course.description}
          </Text>
        </TextContent>

        <Flex
          direction={{ default: "row" }}
          spaceItems={{ default: "spaceItemsSm" }}
          style={{ marginBottom: "var(--pf-v5-global--spacer--md)" }}
        >
          <FlexItem>
            <Label color="blue">{COURSE_TYPE_LABELS[course.type]}</Label>
          </FlexItem>
          <FlexItem>
            <Label color={getLevelColor(course.level)}>
              {COURSE_LEVEL_LABELS[course.level]}
            </Label>
          </FlexItem>
        </Flex>

        <Flex
          direction={{ default: "column" }}
          spaceItems={{ default: "spaceItemsSm" }}
        >
          <FlexItem>
            <Flex
              alignItems={{ default: "alignItemsCenter" }}
              spaceItems={{ default: "spaceItemsXs" }}
            >
              <FlexItem>
                <ClockIcon />
              </FlexItem>
              <FlexItem>
                <Text component="small">
                  <strong>Durée:</strong> {course.duration} min
                </Text>
              </FlexItem>
            </Flex>
          </FlexItem>

          <FlexItem>
            <Flex
              alignItems={{ default: "alignItemsCenter" }}
              spaceItems={{ default: "spaceItemsXs" }}
            >
              <FlexItem>
                <UsersIcon />
              </FlexItem>
              <FlexItem>
                <Text component="small">
                  <strong>Places:</strong>{" "}
                  <Label color={getSpotsColor()} isCompact>
                    {availableSpots} / {course.capacity}
                  </Label>
                </Text>
              </FlexItem>
            </Flex>
          </FlexItem>

          {course.professor && (
            <FlexItem>
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                spaceItems={{ default: "spaceItemsXs" }}
              >
                <FlexItem>
                  <UserIcon />
                </FlexItem>
                <FlexItem>
                  <Text component="small">
                    <strong>Professeur:</strong> {course.professor.firstName}{" "}
                    {course.professor.lastName}
                  </Text>
                </FlexItem>
              </Flex>
            </FlexItem>
          )}
        </Flex>
      </CardBody>

      <CardFooter>
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem>
            <Text
              component="span"
              style={{
                fontSize: "var(--pf-v5-global--FontSize--xl)",
                fontWeight: "var(--pf-v5-global--FontWeight--bold)",
                color: "var(--pf-v5-global--primary-color--100)",
              }}
            >
              {course.price} €
            </Text>
          </FlexItem>
          <FlexItem>
            <Button
              variant="primary"
              component={(props) => (
                <Link {...props} to={`/courses/${course.id}`} />
              )}
            >
              Voir détails
            </Button>
          </FlexItem>
        </Flex>
      </CardFooter>
    </Card>
  );
};
