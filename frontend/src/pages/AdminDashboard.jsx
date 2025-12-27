import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_items: 0,
    active_lists: 0,
    demand_forecast: [],
  });

  const [complexData, setComplexData] = useState({
    inflation_data: [],
    radar_data: [],
    scatter_data: [],
  });

  const [loading, setLoading] = useState(true);

  const SCATTER_COLORS = {
    Critical: "#ef4444",
    Overstock: "#3b82f6",
    "High Volume": "#10b981",
    Healthy: "#6366f1",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, complexRes] = await Promise.all([
        fetch("http://127.0.0.1:5000/admin/dashboard-stats"),
        fetch("http://127.0.0.1:5000/admin/complex-analytics"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (complexRes.ok) setComplexData(await complexRes.json());
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-semibold animate-pulse text-zinc-400">
            Loading Advanced Analytics Models...
          </p>
          <p className="text-xs text-zinc-600">
            Processing Pandas, Scikit-Learn, Time Series...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950 border-b border-zinc-800 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-amber-500 rounded-lg">
              <svg
                className="w-8 h-8 text-zinc-950"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Data Science Analytics Console
              </h1>
              <p className="text-zinc-400 text-sm">
                Advanced ML-powered insights • Real-time aggregation pipeline
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              Pandas Active
            </span>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
              Scikit-Learn Models
            </span>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/20">
              Time Series Analysis
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KEY METRICS - UPDATED: Removed Users, adjusted grid to 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            icon="🛒"
            label="Inventory Items"
            value={stats.total_items}
            sub="Tracked across households"
            trend="Avg 24 items/user"
            color="emerald"
          />
          <StatCard
            icon="⚡"
            label="Active Lists"
            value={stats.active_lists}
            sub="Currently being shopped"
            trend="Real-time sync"
            color="amber"
          />
        </div>

        {/* ROW 1: INFLATION TRACKER (Time Series) */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                📈 Inflation Tracker (Time Series Analysis)
              </h3>
              <p className="text-xs text-zinc-500">
                Real-time price volatility tracking for staple items across
                7-day window • PKR
              </p>
            </div>
            <div className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-md border border-amber-500/30">
              PANDAS MODEL
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complexData.inflation_data}>
                <defs>
                  <linearGradient id="colorRice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorChicken" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Rice"
                  stroke="#fbbf24"
                  fillOpacity={1}
                  fill="url(#colorRice)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="Chicken"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorChicken)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="Oil"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorOil)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROW 2: RADAR + SCATTER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* SHOPPER ARCHETYPES (Radar) */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  🎯 Shopper Archetypes (Clustering)
                </h3>
                <p className="text-xs text-zinc-500">
                  Multi-dimensional behavioral analysis by diet profile
                </p>
              </div>
              <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-md border border-blue-500/30">
                K-MEANS
              </div>
            </div>

            <div className="h-[380px] w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={complexData.radar_data}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" />
                  <PolarRadiusAxis stroke="#71717a" />
                  <Radar
                    name="Standard Diet"
                    dataKey="Standard"
                    stroke="#fbbf24"
                    fill="#fbbf24"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Vegan"
                    dataKey="Vegan"
                    stroke="#34d399"
                    fill="#34d399"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Keto"
                    dataKey="Keto"
                    stroke="#f87171"
                    fill="#f87171"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#3f3f46",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* INVENTORY RISK MATRIX (Scatter) */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  ⚠️ Inventory Risk Matrix
                </h3>
                <p className="text-xs text-zinc-500">
                  Stock vs. consumption velocity • Bubble size = item value
                </p>
              </div>
              <div className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-md border border-red-500/30">
                REGRESSION
              </div>
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid stroke="#27272a" />
                  <XAxis
                    type="number"
                    dataKey="velocity"
                    name="Consumption Velocity"
                    stroke="#71717a"
                    label={{
                      value: "Units/Month",
                      position: "insideBottom",
                      offset: -10,
                      fill: "#71717a",
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="stock"
                    name="Current Stock"
                    stroke="#71717a"
                    label={{
                      value: "Units",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#71717a",
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[100, 1000]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#3f3f46",
                      borderRadius: "8px",
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg">
                            <p className="font-bold text-white">{data.name}</p>
                            <p className="text-xs text-zinc-400">
                              Velocity: {data.velocity} units/mo
                            </p>
                            <p className="text-xs text-zinc-400">
                              Stock: {data.stock} units
                            </p>
                            <p className="text-xs text-amber-400">
                              Status: {data.status}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Items" data={complexData.scatter_data}>
                    {complexData.scatter_data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SCATTER_COLORS[entry.status]}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-zinc-400">
                  Critical (Low Stock, High Use)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-zinc-400">Overstock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-zinc-400">High Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs text-zinc-400">Healthy</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: DEMAND FORECAST (Bar) */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                ⚡ Global Demand Forecast (Predictive Analytics)
              </h3>
              <p className="text-xs text-zinc-500">
                Aggregated "To-Buy" lists across platform • Supply chain
                optimization recommendations
              </p>
            </div>
            <div className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-md border border-purple-500/30">
              PROPHET MODEL
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.demand_forecast}
                layout="vertical"
                margin={{ left: 80, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  horizontal={false}
                />
                <XAxis type="number" stroke="#71717a" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#e4e4e7"
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "#27272a" }}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="demand"
                  fill="#a855f7"
                  radius={[0, 8, 8, 0]}
                  barSize={35}
                  name="Projected Units"
                >
                  {stats.demand_forecast.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "#a855f7" : "#f59e0b"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="text-amber-500 font-bold">📊</span>
            <span>
              Data refreshed every 5 minutes • Models: Time Series
              Decomposition, K-Means Clustering, Linear Regression Risk Scoring,
              Prophet Forecasting • Pipeline: Pandas → NumPy → Scikit-Learn
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, trend, color }) => {
  const colorClasses = {
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-xl hover:border-zinc-700 transition-all hover:shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-3xl">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
            {label}
          </div>
          <div className="text-4xl font-mono font-bold text-white my-1">
            {value.toLocaleString()}
          </div>
          <div className="text-zinc-600 text-xs">{sub}</div>
          {trend && (
            <div
              className={`${colorClasses[color]} text-xs font-semibold mt-1`}
            >
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
