import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  Calendar,
  Tag,
  Layers,
  Scale,
} from "lucide-react";
import { calculateMonthlyNeed } from "../../utils/formatters.jsx";

const AddProductForm = ({ catalog, householdSize, onAddProduct }) => {
  // ... (State logic remains exactly the same) ...
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("Staples");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [shelfLife, setShelfLife] = useState(7);
  const [usageQty, setUsageQty] = useState(1);
  const [usagePeriod, setUsagePeriod] = useState("7");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!val) return setShowSuggestions(false);

    const matches = catalog.filter((item) =>
      item.item_name.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(matches.slice(0, 5));
    setShowSuggestions(true);
  };

  const selectSuggestion = (item) => {
    setName(item.item_name);
    setUnit(item.consumption_unit);
    setCategory(item.category);

    if (["Dairy", "Meat", "Fruits"].includes(item.category)) setShelfLife(5);
    else if (["Vegetables", "Bakery"].includes(item.category)) setShelfLife(7);
    else setShelfLife(180);

    const weeklyNeed = item.daily_consumption_per_person * householdSize * 7;
    setUsageQty(Math.max(0.5, Math.round(weeklyNeed * 2) / 2));
    setUsagePeriod("7");
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !quantity) return;

    onAddProduct({
      name,
      unit,
      category,
      quantity: +quantity,
      price: +price || 0,
      shelfLife: +shelfLife,
      usageQty: +usageQty,
      usageDays: +usagePeriod,
    });

    setName("");
    setQuantity("");
    setPrice("");
    setShelfLife(7);
    setUsageQty(1);
    setUsagePeriod("7");
  };

  const monthlyNeed = calculateMonthlyNeed(usageQty, usagePeriod);
  const monthlyCost =
    price && quantity > 0 && monthlyNeed
      ? ((price / quantity) * monthlyNeed).toFixed(0)
      : 0;

  // Reusable styles for consistency
  const labelStyle =
    "block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide";
  const inputStyle =
    "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all";
  const iconInputWrapper = "relative";
  const iconStyle = "absolute left-3 top-3 w-4 h-4 text-zinc-500";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-950/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Plus className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-white">Add Inventory</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* SECTION 1: BASIC INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name (Full Width on Mobile) */}
          <div className="md:col-span-2 relative" ref={wrapperRef}>
            <label className={labelStyle}>Product Name</label>
            <div className={iconInputWrapper}>
              <Search className={iconStyle} />
              <input
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Basmati Rice"
                className={`${inputStyle} pl-10`}
                autoComplete="off"
              />
            </div>
            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 flex justify-between group transition-colors"
                  >
                    <span className="text-sm text-white group-hover:text-amber-400">
                      {s.item_name}
                    </span>
                    <span className="text-xs text-zinc-500">{s.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className={labelStyle}>Category</label>
            <div className={iconInputWrapper}>
              <Tag className={iconStyle} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputStyle} pl-10 appearance-none`}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Unit Group */}
          <div>
            <label className={labelStyle}>Current Stock</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Scale className={iconStyle} />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className={`${inputStyle} pl-10`}
                />
              </div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-white text-sm outline-none focus:border-amber-500"
              >
                <option value="kg">kg</option>
                <option value="liters">L</option>
                <option value="pcs">pcs</option>
                <option value="pkt">pkt</option>
              </select>
            </div>
          </div>
        </div>

        <div className="h-px bg-zinc-800 w-full" />

        {/* SECTION 2: COSTS & SHELF LIFE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>Total Price Paid (PKR)</label>
            <div className={iconInputWrapper}>
              <DollarSign className={`${iconStyle} text-emerald-500`} />
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className={`${inputStyle} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className={labelStyle}>Estimated Shelf Life (Days)</label>
            <div className={iconInputWrapper}>
              <Calendar className={`${iconStyle} text-orange-400`} />
              <input
                type="number"
                min="1"
                value={shelfLife}
                onChange={(e) => setShelfLife(e.target.value)}
                placeholder="7"
                className={`${inputStyle} pl-10`}
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-zinc-800 w-full" />

        {/* SECTION 3: CONSUMPTION & SUMMARY */}
        <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-zinc-300">
              Consumption Pattern
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Consumption Inputs */}
            <div>
              <label className={labelStyle}>I typically use...</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={usageQty}
                  onChange={(e) => setUsageQty(e.target.value)}
                  className={`${inputStyle} text-center`}
                  style={{ width: "80px" }}
                />
                <span className="text-sm text-zinc-500 font-medium">
                  {unit}
                </span>
                <span className="text-sm text-zinc-500">every</span>
                <select
                  value={usagePeriod}
                  onChange={(e) => setUsagePeriod(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500"
                >
                  <option value="1">Day</option>
                  <option value="7">Week</option>
                  <option value="30">Month</option>
                </select>
              </div>
            </div>

            {/* Live Summary Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex justify-between items-center">
              <div>
                <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                  Projected Monthly Need
                </div>
                <div className="text-xl font-mono text-white mt-1">
                  {monthlyNeed}{" "}
                  <span className="text-sm text-zinc-500">{unit}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                  Est. Cost
                </div>
                <div className="text-sm font-mono text-emerald-400 mt-1">
                  {monthlyCost > 0 ? `Rs ${monthlyCost}` : "--"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
          Add Item to Inventory
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;
