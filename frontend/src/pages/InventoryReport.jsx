import React, { useEffect, useState } from "react";
import { ResponsiveContainer, Treemap } from "recharts";
import { Layers, Zap, Tag, ChefHat } from "lucide-react";
import Navbar from "../components/dashboard/NavBar";
import { formatDisplayQty } from "../utils/formatters";

/* ===================== COLORS ===================== */
const COLORS = [
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
];

/* ===================== MAIN ===================== */
const InventoryReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("category");

  const user = localStorage.getItem("user");
  const userId = localStorage.getItem("userId");

  /* -------- BACKEND CALL -------- */
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/analytics/inventory-report?userId=${userId}`
        );
        const json = await res.json();
        if (json.success) setData(json);
      } catch (err) {
        console.error("Backend Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [userId]);

  /* -------- UI STATES -------- */
  if (loading) return <LoadingState />;
  if (!data) return <ErrorState />;

  const { treeMapData, dietData, abcData } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* HEADER */}
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* CATEGORY VIEW */}
        {activeTab === "category" && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <SectionTitle icon={<Tag />} title="Stock Value Distribution" />

            <div className="h-80 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <ResponsiveContainer>
                <Treemap
                  data={treeMapData}
                  dataKey="value"
                  aspectRatio={4 / 3}
                  content={<CustomTreemapContent />}
                />
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {treeMapData.map((cat) => (
                <div
                  key={cat.name}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl"
                >
                  <div className="p-4 border-b border-zinc-800 flex justify-between">
                    <h4 className="font-bold text-emerald-400">{cat.name}</h4>
                    <span className="text-xs text-zinc-500">
                      Rs {cat.value.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    {cat.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-zinc-300">{item.name}</span>
                        <span className="text-zinc-500">
                          {formatDisplayQty(item.quantity, item.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DIET VIEW */}
        {activeTab === "diet" && (
          <section className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {Object.keys(dietData).map((diet) => {
              const items = dietData[diet];
              if (!items?.length) return null;

              return (
                <div
                  key={diet}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                >
                  <h3
                    className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                      diet === "Vegan"
                        ? "text-green-400"
                        : diet === "Vegetarian"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    <ChefHat className="w-5 h-5" /> {diet}
                  </h3>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800"
                      >
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-zinc-500">
                            {item.category}
                          </div>
                        </div>
                        <div className="font-mono text-sm text-zinc-300">
                          {Math.round(item.quantity)} {item.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ABC VIEW */}
        {activeTab === "abc" && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-6">
              <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5" /> ABC Analysis (Pareto 80/20)
              </h3>
              <p className="text-sm text-zinc-300">
                Class A = High value | Class B = Medium | Class C = Low value
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950 text-zinc-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Value (PKR)</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {abcData.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-800/40">
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            item.grade === "A"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : item.grade === "B"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-zinc-700/30 text-zinc-400"
                          }`}
                        >
                          {item.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4 font-mono text-zinc-400">
                        Rs {item.stockValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {item.grade === "A"
                          ? "Monitor daily"
                          : item.grade === "B"
                          ? "Review weekly"
                          : "Bulk purchase"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default InventoryReport;

/* ===================== HELPERS (SAME FILE) ===================== */

const Header = ({ activeTab, setActiveTab }) => (
  <div className="flex flex-col md:flex-row justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Layers className="text-emerald-400" /> Smart Inventory Report
      </h1>
      <p className="text-sm text-zinc-400 mt-1">
        Data-driven inventory intelligence
      </p>
    </div>

    <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
      {["category", "diet", "abc"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded-lg text-sm capitalize transition ${
            activeTab === tab
              ? "bg-zinc-800 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {tab === "abc" ? "ABC Analysis" : `${tab} View`}
        </button>
      ))}
    </div>
  </div>
);

const SectionTitle = ({ icon, title }) => (
  <h3 className="text-lg font-bold flex items-center gap-2">
    <span className="text-amber-400">{icon}</span>
    {title}
  </h3>
);

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center text-zinc-400">
    <div className="animate-pulse text-lg">Analyzing inventory data...</div>
  </div>
);

const ErrorState = () => (
  <div className="min-h-screen flex items-center justify-center text-red-400">
    Failed to load inventory report
  </div>
);

/* -------- TREEMAP -------- */
const CustomTreemapContent = ({ x, y, width, height, index, name }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={COLORS[index % COLORS.length]}
      stroke="#18181b"
      strokeWidth={2}
    />
    {width > 60 && height > 30 && (
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        fill="#fff"
        fontSize={12}
        fontWeight="bold"
        style={{ pointerEvents: "none" }}
      >
        {name}
      </text>
    )}
  </g>
);
