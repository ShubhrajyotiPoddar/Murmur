/**
 * DropdownMenu
 * The 3-dot context menu that appears on outbound message bubbles.
 * Renders absolutely positioned over the message row.
 * The `open` prop toggles the .open class (CSS controls display).
 * Calls stopPropagation internally so the click-outside handler in
 * ChatPage doesn't close it the same tick it opens.
 */

import React from 'react';
import { EditIcon, DeleteIcon } from './Icons';

interface DropdownMenuProps {
  open: boolean;
  messageType: 'text' | 'file';
  onEdit: () => void;
  onDelete: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  open,
  messageType,
  onEdit,
  onDelete,
}) => (
  <div
    className={`dropdown${open ? ' open' : ''}`}
    style={{ right: 0, top: '30px' }}
    onClick={(e) => e.stopPropagation()}
  >
    {messageType === 'text' && (
      <button className="dd-item" onClick={onEdit}>
        <EditIcon /> Edit
      </button>
    )}
    <button className="dd-item danger" onClick={onDelete}>
      <DeleteIcon /> Delete
    </button>
  </div>
);

export default DropdownMenu;
