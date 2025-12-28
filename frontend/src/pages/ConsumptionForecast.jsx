import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Search,
  Calendar,
  Activity,
  Zap,
  Waves, // Using 'Waves' icon for seasonal
} from "lucide-react";
import Navbar from "../components/dashboard/NavBar";

const ConsumptionForecast = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // NEW: Tab State ('trend' or 'seasonal')
  const [activeTab, setActiveTab] = useState("seasonal");

  const userId = localStorage.getItem("userId");
  const user = localStorage.getItem("user");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/products?userId=${userId}`
        );
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) setSelectedProductId(data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    if (userId) fetchProducts();
  }, [userId]);

  useEffect(() => {
    if (!selectedProductId) return;

    const fetchForecast = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/analytics/forecast/${selectedProductId}`
        );
        const json = await res.json();

        if (json.success) {
          processChartData(json.history, json.forecast, activeTab);
          setStats(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [selectedProductId, activeTab]); // Re-run when tab changes

  const processChartData = (history, forecastObj, tab) => {
    const dataPoints = [];

    // A. Add History
    const recentHistory = history.slice(-14);
    recentHistory.forEach((entry) => {
      dataPoints.push({
        date: formatDate(entry.date),
        actual: entry.quantity,
        predicted: null,
        type: "History",
      });
    });

    // B. Add Forecast
    const lastEntry = recentHistory[recentHistory.length - 1];
    const lastDate = lastEntry ? new Date(lastEntry.date) : new Date();

    // Bridge point
    if (lastEntry) {
      dataPoints[dataPoints.length - 1].predicted = lastEntry.quantity;
    }

    const futurePoints = forecastObj.seasonal_points || [];
    const flatRate = forecastObj.daily_usage;

    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + (i + 1));

      // DECISION: Which value to show?
      // If 'seasonal' tab -> use the list [3.2, 4.5, 3.2...]
      // If 'trend' tab -> use the flat number [3.2, 3.2, 3.2...]
      let val = 0;
      if (tab === "seasonal" && futurePoints.length > i) {
        val = futurePoints[i];
      } else {
        val = flatRate;
      }

      dataPoints.push({
        date: formatDate(nextDate.toISOString().split("T")[0]),
        actual: null,
        predicted: val,
        type: "Forecast",
      });
    }

    setChartData(dataPoints);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-amber-500" /> Smart Forecast
            </h1>
            <p className="text-zinc-400 mt-1">
              Analyzing consumption patterns to predict future needs.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-amber-500 appearance-none cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center text-zinc-500 animate-pulse">
            running @analysis_engine...
          </div>
        ) : stats ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: CHART PANEL */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              {/* TABS FOR ALGORITHM SELECTION */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" /> Timeline
                </h2>

                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setActiveTab("trend")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeTab === "trend"
                        ? "bg-zinc-800 text-white shadow"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Average Trend
                  </button>
                  <button
                    onClick={() => setActiveTab("seasonal")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                      activeTab === "seasonal"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/20 shadow"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Waves className="w-3 h-3" /> Seasonal AI
                  </button>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorActual"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend verticalAlign="top" height={36} />

                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorActual)"
                      name="Actual History"
                    />

                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke={activeTab === "seasonal" ? "#F59E0B" : "#3B82F6"}
                      strokeWidth={3}
                      strokeDasharray={activeTab === "seasonal" ? "0" : "5 5"} // Solid line for seasonal, dashed for trend
                      dot={{ r: 4 }}
                      name={
                        activeTab === "seasonal"
                          ? "Seasonal Forecast"
                          : "Average Trend"
                      }
                    />

                    <ReferenceLine
                      x={chartData.find((d) => d.type === "Forecast")?.date}
                      stroke="#3f3f46"
                      strokeDasharray="3 3"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                <Activity className="w-4 h-4 text-zinc-500 mt-0.5" />
                <p>
                  {activeTab === "seasonal"
                    ? "The Seasonal Model detects patterns (e.g., higher usage on weekends) to predict variable daily needs."
                    : "The Average Trend Model assumes constant daily usage based on your weighted history."}
                </p>
              </div>
            </div>

            {/* RIGHT: METRICS */}
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Avg Daily Consumption
                </h3>
                <div className="text-3xl font-mono text-white mb-2">
                  {stats.forecast.daily_usage}{" "}
                  <span className="text-lg text-zinc-500">
                    {stats.product.unit}
                  </span>
                </div>
                <div className="text-xs text-emerald-400 bg-emerald-500/10 inline-block px-2 py-1 rounded">
                  Calculated from 30-day history
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Predicted Run-Out
                </h3>
                <div className="flex items-end gap-2 mb-2">
                  <div
                    className={`text-3xl font-mono font-bold ${
                      stats.smart_days_left <= 3
                        ? "text-red-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {stats.smart_days_left}
                  </div>
                  <span className="text-zinc-500 mb-1">days left</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stats.smart_days_left <= 3
                        ? "bg-red-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (stats.smart_days_left / 14) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4 flex gap-3">
                <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-indigo-400 font-bold text-sm">
                    AI Insight
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {activeTab === "seasonal"
                      ? "Analysis complete. Detected a recurring usage pattern (Seasonality) in your history."
                      : "Analysis complete. Your consumption is relatively stable over the last 30 days."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            Select a product...
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumptionForecast;
