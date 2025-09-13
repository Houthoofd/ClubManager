import React from 'react';
import { Button } from '@patternfly/react-core';

interface ActionButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'link' | 'plain' | 'control';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  icon,
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  size,
  className = '',
}) => {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      isDisabled={disabled || loading}
      isLoading={loading}
      icon={icon}
      size={size}
      className={`action-button ${className}`}
    >
      {children}
    </Button>
  );
};
