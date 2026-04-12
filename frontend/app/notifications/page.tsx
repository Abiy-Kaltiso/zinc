"use client";

import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api } from "@/lib/api";
import { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await api.getNotifications();
      setNotifications(data.results || data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleMarkAllRead() {
    await api.markAllRead();
    load();
  }

  async function handleMarkRead(id: number) {
    await api.markRead(id);
    load();
  }

  const typeIcons: Record<string, string> = {
    lease_submitted: "📋",
    lease_approved: "✅",
    lease_denied: "❌",
    lease_returned: "↩️",
    lease_expiring: "⏰",
    lease_expired: "📅",
    lease_activated: "🟢",
    screening_required: "🔍",
    document_uploaded: "📎",
    amendment_requested: "✏️",
    amendment_approved: "✅",
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg border p-4 flex items-start gap-4 cursor-pointer transition-colors ${
                  notif.is_read ? "border-gray-200" : "border-blue-200 bg-blue-50"
                }`}
                onClick={() => !notif.is_read && handleMarkRead(notif.id)}
              >
                <span className="text-xl">{typeIcons[notif.notification_type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.is_read ? "text-gray-700" : "text-gray-900 font-medium"}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
