import React, { useState, useEffect } from "react";
import { Bell, RefreshCw, Clock, Check, Inbox } from "lucide-react";
import { apiClient, AgentNotification } from "../lib/supabase/client.js";

interface HeaderProps {
  title: string;
  notifications: AgentNotification[];
  onNotificationRead: () => void;
}

export default function Header({ title, notifications, onNotificationRead }: HeaderProps) {
  const [dbStatus, setDbStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localTime, setLocalTime] = useState("");

  // Local Clock (12h format)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const formattedHours = hours.toString().padStart(2, "0");
      setLocalTime(`${formattedHours}:${minutes}:${seconds} ${ampm}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabase connection status check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          setDbStatus("connected");
        } else {
          setDbStatus("disconnected");
        }
      } catch {
        setDbStatus("disconnected");
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.markNotificationRead(id);
      onNotificationRead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      onNotificationRead();
      setIsDropdownOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-white/80 px-6 backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">{title}</h1>
      </div>

      {/* Stats and controls */}
      <div className="flex items-center gap-6">
        {/* Local time */}
        <div className="hidden items-center gap-2 text-sm font-medium text-text-secondary md:flex">
          <Clock className="h-4 w-4 text-text-secondary/60" />
          <span className="font-mono">{localTime || "Loading..."}</span>
        </div>

        {/* Database status indicator */}
        <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs font-semibold text-text-primary border border-border">
          <span
            className={`h-2 w-2 rounded-full ${
              dbStatus === "connected"
                ? "bg-[#30D158] animate-pulse"
                : dbStatus === "disconnected"
                ? "bg-[#FF375F]"
                : "bg-amber-400"
            }`}
          />
          <span className="capitalize">
            {dbStatus === "checking" ? "Checking connection..." : `Supabase ${dbStatus}`}
          </span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative rounded-full p-2 text-primary hover:bg-[#E8F2FF] transition-colors focus:outline-none"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF375F] text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-96 origin-top-right rounded-xl border border-border bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-border px-3 py-2 pb-3">
                <span className="text-sm font-bold text-text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline transition-all"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto py-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-text-secondary">
                    <Inbox className="h-8 w-8 text-border mb-2" />
                    <p className="text-xs font-semibold">All caught up!</p>
                    <p className="text-[10px] text-text-secondary/60 mt-0.5">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex flex-col gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-background cursor-pointer ${
                        !n.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-text-primary">{n.title}</span>
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="rounded-full p-0.5 text-text-secondary hover:bg-[#E8F2FF] hover:text-[#30D158] transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2">{n.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            n.priority === "high"
                              ? "bg-red-50 text-[#FF375F]"
                              : "bg-background text-text-secondary"
                          }`}
                        >
                          {n.priority}
                        </span>
                        <span className="text-[10px] text-text-secondary/60">
                          {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
