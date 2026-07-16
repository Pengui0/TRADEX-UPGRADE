import React, { useState } from "react";
import { Asset, PriceData, ALL_ASSETS, ASSET_MAP } from "../types";
import { fU, fINR } from "../utils";
import AssetLogo from "./AssetLogo";

interface WatchlistTabProps {
  prices: { [id: string]: PriceData };
  watchlist: string[];
  onAddToWatchlist: (id: string) => void;
  onRemoveFromWatchlist: (id: string) => void;
  onClearWatchlist: () => void;
  recentViewed: string[];
  onSelectAndTrade: (id: string, assetClass: "stocks" | "crypto") => void;
}

export default function WatchlistTab({
  prices,
  watchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onClearWatchlist,
  recentViewed,
  onSelectAndTrade
}: WatchlistTabProps) {
  const [selectedAddId, setSelectedAddId] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddId) return;
    onAddToWatchlist(selectedAddId);
    setSelectedAddId("");
  };

  const assetsToAddToWatchlist = ALL_ASSETS.filter((a) => !watchlist.includes(a.id));

  // Render a single watchlist card
  const renderWatchlistCard = (id: string, isRemovable: boolean) => {
    const asset = ASSET_MAP[id];
    const p = prices[id];
    if (!asset) return null;

    const up = p ? p.c >= 0 : true;

    return (
      <div
        key={id}
        onClick={() => onSelectAndTrade(id, asset.exch === "Crypto" ? "crypto" : "stocks")}
        className="bg-[#090912] border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-white/10 hover:scale-[1.01] transition-all relative flex flex-col justify-between select-none"
      >
        {isRemovable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromWatchlist(id);
            }}
            title="Remove from Watchlist"
            className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-red/15 hover:text-red rounded-full text-white/30 transition-all cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        )}

        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2.5">
            <AssetLogo asset={asset} className="w-8 h-8" />
            <div>
              <div className="text-xs font-bold text-white truncate max-w-[110px]">{asset.name}</div>
              <div className="text-[10px] font-mono text-white/30 mt-0.5">{asset.sym}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-white">
              {p ? fU(p.p) : "..."}
            </div>
            <div className={`text-[10px] font-mono font-black mt-0.5 ${up ? "text-green" : "text-red"}`}>
              {p ? `${up ? "▲" : "▼"}${Math.abs(p.c).toFixed(2)}%` : "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1 border-t border-white/5 mb-3">
          <span>In Rupee</span>
          <span>{p ? fINR(p.p) : "—"}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectAndTrade(id, asset.exch === "Crypto" ? "crypto" : "stocks");
            }}
            className="py-1.5 bg-green/10 text-green border border-green/20 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer hover:bg-green/20"
          >
            ▲ Buy
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectAndTrade(id, asset.exch === "Crypto" ? "crypto" : "stocks");
            }}
            className="py-1.5 bg-red/10 text-red border border-red/20 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer hover:bg-red/20"
          >
            ▼ Sell
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-[fadeUp_0.35s_ease_both]">
      {/* Watchlist starred items card list */}
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 flex items-center justify-between select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">⭐ My Watchlist</h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/40">{watchlist.length} bookmarked</span>
            {watchlist.length > 0 && (
              <button
                onClick={onClearWatchlist}
                className="px-2.5 py-1 text-[10px] font-bold text-red border border-red/20 hover:bg-red/10 rounded cursor-pointer transition-all"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Dropdown search adding form */}
        <form onSubmit={handleAdd} className="p-3 border-b border-white/5 flex gap-2.5 items-center select-none">
          <select
            value={selectedAddId}
            onChange={(e) => setSelectedAddId(e.target.value)}
            className="flex-1 bg-[#05050a] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
          >
            <option value="">Choose asset to bookmark...</option>
            {assetsToAddToWatchlist.map((a) => (
              <option key={a.id} value={a.id}>
                {a.sym} — {a.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!selectedAddId}
            className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/80 transition-all cursor-pointer disabled:opacity-40"
          >
            + Add Bookmark
          </button>
        </form>

        <div className="p-4">
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.map((id) => renderWatchlistCard(id, true))}
            </div>
          ) : (
            <div className="p-8 text-center select-none">
              <span className="text-2xl">⭐</span>
              <h4 className="text-sm font-bold text-white mt-3">Watchlist is empty.</h4>
              <p className="text-xs text-white/30 mt-1">Bookmark stocks or cryptos to display them in this quick-track matrix.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed items panel */}
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">🕐 Recently Viewed</h3>
        </div>

        <div className="p-4">
          {recentViewed.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentViewed.map((id) => renderWatchlistCard(id, false))}
            </div>
          ) : (
            <div className="p-8 text-center select-none">
              <span className="text-2xl">🕐</span>
              <h4 className="text-sm font-bold text-white mt-3">No recently viewed items.</h4>
              <p className="text-xs text-white/30 mt-1">Recently selected and traded assets will populate here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
