export type CustomerStage =
  | "lead"
  | "contacted"
  | "test_drive"
  | "negotiating"
  | "purchased";

export const STAGE_LABELS: Record<CustomerStage, string> = {
  lead: "LEAD MỚI",
  contacted: "ĐANG TƯ VẤN",
  test_drive: "ĐẶT LỊCH XEM XE",
  negotiating: "THƯƠNG LƯỢNG",
  purchased: "ĐÃ MUA XE",
};

export const STAGE_COLORS: Record<CustomerStage, string> = {
  lead: "bg-red-500/15 text-red-500 border-red-500/30",
  contacted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  test_drive: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  negotiating: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
  purchased: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};
