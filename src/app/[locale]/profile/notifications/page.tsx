"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, Check, Eye, Loader2, MailOpen, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  DbNotification
} from "@/lib/actions/notificationActions";

export default function NotificationsPage() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = async () => {
    const res = await getNotificationsAction();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, is_read: 1 } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: 1 }))
        );
        setUnreadCount(0);
      }
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) {
        return locale === "vi" ? "Vừa xong" : "Just now";
      }
      if (diffMins < 60) {
        return locale === "vi"
          ? `${diffMins} phút trước`
          : `${diffMins}m ago`;
      }
      if (diffHours < 24) {
        return locale === "vi"
          ? `${diffHours} giờ trước`
          : `${diffHours}h ago`;
      }
      if (diffDays < 7) {
        return locale === "vi"
          ? `${diffDays} ngày trước`
          : `${diffDays}d ago`;
      }
      
      return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#e31837]" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border theme-border bg-[#11161d] p-12 text-center shadow-md">
        <Bell className="mx-auto h-12 w-12 text-[#a1a1aa] theme-subtle mb-4" />
        <h3 className="font-display text-lg font-bold text-[var(--foreground)]">{t("noNotifications")}</h3>
        <p className="mt-2 text-sm text-[#a1a1aa] theme-subtle max-w-sm mx-auto">
          {locale === "vi"
            ? "Bạn chưa nhận được thông báo nào. Khi showroom cập nhật lịch hẹn xem xe của bạn, các thông báo mới nhất sẽ xuất hiện ở đây."
            : "You have no notifications yet. When the showroom updates your test drive appointment status, updates will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Mark All Read Actions */}
      <div className="flex items-center justify-between border-b theme-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Bell className="text-[#e31837]" size={20} />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">{t("notifications")}</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-[#e31837]/15 border border-[#e31837]/35 px-2 py-0.5 text-xs font-bold text-[#e31837]">
              {unreadCount} {t("unreadBadge").toLowerCase()}
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#e31837] hover:text-[#c2142d] transition disabled:opacity-50"
          >
            <Check size={14} />
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`group relative overflow-hidden rounded-lg border p-4 shadow-sm transition duration-300 ${
              notif.is_read === 0
                ? "border-[#e31837]/25 bg-[#e31837]/2"
                : "border-theme-border bg-[#11161d]"
            }`}
          >
            {/* Left line for unread status */}
            {notif.is_read === 0 && (
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#e31837]" />
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className={`mt-0.5 rounded-full p-2 shrink-0 ${
                  notif.is_read === 0 
                    ? "bg-[#e31837]/15 text-[#e31837]" 
                    : "bg-[#1a1f28] text-[#a1a1aa]"
                }`}>
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className={`text-sm tracking-tight ${
                    notif.is_read === 0 ? "font-bold text-[var(--foreground)]" : "font-semibold text-[#a1a1aa]"
                  }`}>
                    {notif.title}
                  </h3>
                  <p className="mt-1 text-sm theme-subtle leading-relaxed text-[#a1a1aa]">
                    {notif.content}
                  </p>
                  <span className="mt-2 block text-[10px] uppercase font-bold tracking-wider text-[#a1a1aa]/65">
                    {formatTimeAgo(notif.created_at)}
                  </span>
                </div>
              </div>

              {/* Actions: Mark as Read & View link */}
              <div className="flex gap-2">
                {notif.link && (
                  <Link
                    href={notif.link}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border theme-border bg-[#1a1f28] text-[#a1a1aa] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition"
                    title={locale === "vi" ? "Xem chi tiết" : "View details"}
                  >
                    <Eye size={14} />
                  </Link>
                )}
                {notif.is_read === 0 && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    disabled={isPending}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-500 transition"
                    title={t("markRead")}
                  >
                    <MailOpen size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
