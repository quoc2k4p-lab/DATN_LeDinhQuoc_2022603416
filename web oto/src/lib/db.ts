import mysql from "mysql2/promise";
import crypto from "crypto";
import { hashPassword } from "./crypto";
import { cars as mockCars, appointments as mockAppointments, users as mockUsers, contactRequests as mockContactRequests, customers as mockCustomers } from "../data/mock";

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
  economy_score?: number;
  safety_score?: number;
  technology_score?: number;
  comfort_score?: number;
  family_score?: number;
  service_score?: number;
  offroad_score?: number;
  luxury_score?: number;
  sort_order?: number;
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
  user_id: string | null; // uuid linked to users
  full_name: string;
  phone: string;
  email: string;
  interested_car_id: string | null;
  budget: string | null;
  stage: "lead" | "contacted" | "test_drive" | "negotiating" | "purchased";
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
  customer_id: string | null; // uuid — nullable for guest customers
  user_id: string | null; // user account id (null for guests)
  // Snapshot fields — captured at booking time, never change
  customer_snapshot_name: string;
  customer_snapshot_email: string;
  customer_snapshot_phone: string;
  appointment_date: string;
  note: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  // Convenience aliases mapped from snapshot columns
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  assigned_staff_name?: string | null;
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
  slug: string;
  excerpt: string;
  excerpt_vi?: string;
  content: string;
  content_vi?: string;
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

// Prevent multiple pools and duplicate connections in development due to hot reloads
const globalForDb = globalThis as unknown as {
  __mysqlPool?: mysql.Pool;
  __dbInitPromise?: Promise<void>;
};

export function getPool() {
  if (!globalForDb.__mysqlPool) {
    globalForDb.__mysqlPool = mysql.createPool({
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
  return globalForDb.__mysqlPool;
}

let dbInitialized = false;

export function ensureDbExists(): Promise<void> {
  if (dbInitialized) return Promise.resolve();

  if (!globalForDb.__dbInitPromise) {
    globalForDb.__dbInitPromise = runDbInitialization();
  }
  return globalForDb.__dbInitPromise;
}

async function runDbInitialization() {
  // 1. Connect without selecting database to check/create it
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
  });

  try {
    const dbName = process.env.MYSQL_DATABASE || "tqauto";
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  } finally {
    await connection.end();
  }

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
      avatar LONGTEXT,
      role ENUM('admin', 'staff', 'customer') NOT NULL,
      status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Migrate avatar column from TEXT to LONGTEXT to support base64 images
  try {
    await activePool.query("ALTER TABLE users MODIFY COLUMN avatar LONGTEXT;");
  } catch (err) {
    console.error("Failed to migrate users avatar column:", err);
  }

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
      customer_id VARCHAR(36) NULL,
      user_id VARCHAR(36) NULL,
      customer_snapshot_name VARCHAR(255) NULL,
      customer_snapshot_email VARCHAR(255) NULL,
      customer_snapshot_phone VARCHAR(50) NULL,
      appointment_date DATETIME NOT NULL,
      note TEXT,
      status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );
  `);

  // Migrate existing appointments table to add snapshot columns and user_id
  const appointmentMigrations = [
    "ALTER TABLE appointments MODIFY COLUMN customer_id VARCHAR(36) NULL",
    "ALTER TABLE appointments ADD COLUMN user_id VARCHAR(36) NULL AFTER customer_id",
    "ALTER TABLE appointments ADD COLUMN customer_snapshot_name VARCHAR(255) NULL AFTER user_id",
    "ALTER TABLE appointments ADD COLUMN customer_snapshot_email VARCHAR(255) NULL AFTER customer_snapshot_name",
    "ALTER TABLE appointments ADD COLUMN customer_snapshot_phone VARCHAR(50) NULL AFTER customer_snapshot_email",
    "ALTER TABLE appointments MODIFY COLUMN appointment_date DATETIME NOT NULL",
  ];
  for (const sql of appointmentMigrations) {
    try {
      await activePool.query(sql);
    } catch (err: any) {
      // Ignore "duplicate column" errors — column already exists
      if (!err?.message?.includes("Duplicate column")) {
        console.warn("appointments migration warning:", err?.message);
      }
    }
  }

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      session_id VARCHAR(50) PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      slug VARCHAR(255) UNIQUE NOT NULL,
      excerpt TEXT NOT NULL,
      excerpt_vi TEXT NULL,
      content LONGTEXT NOT NULL,
      content_vi LONGTEXT NULL,
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
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      interested_car_id VARCHAR(36) NULL,
      budget VARCHAR(100) NULL,
      stage ENUM('lead', 'contacted', 'test_drive', 'negotiating', 'purchased') DEFAULT 'lead',
      note TEXT NULL,
      assigned_staff_id VARCHAR(36) NULL,
      source VARCHAR(100) DEFAULT 'showroom',
      status ENUM('active', 'inactive') DEFAULT 'active',
      session_id VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (interested_car_id) REFERENCES cars(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      car_id VARCHAR(36) NULL,
      user_id VARCHAR(36) NULL,
      action VARCHAR(100) NOT NULL,
      old_status VARCHAR(50) NULL,
      new_status VARCHAR(50) NULL,
      details TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS compare_events (
      id VARCHAR(36) PRIMARY KEY,
      car1_id VARCHAR(36) NOT NULL,
      car2_id VARCHAR(36) NOT NULL,
      car3_id VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car1_id) REFERENCES cars(id) ON DELETE CASCADE,
      FOREIGN KEY (car2_id) REFERENCES cars(id) ON DELETE CASCADE,
      FOREIGN KEY (car3_id) REFERENCES cars(id) ON DELETE SET NULL
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS loan_simulations (
      id VARCHAR(36) PRIMARY KEY,
      car_id VARCHAR(36) NULL,
      customer_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      car_price BIGINT NOT NULL,
      down_payment_percent DOUBLE NOT NULL,
      down_payment_amount BIGINT NOT NULL,
      loan_amount BIGINT NOT NULL,
      interest_rate DOUBLE NOT NULL,
      term_months INT NOT NULL,
      monthly_payment BIGINT NOT NULL,
      total_interest BIGINT NOT NULL,
      total_payment BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS ai_chat_sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      session_id VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS ai_chat_messages (
      id VARCHAR(36) PRIMARY KEY,
      session_id VARCHAR(100) NOT NULL,
      role ENUM('user', 'model', 'system') NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // --- CRM Refactoring Schema Migration ---
  try {
    const [cols] = await activePool.query("SHOW COLUMNS FROM appointments LIKE 'customer_id';");
    if ((cols as any[]).length === 0) {
      console.log("Starting CRM schema refactoring migration...");

      // 1. Add user_id to customers table
      try {
        await activePool.query("ALTER TABLE customers ADD COLUMN user_id VARCHAR(36) NULL;");
        await activePool.query("ALTER TABLE customers ADD CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;");
      } catch (err: any) {
        console.log("customers.user_id column already exists or failed to add constraint:", err.message);
      }

      // 2. Change customers stage column type temporarily to VARCHAR to allow conversion of values
      await activePool.query("ALTER TABLE customers MODIFY COLUMN stage VARCHAR(100) DEFAULT 'lead';");

      // 3. Migrate stage values
      await activePool.query("UPDATE customers SET stage = 'lead' WHERE stage IN ('new_lead', 'follow_up') OR stage IS NULL;");
      await activePool.query("UPDATE customers SET stage = 'contacted' WHERE stage = 'consulting';");
      await activePool.query("UPDATE customers SET stage = 'test_drive' WHERE stage = 'appointment';");
      await activePool.query("UPDATE customers SET stage = 'negotiating' WHERE stage IN ('quotation', 'reserved', 'negotiating');");
      await activePool.query("UPDATE customers SET stage = 'purchased' WHERE stage = 'purchased';");

      // 4. Change customers stage column type back to the new ENUM
      await activePool.query("ALTER TABLE customers MODIFY COLUMN stage ENUM('lead', 'contacted', 'test_drive', 'negotiating', 'purchased') NOT NULL DEFAULT 'lead';");

      // 5. Add customer_id column to appointments (temporarily NULL for migration)
      await activePool.query("ALTER TABLE appointments ADD COLUMN customer_id VARCHAR(36) NULL;");

      // 6. Fetch existing appointments to link to customer profiles
      const [oldAppts] = await activePool.query("SELECT * FROM appointments;");
      for (const appt of oldAppts as any[]) {
        const email = appt.customer_email ? appt.customer_email.trim() : "";
        const phone = appt.customer_phone ? appt.customer_phone.replace(/\D/g, "") : "";
        const name = appt.customer_name ? appt.customer_name.trim() : "Khách vãng lai";

        // Try to find customer by phone or email
        const [existingCusts] = await activePool.query(
          "SELECT id, user_id FROM customers WHERE (phone = ? AND phone != '') OR (email = ? AND email != '') LIMIT 1;",
          [phone, email]
        );

        let customerId = "";
        const custRows = existingCusts as any[];

        if (custRows.length > 0) {
          customerId = custRows[0].id;
          // Sync user_id if customer didn't have one but appointment did
          if (appt.user_id && !custRows[0].user_id) {
            await activePool.query("UPDATE customers SET user_id = ? WHERE id = ?;", [appt.user_id, customerId]);
          }
        } else {
          // Create new customer profile
          customerId = crypto.randomUUID();
          await activePool.query(
            "INSERT INTO customers (id, user_id, full_name, phone, email, stage, source, status) VALUES (?, ?, ?, ?, ?, 'test_drive', 'appointment', 'active');",
            [customerId, appt.user_id || null, name, phone, email]
          );
        }

        // Set customer_id on appointment
        await activePool.query("UPDATE appointments SET customer_id = ? WHERE id = ?;", [customerId, appt.id]);
      }

      // 7. Make appointments.customer_id NOT NULL
      await activePool.query("ALTER TABLE appointments MODIFY COLUMN customer_id VARCHAR(36) NOT NULL;");

      // 8. Drop old appointments columns and foreign key constraints
      try {
        await activePool.query("ALTER TABLE appointments DROP FOREIGN KEY fk_appointments_user;");
      } catch (err: any) {
        console.log("Foreign key fk_appointments_user did not exist or was already dropped.");
      }
      try {
        await activePool.query("ALTER TABLE appointments DROP COLUMN user_id;");
      } catch (err: any) {
        console.log("Column appointments.user_id already dropped.");
      }
      try {
        await activePool.query("ALTER TABLE appointments DROP COLUMN customer_name, DROP COLUMN customer_phone, DROP COLUMN customer_email;");
      } catch (err: any) {
        console.log("Columns customer_name/phone/email already dropped.");
      }

      // 9. Add new foreign key constraint
      try {
        await activePool.query(`
          ALTER TABLE appointments 
          ADD CONSTRAINT fk_appointments_customer 
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        `);
      } catch (err: any) {
        console.log("Failed to add fk_appointments_customer:", err.message);
      }

      console.log("CRM schema refactoring migration completed successfully!");
    }
  } catch (migErr: any) {
    console.error("Error running CRM schema refactoring migration:", migErr.message);
  }

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

  // AI scoring columns for cars
  try { await activePool.query("ALTER TABLE cars ADD COLUMN economy_score INT DEFAULT 80;"); } catch (err: any) {}
  try { await activePool.query("ALTER TABLE cars ADD COLUMN safety_score INT DEFAULT 80;"); } catch (err: any) {}
  try { await activePool.query("ALTER TABLE cars ADD COLUMN technology_score INT DEFAULT 80;"); } catch (err: any) {}
  try { await activePool.query("ALTER TABLE cars ADD COLUMN comfort_score INT DEFAULT 80;"); } catch (err: any) {}
  try { await activePool.query("ALTER TABLE cars ADD COLUMN family_score INT DEFAULT 80;"); } catch (err: any) {}
  try { await activePool.query("ALTER TABLE cars ADD COLUMN service_score INT DEFAULT 80;"); } catch (err: any) {}
  try { await activePool.query("ALTER TABLE cars ADD COLUMN offroad_score INT DEFAULT 80;"); } catch (err: any) {}
  try { await activePool.query("ALTER TABLE cars ADD COLUMN luxury_score INT DEFAULT 80;"); } catch (err: any) {}
  try { await activePool.query("ALTER TABLE cars ADD COLUMN sort_order INT DEFAULT 0;"); } catch (err: any) {}

  // Bilingual column alterations and migrations (VI only, drop EN)
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN title_vi VARCHAR(255) NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars ADD COLUMN description_vi TEXT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN title_vi VARCHAR(255) NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN excerpt_vi TEXT NULL;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts ADD COLUMN content_vi LONGTEXT NULL;");
  } catch (err: any) {}

  // DROP English columns to enforce Vietnamese only
  try {
    await activePool.query("ALTER TABLE cars DROP COLUMN title_en;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE cars DROP COLUMN description_en;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts DROP COLUMN title_en;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts DROP COLUMN excerpt_en;");
  } catch (err: any) {}
  try {
    await activePool.query("ALTER TABLE posts DROP COLUMN content_en;");
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

  // --- Data Cleanup and Foreign Key Constraints Setup ---
  try {
    // 1. Sync live chat session data into chat_sessions
    await activePool.query(`
      INSERT IGNORE INTO chat_sessions (session_id)
      SELECT DISTINCT session_id FROM chat_messages;
    `);
    await activePool.query(`
      INSERT IGNORE INTO chat_sessions (session_id)
      SELECT DISTINCT session_id FROM customers WHERE session_id IS NOT NULL AND session_id != '';
    `);

    // 2. Clean up orphaned records to avoid foreign key constraint violations
    await activePool.query("UPDATE cars SET sold_by = NULL WHERE sold_by IS NOT NULL AND sold_by NOT IN (SELECT id FROM users);");
    await activePool.query("UPDATE cars SET buyer_id = NULL WHERE buyer_id IS NOT NULL AND buyer_id NOT IN (SELECT id FROM customers);");
    try {
      await activePool.query("UPDATE appointments SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);");
    } catch (err: any) {
      // Column user_id was probably already dropped
    }
    
    // Sync missing ai_chat_sessions for orphaned messages
    await activePool.query(`
      INSERT IGNORE INTO ai_chat_sessions (id, session_id, user_id)
      SELECT DISTINCT UUID(), session_id, NULL FROM ai_chat_messages WHERE session_id NOT IN (SELECT session_id FROM ai_chat_sessions);
    `);
  } catch (cleanErr: any) {
    console.error("Failed to clean up records before applying foreign keys:", cleanErr.message);
  }

  // Apply Foreign Key Constraints
  // cars.sold_by -> users(id)
  try {
    await activePool.query(`
      ALTER TABLE cars 
      ADD CONSTRAINT fk_cars_sold_by 
      FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL;
    `);
  } catch (err: any) {
    if (!err.message.includes("Duplicate key") && !err.message.includes("Duplicate foreign key") && !err.message.includes("already exists")) {
      console.error("Failed to add fk_cars_sold_by:", err.message);
    }
  }

  // cars.buyer_id -> customers(id)
  try {
    await activePool.query(`
      ALTER TABLE cars 
      ADD CONSTRAINT fk_cars_buyer_id 
      FOREIGN KEY (buyer_id) REFERENCES customers(id) ON DELETE SET NULL;
    `);
  } catch (err: any) {
    if (!err.message.includes("Duplicate key") && !err.message.includes("Duplicate foreign key") && !err.message.includes("already exists")) {
      console.error("Failed to add fk_cars_buyer_id:", err.message);
    }
  }

  // appointments.customer_id -> customers(id)
  try {
    await activePool.query(`
      ALTER TABLE appointments 
      ADD CONSTRAINT fk_appointments_customer 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
    `);
  } catch (err: any) {
    if (!err.message.includes("Duplicate key") && !err.message.includes("Duplicate foreign key") && !err.message.includes("already exists")) {
      console.error("Failed to add fk_appointments_customer:", err.message);
    }
  }

  // ai_chat_messages.session_id -> ai_chat_sessions(session_id)
  try {
    await activePool.query(`
      ALTER TABLE ai_chat_messages 
      ADD CONSTRAINT fk_ai_chat_messages_session 
      FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(session_id) ON DELETE CASCADE;
    `);
  } catch (err: any) {
    if (!err.message.includes("Duplicate key") && !err.message.includes("Duplicate foreign key") && !err.message.includes("already exists")) {
      console.error("Failed to add fk_ai_chat_messages_session:", err.message);
    }
  }

  // chat_messages.session_id -> chat_sessions(session_id)
  try {
    await activePool.query(`
      ALTER TABLE chat_messages 
      ADD CONSTRAINT fk_chat_messages_session 
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE;
    `);
  } catch (err: any) {
    if (!err.message.includes("Duplicate key") && !err.message.includes("Duplicate foreign key") && !err.message.includes("already exists")) {
      console.error("Failed to add fk_chat_messages_session:", err.message);
    }
  }

  // customers.session_id -> chat_sessions(session_id)
  try {
    await activePool.query(`
      ALTER TABLE customers 
      ADD CONSTRAINT fk_customers_session 
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE SET NULL;
    `);
  } catch (err: any) {
    if (!err.message.includes("Duplicate key") && !err.message.includes("Duplicate foreign key") && !err.message.includes("already exists")) {
      console.error("Failed to add fk_customers_session:", err.message);
    }
  }

  // 4. Auto-seeding mock data if table is empty
  const [userRows] = await activePool.query("SELECT COUNT(*) as count FROM users;");
  const userCount = (userRows as any)[0]?.count || 0;

  if (userCount === 0) {
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
        "INSERT INTO cars (id, user_id, title, title_vi, brand, model, year, price, mileage, fuel_type, transmission, body_type, color, seats, engine, description, description_vi, city, address, thumbnail, views, status, car_condition, reserved_until, condition_type, origin, interior_color, doors, drivetrain, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [
          carId,
          adminUserUuid,
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

    // C. Seed Customers
    await activePool.query("DELETE FROM customer_notes;");
    await activePool.query("DELETE FROM customers;");

    const seededCustomers: Record<string, string> = {}; // Mapping of name -> customer_id

    const stageMap: Record<string, DbCustomer["stage"]> = {
      "Lead mới": "lead",
      "Đang tư vấn": "contacted",
      "Đặt lịch xem xe": "test_drive",
      "Báo giá": "negotiating",
      "Chăm sóc lại": "contacted",
    };

    for (let i = 0; i < mockCustomers.length; i++) {
      const mc = mockCustomers[i];
      const customerId = crypto.randomUUID();
      seededCustomers[mc.name] = customerId;

      // Find user account if exists (to link user_id)
      const [usrRows] = await activePool.query("SELECT id FROM users WHERE full_name = ? LIMIT 1;", [mc.name]);
      const userId = (usrRows as any[]).length > 0 ? (usrRows as any[])[0].id : null;

      // Find car ID for interested car
      const matchedCar = mockCars.find((c) => c.name.includes(mc.interest));
      const carId = matchedCar ? MOCK_CAR_IDS[matchedCar.id] : null;

      const cleanPhone = mc.phone.replace(/\D/g, "");
      const email = `${cleanPhone}@tqauto.temp`;

      await activePool.query(
        `INSERT INTO customers (id, user_id, full_name, phone, email, interested_car_id, budget, stage, note, assigned_staff_id, source, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'showroom', 'active');`,
        [
          customerId,
          userId,
          mc.name,
          cleanPhone,
          userId ? "customer@example.com" : email, // Map specific email for customer@example.com
          carId,
          mc.budget,
          stageMap[mc.stage] || "lead",
          `Khách hàng quan tâm xe ${mc.interest} với ngân sách ${mc.budget}.`,
        ]
      );
    }

    // D. Seed Appointments
    for (let idx = 0; idx < mockAppointments.length; idx++) {
      const ma = mockAppointments[idx];
      
      // Get the customer ID from seededCustomers, or create a new guest customer if not found
      let customerId = seededCustomers[ma.customer];
      if (!customerId) {
        customerId = crypto.randomUUID();
        const cleanPhone = ma.phone.replace(/\D/g, "");
        await activePool.query(
          "INSERT INTO customers (id, user_id, full_name, phone, email, stage, source, status) VALUES (?, NULL, ?, ?, ?, 'test_drive', 'website', 'active');",
          [customerId, ma.customer, cleanPhone, ma.email]
        );
        seededCustomers[ma.customer] = customerId;
      }
      
      const car = mockCars.find((c) => c.name === ma.car);
      const carId = car ? (MOCK_CAR_IDS[car.id] || MOCK_CAR_IDS["CAR-1024"]) : MOCK_CAR_IDS["CAR-1024"];

      let dbStatus: DbAppointment["status"] = "pending";
      if (ma.status === "Đã xác nhận") dbStatus = "confirmed";

      const appointmentDate = new Date(`${ma.date}T${ma.time}:00`);

      // Find the customer's name/phone/email for the snapshot
      const snapshotName  = ma.customer;
      const snapshotPhone = ma.phone.replace(/\D/g, "");
      const snapshotEmail = ma.email;

      await activePool.query(
        `INSERT INTO appointments
          (id, car_id, customer_id, user_id,
           customer_snapshot_name, customer_snapshot_email, customer_snapshot_phone,
           appointment_date, note, status, created_at)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?);`,
        [
          `a0000000-0000-0000-0000-000000000${100 + idx}`,
          carId,
          customerId,
          snapshotName,
          snapshotEmail,
          snapshotPhone,
          appointmentDate,
          ma.note,
          dbStatus,
          new Date(),
        ]
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
        slug: "honda-civic-rs-2025-review",
        excerpt: "Honda Civic RS 2025 tiếp tục khẳng định vị thế dẫn đầu trong phân khúc sedan hạng C nhờ phong cách thiết kế thể thao đậm chất, gói an toàn Honda SENSING cải tiến và khả năng vận hành hứng khởi vượt trội.",
        excerpt_vi: "Honda Civic RS 2025 tiếp tục khẳng định vị thế dẫn đầu trong phân khúc sedan hạng C nhờ phong cách thiết kế thể thao đậm chất, gói an toàn Honda SENSING cải tiến và khả năng vận hành hứng khởi vượt trội.",
        content: `### 1. Thiết kế ngoại thất đậm chất thể thao\n\nHonda Civic RS 2025 sở hữu diện mạo thể thao và dữ dằn hơn bản tiền nhiệm.\n\nPhần đầu xe nổi bật với lưới tản nhiệt họa tiết tổ ong sơn đen bóng kết hợp cụm đèn pha LED thanh mảnh sắc sảo. Cản trước được tái thiết kế mở rộng hơn giúp tối ưu hóa luồng khí động học và gia tăng vẻ hầm hố cho mẫu xe.\n\nThân xe thon dài mượt mà đi kèm bộ mâm hợp kim sơn đen nhám kích thước 18 inch cá tính. Ở đuôi xe, cánh lướt gió thể thao tích hợp trên nắp cốp cùng cụm ống xả kép mạ chrome tạo nên điểm nhấn khó cưỡng đối với những tín đồ đam mê tốc độ.\n\n### 2. Không gian nội thất hiện đại và cao cấp\n\nBước vào khoang lái, Civic RS 2025 đón chào người dùng bằng một không gian tinh tế và đậm tính công nghệ. Vô-lăng bọc da 3 chấu thể thao với đường chỉ khâu màu đỏ nổi bật. Ghế ngồi thể thao bọc da kết hợp chất liệu da lộn cao cấp mang lại tư thế ngồi chắc chắn, ôm sát lưng người lái.\n\nHệ thống thông tin giải trí nổi bật với màn hình cảm ứng 9 inch hỗ trợ kết nối Apple CarPlay và Android Auto không dây mượt mà. Phía sau vô-lăng là bảng đồng hồ kỹ thuật số toàn phần 10.2 inch hiển thị trực quan và sắc nét các thông số vận hành của xe.\n\n### 3. Vận hành hứng khởi vượt trội\n\nTrái tim của Honda Civic RS 2025 là khối động cơ tăng áp 1.5L DOHC VTEC Turbo quen thuộc, sản sinh công suất cực đại 178 mã lực và mô-men xoắn cực đại 240 Nm. Đi kèm với hộp số tự động vô cấp CVT được tinh chỉnh tỷ số truyền thông minh.\n\nKhả năng vận hành của Civic RS chưa bao giờ làm người hâm mộ thất vọng. Vô-lăng cho phản hồi mặt đường cực tốt, chính xác từng mm. Hệ thống treo được làm cứng cáp hơn giúp xe vững chãi khi ôm cua ở tốc độ cao mà vẫn duy trì được độ êm ái cần có cho hành khách phía sau.\n\n### 4. Công nghệ an toàn Honda SENSING thế hệ mới\n\nKhông chỉ lái hay, Civic RS 2025 còn bảo vệ bạn và gia đình tối đa nhờ gói công nghệ hỗ trợ lái an toàn Honda SENSING với nhiều tính năng nâng cấp đáng giá:\n- Phanh giảm thiểu va chạm (CMBS)\n- Hỗ trợ giữ làn đường (LKAS)\n- Giảm thiểu chệch làn đường (RDM)\n- Kiểm soát hành trình thích ứng bao gồm dải tốc độ thấp (ACC with LSF)\n- Đèn pha thích ứng tự động (AHB)\n- Thông báo xe phía trước khởi hành (LCDN)`,
        content_vi: `### 1. Thiết kế ngoại thất đậm chất thể thao\n\nHonda Civic RS 2025 sở hữu diện mạo thể thao và dữ dằn hơn bản tiền nhiệm.\n\nPhần đầu xe nổi bật với lưới tản nhiệt họa tiết tổ ong sơn đen bóng kết hợp cụm đèn pha LED thanh mảnh sắc sảo. Cản trước được tái thiết kế mở rộng hơn giúp tối ưu hóa luồng khí động học và gia tăng vẻ hầm hố cho mẫu xe.\n\nThân xe thon dài mượt mà đi kèm bộ mâm hợp kim sơn đen nhám kích thước 18 inch cá tính. Ở đuôi xe, cánh lướt gió thể thao tích hợp trên nắp cốp cùng cụm ống xả kép mạ chrome tạo nên điểm nhấn khó cưỡng đối với những tín đồ đam mê tốc độ.\n\n### 2. Không gian nội thất hiện đại và cao cấp\n\nBước vào khoang lái, Civic RS 2025 đón chào người dùng bằng một không gian tinh tế và đậm tính công nghệ. Vô-lăng bọc da 3 chấu thể thao với đường chỉ khâu màu đỏ nổi bật. Ghế ngồi thể thao bọc da kết hợp chất liệu da lộn cao cấp mang lại tư thế ngồi chắc chắn, ôm sát lưng người lái.\n\nHệ thống thông tin giải trí nổi bật với màn hình cảm ứng 9 inch hỗ trợ kết nối Apple CarPlay và Android Auto không dây mượt mà. Phía sau vô-lăng là bảng đồng hồ kỹ thuật số toàn phần 10.2 inch hiển thị trực quan và sắc nét các thông số vận hành của xe.\n\n### 3. Vận hành hứng khởi vượt trội\n\nTrái tim của Honda Civic RS 2025 là khối động cơ tăng áp 1.5L DOHC VTEC Turbo quen thuộc, sản sinh công suất cực đại 178 mã lực và mô-men xoắn cực đại 240 Nm. Đi kèm với hộp số tự động vô cấp CVT được tinh chỉnh tỷ số truyền thông minh.\n\nKhả năng vận hành của Civic RS chưa bao giờ làm người hâm mộ thất vọng. Vô-lăng cho phản hồi mặt đường cực tốt, chính xác từng mm. Hệ thống treo được làm cứng cáp hơn giúp xe vững chãi khi ôm cua ở tốc độ cao mà vẫn duy trì được độ êm ái cần có cho hành khách phía sau.\n\n### 4. Công nghệ an toàn Honda SENSING thế hệ mới\n\nKhông chỉ lái hay, Civic RS 2025 còn bảo vệ bạn và gia đình tối đa nhờ gói công nghệ hỗ trợ lái an toàn Honda SENSING với nhiều tính năng nâng cấp đáng giá:\n- Phanh giảm thiểu va chạm (CMBS)\n- Hỗ trợ giữ làn đường (LKAS)\n- Giảm thiểu chệch làn đường (RDM)\n- Kiểm soát hành trình thích ứng bao gồm dải tốc độ thấp (ACC with LSF)\n- Đèn pha thích ứng tự động (AHB)\n- Thông báo xe phía trước khởi hành (LCDN)`,
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
        slug: "top-suvs-under-1-billion-vnd",
        excerpt: "Với ngân sách khoảng 1 tỷ đồng, người tiêu dùng Việt Nam hiện có rất nhiều sự lựa chọn xe gầm cao chất lượng, từ Mazda CX-5, Hyundai Tucson đến Kia Sportage. Hãy cùng điểm qua những cái tên xuất sắc nhất.",
        excerpt_vi: "Với ngân sách khoảng 1 tỷ đồng, người tiêu dùng Việt Nam hiện có rất nhiều sự lựa chọn xe gầm cao chất lượng, từ Mazda CX-5, Hyundai Tucson đến Kia Sportage. Hãy cùng điểm qua những cái tên xuất sắc nhất.",
        content: `Phân khúc xe gầm cao SUV/Crossover tầm giá 1 tỷ đồng tại Việt Nam luôn là cuộc đua khốc liệt nhất giữa các hãng xe lớn. Dưới đây là top 5 mẫu xe có thiết kế đẹp mắt, trang bị tiện nghi phong phú và độ bền bỉ cao đáng để bạn xuống tiền nhất hiện nay.\n\n### 1. Mazda CX-5 (Giá từ 749 - 979 triệu VNĐ)\n\nKhông quá ngạc nhiên khi Mazda CX-5 tiếp tục giữ ngôi vương về doanh số. Mẫu xe Nhật Bản thuyết phục khách hàng bằng ngôn ngữ thiết kế KODO thanh lịch, sang trọng cùng khoang cabin ngập tràn công nghệ.\n\nXe được trang bị động cơ SkyActiv-G 2.0L hoặc 2.5L cực kỳ tiết kiệm nhiên liệu cùng hệ thống an toàn i-Activesense danh tiếng. Cảm giác lái êm ái cùng dịch vụ hậu mãi tốt khiến CX-5 luôn là lựa chọn an toàn hàng đầu.\n\n### 2. Hyundai Tucson (Giá từ 769 - 919 triệu VNĐ)\n\nĐến từ Hàn Quốc, Tucson thu hút tệp khách hàng trẻ tuổi nhờ ngôn ngữ thiết kế Sensuous Sportiness phá cách và mang hơi thở tương lai. Cụm đèn LED định vị ẩn mình vào lưới tản nhiệt cánh chim cực kỳ độc đáo.\n\nTucson sở hữu chiều dài cơ sở tốt nhất phân khúc, đem lại không gian ngồi cực kỳ rộng rãi cho cả hai hàng ghế. Các tùy chọn động cơ Turbo 1.6L hay động cơ dầu 2.0L mang lại lực kéo mạnh mẽ và cảm giác tăng tốc phấn khích.\n\n### 3. Kia Sportage (Giá từ 779 - 999 triệu VNĐ)\n\nCùng chia sẻ nền tảng khung gầm với Tucson, Kia Sportage khoác lên mình phong cách táo bạo và đậm chất châu Âu. Điểm nhấn bên trong cabin là màn hình cong kép Panoramic nối liền bảng đồng hồ và màn hình giải trí trung tâm.\n\nSportage có nhiều phiên bản phù hợp với đa dạng nhu cầu và phong cách của chủ nhân, từ phiên bản sang trọng Signature đến thể thao cá tính X-Line.\n\n### 4. Ford Territory (Giá từ 799 - 929 triệu VNĐ)\n\nMẫu SUV thế hệ mới của Ford nhanh chóng khẳng định được chỗ đứng nhờ thiết kế bề thế chuẩn Mỹ và độ rộng rãi bậc nhất phân khúc. Territory được trang bị động cơ EcoBoost 1.5L vận hành êm ái và linh hoạt trong đô thị.\n\nGói an toàn Ford Co-Pilot360 hỗ trợ đắc lực cho người lái với các tính năng đỗ xe tự động, cảnh báo chệch làn và phanh tự động khẩn cấp cực nhạy.\n\n### 5. Honda CR-V (Các phiên bản xăng cơ bản dưới 1 tỷ VNĐ)\n\nMặc dù bản Hybrid vượt ngưỡng 1 tỷ đồng, các phiên bản lắp ráp động cơ xăng của Honda CR-V vẫn vô cùng hút khách nhờ cấu hình 5+2 chỗ ngồi linh hoạt, khung gầm đầm chắc và động cơ 1.5L Turbo bền bỉ cực kỳ giữ giá theo thời gian.`,
        content_vi: `Phân khúc xe gầm cao SUV/Crossover tầm giá 1 tỷ đồng tại Việt Nam luôn là cuộc đua khốc liệt nhất giữa các hãng xe lớn. Dưới đây là top 5 mẫu xe có thiết kế đẹp mắt, trang bị tiện nghi phong phú và độ bền bỉ cao đáng để bạn xuống tiền nhất hiện nay.\n\n### 1. Mazda CX-5 (Giá từ 749 - 979 triệu VNĐ)\n\nKhông quá ngạc nhiên khi Mazda CX-5 tiếp tục giữ ngôi vương về doanh số. Mẫu xe Nhật Bản thuyết phục khách hàng bằng ngôn ngữ thiết kế KODO thanh lịch, sang trọng cùng khoang cabin ngập tràn công nghệ.\n\nXe được trang bị động cơ SkyActiv-G 2.0L hoặc 2.5L cực kỳ tiết kiệm nhiên liệu cùng hệ thống an toàn i-Activesense danh tiếng. Cảm giác lái êm ái cùng dịch vụ hậu mãi tốt khiến CX-5 luôn là lựa chọn an toàn hàng đầu.\n\n### 2. Hyundai Tucson (Giá từ 769 - 919 triệu VNĐ)\n\nĐến từ Hàn Quốc, Tucson thu hút tệp khách hàng trẻ tuổi nhờ ngôn ngữ thiết kế Sensuous Sportiness phá cách và mang hơi thở tương lai. Cụm đèn LED định vị ẩn mình vào lưới tản nhiệt cánh chim cực kỳ độc đáo.\n\nTucson sở hữu chiều dài cơ sở tốt nhất phân khúc, đem lại không gian ngồi cực kỳ rộng rãi cho cả hai hàng ghế. Các tùy chọn động cơ Turbo 1.6L hay động cơ dầu 2.0L mang lại lực kéo mạnh mẽ và cảm giác tăng tốc phấn khích.\n\n### 3. Kia Sportage (Giá từ 779 - 999 triệu VNĐ)\n\nCùng chia sẻ nền tảng khung gầm với Tucson, Kia Sportage khoác lên mình phong cách táo bạo và đậm chất châu Âu. Điểm nhấn bên trong cabin là màn hình cong kép Panoramic nối liền bảng đồng hồ và màn hình giải trí trung tâm.\n\nSportage có nhiều phiên bản phù hợp với đa dạng nhu cầu và phong cách của chủ nhân, từ phiên bản sang trọng Signature đến thể thao cá tính X-Line.\n\n### 4. Ford Territory (Giá từ 799 - 929 triệu VNĐ)\n\nMẫu SUV thế hệ mới của Ford nhanh chóng khẳng định được chỗ đứng nhờ thiết kế bề thế chuẩn Mỹ và độ rộng rãi bậc nhất phân khúc. Territory được trang bị động cơ EcoBoost 1.5L vận hành êm ái và linh hoạt trong đô thị.\n\nGói an toàn Ford Co-Pilot360 hỗ trợ đắc lực cho người lái với các tính năng đỗ xe tự động, cảnh báo chệch làn và phanh tự động khẩn cấp cực nhạy.\n\n### 5. Honda CR-V (Các phiên bản xăng cơ bản dưới 1 tỷ VNĐ)\n\nMặc dù bản Hybrid vượt ngưỡng 1 tỷ đồng, các phiên bản lắp ráp động cơ xăng của Honda CR-V vẫn vô cùng hút khách nhờ cấu hình 5+2 chỗ ngồi linh hoạt, khung gầm đầm chắc và động cơ 1.5L Turbo bền bỉ cực kỳ giữ giá theo thời gian.`,
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
        slug: "experience-buying-used-cars",
        excerpt: "Mua xe ô tô cũ giúp tiết kiệm chi phí nhưng cũng ẩn chứa nhiều rủi ro. Bài viết chia sẻ những kinh nghiệm thực tế giúp bạn nhận biết xe tai nạn, thủy kích và định giá xe cũ chính xác nhất.",
        excerpt_vi: "Mua xe ô tô cũ giúp tiết kiệm chi phí nhưng cũng ẩn chứa nhiều rủi ro. Bài viết chia sẻ những kinh nghiệm thực tế giúp bạn nhận biết xe tai nạn, thủy kích và định giá xe cũ chính xác nhất.",
        content: `Việc sở hữu một chiếc ô tô qua sử dụng giúp người mua tiết kiệm được từ vài chục đến hàng trăm triệu đồng tiền thuế phí so với xe mới. Tuy nhiên, nếu không có kinh nghiệm, bạn rất dễ mua phải những chiếc xe bị tai nạn đâm đụng nặng hoặc từng ngập nước thủy kích. Dưới đây là những kinh nghiệm thực tế tích lũy từ các chuyên gia kỹ thuật hàng đầu.\n\n### 1. Kiểm tra kỹ keo chỉ, ốc vít nắp capo và các khớp nối\n\nMột chiếc xe nguyên bản sẽ có phần keo chỉ (chỉ viền chạy quanh các mép cửa, nắp capo, cốp xe) thẳng đều, mềm mại và không bị nứt vỡ hay chắp vá. Nếu thấy keo chỉ bị mất, đứt đoạn hoặc có dấu hiệu chạy lại bằng tay (cứng hoặc không đều), khả năng cao phần thân vỏ đó đã bị đâm đụng và gò nắn lại.\n\nHãy nhìn vào ốc vít nắp capo, ốc cánh cửa và tai xe. Nếu sơn trên ốc bị xước hoặc có vết cờ-lê vặn mở, chứng tỏ các bộ phận này đã từng bị tháo ra để sửa chữa hoặc thay thế sau va chạm.\n\n### 2. Dấu hiệu nhận biết xe bị thủy kích (ngập nước)\n\nThủy kích là cơn ác mộng lớn nhất của động cơ ô tô. Để phát hiện xe từng lội nước, hãy chú ý:\n- **Mùi ẩm mốc đặc trưng:** Xe ngập nước thường có mùi bùn đất ẩm mốc ẩn bên trong các lớp nỉ sàn và đệm ghế. Dù có dọn nội thất kỹ thế nào thì mùi hôi này vẫn rất khó bay sạch hoàn toàn.\n- **Gỉ sét dưới gầm và bu-lông ghế:** Kiểm tra các con ốc dưới chân ghế, đầu cắm dây đai an toàn. Nếu các chi tiết này có dấu hiệu ố gỉ hay bám cát mịn, chắc chắn nước đã từng tràn vào cabin.\n- **Hệ thống điện chập chờn:** Kiểm tra hoạt động của bảng đồng hồ, hệ thống âm thanh, điều hòa, nâng hạ kính. Xe ngập nước thường bị hỏng hộp đen hoặc chập mạch đường dây điện chạy dọc thân xe.\n\n### 3. Kiểm tra số ODO thực tế của xe\n\nViệc tua đồng hồ công-tơ-mét (ODO) cực kỳ phổ biến hiện nay. Bạn đừng chỉ tin vào con số hiển thị trên màn hình. Hãy đánh giá độ hao mòn cơ học của xe qua:\n- **Độ mòn vô-lăng, cần số và bàn đạp chân phanh/ga:** Những xe chạy nhiều vô-lăng sẽ bị bóng, mòn da; cần số lỏng lênh; cao su bàn đạp phanh bị vẹt góc.\n- **Tình trạng nệm ghế lái:** Ghế lái xẹp lép, nứt da hoặc nhăn nhúm nhiều thường là xe đã chạy trên 100.000 km.\n- **Lịch sử bảo dưỡng tại hãng:** Hãy yêu cầu chủ xe cung cấp sổ bảo dưỡng định kỳ hoặc cùng mang xe ra đại lý chính hãng để check lịch sử bảo dưỡng gần nhất.`,
        content_vi: `Việc sở hữu một chiếc ô tô qua sử dụng giúp người mua tiết kiệm được từ vài chục đến hàng trăm triệu đồng tiền thuế phí so với xe mới. Tuy nhiên, nếu không có kinh nghiệm, bạn rất dễ mua phải những chiếc xe bị tai nạn đâm đụng nặng hoặc từng ngập nước thủy kích. Dưới đây là những kinh nghiệm thực tế tích lũy từ các chuyên gia kỹ thuật hàng đầu.\n\n### 1. Kiểm tra kỹ keo chỉ, ốc vít nắp capo và các khớp nối\n\nMột chiếc xe nguyên bản sẽ có phần keo chỉ (chỉ viền chạy quanh các mép cửa, nắp capo, cốp xe) thẳng đều, mềm mại và không bị nứt vỡ hay chắp vá. Nếu thấy keo chỉ bị mất, đứt đoạn hoặc có dấu hiệu chạy lại bằng tay (cứng hoặc không đều), khả năng cao phần thân vỏ đó đã bị đâm đụng và gò nắn lại.\n\nHãy nhìn vào ốc vít nắp capo, ốc cánh cửa và tai xe. Nếu sơn trên ốc bị xước hoặc có vết cờ-lê vặn mở, chứng tỏ các bộ phận này đã từng bị tháo ra để sửa chữa hoặc thay thế sau va chạm.\n\n### 2. Dấu hiệu nhận biết xe bị thủy kích (ngập nước)\n\nThủy kích là cơn ác mộng lớn nhất của động cơ ô tô. Để phát hiện xe từng lội nước, hãy chú ý:\n- **Mùi ẩm mốc đặc trưng:** Xe ngập nước thường có mùi bùn đất ẩm mốc ẩn bên trong các lớp nỉ sàn và đệm ghế. Dù có dọn nội thất kỹ thế nào thì mùi hôi này vẫn rất khó bay sạch hoàn toàn.\n- **Gỉ sét dưới gầm và bu-lông ghế:** Kiểm tra các con ốc dưới chân ghế, đầu cắm dây đai an toàn. Nếu các chi tiết này có dấu hiệu ố gỉ hay bám cát mịn, chắc chắn nước đã từng tràn vào cabin.\n- **Hệ thống điện chập chờn:** Kiểm tra hoạt động của bảng đồng hồ, hệ thống âm thanh, điều hòa, nâng hạ kính. Xe ngập nước thường bị hỏng hộp đen hoặc chập mạch đường dây điện chạy dọc thân xe.\n\n### 3. Kiểm tra số ODO thực tế của xe\n\nViệc tua đồng hồ công-tơ-mét (ODO) cực kỳ phổ biến hiện nay. Bạn đừng chỉ tin vào con số hiển thị trên màn hình. Hãy đánh giá độ hao mòn cơ học của xe qua:\n- **Độ mòn vô-lăng, cần số và bàn đạp chân phanh/ga:** Những xe chạy nhiều vô-lăng sẽ bị bóng, mòn da; cần số lỏng lênh; cao su bàn đạp phanh bị vẹt góc.\n- **Tình trạng nệm ghế lái:** Ghế lái xẹp lép, nứt da hoặc nhăn nhúm nhiều thường là xe đã chạy trên 100.000 km.\n- **Lịch sử bảo dưỡng tại hãng:** Hãy yêu cầu chủ xe cung cấp sổ bảo dưỡng định kỳ hoặc cùng mang xe ra đại lý chính hãng để check lịch sử bảo dưỡng gần nhất.`,
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
        slug: "how-to-check-used-car-condition",
        excerpt: "Không cần là chuyên gia, bạn vẫn có thể tự mình đánh giá sơ bộ tình trạng của một chiếc ô tô cũ thông qua quy trình kiểm tra ngoại thất, nội thất, khoang máy và lái thử thực tế dưới đây.",
        excerpt_vi: "Không cần là chuyên gia, bạn vẫn có thể tự mình đánh giá sơ bộ tình trạng của một chiếc ô tô cũ thông qua quy trình kiểm tra ngoại thất, nội thất, khoang máy và lái thử thực tế dưới đây.",
        content: `Đi xem xe cũ là một nghệ thuật và người mua cần giữ sự tỉnh táo trước những lời mật ngọt của người bán. Nếu bạn chuẩn bị đi xem một chiếc ô tô cũ, hãy áp dụng ngay quy trình 5 bước tự kiểm tra chi tiết dưới đây để nắm thế chủ động.\n\n### Bước 1: Kiểm tra ngoại thất dưới ánh sáng mặt trời\n\nLuôn đi xem xe vào ban ngày và ở những nơi rộng rãi, đầy đủ ánh sáng. Tránh xem xe khi trời mưa hoặc dưới ánh đèn mờ ảo của hầm gửi xe.\n- Quan sát dọc theo thân xe để xem màu sơn có đồng đều không. Nếu có những vùng màu sơn sáng hơn hoặc tối hơn các khu vực lân cận, xe đã từng được sơn dặm vá lại.\n- Kiểm tra các khe hở giữa các mảng thân xe (giữa cửa xe và thân xe, nắp capo và tai xe). Chúng phải thẳng hàng và có độ rộng bằng nhau. Khe hở lệch lạc là biểu hiện của xe bị biến dạng khung gầm do va chạm.\n\n### Bước 2: Khảo sát chi tiết khoang động cơ\n\nKhoang động cơ chính là "trái tim" của chiếc xe. Mở nắp capo và quan sát:\n- Bề mặt động cơ phải khô ráo, không có dầu mỡ rò rỉ xung quanh gioăng nắp máy.\n- Kiểm tra màu sắc và mức dầu máy. Dầu máy quá đen và đặc chứng tỏ chủ cũ lười bảo dưỡng thay dầu.\n- Hãy nhìn vào các ống dẫn cao su và dây điện. Chúng không được nứt nẻ, mục nát hay quấn băng keo chằng chit thiếu thẩm mỹ.\n\n### Bước 3: Đánh giá nội thất và các tính năng cabin\n\nBước vào trong xe và kiểm tra tất cả các thiết bị điện tử:\n- Bật điều hòa hết cỡ, kiểm tra xem luồng gió thổi ra có mát sâu và không có mùi lạ hay không.\n- Thử nghiệm hệ thống loa, màn hình cảm ứng giải trí, camera lùi và cảm biến xung quanh xe.\n- Kiểm tra hoạt động của cửa sổ trời (nếu có), nâng hạ kính của tất cả các cửa xe và chốt khóa an toàn.\n\n### Bước 4: Khởi động động cơ và lắng nghe âm thanh\n\nKhởi động máy khi động cơ còn nguội (chưa được chạy trước đó):\n- Động cơ hoạt động tốt sẽ khởi động dễ dàng, vòng tua máy nhanh chóng ổn định ở mức 700 - 800 vòng/phút ở chế độ không tải.\n- Lắng nghe xem có tiếng gõ kim loại, tiếng rít từ dây curoa hay những âm thanh bất thường nào phát ra từ dưới nắp capo hay không.\n\n### Bước 5: Lái thử thực tế trên nhiều địa hình\n\nĐây là bước quan trọng nhất quyết định bạn có nên mua xe hay không. Lái xe ít nhất 15-20 phút:\n- **Thử nghiệm hộp số:** Chuyển số phải mượt mà, không bị giật hay có độ trễ lớn khi tăng tốc.\n- **Kiểm tra hệ thống treo:** Đi qua những đoạn đường gồ ghề xem giảm xóc có êm không, có tiếng kêu lục cục dưới gầm xe không.\n- **Kiểm tra phanh:** Phanh gấp ở tốc độ trung bình xem xe có bị lệch lái hay có tiếng rít phanh phát ra không. Cảm giác chân phanh phải chắc chắn, không bị võng hay quá cứng.`,
        content_vi: `Đi xem xe cũ là một nghệ thuật và người mua cần giữ sự tỉnh táo trước những lời mật ngọt của người bán. Nếu bạn chuẩn bị đi xem một chiếc ô tô cũ, hãy áp dụng ngay quy trình 5 bước tự kiểm tra chi tiết dưới đây để nắm thế chủ động.\n\n### Bước 1: Kiểm tra ngoại thất dưới ánh sáng mặt trời\n\nLuôn đi xem xe vào ban ngày và ở những nơi rộng rãi, đầy đủ ánh sáng. Tránh xem xe khi trời mưa hoặc dưới ánh đèn mờ ảo của hầm gửi xe.\n- Quan sát dọc theo thân xe để xem màu sơn có đồng đều không. Nếu có những vùng màu sơn sáng hơn hoặc tối hơn các khu vực lân cận, xe đã từng được sơn dặm vá lại.\n- Kiểm tra các khe hở giữa các mảng thân xe (giữa cửa xe và thân xe, nắp capo và tai xe). Chúng phải thẳng hàng và có độ rộng bằng nhau. Khe hở lệch lạc là biểu hiện của xe bị biến dạng khung gầm do va chạm.\n\n### Bước 2: Khảo sát chi tiết khoang động cơ\n\nKhoang động cơ chính là "trái tim" của chiếc xe. Mở nắp capo và quan sát:\n- Bề mặt động cơ phải khô ráo, không có dầu mỡ rò rỉ xung quanh gioăng nắp máy.\n- Kiểm tra màu sắc và mức dầu máy. Dầu máy quá đen và đặc chứng tỏ chủ cũ lười bảo dưỡng thay dầu.\n- Hãy nhìn vào các ống dẫn cao su và dây điện. Chúng không được nứt nẻ, mục nát hay quấn băng keo chằng chit thiếu thẩm mỹ.\n\n### Bước 3: Đánh giá nội thất và các tính năng cabin\n\nBước vào trong xe và kiểm tra tất cả các thiết bị điện tử:\n- Bật điều hòa hết cỡ, kiểm tra xem luồng gió thổi ra có mát sâu và không có mùi lạ hay không.\n- Thử nghiệm hệ thống loa, màn hình cảm ứng giải trí, camera lùi và cảm biến xung quanh xe.\n- Kiểm tra hoạt động của cửa sổ trời (nếu có), nâng hạ kính của tất cả các cửa xe và chốt khóa an toàn.\n\n### Bước 4: Khởi động động cơ và lắng nghe âm thanh\n\nKhởi động máy khi động cơ còn nguội (chưa được chạy trước đó):\n- Động cơ hoạt động tốt sẽ khởi động dễ dàng, vòng tua máy nhanh chóng ổn định ở mức 700 - 800 vòng/phút ở chế độ không tải.\n- Lắng nghe xem có tiếng gõ kim loại, tiếng rít từ dây curoa hay những âm thanh bất thường nào phát ra từ dưới nắp capo hay không.\n\n### Bước 5: Lái thử thực tế trên nhiều địa hình\n\nĐây là bước quan trọng nhất quyết định bạn có nên mua xe hay không. Lái xe ít nhất 15-20 phút:\n- **Thử nghiệm hộp số:** Chuyển số phải mượt mà, không bị giật hay có độ trễ lớn khi tăng tốc.\n- **Kiểm tra hệ thống treo:** Đi qua những đoạn đường gồ ghề xem giảm xóc có êm không, có tiếng kêu lục cục dưới gầm xe không.\n- **Kiểm tra phanh:** Phanh gấp ở tốc độ trung bình xem xe có bị lệch lái hay có tiếng rít phanh phát ra không. Cảm giác chân phanh phải chắc chắn, không bị võng hay quá cứng.`,
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
        slug: "best-sedan-cars-for-families",
        excerpt: "Dòng xe Sedan truyền thống vẫn giữ vị thế nhờ kiểu dáng sang trọng, khả năng cách âm tốt và cảm giác êm ái cho người ngồi sau. Dưới đây là những gợi ý xe Sedan gia đình lý tưởng nhất.",
        excerpt_vi: "Dòng xe Sedan truyền thống vẫn giữ vị thế nhờ kiểu dáng sang trọng, khả năng cách âm tốt và cảm giác êm ái cho người ngồi sau. Dưới đây là những gợi ý xe Sedan gia đình lý tưởng nhất.",
        content: `Mặc dù trào lưu xe gầm cao đang nở rộ, những mẫu xe sedan truyền thống vẫn giữ một chỗ đứng vững chắc nhờ ưu thế gầm thấp trọng tâm thấp giúp xe vận hành đầm chắc khi đi cao tốc, khả năng cách âm vượt trội cùng thiết kế lịch lãm tinh tế phù hợp cả công việc lẫn phục vụ gia đình. Dưới đây là những lựa chọn Sedan gia đình xuất sắc nhất phân khúc.\n\n### 1. Toyota Camry (Phân khúc D - Sang trọng đẳng cấp)\n\nĐược mệnh danh là "vua phân khúc" sedan cỡ trung tại Việt Nam, Toyota Camry tiếp tục nâng tầm với triết lý thiết kế trẻ trung hơn cùng nền tảng khung gầm TNGA toàn cầu vận hành đầm chắc bất ngờ.\n\nKhông gian hàng ghế thứ hai của Camry rộng rãi nhất phân khúc, đi kèm bệ tỳ tay tích hợp bảng điều khiển cảm ứng ngả ghế cực kỳ xịn sò. Độ bền bỉ, tiết kiệm xăng cùng khả năng giữ giá vô địch khiến Camry luôn là lựa chọn ưu tiên của các gia đình khá giả.\n\n### 2. Honda Accord (Phân khúc D - Trải nghiệm lái phấn khích)\n\nNếu bạn là người thích cầm lái nhưng vẫn muốn một chiếc xe đủ rộng cho cả nhà, Honda Accord là câu trả lời tuyệt vời. Sở hữu khối động cơ VTEC Turbo 1.5L mạnh mẽ kết hợp cùng hộp số vô cấp CVT tinh chỉnh thể thao.\n\nKhung gầm Accord đầm chắc, vô-lăng phản hồi sắc nét mang lại trải nghiệm lái đậm chất thể thao mà hiếm mẫu xe đối thủ nào trong tầm giá làm được. Thiết kế Coupe thể thao vuốt đều về phía đuôi giúp xe trông rất thời trang.\n\n### 3. Mazda 6 (Phân khúc D - Đầy ắp công nghệ tầm giá hời)\n\nMazda 6 sở hữu mức giá cực kỳ cạnh tranh, ngang ngửa nhiều mẫu xe hạng C nhưng mang lại trải nghiệm tiệm cận xe sang. Thiết kế KODO tinh tế với những đường nét uyển chuyển quyến rũ.\n\nKhông gian nội thất bọc da Nappa cao cấp sang trọng, đi kèm các trang bị tiện nghi đỉnh cao như hiển thị thông tin kính lái HUD, phanh tay điện tử tích hợp giữ phanh tự động và dàn âm thanh 11 loa Bose sống động mang lại trải nghiệm thư giãn tuyệt đối cho gia đình trên những chuyến hành trình dài.`,
        content_vi: `Mặc dù trào lưu xe gầm cao đang nở rộ, những mẫu xe sedan truyền thống vẫn giữ một chỗ đứng vững chắc nhờ ưu thế gầm thấp trọng tâm thấp giúp xe vận hành đầm chắc khi đi cao tốc, khả năng cách âm vượt trội cùng thiết kế lịch lãm tinh tế phù hợp cả công việc lẫn phục vụ gia đình. Dưới đây là những lựa chọn Sedan gia đình xuất sắc nhất phân khúc.\n\n### 1. Toyota Camry (Phân khúc D - Sang trọng đẳng cấp)\n\nĐược mệnh danh là "vua phân khúc" sedan cỡ trung tại Việt Nam, Toyota Camry tiếp tục nâng tầm với triết lý thiết kế trẻ trung hơn cùng nền tảng khung gầm TNGA toàn cầu vận hành đầm chắc bất ngờ.\n\nKhông gian hàng ghế thứ hai của Camry rộng rãi nhất phân khúc, đi kèm bệ tỳ tay tích hợp bảng điều khiển cảm ứng ngả ghế cực kỳ xịn sò. Độ bền bỉ, tiết kiệm xăng cùng khả năng giữ giá vô địch khiến Camry luôn là lựa chọn ưu tiên của các gia đình khá giả.\n\n### 2. Honda Accord (Phân khúc D - Trải nghiệm lái phấn khích)\n\nNếu bạn là người thích cầm lái nhưng vẫn muốn một chiếc xe đủ rộng cho cả nhà, Honda Accord là câu trả lời tuyệt vời. Sở hữu khối động cơ VTEC Turbo 1.5L mạnh mẽ kết hợp cùng hộp số vô cấp CVT tinh chỉnh thể thao.\n\nKhung gầm Accord đầm chắc, vô-lăng phản hồi sắc nét mang lại trải nghiệm lái đậm chất thể thao mà hiếm mẫu xe đối thủ nào trong tầm giá làm được. Thiết kế Coupe thể thao vuốt đều về phía đuôi giúp xe trông rất thời trang.\n\n### 3. Mazda 6 (Phân khúc D - Đầy ắp công nghệ tầm giá hời)\n\nMazda 6 sở hữu mức giá cực kỳ cạnh tranh, ngang ngửa nhiều mẫu xe hạng C nhưng mang lại trải nghiệm tiệm cận xe sang. Thiết kế KODO tinh tế với những đường nét uyển chuyển quyến rũ.\n\nKhông gian nội thất bọc da Nappa cao cấp sang trọng, đi kèm các trang bị tiện nghi đỉnh cao như hiển thị thông tin kính lái HUD, phanh tay điện tử tích hợp giữ phanh tự động và dàn âm thanh 11 loa Bose sống động mang lại trải nghiệm thư giãn tuyệt đối cho gia đình trên những chuyến hành trình dài.`,
        thumbnail: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
        category: "Tư vấn mua xe",
        author: "Trần Quốc Huy",
        featured: 0,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Đánh giá xe điện BYD Atto 3: Làn gió mới cho phân khúc SUV cỡ B+ tại Việt Nam",
        title_vi: "Đánh giá xe điện BYD Atto 3: Làn gió mới cho phân khúc SUV cỡ B+ tại Việt Nam",
        slug: "danh-gia-xe-dien-byd-atto-3",
        excerpt: "BYD Atto 3 chính thức gia nhập thị trường Việt Nam mang theo công nghệ pin lưỡi dao Blade Battery siêu an toàn và ngôn ngữ thiết kế độc đáo Dragon Face. Liệu đây có phải là lựa chọn xe điện đô thị tối ưu?",
        excerpt_vi: "BYD Atto 3 chính thức gia nhập thị trường Việt Nam mang theo công nghệ pin lưỡi dao Blade Battery siêu an toàn và ngôn ngữ thiết kế độc đáo Dragon Face. Liệu đây có phải là lựa chọn xe điện đô thị tối ưu?",
        content: `### 1. Thiết kế ngoại thất Dragon Face 3.0 tinh tế\n\nBYD Atto 3 sở hữu diện mạo hiện đại với ngôn ngữ thiết kế Dragon Face đặc trưng của thương hiệu. Phần đầu xe không sử dụng lưới tản nhiệt truyền thống mà thay bằng tấm ốp mạ chrome sáng bóng khắc logo BYD sắc nét. Cụm đèn pha LED pha lê sắc sảo kết hợp dải LED định vị ban ngày kéo dài tạo hiệu ứng thị giác ấn tượng vào ban đêm.\n\nThân xe nổi bật với các đường gân dập nổi mạnh mẽ, mâm hợp kim 18 inch phối hai màu thể thao và cột C được ốp tấm trang trí gợn sóng độc đáo. Đuôi xe thiết kế liền mạch với cụm đèn hậu LED vắt ngang thời thượng và cánh lướt gió thể thao tích hợp đèn phanh trên cao.\n\n### 2. Không gian cabin đầy cảm hứng thể thao âm nhạc\n\nNội thất BYD Atto 3 mang phong cách phóng khoáng và độc lạ, lấy cảm hứng từ các dụng cụ phòng tập gym và nhạc cụ:\n- **Màn hình xoay độc quyền:** Màn hình giải trí trung tâm 12.8 inch có khả năng xoay 90 độ (ngang/dọc) linh hoạt bằng nút bấm, hỗ trợ Apple CarPlay và Android Auto mượt mà.\n- **Chi tiết độc đáo:** Cửa gió điều hòa hình đĩa tạ, cần số mô phỏng tay đẩy máy bay và tay nắm cửa dạng tạ xoay độc đáo.\n- **Sợi dây đàn guitar:** Ở các hộc để đồ trên cánh cửa, xe trang bị 3 sợi dây đàn đàn hồi có thể gảy ra âm thanh, giúp giữ vật dụng chắc chắn và tăng tính thú vị cho không gian nội thất.\n\n### 3. Công nghệ pin Blade Battery siêu an toàn và vận hành\n\nBYD Atto 3 được trang bị khối động cơ điện đặt ở cầu trước, sản sinh công suất 201 mã lực và mô-men xoắn 310 Nm, cho khả năng tăng tốc từ 0-100 km/h chỉ trong 7.3 giây.\n\nTrọng tâm vận hành của Atto 3 là khối pin Blade Battery độc quyền sử dụng công nghệ LFP (Lithium Iron Phosphate). Pin dạng lưỡi dao này đã vượt qua bài kiểm tra đâm xuyên nghiêm ngặt nhất mà không hề bị bốc cháy hay phát nổ. Xe có quãng đường di chuyển lên tới 480 km (theo chuẩn NEDC) sau một lần sạc đầy, đáp ứng thoải mái nhu cầu di chuyển trong tuần của các gia đình đô thị.`,
        content_vi: `### 1. Thiết kế ngoại thất Dragon Face 3.0 tinh tế\n\nBYD Atto 3 sở hữu diện mạo hiện đại với ngôn ngữ thiết kế Dragon Face đặc trưng của thương hiệu. Phần đầu xe không sử dụng lưới tản nhiệt truyền thống mà thay bằng tấm ốp mạ chrome sáng bóng khắc logo BYD sắc nét. Cụm đèn pha LED pha lê sắc sảo kết hợp dải LED định vị ban ngày kéo dài tạo hiệu ứng thị giác ấn tượng vào ban đêm.\n\nThân xe nổi bật với các đường gân dập nổi mạnh mẽ, mâm hợp kim 18 inch phối hai màu thể thao và cột C được ốp tấm trang trí gợn sóng độc đáo. Đuôi xe thiết kế liền mạch với cụm đèn hậu LED vắt ngang thời thượng và cánh lướt gió thể thao tích hợp đèn phanh trên cao.\n\n### 2. Không gian cabin đầy cảm hứng thể thao âm nhạc\n\nNội thất BYD Atto 3 mang phong cách phóng khoáng và độc lạ, lấy cảm hứng từ các dụng cụ phòng tập gym và nhạc cụ:\n- **Màn hình xoay độc quyền:** Màn hình giải trí trung tâm 12.8 inch có khả năng xoay 90 độ (ngang/dọc) linh hoạt bằng nút bấm, hỗ trợ Apple CarPlay và Android Auto mượt mà.\n- **Chi tiết độc đáo:** Cửa gió điều hòa hình đĩa tạ, cần số mô phỏng tay đẩy máy bay và tay nắm cửa dạng tạ xoay độc đáo.\n- **Sợi dây đàn guitar:** Ở các hộc để đồ trên cánh cửa, xe trang bị 3 sợi dây đàn đàn hồi có thể gảy ra âm thanh, giúp giữ vật dụng chắc chắn và tăng tính thú vị cho không gian nội thất.\n\n### 3. Công nghệ pin Blade Battery siêu an toàn và vận hành\n\nBYD Atto 3 được trang bị khối động cơ điện đặt ở cầu trước, sản sinh công suất 201 mã lực và mô-men xoắn 310 Nm, cho khả năng tăng tốc từ 0-100 km/h chỉ trong 7.3 giây.\n\nTrọng tâm vận hành của Atto 3 là khối pin Blade Battery độc quyền sử dụng công nghệ LFP (Lithium Iron Phosphate). Pin dạng lưỡi dao này đã vượt qua bài kiểm tra đâm xuyên nghiêm ngặt nhất mà không hề bị bốc cháy hay phát nổ. Xe có quãng đường di chuyển lên tới 480 km (theo chuẩn NEDC) sau một lần sạc đầy, đáp ứng thoải mái nhu cầu di chuyển trong tuần của các gia dịch đô thị.`,
        thumbnail: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
        category: "Đánh giá",
        author: "Quản trị viên",
        featured: 0,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Kỹ năng lái xe ô tô an toàn qua vùng ngập nước: Những quy tắc vàng tránh thủy kích",
        title_vi: "Kỹ năng lái xe ô tô an toàn qua vùng ngập nước: Những quy tắc vàng tránh thủy kích",
        slug: "ky-nang-lai-xe-an-toan-qua-vung-ngap-nuoc",
        excerpt: "Mùa mưa bão ngập lụt luôn là nỗi ám ảnh đối với các tài xế. Việc trang bị kiến thức lái xe qua vùng ngập nước dưới đây sẽ giúp bảo vệ chiếc xe của bạn khỏi nguy cơ thủy kích tốn hàng trăm triệu đồng sửa chữa.",
        excerpt_vi: "Mùa mưa bão ngập lụt luôn là nỗi ám ảnh đối với các tài xế. Việc trang bị kiến thức lái xe qua vùng ngập nước dưới đây sẽ giúp bảo vệ chiếc xe của bạn khỏi nguy cơ thủy kích tốn hàng trăm triệu đồng sửa chữa.",
        content: `### 1. Đánh giá độ sâu của vũng ngập trước khi đi qua\n\nKhi đối mặt với đoạn đường ngập nước, quy tắc đầu tiên là không được nôn nóng. Hãy dừng xe lại quan sát các phương tiện đi trước:\n- Nếu nước ngập quá nửa bánh xe (hoặc vượt quá mép dưới ba-đờ-sốc đối với xe sedan), tuyệt đối không cố vượt qua.\n- Với các xe gầm cao SUV/Bán tải, giới hạn lội nước thông thường từ 500mm đến 800mm, tuy nhiên vẫn cần hết sức cẩn trọng để đề phòng ổ gà lớn ẩn dưới làn nước đục.\n\n### 2. Tắt hệ thống điều hòa (AC) và các thiết bị điện không cần thiết\n\nTrước khi đi vào vùng ngập, hãy nhấn nút tắt điều hòa. Việc này giúp giảm tải cho động cơ và ngăn cánh quạt két nước hoạt động. Nếu quạt hoạt động trong nước, cánh quạt nhựa rất dễ bị gãy do sức cản nước, làm rách két nước hoặc cuốn nước sâu hơn vào khoang máy.\n\n### 3. Chọn số thấp và duy trì đều ga\n- **Xe số sàn:** Về số 1 hoặc số 2, duy trì chân ga đều đặn, không tăng ga đột ngột và tuyệt đối không cắt côn giữa chừng.\n- **Xe số tự động:** Chuyển sang chế độ bán tự động (M hoặc S) và chọn cấp số 1 hoặc số 2. Đi chậm rãi để tránh tạo ra làn sóng nước lớn tràn lên nắp capo đi thẳng vào cổ hút gió của động cơ.\n\n### 4. Xử lý thông minh khi xe bị chết máy giữa vùng ngập\n\nNếu xe không may bị tắt máy giữa vũng nước sâu:\n- **TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỀ NỔ LẠI MÁY.** Đây là lỗi phổ biến nhất dẫn đến hiện tượng thủy kích. Khi động cơ tắt máy trong nước, nước có thể đã lọt vào buồng đốt qua đường hút hoặc đường xả. Việc đề nổ lại sẽ khiến piston đẩy nước lên nhưng nước không nén được, dẫn đến cong/gãy tay biên, thậm chí vỡ lốc máy.\n- Hãy rút chìa khóa, chuyển cần số về N để có thể đẩy xe vào lề đường cao ráo hơn và gọi ngay cứu hộ chuyên nghiệp kéo xe về garage để kiểm tra.`,
        content_vi: `### 1. Đánh giá độ sâu của vũng ngập trước khi đi qua\n\nKhi đối mặt với đoạn đường ngập nước, quy tắc đầu tiên là không được nôn nóng. Hãy dừng xe lại quan sát các phương tiện đi trước:\n- Nếu nước ngập quá nửa bánh xe (hoặc vượt quá mép dưới ba-đờ-sốc đối với xe sedan), tuyệt đối không cố vượt qua.\n- Với các xe gầm cao SUV/Bán tải, giới hạn lội nước thông thường từ 500mm đến 800mm, tuy nhiên vẫn cần hết sức cẩn trọng để đề phòng ổ gà lớn ẩn dưới làn nước đục.\n\n### 2. Tắt hệ thống điều hòa (AC) và các thiết bị điện không cần thiết\n\nTrước khi đi vào vùng ngập, hãy nhấn nút tắt điều hòa. Việc này giúp giảm tải cho động cơ và ngăn cánh quạt két nước hoạt động. Nếu quạt hoạt động trong nước, cánh quạt nhựa rất dễ bị gãy do sức cản nước, làm rách két nước hoặc cuốn nước sâu hơn vào khoang máy.\n\n### 3. Chọn số thấp và duy trì đều ga\n- **Xe số sàn:** Về số 1 hoặc số 2, duy trì chân ga đều đặn, không tăng ga đột ngột và tuyệt đối không cắt côn giữa chừng.\n- **Xe số tự động:** Chuyển sang chế độ bán tự động (M hoặc S) và chọn cấp số 1 hoặc số 2. Đi chậm rãi để tránh tạo ra làn sóng nước lớn tràn lên nắp capo đi thẳng vào cổ hút gió của động cơ.\n\n### 4. Xử lý thông minh khi xe bị chết máy giữa vùng ngập\n\nNếu xe không may bị tắt máy giữa vũng nước sâu:\n- **TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỀ NỔ LẠI MÁY.** Đây là lỗi phổ biến nhất dẫn đến hiện tượng thủy kích. Khi động cơ tắt máy trong nước, nước có thể đã lọt vào buồng đốt qua đường hút hoặc đường xả. Việc đề nổ lại sẽ khiến piston đẩy nước lên nhưng nước không nén được, dẫn đến cong/gãy tay biên, thậm chí vỡ lốc máy.\n- Hãy rút chìa khóa, chuyển cần số về N để có thể đẩy xe vào lề đường cao ráo hơn và gọi ngay cứu hộ chuyên nghiệp kéo xe về garage để kiểm tra.`,
        thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
        category: "Kinh nghiệm",
        author: "Phạm Hải Đăng",
        featured: 0,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Trải nghiệm Mercedes-Benz C300 AMG 2026: Đỉnh cao công nghệ và phong cách thể thao Đức",
        title_vi: "Trải nghiệm Mercedes-Benz C300 AMG 2026: Đỉnh cao công nghệ và phong cách thể thao Đức",
        slug: "trai-nghiem-mercedes-benz-c300-amg-2026",
        excerpt: "Mercedes-Benz C300 AMG 2026 tiếp tục là sự lựa chọn hàng đầu của giới trẻ thành đạt nhờ ngôn ngữ thiết kế Sensual Purity thể thao, khối động cơ Mild-Hybrid 2.0L mạnh mẽ và khoang lái kỹ thuật số hiện đại tiệm cận S-Class.",
        excerpt_vi: "Mercedes-Benz C300 AMG 2026 tiếp tục là sự lựa chọn hàng đầu của giới trẻ thành đạt nhờ ngôn ngữ thiết kế Sensual Purity thể thao, khối động cơ Mild-Hybrid 2.0L mạnh mẽ và khoang lái kỹ thuật số hiện đại tiệm cận S-Class.",
        content: `### 1. Ngoại hình AMG thể thao, đầy cá tính cuốn hút\n\nMercedes-Benz C300 AMG 2026 khoác lên mình gói trang bị ngoại thất AMG Line thể thao mạnh mẽ. Lưới tản nhiệt thiết kế dạng bầu trời sao lấp lánh với logo ngôi sao ba cánh cỡ lớn ngự trị chính giữa. Cụm đèn pha Digital Light thông minh cao cấp nhất của Mercedes cho khả năng chiếu sáng tối ưu và tự động điều chỉnh luồng sáng chống chói mắt phương tiện đi ngược chiều.\n\nThân xe sở hữu những đường nét khí động học mượt mà đi kèm bộ mâm thể thao AMG 19 inch 5 chấu kép khỏe khoắn. Cản sau với bộ khuếch tán gió thể thao cùng cặp ống xả kép mạ chrome sáng bóng làm tăng vẻ quyến rũ khi nhìn từ phía sau.\n\n### 2. Nội thất sang trọng, ngập tràn công nghệ số thế hệ mới\n\nKhoang lái của C300 AMG 2026 được ví như một "Tiểu S-Class" đích thực nhờ thiết kế hiện đại hướng tới tương lai:\n- **Màn hình trung tâm đặt dọc:** Màn hình cảm ứng 11.9 inch độ phân giải cực cao tích hợp hệ điều hành MBUX thế hệ thứ hai hỗ trợ kết nối không dây mượt mà và điều khiển bằng giọng nói tiếng Việt 'Hey Mercedes'.\n- **Bảng đồng hồ kỹ thuật số:** Màn hình 12.3 inch nổi sau vô-lăng AMG D-cut bọc da Nappa cao cấp hiển thị đa dạng chế độ đồ họa sống động.\n- **Tiện nghi sang trọng:** Hệ thống âm thanh vòm Burmester 3D chân thực, hệ thống đèn viền nội thất 64 màu tùy chỉnh độc đáo và cửa sổ trời toàn cảnh siêu rộng Panorama.\n\n### 3. Vận hành bứt phá mạnh mẽ với động cơ Mild-Hybrid EQ Boost\n\nSức mạnh của C300 AMG 2026 đến từ khối động cơ tăng áp M254 dung tích 2.0L kết hợp hệ thống điện nhẹ Mild-Hybrid 48V EQ Boost. Động cơ này sản sinh công suất tối đa 258 mã lực và mô-men xoắn cực đại 400 Nm, hộp số tự động 9 cấp 9G-TRONIC chuyển số êm ái. Hệ thống EQ Boost bổ sung tức thời 23 mã lực và 200 Nm mô-men xoắn giúp xe loại bỏ hoàn toàn độ trễ tăng áp, tăng tốc mượt mà từ 0-100 km/h chỉ mất 6.0 giây trước khi đạt tốc độ giới hạn điện tử 250 km/h.`,
        content_vi: `### 1. Ngoại hình AMG thể thao, đầy cá tính cuốn hút\n\nMercedes-Benz C300 AMG 2026 khoác lên mình gói trang bị ngoại thất AMG Line thể thao mạnh mẽ. Lưới tản nhiệt thiết kế dạng bầu trời sao lấp lánh với logo ngôi sao ba cánh cỡ lớn ngự trị chính giữa. Cụm đèn pha Digital Light thông minh cao cấp nhất của Mercedes cho khả năng chiếu sáng tối ưu và tự động điều chỉnh luồng sáng chống chói mắt phương tiện đi ngược chiều.\n\nThân xe sở hữu những đường nét khí động học mượt mà đi kèm bộ mâm thể thao AMG 19 inch 5 chấu kép khỏe khoắn. Cản sau với bộ khuếch tán gió thể thao cùng cặp ống xả kép mạ chrome sáng bóng làm tăng vẻ quyến rũ khi nhìn từ phía sau.\n\n### 2. Nội thất sang trọng, ngập tràn công nghệ số thế hệ mới\n\nKhoang lái của C300 AMG 2026 được ví như một "Tiểu S-Class" đích thực nhờ thiết kế hiện đại hướng tới tương lai:\n- **Màn hình trung tâm đặt dọc:** Màn hình cảm ứng 11.9 inch độ phân giải cực cao tích hợp hệ điều hành MBUX thế hệ thứ hai hỗ trợ kết nối không dây mượt mà và điều khiển bằng giọng nói tiếng Việt 'Hey Mercedes'.\n- **Bảng đồng hồ kỹ thuật số:** Màn hình 12.3 inch nổi sau vô-lăng AMG D-cut bọc da Nappa cao cấp hiển thị đa dạng chế độ đồ họa sống động.\n- **Tiện nghi sang trọng:** Hệ thống âm thanh vòm Burmester 3D chân thực, hệ thống đèn viền nội thất 64 màu tùy chỉnh độc đáo và cửa sổ trời toàn cảnh siêu rộng Panorama.\n\n### 3. Vận hành bứt phá mạnh mẽ với động cơ Mild-Hybrid EQ Boost\n\nSức mạnh của C300 AMG 2026 đến từ khối động cơ tăng áp M254 dung tích 2.0L kết hợp hệ thống điện nhẹ Mild-Hybrid 48V EQ Boost. Động cơ này sản sinh công suất tối đa 258 mã lực và mô-men xoắn cực đại 400 Nm, hộp số tự động 9 cấp 9G-TRONIC chuyển số êm ái. Hệ thống EQ Boost bổ sung tức thời 23 mã lực và 200 Nm mô-men xoắn giúp xe loại bỏ hoàn toàn độ trễ tăng áp, tăng tốc mượt mà từ 0-100 km/h chỉ mất 6.0 giây trước khi đạt tốc độ giới hạn điện tử 250 km/h.`,
        thumbnail: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=800&q=80",
        category: "Đánh giá",
        author: "Lê Hoàng Nam",
        featured: 1,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Mua xe ô tô trả góp năm 2026: So sánh lãi suất ngân hàng và mẹo duyệt hồ sơ nhanh nhất",
        title_vi: "Mua xe ô tô trả góp năm 2026: So sánh lãi suất ngân hàng và mẹo duyệt hồ sơ nhanh nhất",
        slug: "mua-xe-o-to-tra-gop-nam-2026-lai-suat-ngan-hang",
        excerpt: "Tư vấn chi tiết quy trình mua xe trả góp năm 2026, cập nhật mức lãi suất ưu đãi của các ngân hàng lớn tại Việt Nam và chia sẻ những kinh nghiệm thực tế giúp hồ sơ vay mua xe của bạn được duyệt nhanh chóng.",
        excerpt_vi: "Tư vấn chi tiết quy trình mua xe trả góp năm 2026, cập nhật mức lãi suất ưu đãi của các ngân hàng lớn tại Việt Nam và chia sẻ những kinh nghiệm thực tế giúp hồ sơ vay mua xe của bạn được duyệt nhanh chóng.",
        content: `### 1. Bức tranh lãi suất vay mua xe ô tô năm 2026\n\nThị trường tài chính năm 2026 ghi nhận mức lãi suất vay mua xe khá cạnh tranh giữa các nhóm ngân hàng lớn. Hiện tại lãi suất vay mua xe được chia thành 2 nhóm chính:\n- **Nhóm ngân hàng nhà nước (Big 4 - Vietcombank, BIDV, VietinBank, Agribank):** Lãi suất ưu đãi dao động từ 6.5% - 7.5%/năm ổn định trong 1-2 năm đầu. Điểm cộng là biên độ lãi suất thả nổi sau ưu đãi khá thấp và an toàn, nhưng quy trình thẩm định hồ sơ thu nhập khắt khe hơn.\n- **Nhóm ngân hàng thương mại cổ phần tư nhân (Techcombank, VIB, VPBank, TPBank):** Lãi suất ưu đãi khoảng 7.5% - 8.5%/năm. Nhóm này nổi bật với thời gian duyệt hồ sơ cực nhanh (trong vòng 4-8 giờ làm việc), hạn mức cho vay cao lên tới 80-85% giá trị xe và thủ tục chứng minh tài chính linh hoạt hơn rất nhiều.\n\n### 2. Hồ sơ vay cần chuẩn bị những giấy tờ gì?\n\nĐể rút ngắn tối đa thời gian phê duyệt hồ sơ vay mua xe, bạn cần chuẩn bị đầy đủ các nhóm hồ sơ sau:\n1. **Hồ sơ nhân thân:** CCCD gắn chip (của cả vợ và chồng nếu đã kết hôn), giấy đăng ký kết hôn hoặc giấy xác nhận độc thân.\n2. **Hồ sơ chứng minh tài chính:** Hợp đồng lao động, sao kê tài khoản nhận lương 3-6 tháng gần nhất. Với chủ doanh nghiệp cần cung cấp giấy đăng ký kinh doanh, báo cáo tài chính nội bộ. Nếu có thu nhập từ cho thuê tài sản (nhà đất, ô tô), cần cung cấp hợp đồng thuê và giấy tờ chứng minh sở hữu.\n3. **Hồ sơ tài sản thế chấp:** Hợp đồng mua bán xe ô tô, phiếu thu đặt cọc từ showroom bán xe.\n\n### 3. Những bí quyết vàng giúp hồ sơ được duyệt lập tức\n- **Lịch sử tín dụng sạch:** Không có nợ xấu trên hệ thống CIC (Trung tâm Thông tin Tín dụng Quốc gia). Nếu từng có lịch sử nợ quá hạn nhóm 2 trở lên, việc duyệt vay sẽ gặp rất nhiều khó khăn.\n- **Tỷ lệ nợ trên thu nhập (DTI) hợp lý:** Khoản trả gốc + lãi hàng tháng cho ngân hàng không nên vượt quá 50% tổng thu nhập chứng minh được của gia đình để đảm bảo khả năng trả nợ và cuộc sống ổn định.\n- **Chọn ngân hàng liên kết trực tiếp với showroom:** Các showroom ô tô lớn luôn có liên kết chiến lược với một số ngân hàng. Việc nộp hồ sơ qua các ngân hàng liên kết này giúp bạn nhận được mức ưu đãi lãi suất tốt hơn và thủ tục giải ngân đơn giản, nhanh chóng hơn.`,
        content_vi: `### 1. Bức tranh lãi suất vay mua xe ô tô năm 2026\n\nThị trường tài chính năm 2026 ghi nhận mức lãi suất vay mua xe khá cạnh tranh giữa các nhóm ngân hàng lớn. Hiện tại lãi suất vay mua xe được chia thành 2 nhóm chính:\n- **Nhóm ngân hàng nhà nước (Big 4 - Vietcombank, BIDV, VietinBank, Agribank):** Lãi suất ưu đãi dao động từ 6.5% - 7.5%/năm ổn định trong 1-2 năm đầu. Điểm cộng là biên độ lãi suất thả nổi sau ưu đãi khá thấp và an toàn, nhưng quy trình thẩm định hồ sơ thu nhập khắt khe hơn.\n- **Nhóm ngân hàng thương mại cổ phần tư nhân (Techcombank, VIB, VPBank, TPBank):** Lãi suất ưu đãi khoảng 7.5% - 8.5%/năm. Nhóm này nổi bật với thời gian duyệt hồ sơ cực nhanh (trong vòng 4-8 giờ làm việc), hạn mức cho vay cao lên tới 80-85% giá trị xe và thủ tục chứng minh tài chính linh hoạt hơn rất nhiều.\n\n### 2. Hồ sơ vay cần chuẩn bị những giấy tờ gì?\n\nĐể rút ngắn tối đa thời gian phê duyệt hồ sơ vay mua xe, bạn cần chuẩn bị đầy đủ các nhóm hồ sơ sau:\n1. **Hồ sơ nhân thân:** CCCD gắn chip (của cả vợ và chồng nếu đã kết hôn), giấy đăng ký kết hôn hoặc giấy xác nhận độc thân.\n2. **Hồ sơ chứng minh tài chính:** Hợp đồng lao động, sao kê tài khoản nhận lương 3-6 tháng gần nhất. Với chủ doanh nghiệp cần cung cấp giấy đăng ký kinh doanh, báo cáo tài chính nội bộ. Nếu có thu nhập từ cho thuê tài sản (nhà đất, ô tô), cần cung cấp hợp đồng thuê và giấy tờ chứng minh sở hữu.\n3. **Hồ sơ tài sản thế chấp:** Hợp đồng mua bán xe ô tô, phiếu thu đặt cọc từ showroom bán xe.\n\n### 3. Những bí quyết vàng giúp hồ sơ được duyệt lập tức\n- **Lịch sử tín dụng sạch:** Không có nợ xấu trên hệ thống CIC (Trung tâm Thông tin Tín dụng Quốc gia). Nếu từng có lịch sử nợ quá hạn nhóm 2 trở lên, việc duyệt vay sẽ gặp rất nhiều khó khăn.\n- **Tỷ lệ nợ trên thu nhập (DTI) hợp lý:** Khoản trả gốc + lãi hàng tháng cho ngân hàng không nên vượt quá 50% tổng thu nhập chứng minh được của gia đình để đảm bảo khả năng trả nợ và cuộc sống ổn định.\n- **Chọn ngân hàng liên kết trực tiếp với showroom:** Các showroom ô tô lớn luôn có liên kết chiến lược với một số ngân hàng. Việc nộp hồ sơ qua các ngân hàng liên kết này giúp bạn nhận được mức ưu đãi lãi suất tốt hơn và thủ tục giải ngân đơn giản, nhanh chóng hơn.`,
        thumbnail: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
        category: "Tư vấn mua xe",
        author: "Nguyễn Minh Đức",
        featured: 0,
        published: 1,
      },
      {
        id: crypto.randomUUID(),
        title: "Cẩm nang bảo dưỡng xe ô tô định kỳ: 7 hạng mục then chốt không được bỏ qua",
        title_vi: "Cẩm nang bảo dưỡng xe ô tô định kỳ: 7 hạng mục then chốt không được bỏ qua",
        slug: "cam-nang-bao-duong-xe-o-to-dinh-ky",
        excerpt: "Bảo dưỡng xe định kỳ không chỉ giữ cho xe hoạt động trơn tru mà còn đảm bảo an toàn tuyệt đối cho hành khách và giúp xe giữ giá tốt. Lưu ngay 7 hạng mục cực kỳ quan trọng cần bảo dưỡng thường xuyên.",
        excerpt_vi: "Bảo dưỡng xe định kỳ không chỉ giữ cho xe hoạt động trơn tru mà còn đảm bảo an toàn tuyệt đối cho hành khách và giúp xe giữ giá tốt. Lưu ngay 7 hạng mục cực kỳ quan trọng cần bảo dưỡng thường xuyên.",
        content: `### 1. Thay dầu động cơ và lọc dầu\n\nDầu động cơ có vai trò bôi trơn, làm mát và làm sạch các chi tiết chuyển động bên trong máy.\n- Nên thay dầu động cơ sau mỗi 5.000 km hoặc 10.000 km tùy thuộc vào loại dầu (dầu khoáng thông thường hay dầu tổng hợp toàn phần).\n- Cứ sau mỗi 2 lần thay dầu máy, bạn nên tiến hành thay mới lọc dầu để đảm bảo dầu bôi trơn luôn sạch sẽ, không bị lẫn cặn bẩn kim loại làm xước xi-lanh động cơ.\n\n### 2. Kiểm tra hệ thống phanh (Má phanh và Dầu phanh)\n\nHệ thống phanh quyết định trực tiếp đến sự an toàn tính mạng của hành khách trên xe:\n- Cần kiểm tra độ mòn má phanh định kỳ sau mỗi 10.000 km. Nếu nghe thấy tiếng kêu rít rát khó chịu khi đạp phanh hoặc chân phanh có cảm giác hẫng, hãy mang xe đi thay má phanh ngay.\n- Kiểm tra mức dầu phanh trong bình chứa và tiến hành thay mới dầu phanh sau mỗi 40.000 km hoặc sau 2 năm sử dụng để tránh tình trạng dầu bị lẫn nước làm giảm áp suất phanh.\n\n### 3. Vệ sinh và thay mới lọc gió (Lọc gió động cơ và Lọc gió điều hòa)\n- **Lọc gió động cơ:** Giống như "lá phổi" lọc sạch bụi bẩn trước khi đưa không khí vào buồng đốt. Lọc gió quá bẩn sẽ cản trở luồng khí nạp, gây hao xăng và giảm công suất máy. Nên vệ sinh sau mỗi 5.000 km và thay thế sau 20.000 km.\n- **Lọc gió điều hòa:** Giữ bụi bẩn, phấn hoa và mùi hôi bên ngoài không tràn vào cabin xe. Lọc gió điều hòa dơ bẩn sẽ khiến điều hòa làm mát kém và thổi ra luồng khí có mùi ẩm mốc khó chịu gây hại hệ hô hấp. Nên thay mới sau mỗi 15.000 - 20.000 km.\n\n### 4. Đảo lốp và kiểm tra áp suất lốp xe\n\nLốp xe là bộ phận duy nhất tiếp xúc trực tiếp với mặt đường.\n- Cần duy trì áp suất lốp chuẩn theo khuyến nghị của nhà sản xuất (thường được dán ở khung cửa xe bên ghế lái). Lốp non hơi gây tốn xăng và dễ bị nổ lốp; lốp quá căng làm xe bị xóc nảy và mòn không đều.\n- Hãy tiến hành đảo lốp sau mỗi 10.000 km để đảm bảo các lốp mòn đều nhau, kéo dài tuổi thọ sử dụng của lốp xe.\n\n### 5. Kiểm tra nước làm mát động cơ và các loại nước dung dịch khác\n\nNước làm mát có nhiệm vụ hạ nhiệt cho động cơ, ngăn ngừa quá nhiệt gây thổi gioăng mặt máy hỏng lốc động cơ. Hãy thường xuyên kiểm tra mực nước làm mát ở bình chứa phụ và bổ sung nếu thấy hao hụt. Định kỳ xúc rửa két nước và thay nước làm mát mới sau mỗi 40.000 - 50.000 km. Ngoài ra cũng đừng quên kiểm tra và châm thêm nước rửa kính thường xuyên.`,
        content_vi: `### 1. Thay dầu động cơ và lọc dầu\n\nDầu động cơ có vai trò bôi trơn, làm mát và làm sạch các chi tiết chuyển động bên trong máy.\n- Nên thay dầu động cơ sau mỗi 5.000 km hoặc 10.000 km tùy thuộc vào loại dầu (dầu khoáng thông thường hay dầu tổng hợp toàn phần).\n- Cứ sau mỗi 2 lần thay dầu máy, bạn nên tiến hành thay mới lọc dầu để đảm bảo dầu bôi trơn luôn sạch sẽ, không bị lẫn cặn bẩn kim loại làm xước xi-lanh động cơ.\n\n### 2. Kiểm tra hệ thống phanh (Má phanh và Dầu phanh)\n\nHệ thống phanh quyết định trực tiếp đến sự an toàn tính mạng của hành khách trên xe:\n- Cần kiểm tra độ mòn má phanh định kỳ sau mỗi 10.000 km. Nếu nghe thấy tiếng kêu rít rát khó chịu khi đạp phanh hoặc chân phanh có cảm giác hẫng, hãy mang xe đi thay má phanh ngay.\n- Kiểm tra mức dầu phanh trong bình chứa và tiến hành thay mới dầu phanh sau mỗi 40.000 km hoặc sau 2 năm sử dụng để tránh tình trạng dầu bị lẫn nước làm giảm áp suất phanh.\n\n### 3. Vệ sinh và thay mới lọc gió (Lọc gió động cơ và Lọc gió điều hòa)\n- **Lọc gió động cơ:** Giống như "lá phổi" lọc sạch bụi bẩn trước khi đưa không khí vào buồng đốt. Lọc gió quá bẩn sẽ cản trở luồng khí nạp, gây hao xăng và giảm công suất máy. Nên vệ sinh sau mỗi 5.000 km và thay thế sau 20.000 km.\n- **Lọc gió điều hòa:** Giữ bụi bẩn, phấn hoa và mùi hôi bên ngoài không tràn vào cabin xe. Lọc gió điều hòa dơ bẩn sẽ khiến điều hòa làm mát kém và thổi ra luồng khí có mùi ẩm mốc khó chịu gây hại hệ hô hấp. Nên thay mới sau mỗi 15.000 - 20.000 km.\n\n### 4. Đảo lốp và kiểm tra áp suất lốp xe\n\nLốp xe là bộ phận duy nhất tiếp xúc trực tiếp với mặt đường.\n- Cần duy trì áp suất lốp chuẩn theo khuyến nghị của nhà sản xuất (thường được dán ở khung cửa xe bên ghế lái). Lốp non hơi gây tốn xăng và dễ bị nổ lốp; lốp quá căng làm xe bị xóc nảy và mòn không đều.\n- Hãy tiến hành đảo lốp sau mỗi 10.000 km để đảm bảo các lốp mòn đều nhau, kéo dài tuổi thọ sử dụng của lốp xe.\n\n### 5. Kiểm tra nước làm mát động cơ và các loại nước dung dịch khác\n\nNước làm mát có nhiệm vụ hạ nhiệt cho động cơ, ngăn ngừa quá nhiệt gây thổi gioăng mặt máy hỏng lốc động cơ. Hãy thường xuyên kiểm tra mực nước làm mát ở bình chứa phụ và bổ sung nếu thấy hao hụt. Định kỳ xúc rửa két nước và thay nước làm mát mới sau mỗi 40.000 - 50.000 km. Ngoài ra cũng đừng quên kiểm tra và châm thêm nước rửa kính thường xuyên.`,
        thumbnail: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
        category: "Kinh nghiệm",
        author: "Quản trị viên",
        featured: 0,
        published: 1,
      },
    ];

    for (const post of samplePosts) {
      await activePool.query(
        "INSERT INTO posts (id, title, title_vi, slug, excerpt, excerpt_vi, content, content_vi, thumbnail, category, author, featured, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());",
        [post.id, post.title, post.title_vi, post.slug, post.excerpt, post.excerpt_vi, post.content, post.content_vi, post.thumbnail, post.category, post.author, post.featured, post.published]
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

  // Update mock cars with scoring profiles
  try {
    const seedScores = [
      { id: "c0000000-0000-0000-0000-000000001024", eco: 85, saf: 90, tech: 82, com: 90, fam: 92, ser: 85, off: 30, lux: 80 },
      { id: "c0000000-0000-0000-0000-000000001188", eco: 60, saf: 95, tech: 95, com: 96, fam: 92, ser: 50, off: 75, lux: 96 },
      { id: "c0000000-0000-0000-0000-000000001302", eco: 65, saf: 92, tech: 94, com: 92, fam: 85, ser: 50, off: 80, lux: 90 },
      { id: "c0000000-0000-0000-0000-000000001410", eco: 88, saf: 90, tech: 85, com: 86, fam: 92, ser: 80, off: 60, lux: 75 },
      { id: "c0000000-0000-0000-0000-000000001565", eco: 90, saf: 86, tech: 84, com: 80, fam: 80, ser: 82, off: 40, lux: 72 },
      { id: "c0000000-0000-0000-0000-000000001677", eco: 80, saf: 92, tech: 90, com: 90, fam: 82, ser: 60, off: 35, lux: 90 }
    ];

    for (const sc of seedScores) {
      await activePool.query(`
        UPDATE cars SET 
          economy_score = ?, safety_score = ?, technology_score = ?, 
          comfort_score = ?, family_score = ?, service_score = ?, 
          offroad_score = ?, luxury_score = ?
        WHERE id = ?;
      `, [sc.eco, sc.saf, sc.tech, sc.com, sc.fam, sc.ser, sc.off, sc.lux, sc.id]);
    }
    console.log("Seeding AI scores complete!");
  } catch (err: any) {
    console.error("Failed to seed AI scores:", err.message);
  }

  // 5. Purge mock/virtual cars to keep only crawled/user cars
  try {
    const mockCarIds = Object.values(MOCK_CAR_IDS);
    if (mockCarIds.length > 0) {
      console.log("Purging mock cars from database...");
      await activePool.query("DELETE FROM cars WHERE id IN (?);", [mockCarIds]);
      console.log("Mock cars purged successfully.");
    }
  } catch (err: any) {
    console.error("Failed to purge mock cars on startup:", err.message);
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

export async function getCustomers(): Promise<DbCustomer[]> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query("SELECT * FROM customers ORDER BY full_name ASC;");
  
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
    "INSERT INTO cars (id, user_id, title, title_vi, brand, model, year, price, mileage, fuel_type, transmission, body_type, color, seats, engine, description, description_vi, city, address, thumbnail, views, status, car_condition, reserved_until, condition_type, origin, interior_color, doors, drivetrain, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [
      newCar.id,
      newCar.user_id,
      newCar.title,
      newCar.title_vi || newCar.title,
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
      newCar.sort_order ?? 0,
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
  // Use snapshot columns as the source of truth for customer info.
  // Fall back to JOIN customers only for rows that pre-date the migration (snapshot columns are NULL).
  const [rows] = await activePool.query(`
    SELECT 
      a.*,
      COALESCE(a.customer_snapshot_name,  c.full_name)  AS customer_name,
      COALESCE(a.customer_snapshot_phone, c.phone)       AS customer_phone,
      COALESCE(a.customer_snapshot_email, c.email)       AS customer_email,
      a.user_id                                          AS user_id,
      u.full_name AS assigned_staff_name
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN users u ON c.assigned_staff_id = u.id
    ORDER BY a.created_at DESC;
  `);

  return (rows as any[]).map((r) => ({
    ...r,
    customer_snapshot_name:  r.customer_snapshot_name  ?? r.customer_name  ?? "",
    customer_snapshot_email: r.customer_snapshot_email ?? r.customer_email ?? "",
    customer_snapshot_phone: r.customer_snapshot_phone ?? r.customer_phone ?? "",
    appointment_date: safeToIsoString(r.appointment_date),
    created_at: safeToIsoString(r.created_at),
  }));
}

export async function getAppointmentsByUserId(userId: string): Promise<DbAppointment[]> {
  await ensureDbExists();
  const activePool = getPool();
  // Query by user_id stored directly on the appointment row.
  const [rows] = await activePool.query(`
    SELECT 
      a.*,
      COALESCE(a.customer_snapshot_name,  c.full_name)  AS customer_name,
      COALESCE(a.customer_snapshot_phone, c.phone)       AS customer_phone,
      COALESCE(a.customer_snapshot_email, c.email)       AS customer_email,
      a.user_id                                          AS user_id,
      u.full_name AS assigned_staff_name
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN users u ON c.assigned_staff_id = u.id
    WHERE a.user_id = ? OR (a.user_id IS NULL AND c.user_id = ?)
    ORDER BY a.created_at DESC;
  `, [userId, userId]);

  return (rows as any[]).map((r) => ({
    ...r,
    customer_snapshot_name:  r.customer_snapshot_name  ?? r.customer_name  ?? "",
    customer_snapshot_email: r.customer_snapshot_email ?? r.customer_email ?? "",
    customer_snapshot_phone: r.customer_snapshot_phone ?? r.customer_phone ?? "",
    appointment_date: safeToIsoString(r.appointment_date),
    created_at: safeToIsoString(r.created_at),
  }));
}

export async function getAppointmentById(id: string): Promise<DbAppointment | null> {
  await ensureDbExists();
  const activePool = getPool();
  const [rows] = await activePool.query(`
    SELECT 
      a.*,
      COALESCE(a.customer_snapshot_name,  c.full_name)  AS customer_name,
      COALESCE(a.customer_snapshot_phone, c.phone)       AS customer_phone,
      COALESCE(a.customer_snapshot_email, c.email)       AS customer_email,
      a.user_id                                          AS user_id,
      u.full_name AS assigned_staff_name
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN users u ON c.assigned_staff_id = u.id
    WHERE a.id = ?;
  `, [id]);
  const results = rows as any[];
  if (results.length === 0) return null;
  const r = results[0];
  return {
    ...r,
    customer_snapshot_name:  r.customer_snapshot_name  ?? r.customer_name  ?? "",
    customer_snapshot_email: r.customer_snapshot_email ?? r.customer_email ?? "",
    customer_snapshot_phone: r.customer_snapshot_phone ?? r.customer_phone ?? "",
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
    `INSERT INTO appointments
      (id, car_id, customer_id, user_id,
       customer_snapshot_name, customer_snapshot_email, customer_snapshot_phone,
       appointment_date, note, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      newAppointment.id,
      newAppointment.car_id,
      newAppointment.customer_id,
      newAppointment.user_id ?? null,
      newAppointment.customer_snapshot_name,
      newAppointment.customer_snapshot_email,
      newAppointment.customer_snapshot_phone,
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
  // Ensure chat session exists first to satisfy foreign key constraint
  await activePool.query("INSERT IGNORE INTO chat_sessions (session_id) VALUES (?);", [newMessage.session_id]);

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
    "INSERT INTO posts (id, title, title_vi, slug, excerpt, excerpt_vi, content, content_vi, thumbnail, category, author, featured, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [
      newPost.id,
      newPost.title,
      newPost.title_vi || newPost.title,
      newPost.slug,
      newPost.excerpt,
      newPost.excerpt_vi || newPost.excerpt,
      newPost.content,
      newPost.content_vi || newPost.content,
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



export async function updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
  await ensureDbExists();
  const activePool = getPool();
  const [result] = await activePool.query(
    "UPDATE users SET password = ? WHERE email = ?;",
    [passwordHash, email]
  );
  return (result as any).affectedRows > 0;
}
