export const SOCKET_EVENTS = {
  // Presence
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  
  // Room
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  
  // Messaging
  SEND_MESSAGE: "send_message",
  RECEIVE_MESSAGE: "receive_message",
  
  // Typing
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  
  // Receipts
  MESSAGE_READ: "message_read",

  // Appointments
  NEW_APPOINTMENT: "new_appointment",
} as const;
