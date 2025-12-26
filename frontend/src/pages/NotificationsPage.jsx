import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Check,
  Clock,
  MessageSquare,
  Layers, // Icon for grouped items
} from "lucide-react";
import Navbar from "../components/dashboard/NavBar";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/notifications?userId=${userId}`
      );
      const data = await res.json();

      if (data.success) {
        // We do NOT filter 'system' here to ensure you see everything for now
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic Update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    try {
      await fetch(`http://127.0.0.1:5000/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getStyleByType = (type) => {
    switch (type?.toLowerCase()) {
      case "success":
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
          border: "border-emerald-500/20",
          bg: "bg-emerald-500/5",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          border: "border-amber-500/20",
          bg: "bg-amber-500/5",
        };
      case "error":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          border: "border-red-500/20",
          bg: "bg-red-500/5",
        };
      case "system":
        return {
          icon: <Layers className="w-5 h-5 text-zinc-500" />,
          border: "border-zinc-500/20",
          bg: "bg-zinc-500/5",
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          border: "border-blue-500/20",
          bg: "bg-blue-500/5",
        };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) date = new Date(dateStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return "Just now";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      <Navbar user={localStorage.getItem("user")} />

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Bell className="text-amber-400 fill-amber-400/10" />{" "}
              Notifications
            </h1>
            <p className="text-zinc-400 mt-1">Recent updates and alerts.</p>
          </div>

          {notifications.some((n) => n.is_read === 0) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-800"
            >
              <Check className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-20 text-zinc-500 animate-pulse">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-400">
                All caught up!
              </h3>
              <p className="text-zinc-600 text-sm mt-1">
                No new notifications.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const style = getStyleByType(n.type);
              const isUnread = n.is_read === 0;

              return (
                <div
                  key={n.id}
                  className={`
                    relative p-5 rounded-2xl border transition-all duration-300
                    ${
                      isUnread
                        ? "bg-zinc-900 border-zinc-700 shadow-lg shadow-black/40"
                        : "bg-zinc-950 border-zinc-800 opacity-75 hover:opacity-100"
                    }
                  `}
                >
                  <div className="flex gap-4">
                    {/* Icon Box */}
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${style.bg} ${style.border}`}
                    >
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <h3
                            className={`text-sm font-bold ${
                              isUnread ? "text-white" : "text-zinc-400"
                            }`}
                          >
                            {n.title}
                          </h3>

                          {/* --- COUNT BADGE (Same as Dashboard) --- */}
                          {n.count > 1 && (
                            <span className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700">
                              <Layers className="w-3 h-3" /> x{n.count}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1 whitespace-nowrap ml-2">
                          <Clock className="w-3 h-3" />{" "}
                          {formatDate(n.created_at)}
                        </span>
                      </div>
                      <p
                        className={`text-sm mt-1 leading-relaxed ${
                          isUnread ? "text-zinc-300" : "text-zinc-500"
                        }`}
                      >
                        {n.message}
                      </p>
                    </div>
                  </div>

                  {/* Unread Dot */}
                  {isUnread && (
                    <div className="absolute top-5 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
