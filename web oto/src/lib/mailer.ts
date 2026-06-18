import nodemailer from "nodemailer";
import {
  getAppointmentBookingHtml,
  getAppointmentConfirmationHtml,
  getAppointmentCancelledHtml,
  getContactConfirmationHtml,
} from "./email-template";

// Reusable Transporter setup
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Reusable function to send raw or options-based email via Nodemailer
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const mailFrom = from || `TQ Auto Showroom <${process.env.EMAIL_USER}>`;
  const mailTo = Array.isArray(to) ? to.join(", ") : to;

  console.log(`Sending email using Nodemailer:
    From: ${mailFrom}
    To: ${mailTo}
    Subject: ${subject}`);

  const info = await transporter.sendMail({
    from: mailFrom,
    to: mailTo,
    subject,
    html,
  });

  console.log("Email sent successfully. Message ID:", info.messageId);
  return info;
}

/**
 * Reusable function to send booking receipt to customer when they submit the booking form
 */
export async function sendAppointmentBookingEmail({
  customerName,
  customerEmail,
  dateStr,
  timeStr,
  phone,
  note,
}: {
  customerName: string;
  customerEmail: string;
  dateStr: string;
  timeStr: string;
  phone: string;
  note: string;
}) {
  const html = getAppointmentBookingHtml(customerName, dateStr, timeStr, phone, note);
  return sendEmail({
    to: customerEmail,
    subject: "Xác nhận đặt lịch xem xe - TQ Auto",
    html,
  });
}

/**
 * Reusable function to send appointment confirmation email (when admin confirms)
 */
export async function sendAppointmentConfirmationEmail({
  customerName,
  customerEmail,
  carName,
  formattedDate,
  showroomAddress,
  customerPhone,
}: {
  customerName: string;
  customerEmail: string;
  carName: string;
  formattedDate: string;
  showroomAddress: string;
  customerPhone: string;
}) {
  const html = getAppointmentConfirmationHtml(
    customerName,
    carName,
    formattedDate,
    showroomAddress,
    customerPhone
  );
  return sendEmail({
    to: customerEmail,
    subject: `[TQ Auto] Xác nhận lịch hẹn xem xe ${carName}`,
    html,
  });
}

/**
 * Reusable function to send appointment cancellation email
 */
export async function sendAppointmentCancelledEmail({
  customerName,
  customerEmail,
  carName,
  formattedDate,
  showroomAddress,
  customerPhone,
}: {
  customerName: string;
  customerEmail: string;
  carName: string;
  formattedDate: string;
  showroomAddress: string;
  customerPhone: string;
}) {
  const html = getAppointmentCancelledHtml(
    customerName,
    carName,
    formattedDate,
    showroomAddress,
    customerPhone
  );
  return sendEmail({
    to: customerEmail,
    subject: `[TQ Auto] Lịch hẹn xem xe ${carName} đã hủy`,
    html,
  });
}

/**
 * Reusable function to send contact confirmation email
 */
export async function sendContactConfirmationEmail({
  fullName,
  customerEmail,
  consultationType,
  phone,
  message,
}: {
  fullName: string;
  customerEmail: string;
  consultationType: string;
  phone: string;
  message: string;
}) {
  const html = getContactConfirmationHtml(fullName, consultationType, phone, message);
  return sendEmail({
    to: customerEmail,
    subject: `[TQ Auto] Tiếp nhận yêu cầu tư vấn: ${consultationType}`,
    html,
  });
}

/**
 * Reusable function to send contact notification email to admin
 */
export async function sendContactNotificationToAdmin({
  fullName,
  customerEmail,
  consultationType,
  phone,
  message,
}: {
  fullName: string;
  customerEmail: string;
  consultationType: string;
  phone: string;
  message: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #f4f6f9; color: #1a202c; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background-color: #e31837; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 1px; }
        .content { padding: 30px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: bold; color: #11161d; margin-bottom: 15px; }
        .details { background-color: #f7fafc; border-left: 4px solid #e31837; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        .footer { background-color: #11161d; color: #a0aec0; text-align: center; padding: 20px; font-size: 11px; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #e31837; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>[Hệ thống TQ Auto] Yêu cầu tư vấn mới</h1>
        </div>
        <div class="content">
          <div class="greeting">Chào Ban Quản Trị,</div>
          <p>Hệ thống vừa nhận được một yêu cầu tư vấn mới từ khách hàng qua website. Dưới đây là thông tin chi tiết:</p>
          
          <div class="details">
            <p><strong>Họ và tên:</strong> ${fullName}</p>
            <p><strong>Số điện thoại:</strong> ${phone}</p>
            <p><strong>Email khách hàng:</strong> ${customerEmail}</p>
            <p><strong>Nhu cầu tư vấn:</strong> ${consultationType}</p>
            <p><strong>Nội dung lời nhắn:</strong> ${message}</p>
          </div>
          
          <p>Vui lòng đăng nhập vào trang quản trị để phân công nhân sự hoặc xử lý yêu cầu tư vấn này sớm nhất.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/leads" class="btn">Xem chi tiết trên trang Admin</a>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống TQ Auto. Vui lòng không phản hồi trực tiếp email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "quoc2k4p@gmail.com";
  return sendEmail({
    to: adminEmail,
    subject: `[TQ Auto System] Khách hàng yêu cầu tư vấn: ${fullName} - ${consultationType}`,
    html,
  });
}

/**
 * Reusable function to send booking notification email to admin when a customer schedules a viewing
 */
export async function sendAppointmentNotificationToAdmin({
  customerName,
  customerEmail,
  dateStr,
  timeStr,
  phone,
  note,
  carName,
  showroomAddress,
}: {
  customerName: string;
  customerEmail: string;
  dateStr: string;
  timeStr: string;
  phone: string;
  note: string;
  carName: string;
  showroomAddress?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #f4f6f9; color: #1a202c; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background-color: #e31837; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 1px; }
        .content { padding: 30px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: bold; color: #11161d; margin-bottom: 15px; }
        .details { background-color: #f7fafc; border-left: 4px solid #e31837; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        .footer { background-color: #11161d; color: #a0aec0; text-align: center; padding: 20px; font-size: 11px; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #e31837; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>[Hệ thống TQ Auto] Lịch hẹn xem xe mới</h1>
        </div>
        <div class="content">
          <div class="greeting">Chào Ban Quản Trị,</div>
          <p>Hệ thống vừa nhận được một yêu cầu đặt lịch hẹn xem xe mới từ khách hàng qua website. Dưới đây là thông tin chi tiết:</p>
          
          <div class="details">
            <p><strong>Khách hàng:</strong> ${customerName}</p>
            <p><strong>Số điện thoại:</strong> ${phone}</p>
            <p><strong>Email khách hàng:</strong> ${customerEmail}</p>
            <p><strong>Dòng xe quan tâm:</strong> ${carName}</p>
            <p><strong>Thời gian hẹn:</strong> ${timeStr} ngày ${dateStr}</p>
            <p><strong>Địa điểm xem xe:</strong> ${showroomAddress || "Showroom TQ Auto"}</p>
            <p><strong>Ghi chú từ khách hàng:</strong> ${note || "Không có"}</p>
          </div>
          
          <p>Vui lòng đăng nhập vào trang quản trị để phê duyệt hoặc xử lý lịch hẹn này sớm nhất.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/appointments" class="btn">Xem chi tiết trên trang Admin</a>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống TQ Auto. Vui lòng không phản hồi trực tiếp email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "quoc2k4p@gmail.com";
  return sendEmail({
    to: adminEmail,
    subject: `[TQ Auto System] Lịch hẹn mới từ khách hàng: ${customerName} - ${carName}`,
    html,
  });
}

/**
 * Reusable function to send appointment cancellation email to admin when a customer cancels
 */
export async function sendAppointmentCancelledAdminEmail({
  customerName,
  customerEmail,
  carName,
  formattedDate,
  showroomAddress,
  customerPhone,
  note,
}: {
  customerName: string;
  customerEmail: string;
  carName: string;
  formattedDate: string;
  showroomAddress: string;
  customerPhone: string;
  note: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #f4f6f9; color: #1a202c; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background-color: #e31837; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 1px; }
        .content { padding: 30px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: bold; color: #11161d; margin-bottom: 15px; }
        .details { background-color: #f7fafc; border-left: 4px solid #e31837; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        .footer { background-color: #11161d; color: #a0aec0; text-align: center; padding: 20px; font-size: 11px; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #e31837; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>[Hệ thống TQ Auto] Khách hàng Hủy lịch hẹn</h1>
        </div>
        <div class="content">
          <div class="greeting">Chào Ban Quản Trị,</div>
          <p>Khách hàng đã hủy một yêu cầu đặt lịch hẹn xem xe trên website. Dưới đây là thông tin chi tiết lịch hẹn bị hủy:</p>
          
          <div class="details">
            <p><strong>Khách hàng:</strong> ${customerName}</p>
            <p><strong>Số điện thoại:</strong> ${customerPhone}</p>
            <p><strong>Email khách hàng:</strong> ${customerEmail}</p>
            <p><strong>Dòng xe quan tâm:</strong> ${carName}</p>
            <p><strong>Thời gian hẹn:</strong> ${formattedDate}</p>
            <p><strong>Địa điểm xem xe:</strong> ${showroomAddress}</p>
            <p><strong>Ghi chú từ khách hàng:</strong> ${note || "Không có"}</p>
          </div>
          
          <p>Vui lòng đăng nhập vào trang quản trị để cập nhật thông tin và chăm sóc khách hàng.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/appointments" class="btn">Xem chi tiết trên trang Admin</a>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống TQ Auto. Vui lòng không phản hồi trực tiếp email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "quoc2k4p@gmail.com";
  return sendEmail({
    to: adminEmail,
    subject: `[TQ Auto System] Khách hàng HỦY lịch hẹn: ${customerName} - ${carName}`,
    html,
  });
}