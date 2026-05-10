import { useEffect, useRef } from 'react';

export type WsEventName =
  | 'new_message'
  | 'message_deleted'
  | 'message_updated'
  | 'new_connection_request'
  | 'connection_response';

export type WsHandler = (payload: Record<string, unknown>) => void;

/**
 * useChatSocket
 *
 * Manages the single WebSocket connection for the authenticated session.
 * Dispatches typed events to the caller via the `handlers` map so that
 * ChatPage can react to real-time events without this hook knowing anything
 * about UI state.
 *
 * The socket is opened once when `token` is available and closed when the
 * component unmounts (or the user logs out).
 */
export function useChatSocket(
  token: string | null,
  handlers: Partial<Record<WsEventName, WsHandler>>,
) {
  const socketRef  = useRef<WebSocket | null>(null);
  // Keep handlers in a ref so the onmessage closure is never stale
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!token) return;

    const wsBase = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const ws     = new WebSocket(`${wsBase}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.info('[WS] connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: { event: WsEventName; payload: Record<string, unknown> } =
          JSON.parse(event.data as string);
        const handler = handlersRef.current[data.event];
        if (handler) handler(data.payload);
      } catch {
        // Ignore malformed frames
      }
    };

    ws.onerror = (e) => {
      console.warn('[WS] error', e);
    };

    ws.onclose = () => {
      console.info('[WS] disconnected');
    };

    return () => {
      ws.close();
    };
  }, [token]);

  return socketRef;
}
