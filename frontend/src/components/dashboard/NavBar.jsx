import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  BarChart3,
  User,
  Bell,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) fetchNotifications();
    const interval = setInterval(() => {
      if (userId) fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

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
        `http://127.0.0.1:5000/notifications?userId=${userId}`,
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

  return (
    <nav className="bg-[var(--surface-1)] backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-3 group">
          <ShoppingCart className="w-8 h-8 text-[var(--accent-2)] group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold text-[var(--text-1)]">
            SmartGrocer
          </span>
        </Link>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link
            to="/inventory-report"
            className="p-2 text-[var(--text-2)] hover:text-[var(--accent-1)] hover:bg-[var(--surface-2)] rounded-xl transition border border-transparent hover:border-[var(--border)]"
            title="Smart Inventory Report"
          >
            <Layers className="w-5 h-5" />
          </Link>
          <Link
            to="/analytics"
            className="p-2 text-[var(--text-2)] hover:text-[var(--accent-2)] hover:bg-[var(--surface-2)] rounded-xl transition border border-transparent hover:border-[var(--border)]"
          >
            <BarChart3 className="w-5 h-5" />
          </Link>

          {/* --- NOTIFICATIONS DROPDOWN --- */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleToggle}
              className="p-2 text-[var(--text-2)] hover:text-[var(--accent-2)] hover:bg-[var(--surface-2)] rounded-xl transition border border-transparent hover:border-[var(--border)] relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[var(--danger)] rounded-full border-2 border-[var(--surface-1)] animate-pulse"></span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-2)]">
                  <h3 className="text-sm font-bold text-[var(--text-1)]">
                    Recent Updates
                  </h3>
                  <span className="text-[10px] text-[var(--text-3)]">
                    {notifications.length} found
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-3)] text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border-b border-[var(--border)]/60 hover:bg-[var(--surface-2)]/70 transition ${
                          n.is_read ? "opacity-70" : "bg-[var(--accent-2)]/10"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                              n.type === "warning"
                                ? "bg-[var(--danger)]"
                                : "bg-[var(--accent-2)]"
                            }`}
                          ></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-[var(--text-1)]">
                                {n.title}
                              </p>

                              {/* --- NEW: COUNT BADGE --- */}
                              {n.count > 1 && (
                                <span className="bg-[var(--surface-2)] text-[var(--text-3)] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[var(--border)]">
                                  x{n.count}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[var(--text-2)] mt-0.5 leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-[var(--text-3)] mt-2 block">
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

                <Link
                  to="/notifications"
                  onClick={() => setShowNotifs(false)}
                  className="block p-3 text-center text-xs font-bold text-[var(--accent-2)] hover:text-[var(--accent-2)] bg-[var(--surface-2)] border-t border-[var(--border)] transition flex items-center justify-center gap-2"
                >
                  View All Notifications <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/profile"
            className="hidden sm:flex items-center px-3 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-xl border border-[var(--border)] transition group select-none decoration-transparent"
          >
            <div className="w-8 h-8 bg-[var(--accent-2)] rounded-full flex items-center justify-center text-[var(--surface-1)] font-bold mr-3 shadow-lg group-hover:scale-105 transition-transform">
              {user ? (
                user.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <span className="block text-[10px] text-[var(--text-3)] uppercase tracking-wider font-bold">
                Account
              </span>
              <span className="block text-sm font-bold text-[var(--text-1)] group-hover:text-[var(--accent-2)] transition-colors">
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
