"use server";

import { getPool, ensureDbExists } from "@/lib/db";
import { getMeAction, ActionResponse } from "./auth";
import { revalidatePath } from "next/cache";

export interface DbNotification {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

/**
 * Fetch notifications scoped to the logged-in user
 */
export async function getNotificationsAction(): Promise<ActionResponse & { notifications?: DbNotification[]; unreadCount?: number }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const { role, id: currentUserId } = meRes.user;
    const pool = getPool();

    let query = "";
    const params: any[] = [];

    if (role === "admin") {
      // Admins see global notifications (user_id is NULL) and their specific notifications
      query = `
        SELECT * FROM notifications
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY created_at DESC
        LIMIT 30;
      `;
      params.push(currentUserId);
    } else {
      // Staff see only their specific notifications
      query = `
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 30;
      `;
      params.push(currentUserId);
    }

    const [rows] = await pool.query(query, params);
    const notifications = (rows as any[]).map((r) => ({
      ...r,
      created_at: r.created_at.toISOString(),
    }));

    const unreadCount = notifications.filter(n => n.is_read === 0).length;

    return { success: true, notifications, unreadCount };
  } catch (err) {
    console.error("Error getting notifications:", err);
    return { success: false, message: "Không thể lấy danh sách thông báo." };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationReadAction(id: string): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();
    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?;", [id]);

    revalidatePath("/admin");
    revalidatePath("/staff");
    return { success: true, message: "Đã đánh dấu đọc." };
  } catch (err) {
    console.error("Error marking notification read:", err);
    return { success: false, message: "Lỗi hệ thống." };
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsReadAction(): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const { role, id: currentUserId } = meRes.user;
    const pool = getPool();

    if (role === "admin") {
      await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id IS NULL OR user_id = ?;", [currentUserId]);
    } else {
      await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?;", [currentUserId]);
    }

    revalidatePath("/admin");
    revalidatePath("/staff");
    return { success: true, message: "Đã đọc tất cả." };
  } catch (err) {
    console.error("Error marking all notifications read:", err);
    return { success: false, message: "Lỗi hệ thống." };
  }
}
