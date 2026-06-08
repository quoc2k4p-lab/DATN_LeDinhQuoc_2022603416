import { DbCar } from "@/lib/db";

export interface SearchPreferences {
  budget?: string; // "< 500", "500-800", "800-1000", "1000-1500", "> 1500" or similar text
  purpose?: string; // "family" (gia đình), "service" (dịch vụ), "city" (đi phố), "luxury" (doanh nhân), "offroad" (off-road)
  fuel?: string; // "Xăng", "Dầu", "Điện", "Hybrid"
  seats?: number; // 5, 7, 8 etc.
  priority?: string; // "economy" (tiết kiệm), "safety" (an toàn), "luxury" (sang trọng), "technology" (công nghệ), "comfort" (tiện nghi)
}

export interface ScoredCar {
  car: DbCar;
  score: number;
  matchDetails: {
    budget: number;
    purpose: number;
    fuel: number;
    seats: number;
    priority: number;
  };
  reasons: string[];
}

/**
 * Scores a car from 0 to 100 based on matching user preferences.
 */
export function scoreCar(car: DbCar, pref: SearchPreferences): ScoredCar {
  const reasons: string[] = [];
  const carPriceMns = Number(car.price) / 1_000_000; // Price in millions VND

  // 1. Budget Match (Max 30 points)
  let budgetScore = 30;
  if (pref.budget) {
    const budget = pref.budget.toLowerCase();
    if (budget.includes("< 500") || budget.includes("dưới 500")) {
      if (carPriceMns <= 500) {
        budgetScore = 30;
        reasons.push("✓ Giá bán nằm trong ngân sách dưới 500 triệu");
      } else if (carPriceMns <= 600) {
        budgetScore = 20;
        reasons.push("• Giá bán hơi vượt ngân sách (dưới 600 triệu)");
      } else {
        budgetScore = 5;
      }
    } else if (budget.includes("500-800") || budget.includes("500 triệu - 800 triệu") || (carPriceMns >= 500 && carPriceMns <= 800)) {
      if (carPriceMns >= 500 && carPriceMns <= 800) {
        budgetScore = 30;
        reasons.push("✓ Giá bán nằm trong khoảng 500 - 800 triệu");
      } else if (carPriceMns >= 400 && carPriceMns <= 900) {
        budgetScore = 20;
        reasons.push("• Giá bán gần tầm tiền 500 - 800 triệu");
      } else {
        budgetScore = 5;
      }
    } else if (budget.includes("800-1000") || budget.includes("800 triệu - 1 tỷ") || (carPriceMns >= 800 && carPriceMns <= 1000)) {
      if (carPriceMns >= 800 && carPriceMns <= 1000) {
        budgetScore = 30;
        reasons.push("✓ Giá bán nằm trong ngân sách 800 triệu - 1 tỷ");
      } else if (carPriceMns >= 700 && carPriceMns <= 1100) {
        budgetScore = 20;
        reasons.push("• Giá bán xấp xỉ khoảng 800 triệu - 1 tỷ");
      } else {
        budgetScore = 5;
      }
    } else if (budget.includes("1000-1500") || budget.includes("1 tỷ - 1.5 tỷ") || (carPriceMns >= 1000 && carPriceMns <= 1500)) {
      if (carPriceMns >= 1000 && carPriceMns <= 1500) {
        budgetScore = 30;
        reasons.push("✓ Giá bán nằm trong ngân sách 1 tỷ - 1.5 tỷ");
      } else if (carPriceMns >= 900 && carPriceMns <= 1700) {
        budgetScore = 20;
        reasons.push("• Giá bán gần tầm tiền 1 tỷ - 1.5 tỷ");
      } else {
        budgetScore = 5;
      }
    } else if (budget.includes("> 1500") || budget.includes("trên 1.5 tỷ")) {
      if (carPriceMns >= 1500) {
        budgetScore = 30;
        reasons.push("✓ Xe phân khúc cao cấp trên 1.5 tỷ");
      } else if (carPriceMns >= 1300) {
        budgetScore = 20;
      } else {
        budgetScore = 5;
      }
    } else {
      // General dynamic budget range parse e.g. "dưới 1 tỷ" or numeric bounds
      budgetScore = 30;
    }
  } else {
    budgetScore = 30; // default if no budget selected
  }

  // 2. Purpose / Need Match (Max 25 points)
  let purposeScore = 25;
  if (pref.purpose) {
    const purpose = pref.purpose.toLowerCase();
    let scoreVal = 80;
    if (purpose.includes("family") || purpose.includes("gia đình")) {
      scoreVal = car.family_score ?? 80;
      if (scoreVal >= 90) reasons.push("✓ Thiết kế cực kỳ phù hợp cho cả gia đình");
    } else if (purpose.includes("service") || purpose.includes("dịch vụ") || purpose.includes("kinh doanh")) {
      scoreVal = car.service_score ?? 80;
      if (scoreVal >= 85) reasons.push("✓ Chi phí vận hành thấp, tối ưu cho chạy dịch vụ");
    } else if (purpose.includes("city") || purpose.includes("đi phố")) {
      scoreVal = car.comfort_score ?? 80;
      if (scoreVal >= 88) reasons.push("✓ Thiết kế linh hoạt, êm ái khi đi trong đô thị");
    } else if (purpose.includes("luxury") || purpose.includes("doanh nhân") || purpose.includes("business")) {
      scoreVal = car.luxury_score ?? 80;
      if (scoreVal >= 90) reasons.push("✓ Phong cách sang trọng lịch lãm phù hợp gặp đối tác");
    } else if (purpose.includes("offroad") || purpose.includes("off-road") || purpose.includes("dã ngoại")) {
      scoreVal = car.offroad_score ?? 60;
      if (scoreVal >= 80) reasons.push("✓ Gầm cao, dẫn động khỏe thích hợp đi dã ngoại off-road");
    }
    purposeScore = Math.round((scoreVal / 100) * 25);
  }

  // 3. Fuel Match (Max 15 points)
  let fuelScore = 15;
  if (pref.fuel) {
    const fuel = pref.fuel.toLowerCase();
    const carFuel = car.fuel_type.toLowerCase();
    if (
      (fuel.includes("xăng") && carFuel.includes("xăng")) ||
      (fuel.includes("dầu") && carFuel.includes("dầu")) ||
      (fuel.includes("điện") && carFuel.includes("điện")) ||
      (fuel.includes("hybrid") && carFuel.includes("hybrid"))
    ) {
      fuelScore = 15;
      reasons.push(`✓ Sử dụng động cơ ${car.fuel_type}`);
    } else {
      fuelScore = 0;
    }
  }

  // 4. Seat Match (Max 15 points)
  let seatScore = 15;
  if (pref.seats) {
    const carSeats = car.seats;
    if (pref.seats === 7) {
      if (carSeats >= 7) {
        seatScore = 15;
        reasons.push(`✓ Không gian rộng rãi với cấu hình ${carSeats} chỗ ngồi`);
      } else {
        seatScore = 0;
      }
    } else if (pref.seats <= 5) {
      if (carSeats <= 5) {
        seatScore = 15;
      } else {
        seatScore = 5; // Can still work but not ideal
      }
    }
  }

  // 5. Priority / Feature Match (Max 15 points)
  let priorityScore = 15;
  if (pref.priority) {
    const priority = pref.priority.toLowerCase();
    let scoreVal = 80;
    if (priority.includes("economy") || priority.includes("nhiên liệu") || priority.includes("tiết kiệm")) {
      scoreVal = car.economy_score ?? 80;
      if (scoreVal >= 88) reasons.push("✓ Cực kỳ tiết kiệm nhiên liệu");
    } else if (priority.includes("safety") || priority.includes("an toàn")) {
      scoreVal = car.safety_score ?? 80;
      if (scoreVal >= 90) reasons.push("✓ Độ an toàn cao vượt trội, đạt chuẩn kiểm định");
    } else if (priority.includes("luxury") || priority.includes("sang trọng")) {
      scoreVal = car.luxury_score ?? 80;
      if (scoreVal >= 90) reasons.push("✓ Hoàn thiện tỉ mỉ và đẳng cấp");
    } else if (priority.includes("technology") || priority.includes("công nghệ") || priority.includes("tiện ích")) {
      scoreVal = car.technology_score ?? 80;
      if (scoreVal >= 85) reasons.push("✓ Trang bị nhiều tính năng công nghệ thông minh");
    } else if (priority.includes("comfort") || priority.includes("hiệu suất") || priority.includes("êm ái")) {
      scoreVal = car.comfort_score ?? 80;
      if (scoreVal >= 85) reasons.push("✓ Vận hành đầm chắc và êm ái");
    }
    priorityScore = Math.round((scoreVal / 100) * 15);
  }

  const totalScore = Math.min(100, Math.max(0, budgetScore + purposeScore + fuelScore + seatScore + priorityScore));

  return {
    car,
    score: totalScore,
    matchDetails: {
      budget: budgetScore,
      purpose: purposeScore,
      fuel: fuelScore,
      seats: seatScore,
      priority: priorityScore,
    },
    reasons: reasons.slice(0, 4), // Cap at 4 main reasons
  };
}
