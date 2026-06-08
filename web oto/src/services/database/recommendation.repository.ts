import { getPool } from "@/lib/db";
import { DbCar } from "@/lib/db";

/**
 * Fetches all available and reserved cars for recommendation calculations.
 */
export async function getCarsForRecommendation(): Promise<DbCar[]> {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM cars WHERE status IN ('available', 'reserved');"
  );
  return rows as DbCar[];
}

/**
 * Fetches detail of a single car by its ID.
 */
export async function getCarDetailById(id: string): Promise<DbCar | null> {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM cars WHERE id = ? LIMIT 1;", [id]);
  const list = rows as DbCar[];
  return list.length > 0 ? list[0] : null;
}
