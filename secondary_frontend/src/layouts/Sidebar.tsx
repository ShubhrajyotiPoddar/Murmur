/**
 * Sidebar
 * Houses the three switchable panels — Messages, Requests, Find user.
 * Only the active panel has the `.active` class (CSS controls display:flex).
 * Business logic is lifted to ChatPage; Sidebar is purely structural.
 */

import React from 'react';
import { NavTab } from './NavRail';

interface SidebarProps {
  activeTab: NavTab;
  chatPanel:    React.ReactNode;
  pendingPanel: React.ReactNode;
  searchPanel:  React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  chatPanel,
  pendingPanel,
  searchPanel,
}) => (
  <div className="sidebar">
    <div className={`panel${activeTab === 'chat'    ? ' active' : ''}`}>
      {chatPanel}
    </div>
    <div className={`panel${activeTab === 'pending' ? ' active' : ''}`}>
      {pendingPanel}
    </div>
    <div className={`panel${activeTab === 'search'  ? ' active' : ''}`}>
      {searchPanel}
    </div>
  </div>
);

export default Sidebar;
