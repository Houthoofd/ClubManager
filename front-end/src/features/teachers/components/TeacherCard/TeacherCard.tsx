/**
 * TeacherCard Component
 *
 * Displays teacher information in a card format.
 * Atomic component with single responsibility: render teacher data.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Card, CardBody, Title } from "@patternfly/react-core";
import { UserIcon } from '@/shared/icons';
import { useTranslation } from "react-i18next";
import type { TeacherCardProps } from "./TeacherCard.types";
import { formatDate } from "../../utils/teacher-formatters";

export const TeacherCard: React.FC<TeacherCardProps> = ({
  id,
  firstName,
  lastName,
  email,
  specialization,
  bio,
  certifications,
  active = true,
  hireDate,
  onClick,
  actions,
  className = "",
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <Card
      className={`teacher-card ${className}`}
      style={{ marginBottom: "1rem", cursor: onClick ? "pointer" : "default" }}
      onClick={handleClick}
      isClickable={!!onClick}
    >
      <CardBody>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Teacher Name & Status */}
            <Title headingLevel="h4" size="md">
              <UserIcon style={{ marginRight: "0.5rem" }} />
              {firstName} {lastName}
              {!active && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.875rem",
                    color: "#6c757d",
                  }}
                >
                  ({t("teachers.manage.inactive")})
                </span>
              )}
            </Title>

            {/* Teacher Details */}
            <div
              style={{
                marginTop: "0.5rem",
                color: "#6a6e73",
                fontSize: "0.875rem",
              }}
            >
              <InfoRow label={t("teachers.manage.email")} value={email} />
              <InfoRow label={t("teachers.manage.specialization")} value={specialization} />
              <InfoRow label={t("teachers.manage.certifications")} value={certifications} />
              <InfoRow
                label={t("teachers.manage.hireDate")}
                value={hireDate ? formatDate(hireDate) : undefined}
              />
            </div>

            {/* Bio Section */}
            {bio && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                }}
              >
                <strong>{t("teachers.manage.bio")}:</strong>
                <div style={{ marginTop: "0.25rem" }}>{bio}</div>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          {actions && <div style={{ marginLeft: "1rem" }}>{actions}</div>}
        </div>
      </CardBody>
    </Card>
  );
};

/**
 * InfoRow - Internal helper component
 * Displays a label-value pair if value exists
 */
const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (!value) return null;

  return (
    <div style={{ marginTop: "0.25rem" }}>
      <strong>{label}:</strong> {value}
    </div>
  );
};

export default TeacherCard;
