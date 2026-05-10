/**
 * MessageBubble
 * Renders a single message row in one of five states:
 *   1. Normal inbound text bubble   (.bubble.in)
 *   2. Normal outbound text bubble  (.bubble.out)  + 3-dot menu
 *   3. Deleted message tombstone    (.bubble-deleted)
 *   4. File attachment bubble       (.file-bubble)  + download button
 *   5. Inline edit form             (replaces the bubble while editing)
 *
 * The 3-dot menu button is opacity:0 by default and revealed by the
 * .msg-row.out:hover CSS rule — no JS involvement needed for visibility.
 */

import React from 'react';
import DropdownMenu from '../../components/ui/DropdownMenu';
import {
  ThreeDotsIcon,
  DeletedBubbleIcon,
  FileIcon,
  DownloadIcon,
} from '../../components/ui/Icons';

export interface Message {
  id:             number;
  sender_uid:     string;
  content:        string | null;
  type:           'text' | 'file';
  is_deleted:     boolean;
  created_at:     string;
  file_name?:     string | null;
  file_size?:     number | null;
  conversation_id?: number | null;
}

interface MessageBubbleProps {
  message:          Message;
  isOwn:            boolean;
  activeMenuId:     number | null;
  onMenuToggle:     (id: number | null) => void;
  onStartEdit:      (msg: Message) => void;
  onDelete:         (id: number) => void;
  editingId:        number | null;
  editValue:        string;
  onEditChange:     (val: string) => void;
  onEditSave:       (e: React.FormEvent) => void;
  onEditCancel:     () => void;
  onDownload:       (id: number, name: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message:      m,
  isOwn,
  activeMenuId,
  onMenuToggle,
  onStartEdit,
  onDelete,
  editingId,
  editValue,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDownload,
}) => {
  const time      = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isEditing = editingId === m.id;
  const menuOpen  = activeMenuId === m.id;

  const handleDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuToggle(menuOpen ? null : m.id);
  };

  /* ── Bubble content ── */
  let bubbleContent: React.ReactNode;

  if (isEditing) {
    bubbleContent = (
      <form className="edit-form" onSubmit={onEditSave}>
        <input
          className="edit-input"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Escape' && onEditCancel()}
        />
        <span className="edit-hint">Enter to save · Esc to cancel</span>
      </form>
    );
  } else if (m.is_deleted) {
    bubbleContent = (
      <div className="bubble-deleted">
        <DeletedBubbleIcon /> this message was deleted
      </div>
    );
  } else if (m.type === 'file') {
    const sizeMb = m.file_size ? (m.file_size / 1024 / 1024).toFixed(2) : '?';
    bubbleContent = (
      <div className="file-bubble">
        <div className="file-top">
          <div className="file-icon"><FileIcon /></div>
          <div>
            <div className="ftitle">{m.file_name ?? 'file'}</div>
            <div className="fsize">{sizeMb} MB</div>
          </div>
        </div>
        <button
          className="file-dl"
          onClick={() => onDownload(m.id, m.file_name ?? 'download')}
        >
          <DownloadIcon /> Download file
        </button>
      </div>
    );
  } else {
    bubbleContent = (
      <div className={`bubble ${isOwn ? 'out' : 'in'}`}>{m.content}</div>
    );
  }

  return (
    <div className={`msg-row ${isOwn ? 'out' : 'in'}`}>
      <div className={`msg-wrap ${isOwn ? 'out' : 'in'}`}>
        <div className={`msg-rel ${isOwn ? 'out' : ''}`}>

          {/* Inner row: dot-menu + bubble (reversed for outbound) */}
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '5px',
              justifyContent: isOwn ? 'flex-end' : 'flex-start',
            }}
          >
            {/* 3-dot menu button — only on own, non-deleted messages */}
            {isOwn && !m.is_deleted && !isEditing && (
              <button className="dot-menu-btn" onClick={handleDotClick}>
                <ThreeDotsIcon />
              </button>
            )}

            {bubbleContent}
          </div>

          {/* Context dropdown */}
          {isOwn && !m.is_deleted && !isEditing && (
            <DropdownMenu
              open={menuOpen}
              messageType={m.type}
              onEdit={() => { onStartEdit(m); onMenuToggle(null); }}
              onDelete={() => onDelete(m.id)}
            />
          )}

          {/* Timestamp */}
          <div className={`ts${isOwn ? ' r' : ''}`}>{time}</div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
