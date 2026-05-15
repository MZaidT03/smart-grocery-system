import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

const PricePreviewModal = ({ visible, onClose, results, onSave, saving }) => {
  const [editableResults, setEditableResults] = useState([]);

  useEffect(() => {
    if (visible) {
      setEditableResults([...results]);
    }
  }, [visible, results]);

  const handlePriceChange = (index, val) => {
    const updated = [...editableResults];
    updated[index].new_price = val === '' ? '' : Number(val);
    setEditableResults(updated);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Review Prices</h2>
            <p className="text-sm text-zinc-400 mt-1">Review fetched prices and manually adjust if needed.</p>
          </div>
          <button onClick={onClose} disabled={saving} className="text-zinc-500 hover:text-white transition p-2 bg-zinc-900 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto flex-1">
          {editableResults.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              No prices found to update.
            </div>
          ) : (
            <div className="space-y-4">
              {editableResults.map((item, idx) => (
                <div key={item.product_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white truncate" title={item.item_name}>{item.item_name}</h3>
                    <div className="flex flex-col mt-1 gap-0.5">
                      <p className="text-xs text-zinc-500">
                        Was: <span className="text-zinc-400">Rs {item.old_price}</span>
                      </p>
                      <p className="text-[10px] text-zinc-600 uppercase font-semibold">
                        Source: Al-Fatah Online
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-zinc-500 text-sm">Rs</span>
                    <input
                      type="number"
                      value={item.new_price}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      className="w-28 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-emerald-400 font-bold text-right focus:outline-none focus:border-emerald-500 transition"
                      min="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex gap-4 shrink-0 bg-zinc-950/50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 text-white font-semibold hover:bg-zinc-800/70 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editableResults)}
            disabled={saving || editableResults.length === 0}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            ) : (
              <><Check className="w-5 h-5" /> Done & Save</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PricePreviewModal;
