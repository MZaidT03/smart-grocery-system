import React from "react";
import {
  AlertTriangle,
  Activity,
  TrendingDown,
  CheckCircle,
  HelpCircle, // New Icon for Unknown
} from "lucide-react";
import { format, addDays } from "date-fns"; // Make sure you have date-fns installed

export const formatDisplayQty = (qty, unit) => {
  return `${Number(qty)} ${unit}`;
};

export const calculateMonthlyNeed = (qty, period) => {
  if (!qty || !period) return 0;
  const daily = qty / period;
  return (daily * 30).toFixed(1);
};

export const getRunOutDate = (daysLeft) => {
  // If daysLeft is -1 (unknown) or excessively high (default safe), return Unknown
  if (daysLeft === -1 || daysLeft >= 900) return "Unknown";

  const date = addDays(new Date(), daysLeft);
  return format(date, "MMM d"); // e.g. "Dec 31"
};

export const renderStockStatus = (daysLeft, quantity) => {
  if (quantity === 0)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
        <AlertTriangle className="w-3 h-3 mr-1" /> Empty
      </span>
    );

  // Handle Unknown Rate (-1)
  if (daysLeft === -1 || daysLeft >= 900)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
        <HelpCircle className="w-3 h-3 mr-1" /> Unknown Rate
      </span>
    );

  if (daysLeft < 3)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
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
