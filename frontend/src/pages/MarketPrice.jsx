import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Loader2,
  BarChart3,
  Tag,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import Navbar from "../components/dashboard/NavBar";

const MarketPrices = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/products?userId=${userId}`
      );
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveUpdate = async () => {
    if (
      !window.confirm(
        "This will scan Al-Fatah for ALL items. It make take 2-3 minutes. Continue?"
      )
    )
      return;

    setIsScraping(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/analytics/fetch-live-prices`,
        { method: "POST" }
      );
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchPrices();
      }
    } catch (err) {
      alert("Scraping failed. Check backend logs.");
    } finally {
      setIsScraping(false);
    }
  };

  // --- DATA SCIENCE: Calculate Metrics on Frontend ---
  const stats = useMemo(() => {
    if (!items.length) return null;

    const validItems = items.filter((i) => i.price > 0);
    const totalValue = validItems.reduce((acc, curr) => acc + curr.price, 0);
    const avgPrice = totalValue / validItems.length || 0;
    const mostExpensive = [...validItems].sort((a, b) => b.price - a.price)[0];

    // Group by Category for Bar Chart
    const categoryGroups = {};
    validItems.forEach((item) => {
      if (!categoryGroups[item.category])
        categoryGroups[item.category] = { sum: 0, count: 0 };
      categoryGroups[item.category].sum += item.price;
      categoryGroups[item.category].count += 1;
    });

    const categoryData = Object.keys(categoryGroups)
      .map((cat) => ({
        name: cat,
        avgPrice: Math.round(
          categoryGroups[cat].sum / categoryGroups[cat].count
        ),
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice)
      .slice(0, 8); // Top 8 Categories

    // Create Price Range Buckets for Histogram
    // (0-500, 500-1000, 1000-2000, 2000+)
    const ranges = [
      { name: "0-300", count: 0 },
      { name: "300-800", count: 0 },
      { name: "800-1500", count: 0 },
      { name: "1500+", count: 0 },
    ];

    validItems.forEach((item) => {
      if (item.price < 300) ranges[0].count++;
      else if (item.price < 800) ranges[1].count++;
      else if (item.price < 1500) ranges[2].count++;
      else ranges[3].count++;
    });

    return { totalValue, avgPrice, mostExpensive, categoryData, ranges };
  }, [items]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-zinc-400 hover:text-white mb-6 transition group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <DollarSign className="text-emerald-500" /> Market Intelligence
            </h1>
            <p className="text-zinc-400 mt-1">
              Live pricing data & analytics from{" "}
              <span className="text-emerald-400 font-bold">
                Al-Fatah Online
              </span>
              .
            </p>
          </div>

          <button
            onClick={handleLiveUpdate}
            disabled={isScraping}
            className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Scanning
                Market...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" /> Scrape Live Prices
              </>
            )}
          </button>
        </div>

        {/* --- KPI CARDS --- */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <div className="text-zinc-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Avg. Item Price
              </div>
              <div className="text-3xl font-bold text-white">
                Rs {Math.round(stats.avgPrice).toLocaleString()}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <div className="text-zinc-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Most Expensive
              </div>
              <div className="text-2xl font-bold text-white truncate">
                {stats.mostExpensive?.name}
              </div>
              <div className="text-emerald-400 font-mono text-sm">
                Rs {stats.mostExpensive?.price.toLocaleString()}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <div className="text-zinc-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Market Basket Value
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                Rs {stats.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Total cost to buy 1 of everything
              </p>
            </div>
          </div>
        )}

        {/* --- CHARTS SECTION --- */}
        {stats && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Chart 1: Average Price by Category */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6">
                Average Price by Category
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#71717a"
                      fontSize={12}
                      unit=" Rs"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#fff"
                      fontSize={11}
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: "#27272a" }}
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                      }}
                      itemStyle={{ color: "#10B981" }}
                    />
                    <Bar
                      dataKey="avgPrice"
                      fill="#10B981"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Price Distribution (Histogram) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6">
                Price Distribution (Histogram)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.ranges}>
                    <defs>
                      <linearGradient
                        id="colorCount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#F59E0B"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#F59E0B"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                      vertical={false}
                    />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                      }}
                      itemStyle={{ color: "#F59E0B" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* --- TABLE SECTION --- */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/30">
            <h3 className="font-bold text-zinc-300">Live Price Feed</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">
                    Latest Market Price (PKR)
                  </th>
                  <th className="px-6 py-4 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-6 py-4 font-medium text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500 uppercase tracking-wider">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-emerald-400 font-mono text-lg font-bold">
                        Rs {item.price ? item.price.toLocaleString() : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 text-sm">
                      {item.price ? "Today" : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPrices;
