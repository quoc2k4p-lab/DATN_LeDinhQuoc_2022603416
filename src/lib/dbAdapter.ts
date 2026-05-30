import { DbCar, DbCarImage, DbAppointment, getCars, getCarImages, getAppointments, getUsers, safeToIsoString } from "./db";

// Format helper for prices
export function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + "đ";
}

// Format helper for mileage
export function formatMileage(mileage: number): string {
  return mileage.toLocaleString("vi-VN") + " km";
}

// Map database IDs to original slugs to preserve routing
const MOCK_SLUGS: Record<string, string> = {
  "c0000000-0000-0000-0000-000000001024": "camry-2022",
  "c0000000-0000-0000-0000-000000001188": "mercedes-gls-450",
  "c0000000-0000-0000-0000-000000001302": "bmw-x5-m-sport",
  "c0000000-0000-0000-0000-000000001410": "mazda-cx5-premium",
  "c0000000-0000-0000-0000-000000001565": "honda-civic-rs",
  "c0000000-0000-0000-0000-000000001677": "audi-a6",
};

// Helper to generate a slug from the brand, model, and year
export function generateSlug(dbCar: DbCar): string {
  if (MOCK_SLUGS[dbCar.id]) {
    return MOCK_SLUGS[dbCar.id];
  }
  const base = `${dbCar.brand}-${dbCar.model}-${dbCar.year}`.toLowerCase();
  return base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface UiCar {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  year: number;
  price: string;
  mileage: string;
  fuel: string;
  transmission: string;
  engine: string;
  power: string;
  color: string;
  status: "available" | "reserved" | "sold";
  condition: "new" | "used";
  conditionType: "new" | "used";
  origin: "imported" | "domestic";
  interiorColor: string;
  doors: number;
  drivetrain: "FWD" | "RWD" | "AWD" | "4WD";
  reservedUntil: string | null;
  image: string;
  gallery: string[];
  description: string;
  specs: Record<string, string>;
}

export function dbCarToUiCar(dbCar: DbCar, images: DbCarImage[], locale?: string): UiCar {
  // Sort images by sort_order
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const galleryUrls = sortedImages.filter(img => img.sort_order > 0).map(img => img.image_url);

  // Generate slug
  const slug = generateSlug(dbCar);

  // Map status
  const status: UiCar["status"] = 
    dbCar.status === "available" 
      ? "available" 
      : dbCar.status === "reserved" 
        ? "reserved" 
        : "sold";

  // Select localized title and description
  const localizedTitle = locale === "en" ? (dbCar.title_en || dbCar.title) : (dbCar.title_vi || dbCar.title);
  const localizedDescription = locale === "en" ? (dbCar.description_en || dbCar.description) : (dbCar.description_vi || dbCar.description);

  // Re-create specifications object
  const specs: Record<string, string> = {
    "Động cơ": dbCar.engine,
    "Dẫn động": dbCar.drivetrain || (dbCar.body_type === "SUV" ? "AWD" : "Cầu trước"),
    "Ghế": `${dbCar.seats} ghế`,
    "Xuất xứ": dbCar.origin === "imported" ? "Nhập khẩu" : "Trong nước",
    "Biển số": dbCar.city,
  };

  return {
    id: dbCar.id,
    slug,
    name: localizedTitle,
    brand: dbCar.brand,
    category: dbCar.body_type,
    year: dbCar.year,
    price: formatPrice(dbCar.price),
    mileage: formatMileage(dbCar.mileage),
    fuel: dbCar.fuel_type,
    transmission: dbCar.transmission,
    engine: dbCar.engine,
    power: "200 HP", // default/mock value
    color: dbCar.color,
    status,
    condition: dbCar.car_condition || "used",
    conditionType: dbCar.condition_type || "used",
    origin: dbCar.origin || "domestic",
    interiorColor: dbCar.interior_color || "Đen",
    doors: dbCar.doors || 4,
    drivetrain: dbCar.drivetrain || "FWD",
    reservedUntil: dbCar.reserved_until ? safeToIsoString(dbCar.reserved_until) : null,
    image: dbCar.thumbnail,
    gallery: galleryUrls,
    description: localizedDescription,
    specs,
  };
}

export async function getUiCars(locale?: string): Promise<UiCar[]> {
  const cars = await getCars();
  const uiCars: UiCar[] = [];

  for (const car of cars) {
    const images = await getCarImages(car.id);
    uiCars.push(dbCarToUiCar(car, images, locale));
  }

  return uiCars;
}

export async function getUiCarBySlug(slug: string, locale?: string): Promise<UiCar | null> {
  const cars = await getCars();
  for (const car of cars) {
    const carSlug = generateSlug(car);
    if (carSlug === slug) {
      const images = await getCarImages(car.id);
      return dbCarToUiCar(car, images, locale);
    }
  }
  return null;
}
