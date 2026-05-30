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