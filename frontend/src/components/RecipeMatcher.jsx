import React, { useEffect, useState, useMemo } from "react";
import {
  ChefHat,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  BookOpen,
} from "lucide-react";

const RecipeMatcher = ({ userId }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null); // State for Modal

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  useEffect(() => {
    if (userId) fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/recommend-recipes?userId=${userId}`
      );
      const data = await res.json();
      if (data.success) {
        setRecipes(data.recommendations);
      }
    } catch (error) {
      console.error("Failed to load recipes", error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCuisines = useMemo(() => {
    const cuisines = new Set(recipes.map((r) => r.cuisine));
    return ["All", ...Array.from(cuisines)];
  }, [recipes]);

  const uniqueDifficulties = ["All", "Easy", "Medium", "Hard"];

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCuisine =
      selectedCuisine === "All" || recipe.cuisine === selectedCuisine;
    const matchesDifficulty =
      selectedDifficulty === "All" || recipe.difficulty === selectedDifficulty;
    return matchesSearch && matchesCuisine && matchesDifficulty;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center p-12 text-zinc-500">
        <ChefHat className="w-6 h-6 animate-bounce mr-2" />
        Finding recipes...
      </div>
    );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl mt-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ChefHat className="text-amber-500 w-6 h-6" />
            What can I cook?
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Based on your current inventory (70% Match)
          </p>
        </div>
        <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700 w-fit">
          {filteredRecipes.length} Matches Found
        </span>
      </div>

      {/* FILTERS */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg pl-10 pr-4 py-2 focus:border-amber-500/50 outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg pl-8 pr-4 py-2 focus:border-amber-500 outline-none appearance-none cursor-pointer hover:bg-zinc-800 transition h-full"
            >
              {uniqueCuisines.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-4 py-2 focus:border-amber-500 outline-none cursor-pointer hover:bg-zinc-800 transition h-full"
          >
            {uniqueDifficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RECIPE GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => setSelectedRecipe(recipe)} // <-- OPEN MODAL ON CLICK
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-amber-500/50 cursor-pointer transition group flex flex-col h-full hover:bg-zinc-900/50"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-zinc-200 group-hover:text-amber-400 transition">
                  {recipe.name}
                </h3>
                <div className="text-xs text-zinc-500 flex gap-2 mt-1">
                  <span className="bg-zinc-900 px-1.5 rounded border border-zinc-800">
                    {recipe.cuisine}
                  </span>
                  <span>•</span>
                  <span
                    className={
                      recipe.difficulty === "Hard"
                        ? "text-red-400"
                        : "text-zinc-400"
                    }
                  >
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-lg font-bold ${
                    recipe.score === 100
                      ? "text-emerald-500"
                      : recipe.score > 70
                      ? "text-amber-500"
                      : "text-zinc-500"
                  }`}
                >
                  {recipe.score}%
                </span>
              </div>
            </div>

            <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  recipe.score === 100 ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${recipe.score}%` }}
              ></div>
            </div>

            <div className="mt-auto">
              <p className="text-[10px] text-zinc-500 text-center w-full py-2 bg-zinc-900/50 rounded border border-zinc-800 group-hover:bg-zinc-800 transition">
                Click to view full recipe
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredRecipes.length === 0 && !loading && (
        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800 col-span-full">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No recipes match your search filters.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCuisine("All");
              setSelectedDifficulty("All");
            }}
            className="text-sm mt-2 text-amber-500 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* --- RECIPE DETAIL MODAL --- */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedRecipe.name}
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                    {selectedRecipe.cuisine}
                  </span>
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                    {selectedRecipe.difficulty}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Ingredients Checklist
              </h3>

              <div className="space-y-2">
                {selectedRecipe.ingredients?.map((ingredient, idx) => {
                  const isMissing = selectedRecipe.missing.includes(ingredient);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        isMissing
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-emerald-500/5 border-emerald-500/20"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          isMissing ? "text-zinc-300" : "text-white"
                        }`}
                      >
                        {ingredient}
                      </span>
                      {isMissing ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">
                          <X className="w-3 h-3" /> Missing
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                          <Check className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-center">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="text-sm text-zinc-500 hover:text-white transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeMatcher;
