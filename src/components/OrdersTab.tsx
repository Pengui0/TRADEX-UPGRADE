import React from "react";
import { PortfolioState, PendingOrder, ASSET_MAP } from "../types";
import { fU, fINR, fQ, fT } from "../utils";

interface OrdersTabProps {
  portfolio: PortfolioState;
  pendingOrders: PendingOrder[];
  onCancelPending: (idx: number) => void;
  onClearHistory: () => void;
}

export default function OrdersTab({
  portfolio,
  pendingOrders,
  onCancelPending,
  onClearHistory
}: OrdersTabProps) {
  return (
    <div className="space-y-4 animate-[fadeUp_0.35s_ease_both]">
      {/* Pending / Active Trigger orders */}
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 flex items-center justify-between select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">🕐 Active Pending Orders</h3>
          <span className="text-[10px] font-mono text-white/40">{pendingOrders.length} pending triggers</span>
        </div>

        {pendingOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/5 text-[10px] font-mono font-bold tracking-wider text-white/30 uppercase">
                  <th className="p-3 pl-4">Asset</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Trigger Mode</th>
                  <th className="p-3">Target Price</th>
                  <th className="p-3">Set Value</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Set Date</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {pendingOrders.map((o, idx) => {
                  const asset = ASSET_MAP[o.id];
                  if (!asset) return null;

                  return (
                    <tr key={`p-${idx}`} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono uppercase"
                            style={{ backgroundColor: asset.bg, color: asset.col }}
                          >
                            {asset.sym.substring(0, 4)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{asset.name}</div>
                            <div className="text-[10px] font-mono text-white/30 mt-0.5">{asset.sym}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          o.mode === "buy" ? "bg-green/10 text-green" : "bg-red/10 text-red"
                        }`}>
                          {o.mode}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/10 text-accent">
                          {o.orderType}
                        </span>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="text-white font-bold">{fU(o.limitPrice)}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{fINR(o.limitPrice)}</div>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="text-white">{fU(o.usd)}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{fINR(o.usd)}</div>
                      </td>

                      <td className="p-3 font-mono text-white/70">
                        {fQ(o.qty, asset.exch === "Crypto")}
                      </td>

                      <td className="p-3 font-mono text-white/50">
                        {fT(o.time)}
                      </td>

                      <td className="p-3 pr-4 text-right">
                        <button
                          onClick={() => onCancelPending(idx)}
                          className="px-2.5 py-1.5 bg-red/10 border border-red/20 text-red hover:bg-red/20 text-xs font-semibold cursor-pointer rounded-lg transition-all"
                        >
                          Cancel Order
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center select-none">
            <span className="text-2xl">🕐</span>
            <h4 className="text-sm font-bold text-white mt-3">No active pending orders.</h4>
            <p className="text-xs text-white/30 mt-1">Pending limit triggers (Limit, Stop Loss, Take Profit) will show here until hit.</p>
          </div>
        )}
      </div>

      {/* Execution order History */}
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 flex items-center justify-between select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Executed Trade History</h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/40">{portfolio.orders.length} executed trades</span>
            {portfolio.orders.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-2 py-1 text-[10px] font-bold text-red border border-red/25 bg-transparent hover:bg-red/10 rounded cursor-pointer transition-all"
              >
                Clear History
              </button>
            )}
          </div>
        </div>

        {portfolio.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/5 text-[10px] font-mono font-bold tracking-wider text-white/30 uppercase">
                  <th className="p-3 pl-4">Asset</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Order Price</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Est. USD Value</th>
                  <th className="p-3">Est. INR Value</th>
                  <th className="p-3 pr-4">Execution Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {portfolio.orders.map((o, idx) => {
                  const asset = ASSET_MAP[o.id];

                  return (
                    <tr key={`h-${idx}`} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono uppercase"
                            style={{ backgroundColor: asset?.bg || "#222", color: asset?.col || "#fff" }}
                          >
                            {o.sym.substring(0, 4)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{o.name}</div>
                            <div className="text-[10px] font-mono text-white/30 mt-0.5">
                              {o.sym}
                              {o.orderType && o.orderType !== "market" && (
                                <span className="ml-1.5 px-1 py-0.5 rounded text-[8px] bg-accent/15 text-accent font-bold tracking-wider uppercase font-mono">
                                  {o.orderType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          o.type === "buy" ? "bg-green/10 text-green" : "bg-red/10 text-red"
                        }`}>
                          {o.type}
                        </span>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="text-white font-semibold">{fU(o.price)}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{fINR(o.price)}</div>
                      </td>

                      <td className="p-3 font-mono text-white/70">
                        {fQ(o.qty, o.orderType === "market" && (o.id === "bitcoin" || o.id === "ethereum" || o.id === "solana" || o.id === "ripple"))}
                      </td>

                      <td className="p-3 font-mono text-white font-bold">
                        {fU(o.total)}
                      </td>

                      <td className="p-3 font-mono text-white/50">
                        {fINR(o.total)}
                      </td>

                      <td className="p-3 pr-4 font-mono text-white/50">
                        {fT(o.time)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center select-none">
            <span className="text-2xl">📜</span>
            <h4 className="text-sm font-bold text-white mt-3">Trade history is clean.</h4>
            <p className="text-xs text-white/30 mt-1">Simulated completed transactions will register in this secure ledger.</p>
          </div>
        )}
      </div>
    </div>
  );
}
