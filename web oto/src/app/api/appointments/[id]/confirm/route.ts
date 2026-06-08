import { NextResponse } from "next/server";
import { getAppointmentById, getCarById, updateAppointmentStatus } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Mã lịch hẹn (ID) không được để trống" },
        { status: 400 }
      );
    }

    // 1. Retrieve the appointment
    const appointment = await getAppointmentById(id);
    if (!appointment) {
      return NextResponse.json(
        { error: "Không tìm thấy lịch hẹn trong hệ thống" },
        { status: 404 }
      );
    }

    // 2. Validate current status
    if (appointment.status !== "pending") {
      return NextResponse.json(
        { error: `Không thể xác nhận lịch hẹn ở trạng thái: ${appointment.status}` },
        { status: 400 }
      );
    }

    // 3. Update appointment status to 'confirmed'
    const updated = await updateAppointmentStatus(id, "confirmed");
    if (!updated) {
      return NextResponse.json(
        { error: "Cập nhật trạng thái lịch hẹn thất bại trong cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    // 4. Retrieve associated car details for the email content
    const car = await getCarById(appointment.car_id);
    const carName = car ? car.title : "Xe đã ẩn/xóa";
    const showroomAddress = car ? car.address : "Showroom TQ Auto, TP. Hồ Chí Minh";

    // 5. Format appointment date nicely (Vietnamese locale format)
    let formattedDate = "";
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

    // 6. Send email using Nodemailer (wrapped in try-catch so it won't block DB update if email fails)
    let emailSent = false;
    let emailError = "";

    try {
      const { sendAppointmentConfirmationEmail } = await import("@/lib/mailer");
      const emailResult = await sendAppointmentConfirmationEmail({
        customerName: appointment.customer_name,
        customerEmail: appointment.customer_email,
        carName,
        formattedDate,
        showroomAddress,
        customerPhone: appointment.customer_phone,
      });
      emailSent = true;
      console.log("Nodemailer confirmation email sent successfully:", emailResult);
    } catch (emailErr: any) {
      console.error("Nodemailer failed to send email:", emailErr);
      emailError = emailErr?.message || String(emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Xác nhận lịch hẹn thành công!",
      appointmentId: id,
      emailSent,
      emailError: emailError || null,
    });

  } catch (error: any) {
    console.error("Error in confirm appointment API route:", error);
    return NextResponse.json(
      { error: error?.message || "Có lỗi xảy ra trong quá trình xác nhận lịch hẹn" },
      { status: 500 }
    );
  }
}
