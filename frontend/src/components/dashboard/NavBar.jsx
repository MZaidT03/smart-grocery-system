import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  BarChart3,
  LogOut,
  User,
  Bell,
  Check,
  X,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const userId = localStorage.getItem("userId");

  // Fetch Notifications on Load
  useEffect(() => {
    if (userId) fetchNotifications();

    // Optional: Poll every 30 seconds
    const interval = setInterval(() => {
      if (userId) fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Click Outside to Close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/notifications?userId=${userId}`
      );
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Notif fetch error", err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`http://127.0.0.1:5000/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = () => {
    if (!showNotifs && unreadCount > 0) {
      markAllRead();
    }
    setShowNotifs(!showNotifs);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/dashboard" className="flex items-center space-x-3 group">
          <ShoppingCart className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            SmartGrocer
          </span>
        </Link>

        <div className="flex items-center space-x-3">
          {/* ANALYTICS */}
          <Link
            to="/analytics"
            className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition border border-transparent hover:border-amber-500/20"
          >
            <BarChart3 className="w-5 h-5" />
          </Link>

          {/* --- NOTIFICATIONS DROPDOWN --- */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleToggle}
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition border border-transparent hover:border-amber-500/20 relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse"></span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                  <h3 className="text-sm font-bold text-white">
                    Notifications
                  </h3>
                  <span className="text-[10px] text-zinc-500">
                    {notifications.length} Recent
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition ${
                          n.is_read ? "opacity-60" : "bg-amber-500/5"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                              n.type === "warning"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            }`}
                          ></div>
                          <div>
                            <p className="text-sm font-bold text-zinc-200">
                              {n.title}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-zinc-600 mt-2 block">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PROFILE BADGE */}
          <Link
            to="/profile"
            className="hidden sm:flex items-center px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition group select-none decoration-transparent"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-zinc-950 font-bold mr-3 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              {user ? (
                user.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Account
              </span>
              <span className="block text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                {user || "Guest"}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
