"use server";

import crypto from "crypto";
import { getPool, ensureDbExists } from "@/lib/db";
import { getMeAction, ActionResponse } from "./auth";
import { revalidatePath } from "next/cache";
import { sendContactConfirmationEmail } from "@/lib/mailer";

import {
  ConsultationType,
  CONSULTATION_TYPE_LABELS,
  REVERSE_TYPE_LABELS,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
  ContactRequest,
  LeadFilters
} from "@/lib/leadConstants";

/**
 * Client form submission handler
 */
export async function createContactRequestAction(formData: {
  full_name: string;
  phone: string;
  email: string;
  consultation_type: string;
  message: string;
}): Promise<ActionResponse & { leadId?: string }> {
  try {
    await ensureDbExists();
    const pool = getPool();

    // 1. Validations
    if (!formData.full_name.trim()) return { success: false, message: "Họ tên không được để trống." };
    if (!formData.phone.trim()) return { success: false, message: "Số điện thoại không được để trống." };
    if (!formData.email.trim()) return { success: false, message: "Email không được để trống." };
    if (!formData.consultation_type.trim()) return { success: false, message: "Vui lòng chọn nhu cầu tư vấn." };
    if (!formData.message.trim()) return { success: false, message: "Nội dung yêu cầu không được để trống." };

    const cleanPhone = formData.phone.replace(/\D/g, "");
    const leadId = crypto.randomUUID();

    // Convert label to standard type enum
    const typeEnum = CONSULTATION_TYPE_LABELS[formData.consultation_type] || "other";

    // 2. Insert into contact_requests
    await pool.query(`
      INSERT INTO contact_requests (id, full_name, phone, email, consultation_type, message, assigned_staff_id, stage, status)
      VALUES (?, ?, ?, ?, ?, ?, NULL, 'new_lead', 'active');
    `, [
      leadId,
      formData.full_name.trim(),
      cleanPhone,
      formData.email.trim(),
      typeEnum,
      formData.message.trim()
    ]);

    // 3. Upsert customer CRM record matching on phone or email
    let customerId = "";
    const [existingCust] = await pool.query(
      "SELECT id, assigned_staff_id FROM customers WHERE phone = ? OR email = ? LIMIT 1;",
      [cleanPhone, formData.email.trim()]
    );
    const existingList = existingCust as any[];

    if (existingList.length > 0) {
      customerId = existingList[0].id;
      // Update existing customer stage to new_lead and update source
      await pool.query(
        "UPDATE customers SET stage = 'new_lead', source = 'website_contact' WHERE id = ?;",
        [customerId]
      );
    } else {
      customerId = crypto.randomUUID();
      await pool.query(`
        INSERT INTO customers (id, full_name, phone, email, interested_car_id, budget, stage, note, assigned_staff_id, source, status)
        VALUES (?, ?, ?, ?, NULL, NULL, 'new_lead', ?, NULL, 'website_contact', 'active');
      `, [
        customerId,
        formData.full_name.trim(),
        cleanPhone,
        formData.email.trim(),
        `[Yêu cầu liên hệ: ${formData.consultation_type}] ${formData.message.trim()}`
      ]);
    }

    // 4. Create customer note log
    // Find default admin to associate with system note
    const [adminRows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1;");
    const systemStaffId = (adminRows as any[])[0]?.id || "a0000000-0000-0000-0000-000000000001";

    await pool.query(`
      INSERT INTO customer_notes (id, customer_id, staff_id, content)
      VALUES (?, ?, ?, ?);
    `, [
      crypto.randomUUID(),
      customerId,
      systemStaffId,
      `[Hệ thống] Gửi yêu cầu tư vấn mới từ website: "${formData.consultation_type}". Nội dung: "${formData.message.trim()}"`
    ]);

    // 5. Fire global admin notification
    await pool.query(`
      INSERT INTO notifications (id, user_id, title, content, link, is_read)
      VALUES (?, NULL, ?, ?, ?, 0);
    `, [
      crypto.randomUUID(),
      "Lead mới từ website",
      `${formData.full_name.trim()} cần ${formData.consultation_type.toLowerCase()}`,
      "/admin/leads"
    ]);

    // 6. Send confirmation email to customer (wrapped in try-catch so it won't fail the transaction if API fails)
    try {
      if (process.env.EMAIL_USER) {
        await sendContactConfirmationEmail({
          fullName: formData.full_name.trim(),
          customerEmail: formData.email.trim(),
          consultationType: formData.consultation_type,
          phone: formData.phone.trim(),
          message: formData.message.trim(),
        });
        console.log("Consultation confirmation email sent successfully to", formData.email.trim());
      }
    } catch (emailErr) {
      console.error("Nodemailer failing silently:", emailErr);
    }

    revalidatePath("/admin/leads");
    revalidatePath("/staff/leads");
    return { success: true, message: "Gửi yêu cầu thành công!", leadId };
  } catch (err: any) {
    console.error("Error creating contact request:", err);
    return { success: false, message: "Lỗi hệ thống khi gửi yêu cầu tư vấn." };
  }
}

/**
 * Fetch contact requests (leads) based on user role and filters
 */
export async function getLeadsAction(
  filters: LeadFilters = {}
): Promise<ActionResponse & { leads?: ContactRequest[] }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Bạn cần đăng nhập để thực hiện tác vụ này." };
    }

    const { role, id: currentUserId } = meRes.user;
    const pool = getPool();

    let query = `
      SELECT cr.*, u.full_name as staff_name
      FROM contact_requests cr
      LEFT JOIN users u ON cr.assigned_staff_id = u.id
      WHERE cr.status = 'active'
    `;
    const params: any[] = [];

    // Role scoping: Staff only see their assigned contact requests
    if (role === "staff") {
      query += " AND cr.assigned_staff_id = ?";
      params.push(currentUserId);
    } else if (filters.assignedStaffId && filters.assignedStaffId !== "Tất cả") {
      query += " AND cr.assigned_staff_id = ?";
      params.push(filters.assignedStaffId);
    }

    // Apply Search
    if (filters.search && filters.search.trim()) {
      const searchVal = `%${filters.search.trim()}%`;
      query += " AND (cr.full_name LIKE ? OR cr.phone LIKE ? OR cr.email LIKE ?)";
      params.push(searchVal, searchVal, searchVal);
    }

    // Apply Stage Filter
    if (filters.stage && filters.stage !== "Tất cả") {
      query += " AND cr.stage = ?";
      params.push(filters.stage);
    }

    query += " ORDER BY cr.created_at DESC;";

    const [rows] = await pool.query(query, params);
    const leads = (rows as any[]).map((r) => ({
      ...r,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    }));

    return { success: true, leads };
  } catch (err) {
    console.error("Error getting leads:", err);
    return { success: false, message: "Không thể lấy danh sách yêu cầu tư vấn." };
  }
}

/**
 * Get detailed request
 */
export async function getLeadDetailAction(id: string): Promise<ActionResponse & { lead?: ContactRequest; chatSessionId?: string | null }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT cr.*, u.full_name as staff_name
      FROM contact_requests cr
      LEFT JOIN users u ON cr.assigned_staff_id = u.id
      WHERE cr.id = ? LIMIT 1;
    `, [id]);

    const leadList = rows as any[];
    if (leadList.length === 0) {
      return { success: false, message: "Không tìm thấy yêu cầu tư vấn." };
    }

    const lead = {
      ...leadList[0],
      created_at: leadList[0].created_at.toISOString(),
      updated_at: leadList[0].updated_at.toISOString(),
    };

    // Find if the customer has an active chat session in customers table
    const [custRows] = await pool.query(
      "SELECT session_id FROM customers WHERE phone = ? OR email = ? LIMIT 1;",
      [lead.phone, lead.email]
    );
    const chatSessionId = (custRows as any[])[0]?.session_id || null;

    return { success: true, lead, chatSessionId };
  } catch (err) {
    console.error("Error getting lead details:", err);
    return { success: false, message: "Không thể lấy thông tin chi tiết yêu cầu." };
  }
}

/**
 * Assign Sales Staff
 */
export async function assignLeadSalesAction(leadId: string, staffId: string | null): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }
    if (meRes.user.role !== "admin") {
      return { success: false, message: "Chỉ quản trị viên mới có quyền phân công nhân sự." };
    }

    const pool = getPool();

    // 1. Fetch lead details
    const [leadRows] = await pool.query("SELECT * FROM contact_requests WHERE id = ? LIMIT 1;", [leadId]);
    const leadList = leadRows as any[];
    if (leadList.length === 0) return { success: false, message: "Không tìm thấy yêu cầu." };
    const lead = leadList[0];

    // 2. Fetch staff name
    let staffName = null;
    if (staffId) {
      const [uRows] = await pool.query("SELECT full_name FROM users WHERE id = ? LIMIT 1;", [staffId]);
      if ((uRows as any[]).length === 0) return { success: false, message: "Nhân viên được chọn không hợp lệ." };
      staffName = (uRows as any[])[0].full_name;
    }

    const newStage = staffId ? "assigned" : "new_lead";

    // 3. Update contact_requests
    await pool.query(
      "UPDATE contact_requests SET assigned_staff_id = ?, stage = ? WHERE id = ?;",
      [staffId, newStage, leadId]
    );

    // 4. Also update corresponding customer in CRM
    const [custRows] = await pool.query("SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;", [lead.phone, lead.email]);
    const customerList = custRows as any[];
    if (customerList.length > 0) {
      const customerId = customerList[0].id;
      await pool.query(
        "UPDATE customers SET assigned_staff_id = ?, stage = 'consulting' WHERE id = ?;",
        [staffId, customerId]
      );

      // Log assignment note
      await pool.query(`
        INSERT INTO customer_notes (id, customer_id, staff_id, content)
        VALUES (?, ?, ?, ?);
      `, [
        crypto.randomUUID(),
        customerId,
        meRes.user.id,
        staffId 
          ? `[Phân công] Giao khách hàng cho nhân viên ${staffName} chăm sóc.`
          : "[Phân công] Hủy phân công nhân viên, đưa về hàng chờ."
      ]);
    }

    // 5. Fire notification for staff if assigned
    if (staffId) {
      await pool.query(`
        INSERT INTO notifications (id, user_id, title, content, link, is_read)
        VALUES (?, ?, ?, ?, ?, 0);
      `, [
        crypto.randomUUID(),
        staffId,
        "Phân công yêu cầu tư vấn mới",
        `Bạn được giao chăm sóc khách hàng ${lead.full_name} (${REVERSE_TYPE_LABELS[lead.consultation_type as ConsultationType] || lead.consultation_type})`,
        "/staff/leads"
      ]);
    }

    revalidatePath("/admin/leads");
    revalidatePath("/staff/leads");
    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: "Phân công nhân sự thành công!" };
  } catch (err) {
    console.error("Error assigning lead sales:", err);
    return { success: false, message: "Lỗi hệ thống khi phân công nhân sự." };
  }
}

/**
 * Update lead stage
 */
export async function updateLeadStageAction(leadId: string, stage: string): Promise<ActionResponse> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();

    // Get lead details
    const [leadRows] = await pool.query("SELECT * FROM contact_requests WHERE id = ? LIMIT 1;", [leadId]);
    const leadList = leadRows as any[];
    if (leadList.length === 0) return { success: false, message: "Không tìm thấy yêu cầu." };
    const lead = leadList[0];

    // Check staff permissions (staff can only modify their assigned leads)
    if (meRes.user.role === "staff" && lead.assigned_staff_id !== meRes.user.id) {
      return { success: false, message: "Bạn không được phân công quản lý yêu cầu tư vấn này." };
    }

    // Update request stage
    await pool.query(
      "UPDATE contact_requests SET stage = ? WHERE id = ?;",
      [stage, leadId]
    );

    // Sync to CRM customer stage if possible
    // Note: CRM stages map to customer stages (consulting, appointment, quotation, purchased, follow_up)
    let crmStage = "consulting";
    if (stage === "new_lead") crmStage = "new_lead";
    else if (stage === "assigned") crmStage = "consulting";
    else if (stage === "consulting") crmStage = "consulting";
    else if (stage === "appointment") crmStage = "appointment";
    else if (stage === "quotation") crmStage = "quotation";
    else if (stage === "purchased") crmStage = "purchased";
    else if (stage === "closed") crmStage = "follow_up";

    const [custRows] = await pool.query("SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;", [lead.phone, lead.email]);
    const customerList = custRows as any[];
    if (customerList.length > 0) {
      const customerId = customerList[0].id;
      await pool.query(
        "UPDATE customers SET stage = ? WHERE id = ?;",
        [crmStage, customerId]
      );

      // Add audit note in CRM
      await pool.query(`
        INSERT INTO customer_notes (id, customer_id, staff_id, content)
        VALUES (?, ?, ?, ?);
      `, [
        crypto.randomUUID(),
        customerId,
        meRes.user.id,
        `[Tiến độ] Cập nhật trạng thái yêu cầu liên hệ thành: "${LEAD_STAGE_LABELS[stage] || stage}".`
      ]);
    }

    revalidatePath("/admin/leads");
    revalidatePath("/staff/leads");
    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: "Cập nhật trạng thái thành công!" };
  } catch (err) {
    console.error("Error updating lead stage:", err);
    return { success: false, message: "Lỗi hệ thống khi cập nhật trạng thái." };
  }
}

/**
 * Add a consultation note associated with a lead (by matching to the customers CRM record)
 */
export async function addLeadNoteAction(leadId: string, content: string): Promise<ActionResponse> {
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

    // 1. Fetch lead details to get phone/email
    const [leadRows] = await pool.query("SELECT * FROM contact_requests WHERE id = ? LIMIT 1;", [leadId]);
    const leadList = leadRows as any[];
    if (leadList.length === 0) return { success: false, message: "Không tìm thấy yêu cầu." };
    const lead = leadList[0];

    // Check staff permissions (staff can only add notes to their assigned leads)
    if (meRes.user.role === "staff" && lead.assigned_staff_id !== meRes.user.id) {
      return { success: false, message: "Bạn không được phân công quản lý yêu cầu tư vấn này." };
    }

    // 2. Fetch corresponding customer ID
    const [custRows] = await pool.query("SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;", [lead.phone, lead.email]);
    const customerList = custRows as any[];
    if (customerList.length === 0) {
      return { success: false, message: "Không tìm thấy hồ sơ khách hàng CRM tương ứng." };
    }
    const customerId = customerList[0].id;

    // 3. Insert note
    await pool.query(`
      INSERT INTO customer_notes (id, customer_id, staff_id, content)
      VALUES (?, ?, ?, ?);
    `, [
      crypto.randomUUID(),
      customerId,
      meRes.user.id,
      content.trim()
    ]);

    revalidatePath("/admin/leads");
    revalidatePath("/staff/leads");
    revalidatePath("/admin/customers");
    revalidatePath("/staff/customers");
    return { success: true, message: "Thêm ghi chú tư vấn thành công!" };
  } catch (err) {
    console.error("Error adding lead note:", err);
    return { success: false, message: "Lỗi hệ thống khi thêm ghi chú." };
  }
}

/**
 * Fetch consultation notes for a lead
 */
export async function getLeadNotesAction(leadId: string): Promise<ActionResponse & { notes?: any[] }> {
  try {
    await ensureDbExists();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.user) {
      return { success: false, message: "Chưa đăng nhập." };
    }

    const pool = getPool();

    // 1. Fetch lead phone/email
    const [leadRows] = await pool.query("SELECT phone, email FROM contact_requests WHERE id = ? LIMIT 1;", [leadId]);
    const leadList = leadRows as any[];
    if (leadList.length === 0) return { success: false, message: "Không tìm thấy yêu cầu." };
    const lead = leadList[0];

    // 2. Fetch notes
    const [notesRows] = await pool.query(`
      SELECT cn.*, u.full_name as staff_name
      FROM customer_notes cn
      LEFT JOIN customers c ON cn.customer_id = c.id
      LEFT JOIN users u ON cn.staff_id = u.id
      WHERE c.phone = ? OR c.email = ?
      ORDER BY cn.created_at DESC;
    `, [lead.phone, lead.email]);

    const notes = (notesRows as any[]).map(n => ({
      ...n,
      created_at: n.created_at.toISOString()
    }));

    return { success: true, notes };
  } catch (err) {
    console.error("Error getting lead notes:", err);
    return { success: false, message: "Không thể lấy danh sách ghi chú." };
  }
}

