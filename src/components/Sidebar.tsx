import React, { useState } from "react";
import { Asset, CRYPTOS, STOCKS } from "../types";
import { fU } from "../utils";
import AssetLogo from "./AssetLogo";

interface SidebarProps {
  prices: { [id: string]: any };
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeAssetClass: "stocks" | "crypto";
  onAssetClassChange: (cl: "stocks" | "crypto") => void;
}

export default function Sidebar({
  prices,
  selectedId,
  onSelect,
  activeAssetClass,
  onAssetClassChange
}: SidebarProps) {
  const [search, setSearch] = useState("");

  const list = activeAssetClass === "stocks" ? STOCKS : CRYPTOS;

  const filtered = list.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.sym.toLowerCase().includes(search.toLowerCase())
  );

  // Group US vs Indian vs Global stocks if listing stocks with empty search
  const renderAssetItems = () => {
    if (activeAssetClass === "crypto" || search.trim() !== "") {
      return filtered.map((a) => assetItemHTML(a));
    }

    // Grouping stocks by Exchange/Region
    const regions = Array.from(new Set(STOCKS.map((s) => s.region)));

    return regions.map((reg) => {
      const items = filtered.filter((s) => s.region === reg);
      if (items.length === 0) return null;

      return (
        <div key={reg} className="mb-3">
          <div className="px-2 py-1 text-[9px] font-mono tracking-wider font-bold text-white/20 uppercase select-none">
            {reg} {items[0].exch}
          </div>
          <div className="space-y-0.5">
            {items.map((a) => assetItemHTML(a))}
          </div>
        </div>
      );
    });
  };

  const assetItemHTML = (a: Asset) => {
    const p = prices[a.id];
    const hasPrice = p && p.p > 0;
    const c = p?.c || 0;
    const up = c >= 0;

    return (
      <div
        key={a.id}
        onClick={() => onSelect(a.id)}
        className={`flex items-center justify-between p-2 mx-1 rounded-xl cursor-pointer select-none transition-all ${
          a.id === selectedId
            ? "bg-accent/15 border border-accent/25 shadow-md"
            : "border border-transparent hover:bg-white/[0.03]"
        }`}
      >
        <div className="flex items-center gap-2">
          <AssetLogo asset={a} className="w-7 h-7" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white truncate max-w-[65px]">
              {a.name}
            </div>
            <div className="text-[9px] font-mono text-white/30 mt-0.5 leading-none">
              {a.sym}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] font-mono font-semibold text-white">
            {hasPrice ? fU(p.p) : "..."}
          </div>
          <div className={`text-[9px] font-mono font-bold mt-0.5 ${up ? "text-green" : "text-red"}`}>
            {hasPrice ? `${up ? "▲" : "▼"}${Math.abs(c).toFixed(2)}%` : "—"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[215px] flex-shrink-0 border border-white/5 flex flex-col bg-card/65 backdrop-blur-md rounded-2xl overflow-hidden h-full select-none shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      
      {/* Category Toggles */}
      <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5 m-2.5 gap-0.5 select-none">
        <button
          onClick={() => onAssetClassChange("stocks")}
          className={`flex-1 py-1 text-[11px] font-bold rounded-md cursor-pointer transition-all ${
            activeAssetClass === "stocks"
              ? "bg-[#0c0c16] text-white border border-white/5 shadow-inner"
              : "text-white/40 hover:text-white"
          }`}
        >
          Stocks
        </button>
        <button
          onClick={() => onAssetClassChange("crypto")}
          className={`flex-1 py-1 text-[11px] font-bold rounded-md cursor-pointer transition-all ${
            activeAssetClass === "crypto"
              ? "bg-[#0c0c16] text-white border border-white/5 shadow-inner"
              : "text-white/40 hover:text-white"
          }`}
        >
          Crypto
        </button>
      </div>

      {/* Search Input */}
      <div className="px-2.5 pb-2.5 border-b border-white/5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-[#05050a] border border-white/5 focus:border-accent rounded-lg px-2.5 py-1 text-[11px] text-white outline-none transition-all placeholder-white/20"
        />
      </div>

      {/* Asset List View */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {renderAssetItems()}
      </div>

    </div>
  );
}
