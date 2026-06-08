"use server";

import { getPool } from "@/lib/db";
import { dbCarToUiCar, UiCar } from "@/lib/dbAdapter";
import crypto from "crypto";

export interface CarSpecsExtended extends UiCar {
  pricePromo?: string;
  // Engine
  engineType: string; // Xăng, Dầu, Điện, Hybrid
  engineSize: number; // Liters
  horsepower: number; // HP
  torque: number; // Nm
  // Operation
  acceleration: number; // 0-100 km/h in seconds
  maxSpeed: number; // km/h
  // Fuel consumption (L/100km)
  fuelUrban: number;
  fuelExtraUrban: number;
  fuelCombined: number;
  // Dimensions (mm)
  length: number;
  width: number;
  height: number;
  wheelbase: number;
  // Comfort features
  leatherSeats: boolean;
  sunroof: boolean;
  appleCarplay: boolean;
  androidAuto: boolean;
  cam360: boolean;
  hud: boolean;
  // Safety features
  abs: boolean;
  esp: boolean;
  airbags: number;
  adas: boolean;
  laneDepartureWarning: boolean;
  blindSpotMonitoring: boolean;
}

// Exact real-world technical specs for the 6 seeded models
const REAL_CAR_SPECS: Record<string, Partial<CarSpecsExtended>> = {
  // Toyota Camry 2.5Q
  "camry-2022": {
    pricePromo: "Giảm 50% trước bạ",
    engineType: "Xăng 2.5L",
    engineSize: 2.5,
    horsepower: 207,
    torque: 250,
    acceleration: 7.8,
    maxSpeed: 220,
    fuelUrban: 9.6,
    fuelExtraUrban: 5.4,
    fuelCombined: 7.0,
    length: 4885,
    width: 1840,
    height: 1445,
    wheelbase: 2825,
    leatherSeats: true,
    sunroof: true,
    appleCarplay: true,
    androidAuto: true,
    cam360: true,
    hud: true,
    abs: true,
    esp: true,
    airbags: 7,
    adas: true,
    laneDepartureWarning: true,
    blindSpotMonitoring: true,
  },
  // Mercedes GLS 450
  "mercedes-gls-450": {
    pricePromo: "Tặng gói bảo dưỡng 2 năm",
    engineType: "Xăng 3.0L EQ Boost",
    engineSize: 3.0,
    horsepower: 367,
    torque: 500,
    acceleration: 6.2,
    maxSpeed: 246,
    fuelUrban: 13.8,
    fuelExtraUrban: 9.2,
    fuelCombined: 10.9,
    length: 5207,
    width: 1956,
    height: 1823,
    wheelbase: 3135,
    leatherSeats: true,
    sunroof: true,
    appleCarplay: true,
    androidAuto: true,
    cam360: true,
    hud: true,
    abs: true,
    esp: true,
    airbags: 9,
    adas: true,
    laneDepartureWarning: true,
    blindSpotMonitoring: true,
  },
  // BMW X5 xDrive40i M Sport
  "bmw-x5-m-sport": {
    pricePromo: "Tặng bảo hiểm thân vỏ 1 năm",
    engineType: "Xăng 3.0L TwinPower Turbo",
    engineSize: 3.0,
    horsepower: 340,
    torque: 450,
    acceleration: 5.7,
    maxSpeed: 243,
    fuelUrban: 11.2,
    fuelExtraUrban: 8.0,
    fuelCombined: 9.2,
    length: 4922,
    width: 2004,
    height: 1745,
    wheelbase: 2975,
    leatherSeats: true,
    sunroof: true,
    appleCarplay: true,
    androidAuto: true,
    cam360: true,
    hud: true,
    abs: true,
    esp: true,
    airbags: 8,
    adas: true,
    laneDepartureWarning: true,
    blindSpotMonitoring: true,
  },
  // Mazda CX-5 2.0 Premium
  "mazda-cx5-premium": {
    pricePromo: "Giảm 30 triệu tiền mặt",
    engineType: "Xăng 2.0L SkyActiv",
    engineSize: 2.0,
    horsepower: 154,
    torque: 200,
    acceleration: 9.2,
    maxSpeed: 190,
    fuelUrban: 9.0,
    fuelExtraUrban: 6.1,
    fuelCombined: 7.2,
    length: 4550,
    width: 1840,
    height: 1680,
    wheelbase: 2700,
    leatherSeats: true,
    sunroof: true,
    appleCarplay: true,
    androidAuto: true,
    cam360: true,
    hud: true,
    abs: true,
    esp: true,
    airbags: 6,
    adas: true,
    laneDepartureWarning: true,
    blindSpotMonitoring: true,
  },
  // Honda Civic RS 1.5 Turbo
  "honda-civic-rs": {
    pricePromo: "Tặng gói phụ kiện chính hãng 15tr",
    engineType: "Xăng 1.5L VTEC Turbo",
    engineSize: 1.5,
    horsepower: 178,
    torque: 240,
    acceleration: 8.3,
    maxSpeed: 200,
    fuelUrban: 8.1,
    fuelExtraUrban: 5.3,
    fuelCombined: 6.3,
    length: 4678,
    width: 1802,
    height: 1415,
    wheelbase: 2735,
    leatherSeats: true,
    sunroof: false,
    appleCarplay: true,
    androidAuto: true,
    cam360: false,
    hud: false,
    abs: true,
    esp: true,
    airbags: 6,
    adas: true,
    laneDepartureWarning: true,
    blindSpotMonitoring: true,
  },
  // Audi A6
  "audi-a6": {
    pricePromo: "Tặng 2 năm bảo hiểm cao cấp",
    engineType: "Xăng 2.0L Mild-Hybrid",
    engineSize: 2.0,
    horsepower: 245,
    torque: 370,
    acceleration: 6.8,
    maxSpeed: 250,
    fuelUrban: 9.1,
    fuelExtraUrban: 5.8,
    fuelCombined: 7.0,
    length: 4939,
    width: 1886,
    height: 1457,
    wheelbase: 2924,
    leatherSeats: true,
    sunroof: true,
    appleCarplay: true,
    androidAuto: true,
    cam360: true,
    hud: true,
    abs: true,
    esp: true,
    airbags: 8,
    adas: true,
    laneDepartureWarning: true,
    blindSpotMonitoring: true,
  },
};

/**
 * Resolves full specs for a car, using mapping for seed cars or heuristic fallback.
 */
function resolveCarSpecs(car: UiCar): CarSpecsExtended {
  const cleanSlug = car.slug.replace(/-\d{4}$/, ""); // clean trailing year
  const knownSpecs = REAL_CAR_SPECS[cleanSlug] || REAL_CAR_SPECS[car.slug];

  if (knownSpecs) {
    return {
      ...car,
      ...knownSpecs,
    } as CarSpecsExtended;
  }

  // Fallback Heuristic Generator for newly created / crawled cars
  const priceRaw = Number(car.price.replace(/\D/g, "")) || 1000000000;
  
  // Resolve engine size
  let parsedEngineSize = 2.0;
  const sizeMatches = car.engine.match(/(\d+\.\d+)/);
  if (sizeMatches && sizeMatches[1]) {
    parsedEngineSize = parseFloat(sizeMatches[1]);
  }

  // Resolve horsepower
  let parsedHP = 150;
  if (car.power) {
    const hpMatches = car.power.match(/(\d+)/);
    if (hpMatches && hpMatches[1]) {
      parsedHP = parseInt(hpMatches[1], 10);
    }
  } else {
    // Estimate by price
    parsedHP = Math.min(100 + Math.floor(priceRaw / 12000000), 550);
  }

  // Resolve torque: HP * 1.35
  const parsedTorque = Math.round(parsedHP * 1.35);

  // Acceleration 0-100: SUV heavier than Sedan
  const bodyCoeff = car.category.toUpperCase() === "SUV" ? 1.15 : 1.0;
  const acceleration = Math.round((Math.max(12.5 - (parsedHP / 45), 4.2) * bodyCoeff) * 10) / 10;
  const maxSpeed = Math.round(Math.min(160 + (parsedHP / 2.8), 280));

  // Fuel combined
  let fuelCombined = 7.5;
  const fuelTypeLower = car.fuel.toLowerCase();
  if (fuelTypeLower.includes("điện") || fuelTypeLower.includes("electric")) {
    fuelCombined = 0.0;
  } else if (fuelTypeLower.includes("hybrid")) {
    fuelCombined = 4.6;
  } else {
    // scale by engine size
    fuelCombined = Math.round((5.0 + parsedEngineSize * 1.3) * 10) / 10;
  }

  const fuelUrban = Math.round(fuelCombined * 1.3 * 10) / 10;
  const fuelExtraUrban = Math.round(fuelCombined * 0.8 * 10) / 10;

  // Dimensions by Body Type
  let length = 4700, width = 1840, height = 1450, wheelbase = 2750;
  if (car.category.toUpperCase() === "SUV") {
    length = priceRaw > 2000000000 ? 4950 : 4600;
    width = priceRaw > 2000000000 ? 1950 : 1850;
    height = priceRaw > 2000000000 ? 1800 : 1680;
    wheelbase = priceRaw > 2000000000 ? 2950 : 2700;
  } else if (car.category.toUpperCase() === "SEDAN") {
    length = priceRaw > 1500000000 ? 4900 : 4650;
    width = priceRaw > 1500000000 ? 1860 : 1800;
    height = 1440;
    wheelbase = priceRaw > 1500000000 ? 2900 : 2720;
  } else if (car.category.toUpperCase() === "HATCHBACK") {
    length = 4100; width = 1750; height = 1450; wheelbase = 2550;
  }

  // Comfort features by price tier
  const isPremium = priceRaw >= 1500000000;
  const isLuxury = priceRaw >= 2500000000;
  const isMid = priceRaw >= 800000000;

  const leatherSeats = isMid;
  const sunroof = isPremium;
  const appleCarplay = true;
  const androidAuto = true;
  const cam360 = isPremium;
  const hud = isLuxury;

  // Safety features
  const abs = true;
  const esp = true;
  const airbags = isLuxury ? 9 : (isPremium ? 7 : (isMid ? 6 : 4));
  const adas = isPremium;
  const laneDepartureWarning = isPremium;
  const blindSpotMonitoring = isPremium;

  return {
    ...car,
    pricePromo: isPremium ? "Tặng bảo hiểm & thuế trước bạ" : "Quà tặng phụ kiện",
    engineType: car.fuel + " " + car.engine,
    engineSize: parsedEngineSize,
    horsepower: parsedHP,
    torque: parsedTorque,
    acceleration,
    maxSpeed,
    fuelUrban,
    fuelExtraUrban,
    fuelCombined,
    length,
    width,
    height,
    wheelbase,
    leatherSeats,
    sunroof,
    appleCarplay,
    androidAuto,
    cam360,
    hud,
    abs,
    esp,
    airbags,
    adas,
    laneDepartureWarning,
    blindSpotMonitoring,
  };
}

/**
 * Logs comparison event into DB. Normalize car IDs order to make aggregates simple.
 */
export async function logCompareEventAction(carIds: string[]): Promise<void> {
  if (carIds.length < 2) return;
  
  const pool = getPool();
  
  // Sort alphabetically to normalize comparison permutations
  const sortedIds = [...carIds].sort();
  const car1_id = sortedIds[0];
  const car2_id = sortedIds[1];
  const car3_id = sortedIds[2] || null;

  try {
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO compare_events (id, car1_id, car2_id, car3_id) VALUES (?, ?, ?, ?);",
      [id, car1_id, car2_id, car3_id]
    );
  } catch (error) {
    console.error("Failed to log compare event:", error);
  }
}

/**
 * Fetch top compared car combinations for dashboard metrics.
 */
export async function getTopComparedCars(): Promise<{ pair: string; count: number }[]> {
  const pool = getPool();
  try {
    const [rows] = await pool.query(`
      SELECT 
        ce.car1_id,
        ce.car2_id,
        ce.car3_id,
        COUNT(*) as count,
        c1.title as name1,
        c2.title as name2,
        c3.title as name3
      FROM compare_events ce
      JOIN cars c1 ON ce.car1_id = c1.id
      JOIN cars c2 ON ce.car2_id = c2.id
      LEFT JOIN cars c3 ON ce.car3_id = c3.id
      GROUP BY ce.car1_id, ce.car2_id, ce.car3_id, name1, name2, name3
      ORDER BY count DESC
      LIMIT 5;
    `);

    return (rows as any[]).map((r) => {
      const names = [r.name1, r.name2];
      if (r.name3) names.push(r.name3);
      return {
        pair: names.join(" vs "),
        count: Number(r.count) || 0,
      };
    });
  } catch (err) {
    console.error("Failed to fetch top compared cars:", err);
    return [];
  }
}

/**
 * Fetch detailed UiCars by IDs for the compare page.
 */
export async function getCarsForComparison(carIds: string[], locale: string = "vi"): Promise<CarSpecsExtended[]> {
  const pool = getPool();
  if (!carIds || carIds.length === 0) return [];
  
  const placeholders = carIds.map(() => "?").join(",");
  
  try {
    const [carsRows] = await pool.query(
      `SELECT * FROM cars WHERE id IN (${placeholders})`,
      carIds
    );

    const result: CarSpecsExtended[] = [];

    for (const dbCar of carsRows as any[]) {
      const [images] = await pool.query(
        "SELECT * FROM car_images WHERE car_id = ? ORDER BY sort_order ASC",
        [dbCar.id]
      );
      const uiCar = dbCarToUiCar(dbCar, images as any[], locale);
      result.push(resolveCarSpecs(uiCar));
    }

    // Sort to match order of carIds array
    return carIds
      .map(id => result.find(c => c.id === id))
      .filter((c): c is CarSpecsExtended => c !== undefined);
  } catch (error) {
    console.error("Error fetching cars for comparison:", error);
    return [];
  }
}
