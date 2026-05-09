import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // --- FIX IS HERE ---
        // We now extract 'id' and 'name' from the nested 'user' object
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("user", data.user.name);

        // Optional: Store other profile info if needed
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("householdSize", data.user.household_size);

        // Redirect to Dashboard
        navigate("/dashboard");
        window.location.reload(); // Force reload to update Navbar state
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Ensure backend is running.");
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--accent-2)]/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--accent-1)]/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--border)] p-8 rounded-3xl shadow-elevated relative z-10">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <ShoppingCart className="w-8 h-8 text-[var(--accent-2)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-1)] mb-2">
            Welcome Back
          </h1>
          <p className="text-[var(--text-3)] text-sm">
            Login to manage your smart inventory
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--surface-2)] border border-[var(--danger)]/30 rounded-xl flex items-center gap-3 text-[var(--danger)] text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)] group-focus-within:text-[var(--accent-2)] transition-colors" />
              <input
                type="text"
                placeholder="Username or Email"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] text-sm rounded-xl pl-12 pr-4 py-3.5 focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)]/30 outline-none transition-all placeholder:text-[var(--text-3)]"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)] group-focus-within:text-[var(--accent-2)] transition-colors" />
              <input
                type="password"
                placeholder="••••••"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] text-sm rounded-xl pl-12 pr-4 py-3.5 focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)]/30 outline-none transition-all placeholder:text-[var(--text-3)] font-mono"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent-2)] hover:bg-[var(--accent-1)] text-[var(--surface-1)] font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-elevated flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Login <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[var(--text-3)] text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[var(--accent-2)] hover:text-[var(--accent-1)] font-bold hover:underline transition-all"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
