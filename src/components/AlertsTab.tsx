import React, { useState } from "react";
import { PriceAlert, ALL_ASSETS, ASSET_MAP, PriceData } from "../types";
import { fU, fINR, fT } from "../utils";

interface AlertsTabProps {
  prices: { [id: string]: PriceData };
  alerts: PriceAlert[];
  onCreateAlert: (id: string, dir: "above" | "below", price: number) => void;
  onDeleteAlert: (idx: number, isActive: boolean) => void;
}

export default function AlertsTab({
  prices,
  alerts,
  onCreateAlert,
  onDeleteAlert
}: AlertsTabProps) {
  const [selectedId, setSelectedId] = useState("");
  const [dir, setDir] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState("");

  const activeAlerts = alerts.filter((a) => a.active);
  const triggeredAlerts = alerts.filter((a) => !a.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !targetPrice) return;
    const price = parseFloat(targetPrice) || 0;
    if (price <= 0) return;

    onCreateAlert(selectedId, dir, price);
    setSelectedId("");
    setTargetPrice("");
  };

  const getAlertHint = () => {
    if (!targetPrice) return "";
    const num = parseFloat(targetPrice) || 0;
    let text = `≈ ${fINR(num)}`;
    if (selectedId && prices[selectedId]) {
      const curP = prices[selectedId].p;
      const diff = ((num - curP) / curP) * 100;
      const col = dir === "below" ? (num < curP ? "text-green" : "text-red") : (num > curP ? "text-green" : "text-red");
      text += ` (${diff >= 0 ? "+" : ""}${diff.toFixed(2)}% from current ${fU(curP)})`;
    }
    return text;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-[fadeUp_0.35s_ease_both]">
      {/* Create Alert Panel */}
      <div className="bg-card border border-white/5 rounded-xl p-4 md:p-5 h-fit select-none">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">🔔 Set Price Target Trigger</h3>
        <p className="text-[11px] text-white/40 mb-5 leading-relaxed">
          Configure real-time automated triggers to alert you when a stock or crypto breaches a target threshold.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">Select Asset</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-[#05050a] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="">Choose asset...</option>
              {ALL_ASSETS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.sym} — {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">Alert Condition</label>
            <div className="flex gap-2">
              <select
                value={dir}
                onChange={(e) => setDir(e.target.value as any)}
                className="bg-[#05050a] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer w-[120px]"
              >
                <option value="above">Above ≥</option>
                <option value="below">Below ≤</option>
              </select>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Target price in USD"
                  className="w-full bg-[#05050a] border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-white/20">USD</span>
              </div>
            </div>
          </div>

          {targetPrice && (
            <p className="text-[10px] font-mono text-white/40 mt-1 pl-1">
              {getAlertHint()}
            </p>
          )}

          <button
            type="submit"
            disabled={!selectedId || !targetPrice}
            className="w-full py-2.5 bg-accent text-white rounded-lg text-xs font-bold tracking-wide uppercase shadow-[0_4px_12px_rgba(94,102,255,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer select-none"
          >
            🔔 Set Automated Alert
          </button>
        </form>
      </div>

      {/* Lists Side Panel */}
      <div className="space-y-4">
        {/* Active Triggers list */}
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 flex items-center justify-between select-none">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">🔔 Active Triggers</h3>
            <span className="text-[10px] font-mono text-white/40">{activeAlerts.length} watching</span>
          </div>

          {activeAlerts.length > 0 ? (
            <div className="divide-y divide-white/5">
              {activeAlerts.map((a, idx) => {
                const asset = ASSET_MAP[a.id];
                return (
                  <div key={`al-${idx}`} className="flex items-center justify-between p-3.5 hover:bg-white/[0.01] transition-all select-none">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold font-mono uppercase"
                        style={{ backgroundColor: asset?.bg || "#222", color: asset?.col || "#fff" }}
                      >
                        {asset?.sym.substring(0, 4)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{asset?.name}</div>
                        <div className="text-[10px] font-mono text-white/30 mt-0.5">
                          {asset?.sym} · <span className={`font-black ${a.dir === "above" ? "text-green" : "text-red"}`}>
                            {a.dir === "above" ? "≥" : "≤"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-xs font-mono font-bold text-white">{fU(a.price)}</div>
                        <div className="text-[9px] font-mono text-white/30 mt-0.5">{fINR(a.price)}</div>
                      </div>
                      <button
                        onClick={() => onDeleteAlert(idx, true)}
                        className="text-white/20 hover:text-red p-1 rounded hover:bg-red/10 cursor-pointer text-sm font-bold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center select-none">
              <span className="text-2xl">🔔</span>
              <h4 className="text-sm font-bold text-white mt-3">No active price triggers.</h4>
              <p className="text-xs text-white/30 mt-1">Automated active watch alerts will list in this section.</p>
            </div>
          )}
        </div>

        {/* Triggered Triggers list */}
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#07070d] border-b border-white/5 select-none">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">📜 Triggered Logs</h3>
          </div>

          {triggeredAlerts.length > 0 ? (
            <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto">
              {triggeredAlerts.map((a, idx) => {
                const asset = ASSET_MAP[a.id];
                return (
                  <div key={`tr-${idx}`} className="flex items-center justify-between p-3.5 hover:bg-white/[0.01] transition-all opacity-45 select-none">
                    <div className="flex items-center gap-2.5">
                      <div className="text-xs font-bold text-white">{asset?.sym || a.id}</div>
                      <span className="text-[10px] font-mono text-white/30">
                        {a.dir === "above" ? "breached above" : "dropped below"} <span className="font-bold text-white">{fU(a.price)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <span className="text-[10px] font-mono text-white/30">{fT(a.created)}</span>
                      <button
                        onClick={() => onDeleteAlert(idx, false)}
                        className="text-white/20 hover:text-red p-1 rounded hover:bg-red/10 cursor-pointer text-sm font-bold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center select-none">
              <span className="text-2xl">📜</span>
              <h4 className="text-sm font-bold text-white mt-3">Trigger history is clean.</h4>
              <p className="text-xs text-white/30 mt-1">Breached price alerts will log in this historical section.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
