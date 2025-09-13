import React from 'react';
import { PageSection, Title } from '@patternfly/react-core';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'dashboard' | 'users' | 'courses' | 'payments' | 'store' | 'teachers' | 'messages' | 'stats' | 'commandes' | 'planning' | 'membres' | 'compte' | 'settings' | 'inscriptions' | 'default';
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  variant = 'default',
  actions,
  breadcrumbs,
}) => {
  const getVariantClass = () => {
    return `page-header--${variant}`;
  };

  return (
    <PageSection className={`page-header ${getVariantClass()}`} style={{
      padding: '2rem',
      borderRadius: '12px',
      margin: '0',
      color: 'white'
    }}>
      <div className="page-header__content">
        {breadcrumbs && (
          <div className="page-header__breadcrumbs">
            {breadcrumbs}
          </div>
        )}
        
        <div className="page-header__main">
          <div className="page-header__text">
            <Title 
              headingLevel="h1" 
              size="2xl" 
              className="page-header__title"
              style={{ 
                color: 'white', 
                fontSize: '2rem', 
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}
            >
              {title}
            </Title>
            {subtitle && (
              <p 
                className="page-header__subtitle"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '1.1rem',
                  margin: '0',
                  opacity: '0.9'
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="page-header__actions">
              {actions}
            </div>
          )}
        </div>
      </div>
    </PageSection>
  );
};
