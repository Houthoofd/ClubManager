import React from 'react';
import { PageSection } from '@patternfly/react-core';
import { PageHeader } from '../../components/common/PageHeader';

const MessagesPage: React.FC = () => {
  return (
    <div className="messages-page">
      <PageHeader
        title="Messages"
        subtitle="Communication avec vos membres et votre équipe"
        variant="messages"
      />

      <PageSection className="messages-content">
        {/* Contenu des messages */}
      </PageSection>
    </div>
  );
};

export default MessagesPage;
