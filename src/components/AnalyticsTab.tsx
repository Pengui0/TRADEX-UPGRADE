import React, { useEffect, useRef } from "react";
import { PortfolioState, PriceData, ASSET_MAP } from "../types";
import { fU, fP, fINR } from "../utils";

interface AnalyticsTabProps {
  portfolio: PortfolioState;
  prices: { [id: string]: PriceData };
  equityHistory: { time: number; value: number }[];
}

export default function AnalyticsTab({ portfolio, prices, equityHistory }: AnalyticsTabProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filter Buy/Sell actions
  const buys = portfolio.orders.filter((o) => o.type === "buy");
  const sells = portfolio.orders.filter((o) => o.type === "sell");

  // Track closed positions performance
  const trades: { sym: string; profit: number; name: string }[] = [];
  let wins = 0;
  let losses = 0;

  sells.forEach((s) => {
    const buyActions = buys.filter((b) => b.id === s.id);
    if (buyActions.length === 0) return;

    // Average cost basis for buy actions
    const avgBuyPrice = buyActions.reduce((acc, b) => s.qty >= b.qty ? acc + b.price : acc, 0) / (buyActions.length || 1);
    const profit = (s.price - avgBuyPrice) * s.qty;

    trades.push({
      sym: s.sym,
      profit,
      name: ASSET_MAP[s.id]?.name || s.sym
    });

    if (profit >= 0) wins++;
    else losses++;
  });

  const totalClosedTrades = wins + losses;
  const winRate = totalClosedTrades > 0 ? (wins / totalClosedTrades) * 100 : null;

  // Best / Worst trades
  const sortedTrades = [...trades].sort((a, b) => b.profit - a.profit);
  const bestTrade = sortedTrades[0];
  const worstTrade = sortedTrades[sortedTrades.length - 1];

  // Cumulative total profit
  const totalProfit = trades.reduce((acc, t) => acc + t.profit, 0);
  const avgProfitPerTrade = totalClosedTrades > 0 ? totalProfit / totalClosedTrades : null;

  // Sharpe Ratio (Standard Mean Return / StdDev)
  let sharpeRatio = "—";
  if (trades.length > 1) {
    const mean = totalProfit / trades.length;
    const variance = trades.reduce((acc, t) => acc + Math.pow(t.profit - mean, 2), 0) / trades.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0) {
      sharpeRatio = (mean / stdDev).toFixed(2);
    }
  }

  // Current Asset Allocations
  let totalHoldingsVal = 0;
  const holdingsList = Object.entries(portfolio.h)
    .filter(([, h]) => h.qty > 0.00001)
    .map(([id, h]) => {
      const val = h.qty * (prices[id]?.p || 0);
      totalHoldingsVal += val;
      return { id, val };
    });

  const totalWorth = portfolio.ccash + portfolio.scash + totalHoldingsVal;

  const allocations = [
    { label: "💵 Cash (Crypto)", val: portfolio.ccash, col: "bg-accent" },
    { label: "💵 Cash (Stocks)", val: portfolio.scash, col: "bg-yellow" },
    ...holdingsList.map((item) => {
      const asset = ASSET_MAP[item.id];
      return {
        label: asset ? asset.sym : item.id,
        val: item.val,
        col: "bg-green"
      };
    })
  ].filter((item) => item.val > 0.01);

  // Redraw Equity Curve Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.parentElement?.offsetWidth || 600;
    const H = 200;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const historyToDraw = [...equityHistory];
    
    // Seed default baseline if not enough points
    if (historyToDraw.length < 2) {
      const baseline = portfolio.ccash + portfolio.scash;
      historyToDraw.push({ time: Date.now() - 3600000, value: baseline * 0.98 });
      historyToDraw.push({ time: Date.now(), value: baseline });
    }

    const vals = historyToDraw.map((p) => p.value);
    const mn = Math.min(...vals) * 0.998;
    const mx = Math.max(...vals) * 1.002;
    const range = mx - mn || 1;

    const xs = vals.map((_, i) => (i / (vals.length - 1)) * W);
    const ys = vals.map((v) => H - ((v - mn) / range) * (H * 0.8) - H * 0.1);

    const isUp = vals[vals.length - 1] >= vals[0];
    const curveColor = isUp ? "#00e599" : "#ff4d66";

    // Clear background
    ctx.fillStyle = "#07070d";
    ctx.fillRect(0, 0, W, H);

    // Horizontal grid guidelines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach((f) => {
      ctx.beginPath();
      ctx.moveTo(0, H * f);
      ctx.lineTo(W, H * f);
      ctx.stroke();
    });

    // Fading Gradient Area Fill
    const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
    fillGrad.addColorStop(0, isUp ? "rgba(0, 229, 153, 0.15)" : "rgba(255, 77, 102, 0.15)");
    fillGrad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
      const midX = (xs[i - 1] + xs[i]) / 2;
      ctx.bezierCurveTo(midX, ys[i - 1], midX, ys[i], xs[i], ys[i]);
    }
    ctx.lineTo(xs[xs.length - 1], H);
    ctx.lineTo(xs[0], H);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Solid Line
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
      const midX = (xs[i - 1] + xs[i]) / 2;
      ctx.bezierCurveTo(midX, ys[i - 1], midX, ys[i], xs[i], ys[i]);
    }
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = "rgba(132, 137, 165, 0.5)";
    ctx.font = "9px DM Mono";
    ctx.textAlign = "left";
    ctx.fillText(fU(mx), 6, 12);
    ctx.fillText(fU(mn), 6, H - 6);

    ctx.textAlign = "right";
    ctx.fillText(fU(vals[vals.length - 1]), W - 6, ys[ys.length - 1] - 6);

  }, [equityHistory, totalWorth]);

  return (
    <div className="space-y-4 animate-[fadeUp_0.35s_ease_both]">
      {/* Analytics stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-green" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Win Rate</div>
          <div className={`text-base font-mono font-bold mt-1 ${winRate !== null && parseFloat(winRate.toFixed(1)) >= 50 ? "text-green" : "text-red"}`}>
            {winRate !== null ? `${winRate.toFixed(1)}%` : "—"}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            {totalClosedTrades > 0 ? `${wins} wins / ${totalClosedTrades} trades` : "No closed trades yet"}
          </div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Avg Profit / Trade</div>
          <div className={`text-base font-mono font-bold mt-1 ${avgProfitPerTrade !== null && avgProfitPerTrade >= 0 ? "text-green" : "text-red"}`}>
            {avgProfitPerTrade !== null ? fU(avgProfitPerTrade) : "—"}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">per closed transaction</div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-green" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Best Position</div>
          <div className="text-base font-mono font-bold mt-1 text-green">
            {bestTrade ? fU(bestTrade.profit) : "—"}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5 font-bold uppercase truncate max-w-[120px]">
            {bestTrade ? bestTrade.sym : "—"}
          </div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-red" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Worst Position</div>
          <div className="text-base font-mono font-bold mt-1 text-red">
            {worstTrade && worstTrade !== bestTrade ? fU(worstTrade.profit) : "—"}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5 font-bold uppercase truncate max-w-[120px]">
            {worstTrade && worstTrade !== bestTrade ? worstTrade.sym : "—"}
          </div>
        </div>
        <div className="bg-card border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow" />
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Sharpe Ratio</div>
          <div className={`text-base font-mono font-bold mt-1 ${parseFloat(sharpeRatio) >= 1 ? "text-green" : "text-white"}`}>
            {sharpeRatio}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">risk-adjusted return</div>
        </div>
      </div>

      {/* Equity Curve Graph */}
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">📈 Portfolio Equity Curve</h3>
          <p className="text-[10px] text-white/40 mt-0.5">Simulated account net worth trajectory over time</p>
        </div>
        <div className="p-4 bg-[#07070d]">
          <canvas ref={canvasRef} className="block w-full h-[200px]" />
        </div>
      </div>

      {/* Performers & Allocation Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Performers breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Top closed trades */}
          <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 text-center select-none">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">🥇 Top Performers</h4>
            </div>
            <div className="p-4 space-y-3 font-mono">
              {sortedTrades.slice(0, 3).length > 0 ? (
                sortedTrades.slice(0, 3).map((t, i) => (
                  <div key={`tp-${i}`} className="flex justify-between text-xs border-b border-white/5 pb-2">
                    <span className="text-white/60 font-bold uppercase">{t.sym}</span>
                    <span className="text-green font-bold">{fU(t.profit)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-white/20 font-sans text-xs">No closed transactions yet.</div>
              )}
            </div>
          </div>

          {/* Worst closed trades */}
          <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 text-center select-none">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">📉 Worst Performers</h4>
            </div>
            <div className="p-4 space-y-3 font-mono">
              {sortedTrades.slice(-3).reverse().filter(t => t !== bestTrade).length > 0 ? (
                sortedTrades.slice(-3).reverse().filter(t => t !== bestTrade).map((t, i) => (
                  <div key={`wp-${i}`} className="flex justify-between text-xs border-b border-white/5 pb-2">
                    <span className="text-white/60 font-bold uppercase">{t.sym}</span>
                    <span className="text-red font-bold">{fU(t.profit)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-white/20 font-sans text-xs">No loss-making closed positions.</div>
              )}
            </div>
          </div>
        </div>

        {/* Current capital Allocation pie bar chart */}
        <div className="bg-card border border-white/5 rounded-xl p-4 select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">🥧 Simulated Asset Allocation</h3>
          <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1">
            {allocations.map((item, idx) => {
              const pct = totalWorth > 0 ? (item.val / totalWorth) * 100 : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-white/40">
                    <span>{item.label}</span>
                    <span className="font-mono text-white">
                      {fU(item.val)} <span className="text-[10px] text-white/30 ml-1">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#05050a] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.col}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
