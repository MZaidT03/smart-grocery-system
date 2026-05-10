import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  TrendingUp,
  ListChecks,
  Sparkles,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const LandingPage = () => {
  return (
    <div className="min-h-screen theme-bg font-sans">
      {/* Custom Styles for Animations */}
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
          }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
        `}
      </style>

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[var(--surface-1)] backdrop-blur-xl border-b border-[var(--border)] z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-[var(--accent-2)]/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ShoppingCart className="relative w-8 h-8 text-[var(--accent-2)]" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-1)] tracking-tight">
              SmartGrocer
            </span>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-4 py-2 text-[var(--text-2)] hover:text-[var(--accent-2)] transition-colors font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-[var(--accent-2)] text-[var(--surface-1)] hover:bg-[var(--accent-1)] rounded-lg font-bold transition-all transform hover:scale-105 shadow-elevated"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-24 px-6 relative overflow-hidden">
        {/* Background Glow Element */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--accent-2)]/8 rounded-full blur-[100px] -z-10" />

        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center space-x-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-4 py-2 mb-8 backdrop-blur-sm transition-colors">
            <Sparkles className="w-4 h-4 text-[var(--accent-2)]" />
            <span className="text-sm text-[var(--text-2)] font-medium tracking-wide uppercase">
              AI-Powered Grocery Management
            </span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight text-[var(--text-1)]">
            Smart Grocery &<br />
            <span className="text-[var(--accent-2)]">Inventory System</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-in-up delay-200 text-xl text-[var(--text-2)] mb-10 max-w-3xl mx-auto leading-relaxed">
            Stop wasting food and money. Efficiently manage your household
            groceries, reduce waste, and predict future needs with{" "}
            <span className="text-[var(--text-1)]">AI-driven analytics</span>.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5">
            <a
              href="/register"
              className="group px-8 py-4 bg-[var(--accent-2)] hover:bg-[var(--accent-1)] text-[var(--surface-1)] rounded-xl font-bold transition-all transform hover:scale-105 flex items-center space-x-2 shadow-elevated"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/login"
              className="px-8 py-4 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-1)] rounded-xl font-semibold transition-all border border-[var(--border)]"
            >
              Login
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-24 max-w-3xl mx-auto border-t border-[var(--border)] pt-10">
            {[
              { val: "40%", label: "Food Waste Reduced" },
              { val: "95%", label: "Prediction Accuracy" },
              { val: "$200", label: "Avg. Monthly Savings" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl font-bold text-[var(--text-1)] mb-2 group-hover:text-[var(--accent-2)] transition-colors duration-300">
                  {stat.val}
                </div>
                <div className="text-sm text-[var(--text-3)] group-hover:text-[var(--text-2)] transition-colors">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 px-6 bg-[var(--surface-2)]/60 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[var(--text-1)]">
              Powerful Features
            </h2>
            <p className="text-[var(--text-2)] text-lg">
              Everything you need to manage your groceries smartly
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Cards with Golden Hover Effects */}
            {[
              {
                icon: BarChart3,
                title: "Smart Tracking",
                desc: "Monitor daily consumption patterns and track your inventory in real-time with intuitive dashboards.",
              },
              {
                icon: TrendingUp,
                title: "AI Predictions",
                desc: "Forecast when items will run out based on your usage history with machine learning algorithms.",
              },
              {
                icon: ListChecks,
                title: "Auto Shopping Lists",
                desc: "Generate automated shopping lists before you run out, ensuring you always have what you need.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-[var(--surface-1)] p-8 rounded-2xl border border-[var(--border)] transition-all duration-300 hover:-translate-y-2 hover:shadow-elevated"
              >
                {/* Icon Container */}
                <div className="w-14 h-14 bg-[var(--surface-2)] rounded-xl flex items-center justify-center mb-6 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-[var(--accent-2)] transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-[var(--text-1)] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-2)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg)]/70 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl p-12 transition-all duration-500 shadow-elevated">
          {/* Decorative glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[var(--accent-2)]/10 rounded-full blur-[80px] pointer-events-none" />

          <h2 className="text-4xl font-bold mb-6 text-[var(--text-1)]">
            Ready to Get Started?
          </h2>
          <p className="text-[var(--text-2)] text-lg mb-10">
            Join thousands of households saving money and reducing food waste.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 px-10 py-4 bg-[var(--accent-2)] hover:bg-[var(--accent-1)] text-[var(--surface-1)] rounded-xl font-bold transition-all transform hover:scale-105 shadow-elevated"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-zinc-500 mb-4">
            SmartGrocer &copy; 2025. All rights reserved.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-zinc-600">
            <span>Project by</span>
            <span className="text-amber-500/80 font-medium">
              M Zaid Tahir | Roman Fatima | Danish Imran
            </span>
            <span>|</span>
            <span className="text-zinc-500">CodeInn' Tech</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
