/**
 * ChatPage — top-level orchestrator for the authenticated shell.
 *
 * Responsibilities:
 *  1. Fetch and hold all server-state slices via useFetchUsers
 *  2. Open + manage the WebSocket via useChatSocket
 *  3. Handle WS events: new_message, message_deleted, message_updated,
 *     new_connection_request, connection_response
 *  4. Maintain:
 *       - activeTab      (chat | pending | search)
 *       - selectedChat   (currently open conversation)
 *       - messages       (messages for the open conversation)
 *       - searchQuery    (controlled input for user search)
 *  5. Expose callbacks to child components (openChat, startChatWithUser,
 *     sendRequest, respondRequest, searchUsers)
 *  6. Compose AppLayout ← NavRail + Sidebar (3 panels) + ChatArea
 *
 * No JSX beyond glue — every visual detail lives in the feature/layout
 * components it assembles here.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

import api from '../api/api';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useChatSocket } from '../hooks/useChatSocket';
import {
  useFetchUsers,
  Conversation,
} from '../hooks/useFetchUsers';

import AppLayout     from '../layouts/AppLayout';
import NavRail, { NavTab } from '../layouts/NavRail';
import Sidebar       from '../layouts/Sidebar';

import ConversationList from '../features/sidebar/ConversationList';
import PendingRequests  from '../features/sidebar/PendingRequests';
import UserSearch       from '../features/sidebar/UserSearch';
import ChatArea, { SelectedChat } from '../features/chat/ChatArea';
import { Message } from '../features/chat/MessageBubble';

const ChatPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const { logout }      = useAuth();

  /* ── Server state ── */
  const {
    conversations,
    friends,
    pendingRequests,
    acceptedNotifications,
    searchResults,
    fetchInbox,
    fetchFriends,
    fetchRequests,
    searchUsers,
    dismissAcceptedNotification,
    pushAcceptedNotification,
  } = useFetchUsers();

  /* ── UI state ── */
  const [activeTab,     setActiveTab]     = useState<NavTab>('chat');
  const [selectedChat,  setSelectedChat]  = useState<SelectedChat | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [searchQuery,   setSearchQuery]   = useState('');

  // Stable ref so WS handler closure reads the live selectedChat
  const selectedChatRef = useRef<SelectedChat | null>(null);
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  /* ── Initial data load ── */
  useEffect(() => {
    void fetchInbox();
    void fetchFriends();
    void fetchRequests();
  }, [fetchInbox, fetchFriends, fetchRequests]);

  /* ── WebSocket event handlers ── */
  const wsHandlers = useMemo(() => ({
    new_message: (payload: Record<string, unknown>) => {
      const current = selectedChatRef.current;
      // Check if the incoming message belongs to the currently open chat
      const isCurrentConv =
        current &&
        (
          (payload.conversation_id &&
            String(payload.conversation_id) === String(current.conversation_id)) ||
          (!current.conversation_id &&
            payload.sender_uid === current.other_uid)
        );

      if (isCurrentConv) {
        setMessages((prev) => [...prev, payload as unknown as Message]);
        // Resolve conversation_id for a first-ever message
        if (!current.conversation_id && payload.conversation_id) {
          setSelectedChat((s) =>
            s ? { ...s, conversation_id: payload.conversation_id as number } : s,
          );
        }
      }
      void fetchInbox();
    },

    message_deleted: (payload: Record<string, unknown>) => {
      const current = selectedChatRef.current;
      if (
        current &&
        String(payload.conversation_id) === String(current.conversation_id)
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === (payload.id as number) ? { ...m, is_deleted: true } : m,
          ),
        );
      }
      void fetchInbox();
    },

    message_updated: (payload: Record<string, unknown>) => {
      const current = selectedChatRef.current;
      if (
        current &&
        String(payload.conversation_id) === String(current.conversation_id)
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === (payload.id as number)
              ? { ...m, content: payload.content as string }
              : m,
          ),
        );
      }
      void fetchInbox();
    },

    new_connection_request: () => {
      void fetchRequests();
    },

    connection_response: (payload: Record<string, unknown>) => {
      void fetchInbox();
      void fetchRequests();

      if (payload.status === 'accepted') {
        // ─── Backend payload shape (from primary_backend/src/routes/requests.ts):
        //   { requestId, status: 'accepted', responderUsername }
        // There is NO uid field — only the responder's username is sent.
        // Strategy: await a fresh friends fetch (the responder is now a friend),
        // then match by username to extract the real UID.
        const responderUsername =
          (payload.responderUsername as string) ??
          (payload.username as string) ??
          '';

        void (async () => {
          const freshFriends = await fetchFriends(); // also updates friends state
          const match = freshFriends.find(
            (f) => f.friend_username === responderUsername,
          );

          if (!match?.friend_uid) {
            console.error(
              '[WS connection_response] Could not resolve UID for responder:',
              responderUsername,
              '| full payload:', payload,
              '| fresh friends list:', freshFriends,
            );
            return;
          }

          pushAcceptedNotification({
            uid:      match.friend_uid,
            username: responderUsername,
          });
        })();
      } else {
        // Rejected — just refresh friends (no notification card needed)
        void fetchFriends();
      }
    },
  }), [
    fetchInbox,
    fetchRequests,
    fetchFriends,
    pushAcceptedNotification,
  ]);

  useChatSocket(token, wsHandlers);

  /* ── Merged inbox (conversations + friends without messages) ── */
  const combinedInbox = useMemo<Conversation[]>(() => {
    const list = [...conversations];
    friends.forEach((f) => {
      const alreadyPresent = conversations.some(
        (c) => c.other_uid === f.friend_uid,
      );
      if (!alreadyPresent) {
        list.push({
          conversation_id:      null,
          other_uid:            f.friend_uid,
          other_username:       f.friend_username,
          last_message:         'New friend',
          last_message_deleted: false,
          unread_count:         0,
          isOnline:             f.isOnline,
          isNewFriend:          true,
        });
      }
    });
    return list;
  }, [conversations, friends]);

  /* ── Open a conversation ── */
  const openChat = useCallback(async (conv: Conversation) => {
    const chatToOpen: SelectedChat = {
      conversation_id: conv.conversation_id,
      other_uid:       conv.other_uid,
      other_username:  conv.other_username,
      isOnline:        conv.isOnline,  // already derived by /messages/inbox ✓
    };

    // Sync the ref NOW — before any await — so WS messages that arrive
    // during the message fetch are matched against the correct conversation
    // instead of the stale (previous) selectedChat.
    selectedChatRef.current = chatToOpen;
    setSelectedChat(chatToOpen);
    setMessages([]); // immediately clear stale messages from previous chat

    if (conv.conversation_id) {
      try {
        const res = await api.get<{ messages: Message[] }>(
          `/messages/${conv.conversation_id}`,
        );
        setMessages((res.data.messages ?? []).slice().reverse());
      } catch {
        setMessages([]);
      }
    }
    // else: conversation has no messages yet — already set to [] above
  }, [setMessages]);

  /* ── Start a chat by UID (from search / accepted notif) ── */
  const startChatWithUser = useCallback(async (targetUid: string) => {
    // Clear stale messages immediately so the UI never shows a previous
    // conversation's messages while the new one is initialising.
    setMessages([]);

    try {
      // Step 1 — create/find the conversation.
      const convRes = await api.post<{
        conversation_id: number;
        other_uid:        string;
        other_username:   string;
      }>('/messages/conversation', { targetUid });

      // Step 2 — refresh inbox AND friends list in parallel.
      //
      // We need BOTH because:
      //   • Inbox  (/messages/inbox)  enriches with isOnline, but only lists
      //     conversations that already have at least one message.
      //     A brand-new friend (zero messages) will NOT appear here.
      //   • Friends (/users/friends) enriches with isOnline for every accepted
      //     friend, including ones with no messages yet.
      //
      // Priority: inbox entry (most specific) → friends entry (fallback) → false.
      const [freshInbox, freshFriends] = await Promise.all([
        fetchInbox(),    // also updates conversations state
        fetchFriends(),  // also updates friends state
      ]);

      const inboxEntry  = freshInbox.find((c) => c.other_uid  === targetUid);
      const friendEntry = freshFriends.find((f) => f.friend_uid === targetUid);
      const isOnline    = inboxEntry?.isOnline ?? friendEntry?.isOnline ?? false;

      const newChat: SelectedChat = {
        conversation_id: convRes.data.conversation_id,
        other_uid:       convRes.data.other_uid,
        other_username:  convRes.data.other_username,
        isOnline,
      };

      // Sync the ref BEFORE the next await so that any WS new_message events
      // arriving while we fetch history are matched against the correct chat.
      selectedChatRef.current = newChat;
      setSelectedChat(newChat);
      setActiveTab('chat');

      try {
        const msgRes = await api.get<{ messages: Message[] }>(
          `/messages/${convRes.data.conversation_id}`,
        );
        setMessages((msgRes.data.messages ?? []).slice().reverse());
      } catch {
        setMessages([]);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Could not start chat';
      alert(msg);
    }
  }, [fetchInbox, fetchFriends, setMessages]);

  /* ── Send friend request ── */
  const sendRequest = useCallback(async (targetUid: string) => {
    try {
      await api.post('/requests/request', { targetUid });
      void searchUsers(searchQuery);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Failed to send request';
      alert(msg);
    }
  }, [searchQuery, searchUsers]);

  /* ── Respond to friend request ── */
  const respondRequest = useCallback(
    async (requestId: number, status: 'accepted' | 'rejected') => {
      try {
        await api.patch('/requests/respond', { requestId, status });
        void fetchRequests();
        void fetchInbox();
        void fetchFriends();
      } catch {}
    },
    [fetchRequests, fetchInbox, fetchFriends],
  );

  /* ── Search handler (debounce not needed at this scale) ── */
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    void searchUsers(q);
  }, [searchUsers]);

  /* ── Propagate resolved conversation_id back into selectedChat ── */
  const handleConversationIdResolved = useCallback(
    (otherUid: string, convId: number) => {
      setSelectedChat((prev) => {
        if (prev && prev.other_uid === otherUid) {
          return { ...prev, conversation_id: convId };
        }
        return prev;
      });
    },
    [],
  );

  /* ── Badge visibility ── */
  const hasPending =
    pendingRequests.length > 0 || acceptedNotifications.length > 0;

  /* ── Compose the layout ── */
  return (
    <AppLayout
      navRail={
        <NavRail
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={logout}
          hasPending={hasPending}
        />
      }

      sidebar={
        <Sidebar
          activeTab={activeTab}

          chatPanel={
            <ConversationList
              inbox={combinedInbox}
              selectedUid={selectedChat?.other_uid ?? null}
              onOpenChat={openChat}
              currentUser={user}
            />
          }

          pendingPanel={
            <PendingRequests
              pendingRequests={pendingRequests}
              acceptedNotifications={acceptedNotifications}
              currentUser={user}
              onRespond={respondRequest}
              onStartChat={startChatWithUser}
              onDismissAccepted={dismissAcceptedNotification}
            />
          }

          searchPanel={
            <UserSearch
              query={searchQuery}
              onQueryChange={handleSearchChange}
              results={searchResults}
              currentUser={user}
              onSendRequest={sendRequest}
              onStartChat={startChatWithUser}
            />
          }
        />
      }

      chatArea={
        <ChatArea
          selectedChat={selectedChat}
          messages={messages}
          setMessages={setMessages}
          onConversationIdResolved={handleConversationIdResolved}
          onInboxRefresh={fetchInbox}
        />
      }
    />
  );
};

export default ChatPage;
