"use server";

import { clearChatHistory } from "@/services/database/chat.repository";
import { 
  getActiveConversations, 
  getChatMessages, 
  saveChatMessage, 
  markChatAsRead 
} from "@/lib/db";
import { cookies } from "next/headers";

export async function getSocketTokenAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tq_auto_session")?.value;
    return { success: true, token };
  } catch (err) {
    console.error("Error fetching socket token:", err);
    return { success: false };
  }
}


export async function clearChatHistoryAction(sessionId: string) {
  try {
    await clearChatHistory(sessionId);
    return { success: true };
  } catch (err: any) {
    console.error("Error clearing chat history:", err);
    return { success: false, message: "Không thể xóa lịch sử cuộc trò chuyện." };
  }
}

export async function getConversationsAction() {
  try {
    const conversations = await getActiveConversations();
    return { success: true, conversations };
  } catch (err: any) {
    console.error("Error getting active conversations:", err);
    return { success: false, message: "Lỗi tải danh sách hội thoại." };
  }
}

export async function getChatMessagesAction(sessionId: string, viewerRole: "customer" | "staff") {
  try {
    const messages = await getChatMessages(sessionId);
    // Mark counterpart's messages as read
    const counterpartRole = viewerRole === "staff" ? "customer" : "staff";
    await markChatAsRead(sessionId, counterpartRole);
    return { success: true, messages };
  } catch (err: any) {
    console.error("Error getting messages:", err);
    return { success: false, message: "Lỗi tải tin nhắn." };
  }
}

export async function sendChatMessageAction(
  sessionId: string,
  senderRole: "customer" | "staff",
  senderName: string,
  messageText: string
) {
  try {
    const chatMessage = await saveChatMessage({
      session_id: sessionId,
      sender_role: senderRole,
      sender_name: senderName,
      message_text: messageText,
      is_read: 0
    });
    return { success: true, chatMessage };
  } catch (err: any) {
    console.error("Error sending message:", err);
    return { success: false, message: "Lỗi gửi tin nhắn." };
  }
}
