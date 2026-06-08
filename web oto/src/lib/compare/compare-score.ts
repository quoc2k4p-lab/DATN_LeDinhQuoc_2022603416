import { CarSpecsExtended } from "./compare-engine";

export interface CompareScores {
  performance: number;
  economy: number;
  comfort: number;
  safety: number;
  technology: number;
}

/**
 * Calculates comparative scores (0 to 100) for a car based on its technical specifications.
 */
export function calculateCompareScores(specs: CarSpecsExtended): CompareScores {
  // 1. Performance Score (0 - 100)
  // Horsepower: 0-600 HP (60% weight)
  // Torque: 0-800 Nm (30% weight)
  // Engine Size: 0-6.0L (10% weight) -> If electric, give full 10% weight
  const hpWeight = Math.min((specs.horsepower / 600) * 60, 60);
  const torqueWeight = Math.min((specs.torque / 800) * 30, 30);
  let engineSizeWeight = 0;
  if (specs.engineType.toLowerCase().includes("điện") || specs.engineType.toLowerCase().includes("electric")) {
    engineSizeWeight = 10;
  } else {
    engineSizeWeight = Math.min((specs.engineSize / 6.0) * 10, 10);
  }
  const performance = Math.round(hpWeight + torqueWeight + engineSizeWeight);

  // 2. Economy Score (0 - 100)
  // Fuel Combined: Lower is better. 0L/100km (electric) = 100 points.
  // 5L/100km = 85 points. 10L/100km = 60 points. 20L/100km = 10 points.
  let economy = 100;
  if (specs.engineType.toLowerCase().includes("điện") || specs.engineType.toLowerCase().includes("electric")) {
    economy = 100; // Electric is most economical
  } else {
    const combined = specs.fuelCombined > 0 ? specs.fuelCombined : 8.0; // fallback
    economy = Math.max(100 - combined * 5, 0);
  }
  economy = Math.round(economy);

  // 3. Comfort Score (0 - 100)
  // Leather seats = 20 points
  // Sunroof = 20 points
  // Wheelbase: > 2800mm = 30 points, > 2700mm = 20 points, > 2500mm = 10 points
  // Electric seats / high-end interior features parsed from description = 30 points
  let comfort = 0;
  if (specs.leatherSeats) comfort += 20;
  if (specs.sunroof) comfort += 20;
  
  if (specs.wheelbase >= 3000) comfort += 30;
  else if (specs.wheelbase >= 2800) comfort += 25;
  else if (specs.wheelbase >= 2700) comfort += 20;
  else if (specs.wheelbase >= 2500) comfort += 12;
  else comfort += 5;

  // Additional comfort points from segments
  if (specs.length >= 4900) comfort += 30; // large luxury
  else if (specs.length >= 4700) comfort += 20; // midsize
  else comfort += 10;
  
  comfort = Math.min(Math.round(comfort), 100);

  // 4. Safety Score (0 - 100)
  // Airbags: each is 8 points, capped at 8 túi khí = 64 points
  // ABS = 10 points, ESP = 10 points
  // ADAS = 16 points
  let safety = 0;
  safety += Math.min(specs.airbags * 8, 64);
  if (specs.abs) safety += 10;
  if (specs.esp) safety += 10;
  if (specs.adas) safety += 16;
  
  safety = Math.min(Math.round(safety), 100);

  // 5. Technology Score (0 - 100)
  // Apple CarPlay = 20 points
  // Android Auto = 20 points
  // Camera 360 = 25 points
  // HUD = 20 points
  // Lane Departure / Blind Spot = 15 points
  let technology = 0;
  if (specs.appleCarplay) technology += 20;
  if (specs.androidAuto) technology += 20;
  if (specs.cam360) technology += 25;
  if (specs.hud) technology += 20;
  if (specs.laneDepartureWarning || specs.blindSpotMonitoring) technology += 15;
  
  technology = Math.min(Math.round(technology), 100);

  return {
    performance,
    economy,
    comfort,
    safety,
    technology
  };
}
