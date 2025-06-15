import React, { useEffect, useState } from 'react';
import '../../app/styles/style-tabs.css';


export const Tab = ({ label, onClick, isActive }: any) => {
  return (
    <button
      className={`tab-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export const Tabs = ({ children }: any) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="tabs">
      <div className="tab-list">
        {children.map((child: any, index: number) => (
          <Tab
            key={index}
            label={child.props.label}
            onClick={() => setActiveTab(index)}
            isActive={activeTab === index}
          />
        ))}
      </div>
      <div className="tab-content">
        {children[activeTab]}
      </div>
    </div>
  );
};

export const TabPanel = ({ children }: any) => {
  return (
    <div>
      {children}
    </div>
  );
};