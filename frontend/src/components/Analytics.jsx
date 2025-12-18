import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  PieChart as PieIcon,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import Navbar from "./dashboard/NavBar";

const COLORS = [
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");
  const user = localStorage.getItem("user");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/analytics/dashboard?userId=${userId}`
        );
        const json = await res.json();
        if (json.success) setData(json);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Loading Analytics...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-2">
          <TrendingUp className="text-amber-500" /> Analytics Dashboard
        </h1>

        {/* 1. SPENDING TRENDS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Estimated
            Monthly Spending (PKR)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.spending}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month_str" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="total_spent"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 2. INVENTORY COMPOSITION (Pie) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-blue-400" /> Inventory Breakdown
            </h2>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category" // <--- ADD THIS LINE
                  >
                    {data?.categories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. INFLATION TRACKER (List/Bar) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-red-400" /> Inflation
              Tracker (Top Increases)
            </h2>
            <div className="space-y-4">
              {data?.inflation.length > 0 ? (
                data.inflation.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800"
                  >
                    <div>
                      <div className="font-bold text-zinc-200">{item.name}</div>
                      <div className="text-xs text-zinc-500">
                        6 Months Ago: Rs {item.old_price}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        Rs {item.new_price}
                      </div>
                      <div className="text-xs font-bold text-red-400">
                        +{item.change}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm text-center py-8">
                  Not enough data history yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
