import React from "react";
import {
  AlertTriangle,
  Activity,
  TrendingDown,
  CheckCircle,
} from "lucide-react";

export const formatDisplayQty = (qty, unit) => {
  // REMOVED "Small packet" logic as requested.
  // Now it simply returns the number and the unit.
  // e.g. "0.5 packet", "1 dozen", "2.5 kg"
  return `${Number(qty)} ${unit}`;
};

export const calculateMonthlyNeed = (qty, period) => {
  const daily = qty / period;
  return (daily * 30).toFixed(1);
};

export const getRunOutDate = (daysLeft) => {
  if (!daysLeft || daysLeft >= 900) return "—";
  const date = new Date();
  date.setDate(date.getDate() + Math.round(daysLeft));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const renderStockStatus = (daysLeft, quantity) => {
  if (quantity === 0)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
        <AlertTriangle className="w-3 h-3 mr-1" /> Empty
      </span>
    );
  if (!daysLeft || daysLeft >= 900)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
        <Activity className="w-3 h-3 mr-1" /> N/A
      </span>
    );
  if (daysLeft < 3)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
        <TrendingDown className="w-3 h-3 mr-1" /> {Math.round(daysLeft)} Days
      </span>
    );
  if (daysLeft < 7)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <AlertTriangle className="w-3 h-3 mr-1" /> Low
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
      <CheckCircle className="w-3 h-3 mr-1" /> OK
    </span>
  );
};
