/**
 * AppLayout
 * The outermost .app shell — 860×620 rounded card that holds
 * the NavRail, Sidebar, and ChatArea side by side.
 * All three children are passed in as props so this component stays
 * a pure presentational wrapper with zero business logic.
 */

import React from 'react';

interface AppLayoutProps {
  navRail: React.ReactNode;
  sidebar: React.ReactNode;
  chatArea: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ navRail, sidebar, chatArea }) => (
  <div className="app">
    {navRail}
    {sidebar}
    {chatArea}
  </div>
);

export default AppLayout;
