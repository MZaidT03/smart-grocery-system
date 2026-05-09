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
        `http://127.0.0.1:5000/recommend-recipes?userId=${userId}`,
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
      <div className="flex items-center justify-center p-12 text-[var(--text-3)]">
        <ChefHat className="w-6 h-6 animate-bounce mr-2" />
        Finding recipes...
      </div>
    );

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-6 shadow-elevated mt-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-1)] flex items-center gap-2">
            <ChefHat className="text-[var(--accent-2)] w-6 h-6" />
            What can I cook?
          </h2>
          <p className="text-xs text-[var(--text-3)] mt-1">
            Based on your current inventory (70% Match)
          </p>
        </div>
        <span className="text-xs bg-[var(--surface-2)] text-[var(--text-2)] px-3 py-1 rounded-full border border-[var(--border)] w-fit">
          {filteredRecipes.length} Matches Found
        </span>
      </div>

      {/* FILTERS */}
      <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-1)] text-sm rounded-lg pl-10 pr-4 py-2 focus:border-[var(--accent-2)] outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-3)]" />
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-2)] text-xs rounded-lg pl-8 pr-4 py-2 focus:border-[var(--accent-2)] outline-none appearance-none cursor-pointer hover:bg-[var(--surface-2)] transition h-full"
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
            className="bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-2)] text-xs rounded-lg px-4 py-2 focus:border-[var(--accent-2)] outline-none cursor-pointer hover:bg-[var(--surface-2)] transition h-full"
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
            className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent-2)] cursor-pointer transition group flex flex-col h-full hover:bg-[var(--surface-2)]"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-[var(--text-1)] group-hover:text-[var(--accent-2)] transition">
                  {recipe.name}
                </h3>
                <div className="text-xs text-[var(--text-3)] flex gap-2 mt-1">
                  <span className="bg-[var(--surface-2)] px-1.5 rounded border border-[var(--border)]">
                    {recipe.cuisine}
                  </span>
                  <span>•</span>
                  <span
                    className={
                      recipe.difficulty === "Hard"
                        ? "text-[var(--danger)]"
                        : "text-[var(--text-2)]"
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
                      ? "text-[var(--success)]"
                      : recipe.score > 70
                        ? "text-[var(--accent-2)]"
                        : "text-[var(--text-3)]"
                  }`}
                >
                  {recipe.score}%
                </span>
              </div>
            </div>

            <div className="w-full bg-[var(--surface-3)] h-1.5 rounded-full mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  recipe.score === 100
                    ? "bg-[var(--success)]"
                    : "bg-[var(--accent-2)]"
                }`}
                style={{ width: `${recipe.score}%` }}
              ></div>
            </div>

            <div className="mt-auto">
              <p className="text-[10px] text-[var(--text-3)] text-center w-full py-2 bg-[var(--surface-2)] rounded border border-[var(--border)] group-hover:bg-[var(--surface-3)] transition">
                Click to view full recipe
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredRecipes.length === 0 && !loading && (
        <div className="text-center py-12 text-[var(--text-3)] bg-[var(--surface-2)] rounded-xl border border-dashed border-[var(--border)] col-span-full">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No recipes match your search filters.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCuisine("All");
              setSelectedDifficulty("All");
            }}
            className="text-sm mt-2 text-[var(--accent-2)] hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* --- RECIPE DETAIL MODAL --- */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            className="bg-[var(--surface-1)] w-full max-w-lg rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-1)]">
                  {selectedRecipe.name}
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-[var(--surface-2)] px-2 py-1 rounded text-[var(--text-2)]">
                    {selectedRecipe.cuisine}
                  </span>
                  <span className="text-xs bg-[var(--surface-2)] px-2 py-1 rounded text-[var(--text-2)]">
                    {selectedRecipe.difficulty}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-2 hover:bg-[var(--surface-2)] rounded-full transition text-[var(--text-3)] hover:text-[var(--text-1)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <h3 className="text-sm font-bold text-[var(--text-2)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Ingredients Checklist
              </h3>

              <div className="space-y-2">
                {selectedRecipe.ingredients?.map((ingredient, idx) => {
                  const isMissing = selectedRecipe.missing.includes(ingredient);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
                    >
                      <span
                        className={`font-medium ${
                          isMissing
                            ? "text-[var(--text-2)]"
                            : "text-[var(--text-1)]"
                        }`}
                      >
                        {ingredient}
                      </span>
                      {isMissing ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-[var(--danger)] bg-[var(--surface-3)] px-2 py-1 rounded">
                          <X className="w-3 h-3" /> Missing
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-[var(--success)] bg-[var(--surface-3)] px-2 py-1 rounded">
                          <Check className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--surface-2)] border-t border-[var(--border)] text-center">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="text-sm text-[var(--text-3)] hover:text-[var(--text-1)] transition"
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
