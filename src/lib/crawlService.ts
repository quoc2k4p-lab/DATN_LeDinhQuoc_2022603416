import * as cheerio from "cheerio";
import { DbCar } from "./db";

export interface CrawledCar {
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number; // in VNĐ
  mileage: number; // in km
  fuel_type: string;
  transmission: string;
  body_type: string;
  color: string;
  seats: number;
  engine: string;
  description: string;
  city: string;
  address: string;
  thumbnail: string;
  gallery: string[];
  status: "available" | "sold" | "hidden";
}

// Resilient fallback list in case Bonbanh.com is unreachable or blocks requests
const FALLBACK_CRAWLED_CARS: CrawledCar[] = [
  {
    title: "Mazda 3 Premium 1.5L",
    brand: "Mazda",
    model: "Mazda 3",
    year: 2021,
    price: 585000000,
    mileage: 28000,
    fuel_type: "Xăng",
    transmission: "Tự động",
    body_type: "Sedan",
    color: "Đỏ",
    seats: 5,
    engine: "1.5L SkyActiv",
    description: "Mazda 3 phiên bản Premium cao cấp, nước sơn đỏ pha lê cực đẹp, nội thất giữ gìn như mới, trang bị đầy đủ gói an toàn chủ động i-Activsense.",
    city: "Hà Nội",
    address: "Showroom TQ Auto, Cầu Giấy, Hà Nội",
    thumbnail: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=800&q=80"
    ],
    status: "available"
  },
  {
    title: "Hyundai SantaFe 2.2 HTRAC",
    brand: "Hyundai",
    model: "SantaFe",
    year: 2022,
    price: 1045000000,
    mileage: 18000,
    fuel_type: "Dầu",
    transmission: "Tự động",
    body_type: "SUV",
    color: "Trắng",
    seats: 7,
    engine: "2.2L Smartstream",
    description: "Hyundai SantaFe máy dầu bản cao cấp Premium, hệ dẫn động 2 cầu HTRAC mạnh mẽ. Xe đi ít, một đời chủ từ đầu, bảo dưỡng hãng đầy đủ.",
    city: "TP. Hồ Chí Minh",
    address: "Showroom TQ Auto, Quận 7, TP. HCM",
    thumbnail: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80"
    ],
    status: "available"
  },
  {
    title: "Honda CR-V L 1.5 VTEC",
    brand: "Honda",
    model: "CR-V",
    year: 2020,
    price: 765000000,
    mileage: 42000,
    fuel_type: "Xăng",
    transmission: "Vô cấp CVT",
    body_type: "SUV",
    color: "Xanh",
    seats: 7,
    engine: "1.5L Turbo VTEC",
    description: "Honda CR-V bản L cao cấp nhất lắp ráp trong nước, trang bị Honda Sensing, cửa sổ trời toàn cảnh, cốp điện rảnh tay, xe sơn zin 95%.",
    city: "Đà Nẵng",
    address: "Showroom TQ Auto, Hải Châu, Đà Nẵng",
    thumbnail: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80"
    ],
    status: "available"
  },
  {
    title: "Kia Seltos Premium 1.4L",
    brand: "Kia",
    model: "Seltos",
    year: 2021,
    price: 615000000,
    mileage: 25000,
    fuel_type: "Xăng",
    transmission: "Ly hợp kép",
    body_type: "SUV",
    color: "Trắng-Đen",
    seats: 5,
    engine: "1.4L Turbo",
    description: "Kia Seltos 1.4 Premium phối 2 màu ngoại thất cực kỳ thể thao. Đèn pha full LED, màn hình giải trí 10.25 inch, làm mát hàng ghế trước đầy đủ.",
    city: "Bình Dương",
    address: "Showroom TQ Auto, Thủ Dầu Một, Bình Dương",
    thumbnail: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80"
    ],
    status: "available"
  }
];

export async function crawlBonBanhCars(): Promise<CrawledCar[]> {
  try {
    console.log("Starting HTTP crawl request to Bonbanh.com...");
    
    const response = await fetch("https://bonbanh.com/oto", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      signal: AbortSignal.timeout(6000) // 6 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const crawledCars: CrawledCar[] = [];

    // Bonbanh car list is usually structured inside elements with class `.car-item` or inside `li.car-item`
    // Let's target the correct list item selectors used by Bonbanh: e.g. `li.car-item` or `div.car-item` or `.car-item`
    const carItems = $(".car-item, li[class*='car-item'], tr[class*='car-item']");
    console.log(`Found ${carItems.length} raw car items on Bonbanh page.`);

    carItems.slice(0, 10).each((_, element) => {
      try {
        const el = $(element);

        // 1. Title
        // Use h3/h2 directly to get the short product name, e.g. "Porsche Macan 2.0 - 2015"
        // Let's strip the year suffix to keep it brief!
        const rawTitle = el.find("h3, h2, .title").first().text().trim();
        if (!rawTitle) return; // Skip if no title
        
        // Clean title: remove "Xe cũ", year and other metadata, e.g. "Porsche Macan 2.0 - 2015" -> "Porsche Macan 2.0"
        let cleanTitle = rawTitle.replace(/\s*-\s*\d{4}\s*$/, "").trim();
        cleanTitle = cleanTitle.replace(/\s+/g, " ");

        // 2. Image (lazy loaded image has data-src or original)
        const img = el.find("img").first();
        const thumbnail = img.attr("data-src") || img.attr("src") || "";

        // 3. Price
        // Try reading itemprop="price" content attribute first (e.g. content="1290000000")
        const priceEl = el.find("[itemprop='price']");
        let price = 0;
        if (priceEl.length > 0 && priceEl.attr("content")) {
          price = parseInt(priceEl.attr("content") || "0", 10);
        } else {
          const priceText = el.find(".cb3, .price_car, .price").text().trim();
          if (priceText) {
            const normalizedPrice = priceText.toLowerCase();
            const tỷMatch = normalizedPrice.match(/(\d+(\.\d+)?)\s*tỷ/);
            const triệuMatch = normalizedPrice.match(/(\d+)\s*triệu/);

            let totalVal = 0;
            if (tỷMatch) {
              totalVal += parseFloat(tỷMatch[1]) * 1000000000;
            }
            if (triệuMatch) {
              totalVal += parseInt(triệuMatch[1], 10) * 1000000;
            }
            price = totalVal;
          }
        }
        if (price === 0) {
          price = 500000000; // Default fallback: 500 million
        }

        // 4. Description
        const descText = el.find("[itemprop='description'], .cb6_02, .description").text().trim();
        const cleanDescription = descText ? descText.replace(/\s+/g, " ") : `Xe ${cleanTitle} còn rất mới, xe chính chủ đi giữ gìn kỹ lưỡng, đã được showroom kiểm định 176 hạng mục cam kết chất lượng.`;

        // 5. Meta information parsed from description text
        // Year
        let year = 2021; // fallback
        const yearMatch = rawTitle.match(/\b(20\d{2})\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        } else {
          const descYearMatch = descText.match(/\b(20\d{2})\b/);
          if (descYearMatch) {
            year = parseInt(descYearMatch[1], 10);
          }
        }

        // Mileage
        let mileage = 25000; // fallback
        const kmMatch = descText.replace(/,/g, "").replace(/\./g, "").match(/đã\s+đi\s+(\d+)\s*km/i);
        if (kmMatch) {
          mileage = parseInt(kmMatch[1], 10);
        } else {
          const kmMatch2 = descText.replace(/,/g, "").replace(/\./g, "").match(/(\d+)\s*km/i);
          if (kmMatch2) {
            mileage = parseInt(kmMatch2[1], 10);
          }
        }

        // Transmission
        let transmission = "Tự động"; // default
        if (descText.includes("số tay") || descText.includes("số sàn") || descText.toLowerCase().includes("mt") || rawTitle.includes("MT")) {
          transmission = "Số sàn";
        }

        // Fuel Type
        let fuel_type = "Xăng"; // default
        if (descText.includes("máy dầu") || descText.toLowerCase().includes("diesel") || rawTitle.includes("Diesel")) {
          fuel_type = "Dầu";
        } else if (descText.includes("xe điện") || descText.includes("điện")) {
          fuel_type = "Điện";
        }

        // Brand & Model
        const brandMatch = ["Toyota", "Mercedes", "BMW", "Audi", "Lexus", "Porsche", "Mazda", "Hyundai", "Kia", "Honda", "Ford", "VinFast"].find(
          (b) => cleanTitle.toLowerCase().includes(b.toLowerCase())
        );
        const brand = brandMatch || "Toyota";
        
        // Strip brand from title to approximate model
        let model = cleanTitle.replace(new RegExp(brand, "i"), "").trim();
        model = model.split(/\s+/)[0] || "Camry";

        // City / Location
        const cityText = el.find(".cb4, .place, .city").text().trim();
        const city = cityText || "TP. Hồ Chí Minh";

        // Color
        let color = "Đen"; // default
        const colorMatch = descText.match(/màu\s+([^\s,]+)/i);
        if (colorMatch) {
          const rawColor = colorMatch[1].replace(/[.,]/g, "");
          color = rawColor.charAt(0).toUpperCase() + rawColor.slice(1);
        }

        crawledCars.push({
          title: cleanTitle,
          brand,
          model,
          year,
          price,
          mileage,
          fuel_type,
          transmission,
          body_type: "Sedan", // Default
          color, 
          seats: 5, // Default
          engine: "2.0L", // Default
          description: cleanDescription,
          city,
          address: `Showroom TQ Auto, Chi nhánh ${city}`,
          thumbnail: thumbnail.startsWith("http") ? thumbnail : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
          gallery: [],
          status: "available"
        });
      } catch (err) {
        console.error("Error parsing individual Bonbanh item:", err);
      }
    });

    if (crawledCars.length > 0) {
      console.log(`Successfully parsed ${crawledCars.length} cars from Bonbanh.com.`);
      return crawledCars;
    } else {
      console.log("No cars crawled, returning fallback data.");
      return FALLBACK_CRAWLED_CARS;
    }
  } catch (error) {
    console.warn("HTTP crawl request failed or timed out. Using high-quality fallback data:", (error as any).message);
    return FALLBACK_CRAWLED_CARS;
  }
}
