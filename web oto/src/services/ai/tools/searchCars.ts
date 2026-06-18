import { getCarsForRecommendation } from "../../database/recommendation.repository";
import { DbCar } from "@/lib/db";

interface SearchCarsParams {
  budget?: number; // budget in VND
  brand?: string;
  fuel?: string;
  seats?: number;
  priceRange?: string; // e.g. "500-800" (millions)
}

export async function searchCars(params: SearchCarsParams): Promise<DbCar[]> {
  const allCars = await getCarsForRecommendation();
  
  return allCars.filter((car) => {
    // Brand match (case insensitive)
    if (params.brand && car.brand.toLowerCase() !== params.brand.toLowerCase()) {
      return false;
    }

    // Fuel match (case-insensitive substring)
    if (params.fuel && !car.fuel_type.toLowerCase().includes(params.fuel.toLowerCase())) {
      return false;
    }

    // Seats match
    if (params.seats && car.seats !== params.seats) {
      return false;
    }

    // Price matches
    if (params.budget && car.price > params.budget) {
      return false;
    }

    // Price range e.g. "500-800" millions
    if (params.priceRange) {
      const parts = params.priceRange.split("-").map(p => parseFloat(p) * 1_000_000);
      if (parts.length === 2) {
        const [min, max] = parts;
        if (car.price < min || car.price > max) {
          return false;
        }
      }
    }

    return true;
  });
}
