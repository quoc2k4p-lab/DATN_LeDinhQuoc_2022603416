"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, ExternalLink, X, Info } from "lucide-react";
import Link from "next/link";
import { getNotificationsAction, markNotificationReadAction, markAllNotificationsReadAction, DbNotification } from "@/lib/actions/notificationActions";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; content: string } | null>(null);

  const prevNotificationsRef = useRef<DbNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Setup polling every 6 seconds (6000ms)
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 6000);

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async (isPolling = false) => {
    try {
      const res = await getNotificationsAction();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);

        if (isPolling) {
          // Detect if a new notification has arrived
          const prev = prevNotificationsRef.current;
          const current = res.notifications;

          if (prev.length > 0 && current.length > 0) {
            // Find if there are unread notifications in current list that were not in the previous list
            const newItems = current.filter(
              (currItem) => currItem.is_read === 0 && !prev.some((prevItem) => prevItem.id === currItem.id)
            );

            if (newItems.length > 0) {
              // Trigger toast for the newest notification
              const newest = newItems[0];
              setActiveToast({
                id: newest.id,
                title: newest.title,
                content: newest.content,
              });

              // Auto dismiss toast after 5 seconds
              setTimeout(() => {
                setActiveToast((prevToast) => (prevToast && prevToast.id === newest.id ? null : prevToast));
              }, 5000);
            }
          }
        }

        prevNotificationsRef.current = res.notifications;
      }
    } catch (err) {
      console.error("Failed to poll notifications:", err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await markNotificationReadAction(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#080c11]/80 hover:bg-white/5 transition active:scale-95 text-zinc-300 hover:text-white"
        aria-label="Thông báo"
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e31837] text-[10px] font-bold text-white ring-2 ring-[#0b1016]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-in Realtime Toast Notification Alert */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-[999] flex w-80 max-w-full items-start gap-3 rounded-lg border border-[#e31837]/30 bg-[#11151c]/95 backdrop-blur-md p-4 shadow-2xl animate-slideInRight">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e31837]/10 text-[#e31837]">
            <Info size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#e31837]">{activeToast.title}</h4>
            <p className="text-sm text-zinc-100 font-medium mt-1 leading-snug">{activeToast.content}</p>
            <div className="mt-3 flex gap-4">
              <Link
                href="/admin/leads"
                onClick={() => {
                  handleMarkRead(activeToast.id);
                  setActiveToast(null);
                }}
                className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
              >
                Chi tiết <ExternalLink size={10} />
              </Link>
              <button
                onClick={() => handleMarkRead(activeToast.id)}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Đánh dấu đã đọc
              </button>
            </div>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-zinc-500 hover:text-zinc-300 transition"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 z-50 w-80 rounded-md border border-white/10 bg-[#11151c] shadow-2xl overflow-hidden animate-fadeIn select-none">
          <div className="flex items-center justify-between border-b border-white/10 bg-[#0c0f14] p-4">
            <h3 className="font-display text-xs font-extrabold uppercase tracking-wider text-white">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-blue-400 hover:underline cursor-pointer"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                <Bell size={20} className="mb-2 text-zinc-700" />
                <p className="text-xs font-bold">Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 transition hover:bg-white/5 flex flex-col gap-1.5 ${
                    notif.is_read === 0 ? "bg-[#e31837]/5 border-l-2 border-[#e31837]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white leading-snug">
                      {notif.title}
                    </span>
                    {notif.is_read === 0 && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-zinc-500 hover:text-[#e31837] p-0.5 rounded transition"
                        title="Đánh dấu đã đọc"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-normal">
                    {notif.content}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[9px] font-medium text-zinc-500">
                    <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {new Date(notif.created_at).toLocaleDateString()}</span>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={() => {
                          handleMarkRead(notif.id);
                          setIsOpen(false);
                        }}
                        className="text-blue-400 hover:underline flex items-center gap-0.5"
                      >
                        Xem chi tiết <ExternalLink size={8} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
