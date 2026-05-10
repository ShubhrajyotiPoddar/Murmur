/**
 * PendingRequests
 * Renders the "Requests" panel content:
 *   - Empty state when there is nothing to show
 *   - Accepted-friend notification cards (green) with "Start Conversation"
 *   - Incoming friend-request cards with Accept / Decline buttons
 *   - User bar pinned at the bottom
 */

import React from 'react';
import { PendingRequest, AcceptedNotification } from '../../hooks/useFetchUsers';
import { AuthUser } from '../../store/authStore';
import { EmptyPendingIcon, CheckIcon, ChatIcon } from '../../components/ui/Icons';

interface PendingRequestsProps {
  pendingRequests:       PendingRequest[];
  acceptedNotifications: AcceptedNotification[];
  currentUser:           AuthUser | null;
  onRespond:             (requestId: number, status: 'accepted' | 'rejected') => void;
  onStartChat:           (uid: string) => void;
  onDismissAccepted:     (uid: string) => void;
}

/* ── Accepted-friend notification card ── */
const AcceptedCard: React.FC<{
  notif:       AcceptedNotification;
  onStartChat: (uid: string) => void;
  onDismiss:   (uid: string) => void;
}> = ({ notif, onStartChat, onDismiss }) => {
  const initials = notif.username?.slice(0, 2).toUpperCase() ?? '??';

  const handleStart = () => {
    if (!notif.uid) {
      console.error('[AcceptedCard] Missing uid on notification object:', notif);
      return;
    }
    onDismiss(notif.uid);
    onStartChat(notif.uid);
  };

  return (
    <div className="accepted-card">
      <div className="accepted-top">
        <div className="accepted-avatar">{initials}</div>
        <div>
          <div className="accepted-label">
            <CheckIcon /> Friend request accepted
          </div>
          <div className="accepted-name">{notif.username}</div>
          <div className="accepted-uid">{notif.uid}&nbsp;&middot;&nbsp;recently</div>
        </div>
      </div>
      <button className="btn-start-convo" onClick={handleStart}>
        <ChatIcon width="11" height="11" /> Start Conversation
      </button>
    </div>
  );
};

/* ── Incoming request card ── */
const RequestCard: React.FC<{
  req:      PendingRequest;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ req, onAccept, onDecline }) => {
  const initials = req.sender_username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="request-card">
      <div className="request-top">
        <div className="request-avatar">{initials}</div>
        <div>
          <div className="request-name">{req.sender_username}</div>
          <div className="request-uid">
            {req.sender_uid}&nbsp;&middot;&nbsp;incoming
          </div>
        </div>
      </div>
      <div className="request-actions">
        <button className="req-btn req-accept"  onClick={onAccept}>Accept</button>
        <button className="req-btn req-decline" onClick={onDecline}>Decline</button>
      </div>
    </div>
  );
};

/* ── Panel root ── */
const PendingRequests: React.FC<PendingRequestsProps> = ({
  pendingRequests,
  acceptedNotifications,
  currentUser,
  onRespond,
  onStartChat,
  onDismissAccepted,
}) => {
  const hasContent =
    pendingRequests.length > 0 || acceptedNotifications.length > 0;

  const userInitials = currentUser?.username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <>
      <div className="panel-head">Requests</div>
      <div className="divider" />

      {hasContent ? (
        <div className="pending-list">
          {acceptedNotifications.map((n) => (
            <AcceptedCard
              key={`acc-${n.uid}`}
              notif={n}
              onStartChat={onStartChat}
              onDismiss={onDismissAccepted}
            />
          ))}
          {pendingRequests.map((r) => (
            <RequestCard
              key={r.id}
              req={r}
              onAccept={() => onRespond(r.id, 'accepted')}
              onDecline={() => onRespond(r.id, 'rejected')}
            />
          ))}
        </div>
      ) : (
        <div className="pending-empty">
          <EmptyPendingIcon />
          No pending requests
        </div>
      )}

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

export default PendingRequests;
