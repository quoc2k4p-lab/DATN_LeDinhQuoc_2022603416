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
  status: "available" | "reserved" | "sold" | "hidden";
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
  economyScore: number;
  safetyScore: number;
  technologyScore: number;
  comfortScore: number;
  familyScore: number;
  serviceScore: number;
  offroadScore: number;
  luxuryScore: number;
  address: string;
  city: string;
  sortOrder: number;
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
        : dbCar.status === "hidden"
          ? "hidden"
          : "sold";

  // Select localized title and description
  const localizedTitle = dbCar.title_vi || dbCar.title;
  const localizedDescription = dbCar.description_vi || dbCar.description;

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
    economyScore: dbCar.economy_score ?? 80,
    safetyScore: dbCar.safety_score ?? 80,
    technologyScore: dbCar.technology_score ?? 80,
    comfortScore: dbCar.comfort_score ?? 80,
    familyScore: dbCar.family_score ?? 80,
    serviceScore: dbCar.service_score ?? 80,
    offroadScore: dbCar.offroad_score ?? 80,
    luxuryScore: dbCar.luxury_score ?? 80,
    address: dbCar.address,
    city: dbCar.city,
    sortOrder: dbCar.sort_order ?? 0,
  };
}

export async function getUiCars(locale?: string, includeHidden = false): Promise<UiCar[]> {
  const cars = await getCars();
  const uiCars: UiCar[] = [];

  for (const car of cars) {
    if (!includeHidden && car.status === "hidden") {
      continue;
    }
    const images = await getCarImages(car.id);
    uiCars.push(dbCarToUiCar(car, images, locale));
  }

  // Sort by sortOrder descending, then by number of gallery (secondary) images descending, then by year descending
  uiCars.sort((a, b) => {
    if (b.sortOrder !== a.sortOrder) {
      return b.sortOrder - a.sortOrder;
    }
    if (b.gallery.length !== a.gallery.length) {
      return b.gallery.length - a.gallery.length;
    }
    return b.year - a.year;
  });

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
