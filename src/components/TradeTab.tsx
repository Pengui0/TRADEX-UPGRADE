import React, { useState, useEffect } from "react";
import { Asset, PriceData, PortfolioState, PendingOrder, ASSET_MAP } from "../types";
import { fU, fINR, fQ, fP } from "../utils";
import TradingViewChart from "./TradingViewChart";
import AssetLogo from "./AssetLogo";

interface TradeTabProps {
  selectedAsset: Asset | null;
  prices: { [id: string]: PriceData };
  portfolio: PortfolioState;
  activeTF: string;
  onTimeframeChange: (tf: string) => void;
  onExecuteTrade: (
    mode: "buy" | "sell",
    orderType: "market" | "limit" | "sl" | "tp",
    usdAmount: number,
    limitPrice: number
  ) => void;
  watchlist: string[];
  onToggleWatchlist: (id: string) => void;
}

export default function TradeTab({
  selectedAsset,
  prices,
  portfolio,
  activeTF,
  onTimeframeChange,
  onExecuteTrade,
  watchlist,
  onToggleWatchlist
}: TradeTabProps) {
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit" | "sl" | "tp">("market");

  // Inputs
  const [usdValue, setUsdValue] = useState("");
  const [limitValue, setLimitValue] = useState("");
  const [qtyValue, setQtyValue] = useState("");

  const activePriceData = selectedAsset ? prices[selectedAsset.id] : null;
  const isCrypto = selectedAsset ? selectedAsset.exch === "Crypto" : false;
  const activeCash = isCrypto ? portfolio.ccash : portfolio.scash;
  const holding = selectedAsset ? portfolio.h[selectedAsset.id] : null;

  // Sync inputs
  const syncFromUSD = (val: string) => {
    setUsdValue(val);
    const numUsd = parseFloat(val) || 0;
    if (activePriceData && activePriceData.p > 0) {
      const q = numUsd / activePriceData.p;
      setQtyValue(q > 0 ? q.toFixed(isCrypto ? 6 : 4) : "");
    } else {
      setQtyValue("");
    }
  };

  const syncFromQty = (val: string) => {
    setQtyValue(val);
    const numQty = parseFloat(val) || 0;
    if (activePriceData && activePriceData.p > 0) {
      const u = numQty * activePriceData.p;
      setUsdValue(u > 0 ? u.toFixed(2) : "");
    } else {
      setUsdValue("");
    }
  };

  // Quick percent buttons
  const setQuickAmt = (amt: number) => {
    syncFromUSD(amt.toString());
  };

  const setMax = () => {
    if (tradeMode === "buy") {
      syncFromUSD(Math.floor(activeCash).toString());
    } else if (holding && activePriceData) {
      syncFromUSD((holding.qty * activePriceData.p).toFixed(2));
    }
  };

  // Reset inputs when switching assets
  useEffect(() => {
    setUsdValue("");
    setQtyValue("");
    setLimitValue("");
    setOrderType("market");
  }, [selectedAsset]);

  // Handle Order execute
  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !activePriceData) return;

    const usd = parseFloat(usdValue) || 0;
    const limit = parseFloat(limitValue) || 0;

    onExecuteTrade(tradeMode, orderType, usd, limit);
    setUsdValue("");
    setQtyValue("");
    setLimitValue("");
  };

  // Calculate totals
  let totalHoldingsVal = 0;
  let totalInvestedVal = 0;
  Object.entries(portfolio.h).forEach(([id, h]) => {
    const p = prices[id]?.p || 0;
    totalHoldingsVal += h.qty * p;
    totalInvestedVal += h.qty * h.avgBuy;
  });

  const unrealisedPnl = totalHoldingsVal - totalInvestedVal + portfolio.realisedPnl;
  const totalBalance = portfolio.ccash + portfolio.scash;
  const netWorth = totalBalance + totalHoldingsVal;
  const pnlPercent = totalInvestedVal > 0 ? (unrealisedPnl / totalInvestedVal) * 100 : 0;

  const isStarred = selectedAsset ? watchlist.includes(selectedAsset.id) : false;

  return (
    <div className="space-y-4 animate-[fadeUp_0.35s_ease_both]">
      {/* Portfolio Quick Banner Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">🪙 Crypto Wallet</div>
          <div className="text-base font-mono font-bold mt-1 text-white">{fU(portfolio.ccash)}</div>
          <div className="text-[10px] font-mono text-white/40 mt-0.5">{fINR(portfolio.ccash)}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">📈 Stock Wallet</div>
          <div className="text-base font-mono font-bold mt-1 text-white">{fU(portfolio.scash)}</div>
          <div className="text-[10px] font-mono text-white/40 mt-0.5">{fINR(portfolio.scash)}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-green" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Holdings Value</div>
          <div className="text-base font-mono font-bold mt-1 text-green">{fU(totalHoldingsVal)}</div>
          <div className="text-[10px] font-mono text-white/40 mt-0.5">{fINR(totalHoldingsVal)}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-purple" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Total P&L</div>
          <div className={`text-base font-mono font-bold mt-1 ${unrealisedPnl >= 0 ? "text-green" : "text-red"}`}>
            {fU(unrealisedPnl)}
          </div>
          <div className={`text-[10px] font-mono font-bold mt-0.5 ${unrealisedPnl >= 0 ? "text-green" : "text-red"}`}>
            {fP(pnlPercent)}
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Net Worth</div>
          <div className="text-base font-mono font-bold mt-1 text-white">{fU(netWorth)}</div>
          <div className="text-[10px] font-mono text-white/40 mt-0.5">{fINR(netWorth)}</div>
        </div>
      </div>

      {/* Main Trade Grid (Left chart, Right execute desk) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Left Side: Chart details Card */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-card border border-white/5 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Asset branding details */}
            {selectedAsset && activePriceData ? (
              <>
                <div>
                  <div className="flex items-center gap-2.5 select-none">
                    <AssetLogo asset={selectedAsset} className="w-8 h-8" />
                    <h2 className="text-lg font-bold text-white leading-none">{selectedAsset.name}</h2>
                    <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold bg-[#141525] border border-white/5 rounded text-white/50">{selectedAsset.sym}</span>
                    <button
                      onClick={() => onToggleWatchlist(selectedAsset.id)}
                      className={`text-sm cursor-pointer transition-all ${
                        isStarred ? "text-yellow fill-yellow" : "text-white/20 hover:text-white"
                      }`}
                    >
                      ★
                    </button>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-mono font-black text-white">{fU(activePriceData.p)}</span>
                    <span className="text-xs font-mono text-white/40">{fINR(activePriceData.p)}</span>
                  </div>

                  <p className={`text-xs font-semibold mt-1 font-mono flex items-center gap-1 ${
                    activePriceData.c >= 0 ? "text-green" : "text-red"
                  }`}>
                    {activePriceData.c >= 0 ? "▲" : "▼"} {Math.abs(activePriceData.c).toFixed(2)}% today
                  </p>
                </div>

                {/* Additional metadata metrics */}
                <div className="flex flex-wrap md:flex-col items-start md:items-end gap-3 text-right">
                  <div className="flex gap-2 text-xs">
                    <span className="text-white/40 font-semibold">Low:</span>
                    <span className="font-mono text-red font-bold">{fU(activePriceData.lo)}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-white/40 font-semibold">High:</span>
                    <span className="font-mono text-green font-bold">{fU(activePriceData.hi)}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-white/40 font-semibold">Market Cap:</span>
                    <span className="font-mono text-white/70">{activePriceData.mc > 0 ? fU(activePriceData.mc, 0) : "N/A"}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-white/40 font-semibold">Exch:</span>
                    <span className="font-mono text-white/70">{selectedAsset.exch}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white/30 text-sm py-4">← Please select an asset from the sidebar to trade.</div>
            )}
          </div>

          {/* Interactive Chart Container */}
          {selectedAsset && (
            <TradingViewChart
              asset={selectedAsset}
              activeTF={activeTF}
              onTimeframeChange={onTimeframeChange}
              livePrice={activePriceData?.p}
            />
          )}
        </div>

        {/* Right Side: Order Desk execution Card */}
        <div className="bg-card border border-white/5 rounded-xl p-4 md:p-5 flex flex-col justify-between">
          <form onSubmit={handleExecute} className="space-y-4">
            
            {/* Wallet Cash breakdown info */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#05050a] border border-white/5 text-xs">
              <span className="text-white/40 font-semibold">
                {isCrypto ? "🪙 Crypto Wallet Balance:" : "📈 Stock Wallet Balance:"}
              </span>
              <span className="font-mono font-bold text-white">{fU(activeCash)}</span>
            </div>

            {/* Buy / Sell mode selectors */}
            <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5 gap-0.5 select-none">
              <button
                type="button"
                onClick={() => setTradeMode("buy")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md cursor-pointer transition-all uppercase tracking-wider ${
                  tradeMode === "buy" ? "bg-green text-[#030307] shadow-lg" : "text-white/40 hover:text-white"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeMode("sell")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md cursor-pointer transition-all uppercase tracking-wider ${
                  tradeMode === "sell" ? "bg-red text-white shadow-lg" : "text-white/40 hover:text-white"
                }`}
              >
                Sell
              </button>
            </div>

            {/* Order types selector */}
            <div className="grid grid-cols-4 gap-1 select-none">
              {["market", "limit", "sl", "tp"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type as any)}
                  className={`py-1 text-[10px] font-bold font-mono tracking-wide rounded-md cursor-pointer border uppercase transition-all ${
                    orderType === type
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "bg-transparent border-white/5 text-white/30 hover:text-white"
                  }`}
                >
                  {type === "sl" ? "Stop Loss" : type === "tp" ? "Take Profit" : type}
                </button>
              ))}
            </div>

            {/* Limit price input */}
            {orderType !== "market" && (
              <div className="space-y-1.5 animate-[fadeUp_0.15s_ease_both]">
                <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">
                  {orderType === "limit" ? "Limit Price (USD)" : orderType === "sl" ? "Stop Loss Price (USD)" : "Take Profit Price (USD)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                    placeholder="Enter limit price trigger"
                    className="w-full bg-[#05050a] border border-white/5 focus:border-accent rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-white/30">USD</span>
                </div>
              </div>
            )}

            {/* Hold positions strip info */}
            {holding && holding.qty > 0.00001 && selectedAsset && activePriceData && (
              <div className="p-3 bg-green/10 border border-green/20 rounded-lg text-xs leading-relaxed">
                You hold <span className="font-bold text-white">{fQ(holding.qty, isCrypto)}</span> units of {selectedAsset.sym}.
                <div className="mt-1 font-mono text-[10px] text-green">Worth {fU(holding.qty * activePriceData.p)} / {fINR(holding.qty * activePriceData.p)}</div>
              </div>
            )}

            {/* Investment amount (USD) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">Investment (USD)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={usdValue}
                  onChange={(e) => syncFromUSD(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#05050a] border border-white/5 focus:border-accent rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-white/30">USD</span>
              </div>
              {usdValue && (
                <p className="text-[10px] font-mono text-white/40 mt-1 pl-1">
                  ≈ {fINR(parseFloat(usdValue))}
                </p>
              )}
            </div>

            {/* Quick Sizing triggers */}
            <div className="grid grid-cols-6 gap-1 select-none">
              {[50, 100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickAmt(val)}
                  className="py-1 text-[9px] font-mono font-bold bg-[#05050a] border border-white/5 rounded-md hover:border-accent/40 text-white/40 hover:text-white cursor-pointer transition-all"
                >
                  ${val}
                </button>
              ))}
              <button
                type="button"
                onClick={setMax}
                className="py-1 text-[9px] font-mono font-bold bg-[#05050a] border border-white/5 rounded-md hover:border-accent/40 text-accent font-bold cursor-pointer transition-all"
              >
                MAX
              </button>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">Quantity</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={qtyValue}
                  onChange={(e) => syncFromQty(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#05050a] border border-white/5 focus:border-accent rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-white/30">
                  {selectedAsset ? selectedAsset.sym : "units"}
                </span>
              </div>
            </div>

            {/* Execution receipt breakdown summary */}
            <div className="bg-[#05050a] border border-white/5 rounded-xl p-3.5 space-y-2 select-none">
              <div className="flex justify-between text-xs text-white/40 font-semibold">
                <span>Unit Price</span>
                <span className="font-mono text-white">{selectedAsset && activePriceData ? fU(activePriceData.p) : "—"}</span>
              </div>
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>In Rupee</span>
                <span>{selectedAsset && activePriceData ? fINR(activePriceData.p) : "—"}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex justify-between text-xs text-white/40 font-semibold">
                <span>Est. Quantity</span>
                <span className="font-mono text-white">
                  {qtyValue ? `${qtyValue} ${selectedAsset?.sym || ""}` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-white/40 font-semibold">
                <span>Order Type</span>
                <span className="font-mono text-accent uppercase font-bold">{orderType}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex justify-between text-xs text-white/40 font-semibold">
                <span>Total Value</span>
                <span className="font-mono text-green font-bold">{usdValue ? fU(parseFloat(usdValue)) : "—"}</span>
              </div>
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>INR Cost</span>
                <span>{usdValue ? fINR(parseFloat(usdValue)) : "—"}</span>
              </div>
            </div>

            {/* Execution Button */}
            <button
              type="submit"
              disabled={!selectedAsset || !usdValue}
              className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide uppercase transition-all shadow-md cursor-pointer select-none ${
                !selectedAsset
                  ? "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                  : tradeMode === "buy"
                  ? "bg-green text-[#030307] hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_4px_20px_rgba(0,229,153,0.35)]"
                  : "bg-red text-white hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_4px_20px_rgba(255,77,102,0.35)]"
              }`}
            >
              {!selectedAsset
                ? "Select an asset first"
                : `${tradeMode === "buy" ? "Execute buy order" : "Execute sell order"} (${selectedAsset.sym})`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
