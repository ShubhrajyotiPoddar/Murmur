/**
 * ComposeBar
 * Bottom strip of the chat area containing:
 *   - Attach button (triggers hidden file input)
 *   - Text input (Enter key also submits)
 *   - Send button
 *
 * The hidden file <input> is managed via a forwarded ref so ChatArea can
 * reset it after a successful upload without re-mounting this component.
 */

import React from 'react';
import { AttachIcon, SendIcon } from '../../components/ui/Icons';

interface ComposeBarProps {
  value:          string;
  onChange:       (val: string) => void;
  onSend:         (e: React.FormEvent) => void;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef:   React.RefObject<HTMLInputElement | null>;
}

const ComposeBar: React.FC<ComposeBarProps> = ({
  value,
  onChange,
  onSend,
  onFileSelected,
  fileInputRef,
}) => (
  <form className="compose" onSubmit={onSend}>
    {/* Hidden file picker */}
    <input
      ref={fileInputRef}
      type="file"
      style={{ display: 'none' }}
      onChange={onFileSelected}
    />

    <button
      type="button"
      className="attach-btn"
      title="Attach file"
      onClick={() => fileInputRef.current?.click()}
    >
      <AttachIcon />
    </button>

    <input
      className="compose-input"
      type="text"
      placeholder="Type a message…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
    />

    <button type="submit" className="send-btn" title="Send">
      <SendIcon />
    </button>
  </form>
);

export default ComposeBar;
