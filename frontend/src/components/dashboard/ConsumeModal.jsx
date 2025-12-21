import React, { useState } from "react";
import { Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDisplayQty } from "../../utils/formatters.jsx";

const ConsumeModal = ({ product, onClose, userId, onConsumeComplete }) => {
  const [customAmount, setCustomAmount] = useState("");
  const [isPermanentUpdate, setIsPermanentUpdate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Default "Usual" amount comes from the product's settings
  const usualAmount = product.usage_freq_qty || 1;

  const handleConsume = async (amount, updateRate) => {
    if (!amount || amount <= 0) return;
    setSubmitting(true);

    try {
      // Prepare payload
      const payload = {
        productId: product.id,
        amount: parseFloat(amount),
        userId,
      };

      // Only send new rate data if the user checked the box
      if (updateRate) {
        payload.newRateQty = parseFloat(amount);
        payload.newRateDays = product.usage_freq_days; // Keep the same time period (e.g., Weekly), just update qty
      }

      await fetch("http://127.0.0.1:5000/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      onConsumeComplete();
      onClose();
    } catch (error) {
      console.error("Consume error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-700 shadow-2xl relative">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">Log Consumption</h2>
          <p className="text-xs text-zinc-500">
            {product.name} •{" "}
            <span className="text-zinc-400">
              Current Stock: {formatDisplayQty(product.quantity, product.unit)}
            </span>
          </p>
        </div>

        {/* OPTION 1: QUICK LOG (Based on Prev Rate) */}
        <button
          onClick={() => handleConsume(usualAmount, false)}
          disabled={submitting || usualAmount > product.quantity}
          className="w-full group relative flex items-center justify-between bg-zinc-800 hover:bg-emerald-500/10 hover:border-emerald-500/50 border border-zinc-700 p-4 rounded-xl transition-all mb-6 text-left"
        >
          <div>
            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
              <Zap className="w-4 h-4 fill-current" />
              Quick Log Usual
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Consume{" "}
              <span className="text-zinc-300 font-mono">
                {usualAmount} {product.unit}
              </span>{" "}
              (One-time)
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center group-hover:border-emerald-500 group-hover:bg-emerald-500 text-zinc-500 group-hover:text-black transition-all">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        {/* DIVIDER */}
        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-bold text-zinc-600 uppercase">
            Or Custom Amount
          </span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* OPTION 2: CUSTOM INPUT */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 px-4 py-3 rounded-xl text-white focus:border-amber-500 outline-none text-lg font-mono placeholder:text-zinc-700"
              placeholder="Enter custom qty..."
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold uppercase">
              {product.unit}
            </span>
          </div>

          {/* CHECKBOX: Set as New Rate */}
          {customAmount && (
            <div
              onClick={() => setIsPermanentUpdate(!isPermanentUpdate)}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isPermanentUpdate
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-transparent border-transparent hover:bg-zinc-800"
              }`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  isPermanentUpdate
                    ? "bg-amber-500 border-amber-500 text-black"
                    : "border-zinc-600 bg-transparent"
                }`}
              >
                {isPermanentUpdate && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <div>
                <span
                  className={`text-sm font-bold block ${
                    isPermanentUpdate ? "text-amber-400" : "text-zinc-400"
                  }`}
                >
                  Update default rate?
                </span>
                <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                  If checked,{" "}
                  <b>
                    {customAmount} {product.unit}
                  </b>{" "}
                  becomes your new usual consumption amount.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={() => handleConsume(customAmount, isPermanentUpdate)}
            disabled={
              !customAmount ||
              submitting ||
              parseFloat(customAmount) > product.quantity
            }
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
          >
            Confirm Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsumeModal;
