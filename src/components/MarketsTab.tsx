import React, { useState } from "react";
import { CRYPTOS, STOCKS, Asset, PriceData } from "../types";
import { fU, fINR } from "../utils";
import AssetLogo from "./AssetLogo";

interface MarketsTabProps {
  prices: { [id: string]: PriceData };
  onSelectAndTrade: (id: string, assetClass: "stocks" | "crypto") => void;
}

const SECTORS = ["All", "Tech", "Finance", "Energy", "Auto", "FMCG", "Health", "Retail", "Industrial", "Media"];

export default function MarketsTab({ prices, onSelectAndTrade }: MarketsTabProps) {
  const [activeSector, setActiveSector] = useState("All");

  // Filter stocks
  const filteredStocks = activeSector === "All"
    ? STOCKS
    : STOCKS.filter((s) => s.sector === activeSector);

  // Compute gainers/losers metrics
  const allPrices = Object.values(prices);
  const totalAssets = CRYPTOS.length + STOCKS.length;
  const gainers = allPrices.filter((p) => p.c > 0).length;
  const losers = allPrices.filter((p) => p.c < 0).length;

  return (
    <div className="space-y-4 animate-[fadeUp_0.35s_ease_both]">
      {/* Markets Banner Card Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Total Assets Tracked</div>
          <div className="text-base font-mono font-bold mt-1 text-white">{totalAssets}</div>
          <div className="text-[10px] text-white/40 mt-0.5">15 cryptos · 90+ stocks</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-green" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Gainers Today</div>
          <div className="text-base font-mono font-bold mt-1 text-green">{gainers}</div>
          <div className="text-[10px] text-white/40 mt-0.5">Assets with positive change</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-red" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Losers Today</div>
          <div className="text-base font-mono font-bold mt-1 text-red">{losers}</div>
          <div className="text-[10px] text-white/40 mt-0.5">Assets with negative change</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Price Sources</div>
          <div className="text-base font-bold mt-1 text-yellow">Live Nasdaq / CoinGecko Quotes</div>
          <div className="text-[10px] text-white/40 mt-0.5">Real-time pricing for stocks and crypto</div>
        </div>
      </div>

      {/* Sector filters */}
      <div className="flex flex-wrap items-center gap-1.5 py-1 select-none">
        {SECTORS.map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSector(sec)}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
              activeSector === sec
                ? "bg-accent border-accent text-white shadow-[0_2px_8px_rgba(94,102,255,0.4)]"
                : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white"
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Crypto section */}
      {activeSector === "All" && (
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 flex items-center justify-between select-none">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">🪙 Cryptocurrency Market</h3>
            <span className="text-[10px] font-mono text-white/40">{CRYPTOS.length} coins</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/5 text-[10px] font-mono font-bold tracking-wider text-white/30 uppercase">
                  <th className="p-3 pl-4">Asset</th>
                  <th className="p-3">Price USD</th>
                  <th className="p-3">Price INR</th>
                  <th className="p-3">24h Change</th>
                  <th className="p-3">Market Cap</th>
                  <th className="p-3">Asset Type</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {CRYPTOS.map((a) => {
                  const p = prices[a.id];
                  if (!p) return null;
                  const up = p.c >= 0;

                  return (
                    <tr key={a.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-3 pl-4 font-sans">
                        <div className="flex items-center gap-2.5">
                          <AssetLogo asset={a} className="w-8 h-8" />
                          <div>
                            <div className="font-bold text-white">{a.name}</div>
                            <div className="text-[10px] font-mono text-white/30 mt-0.5">{a.sym}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-white font-bold">{fU(p.p)}</td>
                      <td className="p-3 text-white/50">{fINR(p.p)}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          up ? "bg-green/10 text-green" : "bg-red/10 text-red"
                        }`}>
                          {up ? "▲" : "▼"}{Math.abs(p.c).toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-white/70">{p.mc > 0 ? fU(p.mc, 0) : "—"}</td>
                      <td className="p-3 font-sans"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#111224] text-white/50 border border-white/5">CRYPTO</span></td>
                      <td className="p-3 pr-4 text-right font-sans">
                        <button
                          onClick={() => onSelectAndTrade(a.id, "crypto")}
                          className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/80 transition-all cursor-pointer"
                        >
                          Execute Order
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stocks section */}
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 flex items-center justify-between select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            📈 {activeSector !== "All" ? `${activeSector} ` : ""}Equity Securities
          </h3>
          <span className="text-[10px] font-mono text-white/40">{filteredStocks.length} equities shown</span>
        </div>

        {filteredStocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/5 text-[10px] font-mono font-bold tracking-wider text-white/30 uppercase">
                  <th className="p-3 pl-4">Company</th>
                  <th className="p-3">Price USD</th>
                  <th className="p-3">Price INR</th>
                  <th className="p-3">24h Change</th>
                  <th className="p-3">Exchange</th>
                  <th className="p-3">Region</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {filteredStocks.map((a) => {
                  const p = prices[a.id];
                  if (!p) return null;
                  const up = p.c >= 0;

                  return (
                    <tr key={a.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-3 pl-4 font-sans">
                        <div className="flex items-center gap-2.5">
                          <AssetLogo asset={a} className="w-8 h-8" />
                          <div>
                            <div className="font-bold text-white">{a.name}</div>
                            <div className="text-[10px] font-mono text-white/30 mt-0.5">{a.sym}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-white font-bold">{fU(p.p)}</td>
                      <td className="p-3 text-white/50">{fINR(p.p)}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          up ? "bg-green/10 text-green" : "bg-red/10 text-red"
                        }`}>
                          {up ? "▲" : "▼"}{Math.abs(p.c).toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 font-sans"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#111224] text-white/50 border border-white/5">{a.exch}</span></td>
                      <td className="p-3 text-white/70 font-sans">{a.region}</td>
                      <td className="p-3 pr-4 text-right font-sans">
                        <button
                          onClick={() => onSelectAndTrade(a.id, "stocks")}
                          className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/80 transition-all cursor-pointer"
                        >
                          Execute Order
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center select-none font-sans">
            <span className="text-2xl">📋</span>
            <h4 className="text-sm font-bold text-white mt-3">No equities in this sector.</h4>
            <p className="text-xs text-white/30 mt-1">Please select another sector or view the All tab.</p>
          </div>
        )}
      </div>
    </div>
  );
}
