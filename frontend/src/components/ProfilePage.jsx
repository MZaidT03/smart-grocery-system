import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Users,
  Leaf,
  Package,
  AlertTriangle,
  LogOut,
} from "lucide-react";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/user/${userId}/profile`);
        const data = await res.json();
        if (data.success) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-zinc-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </button>

        {/* Header Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center text-4xl font-bold text-black shadow-lg shadow-amber-500/20">
            {profile?.user.username.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-1">
              {profile?.user.username}
            </h1>
            <p className="text-zinc-500 flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4" />{" "}
              {profile?.user.email || "No email provided"}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Package className="w-5 h-5" /> Total Inventory
            </div>
            <p className="text-3xl font-bold text-white">
              {profile?.stats.totalProducts}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" /> Low Stock Items
            </div>
            <p className="text-3xl font-bold text-red-500">
              {profile?.stats.lowStock}
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-4">
            Household Settings
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-zinc-300">
                <Users className="w-5 h-5 text-amber-500" />
                <span>Family Members</span>
              </div>
              <span className="font-mono text-xl text-white">
                {profile?.user.household_size}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-zinc-300">
                <Leaf className="w-5 h-5 text-emerald-500" />
                <span>Dietary Preference</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/20">
                {profile?.user.diet_preference}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="mt-8 w-full py-4 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 border border-zinc-800 hover:border-red-500/30 rounded-xl transition flex items-center justify-center gap-2 font-bold"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
