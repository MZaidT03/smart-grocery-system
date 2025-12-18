import React, { useState } from "react";
import { Plus, Package } from "lucide-react";
import { formatDisplayQty } from "../../utils/formatters";

const RestockModal = ({ product, onClose, userId, onRestockComplete }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);

    try {
      // We use the same 'POST /products' endpoint which handles Upsert (Add to existing)
      await fetch("http://127.0.0.1:5000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          unit: product.unit,
          category: product.category,
          quantity: parseFloat(amount), // This amount gets ADDED to existing in backend logic
          userId,
          // We pass existing rate info so it doesn't get overwritten with defaults
          usageQty: product.usage_freq_qty,
          usageDays: product.usage_freq_days,
        }),
      });
      onRestockComplete();
      onClose();
    } catch (error) {
      console.error("Restock error:", error);
      alert("Failed to restock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-700 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-500" /> Add Stock
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Adding inventory for <strong>{product.name}</strong>
        </p>

        {/* Current Stock */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 mb-4 flex justify-between items-center">
          <span className="text-zinc-400 text-sm">Current Level:</span>
          <span className="text-white font-mono font-bold">
            {formatDisplayQty(product.quantity, product.unit)}
          </span>
        </div>

        {/* Amount Input */}
        <div className="relative mb-6">
          <label className="block text-xs font-bold text-emerald-500 uppercase mb-2">
            Quantity to Add
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 px-4 py-3 rounded-xl text-white focus:border-emerald-500 outline-none text-2xl font-mono text-center"
            placeholder="0.00"
            autoFocus
          />
          <span className="absolute right-4 bottom-4 text-zinc-600 text-sm font-medium">
            {product.unit}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 border-t border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !amount}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold transition text-sm disabled:opacity-50"
          >
            {loading ? "Updating..." : "Add Stock"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestockModal;
