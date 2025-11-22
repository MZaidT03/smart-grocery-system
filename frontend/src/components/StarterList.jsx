import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Users,
  Calendar,
  Leaf,
  ArrowRight,
  Check,
  Trash2,
  Plus,
  ShoppingBag,
  Save,
  Tag,
  Loader2,
} from "lucide-react";

const StarterList = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // --- State ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 Inputs
  const [members, setMembers] = useState(4);
  const [dietType, setDietType] = useState("Non-Vegan");

  // Step 2 Data
  const [listId, setListId] = useState(null);
  const [generatedList, setGeneratedList] = useState([]);
  const [newItemName, setNewItemName] = useState("");

  // --- Handlers ---

  // STEP 1: Save Prefs & Generate Draft List
  const handleGenerate = async () => {
    setLoading(true);
    try {
      // 1. Save Preferences
      await fetch("http://127.0.0.1:5000/onboarding/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, householdSize: members, dietType }),
      });

      // 2. Generate List on Server
      const res = await fetch(
        "http://127.0.0.1:5000/onboarding/generate-list",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setListId(data.listId);
        await fetchListItems(data.listId);
        setStep(2);
      } else {
        alert(data.message || "Failed to generate list");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Fetch items for the current list
  const fetchListItems = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/shopping-list/${id}`);
      const data = await res.json();
      if (data.success) {
        // Only show items that haven't been "deleted" (deselected)
        const activeItems = data.items.filter((i) => i.is_selected === 1);
        setGeneratedList(activeItems);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // STEP 2: Live Edits
  const handleUpdateItem = async (itemId, field, value) => {
    // Optimistic UI Update
    setGeneratedList((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, [field]: value } : item
      )
    );

    // API Call (Debounce could be added here for perf)
    try {
      await fetch(`http://127.0.0.1:5000/shopping-list/item/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    // Optimistic UI
    setGeneratedList((prev) => prev.filter((item) => item.item_id !== itemId));

    // API Call (Soft delete via isSelected=0)
    try {
      await fetch(`http://127.0.0.1:5000/shopping-list/item/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: false }),
      });
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/shopping-list/${listId}/item`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newItemName,
            quantity: 1,
            unit: "kg",
            category: "Other",
          }),
        }
      );
      if (res.ok) {
        setNewItemName("");
        fetchListItems(listId); // Refresh list
      }
    } catch (error) {
      console.error("Add failed", error);
    }
  };

  // STEP 3: Confirm & Import
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/shopping-list/${listId}/confirm`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("onboardingComplete", "true");
        navigate("/dashboard");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---

  if (step === 1)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 font-sans text-white">
        <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <Sparkles className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
            <h1 className="text-3xl font-bold">Smart Setup</h1>
            <p className="text-zinc-400 mt-2">
              Generate a Grocery List based on Pakistani consumption patterns.
            </p>
          </div>

          <div className="space-y-6">
            {/* Family Size */}
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
              <label className="flex items-center text-zinc-300 mb-4 font-medium">
                <Users className="w-5 h-5 mr-2 text-emerald-400" /> Household
                Size:{" "}
                <span className="ml-auto text-2xl font-bold text-emerald-400">
                  {members}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="12"
                value={members}
                onChange={(e) => setMembers(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-2">
                <span>1 Person</span>
                <span>12 People</span>
              </div>
            </div>

            {/* Diet Preference */}
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setDietType("Non-Vegan")}
                className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center justify-center transition-all ${
                  dietType === "Non-Vegan"
                    ? "bg-emerald-500/10 border-emerald-500 text-white"
                    : "bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                <span className="font-bold mb-1">Non-Vegan</span>
                <span className="text-xs opacity-70">Meat & Dairy</span>
              </div>
              <div
                onClick={() => setDietType("Vegan")}
                className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center justify-center transition-all ${
                  dietType === "Vegan"
                    ? "bg-green-500/10 border-green-500 text-green-400"
                    : "bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                <Leaf className="w-5 h-5 mb-2" />
                <span className="font-bold">Vegan</span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex justify-center items-center transition shadow-lg shadow-emerald-900/20"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Generate My List <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full text-zinc-500 text-sm hover:text-zinc-300 transition"
            >
              Skip Setup
            </button>
          </div>
        </div>
      </div>
    );

  // STEP 2 RENDER
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6">
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <ShoppingBag className="text-emerald-400" /> Review Your List
            </h1>
            <p className="text-zinc-400 mt-1">
              We calculated these estimates for{" "}
              <strong>{members} people</strong>. Adjust as needed before
              importing.
            </p>
          </div>

          <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <input
              type="text"
              placeholder="Add item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="bg-transparent border-none px-3 py-2 text-sm focus:outline-none text-white w-40"
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            />
            <button
              onClick={handleAddItem}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-md transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {generatedList.map((item) => (
                  <tr
                    key={item.item_id}
                    className="hover:bg-zinc-800/30 group transition"
                  >
                    {/* Name */}
                    <td className="px-6 py-3 font-medium text-zinc-200">
                      {item.item_name}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs border border-zinc-700">
                        <Tag className="w-3 h-3 mr-1" />
                        {item.category || "General"}
                      </span>
                    </td>

                    {/* Quantity Input */}
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        value={item.final_quantity}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.item_id,
                            "quantity",
                            parseFloat(e.target.value)
                          )
                        }
                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 w-24 text-white focus:border-emerald-500 focus:outline-none transition font-mono text-sm"
                      />
                    </td>

                    {/* Unit Select */}
                    <td className="px-6 py-3">
                      <span className="text-sm text-zinc-500">{item.unit}</span>
                    </td>

                    {/* Delete */}
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.item_id)}
                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {generatedList.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-zinc-500 italic"
                    >
                      List is empty. Add items manually or go back to
                      regenerate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-3 text-zinc-400 hover:text-white transition"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || generatedList.length === 0}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl flex items-center shadow-lg shadow-emerald-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> Confirm & Import Inventory
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StarterList;
