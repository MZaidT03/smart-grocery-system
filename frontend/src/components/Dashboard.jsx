import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Trash2,
  LogOut,
  Package,
  Search,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  ListPlus,
  Utensils,
  Loader2,
} from "lucide-react";

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("Staples");
  const [quantity, setQuantity] = useState("");

  // Modal State
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [consumeAmount, setConsumeAmount] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const userId = localStorage.getItem("userId");
  const onboardingComplete = localStorage.getItem("onboardingComplete");

  // Categories based on your dataset
  const categories = [
    "Staples",
    "Pulses",
    "Dairy",
    "Bakery",
    "Oil & Ghee",
    "Vegetables",
    "Fruits",
    "Meat",
    "Beverages",
    "Spices",
    "Snacks",
    "Condiments",
    "Other",
  ];

  // --- Effects ---
  useEffect(() => {
    if (!userId) {
      navigate("/login");
    } else if (onboardingComplete === "false") {
      navigate("/onboarding"); // Redirect if flow isn't finished
    } else {
      fetchProducts();
    }
  }, [userId, navigate, onboardingComplete]);

  // --- Data Fetching ---
  const fetchProducts = async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/products?userId=${userId}`
      );
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // --- Actions ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !quantity) return;

    try {
      await fetch("http://127.0.0.1:5000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit,
          category,
          quantity: parseFloat(quantity),
          userId,
        }),
      });

      setName("");
      setQuantity("");
      setCategory("Staples");
      fetchProducts();
    } catch (error) {
      console.error("Add error:", error);
    }
  };

  const handleConsume = async () => {
    if (!consumeAmount || consumeAmount <= 0) return;

    try {
      await fetch("http://127.0.0.1:5000/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          amount: parseFloat(consumeAmount),
          userId,
        }),
      });

      setShowConsumeModal(false);
      setConsumeAmount("");
      fetchProducts();
    } catch (error) {
      console.error("Consume error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await fetch(`http://127.0.0.1:5000/products/${id}`, { method: "DELETE" });
      fetchProducts();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleGenerateSmartList = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/generate-smart-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, days: 30 }),
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/shopping-list/${data.listId}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Smart list error:", error);
      alert("Failed to generate list");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- Helpers for "Pro" Display ---

  const getRunOutDate = (daysLeft) => {
    if (!daysLeft || daysLeft >= 900) return "—";
    const date = new Date();
    date.setDate(date.getDate() + Math.round(daysLeft));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderStockStatus = (daysLeft, quantity) => {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" /> Out of Stock
        </span>
      );
    }
    if (!daysLeft || daysLeft >= 900) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
          <Activity className="w-3 h-3 mr-1" /> Stable
        </span>
      );
    }
    if (daysLeft < 7) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
          <TrendingDown className="w-3 h-3 mr-1" /> Critical
        </span>
      );
    }
    if (daysLeft < 14) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" /> Low
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3 mr-1" /> Healthy
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* NAVBAR */}
      <nav className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              SmartGrocer Pro
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold">
                {user?.charAt(0).toUpperCase()}
              </div>
              <span className="ml-3 text-zinc-300 font-medium">{user}</span>
            </div>
            <button
              onClick={() => navigate("/analytics")}
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition mr-2"
              title="View Analytics"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* TITLE & ACTIONS */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Package className="text-amber-400" /> Inventory Dashboard
            </h1>
            <p className="text-zinc-400 mt-1">
              Real-time stock monitoring & AI predictions
            </p>
          </div>

          {/* Smart List Generator Button */}
          <button
            onClick={handleGenerateSmartList}
            disabled={isGenerating}
            className="flex items-center px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02]"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ListPlus className="w-5 h-5 mr-2" />
            )}
            {isGenerating ? "Analysing..." : "Generate Restock List"}
          </button>
        </div>

        {/* ADD PRODUCT CARD */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-10 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" /> Add Manual Item
          </h2>
          <form
            onSubmit={handleAddProduct}
            className="grid md:grid-cols-12 gap-4"
          >
            <div className="md:col-span-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:border-amber-500/50 outline-none transition"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:border-amber-500/50 outline-none transition"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <input
                type="number"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:border-amber-500/50 outline-none transition"
              />
            </div>
            <div className="md:col-span-2">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:border-amber-500/50 outline-none transition"
              >
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="dozen">dozen</option>
                <option value="pieces">pieces</option>
                <option value="packet">packet</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition border border-zinc-700"
              >
                Add Stock
              </button>
            </div>
          </form>
        </div>

        {/* PRO TABLE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">In Stock</th>
                  <th className="px-6 py-4">Daily Rate</th>
                  <th className="px-6 py-4">Est. Run Out</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-zinc-800/30 transition group"
                  >
                    {/* Category */}
                    <td className="px-6 py-4 text-zinc-500 text-xs uppercase font-bold tracking-wider">
                      {p.category}
                    </td>

                    {/* Item Name */}
                    <td className="px-6 py-4 font-medium text-white text-sm">
                      {p.name}
                    </td>

                    {/* Qty & Unit */}
                    <td className="px-6 py-4 text-zinc-300 font-mono">
                      <span className="text-white font-bold">{p.quantity}</span>{" "}
                      <span className="text-xs text-zinc-500">{p.unit}</span>
                    </td>

                    {/* Effective Daily Rate (from backend) */}
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {p.effective_daily_rate > 0 ? (
                        <span>
                          {p.effective_daily_rate.toFixed(2)}{" "}
                          <span className="text-xs">/day</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic text-xs">
                          No data
                        </span>
                      )}
                    </td>

                    {/* Estimated Run Out Date */}
                    <td className="px-6 py-4 text-zinc-300 text-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {getRunOutDate(p.days_left)}
                        </div>
                        {p.days_left < 900 && (
                          <span className="text-xs text-zinc-500 font-mono mt-1">
                            {Math.round(p.days_left)} days left
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {renderStockStatus(p.days_left, p.quantity)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowConsumeModal(true);
                        }}
                        className="px-3 py-1.5 bg-zinc-800 text-amber-400 hover:text-amber-300 hover:bg-zinc-700 rounded-lg transition text-xs font-medium border border-amber-500/20 hover:border-amber-500/50 flex inline-flex items-center gap-1"
                      >
                        <Utensils className="w-3 h-3" /> Consume
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition text-xs border border-zinc-700 hover:border-red-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-zinc-500 italic"
                    >
                      Your inventory is empty. Use the "Generate Restock List"
                      button to get started with a personalized list from our
                      dataset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONSUME MODAL */}
      {showConsumeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-700 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">
              Log Consumption
            </h2>
            <p className="text-zinc-400 mb-6 text-sm">
              How much <strong>{selectedProduct?.name}</strong> did you use?
            </p>

            <div className="relative mb-6">
              <input
                type="number"
                value={consumeAmount}
                onChange={(e) => setConsumeAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 px-4 py-3 rounded-xl text-white focus:border-amber-500 outline-none text-lg font-mono"
                placeholder="0.00"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                {selectedProduct?.unit}
              </span>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConsumeModal(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConsume}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
