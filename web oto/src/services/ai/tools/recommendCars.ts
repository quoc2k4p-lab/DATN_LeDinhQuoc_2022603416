import { getCarsForRecommendation } from "../../database/recommendation.repository";
import { scoreCar, SearchPreferences } from "@/lib/recommendation/scoring-engine";

interface RecommendCarsParams {
  budget?: string;
  purpose?: string;
  fuel?: string;
  seats?: number;
  priority?: string;
}

export async function recommendCars(params: RecommendCarsParams) {
  const allCars = await getCarsForRecommendation();
  const searchPref: SearchPreferences = {
    budget: params.budget,
    purpose: params.purpose,
    fuel: params.fuel,
    seats: params.seats,
    priority: params.priority,
  };

  const scoredCars = allCars.map((car) => scoreCar(car, searchPref));
  
  // Sort by score descending
  scoredCars.sort((a, b) => b.score - a.score);

  // Take top 3 cars
  const topRecommendations = scoredCars.slice(0, 3).map((sc) => ({
    id: sc.car.id,
    name: sc.car.title,
    brand: sc.car.brand,
    price: sc.car.price,
    thumbnail: sc.car.thumbnail,
    fuel: sc.car.fuel_type,
    score: sc.score,
    reasons: sc.reasons,
    matchPercent: `${sc.score}%`,
  }));

  return { recommendations: topRecommendations };
}
