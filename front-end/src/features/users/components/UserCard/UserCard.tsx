/**
 * UserCard Component
 *
 * Displays user information in a card format with avatar, role, and status
 * Used in UserList and user management pages
 */

import React from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  CardHeader,
  Button,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
  Avatar,
  Label,
  Checkbox,
  Skeleton,
} from '@patternfly/react-core';
import {
  EyeIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  BanIcon,
  UserIcon,
} from '@/shared/icons';
import { useTranslation } from 'react-i18next';
import { UserCardProps } from './UserCard.types';
import {
  formatUserFullName,
  formatUserEmail,
  formatUserPhone,
  formatUserLastLogin,
  getUserRoleLabel,
  getUserRoleColor,
  getUserStatusLabel,
  getUserStatusColor,
  getUserAvatarOrInitials,
  isUserActive,
  canEditUser,
  canDeleteUser,
} from '../../utils/user-formatters';

/**
 * UserCard component
 */
export const UserCard: React.FC<UserCardProps> = ({
  user,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  showActions = true,
  showContact = true,
  showAvatar = true,
  showLastLogin = false,
  isCompact = false,
  className,
  isLoading = false,
  isSelectable = false,
  isSelected = false,
  onSelect,
}) => {
  const { t } = useTranslation();

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={className} isCompact={isCompact}>
        <CardHeader>
          <Flex spaceItems={{ default: 'spaceItemsSm' }}>
            {showAvatar && (
              <FlexItem>
                <Skeleton shape="circle" width="48px" height="48px" />
              </FlexItem>
            )}
            <FlexItem flex={{ default: 'flex_1' }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </FlexItem>
          </Flex>
        </CardHeader>
        <CardBody>
          <Skeleton width="80%" />
          <Skeleton width="70%" />
        </CardBody>
        {showActions && (
          <CardFooter>
            <Skeleton width="100px" height="36px" />
          </CardFooter>
        )}
      </Card>
    );
  }

  const fullName = formatUserFullName(user.firstName, user.lastName);
  const avatarUrl = getUserAvatarOrInitials(user.avatar, user.firstName, user.lastName);
  const roleLabel = getUserRoleLabel(user.role);
  const roleColor = getUserRoleColor(user.role);
  const statusLabel = getUserStatusLabel(user.status);
  const statusColor = getUserStatusColor(user.status);
  const isActive = isUserActive(user.status);
  const canEdit = canEditUser(user.status);
  const canDelete = canDeleteUser(user.role);

  return (
    <Card className={className} isCompact={isCompact}>
      <CardHeader>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          {isSelectable && (
            <FlexItem>
              <Checkbox
                id={`select-user-${user.id}`}
                isChecked={isSelected}
                onChange={(checked) => onSelect?.(user, checked)}
                aria-label={t('users.select', { defaultValue: 'Sélectionner utilisateur' })}
              />
            </FlexItem>
          )}
          {showAvatar && (
            <FlexItem>
              <Avatar src={avatarUrl} alt={fullName} size="md" />
            </FlexItem>
          )}
          <FlexItem flex={{ default: 'flex_1' }}>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
              <FlexItem>
                <TextContent>
                  <Text component={TextVariants.h4}>{fullName}</Text>
                </TextContent>
              </FlexItem>
              <FlexItem>
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <Label color={roleColor}>{t(roleLabel)}</Label>
                  </FlexItem>
                  <FlexItem>
                    <Label color={statusColor}>{t(statusLabel)}</Label>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
          {/* Email */}
          {showContact && (
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.small}>
                  <strong>{t('common.labels.email')}:</strong> {formatUserEmail(user.email)}
                </Text>
              </TextContent>
            </FlexItem>
          )}

          {/* Phone */}
          {showContact && user.phone && (
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.small}>
                  <strong>{t('common.labels.phone')}:</strong> {formatUserPhone(user.phone)}
                </Text>
              </TextContent>
            </FlexItem>
          )}

          {/* Grade */}
          {user.grade && (
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.small}>
                  <strong>{t('users.fields.grade', { defaultValue: 'Grade' })}:</strong> {user.grade}
                </Text>
              </TextContent>
            </FlexItem>
          )}

          {/* Last Login */}
          {showLastLogin && user.lastLogin && (
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.small} style={{ color: 'var(--pf-global--Color--200)' }}>
                  {t('users.fields.lastLogin', { defaultValue: 'Dernière connexion' })}: {formatUserLastLogin(user.lastLogin)}
                </Text>
              </TextContent>
            </FlexItem>
          )}
        </Flex>
      </CardBody>

      {showActions && (
        <CardFooter>
          <Flex spaceItems={{ default: 'spaceItemsSm' }}>
            {onView && (
              <FlexItem>
                <Button
                  variant="link"
                  icon={<EyeIcon />}
                  onClick={() => onView(user)}
                  isSmall
                >
                  {t('common.actions.view')}
                </Button>
              </FlexItem>
            )}
            {onEdit && canEdit && (
              <FlexItem>
                <Button
                  variant="link"
                  icon={<EditIcon />}
                  onClick={() => onEdit(user)}
                  isSmall
                >
                  {t('common.actions.edit')}
                </Button>
              </FlexItem>
            )}
            {isActive && onDeactivate && (
              <FlexItem>
                <Button
                  variant="link"
                  icon={<BanIcon />}
                  onClick={() => onDeactivate(user)}
                  isDanger
                  isSmall
                >
                  {t('users.details.deactivate', { defaultValue: 'Désactiver' })}
                </Button>
              </FlexItem>
            )}
            {!isActive && onActivate && (
              <FlexItem>
                <Button
                  variant="link"
                  icon={<CheckCircleIcon />}
                  onClick={() => onActivate(user)}
                  isSmall
                >
                  {t('users.details.activate', { defaultValue: 'Activer' })}
                </Button>
              </FlexItem>
            )}
            {onDelete && canDelete && (
              <FlexItem>
                <Button
                  variant="link"
                  icon={<TrashIcon />}
                  onClick={() => onDelete(user)}
                  isDanger
                  isSmall
                >
                  {t('common.actions.delete')}
                </Button>
              </FlexItem>
            )}
          </Flex>
        </CardFooter>
      )}
    </Card>
  );
};

export default UserCard;
