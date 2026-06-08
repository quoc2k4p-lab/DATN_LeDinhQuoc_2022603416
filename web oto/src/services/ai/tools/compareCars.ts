import { getCarDetailById } from "../../database/recommendation.repository";

interface CompareCarsParams {
  carIds: string[];
}

export async function compareCars(params: CompareCarsParams) {
  const { carIds } = params;
  if (!carIds || carIds.length === 0) return { error: "Không cung cấp ID xe nào để so sánh." };

  const results = [];
  for (const id of carIds) {
    const car = await getCarDetailById(id);
    if (car) {
      results.push({
        id: car.id,
        name: car.title,
        brand: car.brand,
        price: car.price,
        fuel: car.fuel_type,
        engine: car.engine,
        seats: car.seats,
        drivetrain: car.drivetrain,
        mileage: car.mileage,
        transmission: car.transmission,
        description: car.description,
        safetyScore: car.safety_score ?? 80,
        techScore: car.technology_score ?? 80,
        ecoScore: car.economy_score ?? 80,
      });
    }
  }

  return { comparisonTable: results };
}
