"use server";

import { 
  getChatMessages, 
  saveChatMessage, 
  markChatAsRead, 
  getActiveConversations, 
  DbChatMessage,
  ChatConversation 
} from "@/lib/db";
import { ActionResponse } from "./auth";

/**
 * Server action to send a chat message
 */
export async function sendChatMessageAction(
  sessionId: string,
  senderRole: "customer" | "staff",
  senderName: string,
  text: string
): Promise<ActionResponse & { chatMessage?: DbChatMessage }> {
  try {
    if (!sessionId || !text.trim()) {
      return {
        success: false,
        message: "Thông tin tin nhắn không hợp lệ.",
      };
    }

    const chatMessage = await saveChatMessage({
      session_id: sessionId,
      sender_role: senderRole,
      sender_name: senderName,
      message_text: text.trim(),
      is_read: 0,
    });

    return {
      success: true,
      chatMessage,
    };
  } catch (error) {
    console.error("Error in sendChatMessageAction:", error);
    return {
      success: false,
      message: "Không thể gửi tin nhắn. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Server action to get chat messages for a session, and mark incoming messages as read
 */
export async function getChatMessagesAction(
  sessionId: string,
  viewerRole: "customer" | "staff"
): Promise<ActionResponse & { messages?: DbChatMessage[] }> {
  try {
    if (!sessionId) {
      return {
        success: false,
        message: "Session ID là bắt buộc.",
      };
    }

    // Get messages
    const messages = await getChatMessages(sessionId);

    // If viewer is customer, mark staff messages as read.
    // If viewer is staff, mark customer messages as read.
    const senderRoleToMarkRead = viewerRole === "customer" ? "staff" : "customer";
    await markChatAsRead(sessionId, senderRoleToMarkRead);

    return {
      success: true,
      messages,
    };
  } catch (error) {
    console.error("Error in getChatMessagesAction:", error);
    return {
      success: false,
      message: "Không thể tải tin nhắn.",
    };
  }
}

/**
 * Server action to get all active chat conversations (staff/admin only)
 */
export async function getConversationsAction(): Promise<ActionResponse & { conversations?: ChatConversation[] }> {
  try {
    const conversations = await getActiveConversations();
    return {
      success: true,
      conversations,
    };
  } catch (error) {
    console.error("Error in getConversationsAction:", error);
    return {
      success: false,
      message: "Không thể tải danh sách hội thoại.",
    };
  }
}

/**
 * Server action to mark chat messages as read
 */
export async function markChatAsReadAction(
  sessionId: string,
  senderRole: "customer" | "staff"
): Promise<ActionResponse> {
  try {
    await markChatAsRead(sessionId, senderRole);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in markChatAsReadAction:", error);
    return {
      success: false,
    };
  }
}
