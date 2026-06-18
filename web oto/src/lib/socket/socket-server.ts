import { Server, Socket } from "socket.io";
import { createServer } from "http";
import * as fs from "fs";
import * as path from "path";
import { jwtVerify } from "jose";
import * as mysql from "mysql2/promise";
import { SOCKET_EVENTS } from "./socket-events";
import { ChatMessagePayload, UserPresence, TypingIndicatorPayload, ReadReceiptPayload } from "./socket-types";
import crypto from "crypto";

// 1. Load configuration from Next.js env files
const envPath = path.join(process.cwd(), ".env.local");
let jwtSecretKey = "tq-auto-secret-key-that-is-very-long-and-secure-12345";
const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "tqauto"
};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/(^["']|["']$)/g, "");
      if (key === "JWT_SECRET") jwtSecretKey = val;
      if (key === "MYSQL_HOST") dbConfig.host = val;
      if (key === "MYSQL_PORT") dbConfig.port = parseInt(val, 10);
      if (key === "MYSQL_USER") dbConfig.user = val;
      if (key === "MYSQL_PASSWORD") dbConfig.password = val;
      if (key === "MYSQL_DATABASE") dbConfig.database = val;
    }
  });
}

const SECRET = new TextEncoder().encode(jwtSecretKey);
const PORT = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT, 10) : 3001;

// 2. Initialize Database Pool
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to verify JWT token
async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

// 3. Start HTTP Server and Socket.IO
const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("TQ Auto Socket Server is running.\n");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict to VPS application origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Track online presence (UserId -> Presence Info)
const activeUsers = new Map<string, UserPresence>();

// Connection Middleware for Authentication
io.use(async (socket: Socket, next) => {
  const token = socket.handshake.auth.token;
  const sessionId = socket.handshake.auth.sessionId;
  const name = socket.handshake.auth.name || "Khách hàng";

  if (token) {
    // Authenticated Admin/Staff session
    const payload = await verifyToken(token);
    if (payload && (payload.role === "admin" || payload.role === "staff")) {
      socket.data.userId = payload.id;
      socket.data.role = "staff";
      socket.data.name = payload.name;
      return next();
    }
    return next(new Error("Unauthorized: Invalid token"));
  } else if (sessionId) {
    // Customer guest session (Anonymous or registered via session ID)
    socket.data.userId = sessionId;
    socket.data.role = "customer";
    socket.data.name = name;
    return next();
  }

  return next(new Error("Unauthorized: Authentication details missing"));
});

io.on("connection", (socket: Socket) => {
  const userId = socket.data.userId;
  const role = socket.data.role;
  const name = socket.data.name;

  console.log(`User connected: ${name} (${role}) | Socket ID: ${socket.id}`);

  // Register online presence
  const presence: UserPresence = { userId, role, name, isOnline: true };
  activeUsers.set(userId, presence);
  
  // Broadcast user online event
  socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, presence);

  // Auto join personal room or admin group
  if (role === "staff") {
    socket.join("room_admin");
  } else {
    // Customer auto-joins their own conversation room
    socket.join(`room_conversation_${userId}`);
  }

  // Handle Room Join (Explicit)
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (conversationId: string) => {
    // Security check: prevent customer from joining other customer's conversations
    if (role === "customer" && conversationId !== userId) {
      console.warn(`Unauthorized room join attempt: user ${userId} tried to join ${conversationId}`);
      return;
    }
    socket.join(`room_conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined room_conversation_${conversationId}`);
  });

  // Handle Room Leave
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (conversationId: string) => {
    socket.leave(`room_conversation_${conversationId}`);
    console.log(`Socket ${socket.id} left room_conversation_${conversationId}`);
  });

  // Handle Message Read Receipt
  socket.on(SOCKET_EVENTS.MESSAGE_READ, async (conversationId: string) => {
    try {
      // Mark counterpart messages as read in database
      const counterpartRole = role === "staff" ? "customer" : "staff";
      await pool.query(
        "UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender_role = ? AND is_read = 0;",
        [conversationId, counterpartRole]
      );

      // Broadcast read receipt
      const payload: ReadReceiptPayload = {
        conversationId,
        userId,
        readAt: new Date().toISOString()
      };
      
      io.to(`room_conversation_${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_READ, payload);
      
      if (role === "customer") {
        io.to("room_admin").emit(SOCKET_EVENTS.MESSAGE_READ, payload);
      }
    } catch (err) {
      console.error("Error handling message read receipt:", err);
    }
  });

  // Handle Send Message
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload: { conversationId: string; message: string }) => {
    const { conversationId, message } = payload;
    if (!message.trim()) return;

    // Security check: customer can only send messages under their own conversationId (session_id)
    if (role === "customer" && conversationId !== userId) {
      console.warn(`Unauthorized message send: user ${userId} tried to send under conversation ${conversationId}`);
      return;
    }

    try {
      const messageId = crypto.randomUUID();
      const now = new Date();

      // Ensure the chat session exists first to respect foreign key constraints
      await pool.query(
        "INSERT IGNORE INTO chat_sessions (session_id) VALUES (?);",
        [conversationId]
      );

      // Insert message into database (session_id maps to conversationId)
      await pool.query(
        "INSERT INTO chat_messages (id, session_id, sender_role, sender_name, message_text, is_read) VALUES (?, ?, ?, ?, ?, 0);",
        [
          messageId,
          conversationId,
          role,
          name,
          message
        ]
      );

      // Construct message payload
      const chatMessage: ChatMessagePayload = {
        id: messageId,
        conversationId,
        senderId: userId,
        senderName: name,
        senderType: role,
        message,
        isRead: 0,
        sentAt: now.toISOString()
      };

      // Emit to room conversation
      io.to(`room_conversation_${conversationId}`).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, chatMessage);

      // Emit notification to admins
      io.to("room_admin").emit(SOCKET_EVENTS.RECEIVE_MESSAGE, chatMessage);
      
    } catch (err) {
      console.error("Failed to store and broadcast message:", err);
      socket.emit("error", { message: "Gửi tin nhắn thất bại." });
    }
  });

  // Handle Typing Indicator Start
  socket.on(SOCKET_EVENTS.TYPING_START, (conversationId: string) => {
    if (role === "customer" && conversationId !== userId) return;
    const payload: TypingIndicatorPayload = {
      conversationId,
      userId,
      userName: name,
      isTyping: true
    };
    socket.to(`room_conversation_${conversationId}`).emit(SOCKET_EVENTS.TYPING_START, payload);
    
    if (role === "customer") {
      socket.to("room_admin").emit(SOCKET_EVENTS.TYPING_START, payload);
    }
  });

  // Handle Typing Indicator Stop
  socket.on(SOCKET_EVENTS.TYPING_STOP, (conversationId: string) => {
    if (role === "customer" && conversationId !== userId) return;
    const payload: TypingIndicatorPayload = {
      conversationId,
      userId,
      userName: name,
      isTyping: false
    };
    socket.to(`room_conversation_${conversationId}`).emit(SOCKET_EVENTS.TYPING_STOP, payload);

    if (role === "customer") {
      socket.to("room_admin").emit(SOCKET_EVENTS.TYPING_STOP, payload);
    }
  });

  // Handle New Appointment Booking
  socket.on(SOCKET_EVENTS.NEW_APPOINTMENT, (appointment: any) => {
    io.to("room_admin").emit(SOCKET_EVENTS.NEW_APPOINTMENT, appointment);
    console.log("New appointment broadcasted to admins:", appointment);
  });

  // Handle Disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${name} (${role}) | Socket ID: ${socket.id}`);
    
    // Memory cleanup: update presence state
    const presenceOffline = { userId, role, name, isOnline: false };
    activeUsers.delete(userId);
    
    // Broadcast user offline event
    socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, presenceOffline);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO Server is running on port ${PORT}`);
});
