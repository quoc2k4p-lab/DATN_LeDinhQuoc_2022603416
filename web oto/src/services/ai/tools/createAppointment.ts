import { createCrmAppointment } from "../../database/lead.repository";

interface CreateAppointmentParams {
  carId: string;
  customerName: string;
  phone: string;
  email: string;
  date: string; // ISO string format
  note?: string;
}

export async function createAppointment(params: CreateAppointmentParams) {
  const { carId, customerName, phone, email, date, note } = params;

  try {
    const appointmentId = await createCrmAppointment({
      carId,
      customerName,
      phone,
      email,
      appointmentDate: date,
      note: note || "Đặt lịch hẹn xem xe qua AI Chatbot.",
    });

    return {
      success: true,
      message: "Đặt lịch hẹn xem xe thành công!",
      appointmentId,
    };
  } catch (err: any) {
    console.error("Error creating appointment via tool:", err);
    return {
      success: false,
      message: `Không thể tạo lịch hẹn: ${err.message}`,
    };
  }
}
