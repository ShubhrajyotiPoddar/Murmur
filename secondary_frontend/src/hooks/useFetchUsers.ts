import { useState, useCallback } from 'react';
import api from '../api/api';

export interface Conversation {
  conversation_id: number | null;
  other_uid: string;
  other_username: string;
  last_message: string | null;
  last_message_deleted: boolean;
  unread_count: number;
  isOnline?: boolean;
  isNewFriend?: boolean;
}

export interface Friend {
  friend_uid: string;
  friend_username: string;
  isOnline?: boolean;
}

export interface PendingRequest {
  id: number;
  sender_uid: string;
  sender_username: string;
}

export interface SearchUser {
  uid: string;
  username: string;
  connection_status: 'accepted' | 'pending' | 'none' | null;
}

export interface AcceptedNotification {
  uid: string;
  username: string;
}

/**
 * useFetchUsers
 *
 * Centralises all server-state fetches:
 *   - inbox (conversations)
 *   - friends list
 *   - pending incoming requests
 *   - user search
 *
 * Returns both the raw state slices and the stable fetch callbacks so that
 * ChatPage can call them after WebSocket events update server state.
 */
export function useFetchUsers() {
  const [conversations,          setConversations]          = useState<Conversation[]>([]);
  const [friends,                setFriends]                = useState<Friend[]>([]);
  const [pendingRequests,        setPendingRequests]        = useState<PendingRequest[]>([]);
  const [acceptedNotifications,  setAcceptedNotifications]  = useState<AcceptedNotification[]>([]);
  const [searchResults,          setSearchResults]          = useState<SearchUser[]>([]);

  const fetchInbox = useCallback(async (): Promise<Conversation[]> => {
    try {
      const res = await api.get<{ conversations: Conversation[] }>('/messages/inbox');
      const fetched = res.data.conversations ?? [];
      setConversations(fetched);
      return fetched; // returned so callers can read fresh data without waiting for a re-render
    } catch { /* silently ignore — stale data is better than a crash */ }
    return [];
  }, []);

  const fetchFriends = useCallback(async (): Promise<Friend[]> => {
    try {
      const res = await api.get<{ friends: Friend[] }>('/users/friends');
      const fetched = res.data.friends ?? [];
      setFriends(fetched);
      return fetched; // returned so callers can inspect without reading stale state
    } catch {}
    return [];
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get<{ requests: PendingRequest[] }>('/requests/pending');
      setPendingRequests(res.data.requests ?? []);
    } catch {}
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.get<{ users: SearchUser[] }>(`/requests/search?query=${query}`);
      setSearchResults(res.data.users ?? []);
    } catch {}
  }, []);

  const dismissAcceptedNotification = useCallback((uid: string) => {
    setAcceptedNotifications((prev) => prev.filter((n) => n.uid !== uid));
  }, []);

  const pushAcceptedNotification = useCallback((notif: AcceptedNotification) => {
    setAcceptedNotifications((prev) => [...prev, notif]);
  }, []);

  return {
    // State
    conversations,
    friends,
    pendingRequests,
    acceptedNotifications,
    searchResults,
    // Actions
    fetchInbox,
    fetchFriends,
    fetchRequests,
    searchUsers,
    dismissAcceptedNotification,
    pushAcceptedNotification,
  };
}
