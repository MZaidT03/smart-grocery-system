import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  CheckCircle,
  Trash2,
  Download,
  ArrowRight,
  Users,
  Utensils,
  Loader2,
  Filter,
  Plus,
  RefreshCcw,
  Sparkles,
  Calendar,
  Check,
  Tag,
  Activity,
  DollarSign,
  Search,
} from "lucide-react";
import Navbar from "../components/dashboard/NavBar";
import { useNavigate, useParams } from "react-router-dom";
import { sanitizeQuantity } from "../utils/mathUtils";

const ShoppingList = () => {
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState([]); // Master Catalog
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // State for Checkout Modal
  const [showCheckout, setShowCheckout] = useState(false);

  // Generator State
  const [userProfile, setUserProfile] = useState({
    household_size: 1,
    diet_preference: "Loading...",
  });
  const [daysToPlan, setDaysToPlan] = useState(7);

  // UI Modes
  const [listId, setListId] = useState(null);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  // --- MANUAL ADD STATE ---
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemCategory, setNewItemCategory] = useState("Staples");
  const [newItemUsageQty, setNewItemUsageQty] = useState(1);
  const [newItemUsagePeriod, setNewItemUsagePeriod] = useState("7");

  // Autocomplete State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const params = useParams();

  const categories = [
    "Staples",
    "Dairy",
    "Vegetables",
    "Fruits",
    "Meat",
    "Bakery",
    "Snacks",
    "Beverages",
    "Spices",
    "Other",
  ];

  useEffect(() => {
    fetchUserProfile();
    fetchCatalog(); // Fetch catalog for autocomplete
    if (params.listId) {
      setListId(params.listId);
      fetchList(params.listId);
    }

    // Click outside to close suggestions
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/user/${userId}/profile`);
      const data = await res.json();
      if (data.success) {
        setUserProfile({
          household_size: data.user.household_size || 1,
          diet_preference: data.user.diet_preference || "Standard",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/catalog`);
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchList = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/shopping-list/${id}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setListId(id);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // --- AUTOCOMPLETE LOGIC ---
  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewItemName(val);
    if (!val) return setShowSuggestions(false);

    const matches = catalog.filter((item) =>
      item.item_name.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(matches.slice(0, 5));
    setShowSuggestions(true);
  };

  const selectSuggestion = (item) => {
    setNewItemName(item.item_name);
    setNewItemUnit(item.consumption_unit);
    setNewItemCategory(item.category);

    // Auto-calculate usage guess based on household size if available
    const estimatedQty = item.daily_consumption_per_person
      ? Math.ceil(
          item.daily_consumption_per_person * userProfile.household_size * 7
        )
      : 1;

    setNewItemUsageQty(estimatedQty);
    setNewItemUsagePeriod("7"); // Default to weekly

    setShowSuggestions(false);
  };

  const handleGenerate = async (mode) => {
    setLoading(true);
    try {
      const payload = {
        userId,
        numDays: daysToPlan,
        numMembers: userProfile.household_size,
        dietType: userProfile.diet_preference,
        useExistingStock: mode === "stock",
      };
      const res = await fetch(`http://127.0.0.1:5000/shopping-list/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setListId(data.listId);
        fetchList(data.listId);
      } else {
        alert("Generation failed: " + data.message);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !listId) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/shopping-list/${listId}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemName: newItemName,

            // --- CHANGE THIS LINE ---
            quantity: sanitizeQuantity(newItemQty, newItemUnit),

            unit: newItemUnit,
            category: newItemCategory,
            usageQty: newItemUsageQty,
            usagePeriod: newItemUsagePeriod,
          }),
        }
      );
      if (res.ok) {
        setNewItemName("");
        setNewItemQty(1);
        fetchList(listId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
    await fetch(`http://127.0.0.1:5000/shopping-list/items/${itemId}`, {
      method: "DELETE",
    });
  };

  const handleUpdateItem = async (itemId, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, [field]: value } : item
      )
    );
    await fetch(`http://127.0.0.1:5000/shopping-list/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  };

  const toggleCheck = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCheckedItemsForModal = () =>
    items.filter((item) => checkedItems[item.item_id]);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const filteredItems = items.filter((item) =>
    showInStockOnly ? item.current_stock > 0 : true
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-32">
      <Navbar user={localStorage.getItem("user")} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-emerald-400" /> Shopping List
          </h1>
          <p className="text-zinc-400 mt-1">
            Plan your grocery run efficiently.
          </p>
        </div>

        {/* --- GENERATOR SECTION --- */}
        {!listId && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-500" /> Create New List
            </h2>
            <div className="flex flex-col xl:flex-row gap-6 items-end">
              <div className="flex gap-4 w-full xl:w-auto">
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex-1 xl:w-48 flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">
                      Household
                    </div>
                    <div className="text-white font-mono">
                      {userProfile.household_size} Person(s)
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex-1 xl:w-48 flex items-center gap-3">
                  <Utensils className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">
                      Diet
                    </div>
                    <div className="text-white font-mono capitalize">
                      {userProfile.diet_preference}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full xl:w-auto">
                <label className="text-xs text-zinc-400 uppercase font-bold mb-2 block">
                  Days to Plan For
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-5 h-5 text-amber-500" />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={daysToPlan}
                    onChange={(e) => setDaysToPlan(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 outline-none font-mono text-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 w-full xl:w-auto">
                <button
                  onClick={() => handleGenerate("stock")}
                  disabled={loading}
                  className="flex-1 xl:flex-none px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-4 h-4 text-emerald-400" />
                  )}{" "}
                  <span className="text-sm">Refill Low Stock</span>
                </button>
                <button
                  onClick={() => handleGenerate("scratch")}
                  disabled={loading}
                  className="flex-1 xl:flex-none px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}{" "}
                  <span className="text-sm">Restock Essentials</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- ACTIVE LIST VIEW --- */}
        {listId && (
          <div className="max-w-5xl mx-auto">
            {/* --- MANUAL ADD BAR (WITH AUTOCOMPLETE) --- */}
            <form
              onSubmit={handleAddItem}
              className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-wrap md:flex-nowrap gap-3 mb-6 shadow-lg items-center relative z-20"
            >
              {/* Name + Autocomplete */}
              <div className="flex-[2] min-w-[200px] relative" ref={wrapperRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Add item (e.g., Milk)"
                    value={newItemName}
                    onChange={handleNameChange}
                    className="w-full bg-transparent px-4 pl-10 py-2 text-white outline-none placeholder:text-zinc-600 border-r border-zinc-800"
                    autoComplete="off"
                  />
                </div>
                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 flex justify-between group transition-colors border-b border-zinc-800 last:border-0"
                      >
                        <span className="text-sm text-white font-medium group-hover:text-amber-400">
                          {s.item_name}
                        </span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">
                          {s.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="flex-1 min-w-[120px]">
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full bg-zinc-900 text-zinc-400 text-sm outline-none px-2 py-2 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2 flex-1 min-w-[140px] bg-zinc-950 rounded-lg px-2 border border-zinc-800">
                <input
                  type="number"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="w-12 bg-transparent py-2 text-center text-white outline-none"
                />
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="bg-transparent text-xs text-zinc-400 outline-none w-14"
                >
                  <option value="kg">kg</option>
                  <option value="liters">L</option>
                  <option value="pcs">pcs</option>
                  <option value="pkt">pkt</option>
                </select>
              </div>

              {/* Consumption */}
              <div className="flex items-center gap-2 flex-[1.5] min-w-[180px] bg-zinc-950 rounded-lg px-2 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold whitespace-nowrap">
                  Use:
                </span>
                <input
                  type="number"
                  value={newItemUsageQty}
                  onChange={(e) => setNewItemUsageQty(e.target.value)}
                  className="w-10 bg-transparent text-center text-white text-sm outline-none"
                />
                <span className="text-zinc-600 text-xs">/</span>
                <select
                  value={newItemUsagePeriod}
                  onChange={(e) => setNewItemUsagePeriod(e.target.value)}
                  className="bg-transparent text-xs text-zinc-400 outline-none w-16"
                >
                  <option value="1">Day</option>
                  <option value="7">Week</option>
                  <option value="30">Month</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-zinc-800 hover:bg-zinc-700 text-amber-500 p-3 rounded-lg transition shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {/* Filter Toggle */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowInStockOnly(!showInStockOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showInStockOnly
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                }`}
              >
                <Filter className="w-3 h-3" />
                {showInStockOnly ? "In-Stock Only" : "Filter Inventory"}
              </button>
            </div>

            {/* LIST ITEMS */}
            <div className="space-y-3 relative z-10">
              {items
                .filter((item) =>
                  showInStockOnly ? item.current_stock > 0 : true
                )
                .map((item) => {
                  const isChecked = checkedItems[item.item_id];
                  const containerClass = isChecked
                    ? "bg-emerald-900/10 border-emerald-500/30 opacity-75"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700";
                  const textClass = isChecked
                    ? "line-through text-zinc-500"
                    : "text-zinc-200";

                  return (
                    <div
                      key={item.item_id}
                      onClick={() => toggleCheck(item.item_id)}
                      className={`${containerClass} relative p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between group transition-all duration-200 cursor-pointer border select-none gap-4`}
                    >
                      {/* Left Section */}
                      <div className="flex-1 flex items-center gap-4 w-full">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-500 scale-110"
                              : "border-zinc-600 group-hover:border-zinc-400"
                          }`}
                        >
                          {isChecked && (
                            <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                          )}
                        </div>

                        <div className="flex-1">
                          <h3
                            className={`font-bold text-lg transition-colors ${textClass}`}
                          >
                            {item.item_name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-400">
                              <Tag className="w-3 h-3" /> {item.category}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-400">
                              <Activity className="w-3 h-3" />
                              {item.daily_consumption_per_person
                                ? `${(
                                    item.daily_consumption_per_person * 7
                                  ).toFixed(1)} ${item.unit} / week`
                                : "Auto"}
                            </span>
                            {item.current_stock > 0 ? (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wide transition-colors ${
                                  isChecked
                                    ? "bg-transparent text-zinc-600 border-zinc-700"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                }`}
                              >
                                Refill
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wide transition-colors ${
                                  isChecked
                                    ? "bg-transparent text-zinc-600 border-zinc-700"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                }`}
                              >
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Section: Controls */}
                      <div
                        className="flex items-center gap-4 w-full md:w-auto justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={`flex items-center bg-zinc-950 rounded-lg border overflow-hidden transition-colors ${
                            isChecked
                              ? "border-transparent opacity-50"
                              : "border-zinc-800"
                          }`}
                        >
                          <input
                            type="number"
                            value={item.adjusted_quantity}
                            disabled={isChecked}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.item_id,
                                "adjustedQuantity",
                                e.target.value
                              )
                            }
                            className="w-16 bg-transparent py-2 text-center text-amber-400 font-bold outline-none disabled:text-zinc-600"
                          />
                          <span className="pr-3 text-xs text-zinc-600 font-medium bg-zinc-950 py-2">
                            {item.unit}
                          </span>
                        </div>
                        {!isChecked && (
                          <button
                            onClick={() => handleDeleteItem(item.item_id)}
                            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* CHECKOUT FLOATING BUTTON */}
            <div
              className={`fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none transition-all duration-500 ${
                checkedCount > 0
                  ? "translate-y-0 opacity-100"
                  : "translate-y-20 opacity-0"
              }`}
            >
              <button
                onClick={() => setShowCheckout(true)}
                className="pointer-events-auto shadow-2xl shadow-emerald-500/40 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-full flex items-center gap-3 transform hover:scale-105 transition-all"
              >
                <CheckCircle className="w-5 h-5 fill-black text-emerald-500" />
                Checkout ({checkedCount} items)
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <CheckoutModal
            items={getCheckedItemsForModal()}
            userId={userId}
            listId={listId}
            onClose={() => setShowCheckout(false)}
            onComplete={() => {
              setShowCheckout(false);
              navigate("/dashboard");
            }}
          />
        )}
      </div>
    </div>
  );
};

// --- CHECKOUT MODAL ---
const CheckoutModal = ({ items, userId, listId, onClose, onComplete }) => {
  const [confirmItems, setConfirmItems] = useState(
    items.map((i) => ({
      ...i,
      qty: i.adjusted_quantity,
      name: i.item_name,
      price: "",
      shelfLife: getDefaultShelfLife(i.category),
      // Default usage to what we estimated or 1/week
      usageQty: i.daily_consumption_per_person
        ? (i.daily_consumption_per_person * 7).toFixed(1)
        : 1,
      usagePeriod: 7,
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  function getDefaultShelfLife(cat) {
    if (!cat) return 30;
    const c = cat.toLowerCase();
    if (c.includes("dairy") || c.includes("vegetable") || c.includes("fruit"))
      return 7;
    if (c.includes("meat") || c.includes("chicken")) return 3;
    if (c.includes("bakery")) return 5;
    if (c.includes("staples") || c.includes("oil") || c.includes("rice"))
      return 180;
    return 30;
  }

  const updateItem = (index, field, value) => {
    const newItems = [...confirmItems];
    newItems[index][field] = value;
    setConfirmItems(newItems);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const processedItems = confirmItems.map((item) => ({
      ...item,

      qty: sanitizeQuantity(item.qty, item.unit),
    }));
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/shopping-list/${listId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: confirmItems }),
        }
      );
      const data = await res.json();
      if (data.success) {
        onComplete();
      } else {
        alert("Error: " + data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Review & Confirm</h2>
          <p className="text-zinc-400 text-sm">
            Set shelf life and consumption rates for accurate tracking.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">
            <div className="col-span-3">Item</div>
            <div className="col-span-2">Qty Bought</div>
            <div className="col-span-2">Total Price</div>
            <div className="col-span-2">Shelf Life (Days)</div>
            <div className="col-span-3">Consumption Rate</div>
          </div>

          {confirmItems.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-3 items-start bg-zinc-950 p-3 rounded-xl border border-zinc-800"
            >
              {/* 1. Item Info */}
              <div className="col-span-3">
                <div
                  className="font-bold text-white text-sm truncate"
                  title={item.name}
                >
                  {item.name}
                </div>
                <div className="text-[10px] text-zinc-500">{item.category}</div>
              </div>

              {/* 2. Quantity */}
              <div className="col-span-2 relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.qty}
                  onChange={(e) => updateItem(idx, "qty", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-emerald-500 font-mono"
                />
                <span className="absolute right-1 top-2 text-[10px] text-zinc-600 pointer-events-none">
                  {item.unit}
                </span>
              </div>

              {/* 3. Price */}
              <div className="col-span-2 relative">
                <span className="absolute left-2 top-2 text-zinc-500 text-xs">
                  Rs
                </span>
                <input
                  type="number"
                  placeholder="Total"
                  min="0"
                  value={item.price}
                  onChange={(e) => updateItem(idx, "price", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 pl-6 text-white text-sm outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* 4. Shelf Life */}
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  value={item.shelfLife}
                  onChange={(e) => updateItem(idx, "shelfLife", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-sm outline-none focus:border-amber-500 text-center font-mono"
                />
              </div>

              {/* 5. Consumption Rate (FIX) */}
              <div className="col-span-3 flex gap-1">
                <div className="relative flex-1">
                  <span className="absolute left-1 top-2 text-[9px] text-zinc-600 uppercase">
                    Use
                  </span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.usageQty}
                    onChange={(e) =>
                      updateItem(idx, "usageQty", e.target.value)
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 pl-6 text-white text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="flex-1">
                  <select
                    value={item.usagePeriod}
                    onChange={(e) =>
                      updateItem(idx, "usagePeriod", e.target.value)
                    }
                    className="w-full h-full bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-400 outline-none px-1"
                  >
                    <option value="1">/ Day</option>
                    <option value="7">/ Week</option>
                    <option value="30">/ Month</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-zinc-400 hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm & Add to Inventory
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;
