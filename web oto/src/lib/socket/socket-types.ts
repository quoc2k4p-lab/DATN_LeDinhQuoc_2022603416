export interface UserPresence {
  userId: string;
  role: "customer" | "staff";
  name: string;
  isOnline: boolean;
}

export interface ChatMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: "customer" | "staff";
  message: string;
  isRead: number;
  sentAt: string;
}

export interface TypingIndicatorPayload {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ReadReceiptPayload {
  conversationId: string;
  userId: string;
  readAt: string;
}
