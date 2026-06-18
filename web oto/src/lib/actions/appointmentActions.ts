"use server";

import { getPool } from "@/lib/db";

/**
 * Get booked slot counts for a specific date.
 * Returns an object like { "8": 2, "10": 1, "14": 3 }
 * meaning 2 bookings at 08:xx, 1 at 10:xx, 3 at 14:xx, etc.
 */
export async function getAvailableSlotsAction(
  dateStr: string
): Promise<{ success: boolean; slots?: Record<string, number>; message?: string }> {
  try {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { success: false, message: "Ngày không hợp lệ." };
    }

    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT HOUR(appointment_date) as slot_hour, COUNT(*) as cnt
       FROM appointments
       WHERE DATE(appointment_date) = ?
         AND status != 'cancelled'
       GROUP BY HOUR(appointment_date);`,
      [dateStr]
    );

    const slotCounts: Record<string, number> = {};
    for (const row of rows as any[]) {
      slotCounts[String(row.slot_hour)] = Number(row.cnt);
    }

    return { success: true, slots: slotCounts };
  } catch (error) {
    console.error("Error in getAvailableSlotsAction:", error);
    return { success: false, message: "Không thể lấy thông tin slot." };
  }
}
