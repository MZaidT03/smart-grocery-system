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

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30">
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
      <nav className="fixed top-0 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ShoppingCart className="relative w-8 h-8 text-amber-400" />
            </div>
            <span className="text-2xl font-bold bg-linear-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tight">
              SmartGrocer
            </span>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-zinc-400 hover:text-amber-300 transition-colors font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 hover:from-amber-400 hover:to-yellow-500 rounded-lg font-bold transition-all transform hover:scale-105 hover:shadow-[0_0_20px_-5px_rgba(251,191,36,0.4)]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-24 px-6 relative overflow-hidden">
        {/* Background Glow Element */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center space-x-2 bg-zinc-900/50 border border-amber-500/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm hover:border-amber-500/40 transition-colors">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300/90 font-medium tracking-wide uppercase">
              AI-Powered Grocery Management
            </span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight text-white">
            Smart Grocery &<br />
            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
              Inventory System
            </span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-in-up delay-200 text-xl text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Stop wasting food and money. Efficiently manage your household
            groceries, reduce waste, and predict future needs with{" "}
            <span className="text-zinc-200">AI-driven analytics</span>.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5">
            <a
              href="/register"
              className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center space-x-2 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.3)]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/login"
              className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl font-semibold transition-all border border-zinc-800 hover:border-amber-500/30 hover:text-amber-100"
            >
              Login
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-24 max-w-3xl mx-auto border-t border-zinc-800/50 pt-10">
            {[
              { val: "40%", label: "Food Waste Reduced" },
              { val: "95%", label: "Prediction Accuracy" },
              { val: "$200", label: "Avg. Monthly Savings" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors duration-300">
                  {stat.val}
                </div>
                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 px-6 bg-zinc-900/30 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">
              Powerful Features
            </h2>
            <p className="text-zinc-400 text-lg">
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
                className="group relative bg-zinc-900/80 p-8 rounded-2xl border border-zinc-800 hover:border-amber-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.15)] hover:-translate-y-2"
              >
                {/* Icon Container */}
                <div className="w-14 h-14 bg-zinc-800/50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-zinc-400 group-hover:text-amber-400 transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-zinc-100 group-hover:text-amber-100 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/50 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-amber-500/30 rounded-3xl p-12 transition-all duration-500 shadow-2xl">
          {/* Decorative glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            Join thousands of households saving money and reducing food waste.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-amber-500/20"
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
            <span className="text-amber-500/80 font-medium">M Zaid Tahir</span>
            <span>|</span>
            <span className="text-zinc-500">CodeInn' Tech</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
