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
  drivetrain?: "FWD" | "RWD" | "AWD" | "4WD";
  doors?: number;
  origin?: "imported" | "domestic";
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

export async function crawlBonBanhCars(brand?: string, condition?: "new" | "used"): Promise<CrawledCar[]> {
  try {
    console.log(`Starting HTTP crawl request to Bonbanh.com (brand: ${brand || "all"}, condition: ${condition || "used"})...`);
    
    let mappedBrand = brand ? brand.toLowerCase() : "";
    if (mappedBrand === "mercedes" || mappedBrand === "mercedes-benz") {
      mappedBrand = "mercedes_benz";
    }
    
    let url = "https://bonbanh.com/oto";
    if (condition === "new") {
      url = mappedBrand ? `https://bonbanh.com/oto-${mappedBrand}-moi` : "https://bonbanh.com/oto-moi";
    } else {
      url = mappedBrand ? `https://bonbanh.com/oto-${mappedBrand}` : "https://bonbanh.com/oto";
    }

    const response = await fetch(url, {
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

    const carElements = carItems.slice(0, 10).get();
    const crawlPromises = carElements.map(async (element) => {
      try {
        const el = $(element);

        // 1. Title
        // Use h3/h2 directly to get the short product name, e.g. "Porsche Macan 2.0 - 2015"
        // Let's strip the year suffix to keep it brief!
        const rawTitle = el.find("h3, h2, .title").first().text().trim();
        if (!rawTitle) return null; // Skip if no title
        
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
        const finalBrand = brandMatch || (brand ? (brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()) : "Toyota");
        
        // Strip brand from title to approximate model
        let model = cleanTitle.replace(new RegExp(finalBrand, "i"), "").trim();
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

        // Fetch detail page to extract secondary gallery images
        const gallery: string[] = [];
        const href = el.find("a").first().attr("href") || el.attr("href") || "";
        if (href) {
          const detailUrl = href.startsWith("http") ? href : `https://bonbanh.com/${href}`;
          try {
            console.log(`Crawl Detail: Fetching details for ${cleanTitle} from ${detailUrl}`);
            const detailResponse = await fetch(detailUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
              },
              signal: AbortSignal.timeout(4000) // 4 seconds timeout for detail page
            });
            if (detailResponse.ok) {
              const detailHtml = await detailResponse.text();
              const $detail = cheerio.load(detailHtml);
              $detail("img").each((_, imgEl) => {
                const imgId = $detail(imgEl).attr("id") || "";
                const imgSrc = $detail(imgEl).attr("src") || "";
                if (/^img\d+$/.test(imgId) && imgSrc && imgSrc.startsWith("http")) {
                  gallery.push(imgSrc);
                }
              });
              console.log(`Crawl Detail: Extracted ${gallery.length} gallery images for ${cleanTitle}`);
            }
          } catch (detailErr: any) {
            console.warn(`Crawl Detail: Failed to crawl detail page for ${cleanTitle}:`, detailErr.message);
          }
        }

        return {
          title: cleanTitle,
          brand: finalBrand,
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
          gallery,
          status: "available" as const
        };
      } catch (err) {
        console.error("Error parsing individual Bonbanh item:", err);
        return null;
      }
    });

    const crawledResults = await Promise.all(crawlPromises);
    for (const car of crawledResults) {
      if (car) {
        crawledCars.push(car);
      }
    }

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

export async function crawlOtoCars(brand?: string, condition?: "new" | "used"): Promise<CrawledCar[]> {
  try {
    console.log(`Starting HTTP crawl request to Oto.com.vn (brand: ${brand || "all"}, condition: ${condition || "used"})...`);
    
    let mappedBrand = brand ? brand.toLowerCase() : "";
    if (mappedBrand === "mercedes") {
      mappedBrand = "mercedes-benz";
    }
    
    let url = "https://oto.com.vn/mua-ban-xe";
    if (condition === "new") {
      url = mappedBrand ? `https://oto.com.vn/mua-ban-xe-${mappedBrand}-moi` : "https://oto.com.vn/mua-ban-xe-o-to-moi";
    } else {
      url = mappedBrand ? `https://oto.com.vn/mua-ban-xe-${mappedBrand}` : "https://oto.com.vn/mua-ban-xe";
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
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

    const carItems = $(".item-car, .dev-item-car");
    console.log(`Found ${carItems.length} raw car items on Oto.com.vn page.`);

    const carElements = carItems.slice(0, 10).get();
    const crawlPromises = carElements.map(async (element) => {
      try {
        const el = $(element);

        // 1. Title
        const rawTitle = el.find(".car-name").first().text().trim() || el.find(".title a").first().text().trim();
        if (!rawTitle) return null;

        // Clean title: remove "2014 - " prefix and everything after " - "
        let cleanTitle = rawTitle.replace(/^\d{4}\s*-\s*/, "").trim();
        cleanTitle = cleanTitle.split(" - ")[0].trim();
        cleanTitle = cleanTitle.replace(/\s+/g, " ");

        // 2. Image (convert thumbnail to high-res version)
        const img = el.find(".photo img").first();
        let thumbnail = img.attr("data-src") || img.attr("src") || "";
        if (thumbnail.includes("Static/Images") || !thumbnail) {
          thumbnail = img.attr("src") || "";
        }
        if (thumbnail.includes("/crop/")) {
          thumbnail = thumbnail.replace(/\/crop\/\d+x\d+\//, "/crop/640x480/");
        }

        // 3. Price
        const priceText = el.find(".price").text().trim();
        let price = 0;
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
        if (price === 0) {
          price = 500000000;
        }

        // 4. Meta parsing from tag list
        const tags: string[] = [];
        el.find(".tag-list li").each((_, tagEl) => {
          tags.push($(tagEl).text().trim());
        });

        // Year
        let year = 2021; // fallback
        const yearMatch = rawTitle.match(/^\s*(\d{4})\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        } else {
          const anyYearMatch = rawTitle.match(/\b(20\d{2})\b/);
          if (anyYearMatch) {
            year = parseInt(anyYearMatch[1], 10);
          }
        }

        // Mileage
        let mileage = 25000;
        const mileageTag = tags.find(t => t.includes("km"));
        if (mileageTag) {
          const parsedMil = parseInt(mileageTag.replace(/\D/g, ""), 10);
          if (!isNaN(parsedMil)) {
            mileage = parsedMil;
          }
        }

        // Transmission
        let transmission = "Tự động";
        const transTag = tags.find(t => t.includes("tự động") || t.includes("sàn") || t.includes("tay"));
        if (transTag) {
          if (transTag.toLowerCase().includes("sàn") || transTag.toLowerCase().includes("tay")) {
            transmission = "Số sàn";
          }
        }

        // Fuel Type
        let fuel_type = "Xăng";
        const fuelTag = tags.find(t => t.includes("xăng") || t.includes("dầu") || t.includes("điện"));
        if (fuelTag) {
          if (fuelTag.toLowerCase().includes("dầu")) {
            fuel_type = "Dầu";
          } else if (fuelTag.toLowerCase().includes("điện")) {
            fuel_type = "Điện";
          }
        }

        // Brand & Model guessing
        const brandMatch = ["Toyota", "Mercedes", "BMW", "Audi", "Lexus", "Porsche", "Mazda", "Hyundai", "Kia", "Honda", "Ford", "VinFast", "Mitsubishi", "Chevrolet", "Acura"].find(
          (b) => cleanTitle.toLowerCase().includes(b.toLowerCase())
        );
        const finalBrand = brandMatch || (brand ? (brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()) : "Toyota");
        let model = cleanTitle.replace(new RegExp(finalBrand, "i"), "").trim();
        model = model.split(/\s+/)[0] || "Camry";

        // City & Address
        const cityText = el.find(".seller-location").text().trim();
        const city = cityText || "TP. Hồ Chí Minh";

        // Guessed body type
        let body_type = "Sedan";
        const titleLower = cleanTitle.toLowerCase();
        if (titleLower.includes("cr-v") || titleLower.includes("santafe") || titleLower.includes("tucson") || titleLower.includes("prado") || titleLower.includes("cx-5") || titleLower.includes("fortuner") || titleLower.includes("everest") || titleLower.includes("gls") || titleLower.includes("x5") || titleLower.includes("x6") || titleLower.includes("ecosport")) {
          body_type = "SUV";
        } else if (titleLower.includes("ranger") || titleLower.includes("hilux") || titleLower.includes("triton")) {
          body_type = "Bán tải";
        } else if (titleLower.includes("carnival") || titleLower.includes("innova") || titleLower.includes("custin") || titleLower.includes("xpander")) {
          body_type = "MPV";
        }

        // Fetch detail page to extract description and gallery images
        let cleanDescription = `Xe ${cleanTitle} còn rất mới, xe chính chủ đi giữ gìn kỹ lưỡng, đã được showroom kiểm định 176 hạng mục cam kết chất lượng.`;
        const gallery: string[] = [];

        const href = el.find("a").first().attr("href") || "";
        if (href) {
          const detailUrl = href.startsWith("http") ? href : `https://oto.com.vn${href}`;
          try {
            console.log(`Crawl Detail: Fetching details for ${cleanTitle} from ${detailUrl}`);
            const detailResponse = await fetch(detailUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
              },
              signal: AbortSignal.timeout(4000) // 4 seconds timeout for detail page
            });
            if (detailResponse.ok) {
              const detailHtml = await detailResponse.text();
              const $detail = cheerio.load(detailHtml);

              // 1. Description
              const desc = $detail(".description").text().trim();
              if (desc) {
                cleanDescription = desc.replace(/\s+/g, " ");
              }

              // 2. Gallery
              const urls = new Set<string>();
              $detail(".gallery-thumbs img, .gallery-top img").each((_, imgEl) => {
                const src = $detail(imgEl).attr("data-src") || $detail(imgEl).attr("src") || "";
                if (src.includes("/crop/") && !src.includes("Static/Images")) {
                  const highRes = src.replace(/\/crop\/\d+x\d+\//, "/crop/640x480/");
                  urls.add(highRes);
                }
              });
              gallery.push(...urls);
              console.log(`Crawl Detail: Extracted ${gallery.length} gallery images and description for ${cleanTitle}`);
            }
          } catch (detailErr: any) {
            console.warn(`Crawl Detail: Failed to crawl detail page for ${cleanTitle}:`, detailErr.message);
          }
        }

        return {
          title: cleanTitle,
          brand: finalBrand,
          model,
          year,
          price,
          mileage,
          fuel_type,
          transmission,
          body_type,
          color: "Đen", // default
          seats: body_type === "SUV" || body_type === "MPV" ? 7 : 5,
          engine: "2.0L", // default
          description: cleanDescription,
          city,
          address: `Showroom TQ Auto, Chi nhánh ${city}`,
          thumbnail: thumbnail.startsWith("http") ? thumbnail : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
          gallery,
          status: "available" as const
        };
      } catch (err) {
        console.error("Error parsing individual Oto.com.vn item:", err);
        return null;
      }
    });

    const crawledResults = await Promise.all(crawlPromises);
    for (const car of crawledResults) {
      if (car) {
        crawledCars.push(car);
      }
    }

    if (crawledCars.length > 0) {
      console.log(`Successfully parsed ${crawledCars.length} cars from Oto.com.vn.`);
      return crawledCars;
    } else {
      console.log("No cars crawled from Oto.com.vn, returning fallback data.");
      return FALLBACK_CRAWLED_CARS;
    }
  } catch (error) {
    console.warn("HTTP crawl request to Oto.com.vn failed. Using fallback data:", (error as any).message);
    return FALLBACK_CRAWLED_CARS;
  }
}

export async function crawlChoTotCars(brand?: string, condition?: "new" | "used"): Promise<CrawledCar[]> {
  try {
    console.log(`Starting HTTP crawl request to Chotot.com (brand: ${brand || "all"}, condition: ${condition || "used"})...`);
    
    let url = "https://xe.chotot.com/mua-ban-oto";
    const mappedBrand = brand ? brand.toLowerCase() : "";
    if (mappedBrand) {
      const chototBrandSlugs: Record<string, string> = {
        "toyota": "toyota-sdcb2",
        "ford": "ford-sdcb3",
        "kia": "kia-sdcb1",
        "hyundai": "hyundai-sdcb5",
        "vinfast": "vinfast-sdcb80",
        "mazda": "mazda-sdcb10",
        "honda": "honda-sdcb7",
        "mitsubishi": "mitsubishi-sdcb12",
        "mercedes": "mercedes-benz-sdcb66",
        "mercedes-benz": "mercedes-benz-sdcb66",
        "bmw": "bmw-sdcb9",
        "audi": "audi-sdcb15",
        "lexus": "lexus-sdcb30",
        "porsche": "porsche-sdcb59"
      };
      const slug = chototBrandSlugs[mappedBrand];
      if (slug) {
        url = `https://xe.chotot.com/mua-ban-oto-${slug}`;
      } else {
        url = `https://xe.chotot.com/mua-ban-oto-${mappedBrand}`;
      }
    }

    if (condition === "new") {
      url += "?condition=new";
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const crawledCars: CrawledCar[] = [];

    const carLinks = $("a[href*='.htm']");
    const matchedElements: { href: string; el: cheerio.Cheerio<any> }[] = [];
    carLinks.each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.match(/\/mua-ban-.*\/.*\.htm/)) {
        if (!matchedElements.some(item => item.href === href)) {
          matchedElements.push({ href, el: $(el) });
        }
      }
    });

    console.log(`Found ${matchedElements.length} raw car elements on Chotot page.`);

    const carElements = matchedElements.slice(0, 10);
    for (const item of carElements) {
      try {
        const elA = item.el;
        const innerHtml = elA.html() || "";

        // 1. Image
        const imgMatch = innerHtml.match(/https:\/\/(cdn\.chotot\.com|videodelivery\.net)\/[^\s"']+\.jpg/);
        const thumbnail = imgMatch ? imgMatch[0] : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";

        // 2. Title
        const altMatch = innerHtml.match(/alt="([^"]+)"/);
        let rawTitle = altMatch ? altMatch[1] : "";
        if (!rawTitle) {
          rawTitle = elA.text().trim();
        }
        let cleanTitle = rawTitle.split(". Mua bán")[0].trim();
        cleanTitle = cleanTitle.split(" được đăng")[0].trim();
        cleanTitle = cleanTitle.replace(/^[\s🚨🎁🔥🚘🚗⭐]+/, "").trim();
        cleanTitle = cleanTitle.replace(/[\s🚨🎁🔥🚘🚗⭐]+$/, "").trim();

        if (!cleanTitle) continue;

        // 3. Price
        const priceMatch = elA.text().match(/(\d{1,3}(\.\d{3})*)\s*đ/);
        let price = 500000000;
        if (priceMatch) {
          price = parseInt(priceMatch[1].replace(/\./g, ""), 10);
        }

        // 4. Description
        const cleanDescription = `Xe ${cleanTitle} còn rất tốt, được bảo dưỡng định kỳ đầy đủ, xe gia đình sử dụng giữ gìn cẩn thận. Showroom cam kết xe không đâm đụng, không ngập nước.`;

        // 5. Specs
        const textContent = elA.text().replace(/\s+/g, " ");

        // Year
        let year = 2021;
        const yearMatch = textContent.match(/\b(20\d{2})\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        }

        // Mileage
        let mileage = 25000;
        const kmMatch = textContent.match(/(\d+)\s*km/i);
        if (kmMatch) {
          mileage = parseInt(kmMatch[1], 10);
        }

        // Fuel
        let fuel_type = "Xăng";
        if (textContent.includes("Dầu") || textContent.toLowerCase().includes("diesel")) {
          fuel_type = "Dầu";
        } else if (textContent.includes("Điện")) {
          fuel_type = "Điện";
        } else if (textContent.includes("Hybrid")) {
          fuel_type = "Hybrid";
        }

        // Transmission
        let transmission = "Tự động";
        if (textContent.includes("Số sàn") || textContent.toLowerCase().includes("mt")) {
          transmission = "Số sàn";
        }

        // Brand & Model
        const brandMatch = ["Toyota", "Mercedes", "BMW", "Audi", "Lexus", "Porsche", "Mazda", "Hyundai", "Kia", "Honda", "Ford", "VinFast", "Mitsubishi", "Chevrolet", "Acura"].find(
          (b) => cleanTitle.toLowerCase().includes(b.toLowerCase())
        );
        const finalBrand = brandMatch || (brand ? (brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()) : "Toyota");
        let model = cleanTitle.replace(new RegExp(finalBrand, "i"), "").trim();
        model = model.split(/\s+/)[0] || "Accent";

        // City
        const cityMatch = textContent.match(/(Tp Hồ Chí Minh|Hà Nội|Đà Nẵng|Cần Thơ|Bình Dương|Đồng Nai|Hải Phòng|Quảng Ninh|Vĩnh Long)/i);
        const city = cityMatch ? cityMatch[0] : "TP. Hồ Chí Minh";
        const address = `Showroom TQ Auto, ${city}`;

        crawledCars.push({
          title: cleanTitle,
          brand: finalBrand,
          model,
          year,
          price,
          mileage,
          fuel_type,
          transmission,
          body_type: "Sedan",
          color: "Đen",
          seats: 5,
          engine: "2.0L",
          description: cleanDescription,
          city,
          address,
          thumbnail,
          gallery: [thumbnail],
          status: "available"
        });
      } catch (err: any) {
        console.warn("Failed to parse Chotot item:", err.message);
      }
    }

    if (crawledCars.length > 0) {
      console.log(`Successfully parsed ${crawledCars.length} cars from Chotot.com.`);
      return crawledCars;
    } else {
      console.log("No cars crawled from Chotot, returning fallback.");
      return FALLBACK_CRAWLED_CARS;
    }
  } catch (error: any) {
    console.warn("HTTP crawl request to Chotot failed. Using fallback:", error.message);
    return FALLBACK_CRAWLED_CARS;
  }
}

interface HeuristicSpec {
  brand: string;
  model: string;
  seats: number;
  engine: string;
  body_type: string;
  drivetrain: "FWD" | "RWD" | "AWD" | "4WD";
  doors: number;
  origin: "imported" | "domestic";
  fuel_type?: string;
  transmission?: string;
}

const KNOWN_MODELS: { keywords: string[]; specs: HeuristicSpec }[] = [
  // VinFast
  { keywords: ["vf 3", "vf3"], specs: { brand: "VinFast", model: "VF 3", seats: 5, engine: "Electric", body_type: "SUV", drivetrain: "RWD", doors: 3, origin: "domestic", fuel_type: "Điện", transmission: "Tự động" } },
  { keywords: ["vf 5", "vf5"], specs: { brand: "VinFast", model: "VF 5", seats: 5, engine: "Electric", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Điện", transmission: "Tự động" } },
  { keywords: ["vf 6", "vf6"], specs: { brand: "VinFast", model: "VF 6", seats: 5, engine: "Electric", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Điện", transmission: "Tự động" } },
  { keywords: ["vf 8", "vf8"], specs: { brand: "VinFast", model: "VF 8", seats: 5, engine: "Electric", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "domestic", fuel_type: "Điện", transmission: "Tự động" } },
  { keywords: ["vf 9", "vf9"], specs: { brand: "VinFast", model: "VF 9", seats: 7, engine: "Electric", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "domestic", fuel_type: "Điện", transmission: "Tự động" } },
  { keywords: ["lux a2.0", "lux a"], specs: { brand: "VinFast", model: "Lux A2.0", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["lux sa2.0", "lux sa"], specs: { brand: "VinFast", model: "Lux SA2.0", seats: 7, engine: "2.0L", body_type: "SUV", drivetrain: "RWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["fadil"], specs: { brand: "VinFast", model: "Fadil", seats: 5, engine: "1.4L", body_type: "Hatchback", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },

  // Toyota
  { keywords: ["camry"], specs: { brand: "Toyota", model: "Camry", seats: 5, engine: "2.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["vios"], specs: { brand: "Toyota", model: "Vios", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng" } },
  { keywords: ["fortuner"], specs: { brand: "Toyota", model: "Fortuner", seats: 7, engine: "2.4L", body_type: "SUV", drivetrain: "RWD", doors: 5, origin: "domestic" } },
  { keywords: ["innova"], specs: { brand: "Toyota", model: "Innova", seats: 7, engine: "2.0L", body_type: "MPV", drivetrain: "RWD", doors: 5, origin: "domestic" } },
  { keywords: ["corolla cross", "toyota cross", "cross 1.8"], specs: { brand: "Toyota", model: "Corolla Cross", seats: 5, engine: "1.8L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "imported" } },
  { keywords: ["prado"], specs: { brand: "Toyota", model: "Land Cruiser Prado", seats: 7, engine: "2.7L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["land cruiser", "landcruiser"], specs: { brand: "Toyota", model: "Land Cruiser", seats: 7, engine: "3.5L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["yaris"], specs: { brand: "Toyota", model: "Yaris", seats: 5, engine: "1.5L", body_type: "Hatchback", drivetrain: "FWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["wigo"], specs: { brand: "Toyota", model: "Wigo", seats: 5, engine: "1.2L", body_type: "Hatchback", drivetrain: "FWD", doors: 5, origin: "imported", fuel_type: "Xăng" } },
  { keywords: ["veloz"], specs: { brand: "Toyota", model: "Veloz Cross", seats: 7, engine: "1.5L", body_type: "MPV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["avanza"], specs: { brand: "Toyota", model: "Avanza", seats: 7, engine: "1.5L", body_type: "MPV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng" } },

  // Hyundai
  { keywords: ["santafe", "santa fe"], specs: { brand: "Hyundai", model: "Santa Fe", seats: 7, engine: "2.2L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["tucson"], specs: { brand: "Hyundai", model: "Tucson", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["creta"], specs: { brand: "Hyundai", model: "Creta", seats: 5, engine: "1.5L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["accent"], specs: { brand: "Hyundai", model: "Accent", seats: 5, engine: "1.4L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic" } },
  { keywords: ["i10", "grand i10"], specs: { brand: "Hyundai", model: "Grand i10", seats: 5, engine: "1.2L", body_type: "Hatchback", drivetrain: "FWD", doors: 5, origin: "domestic" } },
  { keywords: ["custin"], specs: { brand: "Hyundai", model: "Custin", seats: 7, engine: "2.0L", body_type: "MPV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["palisade"], specs: { brand: "Hyundai", model: "Palisade", seats: 7, engine: "2.2L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "domestic", fuel_type: "Dầu", transmission: "Tự động" } },
  { keywords: ["elantra"], specs: { brand: "Hyundai", model: "Elantra", seats: 5, engine: "1.6L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },

  // Kia
  { keywords: ["morning"], specs: { brand: "Kia", model: "Morning", seats: 5, engine: "1.25L", body_type: "Hatchback", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng" } },
  { keywords: ["carnival"], specs: { brand: "Kia", model: "Carnival", seats: 7, engine: "2.2L", body_type: "MPV", drivetrain: "FWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["sorento"], specs: { brand: "Kia", model: "Sorento", seats: 7, engine: "2.2L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["seltos"], specs: { brand: "Kia", model: "Seltos", seats: 5, engine: "1.4L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["cerato"], specs: { brand: "Kia", model: "Cerato", seats: 5, engine: "1.6L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic" } },
  { keywords: ["k3"], specs: { brand: "Kia", model: "K3", seats: 5, engine: "1.6L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["sonet"], specs: { brand: "Kia", model: "Sonet", seats: 5, engine: "1.5L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["soluto"], specs: { brand: "Kia", model: "Soluto", seats: 5, engine: "1.4L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic" } },
  { keywords: ["rondo", "carens"], specs: { brand: "Kia", model: "Rondo", seats: 7, engine: "2.0L", body_type: "MPV", drivetrain: "FWD", doors: 5, origin: "domestic" } },

  // Mazda
  { keywords: ["mazda 3", "mazda3"], specs: { brand: "Mazda", model: "Mazda 3", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["mazda 6", "mazda6"], specs: { brand: "Mazda", model: "Mazda 6", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["mazda 2", "mazda2"], specs: { brand: "Mazda", model: "Mazda 2", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["cx-5", "cx5"], specs: { brand: "Mazda", model: "CX-5", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["cx-8", "cx8"], specs: { brand: "Mazda", model: "CX-8", seats: 7, engine: "2.5L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", transmission: "Tự động" } },
  { keywords: ["cx-3", "cx3"], specs: { brand: "Mazda", model: "CX-3", seats: 5, engine: "1.5L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "imported", transmission: "Tự động" } },
  { keywords: ["bt-50", "bt50"], specs: { brand: "Mazda", model: "BT-50", seats: 5, engine: "1.9L", body_type: "Bán tải", drivetrain: "4WD", doors: 4, origin: "imported", fuel_type: "Dầu" } },

  // Ford
  { keywords: ["ranger"], specs: { brand: "Ford", model: "Ranger", seats: 5, engine: "2.0L", body_type: "Bán tải", drivetrain: "4WD", doors: 4, origin: "domestic", fuel_type: "Dầu" } },
  { keywords: ["everest"], specs: { brand: "Ford", model: "Everest", seats: 7, engine: "2.0L", body_type: "SUV", drivetrain: "RWD", doors: 5, origin: "imported", fuel_type: "Dầu", transmission: "Tự động" } },
  { keywords: ["explorer"], specs: { brand: "Ford", model: "Explorer", seats: 7, engine: "2.3L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["ecosport", "eco sport"], specs: { brand: "Ford", model: "EcoSport", seats: 5, engine: "1.5L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng" } },
  { keywords: ["territory"], specs: { brand: "Ford", model: "Territory", seats: 5, engine: "1.5L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["transit"], specs: { brand: "Ford", model: "Transit", seats: 16, engine: "2.2L", body_type: "MPV", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Dầu", transmission: "Số sàn" } },

  // Mitsubishi
  { keywords: ["xpander"], specs: { brand: "Mitsubishi", model: "Xpander", seats: 7, engine: "1.5L", body_type: "MPV", drivetrain: "FWD", doors: 5, origin: "imported", fuel_type: "Xăng" } },
  { keywords: ["outlander"], specs: { brand: "Mitsubishi", model: "Outlander", seats: 7, engine: "2.0L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["triton"], specs: { brand: "Mitsubishi", model: "Triton", seats: 5, engine: "2.4L", body_type: "Bán tải", drivetrain: "4WD", doors: 4, origin: "imported", fuel_type: "Dầu" } },
  { keywords: ["pajero"], specs: { brand: "Mitsubishi", model: "Pajero Sport", seats: 7, engine: "2.4L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Dầu", transmission: "Tự động" } },
  { keywords: ["attrage"], specs: { brand: "Mitsubishi", model: "Attrage", seats: 5, engine: "1.2L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "imported", fuel_type: "Xăng" } },

  // Honda
  { keywords: ["city"], specs: { brand: "Honda", model: "City", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["civic"], specs: { brand: "Honda", model: "Civic", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "imported", fuel_type: "Xăng" } },
  { keywords: ["cr-v", "crv"], specs: { brand: "Honda", model: "CR-V", seats: 7, engine: "1.5L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic" } },
  { keywords: ["hr-v", "hrv"], specs: { brand: "Honda", model: "HR-V", seats: 5, engine: "1.5L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["brio"], specs: { brand: "Honda", model: "Brio", seats: 5, engine: "1.2L", body_type: "Hatchback", drivetrain: "FWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["accord"], specs: { brand: "Honda", model: "Accord", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // Mercedes-Benz
  { keywords: ["g63", "g 63"], specs: { brand: "Mercedes-Benz", model: "G63 AMG", seats: 5, engine: "4.0L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["gls 450", "gls450"], specs: { brand: "Mercedes-Benz", model: "GLS 450", seats: 7, engine: "3.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["eqs 580", "eqs580"], specs: { brand: "Mercedes-Benz", model: "EQS 580", seats: 5, engine: "Electric", body_type: "Sedan", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Điện", transmission: "Tự động" } },
  { keywords: ["glc 300", "glc300"], specs: { brand: "Mercedes-Benz", model: "GLC 300", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["glc 200", "glc200"], specs: { brand: "Mercedes-Benz", model: "GLC 200", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["s450", "s 450"], specs: { brand: "Mercedes-Benz", model: "S450", seats: 5, engine: "3.0L", body_type: "Sedan", drivetrain: "AWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["s400", "s 400"], specs: { brand: "Mercedes-Benz", model: "S400", seats: 5, engine: "3.0L", body_type: "Sedan", drivetrain: "AWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["c300", "c 300"], specs: { brand: "Mercedes-Benz", model: "C300", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["c200", "c 200"], specs: { brand: "Mercedes-Benz", model: "C200", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["c180", "c 180"], specs: { brand: "Mercedes-Benz", model: "C180", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["e300", "e 300"], specs: { brand: "Mercedes-Benz", model: "E300", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["e200", "e 200"], specs: { brand: "Mercedes-Benz", model: "E200", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["e180", "e 180"], specs: { brand: "Mercedes-Benz", model: "E180", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["c-class", "mercedes c"], specs: { brand: "Mercedes-Benz", model: "C-Class", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["e-class", "mercedes e"], specs: { brand: "Mercedes-Benz", model: "E-Class", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["s-class", "maybach"], specs: { brand: "Mercedes-Benz", model: "S-Class", seats: 5, engine: "3.0L", body_type: "Sedan", drivetrain: "AWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["glc"], specs: { brand: "Mercedes-Benz", model: "GLC", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["gls"], specs: { brand: "Mercedes-Benz", model: "GLS", seats: 7, engine: "3.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["eqs"], specs: { brand: "Mercedes-Benz", model: "EQS", seats: 5, engine: "Electric", body_type: "Sedan", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Điện", transmission: "Tự động" } },
  { keywords: ["g-class"], specs: { brand: "Mercedes-Benz", model: "G-Class", seats: 5, engine: "4.0L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // BMW
  { keywords: ["330i", "330"], specs: { brand: "BMW", model: "330i", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["320i", "320"], specs: { brand: "BMW", model: "320i", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["328i", "328"], specs: { brand: "BMW", model: "328i", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["530i", "530"], specs: { brand: "BMW", model: "530i", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["520i", "520"], specs: { brand: "BMW", model: "520i", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["528i", "528"], specs: { brand: "BMW", model: "528i", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["740li", "740"], specs: { brand: "BMW", model: "740Li", seats: 5, engine: "3.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["730li", "730"], specs: { brand: "BMW", model: "730Li", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["430i", "430"], specs: { brand: "BMW", model: "430i", seats: 4, engine: "2.0L", body_type: "Mui trần", drivetrain: "RWD", doors: 2, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["420i", "420"], specs: { brand: "BMW", model: "420i", seats: 4, engine: "2.0L", body_type: "Mui trần", drivetrain: "RWD", doors: 2, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["3-series", "bmw 3"], specs: { brand: "BMW", model: "3 Series", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["5-series", "bmw 5"], specs: { brand: "BMW", model: "5 Series", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["7-series", "bmw 7"], specs: { brand: "BMW", model: "7 Series", seats: 5, engine: "3.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["x3"], specs: { brand: "BMW", model: "X3", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["x5"], specs: { brand: "BMW", model: "X5", seats: 7, engine: "3.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["x6"], specs: { brand: "BMW", model: "X6", seats: 5, engine: "3.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["x7"], specs: { brand: "BMW", model: "X7", seats: 7, engine: "3.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["4-series"], specs: { brand: "BMW", model: "4 Series", seats: 4, engine: "2.0L", body_type: "Mui trần", drivetrain: "RWD", doors: 2, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // Lexus
  { keywords: ["lx 570", "lx570"], specs: { brand: "Lexus", model: "LX 570", seats: 7, engine: "5.7L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["lx 600", "lx600"], specs: { brand: "Lexus", model: "LX 600", seats: 7, engine: "3.5L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["rx 350", "rx350"], specs: { brand: "Lexus", model: "RX 350", seats: 5, engine: "3.5L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["rx 300", "rx300"], specs: { brand: "Lexus", model: "RX 300", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["es 250", "es250"], specs: { brand: "Lexus", model: "ES 250", seats: 5, engine: "2.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["es 300", "es300"], specs: { brand: "Lexus", model: "ES 300h", seats: 5, engine: "2.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "imported", fuel_type: "Hybrid", transmission: "Tự động" } },
  { keywords: ["gx460", "lexus gx"], specs: { brand: "Lexus", model: "GX 460", seats: 7, engine: "4.6L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["rx400", "rx450", "lexus rx"], specs: { brand: "Lexus", model: "RX", seats: 5, engine: "3.5L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["lexus lx"], specs: { brand: "Lexus", model: "LX", seats: 7, engine: "5.7L", body_type: "SUV", drivetrain: "4WD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["lexus es"], specs: { brand: "Lexus", model: "ES", seats: 5, engine: "2.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // Porsche
  { keywords: ["macan"], specs: { brand: "Porsche", model: "Macan", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["cayenne"], specs: { brand: "Porsche", model: "Cayenne", seats: 5, engine: "3.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },
  { keywords: ["panamera"], specs: { brand: "Porsche", model: "Panamera", seats: 4, engine: "2.9L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // McLaren
  { keywords: ["650s", "mclaren 650"], specs: { brand: "McLaren", model: "650S", seats: 2, engine: "3.8L", body_type: "Mui trần", drivetrain: "RWD", doors: 2, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // Morgan
  { keywords: ["morgan", "plus four"], specs: { brand: "Morgan", model: "Plus Four", seats: 2, engine: "2.0L", body_type: "Mui trần", drivetrain: "RWD", doors: 2, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // Acura
  { keywords: ["mdx"], specs: { brand: "Acura", model: "MDX", seats: 7, engine: "3.5L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // BAIC Beijing
  { keywords: ["beijing u5", "u5 plus"], specs: { brand: "BAIC", model: "Beijing U5 Plus", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // Land Rover Range Rover
  { keywords: ["autobiography", "range rover", "defender", "velar", "discovery"], specs: { brand: "Land Rover", model: "Range Rover", seats: 5, engine: "3.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" } },

  // Fiat Siena
  { keywords: ["fiat siena", "siena"], specs: { brand: "Fiat", model: "Siena", seats: 5, engine: "1.4L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Số sàn" } }
];

const BRAND_FALLBACKS: Record<string, Partial<HeuristicSpec>> = {
  "vinfast": { brand: "VinFast", model: "VinFast", seats: 5, engine: "Electric", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Điện", transmission: "Tự động" },
  "toyota": { brand: "Toyota", model: "Toyota", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" },
  "bmw": { brand: "BMW", model: "BMW", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" },
  "mercedes": { brand: "Mercedes-Benz", model: "Mercedes-Benz", seats: 5, engine: "2.0L", body_type: "Sedan", drivetrain: "RWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" },
  "honda": { brand: "Honda", model: "Honda", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" },
  "kia": { brand: "Kia", model: "Kia", seats: 5, engine: "1.6L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" },
  "hyundai": { brand: "Hyundai", model: "Hyundai", seats: 5, engine: "1.6L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" },
  "ford": { brand: "Ford", model: "Ford", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "FWD", doors: 5, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" },
  "mazda": { brand: "Mazda", model: "Mazda", seats: 5, engine: "1.5L", body_type: "Sedan", drivetrain: "FWD", doors: 4, origin: "domestic", fuel_type: "Xăng", transmission: "Tự động" },
  "mitsubishi": { brand: "Mitsubishi", model: "Mitsubishi", seats: 7, engine: "1.5L", body_type: "MPV", drivetrain: "FWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" },
  "porsche": { brand: "Porsche", model: "Porsche", seats: 5, engine: "2.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" },
  "lexus": { brand: "Lexus", model: "Lexus", seats: 5, engine: "3.5L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" },
  "land rover": { brand: "Land Rover", model: "Range Rover", seats: 5, engine: "3.0L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" },
  "acura": { brand: "Acura", model: "Acura", seats: 7, engine: "3.5L", body_type: "SUV", drivetrain: "AWD", doors: 5, origin: "imported", fuel_type: "Xăng", transmission: "Tự động" }
};

export function cleanCarTitle(originalTitle: string, brand: string, model: string): string {
  // Common versions, trims, or variants to keep as part of the model name in Vietnam
  const versions = [
    "wildtrak", "raptor", "xls", "xlt", "sportline", "m sport", "msport", "luxury",
    "premium", "signature", "eco", "plus", "autobiography", "super sport", "supersport",
    "vogue", "executive", "convertible", "spider", "2.5q", "2.0g", "2.0e", "1.5g", "1.5e",
    "1.8hv", "1.8g", "1.8v", "1.4 at", "1.4 mt", "1.5 mt", "1.5 at", "active", "style",
    "a2.0", "sa2.0", "gt", "titanium"
  ];

  const titleLower = originalTitle.toLowerCase();
  
  // Construct starting title: Brand + Model
  let cleanTitle = brand;
  if (!model.toLowerCase().includes(brand.toLowerCase())) {
    cleanTitle += ` ${model}`;
  } else {
    cleanTitle = model;
  }

  // Look for any version keywords in the original title and append the first matched one
  for (const v of versions) {
    const escapedV = v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedV}\\b`, "i");

    if (regex.test(titleLower)) {
      // Check if version is already in the title to avoid duplication
      if (cleanTitle.toLowerCase().includes(v)) {
        continue;
      }
      
      let matchedStr = "";
      const idx = titleLower.indexOf(v);
      if (idx !== -1) {
        matchedStr = originalTitle.substring(idx, idx + v.length).trim();
      }
      
      // Standardize known casings
      if (v === "msport" || v === "m sport") matchedStr = "M-Sport";
      else if (v === "super sport" || v === "supersport") matchedStr = "Super Sport";
      else if (v === "2.5q") matchedStr = "2.5Q";
      else if (v === "2.0g") matchedStr = "2.0G";
      else if (v === "2.0e") matchedStr = "2.0E";
      else if (v === "1.5g") matchedStr = "1.5G";
      else if (v === "1.5e") matchedStr = "1.5E";
      else if (v === "1.8hv") matchedStr = "1.8HV";
      else if (v === "1.8g") matchedStr = "1.8G";
      else if (v === "1.8v") matchedStr = "1.8V";
      else if (v === "a2.0") matchedStr = "A2.0";
      else if (v === "sa2.0") matchedStr = "SA2.0";
      else {
        // Capitalize words
        matchedStr = matchedStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      cleanTitle += ` ${matchedStr}`;
      break;
    }
  }

  return cleanTitle.replace(/\s+/g, " ").trim();
}

export function standardizeCarHeuristically(crawledCar: CrawledCar): CrawledCar | null {
  const titleLower = crawledCar.title.toLowerCase();
  
  // Find a known model
  let matchedSpec: HeuristicSpec | null = null;
  for (const item of KNOWN_MODELS) {
    if (item.keywords.some(kw => titleLower.includes(kw))) {
      matchedSpec = item.specs;
      break;
    }
  }

  // If no specific model pattern matches, try brand fallbacks
  if (!matchedSpec) {
    const brandKey = Object.keys(BRAND_FALLBACKS).find(b => titleLower.includes(b));
    if (brandKey) {
      const fallback = BRAND_FALLBACKS[brandKey];
      matchedSpec = {
        brand: fallback.brand!,
        model: crawledCar.model && crawledCar.model.toLowerCase() !== "xe" ? crawledCar.model : fallback.model!,
        seats: crawledCar.seats && crawledCar.seats !== 5 ? crawledCar.seats : fallback.seats!,
        engine: crawledCar.engine && crawledCar.engine !== "2.0L" ? crawledCar.engine : fallback.engine!,
        body_type: crawledCar.body_type && crawledCar.body_type !== "Sedan" ? crawledCar.body_type : fallback.body_type!,
        drivetrain: crawledCar.drivetrain || fallback.drivetrain!,
        doors: crawledCar.doors || fallback.doors!,
        origin: crawledCar.origin || fallback.origin!,
        fuel_type: crawledCar.fuel_type || fallback.fuel_type,
        transmission: crawledCar.transmission || fallback.transmission
      };
    }
  }

  // If still no spec matched, return null so it falls back to Gemini
  if (!matchedSpec) {
    return null;
  }

  // Clean title using standard name logic
  let cleanTitle = cleanCarTitle(crawledCar.title, matchedSpec.brand, matchedSpec.model);

  // Determine dynamic overrides
  let seats = matchedSpec.seats;
  const seatsMatch = titleLower.match(/(\d+)\s*chỗ/);
  if (seatsMatch) {
    seats = parseInt(seatsMatch[1], 10);
  }

  let engine = matchedSpec.engine;
  const engineMatch = titleLower.match(/(\d+\.\d+)\s*l/i) || titleLower.match(/(\d+\.\d+)\b/);
  if (engineMatch && !titleLower.includes("electric") && !titleLower.includes("điện")) {
    engine = engineMatch[1] + "L";
  }

  let transmission = matchedSpec.transmission || crawledCar.transmission || "Tự động";
  if (titleLower.includes("số sàn") || titleLower.includes("số tay") || titleLower.includes("mt")) {
    transmission = "Số sàn";
  } else if (titleLower.includes("tự động") || titleLower.includes("at") || titleLower.includes("cvt") || titleLower.includes("dct")) {
    transmission = "Tự động";
  }

  let fuel_type = matchedSpec.fuel_type || crawledCar.fuel_type || "Xăng";
  if (titleLower.includes("máy dầu") || titleLower.includes("diesel")) {
    fuel_type = "Dầu";
  } else if (titleLower.includes("điện") || titleLower.includes("ev") || titleLower.includes("electric")) {
    fuel_type = "Điện";
    engine = "Electric";
    transmission = "Tự động";
  } else if (titleLower.includes("hybrid") || titleLower.includes("hev") || titleLower.includes("phev") || titleLower.includes("hv")) {
    fuel_type = "Hybrid";
  }

  let drivetrain = matchedSpec.drivetrain || crawledCar.drivetrain || "FWD";
  if (titleLower.includes("4x4") || titleLower.includes("4wd") || titleLower.includes("2 cầu") || titleLower.includes("4matic") || titleLower.includes("xdrive") || titleLower.includes("quattro") || titleLower.includes("htrac")) {
    drivetrain = (matchedSpec.body_type === "SUV" || matchedSpec.body_type === "Bán tải") ? "4WD" : "AWD";
  } else if (titleLower.includes("fwd") || titleLower.includes("1 cầu") || titleLower.includes("cầu trước")) {
    drivetrain = "FWD";
  } else if (titleLower.includes("rwd") || titleLower.includes("cầu sau")) {
    drivetrain = "RWD";
  }

  let origin = matchedSpec.origin || crawledCar.origin || "domestic";
  if (titleLower.includes("nhập khẩu") || titleLower.includes("nhập") || titleLower.includes("nhap khau")) {
    origin = "imported";
  } else if (titleLower.includes("lắp ráp") || titleLower.includes("trong nước")) {
    origin = "domestic";
  }

  let doors = matchedSpec.doors;
  if (titleLower.includes("2 cửa") || titleLower.includes("2 doors") || matchedSpec.body_type === "Mui trần") {
    doors = 2;
  } else if (titleLower.includes("3 cửa") || titleLower.includes("3 doors")) {
    doors = 3;
  }

  // Clean description: remove advertiser links or phone numbers
  let cleanDesc = crawledCar.description
    .replace(/0\d{9,10}\b/g, "")
    .replace(/(http|https):\/\/[^\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    ...crawledCar,
    title: cleanTitle,
    brand: matchedSpec.brand,
    model: matchedSpec.model,
    seats,
    engine,
    body_type: matchedSpec.body_type,
    transmission,
    fuel_type,
    drivetrain,
    doors,
    origin,
    description: cleanDesc
  };
}

export async function standardizeCarWithAI(crawledCar: CrawledCar): Promise<CrawledCar> {
  // Try heuristic mapping first to avoid unnecessary AI requests and hallucinations
  try {
    const heuristicMatch = standardizeCarHeuristically(crawledCar);
    if (heuristicMatch) {
      console.log(`[Heuristics] Instantly standardized known model: "${crawledCar.title}" -> "${heuristicMatch.title}"`);
      return heuristicMatch;
    }
  } catch (err: any) {
    console.warn("Error running heuristic standardization:", err.message);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("GEMINI_API_KEY not found in environment, returning crawled car.");
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

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn("Gemini API call failed status:", res.status);
      return crawledCar;
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return crawledCar;

    const parsed = JSON.parse(text);
    const brand = parsed.brand || crawledCar.brand;
    const model = parsed.model || crawledCar.model;
    const cleanTitle = cleanCarTitle(crawledCar.title, brand, model);
    return {
      ...crawledCar,
      title: cleanTitle,
      brand,
      model,
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
  } catch (error) {
    console.warn("Failed to standardize car data with Gemini:", error);
    return crawledCar;
  }
}
