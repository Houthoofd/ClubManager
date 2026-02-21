/**
 * CourseCard Component
 *
 * Displays course information in a card format.
 * Atomic component with single responsibility: render course data.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Card, CardBody, Title, Label, Flex, FlexItem } from "@patternfly/react-core";
import { ClockIcon, UserIcon, CalendarAltIcon } from "@patternfly/react-icons";
import { useTranslation } from "react-i18next";
import type { CourseCardProps } from "./CourseCard.types";
import { formatTimeRange, formatInstructorNames } from "../../utils/course-formatters";

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  type,
  name,
  day,
  startTime,
  endTime,
  instructors = [],
  onClick,
  actions,
  className = "",
  showDay = true,
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const instructorNames = formatInstructorNames(instructors);
  const timeRange = formatTimeRange(startTime, endTime);

  return (
    <Card
      className={`course-card ${className}`}
      style={{ marginBottom: "1rem", cursor: onClick ? "pointer" : "default" }}
      onClick={handleClick}
      isClickable={!!onClick}
    >
      <CardBody>
        <Flex
          direction={{ default: "column" }}
          spaceItems={{ default: "spaceItemsSm" }}
        >
          {/* Header with Course Type and Actions */}
          <Flex
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem>
              <Title headingLevel="h4" size="md">
                {name || type}
              </Title>
            </FlexItem>
            {actions && <FlexItem>{actions}</FlexItem>}
          </Flex>

          {/* Course Type Label (if name is different) */}
          {name && name !== type && (
            <FlexItem>
              <Label color="blue" icon={<CalendarAltIcon />}>
                {type}
              </Label>
            </FlexItem>
          )}

          {/* Day Information */}
          {showDay && day && (
            <FlexItem>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6a6e73",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <CalendarAltIcon size="sm" />
                <strong>{t("common.labels.day")}:</strong>
                <span style={{ textTransform: "capitalize" }}>{day}</span>
              </div>
            </FlexItem>
          )}

          {/* Time Range */}
          <FlexItem>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6a6e73",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ClockIcon size="sm" />
              <strong>{t("common.labels.time")}:</strong>
              <span>{timeRange}</span>
            </div>
          </FlexItem>

          {/* Instructors */}
          <FlexItem>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6a6e73",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <UserIcon size="sm" />
              <strong>{t("courses.details.instructor")}:</strong>
              <span>{instructorNames}</span>
            </div>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default CourseCard;
