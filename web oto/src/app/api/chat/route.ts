import { NextResponse } from "next/server";
import { getMeAction } from "@/lib/actions/auth";
import { getPool } from "@/lib/db";
import { getOrCreateChatSession } from "@/services/database/chat.repository";
import { generateAiChatResponse } from "@/services/ai/gemini";

export async function POST(request: Request) {
  try {
    const { sessionId, message } = await request.json();

    if (!sessionId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Thiếu sessionId hoặc tin nhắn." },
        { status: 400 }
      );
    }

    // 1. Check if user is logged in
    const meRes = await getMeAction();
    const user = meRes?.success ? meRes.user : null;
    const userId = user?.id || null;

    // Ensure session exists in database
    await getOrCreateChatSession(sessionId, userId);

    // 2. Fetch personalization data if user exists
    let personalData: any = undefined;
    if (user) {
      const pool = getPool();
      
      // A. Fetch appointments
      const [aptRows] = await pool.query(
        `SELECT a.*, car.title as car_title 
         FROM appointments a 
         LEFT JOIN cars car ON a.car_id = car.id 
         JOIN customers cust ON a.customer_id = cust.id
         WHERE cust.user_id = ? OR cust.email = ? OR cust.phone = ?;`,
        [user.id, user.email, user.phone]
      );

      // B. Fetch loan simulations
      const [loanRows] = await pool.query(
        `SELECT l.*, c.title as car_name 
         FROM loan_simulations l 
         LEFT JOIN cars c ON l.car_id = c.id 
         WHERE l.email = ? OR l.phone = ?;`,
        [user.email, user.phone]
      );

      personalData = {
        appointments: aptRows as any[],
        loanSimulations: loanRows as any[],
      };
    }

    // 3. Generate response using Gemini + Local Tools
    const result = await generateAiChatResponse(sessionId, message, personalData);

    return NextResponse.json({
      success: true,
      text: result.text,
      executedTools: result.executedTools,
    });

  } catch (err: any) {
    console.error("API Chat route error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Lỗi máy chủ nội bộ." },
      { status: 500 }
    );
  }
}
