export type CustomerStage =
  | "new_lead"
  | "consulting"
  | "appointment"
  | "quotation"
  | "negotiating"
  | "reserved"
  | "purchased"
  | "follow_up";

export const STAGE_LABELS: Record<CustomerStage, string> = {
  new_lead: "LEAD MỚI",
  consulting: "ĐANG TƯ VẤN",
  appointment: "ĐẶT LỊCH XEM XE",
  quotation: "BÁO GIÁ",
  negotiating: "THƯƠNG LƯỢNG",
  reserved: "GIỮ CHỖ",
  purchased: "ĐÃ MUA XE",
  follow_up: "CHĂM SÓC LẠI",
};

export const STAGE_COLORS: Record<CustomerStage, string> = {
  new_lead: "bg-red-500/15 text-red-500 border-red-500/30",
  consulting: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  appointment: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  quotation: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  negotiating: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
  reserved: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  purchased: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  follow_up: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};
