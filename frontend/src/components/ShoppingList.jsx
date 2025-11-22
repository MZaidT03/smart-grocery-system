import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Trash2,
  Plus,
  Save,
  Loader2,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";

const ShoppingList = () => {
  const { listId } = useParams();
  const navigate = useNavigate();

  const [listMeta, setListMeta] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // Manual Add State
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("kg");

  useEffect(() => {
    fetchListDetails();
  }, [listId]);

  const fetchListDetails = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/shopping-list/${listId}`);
      const data = await res.json();
      if (data.list) {
        setListMeta(data.list);
        // The unified backend returns 'final_quantity' alias, but also 'adjusted_quantity'
        setItems(data.items);
      } else {
        alert("List not found");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleUpdateItem = async (itemId, field, value) => {
    // 1. Optimistic UI Update
    setItems((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, [field]: value } : item
      )
    );

    // 2. API Call (using plural 'items' to match app.py)
    try {
      await fetch(`http://127.0.0.1:5000/shopping-list/items/${itemId}`, {
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
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));

    try {
      await fetch(`http://127.0.0.1:5000/shopping-list/items/${itemId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/shopping-list/${listId}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemName: newItemName,
            quantity: newItemQty,
            unit: newItemUnit,
            category: "Custom",
          }),
        }
      );

      if (res.ok) {
        setNewItemName("");
        setNewItemQty(1);
        fetchListDetails(); // Reload to get new ID and formatting
      }
    } catch (error) {
      console.error("Add failed", error);
    }
  };

  const handleConfirmList = async () => {
    setConfirming(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/shopping-list/${listId}/confirm`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (data.success) {
        navigate("/dashboard");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error confirming list");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-zinc-800 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {listMeta?.list_name || "Shopping List"}
            </h1>
            <p className="text-xs text-zinc-500">
              {items.length} Items • {listMeta?.diet_type}
            </p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-amber-500">
            For {listMeta?.num_days} Days
          </p>
          <p className="text-xs text-zinc-500">
            {listMeta?.num_members} Members
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ADD ITEM INPUT */}
        <form
          onSubmit={handleAddItem}
          className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 flex gap-2 mb-6 shadow-lg"
        >
          <input
            type="text"
            placeholder="Add extra item (e.g., Dish Soap)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 bg-transparent px-4 py-2 text-white outline-none placeholder:text-zinc-600"
          />
          <input
            type="number"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
            className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-center text-white outline-none focus:border-amber-500"
          />
          <select
            value={newItemUnit}
            onChange={(e) => setNewItemUnit(e.target.value)}
            className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-sm text-zinc-400 outline-none"
          >
            <option value="kg">kg</option>
            <option value="liters">L</option>
            <option value="dozen">doz</option>
            <option value="pcs">pcs</option>
            <option value="packet">pkt</option>
          </select>
          <button
            type="submit"
            className="bg-zinc-800 hover:bg-zinc-700 text-amber-500 p-3 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>

        {/* ITEMS LIST */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.item_id}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-200">{item.item_name}</h3>
                  {item.category !== "Custom" && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700 uppercase tracking-wider">
                      {item.category}
                    </span>
                  )}
                </div>
                {item.current_stock > 0 && (
                  <p className="text-xs text-emerald-500/80 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> You have {item.current_stock}{" "}
                    {item.consumption_unit} at home
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Quantity Editor */}
                <div className="flex items-center bg-zinc-950 rounded-lg border border-zinc-800">
                  <input
                    type="number"
                    value={item.adjusted_quantity}
                    onChange={(e) =>
                      handleUpdateItem(
                        item.item_id,
                        "adjustedQuantity",
                        e.target.value
                      )
                    }
                    className="w-16 bg-transparent py-2 text-center text-amber-400 font-bold outline-none"
                  />
                  <span className="pr-3 text-xs text-zinc-600 font-medium select-none">
                    {item.consumption_unit}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteItem(item.item_id)}
                  className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Your list is empty.</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/90 backdrop-blur border-t border-zinc-900 flex justify-center">
        <div className="w-full max-w-4xl flex gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition"
          >
            Save Draft & Exit
          </button>
          <button
            onClick={handleConfirmList}
            disabled={confirming || items.length === 0}
            className="flex-[2] py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-xl shadow-lg shadow-amber-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {confirming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {confirming
              ? "Updating Inventory..."
              : "Confirm & Update Inventory"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;
