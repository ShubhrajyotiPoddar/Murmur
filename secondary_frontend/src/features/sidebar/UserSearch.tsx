/**
 * UserSearch
 * Renders the "Find user" panel content:
 *   - Search input box
 *   - Hint text when empty
 *   - Result cards with context-aware action buttons:
 *       · Already friends   → "Start Chat" button  (ChatIcon)
 *       · Request pending   → disabled "Requested" state
 *       · No relation       → "Add Friend" (+) button
 *   - User bar pinned at the bottom
 */

import React from 'react';
import { SearchUser } from '../../hooks/useFetchUsers';
import { AuthUser } from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';
import {
  SmallSearchIcon,
  ChatIcon,
  PlusIcon,
  CheckIcon,
} from '../../components/ui/Icons';

interface UserSearchProps {
  query:         string;
  onQueryChange: (q: string) => void;
  results:       SearchUser[];
  currentUser:   AuthUser | null;
  onSendRequest: (targetUid: string) => void;
  onStartChat:   (targetUid: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({
  query,
  onQueryChange,
  results,
  currentUser,
  onSendRequest,
  onStartChat,
}) => {
  const userInitials = currentUser?.username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <>
      <div className="panel-head">Find user</div>
      <div className="divider" />

      {/* Search input */}
      <div className="search-box">
        <SmallSearchIcon />
        <input
          type="text"
          placeholder="UID or Username"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Results */}
      <div className="search-results">
        {!query.trim() && (
          <div className="search-hint">
            Type a username or UID to find someone
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="search-hint">No users found</div>
        )}

        {results.map((u) => {
          if (u.uid === currentUser?.uid) return null; // never show self

          const initials = u.username?.slice(0, 2).toUpperCase() ?? '??';

          let actionBtn: React.ReactNode;
          if (u.connection_status === 'accepted') {
            actionBtn = (
              <button
                className="search-action-btn btn-new-chat"
                title="Start chat"
                onClick={() => onStartChat(u.uid)}
              >
                <ChatIcon width="13" height="13" />
              </button>
            );
          } else if (u.connection_status === 'pending') {
            actionBtn = (
              <button
                className="search-action-btn btn-add-friend"
                disabled
                title="Request sent"
              >
                <CheckIcon width="11" height="11" />
              </button>
            );
          } else {
            actionBtn = (
              <button
                className="search-action-btn btn-add-friend"
                title="Add friend"
                onClick={() => onSendRequest(u.uid)}
              >
                <PlusIcon width="13" height="13" />
              </button>
            );
          }

          return (
            <div key={u.uid} className="search-user-card">
              <Avatar initials={initials} gray style={{ fontSize: '10px' }} />
              <div className="search-user-info">
                <div className="contact-name">{u.username}</div>
                <div className="contact-preview">{u.uid}</div>
              </div>
              {actionBtn}
            </div>
          );
        })}
      </div>

      {/* User bar */}
      <div className="user-bar">
        <div className="user-bar-avatar">{userInitials}</div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="uname" title={currentUser?.username}>{currentUser?.username}</div>
          <div className="uid"   title={currentUser?.uid}>{currentUser?.uid}</div>
        </div>
      </div>
    </>
  );
};

export default UserSearch;
