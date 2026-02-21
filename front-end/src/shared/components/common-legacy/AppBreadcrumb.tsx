import React from 'react';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';

interface BreadcrumbItem {
  title: string;
  to?: string;
  isActive?: boolean;
}

interface AppBreadcrumbProps {
  items: BreadcrumbItem[];
}

const AppBreadcrumb: React.FC<AppBreadcrumbProps> = ({ items }) => {
  return (
    <Breadcrumb>
      {items.map((item, index) => (
        <BreadcrumbItem
          key={index}
          to={item.to}
          isActive={item.isActive}
        >
          {item.title}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
};

export default AppBreadcrumb;
