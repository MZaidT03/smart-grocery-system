import React, { useState, useEffect } from "react";
import {
  Trash2,
  Search,
  Eye,
  X,
  Calendar,
  Package,
  Activity,
  DollarSign,
  Clock,
  RefreshCcw,
  History,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { renderStockStatus } from "../../utils/formatters";

/* ---------------- HELPERS ---------------- */

const getFrequencyLabel = (days) => {
  if (days === 1) return "day";
  if (days === 7) return "week";
  if (days === 14 || days === 15) return "2 weeks";
  if (days === 30) return "month";
  return `${days} days`;
};

const renderExpiryStatus = (days) => {
  if (days === undefined || days === 999) return null;
  if (days < 0)
    return <span className="text-red-500 text-xs font-semibold">Expired</span>;
  if (days <= 3)
    return (
      <span className="text-red-400 text-xs font-semibold">
        Expiring in {days} days
      </span>
    );
  if (days <= 7)
    return (
      <span className="text-amber-400 text-xs font-semibold">
        {days} days left
      </span>
    );
  return (
    <span className="text-emerald-500 text-xs font-medium">
      Fresh ({days} days)
    </span>
  );
};

// Helper to format date string nicely
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* ---------------- MODALS ---------------- */

// 1. PRODUCT DETAILS MODAL (View Full Info + Batch History)
const EditBatchModal = ({ batch, onClose, onUpdate }) => {
  const [days, setDays] = useState("");

  const handleSave = () => {
    onUpdate(batch.batch_id, days);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 p-5 rounded-xl w-72 shadow-2xl">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
          <Pencil className="w-4 h-4 text-amber-500" /> Edit Batch
        </h4>
        <div className="text-xs text-zinc-400 mb-4">
          Current Expiry:{" "}
          <span className="text-zinc-300">{batch.expiry_date}</span>
        </div>

        <label className="text-xs font-semibold text-zinc-300 mb-1 block">
          Set New Days Remaining
        </label>
        <input
          type="number"
          className="w-full bg-zinc-950 border border-zinc-600 rounded p-2 text-white mb-4 focus:border-amber-500 outline-none"
          placeholder="e.g. 5"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 bg-zinc-800 rounded text-xs text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-xs text-white font-bold"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. PRODUCT DETAILS MODAL (View Full Info + Batch History)
const ProductDetailsModal = ({ product, onClose }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for editing a specific batch
  const [editingBatch, setEditingBatch] = useState(null);

  // Fetch batches when modal mounts or product changes
  useEffect(() => {
    if (product?.id) {
      fetchBatches();
    }
  }, [product]);

  const fetchBatches = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/products/${product.id}/batches`
      );
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBatch = async (batchId, newDays) => {
    try {
      await fetch(`http://127.0.0.1:5000/batches/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: newDays }),
      });
      // Refresh the list after update
      fetchBatches();
    } catch (e) {
      console.error(e);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 w-full max-w-lg rounded-xl border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-xl shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {product.name}
            </h3>
            <span className="text-sm text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full mt-1 inline-block">
              {product.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Stats Grid (Keep existing stats code here...) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm uppercase font-semibold">
                <Package className="w-4 h-4" /> Total Stock
              </div>
              <div className="text-2xl font-mono text-white">
                {product.quantity}{" "}
                <span className="text-sm">{product.unit}</span>
              </div>
              <div className="mt-2">
                {renderStockStatus(product.days_left, product.quantity)}
              </div>
            </div>

            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm uppercase font-semibold">
                <DollarSign className="w-4 h-4" /> Current Price
              </div>
              <div className="text-2xl font-mono text-emerald-400">
                Rs {product.price ?? 0}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Per unit</div>
            </div>
          </div>

          {/* General Info (Keep existing...) */}

          {/* --- Batch History Section --- */}
          <div>
            <h4 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <History className="w-4 h-4 text-amber-500" /> Stock Batches
            </h4>

            <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-2">Batch Expiry</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-zinc-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : batches.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-zinc-500"
                      >
                        No active batches.
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch, idx) => {
                      const isExpired =
                        new Date(batch.expiry_date) < new Date();
                      return (
                        <tr
                          key={batch.batch_id || idx}
                          className="hover:bg-zinc-800/30"
                        >
                          <td className="px-4 py-3 text-zinc-300">
                            {batch.expiry_date}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-white">
                            {batch.quantity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isExpired ? (
                              <span className="text-red-500 text-xs font-bold">
                                Expired
                              </span>
                            ) : (
                              <span className="text-emerald-500 text-xs">
                                Valid
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {/* --- EDIT BUTTON --- */}
                            <button
                              onClick={() => setEditingBatch(batch)}
                              className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition"
                              title="Edit Shelf Life"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {product.expiry_days <= 3 && product.expiry_days !== 999 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-red-500/20 rounded-full shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="text-red-400 font-bold text-sm uppercase tracking-wide">
                Value at Risk
              </h4>
              <p className="text-zinc-300 text-sm mt-1">
                This item is expiring soon! If you don't use it, you will lose
                approximately{" "}
                <span className="text-white font-bold">
                  Rs {(product.price * product.quantity).toFixed(0)}
                </span>
                .
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition"
          >
            Close Details
          </button>
        </div>

        {/* Render Edit Batch Modal if Active */}
        {editingBatch && (
          <EditBatchModal
            batch={editingBatch}
            onClose={() => setEditingBatch(null)}
            onUpdate={handleUpdateBatch}
          />
        )}
      </div>
    </div>
  );
};

// 2. RESTOCK MODAL (Includes Shelf Life)
const RestockModal = ({ product, onClose, onConfirm }) => {
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(product.price || 0);
  const [expiryDays, setExpiryDays] = useState(
    product.expiry_days === 999 ? "" : product.expiry_days
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(product.id, {
      added_quantity: parseFloat(qty),
      new_price: parseFloat(price),
      new_expiry_days: expiryDays ? parseInt(expiryDays) : 999,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 w-full max-w-sm rounded-xl border border-zinc-800 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCcw className="w-5 h-5 text-emerald-500" />
          Restock {product.name}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 uppercase font-semibold mb-1 block">
              Quantity to Add ({product.unit})
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase font-semibold mb-1 block">
              Updated Price (Rs)
            </label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase font-semibold mb-1 block">
              Shelf Life (Days)
            </label>
            <input
              type="number"
              min="1"
              placeholder="Leave empty if non-perishable"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Updates the expiry tracking for this item.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium"
            >
              Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- MAIN TABLE ---------------- */

const InventoryTable = ({
  products,
  onConsumeClick,
  onRestockSubmit,
  onDeleteClick,
}) => {
  const [search, setSearch] = useState("");

  // State for Modals
  const [viewProduct, setViewProduct] = useState(null);
  const [restockProduct, setRestockProduct] = useState(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  // Handle Opening View Modal
  const handleRowClick = (product) => {
    setViewProduct(product);
  };

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
        {/* Search */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-white flex-1"
          />
          <span className="text-xs text-zinc-500">{filtered.length} items</span>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead className="text-zinc-500 uppercase text-xs bg-zinc-950">
            <tr>
              <th className="px-5 py-3 text-left">Item</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Usage</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => handleRowClick(p)} // Row Click triggers detail view
                className={`
                  ${
                    p.days_left <= 3
                      ? "bg-red-500/5"
                      : p.days_left <= 7
                      ? "bg-amber-500/5"
                      : ""
                  }
                  hover:bg-zinc-800/50 transition cursor-pointer group
                `}
              >
                {/* ITEM */}
                <td className="px-5 py-4">
                  <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {p.name}
                  </div>
                  <div className="text-xs text-zinc-400">{p.category}</div>
                </td>

                {/* STOCK */}
                <td className="px-5 py-4 font-mono text-white">
                  {p.quantity} {p.unit}
                </td>

                {/* USAGE */}
                <td className="px-5 py-4 text-zinc-300">
                  {p.usage_freq_qty} {p.unit} /{" "}
                  {getFrequencyLabel(p.usage_freq_days)}
                </td>

                {/* PRICE */}
                <td className="px-5 py-4 text-emerald-400 font-mono">
                  Rs {p.price ?? "—"}
                </td>

                {/* STATUS */}
                <td className="px-5 py-4">
                  {renderStockStatus(p.days_left, p.quantity)}
                  {renderExpiryStatus(p.expiry_days)}
                </td>

                {/* ACTIONS */}
                <td className="px-5 py-4 text-right">
                  <div
                    className="flex justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View Details Button (Explicit) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        setViewProduct(p);
                      }}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onConsumeClick(p);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-semibold"
                    >
                      Consume
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRestockProduct(p);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold"
                    >
                      Restock
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(p.id);
                      }}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render Modals */}
      {viewProduct && (
        <ProductDetailsModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}

      {restockProduct && (
        <RestockModal
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
          onConfirm={(id, data) => {
            // Pass data up to parent
            onRestockSubmit(id, data);
          }}
        />
      )}
    </>
  );
};

export default InventoryTable;
