import React, { useState } from "react";
import { PortfolioState, PriceData, ASSET_MAP } from "../types";
import { fU, fINR, fQ, fP } from "../utils";
import AssetLogo from "./AssetLogo";

interface PortfolioTabProps {
  portfolio: PortfolioState;
  prices: { [id: string]: PriceData };
  onQuickSell: (id: string) => void;
  onSelectAndTrade: (id: string, assetClass: "stocks" | "crypto") => void;
  onSetBudget: (budget: number) => void;
  onClearBudget: () => void;
}

export default function PortfolioTab({
  portfolio,
  prices,
  onQuickSell,
  onSelectAndTrade,
  onSetBudget,
  onClearBudget
}: PortfolioTabProps) {
  const [budgetVal, setBudgetVal] = useState("");

  const holdingsList = Object.entries(portfolio.h).filter(([, h]) => h.qty > 0.00001);

  // Totals calculations
  let totalHoldingsVal = 0;
  let totalInvestedVal = 0;
  holdingsList.forEach(([id, h]) => {
    const p = prices[id]?.p || 0;
    totalHoldingsVal += h.qty * p;
    totalInvestedVal += h.qty * h.avgBuy;
  });

  const unrealisedPnl = totalHoldingsVal - totalInvestedVal + portfolio.realisedPnl;
  const totalBalance = portfolio.ccash + portfolio.scash;
  const netWorth = totalBalance + totalHoldingsVal;
  const pnlPercent = totalInvestedVal > 0 ? (unrealisedPnl / totalInvestedVal) * 100 : 0;

  // Set Investment limit budget
  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(budgetVal) || 0;
    if (b <= 0) return;
    onSetBudget(b);
    setBudgetVal("");
  };

  const budgetPct = portfolio.budget > 0 ? Math.min((totalHoldingsVal / portfolio.budget) * 100, 100) : 0;
  const budgetExceeded = totalHoldingsVal > portfolio.budget;

  return (
    <div className="space-y-4 animate-[fadeUp_0.35s_ease_both]">
      {/* Portfolio Quick Stats Card Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Cash (Stocks + Cryptos)</div>
          <div className="text-base font-mono font-bold mt-1 text-white">{fU(totalBalance)}</div>
          <div className="text-[10px] font-mono text-white/40 mt-0.5">{fINR(totalBalance)}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-green" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Holdings</div>
          <div className="text-base font-mono font-bold mt-1 text-green">{fU(totalHoldingsVal)}</div>
          <div className="text-[10px] font-mono text-white/40 mt-0.5">{fINR(totalHoldingsVal)}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-purple" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Total Profit / Loss</div>
          <div className={`text-base font-mono font-bold mt-1 ${unrealisedPnl >= 0 ? "text-green" : "text-red"}`}>
            {fU(unrealisedPnl)}
          </div>
          <div className={`text-[10px] font-mono font-bold mt-0.5 ${unrealisedPnl >= 0 ? "text-green" : "text-red"}`}>
            {fP(pnlPercent)}
          </div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Total Net Worth</div>
          <div className="text-base font-mono font-bold mt-1 text-white">{fU(netWorth)}</div>
          <div className="text-[10px] font-mono text-white/40 mt-0.5">{fINR(netWorth)}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Investment Limit Limit</div>
          <div className="text-base font-mono font-bold mt-1 text-white">
            {portfolio.budget > 0 ? fU(portfolio.budget) : "NOT SET"}
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-full transition-all duration-500 ${
                budgetExceeded ? "bg-red" : budgetPct > 80 ? "bg-yellow" : "bg-green"
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Investment Spending Limit panel */}
      <div className="bg-card border border-white/5 rounded-xl p-4 md:p-5 select-none">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">💰 Investing Limit Budget</h3>
        <p className="text-[11px] text-white/40 mb-4 leading-relaxed">
          Define a max cap budget for your holdings to prevent over-allocating on speculative stocks or cryptos.
        </p>

        <form onSubmit={handleBudgetSubmit} className="flex flex-wrap items-end gap-3.5">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">Max Investment limit (USD)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-[#05050a] border border-white/5 focus:border-accent rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-white/20">USD</span>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-accent/80 hover:scale-[1.01]"
          >
            Set Limit
          </button>
          {portfolio.budget > 0 && (
            <button
              type="button"
              onClick={onClearBudget}
              className="px-4 py-2 bg-transparent border border-white/5 text-white/40 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-white/5"
            >
              Clear Limit
            </button>
          )}
        </form>

        {/* Budget Warning strip */}
        {portfolio.budget > 0 && (
          <div className="mt-4">
            {budgetExceeded ? (
              <div className="p-3 bg-red/10 border border-red/20 text-red text-xs rounded-lg font-semibold flex items-center gap-2">
                🚨 Over investing limit by {fU(totalHoldingsVal - portfolio.budget)}! Please trim some positions.
              </div>
            ) : budgetPct >= 80 ? (
              <div className="p-3 bg-yellow/10 border border-yellow/20 text-yellow text-xs rounded-lg font-semibold flex items-center gap-2">
                ⚠️ Budget limit utilization at {budgetPct.toFixed(0)}% — {fU(portfolio.budget - totalHoldingsVal)} remaining.
              </div>
            ) : (
              <div className="p-3 bg-green/10 border border-green/20 text-green text-xs rounded-lg font-semibold flex items-center gap-2">
                ✓ Investing budget is healthy! {fU(portfolio.budget - totalHoldingsVal)} headroom remaining.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Positions list table */}
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 flex items-center justify-between select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Open Positions</h3>
          <span className="text-[10px] font-mono text-white/40">{holdingsList.length} positions total</span>
        </div>

        {holdingsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/5 text-[10px] font-mono font-bold tracking-wider text-white/30 uppercase">
                  <th className="p-3 pl-4">Asset</th>
                  <th className="p-3">Avg Buy</th>
                  <th className="p-3">Current Price</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Holding Value</th>
                  <th className="p-3">P&L Contribution</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {holdingsList.map(([id, h]) => {
                  const asset = ASSET_MAP[id];
                  const pr = prices[id];
                  if (!asset || !pr) return null;

                  const cv = h.qty * pr.p;
                  const inv = h.qty * h.avgBuy;
                  const p = cv - inv;
                  const pp = inv > 0 ? (p / inv) * 100 : 0;
                  const up = p >= 0;

                  return (
                    <tr key={id} className="hover:bg-white/[0.01] transition-all">
                      {/* Asset */}
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2.5">
                          <AssetLogo asset={asset} className="w-8 h-8" />
                          <div>
                            <div className="font-bold text-white">{asset.name}</div>
                            <div className="text-[10px] font-mono text-white/30 mt-0.5">{asset.sym}</div>
                          </div>
                        </div>
                      </td>

                      {/* Avg Buy */}
                      <td className="p-3 font-mono">
                        <div className="text-white">{fU(h.avgBuy)}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{fINR(h.avgBuy)}</div>
                      </td>

                      {/* Current Price */}
                      <td className="p-3 font-mono">
                        <div className="text-white">{fU(pr.p)}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{fINR(pr.p)}</div>
                      </td>

                      {/* Quantity */}
                      <td className="p-3 font-mono text-white/70">
                        {fQ(h.qty, asset.exch === "Crypto")}
                      </td>

                      {/* Holding Value */}
                      <td className="p-3 font-mono">
                        <div className="text-white font-bold">{fU(cv)}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{fINR(cv)}</div>
                      </td>

                      {/* P&L */}
                      <td className="p-3">
                        <span className={`font-mono font-bold ${up ? "text-green" : "text-red"}`}>
                          {fU(p)}
                        </span>
                        <div className="mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                            up ? "bg-green/10 text-green" : "bg-red/10 text-red"
                          }`}>
                            {up ? "▲" : "▼"}{Math.abs(pp).toFixed(2)}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectAndTrade(id, asset.exch === "Crypto" ? "crypto" : "stocks")}
                            className="px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-white/15 text-white/70 hover:text-white text-xs font-semibold cursor-pointer transition-all"
                          >
                            Sell...
                          </button>
                          <button
                            onClick={() => onQuickSell(id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red/10 border border-red/20 text-red text-xs font-semibold cursor-pointer hover:bg-red/20 transition-all"
                          >
                            Quick Sell All
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center select-none">
            <span className="text-3xl">📂</span>
            <h4 className="text-sm font-bold text-white mt-3">Your simulated portfolio is empty.</h4>
            <p className="text-xs text-white/30 mt-1">Select an asset from the sidebar or markets tab to execute your first mock order.</p>
          </div>
        )}
      </div>
    </div>
  );
}
