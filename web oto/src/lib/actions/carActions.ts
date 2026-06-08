"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { saveCar, saveCarImages, updateCar, deleteCar, clearCarGallery, DbCar, getCars, getPool } from "@/lib/db";
import { ActionResponse } from "./auth";
import { crawlBonBanhCars, crawlOtoCars } from "@/lib/crawlService";

const UPLOAD_DIR_NAME = "uploads";

async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uploadDir = path.join(process.cwd(), "public", UPLOAD_DIR_NAME);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Generate unique filename
  const fileExt = path.extname(file.name) || ".jpg";
  const fileName = `${crypto.randomUUID()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);
  
  await fs.promises.writeFile(filePath, buffer);
  return `/${UPLOAD_DIR_NAME}/${fileName}`;
}

export async function createCarAction(formData: FormData): Promise<ActionResponse & { carId?: string }> {
  try {
    const title = formData.get("title")?.toString().trim() || "";
    const title_vi = formData.get("title_vi")?.toString().trim() || title;
    const title_en = formData.get("title_en")?.toString().trim() || "";
    const brand = formData.get("brand")?.toString().trim() || "";
    const model = formData.get("model")?.toString().trim() || "";
    const year = parseInt(formData.get("year")?.toString() || "2022", 10);
    const price = parseInt(formData.get("price")?.toString() || "0", 10);
    const mileage = parseInt(formData.get("mileage")?.toString() || "0", 10);
    const fuelType = formData.get("fuelType")?.toString().trim() || "";
    const transmission = formData.get("transmission")?.toString().trim() || "";
    const bodyType = formData.get("bodyType")?.toString().trim() || "";
    const color = formData.get("color")?.toString().trim() || "";
    const seats = parseInt(formData.get("seats")?.toString() || "5", 10);
    const engine = formData.get("engine")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
    const description_vi = formData.get("description_vi")?.toString().trim() || description;
    const description_en = formData.get("description_en")?.toString().trim() || "";
    const city = formData.get("city")?.toString().trim() || "";
    const address = formData.get("address")?.toString().trim() || "";
    const status = (formData.get("status")?.toString() || "available") as DbCar["status"];
    const carCondition = (formData.get("carCondition")?.toString() || "used") as DbCar["car_condition"];
    const conditionType = (formData.get("conditionType")?.toString() || "used") as DbCar["condition_type"];
    const origin = (formData.get("origin")?.toString() || "domestic") as DbCar["origin"];
    const interiorColor = formData.get("interiorColor")?.toString().trim() || "";
    const doors = parseInt(formData.get("doors")?.toString() || "4", 10);
    const drivetrain = (formData.get("drivetrain")?.toString() || "FWD") as DbCar["drivetrain"];
    
    const reservedUntilRaw = formData.get("reservedUntil")?.toString() || "";
    const reservedUntilVal = status === "reserved" && reservedUntilRaw ? new Date(reservedUntilRaw).toISOString() : null;

    // SOLD SPECIFICATIONS
    const soldPriceRaw = formData.get("soldPrice")?.toString() || "";
    const soldBy = formData.get("soldBy")?.toString() || null;
    const buyerId = formData.get("buyerId")?.toString() || null;
    const soldPrice = status === "sold" ? (parseInt(soldPriceRaw, 10) || 0) : null;
    const soldAtVal = status === "sold" ? new Date().toISOString() : null;
    
    // Default admin user ID
    const userId = formData.get("userId")?.toString() || "a0000000-0000-0000-0000-000000000001";

    const errors: Record<string, string> = {};

    if (!title) errors.title = "Tên xe là bắt buộc";
    if (!brand) errors.brand = "Hãng xe là bắt buộc";
    if (!model) errors.model = "Mẫu xe là bắt buộc";
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) errors.year = "Năm sản xuất không hợp lệ";
    if (isNaN(price) || price <= 0) errors.price = "Giá bán phải lớn hơn 0";
    if (isNaN(mileage) || mileage < 0) errors.mileage = "Số km không hợp lệ";
    if (!fuelType) errors.fuelType = "Loại nhiên liệu là bắt buộc";
    if (!transmission) errors.transmission = "Hộp số là bắt buộc";
    if (!bodyType) errors.bodyType = "Kiểu dáng là bắt buộc";
    if (!color) errors.color = "Màu ngoại thất là bắt buộc";
    if (!interiorColor) errors.interiorColor = "Màu nội thất là bắt buộc";
    if (isNaN(doors) || doors <= 0) errors.doors = "Số cửa không hợp lệ";
    if (isNaN(seats) || seats <= 0) errors.seats = "Số chỗ ngồi không hợp lệ";
    if (!engine) errors.engine = "Dung tích động cơ là bắt buộc";
    if (!description) errors.description = "Mô tả chi tiết là bắt buộc";
    if (!city) errors.city = "Tỉnh/Thành phố là bắt buộc";
    if (!address) errors.address = "Địa điểm xem xe là bắt buộc";

    if (status === "reserved") {
      if (!reservedUntilRaw) {
        errors.reservedUntil = "Thời gian giữ cọc là bắt buộc";
      } else if (!reservedUntilRaw.includes("T")) {
        errors.reservedUntil = "Vui lòng chọn cả ngày và giờ giữ cọc";
      } else {
        const reservedDate = new Date(reservedUntilRaw);
        if (isNaN(reservedDate.getTime()) || reservedDate.getTime() < new Date().getTime() - 300000) {
          errors.reservedUntil = "Thời gian giữ cọc phải lớn hơn thời gian hiện tại";
        }
      }
    }

    if (status === "sold") {
      if (isNaN(soldPrice || 0) || (soldPrice || 0) <= 0) {
        errors.soldPrice = "Giá bán thực tế phải lớn hơn 0";
      }
      if (!soldBy) {
        errors.soldBy = "Nhân viên bán hàng là bắt buộc";
      }
    }

    // Handle thumbnail image
    const thumbnailFile = formData.get("thumbnail") as File | null;
    let thumbnailUrl = "";
    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        thumbnailUrl = await saveUploadedFile(thumbnailFile);
      } catch (err) {
        console.error("Error saving thumbnail:", err);
        errors.thumbnail = "Lỗi lưu ảnh đại diện";
      }
    } else {
      errors.thumbnail = "Ảnh đại diện xe là bắt buộc";
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Thông tin xe không hợp lệ. Vui lòng kiểm tra lại.",
        errors,
      };
    }

    // Save Car record to MySQL
    const dbCar = await saveCar({
      user_id: userId,
      title,
      title_vi,
      title_en,
      brand,
      model,
      year,
      price,
      mileage,
      fuel_type: fuelType,
      transmission,
      body_type: bodyType,
      color,
      seats,
      engine,
      description,
      description_vi,
      description_en,
      city,
      address,
      thumbnail: thumbnailUrl,
      status,
      car_condition: carCondition,
      reserved_until: reservedUntilVal,
      condition_type: conditionType,
      origin,
      interior_color: interiorColor,
      doors,
      drivetrain,
    });

    // Save main thumbnail image record to car_images (sort_order = 0)
    await saveCarImages([
      {
        car_id: dbCar.id,
        image_url: thumbnailUrl,
        sort_order: 0,
      },
    ]);

    // Update extra sold fields and run business workflow if sold
    if (status === "sold") {
      await updateCar(dbCar.id, {
        sold_price: soldPrice,
        sold_at: soldAtVal,
        sold_by: soldBy,
        buyer_id: buyerId || null,
      });

      const pool = getPool();
      if (buyerId) {
        await pool.query(
          "UPDATE customers SET stage = 'purchased', updated_at = NOW() WHERE id = ?;",
          [buyerId]
        );
      }

      await pool.query(
        `INSERT INTO notifications (id, user_id, title, content, link, is_read, created_at)
         VALUES (?, NULL, ?, ?, ?, 0, NOW());`,
        [
          crypto.randomUUID(),
          "Xe đã bán",
          `Xe #${dbCar.id.substring(0, 8)} đã được bán thành công.`,
          "/admin/analytics",
        ]
      );

      await pool.query(
        `INSERT INTO audit_logs (id, car_id, user_id, action, old_status, new_status, details, created_at)
         VALUES (?, ?, ?, 'mark_as_sold', 'available', 'sold', ?, NOW());`,
        [
          crypto.randomUUID(),
          dbCar.id,
          soldBy,
          JSON.stringify({ soldPrice, buyerId: buyerId || null }),
        ]
      );
    }

    // Save gallery images if uploaded
    const galleryFiles = formData.getAll("gallery") as File[];
    const galleryImagesToSave: { car_id: string; image_url: string; sort_order: number }[] = [];
    
    let sortOrder = 1;
    for (const file of galleryFiles) {
      if (file && file.size > 0) {
        try {
          const imgUrl = await saveUploadedFile(file);
          galleryImagesToSave.push({
            car_id: dbCar.id,
            image_url: imgUrl,
            sort_order: sortOrder++,
          });
        } catch (err) {
          console.error("Error saving gallery file:", err);
        }
      }
    }

    if (galleryImagesToSave.length > 0) {
      await saveCarImages(galleryImagesToSave);
    }

    revalidatePath("/");
    revalidatePath("/cars");
    revalidatePath("/admin/cars");

    return {
      success: true,
      message: "Đăng tải xe thành công!",
      carId: dbCar.id,
    };
  } catch (error) {
    console.error("Error creating car:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi tạo mới xe. Vui lòng thử lại sau.",
    };
  }
}

export async function updateCarAction(id: string, formData: FormData): Promise<ActionResponse> {
  try {
    const cars = await getCars();
    const existingCar = cars.find((c) => c.id === id);
    if (!existingCar) {
      return {
        success: false,
        message: "Không tìm thấy xe để cập nhật.",
      };
    }
    const oldStatus = existingCar.status;

    const title = formData.get("title")?.toString().trim() || "";
    const title_vi = formData.get("title_vi")?.toString().trim() || title;
    const title_en = formData.get("title_en")?.toString().trim() || "";
    const brand = formData.get("brand")?.toString().trim() || "";
    const model = formData.get("model")?.toString().trim() || "";
    const year = parseInt(formData.get("year")?.toString() || "2022", 10);
    const price = parseInt(formData.get("price")?.toString() || "0", 10);
    const mileage = parseInt(formData.get("mileage")?.toString() || "0", 10);
    const fuelType = formData.get("fuelType")?.toString().trim() || "";
    const transmission = formData.get("transmission")?.toString().trim() || "";
    const bodyType = formData.get("bodyType")?.toString().trim() || "";
    const color = formData.get("color")?.toString().trim() || "";
    const seats = parseInt(formData.get("seats")?.toString() || "5", 10);
    const engine = formData.get("engine")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
    const description_vi = formData.get("description_vi")?.toString().trim() || description;
    const description_en = formData.get("description_en")?.toString().trim() || "";
    const city = formData.get("city")?.toString().trim() || "";
    const address = formData.get("address")?.toString().trim() || "";
    const status = (formData.get("status")?.toString() || "available") as DbCar["status"];
    const carCondition = (formData.get("carCondition")?.toString() || "used") as DbCar["car_condition"];
    const conditionType = (formData.get("conditionType")?.toString() || "used") as DbCar["condition_type"];
    const origin = (formData.get("origin")?.toString() || "domestic") as DbCar["origin"];
    const interiorColor = formData.get("interiorColor")?.toString().trim() || "";
    const doors = parseInt(formData.get("doors")?.toString() || "4", 10);
    const drivetrain = (formData.get("drivetrain")?.toString() || "FWD") as DbCar["drivetrain"];

    const reservedUntilRaw = formData.get("reservedUntil")?.toString() || "";
    const reservedUntilVal = status === "reserved" && reservedUntilRaw ? new Date(reservedUntilRaw).toISOString() : null;

    // SOLD SPECIFICATIONS
    const soldPriceRaw = formData.get("soldPrice")?.toString() || "";
    const soldBy = formData.get("soldBy")?.toString() || null;
    const buyerId = formData.get("buyerId")?.toString() || null;
    const soldPrice = status === "sold" ? (parseInt(soldPriceRaw, 10) || 0) : null;
    // Keep original sold date if it was already sold, otherwise assign NOW
    const soldAtVal = status === "sold"
      ? (oldStatus === "sold" && existingCar.sold_at ? existingCar.sold_at : new Date().toISOString())
      : null;

    const errors: Record<string, string> = {};

    if (!title) errors.title = "Tên xe là bắt buộc";
    if (!brand) errors.brand = "Hãng xe là bắt buộc";
    if (!model) errors.model = "Mẫu xe là bắt buộc";
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) errors.year = "Năm sản xuất không hợp lệ";
    if (isNaN(price) || price <= 0) errors.price = "Giá bán phải lớn hơn 0";
    if (isNaN(mileage) || mileage < 0) errors.mileage = "Số km không hợp lệ";
    if (!fuelType) errors.fuelType = "Loại nhiên liệu là bắt buộc";
    if (!transmission) errors.transmission = "Hộp số là bắt buộc";
    if (!bodyType) errors.bodyType = "Kiểu dáng là bắt buộc";
    if (!color) errors.color = "Màu ngoại thất là bắt buộc";
    if (!interiorColor) errors.interiorColor = "Màu nội thất là bắt buộc";
    if (isNaN(doors) || doors <= 0) errors.doors = "Số cửa không hợp lệ";
    if (isNaN(seats) || seats <= 0) errors.seats = "Số chỗ ngồi không hợp lệ";
    if (!engine) errors.engine = "Dung tích động cơ là bắt buộc";
    if (!description) errors.description = "Mô tả chi tiết là bắt buộc";
    if (!city) errors.city = "Tỉnh/Thành phố là bắt buộc";
    if (!address) errors.address = "Địa điểm xem xe là bắt buộc";

    if (status === "reserved") {
      if (!reservedUntilRaw) {
        errors.reservedUntil = "Thời gian giữ cọc là bắt buộc";
      } else if (!reservedUntilRaw.includes("T")) {
        errors.reservedUntil = "Vui lòng chọn cả ngày và giờ giữ cọc";
      } else {
        const reservedDate = new Date(reservedUntilRaw);
        if (isNaN(reservedDate.getTime()) || reservedDate.getTime() < new Date().getTime() - 300000) {
          errors.reservedUntil = "Thời gian giữ cọc phải lớn hơn thời gian hiện tại";
        }
      }
    }

    if (status === "sold") {
      if (isNaN(soldPrice || 0) || (soldPrice || 0) <= 0) {
        errors.soldPrice = "Giá bán thực tế phải lớn hơn 0";
      }
      if (!soldBy) {
        errors.soldBy = "Nhân viên bán hàng là bắt buộc";
      }
    }

    // Handle optional thumbnail update
    const thumbnailFile = formData.get("thumbnail") as File | null;
    let thumbnailUrl = "";
    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        thumbnailUrl = await saveUploadedFile(thumbnailFile);
      } catch (err) {
        console.error("Error saving thumbnail:", err);
        errors.thumbnail = "Lỗi lưu ảnh đại diện mới";
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Thông tin xe không hợp lệ. Vui lòng kiểm tra lại.",
        errors,
      };
    }

    const updatedFields: Partial<Omit<DbCar, "id" | "created_at" | "updated_at" | "views">> = {
      title,
      title_vi,
      title_en,
      brand,
      model,
      year,
      price,
      mileage,
      fuel_type: fuelType,
      transmission,
      body_type: bodyType,
      color,
      seats,
      engine,
      description,
      description_vi,
      description_en,
      city,
      address,
      status,
      car_condition: carCondition,
      reserved_until: reservedUntilVal,
      condition_type: conditionType,
      origin,
      interior_color: interiorColor,
      doors,
      drivetrain,
      sold_price: soldPrice,
      sold_at: soldAtVal,
      sold_by: status === "sold" ? soldBy : null,
      buyer_id: status === "sold" ? buyerId : null,
    };

    if (thumbnailUrl) {
      updatedFields.thumbnail = thumbnailUrl;
    }

    // Save fields in MySQL
    const success = await updateCar(id, updatedFields);
    if (!success) {
      return {
        success: false,
        message: "Không tìm thấy xe hoặc không thể cập nhật thông tin.",
      };
    }

    // Save thumbnail in car_images too (if updated)
    if (thumbnailUrl) {
      // Create new main image in table or edit it (we can just insert/replace)
      await saveCarImages([
        {
          car_id: id,
          image_url: thumbnailUrl,
          sort_order: 0,
        },
      ]);
    }

    // Update CRM, Notifications and Audit logs
    const pool = getPool();
    if (status === "sold" && oldStatus !== "sold") {
      if (buyerId) {
        await pool.query(
          "UPDATE customers SET stage = 'purchased', updated_at = NOW() WHERE id = ?;",
          [buyerId]
        );
      }

      await pool.query(
        `INSERT INTO notifications (id, user_id, title, content, link, is_read, created_at)
         VALUES (?, NULL, ?, ?, ?, 0, NOW());`,
        [
          crypto.randomUUID(),
          "Xe đã bán",
          `Xe #${id.substring(0, 8)} đã được bán thành công.`,
          "/admin/analytics",
        ]
      );

      await pool.query(
        `INSERT INTO audit_logs (id, car_id, user_id, action, old_status, new_status, details, created_at)
         VALUES (?, ?, ?, 'mark_as_sold', ?, 'sold', ?, NOW());`,
        [
          crypto.randomUUID(),
          id,
          soldBy,
          oldStatus,
          JSON.stringify({ soldPrice, buyerId: buyerId || null }),
        ]
      );
    } else if (status !== "sold" && oldStatus === "sold") {
      await pool.query(
        `INSERT INTO audit_logs (id, car_id, user_id, action, old_status, new_status, details, created_at)
         VALUES (?, ?, ?, 'revert_sold', 'sold', ?, ?, NOW());`,
        [
          crypto.randomUUID(),
          id,
          formData.get("userId")?.toString() || "a0000000-0000-0000-0000-000000000001",
          status,
          JSON.stringify({ reason: "Reverted status via edit form" }),
        ]
      );
    }

    // Handle gallery update
    const existingGalleryUrls = formData.getAll("existingGallery") as string[];
    const galleryFiles = formData.getAll("gallery") as File[];
    
    // Clear old gallery records in database (sort_order > 0)
    await clearCarGallery(id);
    
    const galleryImagesToSave: { car_id: string; image_url: string; sort_order: number }[] = [];
    let sortOrder = 1;
    
    // First, restore the kept existing gallery images
    for (const url of existingGalleryUrls) {
      if (url.trim()) {
        galleryImagesToSave.push({
          car_id: id,
          image_url: url,
          sort_order: sortOrder++,
        });
      }
    }
    
    // Next, upload and append the new gallery files
    for (const file of galleryFiles) {
      if (file && file.size > 0) {
        try {
          const imgUrl = await saveUploadedFile(file);
          galleryImagesToSave.push({
            car_id: id,
            image_url: imgUrl,
            sort_order: sortOrder++,
          });
        } catch (err) {
          console.error("Error saving gallery file:", err);
        }
      }
    }

    if (galleryImagesToSave.length > 0) {
      await saveCarImages(galleryImagesToSave);
    }

    revalidatePath("/");
    revalidatePath("/cars");
    revalidatePath("/admin/cars");
    revalidatePath(`/cars/camry-2022`); // Revalidate Camry detail page specifically

    return {
      success: true,
      message: "Cập nhật thông tin xe thành công!",
    };
  } catch (error) {
    console.error("Error updating car:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi cập nhật xe. Vui lòng thử lại sau.",
    };
  }
}

export async function deleteCarAction(id: string): Promise<ActionResponse> {
  try {
    const success = await deleteCar(id);
    if (success) {
      revalidatePath("/");
      revalidatePath("/cars");
      revalidatePath("/admin/cars");
      return {
        success: true,
        message: "Xóa xe khỏi danh sách thành công!",
      };
    }
    return {
      success: false,
      message: "Không tìm thấy xe để xóa.",
    };
  } catch (error) {
    console.error("Error deleting car:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi xóa xe. Vui lòng thử lại sau.",
    };
  }
}

export async function toggleCarVisibilityAction(id: string, currentStatus: string): Promise<ActionResponse & { newStatus?: string }> {
  try {
    const newStatus = currentStatus === "hidden" ? "available" : "hidden";
    const success = await updateCar(id, { status: newStatus });
    if (success) {
      revalidatePath("/");
      revalidatePath("/cars");
      revalidatePath("/admin/cars");
      return {
        success: true,
        message: newStatus === "hidden" ? "Đã tạm ẩn xe thành công!" : "Đã hiển thị xe thành công!",
        newStatus,
      };
    }
    return {
      success: false,
      message: "Không tìm thấy xe để thay đổi trạng thái.",
    };
  } catch (error) {
    console.error("Error toggling car visibility:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi thay đổi trạng thái hiển thị xe. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Server action for admin to crawl new cars listings
 */
export async function crawlCarsAction(source: "bonbanh" | "oto" = "bonbanh"): Promise<ActionResponse & { insertedCount?: number }> {
  try {
    const crawledCars = source === "oto" ? await crawlOtoCars() : await crawlBonBanhCars();
    console.log(`Crawl Action (${source}): Fetched ${crawledCars.length} cars.`);

    const existingCars = await getCars();
    let insertedCount = 0;

    for (const car of crawledCars) {
      // Avoid duplicate: check if a car with the same title and year already exists
      const isDuplicate = existingCars.some(
        (ec) => ec.title.toLowerCase() === car.title.toLowerCase() && ec.year === car.year
      );

      if (!isDuplicate) {
        // Insert into database
        const dbCar = await saveCar({
          user_id: "a0000000-0000-0000-0000-000000000001", // Default Admin
          title: car.title,
          brand: car.brand,
          model: car.model,
          year: car.year,
          price: car.price,
          mileage: car.mileage,
          fuel_type: car.fuel_type,
          transmission: car.transmission,
          body_type: car.body_type,
          color: car.color,
          seats: car.seats,
          engine: car.engine,
          description: car.description,
          city: car.city,
          address: car.address,
          thumbnail: car.thumbnail,
          status: car.status,
          car_condition: "used",
          reserved_until: null,
          condition_type: "used",
          origin: "domestic",
          interior_color: "Đen",
          doors: 4,
          drivetrain: "FWD",
        });

        // Insert main image (sort_order = 0)
        await saveCarImages([
          {
            car_id: dbCar.id,
            image_url: car.thumbnail,
            sort_order: 0,
          },
        ]);

        // Insert gallery images if any
        if (car.gallery && car.gallery.length > 0) {
          const galleryToSave = car.gallery.map((url, idx) => ({
            car_id: dbCar.id,
            image_url: url,
            sort_order: idx + 1,
          }));
          await saveCarImages(galleryToSave);
        }

        insertedCount++;
      }
    }

    if (insertedCount > 0) {
      revalidatePath("/");
      revalidatePath("/cars");
      revalidatePath("/admin/cars");
    }

    return {
      success: true,
      message: `Cào dữ liệu thành công! Đã thêm ${insertedCount} xe mới vào danh sách.`,
      insertedCount,
    };
  } catch (error) {
    console.error("Error crawling and saving cars:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi thực hiện cào dữ liệu xe. Vui lòng thử lại sau.",
    };
  }
}
