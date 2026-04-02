/**
 * Shared UI Components
 *
 * Barrel export for all shared/reusable UI components.
 * These components are design system primitives used across the application.
 *
 * @module shared/ui
 */

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { ErrorBoundary, useErrorHandler } from './ErrorBoundary';

// Re-export commonly used PatternFly components for convenience
export {
  Alert,
  AlertGroup,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Modal,
  ModalVariant,
  Page,
  PageSection,
  Spinner,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';
