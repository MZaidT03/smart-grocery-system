import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Users,
  Leaf,
  Save,
  LogOut,
  ArrowLeft,
  Shield,
  Edit3,
} from "lucide-react";
import Navbar from "../components/dashboard/NavBar";

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    household_size: 1,
    dietary_pref: "Non-Veg",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("user") || "Guest";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/user/${userId}/profile`);
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => ({
          ...prev,
          ...data.user,
          name: data.user.name || "",
          email: data.user.email || "",
          household_size: data.user.household_size || 1,
        }));
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`http://127.0.0.1:5000/user/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name, // <--- SEND NAME
          household_size: profile.household_size,
          dietary_pref: profile.dietary_pref,
        }),
      });

      // Update local storage so Navbar updates immediately
      localStorage.setItem("user", profile.name);

      alert("Profile Updated Successfully!");
      // Optional: Force reload to update Navbar name
      window.location.reload();
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 animate-pulse">
        Loading Profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      <Navbar user={userName} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-zinc-400 hover:text-white mb-8 transition group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT COLUMN: IDENTITY CARD */}
          <div className="md:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-4xl font-bold text-zinc-950 mb-4 shadow-lg shadow-amber-500/20">
                {(profile.name || "U").charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-white">
                {profile.name || "User"}
              </h2>
              <p className="text-sm text-zinc-500 mb-6">{profile.email}</p>

              <div className="w-full pt-6 border-t border-zinc-800">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-500">Member Since</span>
                  <span className="text-zinc-300">2025</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Account Type</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Pro
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SETTINGS FORM */}
          <div className="md:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="text-amber-500" /> Account Settings
              </h3>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* FULL NAME - NOW EDITABLE */}
                  <div>
                    <label className="text-xs font-bold text-amber-500 uppercase mb-2 block">
                      Full Name
                    </label>
                    <div className="relative">
                      <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:border-amber-500 outline-none transition"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  {/* EMAIL - READ ONLY */}
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">
                      Email Address
                    </label>
                    <div className="flex items-center px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 cursor-not-allowed">
                      <Mail className="w-4 h-4 mr-3 text-zinc-600" />
                      {profile.email}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-amber-500 uppercase mb-2 block">
                      Household Size
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="number"
                        min="1"
                        value={profile.household_size || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            household_size: e.target.value,
                          })
                        }
                        className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:border-amber-500 outline-none transition"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Used to calculate "per person" consumption.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-500 uppercase mb-2 block">
                      Dietary Preference
                    </label>
                    <div className="relative">
                      <Leaf className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <select
                        value={profile.dietary_pref || "Non-Veg"}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            dietary_pref: e.target.value,
                          })
                        }
                        className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:border-emerald-500 outline-none transition appearance-none"
                      >
                        <option value="Non-Veg">Non-Veg (All)</option>
                        <option value="Veg">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-zinc-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {saving ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Logout Zone */}
            <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex justify-between items-center">
              <div>
                <h4 className="text-red-400 font-bold">Sign Out</h4>
                <p className="text-xs text-red-400/60">
                  Securely log out of your account on this device.
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 rounded-lg transition text-sm font-bold flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
