import mysql from "mysql2/promise";
import crypto from "crypto";
import { hashPassword } from "./crypto";
import { cars as mockCars, appointments as mockAppointments, users as mockUsers, contactRequests as mockContactRequests } from "../data/mock";

export function safeToIsoString(dateVal: any): string {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

export interface DbUser {
  id: string; // uuid
  full_name: string;
  email: string;
  phone: string;
  password: string; // hashed password
  avatar: string;
  role: "admin" | "staff" | "customer";
  status: "active" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface DbCar {
  id: string; // uuid
  user_id: string; // uuid
  title: string;
  title_vi?: string;
  title_en?: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string;
  color: string;
  seats: number;
  engine: string;
  description: string;
  description_vi?: string;
  description_en?: string;
  city: string;
  address: string;
  thumbnail: string;
  views: number;
  status: "available" | "reserved" | "sold" | "hidden";
  car_condition: "new" | "used";
  reserved_until: string | null;
  condition_type: "new" | "used";
  origin: "imported" | "domestic";
  interior_color: string;
  doors: number;
  drivetrain: "FWD" | "RWD" | "AWD" | "4WD";
  sold_price?: number | null;
  sold_at?: string | null;
  sold_by?: string | null;
  buyer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCarImage {
  id: string; // uuid
  car_id: string; // uuid
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface DbCustomer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  interested_car_id: string | null;
  budget: string | null;
  stage: "new_lead" | "consulting" | "appointment" | "quotation" | "negotiating" | "reserved" | "purchased" | "follow_up";
  note: string | null;
  assigned_staff_id: string | null;
  source: string | null;
  status: "active" | "inactive";
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCustomerNote {
  id: string;
  customer_id: string;
  staff_id: string;
  content: string;
  created_at: string;
}

export interface DbAppointment {
  id: string; // uuid
  car_id: string; // uuid
  user_id: string | null; // uuid
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  appointment_date: string;
  note: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export interface DbChatMessage {
  id: string; // uuid
  session_id: string;
  sender_role: "customer" | "staff";
  sender_name: string;
  message_text: string;
  is_read: number; // 0 or 1
  created_at: string;
}

export interface DbPost {
  id: string; // uuid
  title: string;
  title_vi?: string;
  title_en?: string;
  slug: string;
  excerpt: string;
  excerpt_vi?: string;
  excerpt_en?: string;
  content: string;
  content_vi?: string;
  content_en?: string;
  thumbnail: string;
  category: string;
  author: string;
  views: number;
  featured: number; // 0 or 1
  published: number; // 0 or 1
  created_at: string;
  updated_at: string;
}


// Stable UUID mapping for initial mock data seeding
const MOCK_USER_IDS: Record<string, string> = {
  "admin@tqauto.vn": "a0000000-0000-0000-0000-000000000001",
  "sales01@tqauto.vn": "a0000000-0000-0000-0000-000000000002",
  "sales02@tqauto.vn": "a0000000-0000-0000-0000-000000000003",
  "sales03@tqauto.vn": "a0000000-0000-0000-0000-000000000004",
  "customer@example.com": "a0000000-0000-0000-0000-000000000005",
};

const MOCK_CAR_IDS: Record<string, string> = {
  "CAR-1024": "c0000000-0000-0000-0000-000000001024",
  "CAR-1188": "c0000000-0000-0000-0000-000000001188",
  "CAR-1302": "c0000000-0000-0000-0000-000000001302",
  "CAR-1410": "c0000000-0000-0000-0000-000000001410",
  "CAR-1565": "c0000000-0000-0000-0000-000000001565",
  "CAR-1677": "c0000000-0000-0000-0000-000000001677",
};

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      port: parseInt(process.env.MYSQL_PORT || "3306", 10),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "tqauto",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

let dbInitialized = false;

export async function ensureDbExists() {
  if (dbInitialized) return;

  // 1. Connect without selecting database to check/create it
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
  });

  const dbName = process.env.MYSQL_DATABASE || "tqauto";
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.end();

  // 2. Get connection pool with database selected
  const activePool = getPool();

  // 3. Create tables if they don't exist
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar TEXT,
      role ENUM('admin', 'staff', 'customer') NOT NULL,
      status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS cars (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      brand VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      year INT NOT NULL,
      price BIGINT NOT NULL,
      mileage INT NOT NULL,
      fuel_type VARCHAR(50) NOT NULL,
      transmission VARCHAR(50) NOT NULL,
      body_type VARCHAR(50) NOT NULL,
      color VARCHAR(50) NOT NULL,
      seats INT NOT NULL,
      engine VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      address VARCHAR(255) NOT NULL,
      thumbnail TEXT NOT NULL,
      views INT DEFAULT 0,
      status ENUM('available', 'reserved', 'sold', 'hidden') DEFAULT 'available',
      car_condition ENUM('new', 'used') DEFAULT 'used',
      reserved_until DATETIME DEFAULT NULL,
      condition_type ENUM('new', 'used') DEFAULT 'used',
      origin ENUM('imported', 'domestic') DEFAULT 'domestic',
      interior_color VARCHAR(100) DEFAULT 'Đen',
      doors INT DEFAULT 4,
      drivetrain ENUM('FWD', 'RWD', 'AWD', '4WD') DEFAULT 'FWD',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS car_images (
      id VARCHAR(36) PRIMARY KEY,
      car_id VARCHAR(36) NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(36) PRIMARY KEY,
      car_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      appointment_date TIMESTAMP NOT NULL,
      note TEXT,
      status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(36) PRIMARY KEY,
      session_id VARCHAR(50) NOT NULL,
      sender_role ENUM('customer', 'staff') NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      message_text TEXT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      title_vi VARCHAR(255) NULL,
      title_en VARCHAR(255) NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      excerpt TEXT NOT NULL,
      excerpt_vi TEXT NULL,
      excerpt_en TEXT NULL,
      content LONGTEXT NOT NULL,
      content_vi LONGTEXT NULL,
      content_en LONGTEXT NULL,
      thumbnail TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      author VARCHAR(100) NOT NULL,
      views INT DEFAULT 0,
      featured TINYINT(1) DEFAULT 0,
      published TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id VARCHAR(36) NOT NULL,
      car_id VARCHAR(36) NOT NULL,
      PRIMARY KEY (user_id, car_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS car_reviews (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      car_id VARCHAR(36) NOT NULL,
      rating INT NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      interested_car_id VARCHAR(36) NULL,
      budget VARCHAR(100) NULL,
      stage ENUM('new_lead', 'consulting', 'appointment', 'quotation', 'negotiating', 'reserved', 'purchased', 'follow_up') DEFAULT 'new_lead',
      note TEXT NULL,
      assigned_staff_id VARCHAR(36) NULL,
      source VARCHAR(100) DEFAULT 'website',
      status ENUM('active', 'inactive') DEFAULT 'active',
      session_id VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (interested_car_id) REFERENCES cars(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS customer_notes (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36) NOT NULL,
      staff_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS contact_requests (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      consultation_type VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      assigned_staff_id VARCHAR(36) NULL,
      stage ENUM('new_lead', 'assigned', 'consulting', 'appointment', 'quotation', 'purchased', 'closed') DEFAULT 'new_lead',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      link VARCHAR(255) NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN car_condition ENUM('new', 'used') DEFAULT 'used';");
  } catch (err: any) {
    if (!err.message.includes("Duplicate column name")) {
      console.error("Failed to alter cars table:", err.message);
    }
  }

  try {
    await activePool.query("ALTER TABLE cars MODIFY status ENUM('available', 'reserved', 'sold', 'hidden') DEFAULT 'available';");
  } catch (err: any) {
    console.error("Failed to modify cars.status ENUM:", err.message);
  }

  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN reserved_until DATETIME NULL DEFAULT NULL;");
  } catch (err: any) {
    if (!err.message.includes("Duplicate column name")) {
      console.error("Failed to add reserved_until column:", err.message);
    }
  }

  // Bilingual column alterations and migrations
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN title_vi VARCHAR(255) NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN title_en VARCHAR(255) NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN description_vi TEXT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN description_en TEXT NULL;");
  } catch (err: any) {}

  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN title_vi VARCHAR(255) NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN title_en VARCHAR(255) NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN excerpt_vi TEXT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN excerpt_en TEXT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN content_vi LONGTEXT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN content_en LONGTEXT NULL;");
  } catch (err: any) {}

  // Update users table for roles and status
  try {
    await activePool.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'customer') NOT NULL;");
  } catch (err: any) {
    console.error("Failed to alter users.role ENUM:", err.message);
  }

  try {
    await activePool.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'blocked') NOT NULL DEFAULT 'active';");
  } catch (err: any) {
    if (!err.message.includes("Duplicate column name")) {
      console.error("Failed to add users.status column:", err.message);
    }
  }

  try {
    // Migrate existing staff accounts
    await activePool.query("UPDATE users SET role = 'staff' WHERE email LIKE 'sales%';");
    await activePool.query("UPDATE users SET status = 'blocked' WHERE email = 'sales02@tqauto.vn';");
  } catch (err: any) {
    console.error("Failed to migrate existing user roles:", err.message);
  }

  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN condition_type ENUM('new', 'used') DEFAULT 'used';");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN origin ENUM('imported', 'domestic') DEFAULT 'domestic';");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN interior_color VARCHAR(100) DEFAULT 'Đen';");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN doors INT DEFAULT 4;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN drivetrain ENUM('FWD', 'RWD', 'AWD', '4WD') DEFAULT 'FWD';");
  } catch (err: any) {}

  // Analytics columns for sold cars tracking
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN sold_price BIGINT NULL DEFAULT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN sold_at DATETIME NULL DEFAULT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN sold_by VARCHAR(36) NULL DEFAULT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN buyer_id VARCHAR(36) NULL DEFAULT NULL;");
  } catch (err: any) {}

  // Seed sold data for analytics demo (only if no sold cars exist yet)
  try {
    const [soldCheck] = await activePool.query("SELECT COUNT(*) as cnt FROM cars WHERE status = 'sold' AND sold_price IS NOT NULL;");
    if ((soldCheck as any)[0]?.cnt === 0) {
      // Mark Toyota Camry as sold
      await activePool.query(`
        UPDATE cars SET status = 'sold', sold_price = 1180000000, 
        sold_at = DATE_SUB(NOW(), INTERVAL 5 DAY), 
        sold_by = 'a0000000-0000-0000-0000-000000000002'
        WHERE title LIKE '%Camry%' LIMIT 1;
      `);
      // Mark Honda Civic as sold  
      await activePool.query(`
        UPDATE cars SET status = 'sold', sold_price = 850000000,
        sold_at = DATE_SUB(NOW(), INTERVAL 12 DAY),
        sold_by = 'a0000000-0000-0000-0000-000000000003'
        WHERE title LIKE '%Civic%' LIMIT 1;
      `);
    }
  } catch (err: any) {
    console.error("Failed to seed sold car data:", err.message);
  }

  try {
    await activePool.query("UPDATE cars SET title_vi = title WHERE title_vi IS NULL;");
    await activePool.query("UPDATE cars SET description_vi = description WHERE description_vi IS NULL;");
  } catch (err: any) {}

  try {
    await activePool.query("UPDATE posts SET title_vi = title WHERE title_vi IS NULL;");
    await activePool.query("UPDATE posts SET excerpt_vi = excerpt WHERE excerpt_vi IS NULL;");
    await activePool.query("UPDATE posts SET content_vi = content WHERE content_vi IS NULL;");
  } catch (err: any) {}

  // Always update mock cars with their specs if they exist in the DB to keep them synchronized
  try {
    for (const mc of mockCars) {
      const carId = MOCK_CAR_IDS[mc.id];
      if (!carId) continue;
      
      const priceNumeric = parseInt(mc.price.replace(/\D/g, ""), 10) || 0;
      const mileageNumeric = parseInt(mc.mileage.replace(/\D/g, ""), 10) || 0;
      
      const seats = mc.specs["Ghế"]?.includes("7") ? 7 : 5;
      const engine = mc.specs["Động cơ"] || "2.0L";
      const condition = mc.condition || "used";
      const conditionType = mc.condition_type || "used";
      const origin = mc.origin || "domestic";
      const interiorColor = mc.interior_color || "Đen";
      const doors = mc.doors || 4;
      const drivetrain = mc.drivetrain || "FWD";

      await activePool.query(`
        UPDATE cars SET 
          year = ?,
          price = ?,
          mileage = ?,
          fuel_type = ?,
          transmission = ?,
          body_type = ?,
          color = ?,
          seats = ?,
          engine = ?,
          car_condition = ?,
          condition_type = ?,
          origin = ?,
          interior_color = ?,
          doors = ?,
          drivetrain = ?
        WHERE id = ?;
      `, [
        mc.year,
        priceNumeric,
        mileageNumeric,
        mc.fuel,
        mc.transmission,
        mc.category,
        mc.color,
        seats,
        engine,
        condition,
        conditionType,
        origin,
        interiorColor,
        doors,
        drivetrain,
        carId
      ]);
    }
  } catch (err: any) {
    console.error("Failed to sync mock car specifications on startup:", err.message);
  }

  // 4. Auto-seeding mock data if table is empty or missing new specs cars
  const [userRows] = await activePool.query("SELECT COUNT(*) as count FROM users;");
  const userCount = (userRows as any)[0]?.count || 0;

  const [checkRes] = await activePool.query("SELECT COUNT(*) as count FROM cars WHERE title LIKE '%GLS 450%' OR title LIKE '%BMW X5%';");
  const hasNewCars = (checkRes as any)[0]?.count > 0;

  if (userCount === 0 || !hasNewCars) {
    console.log("Seeding or updating MySQL tables from mock data...");

    let adminUserUuid = "a0000000-0000-0000-0000-000000000001"; // Default fallback

    if (userCount === 0) {
      // A. Seed Users
      const seededUsers: DbUser[] = mockUsers.map((mu) => {
        const id = MOCK_USER_IDS[mu.email] || crypto.randomUUID();
        let rawPwd = "customer123";
        if (mu.email.startsWith("admin")) rawPwd = "admin123";
        if (mu.email.startsWith("sales")) rawPwd = "sales123";

        return {
          id,
          full_name: mu.name,
          email: mu.email,
          phone: mu.phone,
          password: hashPassword(rawPwd),
          avatar: "",
          role: mu.role === "Quản trị viên" ? "admin" : (mu.role === "Nhân viên" ? "staff" : "customer"),
          status: mu.status === "Tạm khóa" ? "blocked" : "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      for (const u of seededUsers) {
        try {
          await activePool.query(
            "INSERT INTO users (id, full_name, email, phone, password, avatar, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id;",
            [u.id, u.full_name, u.email, u.phone, u.password, u.avatar, u.role, u.status, new Date(u.created_at), new Date(u.updated_at)]
          );
        } catch (err: any) {
          if (err.code !== 'ER_DUP_ENTRY') {
            console.error("Failed to seed user:", err.message);
          }
        }
      }
      adminUserUuid = seededUsers.find((u) => u.role === "admin")?.id || adminUserUuid;
    } else {
      // Find admin user uuid in db
      const [adminRows] = await activePool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1;");
      if ((adminRows as any[]).length > 0) {
        adminUserUuid = (adminRows as any[])[0].id;
      }
    }

    // Clean up old cars and appointments to prevent foreign key errors and duplicates
    await activePool.query("DELETE FROM car_images;");
    await activePool.query("DELETE FROM user_favorites;");
    await activePool.query("DELETE FROM car_reviews;");
    await activePool.query("DELETE FROM appointments;");
    await activePool.query("DELETE FROM cars;");

    // B. Seed Cars and CarImages
    for (const mc of mockCars) {
      const carId = MOCK_CAR_IDS[mc.id] || crypto.randomUUID();
      const priceNumeric = parseInt(mc.price.replace(/\D/g, ""), 10) || 0;
      const mileageNumeric = parseInt(mc.mileage.replace(/\D/g, ""), 10) || 0;
      
      const seats = mc.specs["Ghế"]?.includes("7") ? 7 : 5;
      const engine = mc.specs["Động cơ"] || "2.0L";
      const address = mc.specs["Biển số"] ? "Showroom TQ Auto, TP. Hồ Chí Minh" : "Showroom TQ Auto, Hà Nội";
      const city = mc.specs["Biển số"] || "TP. Hồ Chí Minh";
      let status = mc.status;
      if (status !== "available" && status !== "reserved" && status !== "sold" && status !== "hidden") {
        status = "available";
      }

      const condition = mc.condition || "used";
      const conditionType = mc.condition_type || "used";
      const origin = mc.origin || "domestic";
      const interiorColor = mc.interior_color || "Đen";
      const doors = mc.doors || 4;
      const drivetrain = mc.drivetrain || "FWD";

      let reservedUntil: Date | null = null;
      if (status === "reserved") {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3); // 3 days reservation limit
        reservedUntil = futureDate;
      }

      await activePool.query(
        "INSERT INTO cars (id, user_id, title, title_vi, title_en, brand, model, year, price, mileage, fuel_type, transmission, body_type, color, seats, engine, description, description_vi, description_en, city, address, thumbnail, views, status, car_condition, reserved_until, condition_type, origin, interior_color, doors, drivetrain, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [
          carId,
          adminUserUuid,
          mc.name,
          mc.name,
          mc.name,
          mc.brand,
          mc.slug.replace(/-\d{4}$/, ""),
          mc.year,
          priceNumeric,
          mileageNumeric,
          mc.fuel,
          mc.transmission,
          mc.category,
          mc.color,
          seats,
          engine,
          mc.description,
          mc.description,
          "Fully inspected premium vehicle at TQ Auto showroom.",
          city,
          address,
          mc.image,
          0,
          status,
          condition,
          reservedUntil,
          conditionType,
          origin,
          interiorColor,
          doors,
          drivetrain,
          new Date(),
          new Date(),
        ]
      );

      // Add main image to car_images (sort_order = 0)
      await activePool.query(
        "INSERT INTO car_images (id, car_id, image_url, sort_order, created_at) VALUES (?, ?, ?, ?, ?);",
        [crypto.randomUUID(), carId, mc.image, 0, new Date()]
      );

      // Add gallery images
      if (mc.gallery && mc.gallery.length > 0) {
        for (let index = 0; index < mc.gallery.length; index++) {
          const imgUrl = mc.gallery[index];
          await activePool.query(
            "INSERT INTO car_images (id, car_id, image_url, sort_order, created_at) VALUES (?, ?, ?, ?, ?);",
            [crypto.randomUUID(), carId, imgUrl, index + 1, new Date()]
          );
        }
      }
    }

    // C. Seed Appointments
    for (let idx = 0; idx < mockAppointments.length; idx++) {
      const ma = mockAppointments[idx];
      const [usrRows] = await activePool.query("SELECT id FROM users WHERE full_name = ? LIMIT 1;", [ma.customer]);
      const userId = (usrRows as any[]).length > 0 ? (usrRows as any[])[0].id : null;
      
      const car = mockCars.find((c) => c.name === ma.car);
      const carId = car ? (MOCK_CAR_IDS[car.id] || MOCK_CAR_IDS["CAR-1024"]) : MOCK_CAR_IDS["CAR-1024"];

      let dbStatus: DbAppointment["status"] = "pending";
      if (ma.status === "Đã xác nhận") dbStatus = "confirmed";

      const appointmentDate = new Date(`${ma.date}T${ma.time}:00`);

      await activePool.query(
        "INSERT INTO appointments (id, car_id, user_id, customer_name, customer_phone, customer_email, appointment_date, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [`a0000000-0000-0000-0000-000000000${100 + idx}`, carId, userId, ma.customer, ma.phone.replace(/\s+/g, ""), ma.email, appointmentDate, ma.note, dbStatus, new Date()]
      );
    }
    console.log("MySQL database seeding complete!");
  }

  // 5. Seeding posts if empty
  const [postRows] = await activePool.query("SELECT COUNT(*) as count FROM posts;");
  const postCount = (postRows as any)[0]?.count || 0;
  if (postCount === 0) {
    console.log("Seeding posts table with bilingual data...");
    const samplePosts = [
      {
        id: crypto.randomUUID(),
        title: "Đánh giá chi tiết Honda Civic RS 2025: Bản lĩnh thể thao và trải nghiệm lái đỉnh cao",
        title_vi: "Đánh giá chi tiết Honda Civic RS 2025: Bản lĩnh thể thao và trải nghiệm lái đỉnh cao",
        title_en: "Detailed Review of Honda Civic RS 2025: Sporty Spirit and Exhilarating Performance",
        slug: "honda-civic-rs-2025-review",
        excerpt: "Honda Civic RS 2025 tiếp tục khẳng định vị thế dẫn đầu trong phân khúc sedan hạng C nhờ phong cách thiết kế thể thao đậm chất, gói an toàn Honda SENSING cải tiến và khả năng vận hành hứng khởi vượt trội.",
        excerpt_vi: "Honda Civic RS 2025 tiếp tục khẳng định vị thế dẫn đầu trong phân khúc sedan hạng C nhờ phong cách thiết kế thể thao đậm chất, gói an toàn Honda SENSING cải tiến và khả năng vận hành hứng khởi vượt trội.",
        excerpt_en: "The Honda Civic RS 2025 continues to lead the C-segment sedan class with a bold sporty style, upgraded Honda SENSING package, and exciting driving dynamics.",
        content: `### 1. Thiết kế ngoại thất đậm chất thể thao\n\nHonda Civic RS 2025 sở hữu diện mạo thể thao và dữ dằn hơn bản tiền nhiệm.\n\nPhần đầu xe nổi bật với lưới tản nhiệt họa tiết tổ ong sơn đen bóng kết hợp cụm đèn pha LED thanh mảnh sắc sảo. Cản trước được tái thiết kế mở rộng hơn giúp tối ưu hóa luồng khí động học và gia tăng vẻ hầm hố cho mẫu xe.\n\nThân xe thon dài mượt mà đi kèm bộ mâm hợp kim sơn đen nhám kích thước 18 inch cá tính. Ở đuôi xe, cánh lướt gió thể thao tích hợp trên nắp cốp cùng cụm ống xả kép mạ chrome tạo nên điểm nhấn khó cưỡng đối với những tín đồ đam mê tốc độ.\n\n### 2. Không gian nội thất hiện đại và cao cấp\n\nBước vào khoang lái, Civic RS 2025 đón chào người dùng bằng một không gian tinh tế và đậm tính công nghệ. Vô-lăng bọc da 3 chấu thể thao với đường chỉ khâu màu đỏ nổi bật. Ghế ngồi thể thao bọc da kết hợp chất liệu da lộn cao cấp mang lại tư thế ngồi chắc chắn, ôm sát lưng người lái.\n\nHệ thống thông tin giải trí nổi bật với màn hình cảm ứng 9 inch hỗ trợ kết nối Apple CarPlay và Android Auto không dây mượt mà. Phía sau vô-lăng là bảng đồng hồ kỹ thuật số toàn phần 10.2 inch hiển thị trực quan và sắc nét các thông số vận hành của xe.\n\n### 3. Vận hành hứng khởi vượt trội\n\nTrái tim của Honda Civic RS 2025 là khối động cơ tăng áp 1.5L DOHC VTEC Turbo quen thuộc, sản sinh công suất cực đại 178 mã lực và mô-men xoắn cực đại 240 Nm. Đi kèm với hộp số tự động vô cấp CVT được tinh chỉnh tỷ số truyền thông minh.\n\nKhả năng vận hành của Civic RS chưa bao giờ làm người hâm mộ thất vọng. Vô-lăng cho phản hồi mặt đường cực tốt, chính xác từng mm. Hệ thống treo được làm cứng cáp hơn giúp xe vững chãi khi ôm cua ở tốc độ cao mà vẫn duy trì được độ êm ái cần có cho hành khách phía sau.\n\n### 4. Công nghệ an toàn Honda SENSING thế hệ mới\n\nKhông chỉ lái hay, Civic RS 2025 còn bảo vệ bạn và gia đình tối đa nhờ gói công nghệ hỗ trợ lái an toàn Honda SENSING với nhiều tính năng nâng cấp đáng giá:\n- Phanh giảm thiểu va chạm (CMBS)\n- Hỗ trợ giữ làn đường (LKAS)\n- Giảm thiểu chệch làn đường (RDM)\n- Kiểm soát hành trình thích ứng bao gồm dải tốc độ thấp (ACC with LSF)\n- Đèn pha thích ứng tự động (AHB)\n- Thông báo xe phía trước khởi hành (LCDN)`,
        content_vi: `### 1. Thiết kế ngoại thất đậm chất thể thao\n\nHonda Civic RS 2025 sở hữu diện mạo thể thao và dữ dằn hơn bản tiền nhiệm.\n\nPhần đầu xe nổi bật với lưới tản nhiệt họa tiết tổ ong sơn đen bóng kết hợp cụm đèn pha LED thanh mảnh sắc sảo. Cản trước được tái thiết kế mở rộng hơn giúp tối ưu hóa luồng khí động học và gia tăng vẻ hầm hố cho mẫu xe.\n\nThân xe thon dài mượt mà đi kèm bộ mâm hợp kim sơn đen nhám kích thước 18 inch cá tính. Ở đuôi xe, cánh lướt gió thể thao tích hợp trên nắp cốp cùng cụm ống xả kép mạ chrome tạo nên điểm nhấn khó cưỡng đối với những tín đồ đam mê tốc độ.\n\n### 2. Không gian nội thất hiện đại và cao cấp\n\nBước vào khoang lái, Civic RS 2025 đón chào người dùng bằng một không gian tinh tế và đậm tính công nghệ. Vô-lăng bọc da 3 chấu thể thao với đường chỉ khâu màu đỏ nổi bật. Ghế ngồi thể thao bọc da kết hợp chất liệu da lộn cao cấp mang lại tư thế ngồi chắc chắn, ôm sát lưng người lái.\n\nHệ thống thông tin giải trí nổi bật với màn hình cảm ứng 9 inch hỗ trợ kết nối Apple CarPlay và Android Auto không dây mượt mà. Phía sau vô-lăng là bảng đồng hồ kỹ thuật số toàn phần 10.2 inch hiển thị trực quan và sắc nét các thông số vận hành của xe.\n\n### 3. Vận hành hứng khởi vượt trội\n\nTrái tim của Honda Civic RS 2025 là khối động cơ tăng áp 1.5L DOHC VTEC Turbo quen thuộc, sản sinh công suất cực đại 178 mã lực và mô-men xoắn cực đại 240 Nm. Đi kèm với hộp số tự động vô cấp CVT được tinh chỉnh tỷ số truyền thông minh.\n\nKhả năng vận hành của Civic RS chưa bao giờ làm người hâm mộ thất vọng. Vô-lăng cho phản hồi mặt đường cực tốt, chính xác từng mm. Hệ thống treo được làm cứng cáp hơn giúp xe vững chãi khi ôm cua ở tốc độ cao mà vẫn duy trì được độ êm ái cần có cho hành khách phía sau.\n\n### 4. Công nghệ an toàn Honda SENSING thế hệ mới\n\nKhông chỉ lái hay, Civic RS 2025 còn bảo vệ bạn và gia đình tối đa nhờ gói công nghệ hỗ trợ lái an toàn Honda SENSING với nhiều tính năng nâng cấp đáng giá:\n- Phanh giảm thiểu va chạm (CMBS)\n- Hỗ trợ giữ làn đường (LKAS)\n- Giảm thiểu chệch làn đường (RDM)\n- Kiểm soát hành trình thích ứng bao gồm dải tốc độ thấp (ACC with LSF)\n- Đèn pha thích ứng tự động (AHB)\n- Thông báo xe phía trước khởi hành (LCDN)`,
        content_en: `### 1. Sporty Exterior Design\n\nThe Honda Civic RS 2025 sports a more aggressive and athletic look than its predecessor.\n\nThe front features a black honeycomb grille paired with slim, sharp LED headlights. The bumper has been redesigned to optimize aerodynamics and enhance the sporty silhouette.\n\nSmooth lines run along the side profile, complemented by matte black 18-inch alloy wheels. At the rear, the trunk lid spoiler and dual chrome exhaust tips highlight the performance aesthetic.\n\n### 2. High-Tech Premium Cabin\n\nThe interior welcomes drivers with advanced technology and premium materials. A sporty 3-spoke leather steering wheel is accented with contrasting red stitching. Leather seats with suede inserts keep the driver firmly held in fast corners.\n\nThe 9-inch infotainment screen supports wireless Apple CarPlay and Android Auto. Behind the steering wheel lies a high-resolution 10.2-inch digital instrument cluster.\n\n### 3. Exhilarating Drive\n\nAt the heart of the Civic RS 2025 is the 1.5L DOHC VTEC Turbo engine, pushing 178 hp and 240 Nm of torque. It is mated to a responsiveness-tuned CVT.\n\nThe chassis and steering feedback are highly accurate and sharp. The suspension is sport-tuned to remain stable at high highway speeds while retaining passenger comfort.\n\n### 4. Advanced Honda SENSING Safety\n\nDrive with peace of mind thanks to the suite of Honda SENSING features:\n- Collision Mitigation Braking System (CMBS)\n- Lane Keeping Assist System (LKAS)\n- Road Departure Mitigation System (RDM)\n- Adaptive Cruise Control with Low-Speed Follow (ACC with LSF)\n- Auto High-Beam (AHB)\n- Lead Car Departure Notification (LCDN)`,
        thumbnail: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80",
        category: "Đánh giá",
        author: "Trần Quốc Huy",
        featured: 1,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Top 5 mẫu xe SUV/Crossover gầm cao dưới 1 tỷ VNĐ đáng mua nhất 2026",
        title_vi: "Top 5 mẫu xe SUV/Crossover gầm cao dưới 1 tỷ VNĐ đáng mua nhất 2026",
        title_en: "Top 5 SUV/Crossover Vehicles Under 1 Billion VND Worth Buying in 2026",
        slug: "top-suvs-under-1-billion-vnd",
        excerpt: "Với ngân sách khoảng 1 tỷ đồng, người tiêu dùng Việt Nam hiện có rất nhiều sự lựa chọn xe gầm cao chất lượng, từ Mazda CX-5, Hyundai Tucson đến Kia Sportage. Hãy cùng điểm qua những cái tên xuất sắc nhất.",
        excerpt_vi: "Với ngân sách khoảng 1 tỷ đồng, người tiêu dùng Việt Nam hiện có rất nhiều sự lựa chọn xe gầm cao chất lượng, từ Mazda CX-5, Hyundai Tucson đến Kia Sportage. Hãy cùng điểm qua những cái tên xuất sắc nhất.",
        excerpt_en: "With a budget of around 1 billion VND, Vietnamese consumers have many high-quality SUV options, from the Mazda CX-5, Hyundai Tucson, to the Kia Sportage. Let's review the best choices.",
        content: `Phân khúc xe gầm cao SUV/Crossover tầm giá 1 tỷ đồng tại Việt Nam luôn là cuộc đua khốc liệt nhất giữa các hãng xe lớn. Dưới đây là top 5 mẫu xe có thiết kế đẹp mắt, trang bị tiện nghi phong phú và độ bền bỉ cao đáng để bạn xuống tiền nhất hiện nay.\n\n### 1. Mazda CX-5 (Giá từ 749 - 979 triệu VNĐ)\n\nKhông quá ngạc nhiên khi Mazda CX-5 tiếp tục giữ ngôi vương về doanh số. Mẫu xe Nhật Bản thuyết phục khách hàng bằng ngôn ngữ thiết kế KODO thanh lịch, sang trọng cùng khoang cabin ngập tràn công nghệ.\n\nXe được trang bị động cơ SkyActiv-G 2.0L hoặc 2.5L cực kỳ tiết kiệm nhiên liệu cùng hệ thống an toàn i-Activesense danh tiếng. Cảm giác lái êm ái cùng dịch vụ hậu mãi tốt khiến CX-5 luôn là lựa chọn an toàn hàng đầu.\n\n### 2. Hyundai Tucson (Giá từ 769 - 919 triệu VNĐ)\n\nĐến từ Hàn Quốc, Tucson thu hút tệp khách hàng trẻ tuổi nhờ ngôn ngữ thiết kế Sensuous Sportiness phá cách và mang hơi thở tương lai. Cụm đèn LED định vị ẩn mình vào lưới tản nhiệt cánh chim cực kỳ độc đáo.\n\nTucson sở hữu chiều dài cơ sở tốt nhất phân khúc, đem lại không gian ngồi cực kỳ rộng rãi cho cả hai hàng ghế. Các tùy chọn động cơ Turbo 1.6L hay động cơ dầu 2.0L mang lại lực kéo mạnh mẽ và cảm giác tăng tốc phấn khích.\n\n### 3. Kia Sportage (Giá từ 779 - 999 triệu VNĐ)\n\nCùng chia sẻ nền tảng khung gầm với Tucson, Kia Sportage khoác lên mình phong cách táo bạo và đậm chất châu Âu. Điểm nhấn bên trong cabin là màn hình cong kép Panoramic nối liền bảng đồng hồ và màn hình giải trí trung tâm.\n\nSportage có nhiều phiên bản phù hợp với đa dạng nhu cầu và phong cách của chủ nhân, từ phiên bản sang trọng Signature đến thể thao cá tính X-Line.\n\n### 4. Ford Territory (Giá từ 799 - 929 triệu VNĐ)\n\nMẫu SUV thế hệ mới của Ford nhanh chóng khẳng định được chỗ đứng nhờ thiết kế bề thế chuẩn Mỹ và độ rộng rãi bậc nhất phân khúc. Territory được trang bị động cơ EcoBoost 1.5L vận hành êm ái và linh hoạt trong đô thị.\n\nGói an toàn Ford Co-Pilot360 hỗ trợ đắc lực cho người lái với các tính năng đỗ xe tự động, cảnh báo chệch làn và phanh tự động khẩn cấp cực nhạy.\n\n### 5. Honda CR-V (Các phiên bản xăng cơ bản dưới 1 tỷ VNĐ)\n\nMặc dù bản Hybrid vượt ngưỡng 1 tỷ đồng, các phiên bản lắp ráp động cơ xăng của Honda CR-V vẫn vô cùng hút khách nhờ cấu hình 5+2 chỗ ngồi linh hoạt, khung gầm đầm chắc và động cơ 1.5L Turbo bền bỉ cực kỳ giữ giá theo thời gian.`,
        content_vi: `Phân khúc xe gầm cao SUV/Crossover tầm giá 1 tỷ đồng tại Việt Nam luôn là cuộc đua khốc liệt nhất giữa các hãng xe lớn. Dưới đây là top 5 mẫu xe có thiết kế đẹp mắt, trang bị tiện nghi phong phú và độ bền bỉ cao đáng để bạn xuống tiền nhất hiện nay.\n\n### 1. Mazda CX-5 (Giá từ 749 - 979 triệu VNĐ)\n\nKhông quá ngạc nhiên khi Mazda CX-5 tiếp tục giữ ngôi vương về doanh số. Mẫu xe Nhật Bản thuyết phục khách hàng bằng ngôn ngữ thiết kế KODO thanh lịch, sang trọng cùng khoang cabin ngập tràn công nghệ.\n\nXe được trang bị động cơ SkyActiv-G 2.0L hoặc 2.5L cực kỳ tiết kiệm nhiên liệu cùng hệ thống an toàn i-Activesense danh tiếng. Cảm giác lái êm ái cùng dịch vụ hậu mãi tốt khiến CX-5 luôn là lựa chọn an toàn hàng đầu.\n\n### 2. Hyundai Tucson (Giá từ 769 - 919 triệu VNĐ)\n\nĐến từ Hàn Quốc, Tucson thu hút tệp khách hàng trẻ tuổi nhờ ngôn ngữ thiết kế Sensuous Sportiness phá cách và mang hơi thở tương lai. Cụm đèn LED định vị ẩn mình vào lưới tản nhiệt cánh chim cực kỳ độc đáo.\n\nTucson sở hữu chiều dài cơ sở tốt nhất phân khúc, đem lại không gian ngồi cực kỳ rộng rãi cho cả hai hàng ghế. Các tùy chọn động cơ Turbo 1.6L hay động cơ dầu 2.0L mang lại lực kéo mạnh mẽ và cảm giác tăng tốc phấn khích.\n\n### 3. Kia Sportage (Giá từ 779 - 999 triệu VNĐ)\n\nCùng chia sẻ nền tảng khung gầm với Tucson, Kia Sportage khoác lên mình phong cách táo bạo và đậm chất châu Âu. Điểm nhấn bên trong cabin là màn hình cong kép Panoramic nối liền bảng đồng hồ và màn hình giải trí trung tâm.\n\nSportage có nhiều phiên bản phù hợp với đa dạng nhu cầu và phong cách của chủ nhân, từ phiên bản sang trọng Signature đến thể thao cá tính X-Line.\n\n### 4. Ford Territory (Giá từ 799 - 929 triệu VNĐ)\n\nMẫu SUV thế hệ mới của Ford nhanh chóng khẳng định được chỗ đứng nhờ thiết kế bề thế chuẩn Mỹ và độ rộng rãi bậc nhất phân khúc. Territory được trang bị động cơ EcoBoost 1.5L vận hành êm ái và linh hoạt trong đô thị.\n\nGói an toàn Ford Co-Pilot360 hỗ trợ đắc lực cho người lái với các tính năng đỗ xe tự động, cảnh báo chệch làn và phanh tự động khẩn cấp cực nhạy.\n\n### 5. Honda CR-V (Các phiên bản xăng cơ bản dưới 1 tỷ VNĐ)\n\nMặc dù bản Hybrid vượt ngưỡng 1 tỷ đồng, các phiên bản lắp ráp động cơ xăng của Honda CR-V vẫn vô cùng hút khách nhờ cấu hình 5+2 chỗ ngồi linh hoạt, khung gầm đầm chắc và động cơ 1.5L Turbo bền bỉ cực kỳ giữ giá theo thời gian.`,
        content_en: `The SUV/Crossover segment around 1 billion VND is always a highly competitive race in Vietnam. Here are the top 5 models with stunning designs, generous features, and high reliability that are most worth buying.\n\n### 1. Mazda CX-5 (Price: 749 - 979 million VND)\n\nUnsurprisingly, the Mazda CX-5 holds its position as the sales champion. The Japanese automaker draws buyers with the elegant KODO design language and a feature-filled cabin.\n\n### 2. Hyundai Tucson (Price: 769 - 919 million VND)\n\nHailing from Korea, the Tucson captures younger buyers with its futuristic Sensuous Sportiness design. It features the longest wheelbase in its segment for spacious rear seating.\n\n### 3. Kia Sportage (Price: 779 - 999 million VND)\n\nSharing its platform with the Tucson, the Sportage offers European flair and a premium dual-curved digital cockpit screen.\n\n### 4. Ford Territory (Price: 799 - 929 million VND)\n\nFord's modern SUV is massive, offering high comfort and American safety features like Co-Pilot360.\n\n### 5. Honda CR-V (Base Petrol trim under 1B VND)\n\nThe CR-V petrol models remain highly attractive due to practical 5+2 seats, solid build, and high resale value.`,
        thumbnail: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
        category: "Tư vấn mua xe",
        author: "Nguyễn Minh Đức",
        featured: 0,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Kinh nghiệm xương máu khi mua xe ô tô cũ: Tránh xa xe đâm đụng, ngập nước",
        title_vi: "Kinh nghiệm xương máu khi mua xe ô tô cũ: Tránh xa xe đâm đụng, ngập nước",
        title_en: "Crucial Experiences When Buying a Used Car: Avoid Accidents and Flooded Cars",
        slug: "experience-buying-used-cars",
        excerpt: "Mua xe ô tô cũ giúp tiết kiệm chi phí nhưng cũng ẩn chứa nhiều rủi ro. Bài viết chia sẻ những kinh nghiệm thực tế giúp bạn nhận biết xe tai nạn, thủy kích và định giá xe cũ chính xác nhất.",
        excerpt_vi: "Mua xe ô tô cũ giúp tiết kiệm chi phí nhưng cũng ẩn chứa nhiều rủi ro. Bài viết chia sẻ những kinh nghiệm thực tế giúp bạn nhận biết xe tai nạn, thủy kích và định giá xe cũ chính xác nhất.",
        excerpt_en: "Buying a used car saves money but carries risks. This article shares practical advice to help you spot crashed or flooded cars and estimate their value accurately.",
        content: `Việc sở hữu một chiếc ô tô qua sử dụng giúp người mua tiết kiệm được từ vài chục đến hàng trăm triệu đồng tiền thuế phí so với xe mới. Tuy nhiên, nếu không có kinh nghiệm, bạn rất dễ mua phải những chiếc xe bị tai nạn đâm đụng nặng hoặc từng ngập nước thủy kích. Dưới đây là những kinh nghiệm thực tế tích lũy từ các chuyên gia kỹ thuật hàng đầu.\n\n### 1. Kiểm tra kỹ keo chỉ, ốc vít nắp capo và các khớp nối\n\nMột chiếc xe nguyên bản sẽ có phần keo chỉ (chỉ viền chạy quanh các mép cửa, nắp capo, cốp xe) thẳng đều, mềm mại và không bị nứt vỡ hay chắp vá. Nếu thấy keo chỉ bị mất, đứt đoạn hoặc có dấu hiệu chạy lại bằng tay (cứng hoặc không đều), khả năng cao phần thân vỏ đó đã bị đâm đụng và gò nắn lại.\n\nHãy nhìn vào ốc vít nắp capo, ốc cánh cửa và tai xe. Nếu sơn trên ốc bị xước hoặc có vết cờ-lê vặn mở, chứng tỏ các bộ phận này đã từng bị tháo ra để sửa chữa hoặc thay thế sau va chạm.\n\n### 2. Dấu hiệu nhận biết xe bị thủy kích (ngập nước)\n\nThủy kích là cơn ác mộng lớn nhất của động cơ ô tô. Để phát hiện xe từng lội nước, hãy chú ý:\n- **Mùi ẩm mốc đặc trưng:** Xe ngập nước thường có mùi bùn đất ẩm mốc ẩn bên trong các lớp nỉ sàn và đệm ghế. Dù có dọn nội thất kỹ thế nào thì mùi hôi này vẫn rất khó bay sạch hoàn toàn.\n- **Gỉ sét dưới gầm và bu-lông ghế:** Kiểm tra các con ốc dưới chân ghế, đầu cắm dây đai an toàn. Nếu các chi tiết này có dấu hiệu ố gỉ hay bám cát mịn, chắc chắn nước đã từng tràn vào cabin.\n- **Hệ thống điện chập chờn:** Kiểm tra hoạt động của bảng đồng hồ, hệ thống âm thanh, điều hòa, nâng hạ kính. Xe ngập nước thường bị hỏng hộp đen hoặc chập mạch đường dây điện chạy dọc thân xe.\n\n### 3. Kiểm tra số ODO thực tế của xe\n\nViệc tua đồng hồ công-tơ-mét (ODO) cực kỳ phổ biến hiện nay. Bạn đừng chỉ tin vào con số hiển thị trên màn hình. Hãy đánh giá độ hao mòn cơ học của xe qua:\n- **Độ mòn vô-lăng, cần số và bàn đạp chân phanh/ga:** Những xe chạy nhiều vô-lăng sẽ bị bóng, mòn da; cần số lỏng lênh; cao su bàn đạp phanh bị vẹt góc.\n- **Tình trạng nệm ghế lái:** Ghế lái xẹp lép, nứt da hoặc nhăn nhúm nhiều thường là xe đã chạy trên 100.000 km.\n- **Lịch sử bảo dưỡng tại hãng:** Hãy yêu cầu chủ xe cung cấp sổ bảo dưỡng định kỳ hoặc cùng mang xe ra đại lý chính hãng để check lịch sử bảo dưỡng gần nhất.`,
        content_vi: `Việc sở hữu một chiếc ô tô qua sử dụng giúp người mua tiết kiệm được từ vài chục đến hàng trăm triệu đồng tiền thuế phí so với xe mới. Tuy nhiên, nếu không có kinh nghiệm, bạn rất dễ mua phải những chiếc xe bị tai nạn đâm đụng nặng hoặc từng ngập nước thủy kích. Dưới đây là những kinh nghiệm thực tế tích lũy từ các chuyên gia kỹ thuật hàng đầu.\n\n### 1. Kiểm tra kỹ keo chỉ, ốc vít nắp capo và các khớp nối\n\nMột chiếc xe nguyên bản sẽ có phần keo chỉ (chỉ viền chạy quanh các mép cửa, nắp capo, cốp xe) thẳng đều, mềm mại và không bị nứt vỡ hay chắp vá. Nếu thấy keo chỉ bị mất, đứt đoạn hoặc có dấu hiệu chạy lại bằng tay (cứng hoặc không đều), khả năng cao phần thân vỏ đó đã bị đâm đụng và gò nắn lại.\n\nHãy nhìn vào ốc vít nắp capo, ốc cánh cửa và tai xe. Nếu sơn trên ốc bị xước hoặc có vết cờ-lê vặn mở, chứng tỏ các bộ phận này đã từng bị tháo ra để sửa chữa hoặc thay thế sau va chạm.\n\n### 2. Dấu hiệu nhận biết xe bị thủy kích (ngập nước)\n\nThủy kích là cơn ác mộng lớn nhất của động cơ ô tô. Để phát hiện xe từng lội nước, hãy chú ý:\n- **Mùi ẩm mốc đặc trưng:** Xe ngập nước thường có mùi bùn đất ẩm mốc ẩn bên trong các lớp nỉ sàn và đệm ghế. Dù có dọn nội thất kỹ thế nào thì mùi hôi này vẫn rất khó bay sạch hoàn toàn.\n- **Gỉ sét dưới gầm và bu-lông ghế:** Kiểm tra các con ốc dưới chân ghế, đầu cắm dây đai an toàn. Nếu các chi tiết này có dấu hiệu ố gỉ hay bám cát mịn, chắc chắn nước đã từng tràn vào cabin.\n- **Hệ thống điện chập chờn:** Kiểm tra hoạt động của bảng đồng hồ, hệ thống âm thanh, điều hòa, nâng hạ kính. Xe ngập nước thường bị hỏng hộp đen hoặc chập mạch đường dây điện chạy dọc thân xe.\n\n### 3. Kiểm tra số ODO thực tế của xe\n\nViệc tua đồng hồ công-tơ-mét (ODO) cực kỳ phổ biến hiện nay. Bạn đừng chỉ tin vào con số hiển thị trên màn hình. Hãy đánh giá độ hao mòn cơ học của xe qua:\n- **Độ mòn vô-lăng, cần số và bàn đạp chân phanh/ga:** Những xe chạy nhiều vô-lăng sẽ bị bóng, mòn da; cần số lỏng lênh; cao su bàn đạp phanh bị vẹt góc.\n- **Tình trạng nệm ghế lái:** Ghế lái xẹp lép, nứt da hoặc nhăn nhúm nhiều thường là xe đã chạy trên 100.000 km.\n- **Lịch sử bảo dưỡng tại hãng:** Hãy yêu cầu chủ xe cung cấp sổ bảo dưỡng định kỳ hoặc cùng mang xe ra đại lý chính hãng để check lịch sử bảo dưỡng gần nhất.`,
        content_en: `Purchasing a used vehicle saves cash but can hide major issues. Here's a quick checklist to help detect flood-damaged or severely crashed cars.\n\n### 1. Check Sealants and Body Bolts\n\nOriginal cars feature consistent, soft factory seam sealants on door hinges, hood, and trunk. Stiff, irregular, or missing sealant indicates body repairs following a collision.\n\n### 2. Spotting Water Damage (Flood / Hydrolock)\n\n- **Musty Smell:** Flooded interiors retain a muddy, humid smell. Smell carpets and seat cushions closely.\n- **Corroded Bolts:** Check seat rails and safety belt buckle receptacles for corrosion.\n- **Electrical Issues:** Verify dashboard lighting, sound systems, and power windows.\n\n### 3. Verify Mileage (Odometer)\n\nVerify wear and tear on key contact areas (steering wheel, gear lever, pedals) to confirm the odometer matches the car's physical wear. Check the brand service records.`,
        thumbnail: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
        category: "Kinh nghiệm",
        author: "Lê Hoàng Nam",
        featured: 0,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Hướng dẫn chi tiết quy trình 5 bước tự kiểm tra tình trạng xe ô tô đã qua sử dụng",
        title_vi: "Hướng dẫn chi tiết quy trình 5 bước tự kiểm tra tình trạng xe ô tô đã qua sử dụng",
        title_en: "Detailed 5-Step Guide to Inspecting a Used Car's Condition Yourself",
        slug: "how-to-check-used-car-condition",
        excerpt: "Không cần là chuyên gia, bạn vẫn có thể tự mình đánh giá sơ bộ tình trạng của một chiếc ô tô cũ thông qua quy trình kiểm tra ngoại thất, nội thất, khoang máy và lái thử thực tế dưới đây.",
        excerpt_vi: "Không cần là chuyên gia, bạn vẫn có thể tự mình đánh giá sơ bộ tình trạng của một chiếc ô tô cũ thông qua quy trình kiểm tra ngoại thất, nội thất, khoang máy và lái thử thực tế dưới đây.",
        excerpt_en: "You don't need to be an expert to evaluate a used car. Check its exterior, interior, engine bay, and perform a test drive with this simple 5-step process.",
        content: `Đi xem xe cũ là một nghệ thuật và người mua cần giữ sự tỉnh táo trước những lời mật ngọt của người bán. Nếu bạn chuẩn bị đi xem một chiếc ô tô cũ, hãy áp dụng ngay quy trình 5 bước tự kiểm tra chi tiết dưới đây để nắm thế chủ động.\n\n### Bước 1: Kiểm tra ngoại thất dưới ánh sáng mặt trời\n\nLuôn đi xem xe vào ban ngày và ở những nơi rộng rãi, đầy đủ ánh sáng. Tránh xem xe khi trời mưa hoặc dưới ánh đèn mờ ảo của hầm gửi xe.\n- Quan sát dọc theo thân xe để xem màu sơn có đồng đều không. Nếu có những vùng màu sơn sáng hơn hoặc tối hơn các khu vực lân cận, xe đã từng được sơn dặm vá lại.\n- Kiểm tra các khe hở giữa các mảng thân xe (giữa cửa xe và thân xe, nắp capo và tai xe). Chúng phải thẳng hàng và có độ rộng bằng nhau. Khe hở lệch lạc là biểu hiện của xe bị biến dạng khung gầm do va chạm.\n\n### Bước 2: Khảo sát chi tiết khoang động cơ\n\nKhoang động cơ chính là "trái tim" của chiếc xe. Mở nắp capo và quan sát:\n- Bề mặt động cơ phải khô ráo, không có dầu mỡ rò rỉ xung quanh gioăng nắp máy.\n- Kiểm tra màu sắc và mức dầu máy. Dầu máy quá đen và đặc chứng tỏ chủ cũ lười bảo dưỡng thay dầu.\n- Hãy nhìn vào các ống dẫn cao su và dây điện. Chúng không được nứt nẻ, mục nát hay quấn băng keo chằng chit thiếu thẩm mỹ.\n\n### Bước 3: Đánh giá nội thất và các tính năng cabin\n\nBước vào trong xe và kiểm tra tất cả các thiết bị điện tử:\n- Bật điều hòa hết cỡ, kiểm tra xem luồng gió thổi ra có mát sâu và không có mùi lạ hay không.\n- Thử nghiệm hệ thống loa, màn hình cảm ứng giải trí, camera lùi và cảm biến xung quanh xe.\n- Kiểm tra hoạt động của cửa sổ trời (nếu có), nâng hạ kính của tất cả các cửa xe và chốt khóa an toàn.\n\n### Bước 4: Khởi động động cơ và lắng nghe âm thanh\n\nKhởi động máy khi động cơ còn nguội (chưa được chạy trước đó):\n- Động cơ hoạt động tốt sẽ khởi động dễ dàng, vòng tua máy nhanh chóng ổn định ở mức 700 - 800 vòng/phút ở chế độ không tải.\n- Lắng nghe xem có tiếng gõ kim loại, tiếng rít từ dây curoa hay những âm thanh bất thường nào phát ra từ dưới nắp capo hay không.\n\n### Bước 5: Lái thử thực tế trên nhiều địa hình\n\nĐây là bước quan trọng nhất quyết định bạn có nên mua xe hay không. Lái xe ít nhất 15-20 phút:\n- **Thử nghiệm hộp số:** Chuyển số phải mượt mà, không bị giật hay có độ trễ lớn khi tăng tốc.\n- **Kiểm tra hệ thống treo:** Đi qua những đoạn đường gồ ghề xem giảm xóc có êm không, có tiếng kêu lục cục dưới gầm xe không.\n- **Kiểm tra phanh:** Phanh gấp ở tốc độ trung bình xem xe có bị lệch lái hay có tiếng rít phanh phát ra không. Cảm giác chân phanh phải chắc chắn, không bị võng hay quá cứng.`,
        content_vi: `Đi xem xe cũ là một nghệ thuật và người mua cần giữ sự tỉnh táo trước những lời mật ngọt của người bán. Nếu bạn chuẩn bị đi xem một chiếc ô tô cũ, hãy áp dụng ngay quy trình 5 bước tự kiểm tra chi tiết dưới đây để nắm thế chủ động.\n\n### Bước 1: Kiểm tra ngoại thất dưới ánh sáng mặt trời\n\nLuôn đi xem xe vào ban ngày và ở những nơi rộng rãi, đầy đủ ánh sáng. Tránh xem xe khi trời mưa hoặc dưới ánh đèn mờ ảo của hầm gửi xe.\n- Quan sát dọc theo thân xe để xem màu sơn có đồng đều không. Nếu có những vùng màu sơn sáng hơn hoặc tối hơn các khu vực lân cận, xe đã từng được sơn dặm vá lại.\n- Kiểm tra các khe hở giữa các mảng thân xe (giữa cửa xe và thân xe, nắp capo và tai xe). Chúng phải thẳng hàng và có độ rộng bằng nhau. Khe hở lệch lạc là biểu hiện của xe bị biến dạng khung gầm do va chạm.\n\n### Bước 2: Khảo sát chi tiết khoang động cơ\n\nKhoang động cơ chính là "trái tim" của chiếc xe. Mở nắp capo và quan sát:\n- Bề mặt động cơ phải khô ráo, không có dầu mỡ rò rỉ xung quanh gioăng nắp máy.\n- Kiểm tra màu sắc và mức dầu máy. Dầu máy quá đen và đặc chứng tỏ chủ cũ lười bảo dưỡng thay dầu.\n- Hãy nhìn vào các ống dẫn cao su và dây điện. Chúng không được nứt nẻ, mục nát hay quấn băng keo chằng chit thiếu thẩm mỹ.\n\n### Bước 3: Đánh giá nội thất và các tính năng cabin\n\nBước vào trong xe và kiểm tra tất cả các thiết bị điện tử:\n- Bật điều hòa hết cỡ, kiểm tra xem luồng gió thổi ra có mát sâu và không có mùi lạ hay không.\n- Thử nghiệm hệ thống loa, màn hình cảm ứng giải trí, camera lùi và cảm biến xung quanh xe.\n- Kiểm tra hoạt động của cửa sổ trời (nếu có), nâng hạ kính của tất cả các cửa xe và chốt khóa an toàn.\n\n### Bước 4: Khởi động động cơ và lắng nghe âm thanh\n\nKhởi động máy khi động cơ còn nguội (chưa được chạy trước đó):\n- Động cơ hoạt động tốt sẽ khởi động dễ dàng, vòng tua máy nhanh chóng ổn định ở mức 700 - 800 vòng/phút ở chế độ không tải.\n- Lắng nghe xem có tiếng gõ kim loại, tiếng rít từ dây curoa hay những âm thanh bất thường nào phát ra từ dưới nắp capo hay không.\n\n### Bước 5: Lái thử thực tế trên nhiều địa hình\n\nĐây là bước quan trọng nhất quyết định bạn có nên mua xe hay không. Lái xe ít nhất 15-20 phút:\n- **Thử nghiệm hộp số:** Chuyển số phải mượt mà, không bị giật hay có độ trễ lớn khi tăng tốc.\n- **Kiểm tra hệ thống treo:** Đi qua những đoạn đường gồ ghề xem giảm xóc có êm không, có tiếng kêu lục cục dưới gầm xe không.\n- **Kiểm tra phanh:** Phanh gấp ở tốc độ trung bình xem xe có bị lệch lái hay có tiếng rít phanh phát ra không. Cảm giác chân phanh phải chắc chắn, không bị võng hay quá cứng.`,
        content_en: `Use these 5 steps to inspect a pre-owned car's mechanical health.\n\n### Step 1: Daylight Exterior Inspection\n\nAlways inspect cars in bright daylight to search for misaligned panels or color mismatches.\n\n### Step 2: Examine the Engine Bay\n\nLook for oil leaks, inspect fluid levels, and check rubber pipes for cracks.\n\n### Step 3: Interior and Electronics Checks\n\nTurn on the AC to max, verify the touchscreen, and check power window regulators.\n\n### Step 4: Startup and Engine Sounds\n\nStart the car when cold. The engine should settle at 700-800 RPM. Listen closely for metallic knocks.\n\n### Step 5: Comprehensive Test Drive\n\nDrive for 15 minutes. Check transmission shifting, test the suspension over bumps, and verify the braking response.`,
        thumbnail: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
        category: "Kinh nghiệm",
        author: "Phạm Hải Đăng",
        featured: 0,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Top những mẫu xe Sedan gia đình tốt nhất phân khúc hiện nay: Rộng rãi và Bền bỉ",
        title_vi: "Top những mẫu xe Sedan gia đình tốt nhất phân khúc hiện nay: Rộng rãi và Bền bỉ",
        title_en: "Top Best Family Sedans in the Market: Spacious and Reliable",
        slug: "best-sedan-cars-for-families",
        excerpt: "Dòng xe Sedan truyền thống vẫn giữ vị thế nhờ kiểu dáng sang trọng, khả năng cách âm tốt và cảm giác êm ái cho người ngồi sau. Dưới đây là những gợi ý xe Sedan gia đình lý tưởng nhất.",
        excerpt_vi: "Dòng xe Sedan truyền thống vẫn giữ vị thế nhờ kiểu dáng sang trọng, khả năng cách âm tốt và cảm giác êm ái cho người ngồi sau. Dưới đây là những gợi ý xe Sedan gia đình lý tưởng nhất.",
        excerpt_en: "Traditional sedans remain popular for their elegant styling, quiet cabins, and comfortable ride. Here are our top suggestions for family sedans.",
        content: `Mặc dù trào lưu xe gầm cao đang nở rộ, những mẫu xe sedan truyền thống vẫn giữ một chỗ đứng vững chắc nhờ ưu thế gầm thấp trọng tâm thấp giúp xe vận hành đầm chắc khi đi cao tốc, khả năng cách âm vượt trội cùng thiết kế lịch lãm tinh tế phù hợp cả công việc lẫn phục vụ gia đình. Dưới đây là những lựa chọn Sedan gia đình xuất sắc nhất phân khúc.\n\n### 1. Toyota Camry (Phân khúc D - Sang trọng đẳng cấp)\n\nĐược mệnh danh là "vua phân khúc" sedan cỡ trung tại Việt Nam, Toyota Camry tiếp tục nâng tầm với triết lý thiết kế trẻ trung hơn cùng nền tảng khung gầm TNGA toàn cầu vận hành đầm chắc bất ngờ.\n\nKhông gian hàng ghế thứ hai của Camry rộng rãi nhất phân khúc, đi kèm bệ tỳ tay tích hợp bảng điều khiển cảm ứng ngả ghế cực kỳ xịn sò. Độ bền bỉ, tiết kiệm xăng cùng khả năng giữ giá vô địch khiến Camry luôn là lựa chọn ưu tiên của các gia đình khá giả.\n\n### 2. Honda Accord (Phân khúc D - Trải nghiệm lái phấn khích)\n\nNếu bạn là người thích cầm lái nhưng vẫn muốn một chiếc xe đủ rộng cho cả nhà, Honda Accord là câu trả lời tuyệt vời. Sở hữu khối động cơ VTEC Turbo 1.5L mạnh mẽ kết hợp cùng hộp số vô cấp CVT tinh chỉnh thể thao.\n\nKhung gầm Accord đầm chắc, vô-lăng phản hồi sắc nét mang lại trải nghiệm lái đậm chất thể thao mà hiếm mẫu xe đối thủ nào trong tầm giá làm được. Thiết kế Coupe thể thao vuốt đều về phía đuôi giúp xe trông rất thời trang.\n\n### 3. Mazda 6 (Phân khúc D - Đầy ắp công nghệ tầm giá hời)\n\nMazda 6 sở hữu mức giá cực kỳ cạnh tranh, ngang ngửa nhiều mẫu xe hạng C nhưng mang lại trải nghiệm tiệm cận xe sang. Thiết kế KODO tinh tế với những đường nét uyển chuyển quyến rũ.\n\nKhông gian nội thất bọc da Nappa cao cấp sang trọng, đi kèm các trang bị tiện nghi đỉnh cao như hiển thị thông tin kính lái HUD, phanh tay điện tử tích hợp giữ phanh tự động và dàn âm thanh 11 loa Bose sống động mang lại trải nghiệm thư giãn tuyệt đối cho gia đình trên những chuyến hành trình dài.`,
        content_vi: `Mặc dù trào lưu xe gầm cao đang nở rộ, những mẫu xe sedan truyền thống vẫn giữ một chỗ đứng vững chắc nhờ ưu thế gầm thấp trọng tâm thấp giúp xe vận hành đầm chắc khi đi cao tốc, khả năng cách âm vượt trội cùng thiết kế lịch lãm tinh tế phù hợp cả công việc lẫn phục vụ gia đình. Dưới đây là những lựa chọn Sedan gia đình xuất sắc nhất phân khúc.\n\n### 1. Toyota Camry (Phân khúc D - Sang trọng đẳng cấp)\n\nĐược mệnh danh là "vua phân khúc" sedan cỡ trung tại Việt Nam, Toyota Camry tiếp tục nâng tầm với triết lý thiết kế trẻ trung hơn cùng nền tảng khung gầm TNGA toàn cầu vận hành đầm chắc bất ngờ.\n\nKhông gian hàng ghế thứ hai của Camry rộng rãi nhất phân khúc, đi kèm bệ tỳ tay tích hợp bảng điều khiển cảm ứng ngả ghế cực kỳ xịn sò. Độ bền bỉ, tiết kiệm xăng cùng khả năng giữ giá vô địch khiến Camry luôn là lựa chọn ưu tiên của các gia đình khá giả.\n\n### 2. Honda Accord (Phân khúc D - Trải nghiệm lái phấn khích)\n\nNếu bạn là người thích cầm lái nhưng vẫn muốn một chiếc xe đủ rộng cho cả nhà, Honda Accord là câu trả lời tuyệt vời. Sở hữu khối động cơ VTEC Turbo 1.5L mạnh mẽ kết hợp cùng hộp số vô cấp CVT tinh chỉnh thể thao.\n\nKhung gầm Accord đầm chắc, vô-lăng phản hồi sắc nét mang lại trải nghiệm lái đậm chất thể thao mà hiếm mẫu xe đối thủ nào trong tầm giá làm được. Thiết kế Coupe thể thao vuốt đều về phía đuôi giúp xe trông rất thời trang.\n\n### 3. Mazda 6 (Phân khúc D - Đầy ắp công nghệ tầm giá hời)\n\nMazda 6 sở hữu mức giá cực kỳ cạnh tranh, ngang ngửa nhiều mẫu xe hạng C nhưng mang lại trải nghiệm tiệm cận xe sang. Thiết kế KODO tinh tế với những đường nét uyển chuyển quyến rũ.\n\nKhông gian nội thất bọc da Nappa cao cấp sang trọng, đi kèm các trang bị tiện nghi đỉnh cao như hiển thị thông tin kính lái HUD, phanh tay điện tử tích hợp giữ phanh tự động và dàn âm thanh 11 loa Bose sống động mang lại trải nghiệm thư giãn tuyệt đối cho gia đình trên những chuyến hành trình dài.`,
        content_en: `Sedans remain a fantastic family choice due to low center of gravity, quiet passenger cabins, and smooth ride quality. Here are three best models.\n\n### 1. Toyota Camry (D-segment - Premium and Luxurious)\n\nToyota's flagship Camry features modern styling built on the TNGA platform. The rear seats offer passenger legroom and reclining operations.\n\n### 2. Honda Accord (D-segment - Engaging Driver's Car)\n\nThe Accord is powered by a VTEC Turbo 1.5L engine. It provides steering responsiveness and a sleek fastback coupe design.\n\n### 3. Mazda 6 (D-segment - Packed with Features)\n\nOffering premium features at a competitive price, the Mazda 6 boasts Nappa leather seats, a head-up display (HUD), and an 11-speaker Bose surround sound system.`,
        thumbnail: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
        category: "Tư vấn mua xe",
        author: "Trần Quốc Huy",
        featured: 0,
        published: 1,
      },
    ];

    for (const post of samplePosts) {
      await activePool.query(
        "INSERT INTO posts (id, title, title_vi, title_en, slug, excerpt, excerpt_vi, excerpt_en, content, content_vi, content_en, thumbnail, category, author, featured, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());",
        [post.id, post.title, post.title_vi, post.title_en, post.slug, post.excerpt, post.excerpt_vi, post.excerpt_en, post.content, post.content_vi, post.content_en, post.thumbnail, post.category, post.author, post.featured, post.published]
      );
    }
    console.log("Seeding posts table complete!");
  }

  // 6. Seeding customers if empty
  const [customerRows] = await activePool.query("SELECT COUNT(*) as count FROM customers;");
  const customerCount = (customerRows as any)[0]?.count || 0;
  if (customerCount === 0) {
    console.log("Seeding customers table...");
    
    // Get staff ids for assignment
    const [staffRows] = await activePool.query("SELECT id, email FROM users WHERE role IN ('admin', 'staff');");
    const staffList = staffRows as any[];
    const sales01 = staffList.find(s => s.email === "sales01@tqauto.vn")?.id || null;
    const sales02 = staffList.find(s => s.email === "sales02@tqauto.vn")?.id || null;
    const adminId = staffList.find(s => s.email === "admin@tqauto.vn")?.id || null;

    // Get car ids for interest
    const [carRows] = await activePool.query("SELECT id, title FROM cars;");
    const carsList = carRows as any[];
    const camryId = carsList.find(c => c.title.includes("Camry"))?.id || null;
    const glsId = carsList.find(c => c.title.includes("GLS 450"))?.id || null;
    const x5Id = carsList.find(c => c.title.includes("X5"))?.id || null;
    const cx5Id = carsList.find(c => c.title.includes("CX-5"))?.id || null;
    const civicId = carsList.find(c => c.title.includes("Civic"))?.id || null;

    const sampleCustomers = [
      {
        id: "cust0000-0000-0000-0000-000000000001",
        full_name: "Nguyễn Minh Anh",
        phone: "0902118882",
        email: "minhanh@example.com",
        interested_car_id: camryId,
        budget: "1.2 tỷ",
        stage: "appointment" as const,
        note: "Khách quan tâm Toyota Camry 2.5Q màu đen, muốn trả góp 80% giá trị xe.",
        assigned_staff_id: sales01 || adminId,
        source: "website",
        status: "active" as const
      },
      {
        id: "cust0000-0000-0000-0000-000000000002",
        full_name: "Trần Quốc Huy",
        phone: "0938440128",
        email: "huy.tran@example.com",
        interested_car_id: x5Id,
        budget: "3.5 tỷ",
        stage: "consulting" as const,
        note: "Cần tư vấn lăn bánh xe BMW X5 M Sport và lái thử xe vào thứ 7 tuần tới.",
        assigned_staff_id: sales01 || adminId,
        source: "chat",
        status: "active" as const
      },
      {
        id: "cust0000-0000-0000-0000-000000000003",
        full_name: "Lê Hoàng Nam",
        phone: "0917725600",
        email: "nam.le@example.com",
        interested_car_id: glsId,
        budget: "3.6 tỷ",
        stage: "reserved" as const,
        note: "Khách đã đặt cọc giữ chỗ 50 triệu cho Mercedes Benz GLS 450. Đang hoàn thiện thủ tục ngân hàng.",
        assigned_staff_id: sales02 || adminId,
        source: "showroom",
        status: "active" as const
      },
      {
        id: "cust0000-0000-0000-0000-000000000004",
        full_name: "Phạm Bảo Ngọc",
        phone: "0986330220",
        email: "ngoc.pham@example.com",
        interested_car_id: civicId,
        budget: "900 triệu",
        stage: "new_lead" as const,
        note: "Đăng ký nhận báo giá lăn bánh Honda Civic RS qua website.",
        assigned_staff_id: null,
        source: "website",
        status: "active" as const
      },
      {
        id: "cust0000-0000-0000-0000-000000000005",
        full_name: "Đỗ Gia Khánh",
        phone: "0909225710",
        email: "khanh.do@example.com",
        interested_car_id: cx5Id,
        budget: "850 triệu",
        stage: "follow_up" as const,
        note: "Đã tư vấn Mazda CX-5 tuần trước nhưng khách chần chừ về màu sắc. Cần chăm sóc lại sau 1 tuần.",
        assigned_staff_id: sales02 || adminId,
        source: "website",
        status: "active" as const
      }
    ];

    for (const c of sampleCustomers) {
      try {
        await activePool.query(`
          INSERT INTO customers (id, full_name, phone, email, interested_car_id, budget, stage, note, assigned_staff_id, source, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id;
        `, [
          c.id, c.full_name, c.phone, c.email, c.interested_car_id, c.budget, c.stage, c.note, c.assigned_staff_id, c.source, c.status
        ]);

        // Seed an initial note for each seeded customer
        if (c.assigned_staff_id) {
          const [existingNotes] = await activePool.query("SELECT id FROM customer_notes WHERE customer_id = ? LIMIT 1;", [c.id]);
          if ((existingNotes as any[]).length === 0) {
            await activePool.query(`
              INSERT INTO customer_notes (id, customer_id, staff_id, content)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE id=id;
            `, [
              crypto.randomUUID(),
              c.id,
              c.assigned_staff_id,
              c.note || "Khởi tạo thông tin khách hàng từ hệ thống."
            ]);
          }
        }
      } catch (err: any) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error("Failed to seed customer:", err.message);
        }
      }
    }
    console.log("Seeding customers complete!");
  }

  // 7. Seeding contact requests if empty
  const [requestRows] = await activePool.query("SELECT COUNT(*) as count FROM contact_requests;");
  const requestCount = (requestRows as any)[0]?.count || 0;
  if (requestCount === 0) {
    console.log("Seeding contact_requests table...");
    for (const req of mockContactRequests) {
      try {
        await activePool.query(`
          INSERT INTO contact_requests (id, full_name, phone, email, consultation_type, message, assigned_staff_id, stage, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id;
        `, [
          req.id,
          req.full_name,
          req.phone,
          req.email,
          req.consultation_type,
          req.message,
          req.assigned_staff_id,
          req.stage,
          req.status
        ]);
      } catch (err: any) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error("Failed to seed contact request:", err.message);
        }
      }
    }
    console.log("Seeding contact_requests complete!");
  }

  dbInitialized = true;
}

// User CRUD operations
export async function getUsers(): Promise<DbUser[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM users;");
  
  return (rows as any[]).map((r) => ({
    ...r,
    created_at: safeToIsoString(r.created_at),
    updated_at: safeToIsoString(r.updated_at),
  }));
}

export async function saveUser(user: Omit<DbUser, "id" | "created_at" | "updated_at">): Promise<DbUser> {
  await ensureDbExists();
  const newUser: DbUser = {
    ...user,
    id: crypto.randomUUID(),
    status: user.status || "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const activePool = getPool();
  await activePool.query(
    "INSERT INTO users (id, full_name, email, phone, password, avatar, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [newUser.id, newUser.full_name, newUser.email, newUser.phone, newUser.password, newUser.avatar, newUser.role, newUser.status, new Date(newUser.created_at), new Date(newUser.updated_at)]
  );

  return newUser;
}

export async function handleReservationExpiration(): Promise<void> {
  const activePool = getPool();
  await activePool.query(
    "UPDATE cars SET status = 'available', reserved_until = NULL WHERE status = 'reserved' AND reserved_until IS NOT NULL AND reserved_until < NOW();"
  );
}

// Cars CRUD operations
export async function getCars(): Promise<DbCar[]> {
  await ensureDbExists();
  await handleReservationExpiration();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM cars ORDER BY created_at DESC;");
  
  return (rows as any[]).map((r) => ({
    ...r,
    created_at: safeToIsoString(r.created_at),
    updated_at: safeToIsoString(r.updated_at),
    reserved_until: r.reserved_until ? safeToIsoString(r.reserved_until) : null,
  }));
}

export async function getCarById(id: string): Promise<DbCar | null> {
  await ensureDbExists();
  await handleReservationExpiration();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM cars WHERE id = ?;", [id]);
  const results = rows as any[];
  if (results.length === 0) return null;
  const r = results[0];
  return {
    ...r,
    created_at: safeToIsoString(r.created_at),
    updated_at: safeToIsoString(r.updated_at),
    reserved_until: r.reserved_until ? safeToIsoString(r.reserved_until) : null,
  };
}

export async function getCarImages(carId: string): Promise<DbCarImage[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM car_images WHERE car_id = ? ORDER BY sort_order ASC;", [carId]);
  
  return (rows as any[]).map((r) => ({
    ...r,
    created_at: safeToIsoString(r.created_at),
  }));
}

export async function incrementCarViews(carId: string): Promise<void> {
  await ensureDbExists();
  const activePool = getPool();
  await activePool.query("UPDATE cars SET views = views + 1 WHERE id = ?;", [carId]);
}

export async function saveCar(car: Omit<DbCar, "id" | "created_at" | "updated_at" | "views">): Promise<DbCar> {
  await ensureDbExists();
  const newCar: DbCar = {
    ...car,
    id: crypto.randomUUID(),
    views: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const activePool = getPool();
  await activePool.query(
    "INSERT INTO cars (id, user_id, title, title_vi, title_en, brand, model, year, price, mileage, fuel_type, transmission, body_type, color, seats, engine, description, description_vi, description_en, city, address, thumbnail, views, status, car_condition, reserved_until, condition_type, origin, interior_color, doors, drivetrain, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [
      newCar.id,
      newCar.user_id,
      newCar.title,
      newCar.title_vi || newCar.title,
      newCar.title_en || "",
      newCar.brand,
      newCar.model,
      newCar.year,
      newCar.price,
      newCar.mileage,
      newCar.fuel_type,
      newCar.transmission,
      newCar.body_type,
      newCar.color,
      newCar.seats,
      newCar.engine,
      newCar.description,
      newCar.description_vi || newCar.description,
      newCar.description_en || "",
      newCar.city,
      newCar.address,
      newCar.thumbnail,
      newCar.views,
      newCar.status,
      newCar.car_condition,
      newCar.reserved_until ? new Date(newCar.reserved_until) : null,
      newCar.condition_type,
      newCar.origin,
      newCar.interior_color,
      newCar.doors,
      newCar.drivetrain,
      new Date(newCar.created_at),
      new Date(newCar.updated_at),
    ]
  );

  return newCar;
}

export async function updateCar(
  id: string,
  car: Partial<Omit<DbCar, "id" | "created_at" | "updated_at" | "views">>
): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const fields = Object.keys(car);
  if (fields.length === 0) return false;

  const setClause = fields.map((field) => `\`${field}\` = ?`).join(", ");
  const values = Object.values(car);

  const [result] = await activePool.query(
    `UPDATE cars SET ${setClause}, updated_at = NOW() WHERE id = ?;`,
    [...values, id]
  );

  return (result as any).affectedRows > 0;
}

export async function deleteCar(id: string): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [result] = await activePool.query("DELETE FROM cars WHERE id = ?;", [id]);
  return (result as any).affectedRows > 0;
}

export async function saveCarImages(images: Omit<DbCarImage, "id" | "created_at">[]): Promise<void> {
  await ensureDbExists();
  const activePool = getPool();
  for (const img of images) {
    await activePool.query(
      "INSERT INTO car_images (id, car_id, image_url, sort_order, created_at) VALUES (?, ?, ?, ?, ?);",
      [crypto.randomUUID(), img.car_id, img.image_url, img.sort_order, new Date()]
    );
  }
}

export async function clearCarGallery(carId: string): Promise<void> {
  await ensureDbExists();
  const activePool = getPool();
  await activePool.query("DELETE FROM car_images WHERE car_id = ? AND sort_order > 0;", [carId]);
}

// Appointment CRUD operations
export async function getAppointments(): Promise<DbAppointment[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM appointments ORDER BY created_at DESC;");

  return (rows as any[]).map((r) => ({
    ...r,
    appointment_date: safeToIsoString(r.appointment_date),
    created_at: safeToIsoString(r.created_at),
  }));
}

export async function getAppointmentsByUserId(userId: string): Promise<DbAppointment[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM appointments WHERE user_id = ? ORDER BY created_at DESC;", [userId]);

  return (rows as any[]).map((r) => ({
    ...r,
    appointment_date: safeToIsoString(r.appointment_date),
    created_at: safeToIsoString(r.created_at),
  }));
}

export async function getAppointmentById(id: string): Promise<DbAppointment | null> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM appointments WHERE id = ?;", [id]);
  const results = rows as any[];
  if (results.length === 0) return null;
  const r = results[0];
  return {
    ...r,
    appointment_date: safeToIsoString(r.appointment_date),
    created_at: safeToIsoString(r.created_at),
  };
}

export async function saveAppointment(
  appointment: Omit<DbAppointment, "id" | "created_at">
): Promise<DbAppointment> {
  await ensureDbExists();
  const newAppointment: DbAppointment = {
    ...appointment,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  const activePool = getPool();
  await activePool.query(
    "INSERT INTO appointments (id, car_id, user_id, customer_name, customer_phone, customer_email, appointment_date, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [
      newAppointment.id,
      newAppointment.car_id,
      newAppointment.user_id,
      newAppointment.customer_name,
      newAppointment.customer_phone,
      newAppointment.customer_email,
      new Date(newAppointment.appointment_date),
      newAppointment.note,
      newAppointment.status,
      new Date(newAppointment.created_at),
    ]
  );

  return newAppointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: DbAppointment["status"]
): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [result] = await activePool.query("UPDATE appointments SET status = ? WHERE id = ?;", [status, id]);
  return (result as any).affectedRows > 0;
}

// Chat CRUD operations
export async function getChatMessages(sessionId: string): Promise<DbChatMessage[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query(
    "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC;",
    [sessionId]
  );

  return (rows as any[]).map((r) => ({
    ...r,
    created_at: safeToIsoString(r.created_at),
  }));
}

export async function saveChatMessage(
  message: Omit<DbChatMessage, "id" | "created_at">
): Promise<DbChatMessage> {
  await ensureDbExists();
  const newMessage: DbChatMessage = {
    ...message,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  const activePool = getPool();
  await activePool.query(
    "INSERT INTO chat_messages (id, session_id, sender_role, sender_name, message_text, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);",
    [
      newMessage.id,
      newMessage.session_id,
      newMessage.sender_role,
      newMessage.sender_name,
      newMessage.message_text,
      newMessage.is_read,
      new Date(newMessage.created_at),
    ]
  );

  return newMessage;
}

export async function markChatAsRead(sessionId: string, senderRole: "customer" | "staff"): Promise<void> {
  await ensureDbExists();
  const activePool = getPool();
  await activePool.query(
    "UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender_role = ? AND is_read = 0;",
    [sessionId, senderRole]
  );
}

export interface ChatConversation {
  sessionId: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  customerName: string;
}

export async function getActiveConversations(): Promise<ChatConversation[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM chat_messages ORDER BY created_at ASC;");
  const allMessages = (rows as any[]).map((r) => ({
    ...r,
    created_at: safeToIsoString(r.created_at),
  }));

  // Group by session_id
  const groups: Record<string, DbChatMessage[]> = {};
  allMessages.forEach((msg) => {
    if (!groups[msg.session_id]) {
      groups[msg.session_id] = [];
    }
    groups[msg.session_id].push(msg);
  });

  const conversations: ChatConversation[] = Object.entries(groups).map(([sessionId, msgs]) => {
    // Sort messages by date asc
    msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const lastMsg = msgs[msgs.length - 1];
    const customerMsgs = msgs.filter((m) => m.sender_role === "customer");
    
    // Get the most recent name used by the customer, or default to the session ID
    const customerName = customerMsgs.length > 0 
      ? customerMsgs[customerMsgs.length - 1].sender_name 
      : (msgs[0]?.sender_name || "Khách hàng");

    const unreadCount = customerMsgs.filter((m) => m.is_read === 0).length;

    return {
      sessionId,
      lastMessage: lastMsg?.message_text || "",
      lastTime: lastMsg?.created_at || new Date().toISOString(),
      unreadCount,
      customerName,
    };
  });

  // Sort conversations by last message time desc
  return conversations.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
}

// Posts CRUD operations
export async function getPosts(onlyPublished: boolean = false): Promise<DbPost[]> {
  await ensureDbExists();
  const activePool = getPool();
  let queryStr = "SELECT * FROM posts";
  if (onlyPublished) {
    queryStr += " WHERE published = 1";
  }
  queryStr += " ORDER BY created_at DESC;";
  const [rows] = await activePool.query(queryStr);
  
  return (rows as any[]).map((r) => ({
    ...r,
    created_at: safeToIsoString(r.created_at),
    updated_at: safeToIsoString(r.updated_at),
  }));
}

export async function getPostById(id: string): Promise<DbPost | null> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM posts WHERE id = ?;", [id]);
  const results = rows as any[];
  if (results.length === 0) return null;
  const r = results[0];
  return {
    ...r,
    created_at: safeToIsoString(r.created_at),
    updated_at: safeToIsoString(r.updated_at),
  };
}

export async function getPostBySlug(slug: string): Promise<DbPost | null> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM posts WHERE slug = ?;", [slug]);
  const results = rows as any[];
  if (results.length === 0) return null;
  const r = results[0];
  return {
    ...r,
    created_at: safeToIsoString(r.created_at),
    updated_at: safeToIsoString(r.updated_at),
  };
}

export async function incrementPostViews(id: string): Promise<void> {
  await ensureDbExists();
  const activePool = getPool();
  await activePool.query("UPDATE posts SET views = views + 1 WHERE id = ?;", [id]);
}

export async function savePost(post: Omit<DbPost, "id" | "created_at" | "updated_at" | "views">): Promise<DbPost> {
  await ensureDbExists();
  const newPost: DbPost = {
    ...post,
    id: crypto.randomUUID(),
    views: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const activePool = getPool();
  await activePool.query(
    "INSERT INTO posts (id, title, title_vi, title_en, slug, excerpt, excerpt_vi, excerpt_en, content, content_vi, content_en, thumbnail, category, author, featured, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [
      newPost.id,
      newPost.title,
      newPost.title_vi || newPost.title,
      newPost.title_en || "",
      newPost.slug,
      newPost.excerpt,
      newPost.excerpt_vi || newPost.excerpt,
      newPost.excerpt_en || "",
      newPost.content,
      newPost.content_vi || newPost.content,
      newPost.content_en || "",
      newPost.thumbnail,
      newPost.category,
      newPost.author,
      newPost.featured,
      newPost.published,
      new Date(newPost.created_at),
      new Date(newPost.updated_at),
    ]
  );

  return newPost;
}

export async function updatePost(
  id: string,
  post: Partial<Omit<DbPost, "id" | "created_at" | "updated_at" | "views">>
): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const fields = Object.keys(post);
  if (fields.length === 0) return false;

  const setClause = fields.map((field) => `\`${field}\` = ?`).join(", ");
  const values = Object.values(post);

  const [result] = await activePool.query(
    `UPDATE posts SET ${setClause}, updated_at = NOW() WHERE id = ?;`,
    [...values, id]
  );

  return (result as any).affectedRows > 0;
}

export async function deletePost(id: string): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [result] = await activePool.query("DELETE FROM posts WHERE id = ?;", [id]);
  return (result as any).affectedRows > 0;
}

export async function getRelatedPosts(category: string, currentId: string, limit: number = 3): Promise<DbPost[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query(
    "SELECT * FROM posts WHERE category = ? AND id != ? AND published = 1 ORDER BY created_at DESC LIMIT ?;",
    [category, currentId, limit]
  );
  
  return (rows as any[]).map((r) => ({
    ...r,
    created_at: safeToIsoString(r.created_at),
    updated_at: safeToIsoString(r.updated_at),
  }));
}

// Additional User Operations
export async function updateUserStatus(userId: string, status: "active" | "blocked"): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [result] = await activePool.query(
    "UPDATE users SET status = ? WHERE id = ?;",
    [status, userId]
  );
  return (result as any).affectedRows > 0;
}

export async function updateUserRole(userId: string, role: "admin" | "staff" | "customer"): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [result] = await activePool.query(
    "UPDATE users SET role = ? WHERE id = ?;",
    [role, userId]
  );
  return (result as any).affectedRows > 0;
}

export async function updateUserProfile(
  userId: string,
  fullName: string,
  phone: string,
  email: string,
  avatar?: string
): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  
  let query = "UPDATE users SET full_name = ?, phone = ?, email = ? WHERE id = ?;";
  let params = [fullName, phone, email, userId];
  
  if (avatar !== undefined) {
    query = "UPDATE users SET full_name = ?, phone = ?, email = ?, avatar = ? WHERE id = ?;";
    params = [fullName, phone, email, avatar, userId];
  }
  
  const [result] = await activePool.query(query, params);
  return (result as any).affectedRows > 0;
}

export async function deleteUser(userId: string): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [result] = await activePool.query("DELETE FROM users WHERE id = ?;", [userId]);
  return (result as any).affectedRows > 0;
}

// Favorites Operations
export async function toggleFavorite(userId: string, carId: string): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  
  // Check if exists
  const [rows] = await activePool.query(
    "SELECT 1 FROM user_favorites WHERE user_id = ? AND car_id = ?;",
    [userId, carId]
  );
  
  if ((rows as any[]).length > 0) {
    // Delete
    await activePool.query(
      "DELETE FROM user_favorites WHERE user_id = ? AND car_id = ?;",
      [userId, carId]
    );
    return false; // Removed
  } else {
    // Insert
    await activePool.query(
      "INSERT INTO user_favorites (user_id, car_id) VALUES (?, ?);",
      [userId, carId]
    );
    return true; // Added
  }
}

export async function getUserFavorites(userId: string): Promise<any[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query(
    `SELECT c.* FROM cars c 
     JOIN user_favorites uf ON c.id = uf.car_id 
     WHERE uf.user_id = ?;`,
    [userId]
  );
  return rows as any[];
}

export async function isFavorite(userId: string, carId: string): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query(
    "SELECT 1 FROM user_favorites WHERE user_id = ? AND car_id = ?;",
    [userId, carId]
  );
  return (rows as any[]).length > 0;
}

// Reviews & Comments
export interface DbCarReview {
  id: string;
  user_id: string;
  car_id: string;
  rating: number;
  comment: string;
  created_at: string;
  full_name?: string;
  avatar?: string;
}

export async function getCarReviews(carId: string): Promise<DbCarReview[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query(
    `SELECT cr.*, u.full_name, u.avatar FROM car_reviews cr 
     JOIN users u ON cr.user_id = u.id 
     WHERE cr.car_id = ? 
     ORDER BY cr.created_at DESC;`,
    [carId]
  );
  return (rows as any[]).map((r) => ({
    ...r,
    created_at: safeToIsoString(r.created_at),
  }));
}

export async function addCarReview(
  userId: string,
  carId: string,
  rating: number,
  comment: string
): Promise<DbCarReview> {
  await ensureDbExists();
  const activePool = getPool();
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  
  await activePool.query(
    "INSERT INTO car_reviews (id, user_id, car_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?);",
    [id, userId, carId, rating, comment, new Date(created_at)]
  );
  
  return {
    id,
    user_id: userId,
    car_id: carId,
    rating,
    comment,
    created_at,
  };
}

export async function updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [result] = await activePool.query(
    "UPDATE users SET password = ? WHERE email = ?;",
    [passwordHash, email]
  );
  return (result as any).affectedRows > 0;
}
