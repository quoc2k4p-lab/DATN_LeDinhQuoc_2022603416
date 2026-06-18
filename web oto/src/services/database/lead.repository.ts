import crypto from "crypto";
import { getPool } from "@/lib/db";

export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  interestedCarId?: string | null;
  message?: string;
}

export interface AppointmentInput {
  carId: string;
  customerName: string;
  phone: string;
  email: string;
  appointmentDate: string; // ISO String
  note?: string;
}

/**
 * Creates or updates a customer in the CRM database and logs the activity.
 */
export async function createCrmLead(input: LeadInput): Promise<{ customerId: string; isNew: boolean }> {
  const pool = getPool();
  const cleanPhone = input.phone.replace(/\D/g, "");
  const email = input.email ? input.email.trim() : `${cleanPhone}@tqauto.temp`;

  // 1. Check if customer exists in CRM
  const [existing] = await pool.query(
    "SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;",
    [cleanPhone, email]
  );
  const existingList = existing as any[];

  let customerId = "";
  let isNew = false;

  if (existingList.length > 0) {
    customerId = existingList[0].id;
    // Update existing customer stage and details
    await pool.query(
      `UPDATE customers SET 
        stage = 'lead', 
        source = 'AI_CHATBOT',
        interested_car_id = COALESCE(?, interested_car_id),
        updated_at = NOW()
       WHERE id = ?;`,
      [input.interestedCarId || null, customerId]
    );
  } else {
    customerId = crypto.randomUUID();
    isNew = true;
    await pool.query(
      `INSERT INTO customers (
        id, full_name, phone, email, interested_car_id, budget, 
        stage, note, assigned_staff_id, source, status
      ) VALUES (?, ?, ?, ?, ?, NULL, 'lead', ?, NULL, 'AI_CHATBOT', 'active')`,
      [
        customerId,
        input.name.trim(),
        cleanPhone,
        email,
        input.interestedCarId || null,
        input.message || "Đăng ký tư vấn qua AI Chatbot"
      ]
    );
  }

  // 2. Fetch default system admin
  const [adminRows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1;");
  const systemStaffId = (adminRows as any[])[0]?.id || "a0000000-0000-0000-0000-000000000001";

  // 3. Insert system log note
  const carText = input.interestedCarId ? `xe (ID: ${input.interestedCarId})` : "xe";
  const noteContent = `[AI Chatbot] Yêu cầu tư vấn mới từ khách hàng ${input.name}. 
- SĐT: ${input.phone}
- Email: ${email}
- Xe quan tâm: ${carText}
- Nội dung: ${input.message || "Cần tư vấn báo giá"}`;

  await pool.query(
    `INSERT INTO customer_notes (id, customer_id, staff_id, content) VALUES (?, ?, ?, ?);`,
    [crypto.randomUUID(), customerId, systemStaffId, noteContent]
  );

  // 4. Create notification
  let carName = "ô tô";
  if (input.interestedCarId) {
    const [carRows] = await pool.query("SELECT title FROM cars WHERE id = ? LIMIT 1;", [input.interestedCarId]);
    if ((carRows as any[]).length > 0) {
      carName = (carRows as any[])[0].title;
    }
  }

  await pool.query(
    `INSERT INTO notifications (id, user_id, title, content, link, is_read) VALUES (?, NULL, ?, ?, ?, 0);`,
    [
      crypto.randomUUID(),
      "Lead mới từ AI Chatbot",
      `${input.name.trim()} đăng ký tư vấn ${carName} qua AI Assistant`,
      "/admin/customers"
    ]
  );

  return { customerId, isNew };
}

/**
 * Schedules a new car viewing appointment.
 */
export async function createCrmAppointment(input: AppointmentInput): Promise<string> {
  const pool = getPool();
  const id = crypto.randomUUID();
  const cleanPhone = input.phone.replace(/\D/g, "");

  // 1. Sync to CRM customers first to get customerId
  const { customerId } = await createCrmLead({
    name: input.customerName,
    phone: input.phone,
    email: input.email,
    interestedCarId: input.carId,
    message: `[Đặt lịch hẹn] Hẹn xem xe ngày ${new Date(input.appointmentDate).toLocaleString("vi-VN")}. Ghi chú: ${input.note || "Không"}`
  });

  // Update customer stage to test_drive
  await pool.query(
    "UPDATE customers SET stage = 'test_drive', updated_at = NOW() WHERE id = ?;",
    [customerId]
  );

  // 2. Insert into appointments table
  await pool.query(
    `INSERT INTO appointments (id, car_id, customer_id, appointment_date, note, status)
     VALUES (?, ?, ?, ?, ?, 'pending');`,
    [
      id,
      input.carId,
      customerId,
      new Date(input.appointmentDate),
      input.note || "Đặt lịch xem xe qua AI Chatbot"
    ]
  );

  // Log appointment note
  const [adminRows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1;");
  const systemStaffId = (adminRows as any[])[0]?.id || "a0000000-0000-0000-0000-000000000001";
  
  await pool.query(
    `INSERT INTO customer_notes (id, customer_id, staff_id, content) VALUES (?, ?, ?, ?);`,
    [
      crypto.randomUUID(),
      customerId,
      systemStaffId,
      `[Hệ thống] Tạo lịch hẹn xem xe thành công. Ngày hẹn: ${new Date(input.appointmentDate).toLocaleString("vi-VN")}`
    ]
  );

  // Trigger admin alert
  await pool.query(
    `INSERT INTO notifications (id, user_id, title, content, link, is_read) VALUES (?, NULL, ?, ?, ?, 0);`,
    [
      crypto.randomUUID(),
      "Lịch hẹn mới từ AI Chat",
      `${input.customerName} đặt lịch xem xe ngày ${new Date(input.appointmentDate).toLocaleDateString("vi-VN")}`,
      "/admin/appointments"
    ]
  );

  return id;
}
