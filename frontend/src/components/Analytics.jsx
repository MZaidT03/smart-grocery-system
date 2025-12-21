import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, Activity, Zap, PieChart, Sun } from "lucide-react"; // Import Sun icon
import Navbar from "../components/dashboard/NavBar";

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
        if (json.success) {
          setData(json);
        }
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
        Loading Data Models...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-2">
          <Activity className="text-amber-500" /> Consumption Analytics
        </h1>

        {/* 1. SMART INSIGHTS */}
        {data?.insights?.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5" /> Pattern Recognition & Insights
            </h2>
            <ul className="space-y-2">
              {data.insights.map((insight, idx) => (
                <li
                  key={idx}
                  className="text-zinc-200 text-sm flex items-start gap-2"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* 2. CONSUMPTION VELOCITY */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Consumption
              Velocity
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Total items consumed per month
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.consumption_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="items"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10B981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. SEASONAL TRENDS (NEW DS FEATURE) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sun className="w-5 h-5 text-orange-400" /> Seasonal Trends
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Consumption intensity by season
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.seasonal_trends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "#27272a" }}
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#F97316"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* 4. NUTRITIONAL CLUSTERING */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" /> Nutritional
              Clustering
            </h2>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={data?.dietaryComposition}
                >
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis
                    dataKey="subject"
                    stroke="#a1a1aa"
                    fontSize={11}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, "auto"]}
                    stroke="#52525b"
                  />
                  <Radar
                    name="Stock Level"
                    dataKey="A"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. TOP ITEMS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" /> Top Consumed
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.top_items || []} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    horizontal={false}
                  />
                  <XAxis type="number" stroke="#71717a" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#fff"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: "#27272a" }}
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#F59E0B"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  >
                    {data?.top_items?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#F59E0B",
                            "#EC4899",
                            "#8B5CF6",
                            "#3B82F6",
                            "#10B981",
                          ][index % 5]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
