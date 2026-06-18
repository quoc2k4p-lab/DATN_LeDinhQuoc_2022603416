import fs from "fs";
import path from "path";
import { getPool, ensureDbExists } from "../lib/db";
import { standardizeCarWithAI, standardizeCarHeuristically, CrawledCar } from "../lib/crawlService";

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      // remove quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

// Enhancer helper with rate limit retry
async function standardizeWithRetry(crawledCar: CrawledCar, retries = 5, delay = 2000): Promise<CrawledCar> {
  // 1. Try heuristics first to avoid any rate limit or hallucination
  try {
    const heuristicMatch = standardizeCarHeuristically(crawledCar);
    if (heuristicMatch) {
      console.log(`  [Heuristics] Instantly standardized: "${crawledCar.title}"`);
      return heuristicMatch;
    }
  } catch (err: any) {
    console.warn("  Error in heuristics:", err.message);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("  GEMINI_API_KEY not found in environment, returning crawled car.");
    return crawledCar;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      parts: [{
        text: `Hãy chuẩn hóa dữ liệu ô tô sau đây thành định dạng JSON. 
BẮT BUỘC TUÂN THỦ: Không được phép tự bịa ra thông tin không có cơ sở xác thực. BẮT BUỘC phải giữ nguyên giá trị gốc do người dùng cung cấp nếu bạn không biết chắc chắn 100% dựa trên suy luận logic từ tên dòng xe (ví dụ: Toyota Camry 2.5Q -> 5 chỗ, động cơ 2.5L, Sedan, FWD, 4 cửa, nhập khẩu; Mercedes GLS 450 -> 7 chỗ, động cơ 3.0L, SUV, AWD, 5 cửa, nhập khẩu; McLaren 650s -> 2 chỗ, động cơ 3.8L, Convertible/Coupe, RWD, 2 cửa, nhập khẩu). 
Nếu không chắc chắn hoặc không có cơ sở xác thực, hãy giữ nguyên toàn bộ các giá trị ban đầu được cung cấp trong dữ liệu đầu vào. Tuyệt đối không tự đoán, không tự bịa thông số.

Dữ liệu đầu vào:
Tiêu đề: "${crawledCar.title}"
Hãng: "${crawledCar.brand}"
Dòng xe (model): "${crawledCar.model}"
Mô tả gốc: "${crawledCar.description}"
Số km đã đi: ${crawledCar.mileage}
Năm sản xuất: ${crawledCar.year}
Nhiên liệu: "${crawledCar.fuel_type}"
Hộp số: "${crawledCar.transmission}"
Kiểu dáng gốc: "${crawledCar.body_type}"
Số chỗ gốc: ${crawledCar.seats}
Động cơ gốc: "${crawledCar.engine}"
Màu sắc gốc: "${crawledCar.color}"

JSON Output Schema:
{
  "title": "Tên xe sạch sẽ, loại bỏ các ký tự quảng cáo đặc biệt",
  "brand": "Hãng xe chính xác (ví dụ: Toyota, Mercedes-Benz, BMW, VinFast, Hyundai, Kia, Honda, Mazda, Ford, McLaren, Morgan)",
  "model": "Dòng xe cụ thể (ví dụ: Camry, VF3, GLS 450, CX-5)",
  "seats": 5, // Số chỗ ngồi (số nguyên)
  "engine": "Dung tích động cơ (ví dụ: 1.5L, 2.0L, 3.8L, Electric cho xe điện)",
  "body_type": "Kiểu dáng: Sedan, SUV, Hatchback, MPV, Bán tải, Mui trần, Coupe",
  "transmission": "Hộp số: Tự động, Số sàn, Bán tự động",
  "fuel_type": "Nhiên liệu: Xăng, Dầu, Điện, Hybrid",
  "drivetrain": "Hệ dẫn động: FWD, RWD, AWD, 4WD",
  "doors": 4, // Số cửa (số nguyên)
  "origin": "Xuất xứ: domestic (lắp ráp trong nước) hoặc imported (nhập khẩu)",
  "color": "Màu sắc ngoại thất bằng tiếng Việt",
  "description": "Mô tả viết lại một cách chuyên nghiệp, trôi chảy, sửa lỗi chính tả nếu có, loại bỏ số điện thoại, địa chỉ và link liên hệ quảng cáo của bên khác"
}`
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  [AI] Calling Gemini API for: "${crawledCar.title}" (Attempt ${attempt})...`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.status === 429) {
        console.warn(`  Attempt ${attempt} failed with 429 (Rate Limit). Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP error status ${res.status}`);
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return crawledCar;

      const parsed = JSON.parse(text);
      return {
        ...crawledCar,
        title: parsed.title || crawledCar.title,
        brand: parsed.brand || crawledCar.brand,
        model: parsed.model || crawledCar.model,
        seats: typeof parsed.seats === "number" ? parsed.seats : crawledCar.seats,
        engine: parsed.engine || crawledCar.engine,
        body_type: parsed.body_type || crawledCar.body_type,
        transmission: parsed.transmission || crawledCar.transmission,
        fuel_type: parsed.fuel_type || crawledCar.fuel_type,
        drivetrain: (parsed.drivetrain === "FWD" || parsed.drivetrain === "RWD" || parsed.drivetrain === "AWD" || parsed.drivetrain === "4WD") ? parsed.drivetrain : undefined,
        doors: typeof parsed.doors === "number" ? parsed.doors : undefined,
        origin: (parsed.origin === "imported" || parsed.origin === "domestic") ? parsed.origin : undefined,
        color: parsed.color || crawledCar.color,
        description: parsed.description || crawledCar.description
      };
    } catch (err: any) {
      if (attempt === retries) {
        console.error(`  All retry attempts failed for ${crawledCar.title}:`, err.message);
        return crawledCar;
      }
      console.warn(`  Attempt ${attempt} failed for ${crawledCar.title} (${err.message}). Retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return crawledCar;
}

async function run() {
  console.log("Starting sequential car specs AI enrichment script with 429 backoff...");
  await ensureDbExists();
  const pool = getPool();

  console.log("Fetching all cars from database...");
  const [rows] = await pool.query("SELECT * FROM cars;");
  const cars = rows as any[];
  console.log(`Found ${cars.length} cars in the database.`);

  let updatedCount = 0;

  // Process cars sequentially one by one with a 1.5 second delay to avoid hitting rate limits
  for (let i = 0; i < cars.length; i++) {
    const dbCar = cars[i];
    console.log(`\n[${i + 1}/${cars.length}] Processing: "${dbCar.title}" (ID: ${dbCar.id})`);

    try {
      const crawledCar: CrawledCar = {
        title: dbCar.title,
        brand: dbCar.brand,
        model: dbCar.model,
        year: dbCar.year,
        price: dbCar.price,
        mileage: dbCar.mileage,
        fuel_type: dbCar.fuel_type,
        transmission: dbCar.transmission,
        body_type: dbCar.body_type,
        color: dbCar.color,
        seats: dbCar.seats,
        engine: dbCar.engine,
        description: dbCar.description,
        city: dbCar.city,
        address: dbCar.address,
        thumbnail: dbCar.thumbnail,
        gallery: [dbCar.thumbnail],
        status: dbCar.status as "available" | "sold" | "hidden",
        drivetrain: dbCar.drivetrain,
        doors: dbCar.doors,
        origin: dbCar.origin
      };

      const start = Date.now();
      const enriched = await standardizeWithRetry(crawledCar);
      const duration = Date.now() - start;

      console.log(`  Enriched Title: "${enriched.title}"`);
      console.log(`  Seats: ${dbCar.seats} -> ${enriched.seats}`);
      console.log(`  Engine: ${dbCar.engine} -> ${enriched.engine}`);
      console.log(`  Body Type: ${dbCar.body_type} -> ${enriched.body_type}`);
      console.log(`  Drivetrain: ${dbCar.drivetrain} -> ${enriched.drivetrain || "FWD"}`);
      console.log(`  Doors: ${dbCar.doors} -> ${enriched.doors || 4}`);
      console.log(`  Origin: ${dbCar.origin} -> ${enriched.origin || "domestic"}`);

      // Update database row
      await pool.query(
        `UPDATE cars SET 
          title = ?, 
          title_vi = ?,
          brand = ?, 
          model = ?, 
          seats = ?, 
          engine = ?, 
          body_type = ?, 
          transmission = ?, 
          fuel_type = ?, 
          drivetrain = ?, 
          doors = ?, 
          origin = ?, 
          color = ?, 
          description = ?,
          description_vi = ?
         WHERE id = ?;`,
        [
          enriched.title,
          enriched.title,
          enriched.brand,
          enriched.model,
          enriched.seats,
          enriched.engine,
          enriched.body_type,
          enriched.transmission,
          enriched.fuel_type,
          enriched.drivetrain || "FWD",
          enriched.doors || 4,
          enriched.origin || "domestic",
          enriched.color,
          enriched.description,
          enriched.description,
          dbCar.id
        ]
      );
      updatedCount++;

      // Gentle delay only if we actually hit the Gemini API (duration > 150ms)
      if (duration > 150 && i < cars.length - 1) {
        console.log("  Hit Gemini API. Sleeping 1500ms to avoid rate limits...");
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err: any) {
      console.error(`Failed to update car ID ${dbCar.id}:`, err.message);
    }
  }

  console.log(`\nEnrichment complete! Successfully enriched and updated ${updatedCount} of ${cars.length} cars in the database.`);
  await pool.end();
}

run();
