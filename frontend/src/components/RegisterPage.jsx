import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Mail,
  Lock,
  AlertTriangle,
  Users,
  Leaf,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // New States
  const [householdSize, setHouseholdSize] = useState(1);
  const [dietType, setDietType] = useState("Non-Veg");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          householdSize: parseInt(householdSize),
          dietType,
        }),
      });

      const data = await res.json();

      if (data.success) {
        navigate("/login");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Registration failed. Server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg flex items-center justify-center px-4 font-sans py-10">
      <div className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--border)] p-8 rounded-2xl shadow-elevated">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface-2)] rounded-full mb-4">
            <ShoppingCart className="w-8 h-8 text-[var(--accent-2)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">
            Create Account
          </h1>
          <p className="text-[var(--text-2)]">
            Customize your smart grocery experience
          </p>
        </div>

        {error && (
          <div className="bg-[var(--surface-2)] border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 rounded-xl mb-6 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text-1)] focus:border-[var(--accent-2)] outline-none transition"
              required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
            <input
              type="email"
              placeholder="Email (Optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text-1)] focus:border-[var(--accent-2)] outline-none transition"
            />
          </div>

          {/* New Fields Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
              <input
                type="number"
                min="1"
                placeholder="Members"
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text-1)] focus:border-[var(--accent-2)] outline-none transition"
                required
              />
            </div>
            <div className="relative">
              <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text-1)] focus:border-[var(--accent-2)] outline-none transition appearance-none"
              >
                <option value="Non-Veg">Non-Veg</option>
                <option value="Veg">Veg</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text-1)] focus:border-[var(--accent-2)] outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--accent-2)] text-[var(--surface-1)] font-bold rounded-xl hover:bg-[var(--accent-1)] transition active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-3)] text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-[var(--accent-2)] cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
