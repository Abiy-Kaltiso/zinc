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

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-sm text-gray-400 mt-1">Stay updated on lease activity</p>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-16 text-center">
            <p className="text-sm text-gray-400">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-xl shadow-sm border p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${
                  notif.is_read ? "border-gray-100" : "border-indigo-200 bg-indigo-50/30"
                }`}
                onClick={() => !notif.is_read && handleMarkRead(notif.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.is_read ? "text-gray-600" : "text-gray-900 font-medium"}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-300 mt-2">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
