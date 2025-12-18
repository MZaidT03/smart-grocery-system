import React, { useState } from "react";
import { ListPlus, RefreshCw, Calendar, Users, Loader2 } from "lucide-react";

const GenerateListModal = ({ onClose, userId, onGenerateSuccess }) => {
  const [genMode, setGenMode] = useState("new");
  const [genMembers, setGenMembers] = useState(1); // Could pass default from props
  const [genDays, setGenDays] = useState(7);
  const [genDiet, setGenDiet] = useState("Veg");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateList = async () => {
    setIsGenerating(true);
    const payload = {
      userId,
      numDays: parseFloat(genDays),
      numMembers: parseFloat(genMembers),
      dietType: genDiet,
      listName:
        genMode === "restock"
          ? `Restock (${genDays} days)`
          : `New List (${genDays} days)`,
      useExistingStock: genMode === "restock",
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/shopping-list/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onGenerateSuccess(data.listId);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to connect to server");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-700 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ListPlus className="text-amber-400" /> Create Shopping List
        </h2>
        {/* Toggle Mode */}
        <div className="flex bg-zinc-950 p-1 rounded-xl mb-6">
          <button
            onClick={() => setGenMode("new")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
              genMode === "new"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            From Scratch (CSV)
          </button>
          <button
            onClick={() => setGenMode("restock")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
              genMode === "restock"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Restock Inventory
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">
              Duration (Days)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="number"
                value={genDays}
                onChange={(e) => setGenDays(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 pl-10 pr-4 py-3 rounded-xl text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>
          {genMode === "new" && (
            <>
              <div>
                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">
                  Household Members
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    value={genMembers}
                    onChange={(e) => setGenMembers(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 pl-10 pr-4 py-3 rounded-xl text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">
                  Diet Type
                </label>
                <select
                  value={genDiet}
                  onChange={(e) => setGenDiet(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-4 py-3 rounded-xl text-white focus:border-amber-500 outline-none"
                >
                  <option value="Veg">Vegetarian</option>
                  <option value="Non-Veg">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>
            </>
          )}
          {genMode === "restock" && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3">
              <RefreshCw className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-zinc-300">
                We'll analyze your current stock levels and consumption history
                to suggest items you are likely to run out of in the next{" "}
                <strong>{genDays} days</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateList}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl font-bold transition text-sm shadow-lg flex items-center"
          >
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isGenerating ? "Generating..." : "Create List"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateListModal;
