/**
 * Notifications Page
 *
 * Displays user notifications including system alerts, updates, and messages.
 */

import React, { useState } from "react";
import {
  PageSection,
  Card,
  CardBody,
  EmptyState,
  Title,
  Button,
  List,
  ListItem,
  Badge,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { BellIcon, CheckIcon } from '@/shared/icons';
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";

export const NotificationsPage: React.FC = () => {
  const [notifications] = useState<any[]>([]);

  return (
    <>
      <PageHeader title="Notifications" subtitle="Gérez vos notifications et alertes" />

      <PageSection>
        <Card>
          <CardBody>
            {notifications.length === 0 ? (
              <EmptyState>
                <BellIcon size="xl" style={{ marginBottom: "16px", fontSize: "48px" }} />
                <Title headingLevel="h4" size="lg">
                  Aucune notification
                </Title>
                <p>Vous n'avez aucune notification pour le moment.</p>
              </EmptyState>
            ) : (
              <List isPlain>
                {notifications.map((notification, index) => (
                  <ListItem key={index}>
                    <Flex>
                      <FlexItem flex={{ default: "flex_1" }}>
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <small>{notification.timestamp}</small>
                      </FlexItem>
                      <FlexItem>
                        <Badge isRead={notification.read}>
                          {notification.read ? "Lu" : "Non lu"}
                        </Badge>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="plain"
                          icon={<CheckIcon />}
                          aria-label="Marquer comme lu"
                        />
                      </FlexItem>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export default NotificationsPage;
