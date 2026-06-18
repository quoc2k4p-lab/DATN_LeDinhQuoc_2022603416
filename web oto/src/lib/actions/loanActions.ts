"use server";

import crypto from "crypto";
import { getPool, ensureDbExists } from "@/lib/db";
import { getMeAction, ActionResponse } from "./auth";
import { revalidatePath } from "next/cache";

export interface LoanLeadInput {
  carId: string | null;
  customerName: string;
  phone: string;
  email: string;
  carPrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
}

export interface LoanAnalyticsData {
  totalSimulations: number;
  topCars: Array<{ carId: string; carName: string; brand: string; count: number }>;
  topTerms: Array<{ termMonths: number; count: number }>;
  topDownPayments: Array<{ downPaymentPercent: number; count: number }>;
  latestLeads: Array<any>;
  conversionRate: number;
}

/**
 * Saves a loan simulation lead to the database and integrates it with CRM tables.
 */
export async function saveLoanSimulationLeadAction(
  input: LoanLeadInput
): Promise<ActionResponse & { simulationId?: string }> {
  try {
    await ensureDbExists();
    const pool = getPool();

    // 1. Basic validation
    if (!input.customerName.trim()) return { success: false, message: "Họ tên không được để trống." };
    if (!input.phone.trim()) return { success: false, message: "Số điện thoại không được để trống." };
    if (!input.email.trim()) return { success: false, message: "Email không được để trống." };

    const cleanPhone = input.phone.replace(/\D/g, "");
    const simulationId = crypto.randomUUID();

    // 2. Fetch car info if exists
    let carName = "Tự nhập xe ngoài";
    if (input.carId) {
      const [carRows] = await pool.query("SELECT title FROM cars WHERE id = ? LIMIT 1;", [input.carId]);
      if ((carRows as any[]).length > 0) {
        carName = (carRows as any[])[0].title;
      }
    }

    // 3. Insert into loan_simulations
    await pool.query(
      `INSERT INTO loan_simulations (
        id, car_id, customer_name, phone, email, car_price, 
        down_payment_percent, down_payment_amount, loan_amount, 
        interest_rate, term_months, monthly_payment, total_interest, total_payment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        simulationId,
        input.carId || null,
        input.customerName.trim(),
        cleanPhone,
        input.email.trim(),
        input.carPrice,
        input.downPaymentPercent,
        input.downPaymentAmount,
        input.loanAmount,
        input.interestRate,
        input.termMonths,
        input.monthlyPayment,
        input.totalInterest,
        input.totalPayment,
      ]
    );

    // 4. CRM Integration: Upsert customer record matching on phone or email
    let customerId = "";
    const [existingCust] = await pool.query(
      "SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;",
      [cleanPhone, input.email.trim()]
    );
    const existingList = existingCust as any[];

    if (existingList.length > 0) {
      customerId = existingList[0].id;
      // Update existing customer stage to contacted and keep track of interest
      await pool.query(
        `UPDATE customers SET 
          stage = 'contacted', 
          source = 'loan_calculator',
          interested_car_id = COALESCE(?, interested_car_id)
         WHERE id = ?;`,
        [input.carId || null, customerId]
      );
    } else {
      customerId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO customers (
          id, full_name, phone, email, interested_car_id, budget, 
          stage, note, assigned_staff_id, source, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'lead', ?, NULL, 'loan_calculator', 'active')`,
        [
          customerId,
          input.customerName.trim(),
          cleanPhone,
          input.email.trim(),
          input.carId || null,
          `${Math.round(input.carPrice / 1_000_000)}tr`,
          `Tính trả góp cho xe: ${carName}. Trả trước: ${input.downPaymentPercent}%, Thời hạn: ${input.termMonths} tháng.`
        ]
      );
    }

    // 5. Create timeline note log in CRM
    const [adminRows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1;");
    const systemStaffId = (adminRows as any[])[0]?.id || "a0000000-0000-0000-0000-000000000001";

    const noteContent = `[Trả góp] Tính khoản vay cho xe ${carName}. 
- Giá xe: ${new Intl.NumberFormat("vi-VN").format(input.carPrice)}đ
- Trả trước: ${input.downPaymentPercent}% (${new Intl.NumberFormat("vi-VN").format(input.downPaymentAmount)}đ)
- Khoản vay: ${new Intl.NumberFormat("vi-VN").format(input.loanAmount)}đ
- Lãi suất: ${input.interestRate}%/năm, Kỳ hạn: ${input.termMonths} tháng
- Trả hàng tháng (EMI): ${new Intl.NumberFormat("vi-VN").format(input.monthlyPayment)}đ
- Tổng tiền lãi: ${new Intl.NumberFormat("vi-VN").format(input.totalInterest)}đ`;

    await pool.query(
      `INSERT INTO customer_notes (id, customer_id, staff_id, content) VALUES (?, ?, ?, ?);`,
      [crypto.randomUUID(), customerId, systemStaffId, noteContent]
    );

    // 6. Fire global admin notification
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, content, link, is_read) VALUES (?, NULL, ?, ?, ?, 0);`,
      [
        crypto.randomUUID(),
        "Khách hàng quan tâm trả góp",
        `${input.customerName.trim()} vừa tính trả góp cho ${carName}`,
        "/admin/customers"
      ]
    );

    revalidatePath("/admin/leads");
    revalidatePath("/admin/customers");
    revalidatePath("/admin/analytics");

    return { success: true, message: "Lưu thông tin tính toán thành công!", simulationId };
  } catch (err) {
    console.error("Error saving loan simulation:", err);
    return { success: false, message: "Lỗi hệ thống khi gửi thông tin trả góp." };
  }
}

/**
 * Compiles loan simulation statistics and lists for the admin dashboard.
 */
export async function getLoanAnalyticsAction(): Promise<ActionResponse & { analytics?: LoanAnalyticsData }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Bạn cần đăng nhập để xem thông số này." };
    }

    const pool = getPool();

    // 1. Total simulations count
    const [totalRes] = await pool.query("SELECT COUNT(*) as count FROM loan_simulations;");
    const totalSimulations = (totalRes as any)[0]?.count || 0;

    // 2. Top cars calculated
    const [topCarsRes] = await pool.query(`
      SELECT l.car_id as carId, COALESCE(c.title, 'Xe tự nhập') as carName, COALESCE(c.brand, 'Khác') as brand, COUNT(l.id) as count
      FROM loan_simulations l
      LEFT JOIN cars c ON l.car_id = c.id
      GROUP BY l.car_id, c.title, c.brand
      ORDER BY count DESC
      LIMIT 5;
    `);
    const topCars = topCarsRes as any[];

    // 3. Top terms chosen
    const [topTermsRes] = await pool.query(`
      SELECT term_months as termMonths, COUNT(*) as count
      FROM loan_simulations
      GROUP BY term_months
      ORDER BY count DESC
      LIMIT 5;
    `);
    const topTerms = topTermsRes as any[];

    // 4. Top down payments
    const [topDPRes] = await pool.query(`
      SELECT down_payment_percent as downPaymentPercent, COUNT(*) as count
      FROM loan_simulations
      GROUP BY down_payment_percent
      ORDER BY count DESC
      LIMIT 5;
    `);
    const topDownPayments = topDPRes as any[];

    // 5. Latest simulation leads
    const [latestLeadsRes] = await pool.query(`
      SELECT l.*, COALESCE(c.title, 'Xe tự nhập') as carName
      FROM loan_simulations l
      LEFT JOIN cars c ON l.car_id = c.id
      ORDER BY l.created_at DESC
      LIMIT 10;
    `);
    const latestLeads = (latestLeadsRes as any[]).map(r => ({
      ...r,
      created_at: r.created_at.toISOString()
    }));

    // 6. Conversion Rate (Simulated customers who purchased in CRM)
    const [simTotalCustRes] = await pool.query(`
      SELECT COUNT(DISTINCT phone) as count FROM loan_simulations;
    `);
    const simTotalCust = (simTotalCustRes as any)[0]?.count || 0;

    let conversionRate = 0;
    if (simTotalCust > 0) {
      const [purchasedCustRes] = await pool.query(`
        SELECT COUNT(DISTINCT c.id) as count
        FROM customers c
        WHERE c.stage = 'purchased'
          AND c.phone IN (SELECT phone FROM loan_simulations);
      `);
      const purchasedCustCount = (purchasedCustRes as any)[0]?.count || 0;
      conversionRate = Math.round((purchasedCustCount / simTotalCust) * 100);
    }

    return {
      success: true,
      analytics: {
        totalSimulations,
        topCars,
        topTerms,
        topDownPayments,
        latestLeads,
        conversionRate
      }
    };
  } catch (err) {
    console.error("Error getting loan analytics:", err);
    return { success: false, message: "Lỗi hệ thống khi tải báo cáo phân tích trả góp." };
  }
}
