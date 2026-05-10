/**
 * ChatArea
 * The right-hand column that occupies all remaining space.
 *
 * Orchestrates:
 *   - ChatHeader     (partner info)
 *   - MessageList    (scrollable history + upload progress)
 *   - ComposeBar     (text input, attach, send)
 *   - Empty state    (when no conversation is selected)
 *
 * Also owns:
 *   - Message-level state: activeMenuId, editingId, editValue
 *   - File-upload state: activeUploads[]
 *   - Auto-scroll on new messages
 *   - Click-outside handler to close dropdown menus
 *
 * API calls for send / edit / delete / upload / download are made here
 * so that ChatPage stays clean — it only passes the selectedChat object.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ComposeBar from './ComposeBar';
import { Message } from './MessageBubble';
import { EmptyChatIcon } from '../../components/ui/Icons';

export interface SelectedChat {
  conversation_id: number | null;
  other_uid:       string;
  other_username:  string;
  isOnline?:       boolean;
}

interface UploadingFile {
  id:         string;
  fileName:   string;
  progress:   number;
  controller: AbortController;
}

interface ChatAreaProps {
  selectedChat:     SelectedChat | null;
  /** Called after a new conversation_id is returned by the server */
  onConversationIdResolved: (otherUid: string, convId: number) => void;
  /** Called after send/delete/edit so the sidebar preview refreshes */
  onInboxRefresh: () => void;
  /** External messages pushed in by the WebSocket handler in ChatPage */
  messages:         Message[];
  setMessages:      React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedChat,
  onConversationIdResolved,
  onInboxRefresh,
  messages,
  setMessages,
}) => {
  const { user } = useAuthStore();

  /* ── Local UI state ── */
  const [newMessage,    setNewMessage]    = useState('');
  const [activeMenuId,  setActiveMenuId]  = useState<number | null>(null);
  const [editingId,     setEditingId]     = useState<number | null>(null);
  const [editValue,     setEditValue]     = useState('');
  const [activeUploads, setActiveUploads] = useState<UploadingFile[]>([]);

  /* ── Refs ── */
  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  // Keep a stable ref to selectedChat so async callbacks never read stale closure
  const selectedChatRef = useRef<SelectedChat | null>(null);

  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeUploads]);

  /* ── Click-outside to close dropdowns ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest?.('.msg-rel')) setActiveMenuId(null);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  /* ── Send text message ── */
  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !selectedChatRef.current || !user) return;

    const { other_uid, conversation_id } = selectedChatRef.current;

    try {
      const res = await api.post<{
        sentMessage: Message;
        conversationId: number;
      }>('/messages/send', { targetUid: other_uid, content: text });

      const sent: Message = { ...res.data.sentMessage, sender_uid: user.uid };

      // If this was the first message, persist the new conversation_id upward
      if (!conversation_id && res.data.conversationId) {
        onConversationIdResolved(other_uid, res.data.conversationId);
      }

      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      onInboxRefresh();
    } catch { /* network error — silently ignore */ }
  }, [newMessage, user, onConversationIdResolved, onInboxRefresh, setMessages]);

  /* ── Delete message ── */
  const handleDelete = useCallback(async (messageId: number) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, is_deleted: true } : m),
      );
      setActiveMenuId(null);
      onInboxRefresh();
    } catch {}
  }, [onInboxRefresh, setMessages]);

  /* ── Edit message ── */
  const handleStartEdit = useCallback((msg: Message) => {
    setEditingId(msg.id);
    setEditValue(msg.content ?? '');
  }, []);

  const handleEditSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editValue.trim() || editingId === null) return;
    try {
      const res = await api.patch<{ content: string }>(
        `/messages/${editingId}`,
        { content: editValue },
      );
      setMessages((prev) =>
        prev.map((m) => m.id === editingId ? { ...m, content: res.data.content } : m),
      );
      setEditingId(null);
      setEditValue('');
      onInboxRefresh();
    } catch {}
  }, [editValue, editingId, onInboxRefresh, setMessages]);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);

  /* ── File upload ── */
  const handleFileSelected = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    const chat = selectedChatRef.current;
    if (!file || !chat || !user) return;

    const uploadId   = `upload_${Date.now()}`;
    const controller = new AbortController();

    setActiveUploads((prev) => [
      ...prev,
      { id: uploadId, fileName: file.name, progress: 0, controller },
    ]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetUid', chat.other_uid);

    try {
      const res = await api.post<{
        sentMessage: Message;
        conversationId: number;
      }>('/messages/upload', formData, {
        signal: controller.signal,
        onUploadProgress: (p) => {
          const pct = Math.round((p.loaded * 100) / (p.total ?? file.size));
          setActiveUploads((prev) =>
            prev.map((u) => u.id === uploadId ? { ...u, progress: pct } : u),
          );
        },
      });

      const sent: Message = { ...res.data.sentMessage, sender_uid: user.uid };

      if (!chat.conversation_id && res.data.conversationId) {
        onConversationIdResolved(chat.other_uid, res.data.conversationId);
      }

      setMessages((prev) => [...prev, sent]);
      onInboxRefresh();
    } catch (err: unknown) {
      const isCancel =
        (err as { name?: string })?.name === 'CanceledError' ||
        (err as { name?: string })?.name === 'AbortError';
      if (!isCancel) alert('Upload failed');
    } finally {
      setActiveUploads((prev) => prev.filter((u) => u.id !== uploadId));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user, onConversationIdResolved, onInboxRefresh, setMessages]);

  const handleCancelUpload = useCallback((uploadId: string) => {
    setActiveUploads((prev) => {
      const upload = prev.find((u) => u.id === uploadId);
      upload?.controller.abort();
      return prev.filter((u) => u.id !== uploadId);
    });
  }, []);

  /* ── File download ── */
  const handleDownload = useCallback((messageId: number, originalName: string) => {
    api
      .get(`/messages/download/${messageId}`, { responseType: 'blob' })
      .then((res) => {
        const url  = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
        const link = document.createElement('a');
        link.href  = url;
        link.setAttribute('download', originalName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => alert('Download failed'));
  }, []);

  /* ── Render ── */
  if (!selectedChat) {
    return (
      <div className="chat-area">
        <div className="chat-empty-state">
          <EmptyChatIcon />
          <div className="ename">Murmur</div>
          <div className="esub">Select a conversation to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <ChatHeader
        username={selectedChat.other_username}
        isOnline={selectedChat.isOnline}
      />

      <MessageList
        messages={messages}
        currentUid={user?.uid ?? ''}
        activeMenuId={activeMenuId}
        onMenuToggle={setActiveMenuId}
        onStartEdit={handleStartEdit}
        onDelete={handleDelete}
        editingId={editingId}
        editValue={editValue}
        onEditChange={setEditValue}
        onEditSave={handleEditSave}
        onEditCancel={handleEditCancel}
        onDownload={handleDownload}
        activeUploads={activeUploads}
        onCancelUpload={handleCancelUpload}
        endRef={messagesEndRef}
      />

      <ComposeBar
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSend}
        onFileSelected={handleFileSelected}
        fileInputRef={fileInputRef}
      />
    </div>
  );
};

export default ChatArea;
