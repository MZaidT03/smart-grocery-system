import React, { useState, useEffect } from "react";
import { ShieldAlert, TrendingUp, Wallet, CheckCircle } from "lucide-react";

const BudgetGuard = ({ userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newLimit, setNewLimit] = useState("");

  useEffect(() => {
    fetchBudget();
  }, [userId]);

  const fetchBudget = async () => {
    const res = await fetch(`http://127.0.0.1:5000/budget?userId=${userId}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
    if (json.limit) setNewLimit(json.limit);
  };

  const saveBudget = async () => {
    await fetch(`http://127.0.0.1:5000/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, limit: newLimit }),
    });
    setEditMode(false);
    fetchBudget();
  };

  if (loading)
    return <div className="animate-pulse h-32 bg-zinc-900 rounded-xl"></div>;

  // VIEW 1: No Budget Set
  if (data.status === "not_set" || editMode) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white">Set Monthly Budget</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="e.g. 20000"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white w-full outline-none focus:border-emerald-500"
          />
          <button
            onClick={saveBudget}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  // VIEW 2: Active Budget Monitor
  const progress = Math.min(data.percent, 100);
  const barColor =
    data.color === "red"
      ? "bg-red-500"
      : data.color === "orange"
      ? "bg-amber-500"
      : "bg-emerald-500";
  const textColor =
    data.color === "red"
      ? "text-red-400"
      : data.color === "orange"
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Monthly Budget Guard
          </h3>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            Rs {data.spent.toLocaleString()}{" "}
            <span className="text-zinc-600 text-sm">
              / {data.limit.toLocaleString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => setEditMode(true)}
          className="text-xs text-zinc-500 hover:text-white underline"
        >
          Edit
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-950 h-3 rounded-full mb-3 border border-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Analysis Text */}
      <div
        className={`flex items-start gap-2 text-sm ${textColor} bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50`}
      >
        <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">{data.percent}% Spent.</span>{" "}
          {data.advice}
        </div>
      </div>
    </div>
  );
};

export default BudgetGuard;
