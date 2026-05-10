/**
 * ChatHeader
 * Top bar of the chat area showing the partner's avatar, name, and online status.
 * Purely presentational — receives everything it needs as props.
 */

import React from 'react';

interface ChatHeaderProps {
  username:  string;
  isOnline?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ username, isOnline }) => {
  const initials = username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="chat-header">
      <div className="chat-header-avatar">{initials}</div>
      <div>
        <div className="hname">{username}</div>
        <div className="hstatus">{isOnline ? 'online' : 'offline'}</div>
      </div>
    </div>
  );
};

export default ChatHeader;
