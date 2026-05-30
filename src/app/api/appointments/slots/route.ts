import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const dateStr = req.nextUrl.searchParams.get("date");

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { success: false, message: "Thiếu hoặc sai tham số date (YYYY-MM-DD)." },
        { status: 400 }
      );
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

    const slots: Record<string, number> = {};
    for (const row of rows as any[]) {
      slots[String(row.slot_hour)] = Number(row.cnt);
    }

    return NextResponse.json({ success: true, slots });
  } catch (error) {
    console.error("Error fetching appointment slots:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống." },
      { status: 500 }
    );
  }
}
