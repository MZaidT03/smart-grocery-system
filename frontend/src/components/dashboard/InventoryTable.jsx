import React, { useState } from "react";
import {
  Utensils,
  Trash2,
  Clock,
  Calendar,
  User,
  Plus,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  formatDisplayQty,
  getRunOutDate,
  renderStockStatus,
} from "../../utils/formatters";

const InventoryTable = ({
  products,
  householdSize,
  onConsumeClick,
  onRestockClick,
  onDeleteClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products based on search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* --- SEARCH TOOLBAR --- */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/30 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-amber-500/50 outline-none transition"
          />
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          Showing {filteredProducts.length} items
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 font-medium">
            <tr>
              <th className="px-6 py-4">Item Name</th>
              <th className="px-6 py-4">In Stock</th>
              <th className="px-6 py-4">Consumption Rate</th>
              <th className="px-6 py-4 text-amber-500">Daily / Person</th>
              <th className="px-6 py-4">Est. Run Out</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredProducts.map((p) => {
              const dailyRate =
                p.usage_freq_days > 0
                  ? p.usage_freq_qty / p.usage_freq_days
                  : 0;
              const perPersonDaily =
                householdSize > 0 ? dailyRate / householdSize : 0;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-zinc-800/30 transition group"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white text-sm">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {p.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 font-mono">
                    <span className="text-white font-bold text-sm">
                      {formatDisplayQty(p.quantity, p.unit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm font-mono">
                    {p.usage_freq_days === 7 ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-zinc-600" />{" "}
                        {p.usage_freq_qty} / week
                      </div>
                    ) : p.usage_freq_days === 30 ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-zinc-600" />{" "}
                        {p.usage_freq_qty} / month
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {p.effective_daily_rate.toFixed(2)} / day
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-amber-500/80">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />{" "}
                      {perPersonDaily > 0 ? perPersonDaily.toFixed(3) : "—"}{" "}
                      {p.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 text-sm">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.days_left < 7 ? "bg-red-500" : "bg-emerald-500"
                          }`}
                        ></span>
                        {getRunOutDate(p.days_left)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {renderStockStatus(p.days_left, p.quantity)}
                  </td>

                  {/* --- ACTIONS COLUMN --- */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onRestockClick(p)}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg transition border border-emerald-500/20"
                        title="Add Stock"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onConsumeClick(p)}
                        className="px-3 py-2 bg-zinc-800 text-amber-500 hover:text-amber-400 hover:bg-zinc-700 rounded-lg transition text-xs font-bold border border-amber-500/20 hover:border-amber-500/50 flex items-center gap-2"
                      >
                        <Utensils className="w-3 h-3" /> Consume
                      </button>

                      <button
                        onClick={() => onDeleteClick(p.id)}
                        className="p-2 bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition border border-zinc-700 hover:border-red-500/20"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center text-zinc-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 opacity-20" />
                    <p className="italic">
                      No products found matching "{searchTerm}"
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
