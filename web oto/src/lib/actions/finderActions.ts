"use server";

import { recommendCars } from "@/services/ai/tools/recommendCars";

export async function getFinderRecommendationsAction(params: {
  budget?: string;
  purpose?: string;
  fuel?: string;
  seats?: number;
  priority?: string;
}) {
  try {
    const res = await recommendCars(params);
    return { success: true, recommendations: res.recommendations };
  } catch (err: any) {
    console.error("Error in getFinderRecommendationsAction:", err);
    return { success: false, message: "Không thể lấy danh sách gợi ý xe." };
  }
}
