import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ListPlus, ChefHat } from "lucide-react"; // Import ChefHat

// Components
import Navbar from "../components/dashboard/Navbar";
import AddProductForm from "../components/dashboard/AddProductForm";
import InventoryTable from "../components/dashboard/InventoryTable";
import GenerateListModal from "../components/dashboard/GenerateListModal";
import ConsumeModal from "../components/dashboard/ConsumeModal";
import RestockModal from "../components/dashboard/RestockModal";
// Removed RecipeMatcher import from here

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [householdSize, setHouseholdSize] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);

  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    } else {
      fetchProducts();
      fetchCatalog();
      fetchUserProfile();
    }
  }, [userId, navigate]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/user/${userId}/profile`);
      const data = await res.json();
      if (data.success) setHouseholdSize(data.user.household_size || 1);
    } catch (err) {
      console.error(err);
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
        `http://127.0.0.1:5000/products?userId=${userId}`
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
      fetchProducts();
    } catch (error) {
      console.error("Add error:", error);
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

  // --- Handlers for Table Actions ---
  const onConsumeClick = (product) => {
    setSelectedProduct(product);
    setShowConsumeModal(true);
  };

  const onRestockClick = (product) => {
    setSelectedProduct(product);
    setShowRestockModal(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Package className="text-amber-400" /> Inventory Dashboard
            </h1>
            <p className="text-zinc-400 mt-1">
              Manage your pantry and track consumption.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            {/* NEW RECIPE BUTTON */}
            <button
              onClick={() => navigate("/recipes")}
              className="flex items-center px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 transition-all transform hover:scale-[1.02]"
            >
              <ChefHat className="w-5 h-5 mr-2 text-amber-500" /> Smart Cook
            </button>

            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02]"
            >
              <ListPlus className="w-5 h-5 mr-2" /> Create Shopping List
            </button>
          </div>
        </div>

        <AddProductForm
          catalog={catalog}
          householdSize={householdSize}
          onAddProduct={handleAddProduct}
        />

        <InventoryTable
          products={products}
          householdSize={householdSize}
          onConsumeClick={onConsumeClick}
          onRestockClick={onRestockClick}
          onDeleteClick={handleDelete}
        />

        {/* Removed RecipeMatcher from here */}
      </div>

      {showGenerateModal && (
        <GenerateListModal
          userId={userId}
          onClose={() => setShowGenerateModal(false)}
          onGenerateSuccess={(listId) => {
            setShowGenerateModal(false);
            navigate(`/shopping-list/${listId}`);
          }}
        />
      )}

      {showConsumeModal && selectedProduct && (
        <ConsumeModal
          product={selectedProduct}
          userId={userId}
          onClose={() => setShowConsumeModal(false)}
          onConsumeComplete={fetchProducts}
        />
      )}

      {showRestockModal && selectedProduct && (
        <RestockModal
          product={selectedProduct}
          userId={userId}
          onClose={() => setShowRestockModal(false)}
          onRestockComplete={fetchProducts}
        />
      )}
    </div>
  );
};

export default Dashboard;
