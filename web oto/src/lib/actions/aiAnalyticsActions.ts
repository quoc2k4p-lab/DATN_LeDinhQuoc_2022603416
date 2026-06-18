"use server";

import { getPool, ensureDbExists } from "@/lib/db";
import { getMeAction, ActionResponse } from "./auth";

export interface AiAnalyticsData {
  totalChats: number;
  totalLeads: number;
  conversionRate: number;
  topCarsAsked: Array<{ carName: string; count: number }>;
  topCarsRecommended: Array<{ carName: string; score: number }>;
  latestLeads: Array<{ name: string; phone: string; email: string; stage: string; created_at: string }>;
}

export async function getAiAssistantAnalyticsAction(): Promise<ActionResponse & { analytics?: AiAnalyticsData }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Bạn cần đăng nhập để xem thông tin này." };
    }

    const pool = getPool();

    // 1. Total chat sessions
    const [chatsRes] = await pool.query("SELECT COUNT(*) as count FROM ai_chat_sessions;");
    const totalChats = (chatsRes as any)[0]?.count || 0;

    // 2. Total leads from AI Chatbot
    const [leadsRes] = await pool.query("SELECT COUNT(*) as count FROM customers WHERE source = 'AI_CHATBOT';");
    const totalLeads = (leadsRes as any)[0]?.count || 0;

    // 3. Purchased AI leads for conversion rate
    const [purchasedRes] = await pool.query("SELECT COUNT(*) as count FROM customers WHERE source = 'AI_CHATBOT' AND stage = 'purchased';");
    const purchasedLeads = (purchasedRes as any)[0]?.count || 0;
    const conversionRate = totalLeads > 0 ? Math.round((purchasedLeads / totalLeads) * 100) : 0;

    // 4. Top cars asked (interested cars of AI leads)
    const [topAskedRes] = await pool.query(`
      SELECT c.title as carName, COUNT(cust.id) as count 
      FROM customers cust
      JOIN cars c ON cust.interested_car_id = c.id
      WHERE cust.source = 'AI_CHATBOT'
      GROUP BY c.id, c.title
      ORDER BY count DESC
      LIMIT 5;
    `);
    const topCarsAsked = topAskedRes as any[];

    // 5. Top cars recommended (querying based on high scoring profiles in DB)
    const [topRecRes] = await pool.query(`
      SELECT title as carName, ROUND((economy_score + safety_score + technology_score + comfort_score + family_score) / 5) as score
      FROM cars
      ORDER BY score DESC
      LIMIT 5;
    `);
    const topCarsRecommended = topRecRes as any[];

    // 6. Latest AI Leads
    const [latestLeadsRes] = await pool.query(`
      SELECT full_name as name, phone, email, stage, created_at
      FROM customers
      WHERE source = 'AI_CHATBOT'
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    const latestLeads = (latestLeadsRes as any[]).map(r => ({
      ...r,
      created_at: r.created_at.toISOString()
    }));

    return {
      success: true,
      analytics: {
        totalChats,
        totalLeads,
        conversionRate,
        topCarsAsked,
        topCarsRecommended,
        latestLeads
      }
    };
  } catch (err: any) {
    console.error("Error fetching AI analytics:", err);
    return { success: false, message: "Lỗi hệ thống khi tải báo cáo phân tích AI." };
  }
}
