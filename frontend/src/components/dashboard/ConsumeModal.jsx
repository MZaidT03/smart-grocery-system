import React, { useState } from "react";
import { Activity } from "lucide-react";
import { formatDisplayQty } from "../../utils/formatters.jsx";

const ConsumeModal = ({ product, onClose, userId, onConsumeComplete }) => {
  const [consumeAmount, setConsumeAmount] = useState("");

  const handleConfirm = async () => {
    const newRateQty = document.getElementById("modal_rate_qty").value;
    const newRateDays = document.getElementById("modal_rate_days").value;

    try {
      await fetch("http://127.0.0.1:5000/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          amount: parseFloat(consumeAmount),
          userId,
          newRateQty: parseFloat(newRateQty),
          newRateDays: parseFloat(newRateDays),
        }),
      });
      onConsumeComplete();
      onClose();
    } catch (error) {
      console.error("Consume error:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-700 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">Log Consumption</h2>
        <p className="text-xs text-zinc-500 mb-4">
          This will deduct stock and reset the auto-consumption timer.
        </p>

        {/* Stock Display */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 mb-4 flex justify-between items-center">
          <span className="text-zinc-400 text-sm">Current Stock:</span>
          <span className="text-white font-mono font-bold">
            {formatDisplayQty(product.quantity, product.unit)}
          </span>
        </div>

        {/* Input */}
        <div className="relative mb-2">
          <input
            type="number"
            value={consumeAmount}
            onChange={(e) => setConsumeAmount(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 px-4 py-3 rounded-xl text-white focus:border-amber-500 outline-none text-2xl font-mono text-center"
            placeholder="0.00"
            autoFocus
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-medium">
            {product.unit}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setConsumeAmount(product.quantity)}
            className="flex-1 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
          >
            Used All
          </button>
          <button
            onClick={() => setConsumeAmount((product.quantity / 2).toFixed(2))}
            className="flex-1 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
          >
            Used 50%
          </button>
        </div>

        {/* Update Rate */}
        <div className="border-t border-zinc-800 pt-4 mb-4">
          <div className="flex items-center justify-between cursor-pointer group">
            <label className="text-xs font-bold text-amber-500 uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" /> Update Usage Rate?
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">
                QTY
              </span>
              <input
                type="number"
                defaultValue={product.usage_freq_qty}
                id="modal_rate_qty"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-8 pr-2 text-sm text-white focus:border-amber-500"
              />
            </div>
            <div>
              <select
                id="modal_rate_days"
                defaultValue={product.usage_freq_days}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-2 text-sm text-white focus:border-amber-500"
              >
                <option value="1">Daily</option>
                <option value="7">Weekly</option>
                <option value="14">Bi-Weekly</option>
                <option value="30">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 border-t border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              !consumeAmount || parseFloat(consumeAmount) > product.quantity
            }
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsumeModal;
