import React from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';

const ToolbarMagasin: React.FC = () => {
  return (
    <PageSection variant={PageSectionVariants.default}>
      <Toolbar className="gradient-toolbar">
        <ToolbarContent>
          <ToolbarItem>
            <Title 
              headingLevel="h1" 
              size="2xl" 
              className="gradient-header-title"
            >
              Magasin du Club
            </Title>
            <p className="gradient-header-subtitle">
              Découvrez nos articles et équipements
            </p>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    </PageSection>
  );
};

export default ToolbarMagasin;
