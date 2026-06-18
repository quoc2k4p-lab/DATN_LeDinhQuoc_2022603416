"use server";

import { 
  getUsers, 
  saveUser, 
  saveAppointment, 
  updateAppointmentStatus, 
  getAppointmentById,
  getCarById,
  DbUser,
  updateUserStatus,
  updateUserRole,
  updateUserProfile,
  deleteUser,
  updateUserPassword,
  getAppointmentsByUserId,
  getPool
} from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/jwt";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

export interface ActionResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  appointmentId?: string;
}

export interface UiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "staff" | "customer";
  status?: "active" | "blocked";
  avatar?: string;
}

/**
 * Server action to register a new customer account
 */
export async function registerUserAction(formData: FormData): Promise<ActionResponse> {
  try {
    const fullName = formData.get("fullName")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const password = formData.get("password")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";

    const errors: Record<string, string> = {};

    // 1. Required field validations
    if (!fullName) {
      errors.fullName = "Họ tên là bắt buộc";
    } else if (fullName.length < 2) {
      errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
    }

    if (!email) {
      errors.email = "Email là bắt buộc";
    } else {
      // Email format regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = "Email không đúng định dạng";
      }
    }

    // Clean phone number for validation
    const cleanedPhone = phone.replace(/[\s.-]/g, "");
    if (!phone) {
      errors.phone = "Số điện thoại là bắt buộc";
    } else {
      // Phone format validation (simple VN phone pattern)
      const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        errors.phone = "Số điện thoại không đúng định dạng (ví dụ: 0909888668)";
      }
    }

    if (!password) {
      errors.password = "Mật khẩu là bắt buộc";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    // If there are validation errors, return them immediately
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại.",
        errors,
      };
    }

    // 2. Email uniqueness validation
    const existingUsers = await getUsers();
    const isEmailTaken = existingUsers.some(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (isEmailTaken) {
      return {
        success: false,
        message: "Đăng ký thất bại",
        errors: {
          email: "Email này đã được sử dụng bởi tài khoản khác",
        },
      };
    }

    // 3. Save new user to the database
    const createdUser = await saveUser({
      full_name: fullName,
      email,
      phone: cleanedPhone,
      password: hashPassword(password),
      avatar: "",
      role: "customer",
      status: "active",
    });

    // CRM Link: Link or create customer profile
    try {
      const pool = getPool();
      const [existingCust] = await pool.query(
        "SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;",
        [cleanedPhone, email.trim()]
      );
      const custRows = existingCust as any[];
      if (custRows.length > 0) {
        // Link user_id to existing customer
        await pool.query(
          "UPDATE customers SET user_id = ?, updated_at = NOW() WHERE id = ?;",
          [createdUser.id, custRows[0].id]
        );
      } else {
        // Create a new customer CRM lead profile
        await pool.query(
          `INSERT INTO customers (id, user_id, full_name, phone, email, stage, source, status)
           VALUES (?, ?, ?, ?, ?, 'lead', 'website', 'active');`,
          [crypto.randomUUID(), createdUser.id, fullName, cleanedPhone, email.trim()]
        );
      }
    } catch (crmErr) {
      console.error("CRM Link Error in registerUserAction:", crmErr);
    }

    // 4. Auto login by signing token and setting cookie
    const token = await signToken({
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      name: createdUser.full_name,
    });

    const cookieStore = await cookies();
    cookieStore.set("tq_auto_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return {
      success: true,
      message: "Đăng ký tài khoản thành công! Đang chuyển hướng...",
    };
  } catch (error) {
    console.error("Error registering user:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Server action to log in a user
 */
export async function loginUserAction(formData: FormData): Promise<ActionResponse & { user?: UiUser }> {
  try {
    const email = formData.get("email")?.toString().trim() || "";
    const password = formData.get("password")?.toString() || "";

    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = "Email là bắt buộc";
    }
    if (!password) {
      errors.password = "Mật khẩu là bắt buộc";
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin",
        errors,
      };
    }

    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return {
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      };
    }

    // Blocked check
    if (user.status === "blocked") {
      return {
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.",
      };
    }

    const passwordHash = hashPassword(password);
    if (user.password !== passwordHash) {
      return {
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      };
    }

    // Sign session token and set HTTP-only cookie
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    });

    const cookieStore = await cookies();
    cookieStore.set("tq_auto_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    const uiUser: UiUser = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar || "",
    };

    return {
      success: true,
      message: "Đăng nhập thành công! Đang chuyển hướng...",
      user: uiUser,
    };
  } catch (error) {
    console.error("Error logging in:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Server action to log out the user
 */
export async function logoutUserAction(): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("tq_auto_session");
    return {
      success: true,
      message: "Đăng xuất thành công!",
    };
  } catch (error) {
    console.error("Error logging out:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi đăng xuất.",
    };
  }
}

/**
 * Get the current user profile from the session cookie
 */
export async function getMeAction(): Promise<{ success: boolean; user?: UiUser }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tq_auto_session")?.value;
    if (!token) {
      return { success: false };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false };
    }

    const users = await getUsers();
    const user = users.find((u) => u.id === payload.id);
    if (!user || user.status === "blocked") {
      return { success: false };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar || "",
      },
    };
  } catch (e) {
    console.error("Error in getMeAction:", e);
    return { success: false };
  }
}

/**
 * Forgot password request flow
 */
export async function forgotPasswordAction(formData: FormData): Promise<ActionResponse> {
  try {
    const email = formData.get("email")?.toString().trim() || "";
    if (!email) {
      return { success: false, message: "Email là bắt buộc" };
    }

    const users = await getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Standard safety: simulate success
      console.log(`Password reset requested for non-existing email: ${email}`);
      return {
        success: true,
        message: "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.",
      };
    }

    // Sign a temporary token valid for 15 minutes containing their email
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "tq-auto-secret-key-that-is-very-long-and-secure-12345"
    );
    const resetToken = await new SignJWT({ email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(secret);

    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || "http";
    const origin = `${proto}://${host}`;

    const resetLink = `${origin}/reset-password?token=${resetToken}`;
    console.log(`\n\n========================================\n[PASSWORD RESET LINK]: ${resetLink}\n========================================\n\n`);

    // Send email using Nodemailer
    const { sendEmail } = await import("@/lib/mailer");
    const { getPasswordResetHtml } = await import("@/lib/email-template");

    await sendEmail({
      to: user.email,
      subject: "[TQ Auto] Yêu cầu đặt lại mật khẩu",
      html: getPasswordResetHtml(user.email, resetLink),
    });

    return {
      success: true,
      message: "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.",
    };
  } catch (error) {
    console.error("Error in forgotPasswordAction:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Reset password verification and update
 */
export async function resetPasswordAction(formData: FormData): Promise<ActionResponse> {
  try {
    const token = formData.get("token")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";

    if (!token) {
      return { success: false, message: "Token đặt lại mật khẩu không hợp lệ." };
    }
    if (!password || password.length < 6) {
      return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự." };
    }
    if (password !== confirmPassword) {
      return { success: false, message: "Mật khẩu xác nhận không khớp." };
    }

    // Verify token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "tq-auto-secret-key-that-is-very-long-and-secure-12345"
    );
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const email = payload.email as string;

    if (!email) {
      return { success: false, message: "Token không hợp lệ hoặc đã hết hạn." };
    }

    const hashedPwd = hashPassword(password);
    const success = await updateUserPassword(email, hashedPwd);

    if (success) {
      return {
        success: true,
        message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
      };
    }

    return {
      success: false,
      message: "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
    };
  } catch (error) {
    console.error("Error in resetPasswordAction:", error);
    return {
      success: false,
      message: "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
    };
  }
}

/**
 * Admin action to manage user details and status (block/unblock/delete/update)
 */
export async function adminManageUsersAction(
  userId: string,
  action: "block" | "unblock" | "update" | "delete",
  data?: { fullName: string; phone: string; email: string; role?: "admin" | "staff" | "customer" }
): Promise<ActionResponse> {
  try {
    const requester = await getMeAction();
    if (!requester.success || requester.user?.role !== "admin") {
      return { success: false, message: "Chỉ quản trị viên mới được phép thực hiện hành động này." };
    }

    if (requester.user.id === userId && (action === "block" || action === "delete")) {
      return { success: false, message: "Bạn không thể tự khóa hoặc xóa tài khoản của chính mình." };
    }

    if (action === "block") {
      const success = await updateUserStatus(userId, "blocked");
      return { success, message: success ? "Khóa tài khoản thành công." : "Thất bại." };
    }

    if (action === "unblock") {
      const success = await updateUserStatus(userId, "active");
      return { success, message: success ? "Kích hoạt tài khoản thành công." : "Thất bại." };
    }

    if (action === "delete") {
      const success = await deleteUser(userId);
      return { success, message: success ? "Xóa tài khoản thành công." : "Thất bại." };
    }

    if (action === "update" && data) {
      const success = await updateUserProfile(userId, data.fullName, data.phone, data.email);
      if (data.role) {
        await updateUserRole(userId, data.role);
      }
      return { success, message: success ? "Cập nhật tài khoản thành công." : "Thất bại." };
    }

    return { success: false, message: "Hành động không hợp lệ." };
  } catch (error) {
    console.error("Error in adminManageUsersAction:", error);
    return { success: false, message: "Có lỗi xảy ra khi quản lý tài khoản." };
  }
}

/**
 * Admin action to create a new Staff account
 */
export async function adminCreateStaffAction(formData: FormData): Promise<ActionResponse> {
  try {
    const requester = await getMeAction();
    if (!requester.success || requester.user?.role !== "admin") {
      return { success: false, message: "Chỉ quản trị viên mới được phép thực hiện hành động này." };
    }

    const fullName = formData.get("fullName")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const password = formData.get("password")?.toString() || "";

    if (!fullName || !email || !phone || !password) {
      return { success: false, message: "Vui lòng nhập đầy đủ thông tin bắt buộc." };
    }

    const users = await getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: "Email này đã được đăng ký bởi tài khoản khác." };
    }

    await saveUser({
      full_name: fullName,
      email,
      phone,
      password: hashPassword(password),
      avatar: "",
      role: "staff",
      status: "active",
    });

    return {
      success: true,
      message: "Tạo tài khoản nhân viên thành công!",
    };
  } catch (error) {
    console.error("Error in adminCreateStaffAction:", error);
    return { success: false, message: "Có lỗi xảy ra khi tạo tài khoản nhân viên." };
  }
}

/**
 * Server action to create a test drive appointment
 */
export async function createAppointmentAction(formData: FormData): Promise<ActionResponse> {
  try {
    const customerName = formData.get("customerName")?.toString().trim() || "";
    const customerPhone = formData.get("customerPhone")?.toString().trim() || "";
    const customerEmail = formData.get("customerEmail")?.toString().trim() || "";
    const carId = formData.get("carId")?.toString().trim() || "";
    const dateStr = formData.get("date")?.toString().trim() || "";
    const timeStr = formData.get("time")?.toString().trim() || "";
    const note = formData.get("note")?.toString().trim() || "";
    // Resolve authenticated customer session
    let userId: string | null = null;
    try {
      const me = await getMeAction();
      if (me.success && me.user && me.user.role === "customer") {
        userId = me.user.id;
      }
    } catch (e) {
      console.error("Error resolving session user in createAppointmentAction:", e);
    }

    const errors: Record<string, string> = {};

    if (!customerName) {
      errors.customerName = "Họ tên là bắt buộc";
    }

    const cleanedPhone = customerPhone.replace(/[\s.-]/g, "");
    if (!customerPhone) {
      errors.customerPhone = "Số điện thoại là bắt buộc";
    } else {
      const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        errors.customerPhone = "Số điện thoại không đúng định dạng (ví dụ: 0909888668)";
      }
    }

    if (!customerEmail) {
      errors.customerEmail = "Email là bắt buộc";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        errors.customerEmail = "Email không đúng định dạng";
      }
    }

    if (!carId) {
      errors.carId = "Vui lòng chọn xe quan tâm";
    }

    if (!dateStr) {
      errors.date = "Vui lòng chọn ngày hẹn";
    }

    if (!timeStr) {
      errors.time = "Vui lòng chọn giờ hẹn";
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Thông tin đặt lịch không hợp lệ. Vui lòng kiểm tra lại.",
        errors,
      };
    }

    // --- Advanced validations ---

    // 1. Parse hour from time string (e.g., "08:00" → 8)
    const hourMatch = timeStr.match(/^(\d{1,2}):/);
    const selectedHour = hourMatch ? parseInt(hourMatch[1], 10) : -1;

    // 2. Validate working hours (08:00 – 18:00, excluding 12:00 – 14:00 lunch break)
    const validHours = [8, 9, 10, 11, 14, 15, 16, 17];
    if (!validHours.includes(selectedHour)) {
      return {
        success: false,
        message: "Giờ hẹn không nằm trong khung giờ làm việc (08:00–12:00, 14:00–18:00).",
        errors: { time: "Giờ hẹn không hợp lệ" },
      };
    }

    // 3. Validate future date/time
    const appointmentDt = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();
    if (isNaN(appointmentDt.getTime()) || appointmentDt <= now) {
      return {
        success: false,
        message: "Ngày và giờ hẹn phải trong tương lai.",
        errors: { date: "Thời gian hẹn đã qua" },
      };
    }

    // 4. Validate slot limit (max 3 per hour)
    const pool = getPool();
    const [slotRows] = await pool.query(
      `SELECT COUNT(*) as cnt FROM appointments
       WHERE DATE(appointment_date) = ?
         AND HOUR(appointment_date) = ?
         AND status != 'cancelled';`,
      [dateStr, selectedHour]
    );
    const slotCount = ((slotRows as any[])[0]?.cnt as number) || 0;
    if (slotCount >= 3) {
      return {
        success: false,
        message: "Khung giờ này đã hết chỗ. Vui lòng chọn giờ khác.",
        errors: { time: "Khung giờ đã đạt giới hạn (3/3)" },
      };
    }

    // --- CRM Resolution & Sync ---
    let customerId = "";
    try {
      if (userId) {
        // Case 2: Logged in customer
        const [existingByUser] = await pool.query(
          "SELECT id FROM customers WHERE user_id = ? LIMIT 1;",
          [userId]
        );
        const rowsByUser = existingByUser as any[];
        if (rowsByUser.length > 0) {
          customerId = rowsByUser[0].id;
          // Update details
          await pool.query(
            "UPDATE customers SET full_name = ?, phone = ?, email = ?, interested_car_id = ?, stage = 'test_drive', updated_at = NOW() WHERE id = ?;",
            [customerName.trim(), cleanedPhone, customerEmail.trim(), carId, customerId]
          );
        } else {
          // Check by phone or email
          const [existingByContact] = await pool.query(
            "SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;",
            [cleanedPhone, customerEmail.trim()]
          );
          const rowsByContact = existingByContact as any[];
          if (rowsByContact.length > 0) {
            customerId = rowsByContact[0].id;
            await pool.query(
              "UPDATE customers SET user_id = ?, full_name = ?, phone = ?, email = ?, interested_car_id = ?, stage = 'test_drive', updated_at = NOW() WHERE id = ?;",
              [userId, customerName.trim(), cleanedPhone, customerEmail.trim(), carId, customerId]
            );
          } else {
            // Create new linked customer
            customerId = crypto.randomUUID();
            await pool.query(
              `INSERT INTO customers (id, user_id, full_name, phone, email, interested_car_id, stage, source, status)
               VALUES (?, ?, ?, ?, ?, ?, 'test_drive', 'website', 'active');`,
              [customerId, userId, customerName.trim(), cleanedPhone, customerEmail.trim(), carId]
            );
          }
        }
      } else {
        // Case 1: Guest customer (Khách vãng lai)
        const [existingByContact] = await pool.query(
          "SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;",
          [cleanedPhone, customerEmail.trim()]
        );
        const rowsByContact = existingByContact as any[];
        if (rowsByContact.length > 0) {
          customerId = rowsByContact[0].id;
          await pool.query(
            "UPDATE customers SET full_name = ?, phone = ?, email = ?, interested_car_id = ?, stage = 'test_drive', updated_at = NOW() WHERE id = ?;",
            [customerName.trim(), cleanedPhone, customerEmail.trim(), carId, customerId]
          );
        } else {
          // Create new guest customer with stage = 'lead'
          customerId = crypto.randomUUID();
          await pool.query(
            `INSERT INTO customers (id, user_id, full_name, phone, email, interested_car_id, stage, source, status)
             VALUES (?, NULL, ?, ?, ?, ?, 'lead', 'website', 'active');`,
            [customerId, customerName.trim(), cleanedPhone, customerEmail.trim(), carId]
          );
          // Update stage to test_drive
          await pool.query(
            "UPDATE customers SET stage = 'test_drive' WHERE id = ?;",
            [customerId]
          );
        }
      }

      // Add timeline note
      await pool.query(
        "INSERT INTO customer_notes (id, customer_id, staff_id, content) VALUES (?, ?, ?, ?);",
        [
          crypto.randomUUID(),
          customerId,
          "a0000000-0000-0000-0000-000000000001", // Admin fallback
          `Khách hàng đặt lịch xem xe mới qua website. Ghi chú: "${note || "Không có"}"`
        ]
      );
    } catch (crmErr) {
      console.error("CRM Sync Error in createAppointmentAction:", crmErr);
      // Fallback to avoid breaking booking flow
      customerId = crypto.randomUUID();
      await pool.query(
        "INSERT IGNORE INTO customers (id, full_name, phone, email, stage, source, status) VALUES (?, ?, ?, ?, 'test_drive', 'website', 'active');",
        [customerId, customerName.trim(), cleanedPhone, customerEmail.trim()]
      );
    }

    // --- Save appointment ---
    const appointmentDate = appointmentDt.toISOString();

    const savedAppt = await saveAppointment({
      car_id: carId,
      customer_id: customerId,
      user_id: userId || null,
      // Snapshot: capture form data at booking time — never changes
      customer_snapshot_name: customerName.trim(),
      customer_snapshot_email: customerEmail.trim(),
      customer_snapshot_phone: cleanedPhone,
      appointment_date: appointmentDate,
      note,
      status: "pending",
      // Convenience aliases (same values as snapshot)
      customer_name: customerName.trim(),
      customer_phone: cleanedPhone,
      customer_email: customerEmail.trim(),
    });

    // --- Insert admin notification ---
    try {
      const formattedDate = `${dateStr} lúc ${timeStr}`;
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, content, link, is_read, created_at)
         VALUES (?, NULL, ?, ?, ?, 0, NOW());`,
        [
          crypto.randomUUID(),
          "Lịch hẹn mới",
          `${customerName} đăng ký xem xe lúc ${formattedDate}`,
          "/admin/appointments",
        ]
      );
    } catch (notifErr) {
      console.error("Notification insert error:", notifErr);
    }

    // --- Fetch car name & showroom address for email ---
    let carName = "Chưa rõ";
    let showroomAddress = "Showroom TQ Auto";
    if (carId) {
      try {
        const car = await getCarById(carId);
        if (car) {
          carName = car.title || `${car.brand} ${car.model} ${car.year}`;
          showroomAddress = car.address || "Showroom TQ Auto";
        }
      } catch (carErr) {
        console.error("Error fetching car name for appointment email:", carErr);
      }
    }

    // --- Send email notifications (wrapped in try-catch so it won't fail the booking flow if SMTP fails) ---
    try {
      if (process.env.EMAIL_USER) {
        const { sendAppointmentNotificationToAdmin } = await import("@/lib/mailer");
        
        // Send notification to admin (no confirmation receipt is sent to the customer until approved)
        await sendAppointmentNotificationToAdmin({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          dateStr,
          timeStr,
          phone: cleanedPhone,
          note,
          carName,
          showroomAddress,
        });
        console.log("Admin appointment notification email sent successfully");
      }
    } catch (emailErr) {
      console.error("Mailer failed silently in createAppointmentAction:", emailErr);
    }

    return {
      success: true,
      message: "Đặt lịch xem xe thành công! Chúng tôi sẽ liên hệ lại sớm nhất.",
      appointmentId: savedAppt.id,
    };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Server action to update an appointment's status (for admins)
 */
export async function updateAppointmentStatusAction(
  id: string,
  status: "pending" | "confirmed" | "cancelled" | "completed"
): Promise<ActionResponse> {
  try {
    const success = await updateAppointmentStatus(id, status);
    if (success) {
      // Trigger customer notification in database
      try {
        const appointment = await getAppointmentById(id);
        if (appointment && appointment.user_id) {
          const pool = getPool();
          let carName = "Xe quan tâm";
          if (appointment.car_id) {
            const car = await getCarById(appointment.car_id);
            if (car) {
              carName = `${car.brand} ${car.model} ${car.year}`;
            }
          }
          
          let title = "";
          let content = "";
          if (status === "confirmed") {
            title = "Lịch hẹn đã được xác nhận";
            content = `Lịch hẹn xem xe ${carName} của bạn đã được showroom xác nhận.`;
          } else if (status === "cancelled") {
            title = "Lịch hẹn đã bị hủy";
            content = `Lịch hẹn xem xe ${carName} của bạn đã bị hủy.`;
          } else if (status === "completed") {
            title = "Lịch hẹn đã hoàn thành";
            content = `Cảm ơn bạn đã đến xem xe ${carName}. Lịch hẹn đã hoàn thành.`;
          }

          if (title && content) {
            await pool.query(
              `INSERT INTO notifications (id, user_id, title, content, link, is_read, created_at)
               VALUES (?, ?, ?, ?, ?, 0, NOW());`,
              [
                crypto.randomUUID(),
                appointment.user_id,
                title,
                content,
                "/profile/appointments"
              ]
            );
          }
        }
      } catch (notifErr) {
        console.error("Error inserting customer notification on status change:", notifErr);
      }
      if ((status === "confirmed" || status === "cancelled") && process.env.EMAIL_USER) {
        try {
          const appointment = await getAppointmentById(id);
          if (appointment) {
            let carName = "Xe quan tâm";
            let showroomAddress = "Showroom TQ Auto";
            if (appointment.car_id) {
              const car = await getCarById(appointment.car_id);
              if (car) {
                carName = car.title || `${car.brand} ${car.model} ${car.year}`;
                showroomAddress = car.address || "Showroom TQ Auto";
              }
            }

            let formattedDate = appointment.appointment_date;
            try {
              const dateObj = new Date(appointment.appointment_date);
              const day = String(dateObj.getDate()).padStart(2, "0");
              const month = String(dateObj.getMonth() + 1).padStart(2, "0");
              const year = dateObj.getFullYear();
              const hours = String(dateObj.getHours()).padStart(2, "0");
              const minutes = String(dateObj.getMinutes()).padStart(2, "0");
              formattedDate = `${hours}:${minutes} ngày ${day}/${month}/${year}`;
            } catch (e) {
              formattedDate = appointment.appointment_date;
            }

            if (status === "confirmed") {
              const { sendAppointmentConfirmationEmail } = await import("@/lib/mailer");
              await sendAppointmentConfirmationEmail({
                customerName: appointment.customer_name,
                customerEmail: appointment.customer_email,
                carName,
                formattedDate,
                showroomAddress,
                customerPhone: appointment.customer_phone,
              });
              console.log("Appointment confirmation email sent successfully to", appointment.customer_email);
            } else {
              const { sendAppointmentCancelledEmail } = await import("@/lib/mailer");
              await sendAppointmentCancelledEmail({
                customerName: appointment.customer_name,
                customerEmail: appointment.customer_email,
                carName,
                formattedDate,
                showroomAddress,
                customerPhone: appointment.customer_phone,
              });
              console.log("Appointment cancellation email sent successfully to", appointment.customer_email);
            }
          }
        } catch (emailErr) {
          console.error("Nodemailer email error in appointment status update:", emailErr);
        }
      }

      return {
        success: true,
        message: `Cập nhật trạng thái lịch hẹn thành công!`,
      };
    }
    return {
      success: false,
      message: "Không tìm thấy lịch hẹn hoặc cập nhật thất bại.",
    };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi cập nhật lịch hẹn.",
    };
  }
}

/**
 * Update the logged-in customer's profile details
 */
export async function updateCustomerProfileAction(formData: FormData): Promise<ActionResponse & { user?: UiUser }> {
  try {
    const requester = await getMeAction();
    if (!requester.success || !requester.user) {
      return { success: false, message: "Bạn chưa đăng nhập." };
    }

    const fullName = formData.get("fullName")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const avatar = formData.get("avatar")?.toString() || undefined;

    if (!fullName || !phone || !email) {
      return { success: false, message: "Họ tên, điện thoại và email là bắt buộc." };
    }

    // Check if email taken by someone else
    const users = await getUsers();
    const isEmailTaken = users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== requester.user!.id
    );
    if (isEmailTaken) {
      return { success: false, message: "Email này đã được sử dụng bởi tài khoản khác." };
    }

    let finalAvatar = avatar;

    if (avatar && avatar.startsWith("data:image/")) {
      try {
        const matches = avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileType = matches[1]; // e.g. "image/png"
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          // Determine extension
          let extension = "png";
          if (fileType.includes("jpeg") || fileType.includes("jpg")) extension = "jpg";
          else if (fileType.includes("gif")) extension = "gif";
          else if (fileType.includes("webp")) extension = "webp";

          const fs = require("fs");
          const path = require("path");

          const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const fileName = `${requester.user.id}.${extension}`;
          const filePath = path.join(uploadDir, fileName);

          fs.writeFileSync(filePath, buffer);
          finalAvatar = `/uploads/avatars/${fileName}?v=${Date.now()}`;
        }
      } catch (err) {
        console.error("Failed to save avatar image to disk:", err);
      }
    }

    const success = await updateUserProfile(requester.user.id, fullName, phone, email, finalAvatar);
    if (success) {
      // Re-sign token with updated info and set cookie
      const token = await signToken({
        id: requester.user.id,
        email,
        role: requester.user.role,
        name: fullName,
      });

      const cookieStore = await cookies();
      cookieStore.set("tq_auto_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return {
        success: true,
        message: "Cập nhật thông tin thành công!",
        user: {
          id: requester.user.id,
          name: fullName,
          email,
          phone,
          role: requester.user.role,
          avatar: finalAvatar !== undefined ? finalAvatar : requester.user.avatar,
        },
      };
    }

    return { success: false, message: "Không có thay đổi nào được thực hiện hoặc cập nhật thất bại." };
  } catch (error) {
    console.error("Error updating customer profile:", error);
    return { success: false, message: "Có lỗi xảy ra khi cập nhật thông tin." };
  }
}



/**
 * Get test drive appointments for the current customer
 */
export async function getMeAppointmentsAction(): Promise<{ success: boolean; appointments?: any[] }> {
  try {
    const requester = await getMeAction();
    if (!requester.success || !requester.user) {
      return { success: false };
    }

    const appointments = await getAppointmentsByUserId(requester.user.id);
    const enrichedAppointments = [];

    for (const apt of appointments) {
      let carDetails = null;
      if (apt.car_id) {
        const car = await getCarById(apt.car_id);
        if (car) {
          carDetails = {
            title: car.title,
            brand: car.brand,
            model: car.model,
            year: car.year,
            thumbnail: car.thumbnail,
            city: car.city,
            address: car.address
          };
        }
      }
      enrichedAppointments.push({
        ...apt,
        car: carDetails
      });
    }

    return { success: true, appointments: enrichedAppointments };
  } catch (error) {
    console.error("Error getting user appointments:", error);
    return { success: false };
  }
}

/**
 * Admin action to fetch all users
 */
export async function adminGetUsersAction(): Promise<{ success: boolean; users?: DbUser[]; message?: string }> {
  try {
    const requester = await getMeAction();
    if (!requester.success || requester.user?.role !== "admin") {
      return { success: false, message: "Chỉ quản trị viên mới được phép thực hiện hành động này." };
    }

    const users = await getUsers();
    return { success: true, users };
  } catch (error) {
    console.error("Error in adminGetUsersAction:", error);
    return { success: false, message: "Có lỗi xảy ra khi tải danh sách người dùng." };
  }
}

/**
 * Server action to let a customer change their password
 */
export async function changeCustomerPasswordAction(formData: FormData): Promise<ActionResponse> {
  try {
    const requester = await getMeAction();
    if (!requester.success || !requester.user) {
      return { success: false, message: "Bạn chưa đăng nhập." };
    }

    const currentPassword = formData.get("currentPassword")?.toString() || "";
    const newPassword = formData.get("newPassword")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, message: "Vui lòng điền đầy đủ tất cả các trường." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "Mật khẩu xác nhận không khớp." };
    }

    // Verify current password
    const pool = getPool();
    const [rows] = await pool.query("SELECT password FROM users WHERE id = ? LIMIT 1;", [requester.user.id]);
    const userList = rows as any[];
    if (userList.length === 0) {
      return { success: false, message: "Không tìm thấy tài khoản." };
    }

    const currentHash = hashPassword(currentPassword);
    if (userList[0].password !== currentHash) {
      return { success: false, message: "Mật khẩu hiện tại không đúng." };
    }

    // Update password
    const newHash = hashPassword(newPassword);
    await pool.query("UPDATE users SET password = ? WHERE id = ?;", [newHash, requester.user.id]);

    return {
      success: true,
      message: "Đổi mật khẩu thành công!",
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, message: "Có lỗi xảy ra khi đổi mật khẩu." };
  }
}

/**
 * Server action to cancel a customer's own appointment
 */
export async function cancelAppointmentByCustomerAction(id: string): Promise<ActionResponse> {
  try {
    const requester = await getMeAction();
    if (!requester.success || !requester.user) {
      return { success: false, message: "Bạn cần đăng nhập để thực hiện hành động này." };
    }

    const appointment = await getAppointmentById(id);
    if (!appointment) {
      return { success: false, message: "Lịch hẹn không tồn tại." };
    }

    // Verify ownership: direct user_id match or matching via CRM customer record linked to user
    const isOwner = appointment.user_id === requester.user.id;
    let isCrmOwner = false;
    const pool = getPool();
    if (!isOwner && appointment.customer_id) {
      const [custRows] = await pool.query(
        "SELECT id FROM customers WHERE id = ? AND user_id = ? LIMIT 1;",
        [appointment.customer_id, requester.user.id]
      );
      if ((custRows as any[]).length > 0) {
        isCrmOwner = true;
      }
    }

    if (!isOwner && !isCrmOwner) {
      return { success: false, message: "Bạn không có quyền hủy lịch hẹn này." };
    }

    // Check status
    if (appointment.status !== "pending" && appointment.status !== "confirmed") {
      return { success: false, message: "Chỉ có thể hủy lịch hẹn đang chờ xác nhận hoặc đã xác nhận." };
    }

    // Update status
    const success = await updateAppointmentStatus(id, "cancelled");
    if (!success) {
      return { success: false, message: "Không thể cập nhật trạng thái lịch hẹn." };
    }

    // Insert notifications
    try {
      let carName = "Xe quan tâm";
      if (appointment.car_id) {
        const car = await getCarById(appointment.car_id);
        if (car) {
          carName = car.title || `${car.brand} ${car.model} ${car.year}`;
        }
      }

      // Notification for admin
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, content, link, is_read, created_at)
         VALUES (?, NULL, ?, ?, ?, 0, NOW());`,
        [
          crypto.randomUUID(),
          "Lịch hẹn bị hủy bởi khách",
          `Khách hàng ${appointment.customer_snapshot_name || appointment.customer_name} đã hủy lịch hẹn xem xe ${carName}`,
          "/admin/appointments",
        ]
      );

      // Notification for customer
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, content, link, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, 0, NOW());`,
        [
          crypto.randomUUID(),
          requester.user.id,
          "Lịch hẹn đã bị hủy",
          `Bạn đã hủy lịch hẹn xem xe ${carName} thành công.`,
          "/profile/appointments"
        ]
      );
    } catch (notifErr) {
      console.error("Error creating notifications for customer cancellation:", notifErr);
    }

    // Send emails
    if (process.env.EMAIL_USER) {
      try {
        let carName = "Xe quan tâm";
        let showroomAddress = "Showroom TQ Auto";
        if (appointment.car_id) {
          const car = await getCarById(appointment.car_id);
          if (car) {
            carName = car.title || `${car.brand} ${car.model} ${car.year}`;
            showroomAddress = car.address || "Showroom TQ Auto";
          }
        }

        let formattedDate = appointment.appointment_date;
        try {
          const dateObj = new Date(appointment.appointment_date);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const year = dateObj.getFullYear();
          const hours = String(dateObj.getHours()).padStart(2, "0");
          const minutes = String(dateObj.getMinutes()).padStart(2, "0");
          formattedDate = `${hours}:${minutes} ngày ${day}/${month}/${year}`;
        } catch (e) {
          formattedDate = appointment.appointment_date;
        }

        // Send to customer
        const { sendAppointmentCancelledEmail, sendAppointmentCancelledAdminEmail } = await import("@/lib/mailer");
        await sendAppointmentCancelledEmail({
          customerName: appointment.customer_snapshot_name || appointment.customer_name,
          customerEmail: appointment.customer_snapshot_email || appointment.customer_email,
          carName,
          formattedDate,
          showroomAddress,
          customerPhone: appointment.customer_snapshot_phone || appointment.customer_phone,
        });

        // Send to admin
        await sendAppointmentCancelledAdminEmail({
          customerName: appointment.customer_snapshot_name || appointment.customer_name,
          customerEmail: appointment.customer_snapshot_email || appointment.customer_email,
          carName,
          formattedDate,
          showroomAddress,
          customerPhone: appointment.customer_snapshot_phone || appointment.customer_phone,
          note: appointment.note,
        });

        console.log("Customer cancellation emails sent successfully.");
      } catch (emailErr) {
        console.error("Error sending cancellation emails:", emailErr);
      }
    }

    return {
      success: true,
      message: "Hủy lịch hẹn thành công!",
    };
  } catch (error) {
    console.error("Error in cancelAppointmentByCustomerAction:", error);
    return { success: false, message: "Có lỗi xảy ra khi hủy lịch hẹn." };
  }
}

