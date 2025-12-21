import React, { useState } from "react";
import {
  Utensils,
  Trash2,
  Plus,
  Search,
  DollarSign,
  Eye,
  X,
  Save,
  Clock,
  Activity,
} from "lucide-react";
import {
  formatDisplayQty,
  renderStockStatus,
  getRunOutDate,
} from "../../utils/formatters";

// --- HELPER: CONVERT DAYS TO LABEL ---
const getFrequencyLabel = (days) => {
  if (days === 1) return "Daily";
  if (days === 7) return "Weekly";
  if (days === 14 || days === 15) return "Bi-Weekly";
  if (days === 30) return "Monthly";
  return `/${days} Days`;
};

// --- SUB-COMPONENT: PRODUCT DETAILS MODAL ---
const ProductDetailsModal = ({
  product,
  householdSize,
  onClose,
  onUpdatePrice,
}) => {
  const [newPrice, setNewPrice] = useState(product.price || "");
  const [loading, setLoading] = useState(false);

  const dailyRate =
    product.usage_freq_days > 0
      ? product.usage_freq_qty / product.usage_freq_days
      : 0;
  const perPersonDaily = householdSize > 0 ? dailyRate / householdSize : 0;

  const handleSavePrice = async () => {
    setLoading(true);
    await onUpdatePrice(product.id, product.name, newPrice);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <div>
            <h2 className="text-xl font-bold text-white">{product.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-500 uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded">
                {product.category}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
              <div className="text-zinc-500 text-xs uppercase font-bold mb-1">
                In Stock
              </div>
              <div className="text-2xl font-mono text-white">
                {Number(product.quantity)}{" "}
                <span className="text-sm text-zinc-500">{product.unit}</span>
              </div>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
              <div className="text-zinc-500 text-xs uppercase font-bold mb-1">
                Run Out Date
              </div>
              <div className="text-sm font-medium text-white flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    product.days_left < 7 ? "bg-red-500" : "bg-emerald-500"
                  }`}
                ></span>
                {getRunOutDate(product.days_left)}
              </div>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
              <div className="text-zinc-500 text-xs uppercase font-bold mb-1">
                Consumption Rate
              </div>
              <div className="text-lg text-amber-500 font-mono">
                {product.usage_freq_qty} {product.unit}{" "}
                <span className="text-sm text-zinc-500">
                  / {getFrequencyLabel(product.usage_freq_days)}
                </span>
              </div>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
              <div className="text-zinc-500 text-xs uppercase font-bold mb-1">
                Per Person (Daily)
              </div>
              <div className="text-lg text-zinc-300 font-mono">
                {perPersonDaily.toFixed(2)} {product.unit}
              </div>
            </div>
          </div>

          {/* Update Price Section */}
          <div className="pt-4 border-t border-zinc-800">
            <label className="text-sm font-bold text-white mb-2 block flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Update Price
              (PKR)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition font-mono"
              />
              <button
                onClick={handleSavePrice}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 rounded-xl flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Update
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Updating this price will record a new entry in the price history
              for inflation tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN TABLE COMPONENT ---
const InventoryTable = ({
  products,
  householdSize,
  onConsumeClick,
  onRestockClick,
  onDeleteClick,
  onUpdatePrice,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {/* Search Bar */}
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
                <th className="px-6 py-4">Stock</th>
                {/* --- NEW COLUMN HEADER --- */}
                <th className="px-6 py-4">Consumption</th>
                <th className="px-6 py-4">Price (PKR)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="hover:bg-zinc-800/30 transition group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white text-sm">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-800 inline-block mt-1">
                      {p.category}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-zinc-300 font-mono font-bold text-sm">
                    {Number(p.quantity)} {p.unit}
                  </td>

                  {/* --- NEW COLUMN DATA --- */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-zinc-500" />
                      <span className="text-sm text-zinc-300 font-medium">
                        {p.usage_freq_qty} {p.unit}
                        <span className="text-zinc-500 text-xs ml-1">
                          / {getFrequencyLabel(p.usage_freq_days)}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-emerald-400 font-mono text-sm font-bold">
                      <p className="">Rs</p>{" "}
                      {p.price ? p.price.toLocaleString() : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {renderStockStatus(p.days_left, p.quantity)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onRestockClick(p)}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg transition border border-emerald-500/20"
                        title="Restock"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onConsumeClick(p)}
                        className="p-2 bg-zinc-800 text-amber-500 hover:text-white hover:bg-amber-500 rounded-lg transition border border-amber-500/20"
                        title="Consume"
                      >
                        <Utensils className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(p.id)}
                        className="p-2 bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition border border-zinc-700 hover:border-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          householdSize={householdSize}
          onClose={() => setSelectedProduct(null)}
          onUpdatePrice={onUpdatePrice}
        />
      )}
    </>
  );
};

export default InventoryTable;
