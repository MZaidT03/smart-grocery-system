import React from "react";
import { ShoppingCart, BarChart3, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="w-8 h-8 text-amber-400" />
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            SmartGrocer
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/analytics")}
            className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition group">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold mr-3">
              {user?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="block text-xs text-zinc-500">Welcome</span>
              <span className="block text-sm font-bold text-white group-hover:text-amber-400">
                {user}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
