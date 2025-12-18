import React, { useState, useRef, useEffect } from "react";
import { Plus, Search, Clock } from "lucide-react";
import { calculateMonthlyNeed } from "../../utils/formatters.jsx";

const AddProductForm = ({ catalog, householdSize, onAddProduct }) => {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("Staples");
  const [quantity, setQuantity] = useState("");
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

  // Click outside listener for suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (val.length > 0) {
      const matches = catalog.filter((item) =>
        item.item_name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(matches.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item) => {
    setName(item.item_name);
    setUnit(item.consumption_unit);
    setCategory(item.category);
    // Smart Calculation
    const weeklyNeed = item.daily_consumption_per_person * householdSize * 7;
    const roundedNeed = Math.max(0.5, Math.round(weeklyNeed * 2) / 2);
    setUsageQty(roundedNeed);
    setUsagePeriod("7");
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !quantity) return;

    // Send data to parent
    onAddProduct({
      name,
      unit,
      category,
      quantity: parseFloat(quantity),
      usageQty: parseFloat(usageQty),
      usageDays: parseFloat(usagePeriod),
    });

    // Reset Form
    setName("");
    setQuantity("");
    setUsageQty(1);
    setUsagePeriod("7");
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-10 shadow-lg relative z-0">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-amber-400" /> Quick Add Item
      </h2>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-12 gap-4">
        {/* Name Input with Suggestions */}
        <div className="md:col-span-3 relative" ref={wrapperRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={handleNameChange}
            onFocus={() => name && setShowSuggestions(true)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:border-amber-500/50 outline-none transition"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectSuggestion(item)}
                  className="px-4 py-3 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0 flex justify-between items-center group"
                >
                  <span className="text-sm font-medium text-white group-hover:text-amber-400">
                    {item.item_name}
                  </span>
                  <span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Select */}
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

        {/* Quantity Input */}
        <div className="md:col-span-2 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold uppercase">
            Qty
          </span>
          <input
            type="number"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:border-amber-500/50 outline-none transition"
          />
        </div>

        {/* Unit Select */}
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

        {/* Submit Button */}
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition border border-zinc-700 h-full"
          >
            Add Stock
          </button>
        </div>

        {/* Rate Logic */}
        <div className="md:col-span-12 grid md:grid-cols-12 gap-4 border-t border-zinc-800 pt-4 mt-2">
          <div className="md:col-span-3 flex items-center">
            <label className="text-xs font-bold text-amber-500 uppercase flex items-center gap-2">
              <Clock className="w-3 h-3" /> Consumption Rate:
            </label>
          </div>
          <div className="md:col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
              Use
            </span>
            <input
              type="number"
              value={usageQty}
              onChange={(e) => setUsageQty(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 outline-none focus:border-amber-500 text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={usagePeriod}
              onChange={(e) => setUsagePeriod(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 outline-none focus:border-amber-500 text-sm"
            >
              <option value="1">Daily</option>
              <option value="7">Weekly (7 Days)</option>
              <option value="14">Bi-Weekly (14 Days)</option>
              <option value="30">Monthly (30 Days)</option>
              <option value="60">Every 2 Months</option>
            </select>
          </div>
          <div className="md:col-span-4 flex items-center text-xs text-zinc-500 bg-zinc-950/30 px-3 rounded-lg border border-dashed border-zinc-800">
            <span>
              ≈ You need approx{" "}
              <strong>
                {calculateMonthlyNeed(usageQty, usagePeriod)} {unit}
              </strong>{" "}
              per month.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProductForm;
