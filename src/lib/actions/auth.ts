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
  toggleFavorite,
  getUserFavorites,
  isFavorite,
  getCarReviews,
  addCarReview,
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

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log(`\n\n========================================\n[PASSWORD RESET LINK]: ${resetLink}\n========================================\n\n`);

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
    const userId = formData.get("userId")?.toString().trim() || null;

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

    // --- Save appointment ---
    const appointmentDate = appointmentDt.toISOString();

    await saveAppointment({
      car_id: carId,
      user_id: userId || null,
      customer_name: customerName,
      customer_phone: cleanedPhone,
      customer_email: customerEmail,
      appointment_date: appointmentDate,
      note,
      status: "pending",
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

    // CRM Integration: Sync appointment to customers table
    try {
      // Check if customer already exists by phone or email
      const [existing] = await pool.query(
        "SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1;",
        [cleanedPhone, customerEmail.trim()]
      );
      
      const existingList = existing as any[];
      if (existingList.length > 0) {
        const customerId = existingList[0].id;
        
        // Update customer stage and interested vehicle
        await pool.query(
          `UPDATE customers 
           SET interested_car_id = ?, stage = 'appointment', updated_at = NOW() 
           WHERE id = ?;`,
          [carId, customerId]
        );
        
        // Add note to history
        await pool.query(
          `INSERT INTO customer_notes (id, customer_id, staff_id, content) 
           VALUES (?, ?, ?, ?);`,
          [
            crypto.randomUUID(), 
            customerId, 
            userId || "a0000000-0000-0000-0000-000000000001", // Default admin fallback
            `Khách hàng đặt lịch xem xe mới qua website. Ghi chú khách gửi: "${note || "Không có"}"`
          ]
        );
      } else {
        const newCustomerId = crypto.randomUUID();
        
        // Insert new customer lead
        await pool.query(
          `INSERT INTO customers (id, full_name, phone, email, interested_car_id, budget, stage, note, assigned_staff_id, source, status, session_id)
           VALUES (?, ?, ?, ?, ?, NULL, 'appointment', ?, NULL, 'website', 'active', ?);`,
          [
            newCustomerId,
            customerName.trim(),
            cleanedPhone,
            customerEmail.trim(),
            carId,
            note || "Đăng ký xem xe qua website.",
            userId || null
          ]
        );
        
        // Add note to history
        await pool.query(
          `INSERT INTO customer_notes (id, customer_id, staff_id, content) 
           VALUES (?, ?, ?, ?);`,
          [
            crypto.randomUUID(), 
            newCustomerId, 
            userId || "a0000000-0000-0000-0000-000000000001", 
            `Tạo khách hàng mới từ hệ thống đặt lịch xem xe. Ghi chú: "${note || "Không có"}"`
          ]
        );
      }
    } catch (crmErr) {
      console.error("CRM Integration Error in createAppointmentAction:", crmErr);
    }

    return {
      success: true,
      message: "Đặt lịch xem xe thành công! Chúng tôi sẽ liên hệ lại sớm nhất.",
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
      if (status === "cancelled" && process.env.EMAIL_USER) {
        try {
          const appointment = await getAppointmentById(id);
          if (appointment) {
            let carName = "Xe quan tâm";
            if (appointment.car_id) {
              const car = await getCarById(appointment.car_id);
              if (car) {
                carName = `${car.brand} ${car.model} ${car.year}`;
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

            const showroomAddress = "Showroom TQ Auto, TP. Hồ Chí Minh & Hà Nội";

            const { sendAppointmentCancelledEmail } = await import("@/lib/mailer");
            await sendAppointmentCancelledEmail({
              customerName: appointment.customer_name,
              customerEmail: appointment.customer_email,
              carName,
              formattedDate,
              showroomAddress,
              customerPhone: appointment.customer_phone,
            });
          }
        } catch (emailErr) {
          console.error("Nodemailer email error in appointment cancellation:", emailErr);
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

    const success = await updateUserProfile(requester.user.id, fullName, phone, email, avatar);
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
          avatar: avatar !== undefined ? avatar : requester.user.avatar,
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
 * Toggle a car in the customer's favorites list
 */
export async function toggleFavoriteAction(carId: string): Promise<ActionResponse & { isFavorite?: boolean }> {
  try {
    const requester = await getMeAction();
    if (!requester.success || !requester.user) {
      return { success: false, message: "Vui lòng đăng nhập để lưu xe yêu thích." };
    }

    const isFav = await toggleFavorite(requester.user.id, carId);
    return {
      success: true,
      isFavorite: isFav,
      message: isFav ? "Đã thêm vào danh sách yêu thích!" : "Đã xóa khỏi danh sách yêu thích.",
    };
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return { success: false, message: "Không thể thực hiện hành động này lúc này." };
  }
}

/**
 * Get all favorite cars for the logged-in customer
 */
export async function getUserFavoritesAction(): Promise<{ success: boolean; favorites?: any[] }> {
  try {
    const requester = await getMeAction();
    if (!requester.success || !requester.user) {
      return { success: false };
    }

    const favorites = await getUserFavorites(requester.user.id);
    return { success: true, favorites };
  } catch (error) {
    console.error("Error getting user favorites:", error);
    return { success: false };
  }
}

/**
 * Check if a car is in the customer's favorites list
 */
export async function isCarFavoriteAction(carId: string): Promise<boolean> {
  try {
    const requester = await getMeAction();
    if (!requester.success || !requester.user) {
      return false;
    }

    return await isFavorite(requester.user.id, carId);
  } catch (error) {
    return false;
  }
}

/**
 * Get reviews for a specific car
 */
export async function getCarReviewsAction(carId: string): Promise<{ success: boolean; reviews?: any[] }> {
  try {
    const reviews = await getCarReviews(carId);
    return { success: true, reviews };
  } catch (error) {
    console.error("Error getting car reviews:", error);
    return { success: false };
  }
}

/**
 * Add a review/comment for a car
 */
export async function addCarReviewAction(
  carId: string,
  rating: number,
  comment: string
): Promise<ActionResponse & { review?: any }> {
  try {
    const requester = await getMeAction();
    if (!requester.success || !requester.user) {
      return { success: false, message: "Bạn phải đăng nhập để viết đánh giá." };
    }

    if (!rating || rating < 1 || rating > 5) {
      return { success: false, message: "Đánh giá sao phải từ 1 đến 5." };
    }

    if (!comment.trim()) {
      return { success: false, message: "Nội dung nhận xét không được để trống." };
    }

    const review = await addCarReview(requester.user.id, carId, rating, comment.trim());
    return {
      success: true,
      message: "Gửi nhận xét thành công!",
      review: {
        ...review,
        full_name: requester.user.name,
      },
    };
  } catch (error) {
    console.error("Error adding review:", error);
    return { success: false, message: "Không thể gửi nhận xét. Vui lòng thử lại sau." };
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
