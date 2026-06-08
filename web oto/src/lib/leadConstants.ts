export type ConsultationType =
  | "buy_car"
  | "bank_loan"
  | "new_arrival"
  | "trade_in"
  | "appointment"
  | "quotation"
  | "technical_support"
  | "other";

export const CONSULTATION_TYPE_LABELS: Record<string, string> = {
  "Tư vấn mua xe": "buy_car",
  "Trả góp ngân hàng": "bank_loan",
  "Xe mới về": "new_arrival",
  "Định giá xe cũ": "trade_in",
  "Đặt lịch xem xe": "appointment",
  "Báo giá xe": "quotation",
  "Hỗ trợ kỹ thuật": "technical_support",
  "Khác": "other",
};

export const REVERSE_TYPE_LABELS: Record<ConsultationType, string> = {
  buy_car: "Tư vấn mua xe",
  bank_loan: "Trả góp ngân hàng",
  new_arrival: "Xe mới về",
  trade_in: "Định giá xe cũ",
  appointment: "Đặt lịch xem xe",
  quotation: "Báo giá xe",
  technical_support: "Hỗ trợ kỹ thuật",
  other: "Khác",
};

export const LEAD_STAGE_LABELS: Record<string, string> = {
  new_lead: "Lead mới",
  assigned: "Đã phân công",
  consulting: "Đang tư vấn",
  appointment: "Đã đặt lịch",
  quotation: "Đã báo giá",
  purchased: "Đã mua xe",
  closed: "Đã đóng",
};

export const LEAD_STAGE_COLORS: Record<string, string> = {
  new_lead: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  assigned: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  consulting: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  appointment: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  quotation: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  purchased: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
};

export interface ContactRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  consultation_type: string;
  message: string;
  assigned_staff_id: string | null;
  stage: "new_lead" | "assigned" | "consulting" | "appointment" | "quotation" | "purchased" | "closed";
  status: string;
  created_at: string;
  updated_at: string;
  staff_name?: string | null;
}

export interface LeadFilters {
  search?: string;
  stage?: string;
  assignedStaffId?: string;
}
