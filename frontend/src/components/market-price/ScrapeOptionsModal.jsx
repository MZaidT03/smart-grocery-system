import React from 'react';
import { CheckCircle2, PackageOpen, Box, X } from 'lucide-react';

const ScrapeOptionsModal = ({ visible, onClose, selectedCount, onScrapeSelected, onScrapeAll }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Scan Market</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-zinc-400 mb-6">
          Which products would you like to scan for updated prices?
        </p>

        <div className="flex flex-col gap-3">
          {selectedCount > 0 && (
            <button
              onClick={onScrapeSelected}
              className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-emerald-500/50 transition text-left group"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition" />
              <div>
                <h3 className="font-bold text-white">Selected Items</h3>
                <p className="text-sm text-zinc-500">Scan only the {selectedCount} items you selected.</p>
              </div>
            </button>
          )}



          <button
            onClick={onScrapeAll}
            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition text-left group"
          >
            <Box className="w-6 h-6 text-zinc-300 group-hover:text-white transition" />
            <div>
              <h3 className="font-bold text-white">All Products</h3>
              <p className="text-sm text-zinc-500">Scan your entire inventory.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScrapeOptionsModal;
