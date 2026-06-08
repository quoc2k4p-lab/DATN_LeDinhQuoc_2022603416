import crypto from "crypto";
import { getPool } from "@/lib/db";

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "model" | "system";
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string | null;
  session_id: string;
  created_at: string;
}

/**
 * Creates a new AI chat session or retrieves the existing one.
 */
export async function getOrCreateChatSession(sessionId: string, userId: string | null = null): Promise<ChatSession> {
  const pool = getPool();
  
  // Try to find existing session
  const [rows] = await pool.query(
    "SELECT * FROM ai_chat_sessions WHERE session_id = ? LIMIT 1;",
    [sessionId]
  );
  
  const sessions = rows as any[];
  if (sessions.length > 0) {
    // If user_id is provided but wasn't associated, update it
    if (userId && !sessions[0].user_id) {
      await pool.query(
        "UPDATE ai_chat_sessions SET user_id = ? WHERE session_id = ?;",
        [userId, sessionId]
      );
      sessions[0].user_id = userId;
    }
    return {
      ...sessions[0],
      created_at: sessions[0].created_at.toISOString(),
    };
  }

  // Create new session
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO ai_chat_sessions (id, user_id, session_id) VALUES (?, ?, ?);",
    [id, userId || null, sessionId]
  );

  return {
    id,
    user_id: userId,
    session_id: sessionId,
    created_at: new Date().toISOString(),
  };
}

/**
 * Adds an message to a chat session history.
 */
export async function addChatMessage(
  sessionId: string,
  role: "user" | "model" | "system",
  content: string
): Promise<ChatMessage> {
  const pool = getPool();
  const id = crypto.randomUUID();
  const now = new Date();

  await pool.query(
    "INSERT INTO ai_chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?);",
    [id, sessionId, role, content]
  );

  return {
    id,
    session_id: sessionId,
    role,
    content,
    created_at: now.toISOString(),
  };
}

/**
 * Retrieves all messages in a chat session.
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM ai_chat_messages WHERE session_id = ? ORDER BY created_at ASC;",
    [sessionId]
  );

  return (rows as any[]).map((r) => ({
    ...r,
    created_at: r.created_at.toISOString(),
  }));
}

/**
 * Clears the chat messages of a specific session.
 */
export async function clearChatHistory(sessionId: string): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM ai_chat_messages WHERE session_id = ?;", [sessionId]);
}
