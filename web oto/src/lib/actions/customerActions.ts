"use server";

import crypto from "crypto";
import { getPool, ensureDbExists, DbCustomer, DbCustomerNote } from "@/lib/db";
import { getMeAction, ActionResponse } from "./auth";
import { revalidatePath } from "next/cache";

import { CustomerStage, STAGE_LABELS, STAGE_COLORS } from "@/lib/crmConstants";

export interface UiCustomer extends Omit<DbCustomer, "created_at" | "updated_at"> {
  car_title: string | null;
  staff_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerDetail {
  customer: UiCustomer;
  notes: (DbCustomerNote & { staff_name: string })[];
  appointments: any[];
  chatHistory: any[];
  timeline: {
    id: string;
    type: "creation" | "note" | "appointment" | "stage_change" | "assignment";
    title: string;
    description: string;
    date: string;
    staff_name?: string | null;
  }[];
}

export interface CustomerFilters {
  search?: string;
  stage?: string;
  assignedStaffId?: string;
  budgetRange?: string;
  status?: string;
}

/**
 * Helper to match budget ranges
 */
function budgetRangeSql(range: string): string {
  if (range === "Dưới 1 tỷ") {
    return "(budget LIKE '%triệu%' AND CAST(REPLACE(REPLACE(budget, ' triệu', ''), 'đ', '') AS SIGNED) < 1000) OR (budget LIKE '%tỷ%' AND CAST(REPLACE(REPLACE(REPLACE(budget, ' tỷ', ''), 'đ', ''), ',', '.') AS DECIMAL(10,2)) < 1.0)";
  } else if (range === "1 - 2 tỷ") {
    return "budget LIKE '%tỷ%' AND CAST(REPLACE(REPLACE(REPLACE(budget, ' tỷ', ''), 'đ', ''), ',', '.') AS DECIMAL(10,2)) >= 1.0 AND CAST(REPLACE(REPLACE(REPLACE(budget, ' tỷ', ''), 'đ', ''), ',', '.') AS DECIMAL(10,2)) <= 2.0";
  } else if (range === "Trên 2 tỷ") {
    return "budget LIKE '%tỷ%' AND CAST(REPLACE(REPLACE(REPLACE(budget, ' tỷ', ''), 'đ', ''), ',', '.') AS DECIMAL(10,2)) > 2.0";
  }
  return "1=1";
}

/**
 * Fetch all customers based on filters and user permissions
 */
export async function getCustomersAction(
  filters: CustomerFilters = {}
): Promise<ActionResponse & { customers?: UiCustomer[] }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Bạn cần đăng nhập để thực hiện tác vụ này." };
    }

    const { role, id: currentUserId } = meRes.user;
    const pool = getPool();

    let query = `
      SELECT c.*, car.title as car_title, u.full_name as staff_name
      FROM customers c
      LEFT JOIN cars car ON c.interested_car_id = car.id
      LEFT JOIN users u ON c.assigned_staff_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role-based restrictions: Staff only see their own assigned customers
    if (role === "staff") {
      query += " AND c.assigned_staff_id = ?";
      params.push(currentUserId);
    } else if (filters.assignedStaffId && filters.assignedStaffId !== "Tất cả") {
      query += " AND c.assigned_staff_id = ?";
      params.push(filters.assignedStaffId);
    }

    // Apply Search
    if (filters.search && filters.search.trim()) {
      const searchVal = `%${filters.search.trim()}%`;
      query += " AND (c.full_name LIKE ? OR c.phone LIKE ? OR car.title LIKE ?)";
      params.push(searchVal, searchVal, searchVal);
    }

    // Apply Stage filter
    if (filters.stage && filters.stage !== "Tất cả") {
      query += " AND c.stage = ?";
      params.push(filters.stage);
    }

    // Apply Status filter
    if (filters.status && filters.status !== "Tất cả") {
      const dbStatus = filters.status === "Hoạt động" ? "active" : "inactive";
      query += " AND c.status = ?";
      params.push(dbStatus);
    }

    // Apply Budget Range filter
    if (filters.budgetRange && filters.budgetRange !== "Tất cả") {
      query += ` AND (${budgetRangeSql(filters.budgetRange)})`;
    }

    query += " ORDER BY c.updated_at DESC;";

    const [rows] = await pool.query(query, params);

    const customers = (rows as any[]).map((r) => ({
      ...r,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    }));

    return { success: true, customers };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return { success: false, message: "Không thể lấy danh sách khách hàng." };
  }
}

/**
 * Fetch detailed customer profile, timeline history, appointments and chats
 */
export async function getCustomerDetailAction(
  id: string
): Promise<ActionResponse & { customerDetail?: CustomerDetail }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Bạn cần đăng nhập để thực hiện tác vụ này." };
    }

    const pool = getPool();

    // 1. Fetch customer details
    const [cRows] = await pool.query(
      `SELECT c.*, car.title as car_title, u.full_name as staff_name
       FROM customers c
       LEFT JOIN cars car ON c.interested_car_id = car.id
       LEFT JOIN users u ON c.assigned_staff_id = u.id
       WHERE c.id = ?;`,
      [id]
    );

    const customersList = cRows as any[];
    if (customersList.length === 0) {
      return { success: false, message: "Không tìm thấy khách hàng này." };
    }

    const rawCustomer = customersList[0];
    const customer: UiCustomer = {
      ...rawCustomer,
      created_at: rawCustomer.created_at.toISOString(),
      updated_at: rawCustomer.updated_at.toISOString(),
    };

    // 2. Fetch customer notes
    const [nRows] = await pool.query(
      `SELECT cn.*, u.full_name as staff_name
       FROM customer_notes cn
       LEFT JOIN users u ON cn.staff_id = u.id
       WHERE cn.customer_id = ?
       ORDER BY cn.created_at DESC;`,
      [id]
    );
    const notes = (nRows as any[]).map(n => ({
      ...n,
      created_at: n.created_at.toISOString()
    }));

    // 3. Fetch appointment history matching phone or email
    const [aRows] = await pool.query(
      `SELECT a.*, car.title as car_title
       FROM appointments a
       LEFT JOIN cars car ON a.car_id = car.id
       WHERE a.customer_phone = ? OR a.customer_email = ?
       ORDER BY a.appointment_date DESC;`,
      [customer.phone, customer.email]
    );
    const appointments = (aRows as any[]).map(a => ({
      ...a,
      appointment_date: a.appointment_date.toISOString(),
      created_at: a.created_at.toISOString()
    }));

    // 4. Fetch chat history if session_id is available
    let chatHistory: any[] = [];
    if (customer.session_id) {
      const [chatRows] = await pool.query(
        "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC;",
        [customer.session_id]
      );
      chatHistory = (chatRows as any[]).map(m => ({
        ...m,
        created_at: m.created_at.toISOString()
      }));
    }

    // 5. Construct timeline
    const timeline: CustomerDetail["timeline"] = [];

    // A. Creation event
    timeline.push({
      id: "create-evt",
      type: "creation",
      title: "Tạo Lead mới",
      description: `Khách hàng được tạo từ nguồn: ${customer.source === "website" ? "Website" : customer.source === "chat" ? "Realtime Chat" : "Nhập tay / Showroom"}.`,
      date: customer.created_at,
    });

    // B. Notes events
    notes.forEach((note) => {
      timeline.push({
        id: note.id,
        type: "note",
        title: "Ghi chú tư vấn",
        description: note.content,
        date: note.created_at,
        staff_name: note.staff_name,
      });
    });

    // C. Appointment bookings
    appointments.forEach((apt) => {
      let statusStr = "Chờ xác nhận";
      if (apt.status === "confirmed") statusStr = "Đã xác nhận";
      else if (apt.status === "completed") statusStr = "Hoàn thành";
      else if (apt.status === "cancelled") statusStr = "Đã hủy";

      timeline.push({
        id: apt.id,
        type: "appointment",
        title: `Đăng ký xem xe: ${apt.car_title}`,
        description: `Lịch hẹn xem xe lúc ${new Date(apt.appointment_date).toLocaleString("vi-VN")}. Trạng thái: ${statusStr}. Ghi chú khách đặt: "${apt.note || ""}"`,
        date: apt.created_at,
      });
    });

    // Sort timeline: newest events first
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      customerDetail: {
        customer,
        notes,
        appointments,
        chatHistory,
        timeline,
      },
    };
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return { success: false, message: "Không thể lấy thông tin chi tiết khách hàng." };
  }
}

/**
 * Create a new Customer/Lead
 */
export async function createCustomerAction(
  data: Omit<DbCustomer, "id" | "created_at" | "updated_at" | "session_id">
): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();
    const id = crypto.randomUUID();

    // Clean phone number
    const cleanedPhone = data.phone.replace(/\D/g, "");

    await pool.query(
      `INSERT INTO customers (id, full_name, phone, email, interested_car_id, budget, stage, note, assigned_staff_id, source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.full_name.trim(),
        cleanedPhone,
        data.email.trim(),
        data.interested_car_id,
        data.budget,
        data.stage || "new_lead",
        data.note,
        data.assigned_staff_id,
        data.source || "showroom",
        data.status || "active",
      ]
    );

    // Add note history
    if (data.note) {
      await pool.query(
        "INSERT INTO customer_notes (id, customer_id, staff_id, content) VALUES (?, ?, ?, ?);",
        [crypto.randomUUID(), id, meRes.user.id, `Tạo khách hàng mới: ${data.note}`]
      );
    }

    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: "Thêm khách hàng thành công!" };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { success: false, message: "Lỗi hệ thống khi thêm khách hàng." };
  }
}

/**
 * Edit Customer info
 */
export async function updateCustomerAction(
  id: string,
  data: Partial<Omit<DbCustomer, "id" | "created_at" | "updated_at">>
): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();
    const fields = Object.keys(data);
    if (fields.length === 0) {
      return { success: false, message: "Không có thông tin thay đổi." };
    }

    const setClause = fields.map((f) => `\`${f}\` = ?`).join(", ");
    const values = Object.values(data);

    await pool.query(
      `UPDATE customers SET ${setClause}, updated_at = NOW() WHERE id = ?;`,
      [...values, id]
    );

    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: "Cập nhật thông tin thành công!" };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { success: false, message: "Lỗi hệ thống khi cập nhật." };
  }
}

/**
 * Update stage of consultation
 */
export async function updateCustomerStageAction(
  id: string,
  stage: CustomerStage
): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();
    const label = STAGE_LABELS[stage] || stage;

    // Update stage
    await pool.query(
      "UPDATE customers SET stage = ?, updated_at = NOW() WHERE id = ?;",
      [stage, id]
    );

    // Save automatic note
    await pool.query(
      "INSERT INTO customer_notes (id, customer_id, staff_id, content) VALUES (?, ?, ?, ?);",
      [
        crypto.randomUUID(),
        id,
        meRes.user.id,
        `Cập nhật tiến trình tư vấn thành: ${label}`
      ]
    );

    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: `Cập nhật tiến trình tư vấn thành ${label}!` };
  } catch (error) {
    console.error("Error updating stage:", error);
    return { success: false, message: "Không thể cập nhật tiến trình." };
  }
}

/**
 * Assign staff member to customer
 */
export async function assignStaffAction(
  id: string,
  staffId: string | null
): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();
    let staffName = "Chưa phân công";

    if (staffId) {
      const [uRows] = await pool.query("SELECT full_name FROM users WHERE id = ? LIMIT 1;", [staffId]);
      if ((uRows as any[]).length > 0) {
        staffName = (uRows as any[])[0].full_name;
      }
    }

    // Update assigned staff
    await pool.query(
      "UPDATE customers SET assigned_staff_id = ?, updated_at = NOW() WHERE id = ?;",
      [staffId, id]
    );

    // Add note entry
    await pool.query(
      "INSERT INTO customer_notes (id, customer_id, staff_id, content) VALUES (?, ?, ?, ?);",
      [
        crypto.randomUUID(),
        id,
        meRes.user.id,
        `Phân công nhân viên chăm sóc khách hàng: ${staffName}`
      ]
    );

    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: `Đã giao việc cho nhân viên: ${staffName}` };
  } catch (error) {
    console.error("Error assigning staff:", error);
    return { success: false, message: "Không thể phân công nhân viên." };
  }
}

/**
 * Add note to customer history
 */
export async function addCustomerNoteAction(
  customerId: string,
  content: string
): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    if (!content.trim()) {
      return { success: false, message: "Nội dung ghi chú không được để trống." };
    }

    const pool = getPool();
    const id = crypto.randomUUID();

    await pool.query(
      "INSERT INTO customer_notes (id, customer_id, staff_id, content) VALUES (?, ?, ?, ?);",
      [id, customerId, meRes.user.id, content.trim()]
    );

    // Touch customer updated_at
    await pool.query(
      "UPDATE customers SET updated_at = NOW() WHERE id = ?;",
      [customerId]
    );

    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: "Đã thêm ghi chú thành công!" };
  } catch (error) {
    console.error("Error adding note:", error);
    return { success: false, message: "Không thể thêm ghi chú." };
  }
}

/**
 * Delete customer
 */
export async function deleteCustomerAction(id: string): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();
    await pool.query("DELETE FROM customers WHERE id = ?;", [id]);

    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: "Đã xóa thông tin khách hàng khỏi hệ thống!" };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return { success: false, message: "Không thể xóa khách hàng." };
  }
}

/**
 * Export customers data
 */
export async function exportCustomersAction(): Promise<ActionResponse & { data?: string }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT c.full_name, c.phone, c.email, car.title as interested_car, c.budget, c.stage, c.source, c.status, u.full_name as assigned_staff, c.created_at
      FROM customers c
      LEFT JOIN cars car ON c.interested_car_id = car.id
      LEFT JOIN users u ON c.assigned_staff_id = u.id
      ORDER BY c.created_at DESC;
    `);

    // Generate CSV data string
    const headers = ["Họ tên", "Số điện thoại", "Email", "Xe quan tâm", "Ngân sách", "Tiến trình", "Nguồn", "Trạng thái", "Nhân viên", "Ngày tạo"];
    const csvRows = [headers.join(",")];

    for (const r of rows as any[]) {
      const stageLabel = STAGE_LABELS[r.stage as CustomerStage] || r.stage;
      const statusLabel = r.status === "active" ? "Hoạt động" : "Ngừng chăm sóc";
      const row = [
        `"${r.full_name.replace(/"/g, '""')}"`,
        `"${r.phone}"`,
        `"${r.email}"`,
        `"${(r.interested_car || "").replace(/"/g, '""')}"`,
        `"${(r.budget || "").replace(/"/g, '""')}"`,
        `"${stageLabel}"`,
        `"${r.source || "showroom"}"`,
        `"${statusLabel}"`,
        `"${(r.assigned_staff || "").replace(/"/g, '""')}"`,
        `"${r.created_at.toISOString()}"`
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for UTF-8 compatibility in Excel

    return {
      success: true,
      data: csvContent,
      message: "Xuất dữ liệu Excel thành công!"
    };
  } catch (error) {
    console.error("Error exporting customers:", error);
    return { success: false, message: "Lỗi hệ thống khi xuất dữ liệu." };
  }
}
