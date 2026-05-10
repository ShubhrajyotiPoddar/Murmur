/**
 * MessageList
 * Scrollable container that renders all MessageBubble instances plus any
 * in-progress file upload progress indicators.
 * A sentinel div at the bottom is used for auto-scroll via useEffect in ChatArea.
 */

import React from 'react';
import MessageBubble, { Message } from './MessageBubble';
import { FileIcon } from '../../components/ui/Icons';

interface UploadingFile {
  id:         string;
  fileName:   string;
  progress:   number;
  controller: AbortController;
}

interface MessageListProps {
  messages:      Message[];
  currentUid:    string;
  activeMenuId:  number | null;
  onMenuToggle:  (id: number | null) => void;
  onStartEdit:   (msg: Message) => void;
  onDelete:      (id: number) => void;
  editingId:     number | null;
  editValue:     string;
  onEditChange:  (val: string) => void;
  onEditSave:    (e: React.FormEvent) => void;
  onEditCancel:  () => void;
  onDownload:    (id: number, name: string) => void;
  activeUploads: UploadingFile[];
  onCancelUpload:(id: string) => void;
  endRef:        React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUid,
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
  activeUploads,
  onCancelUpload,
  endRef,
}) => (
  <div className="messages" onClick={() => onMenuToggle(null)}>
    {messages.map((m) => (
      <MessageBubble
        key={m.id}
        message={m}
        isOwn={m.sender_uid === currentUid}
        activeMenuId={activeMenuId}
        onMenuToggle={onMenuToggle}
        onStartEdit={onStartEdit}
        onDelete={onDelete}
        editingId={editingId}
        editValue={editValue}
        onEditChange={onEditChange}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
        onDownload={onDownload}
      />
    ))}

    {/* In-progress uploads rendered as placeholder bubbles */}
    {activeUploads.map((u) => (
      <div key={u.id} className="msg-row out">
        <div className="msg-wrap out">
          <div className="msg-rel out">
            <div className="file-bubble">
              <div className="file-top">
                <div className="file-icon"><FileIcon /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="ftitle">{u.fileName}</div>
                  <div className="upload-container">
                    <div className="progress-bg">
                      <div
                        className="progress-fill"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                    <div className="upload-actions">
                      <span>{u.progress}% uploading…</span>
                      <button
                        className="cancel-btn"
                        onClick={() => onCancelUpload(u.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}

    {/* Auto-scroll sentinel */}
    <div ref={endRef} />
  </div>
);

export default MessageList;
