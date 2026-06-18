import { createCrmLead } from "../../database/lead.repository";

interface CreateLeadParams {
  name: string;
  phone: string;
  email?: string;
  interestedCar?: string; // car ID or car title
  message?: string;
}

export async function createLead(params: CreateLeadParams) {
  const { name, phone, email, interestedCar, message } = params;

  const res = await createCrmLead({
    name,
    phone,
    email,
    interestedCarId: interestedCar || null,
    message: message || "Đăng ký tư vấn trực tiếp từ AI Chatbot.",
  });

  return {
    success: true,
    message: "Lưu thông tin khách hàng CRM thành công!",
    customerId: res.customerId,
    isNew: res.isNew,
  };
}
