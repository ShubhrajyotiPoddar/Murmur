/**
 * ConversationList
 * Renders the "Messages" panel content:
 *   - Scrollable list of contacts (conversations + new friends)
 *   - User bar pinned at the bottom showing the logged-in user
 *
 * Receives a `combinedInbox` that merges conversations + friendsList so that
 * friends with no messages yet still appear with a "New friend" placeholder.
 */

import React from 'react';
import Avatar from '../../components/ui/Avatar';
import { Conversation } from '../../hooks/useFetchUsers';
import { AuthUser } from '../../store/authStore';

interface ConversationListProps {
  inbox:        Conversation[];
  selectedUid:  string | null;
  onOpenChat:   (conv: Conversation) => void;
  currentUser:  AuthUser | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
  inbox,
  selectedUid,
  onOpenChat,
  currentUser,
}) => {
  const userInitials = currentUser?.username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <>
      <div className="panel-head">Messages</div>
      <div className="divider" />

      <div className="contact-list">
        {inbox.length === 0 ? (
          <div className="search-hint" style={{ padding: '16px 10px' }}>
            No conversations yet
          </div>
        ) : (
          inbox.map((c) => {
            const initials  = c.other_username?.slice(0, 2).toUpperCase() ?? '??';
            const isActive  = c.other_uid === selectedUid;
            const preview   = c.last_message_deleted
              ? '🚫 Message deleted'
              : (c.last_message ?? 'No messages yet');

            return (
              <div
                key={c.other_uid}
                className={`contact${isActive ? ' active' : ''}`}
                onClick={() => onOpenChat(c)}
              >
                <Avatar initials={initials} gray={c.isNewFriend} />
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div className="contact-name" title={c.other_username}>
                    {c.other_username}
                  </div>
                  <div className="contact-preview" title={preview}>
                    {preview}
                  </div>
                </div>
              </div>
            );
          })
        )}
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

export default ConversationList;
