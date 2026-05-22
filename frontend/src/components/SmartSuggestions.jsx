import React, { useState, useEffect } from "react";
import { Sparkles, Plus, Loader2 } from "lucide-react";

const SmartSuggestions = ({ triggerItem, userId, onAdd }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!triggerItem) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        // Call your new Market Basket Analysis Endpoint
        const res = await fetch(
          `http://127.0.0.1:5000/shopping/suggest?item=${triggerItem}&userId=${userId}`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Failed to get AI suggestions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [triggerItem]);

  if (!triggerItem || (suggestions.length === 0 && !loading)) return null;

  return (
    <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-bold text-purple-200">
          Because you bought{" "}
          <span className="text-white underline decoration-purple-500">
            {triggerItem}
          </span>
        </h4>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="w-3 h-3 animate-spin" /> Analyzing consumption
          patterns...
        </div>
      ) : (
        <div className="grid gap-2">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 hover:border-purple-500/30 transition group"
            >
              <div>
                <div className="text-sm font-medium text-zinc-200">
                  {s.item_name}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {s.confidence}% match • {s.reason}
                </div>
              </div>

              <button
                onClick={() => onAdd(s.item_name)}
                className="p-1.5 bg-zinc-800 hover:bg-purple-600 text-zinc-400 hover:text-white rounded-md transition"
                title="Add to List"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;
