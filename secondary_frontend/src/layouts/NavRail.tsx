/**
 * NavRail
 * The far-left 54px column containing the three panel-switch buttons,
 * an optional red badge for pending activity, and the logout button.
 */

import React from 'react';
import { ChatIcon, PendingIcon, SearchIcon, LogoutIcon } from '../components/ui/Icons';
import Badge from '../components/ui/Badge';

export type NavTab = 'chat' | 'pending' | 'search';

interface NavRailProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLogout: () => void;
  hasPending: boolean;
}

const NavRail: React.FC<NavRailProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  hasPending,
}) => (
  <nav className="nav-rail">
    <button
      className={`nav-btn${activeTab === 'chat' ? ' active' : ''}`}
      onClick={() => onTabChange('chat')}
      title="Chats"
    >
      <ChatIcon />
    </button>

    <button
      className={`nav-btn${activeTab === 'pending' ? ' active' : ''}`}
      onClick={() => onTabChange('pending')}
      title="Requests"
    >
      <PendingIcon />
      {hasPending && <Badge />}
    </button>

    <button
      className={`nav-btn${activeTab === 'search' ? ' active' : ''}`}
      onClick={() => onTabChange('search')}
      title="Find user"
    >
      <SearchIcon />
    </button>

    <div className="nav-spacer" />

    <button className="logout-btn" onClick={onLogout} title="Log out">
      <LogoutIcon />
    </button>
  </nav>
);

export default NavRail;
