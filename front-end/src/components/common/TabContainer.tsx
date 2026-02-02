import React from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Card,
  CardBody,
} from '@patternfly/react-core';

interface TabItem {
  key: number;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabContainerProps {
  tabs: TabItem[];
  activeKey: number;
  onTabSelect: (key: number) => void;
  variant?: 'default' | 'modern' | 'minimal';
  className?: string;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  tabs,
  activeKey,
  onTabSelect,
  variant = 'default',
  className = '',
}) => {
  const getVariantClass = () => {
    return `tab-container--${variant}`;
  };

  const renderTabTitle = (tab: TabItem) => (
    <TabTitleText>
      <div className="tab-title">
        {tab.icon && (
          <span className="tab-title__icon">
            {tab.icon}
          </span>
        )}
        <span className="tab-title__text">{tab.title}</span>
        {tab.badge && (
          <span className="tab-title__badge">
            {tab.badge}
          </span>
        )}
      </div>
    </TabTitleText>
  );

  return (
    <div className={`tab-container ${getVariantClass()} ${className}`}>
      <Tabs
        activeKey={activeKey}
        onSelect={(_, key) => onTabSelect(Number(key))}
        className="tab-container__tabs"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            eventKey={tab.key}
            title={renderTabTitle(tab)}
            isDisabled={tab.disabled}
            className="tab-container__tab"
          >
            <Card className="tab-container__content">
              <CardBody>
                {tab.content}
              </CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};
