import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ListPlus,
  ChefHat,
  DollarSign,
  Plus,
  X,
  Loader2,
  TrendingUp,
  Brain,
  Zap,
} from "lucide-react";

// Components
import Navbar from "../components/dashboard/NavBar";
import AddProductForm from "../components/dashboard/AddProductForm";
import InventoryTable from "../components/dashboard/InventoryTable";
import ConsumeModal from "../components/dashboard/ConsumeModal";
import BudgetGuard from "../components/dashboard/BudgetGuard";

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [householdSize, setHouseholdSize] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // AI Stats State
  const [aiStats, setAiStats] = useState({ txns: 0, patterns: 0 });

  // Toggle State
  const [showAddForm, setShowAddForm] = useState(false);

  // Modal States
  const [showConsumeModal, setShowConsumeModal] = useState(false);

  // Trigger state for refreshing child components
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    } else {
      fetchData();
    }
  }, [userId, navigate, refreshTrigger]);

  const fetchData = async () => {
    await Promise.all([
      fetchProducts(),
      fetchCatalog(),
      fetchUserProfile(),
      fetchAiStats(),
    ]);
    setLoading(false);
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/user/${userId}/profile`);
      const data = await res.json();
      if (data.success) setHouseholdSize(data.user.household_size || 1);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAiStats = async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/analytics/status?userId=${userId}`,
      );
      const data = await res.json();
      if (data.success) {
        setAiStats({
          txns: data.stats.total_txns,
          patterns: data.stats.patterns_found,
        });
      }
    } catch (e) {
      console.error("AI Stats failed", e);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/catalog`);
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/products?userId=${userId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      await fetch("http://127.0.0.1:5000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productData, userId }),
      });
      setRefreshTrigger((prev) => prev + 1);
      setShowAddForm(false);
    } catch (error) {
      console.error("Add error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await fetch(`http://127.0.0.1:5000/products/${id}`, { method: "DELETE" });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const onConsumeClick = (product) => {
    setSelectedProduct(product);
    setShowConsumeModal(true);
  };

  const handleRestockSubmit = async (productId, data) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/products/${productId}/restock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, userId }),
        },
      );

      if (res.ok) {
        setRefreshTrigger((prev) => prev + 1);
      } else {
        console.error("Restock failed");
      }
    } catch (error) {
      console.error("Restock error:", error);
    }
  };

  return (
    <div className="min-h-screen theme-bg font-sans">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-6 mb-8">
          {/* TITLE & INTRO */}
          <div>
            <h1 className="text-3xl font-bold text-1 flex items-center gap-2">
              <Package className="accent-1" /> Inventory Dashboard
            </h1>
            <p className="text-2 mt-1">
              Manage your pantry and track consumption.
            </p>
          </div>

          {/* --- WIDGETS ROW --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. ULTRA-MINIMAL AI BRAIN STATUS */}
            <div className="surface-1 border border-1 rounded-2xl p-5 flex items-center gap-5 shadow-elevated">
              <div className="surface-2 p-3 rounded-full border border-1">
                <Brain className="w-6 h-6 accent-1" />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-sm text-1">
                    AI Training Status
                  </h3>
                  <span className="text-[10px] accent-1 bg-emerald-500/10 border border-1 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    Active
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-2 mt-1.5">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-3" />
                    Analyzed{" "}
                    <span className="font-mono text-1 text-sm font-bold">
                      {aiStats.txns}
                    </span>{" "}
                    Txns
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-3" />
                    Learned{" "}
                    <span className="font-mono text-1 text-sm font-bold">
                      {aiStats.patterns}
                    </span>{" "}
                    Patterns
                  </span>
                </div>
              </div>
            </div>

            {/* 2. BUDGET GUARD - Ensure this component also uses text-1, text-2 classes internally */}
            <BudgetGuard userId={userId} key={refreshTrigger} />
          </div>
          {/* --------------------------------------------- */}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center px-5 py-3 rounded-xl font-bold transition-all transform hover:scale-[1.02] ${
              showAddForm
                ? "surface-2 text-1 border border-1 hover:surface-3"
                : "bg-accent-1 shadow-elevated"
            }`}
          >
            {showAddForm ? (
              <>
                <X className="w-5 h-5 mr-2 text-2" /> Close Form
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" /> Add Product
              </>
            )}
          </button>

          <button
            onClick={() => navigate("/recipes")}
            className="flex items-center px-4 py-3 surface-1 hover:surface-2 text-1 font-bold rounded-xl border border-1 transition-all transform hover:scale-[1.02]"
          >
            <ChefHat className="w-5 h-5 mr-2 text-2" /> Smart Cook
          </button>

          <button
            onClick={() => navigate("/market-prices")}
            className="flex items-center px-4 py-3 surface-1 hover:surface-2 text-1 font-bold rounded-xl border border-1 transition-all transform hover:scale-[1.02]"
          >
            <DollarSign className="w-5 h-5 mr-2 text-2" /> Prices
          </button>

          <button
            onClick={() => navigate("/shopping-list")}
            className="flex items-center px-5 py-3 bg-accent-2 shadow-elevated rounded-xl font-bold transition-all transform hover:scale-[1.02]"
          >
            <ListPlus className="w-5 h-5 mr-2" /> Shopping List
          </button>

          <button
            onClick={() => navigate("/forecast")}
            className="flex items-center px-4 py-3 surface-1 hover:surface-2 text-1 font-bold rounded-xl border border-1 transition-all transform hover:scale-[1.02]"
          >
            <TrendingUp className="w-5 h-5 mr-2 text-2" /> Forecast
          </button>
        </div>

        {/* --- CONDITIONAL FORM --- */}
        {showAddForm && (
          <div className="mb-8 animate-fade-in-down">
            <AddProductForm
              catalog={catalog}
              householdSize={householdSize}
              onAddProduct={handleAddProduct}
            />
          </div>
        )}

        {/* LOADING OR TABLE */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin accent-1" />
          </div>
        ) : (
          <InventoryTable
            products={products}
            householdSize={householdSize}
            onConsumeClick={onConsumeClick}
            onRestockSubmit={handleRestockSubmit}
            onDeleteClick={handleDelete}
            onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}
      </div>

      {showConsumeModal && selectedProduct && (
        <ConsumeModal
          product={selectedProduct}
          userId={userId}
          onClose={() => setShowConsumeModal(false)}
          onConsumeComplete={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}
    </div>
  );
};

export default Dashboard;
