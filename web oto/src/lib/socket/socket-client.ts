import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "./socket-events";
import { ChatMessagePayload, UserPresence, TypingIndicatorPayload, ReadReceiptPayload } from "./socket-types";

// Dynamic socket URL based on environment
const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // In dev: connect directly to port 3001 of the active host (localhost, 127.0.0.1, or local IP)
    if (process.env.NODE_ENV !== "production") {
      return `${protocol}//${hostname}:3001`;
    }
    // In production: use Nginx reverse proxy under same origin
    return window.location.origin;
  }
  return "http://localhost:3001";
};

let socketInstance: Socket | null = null;

interface InitSocketOptions {
  token?: string;
  sessionId?: string;
  name?: string;
}

export function getSocket(options?: InitSocketOptions): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  // If no auth options are provided, or both token and sessionId are missing, do not initialize
  if (!options || (!options.token && !options.sessionId)) {
    return null;
  }

  const url = getSocketUrl();

  // If instance exists, return it. Do not mutate auth or reconnect here to avoid react render phase side effects.
  if (socketInstance) {
    return socketInstance;
  }

  // Create new socket instance
  socketInstance = io(url, {
    auth: {
      token: options.token,
      sessionId: options.sessionId,
      name: options.name,
    },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return socketInstance;
}

// Helper to update socket authentication properties outside React hook context
function updateSocketAuth(socket: Socket, options: InitSocketOptions) {
  socket.auth = {
    token: options.token,
    sessionId: options.sessionId,
    name: options.name,
  };
  socket.disconnect().connect();
}

export function useSocket(options?: InitSocketOptions) {
  const socket = typeof window !== "undefined" ? getSocket(options) : null;
  const [isConnected, setIsConnected] = useState(socket ? socket.connected : false);

  useEffect(() => {
    if (!socket) return;

    // Detect if options changed from what is currently on the socket.auth and update
    const auth = socket.auth as Record<string, unknown>;
    if (options) {
      if (
        options.token !== auth.token ||
        options.sessionId !== auth.sessionId ||
        options.name !== auth.name
      ) {
        updateSocketAuth(socket, options);
      }
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      setTimeout(() => {
        setIsConnected(true);
      }, 0);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, options?.token, options?.sessionId, options?.name]);

  return {
    socket,
    isConnected,
  };
}

export function useChatSocket(
  conversationId: string | null,
  options?: InitSocketOptions
) {
  const { socket, isConnected } = useSocket(options);
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});

  useEffect(() => {
    if (!socket || !conversationId) return;

    // Explicitly join the room
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, conversationId);

    // Track active presence updates
    const handleUserOnline = (presence: UserPresence) => {
      setOnlineUsers((prev) => ({ ...prev, [presence.userId]: presence }));
    };

    const handleUserOffline = (presence: UserPresence) => {
      setOnlineUsers((prev) => ({ ...prev, [presence.userId]: presence }));
    };

    const handleReceiveMessage = (msg: ChatMessagePayload) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTypingStart = (payload: TypingIndicatorPayload) => {
      if (payload.conversationId === conversationId) {
        setTypingUsers((prev) => ({ ...prev, [payload.userId]: payload.userName }));
      }
    };

    const handleTypingStop = (payload: TypingIndicatorPayload) => {
      if (payload.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        });
      }
    };

    const handleMessageRead = (payload: ReadReceiptPayload) => {
      if (payload.conversationId === conversationId) {
        // Update read receipt status in state
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId !== payload.userId ? { ...m, isRead: 1 } : m
          )
        );
      }
    };

    socket.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, conversationId);
      socket.off(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback((messageText: string) => {
    if (!socket || !isConnected || !conversationId || !messageText.trim()) return;
    socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      conversationId,
      message: messageText,
    });
  }, [socket, isConnected, conversationId]);

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!socket || !isConnected || !conversationId) return;
    const event = isTyping ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP;
    socket.emit(event, conversationId);
  }, [socket, isConnected, conversationId]);

  const emitReadReceipt = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;
    socket.emit(SOCKET_EVENTS.MESSAGE_READ, conversationId);
  }, [socket, isConnected, conversationId]);

  return {
    socket,
    isConnected,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    sendMessage,
    emitTyping,
    emitReadReceipt,
  };
}
