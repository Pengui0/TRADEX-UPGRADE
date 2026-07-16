import React, { useState } from "react";
import { UserSession, PortfolioState } from "../types";
import { fU, fT } from "../utils";

interface ProfileTabProps {
  session: UserSession;
  portfolio: PortfolioState;
  onUpdatePassword: (oldPw: string, newPw: string) => Promise<{ success: boolean; error?: string }>;
  onReset: () => void;
}

export default function ProfileTab({
  session,
  portfolio,
  onUpdatePassword,
  onReset
}: ProfileTabProps) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState({ text: "", isError: false });

  const handleUpdatePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: "", isError: false });

    if (newPw !== confirmPw) {
      setMsg({ text: "New passwords do not match.", isError: true });
      return;
    }
    if (newPw.length < 6) {
      setMsg({ text: "New password must be at least 6 characters.", isError: true });
      return;
    }

    const res = await onUpdatePassword(oldPw, newPw);
    if (res.success) {
      setMsg({ text: "Password updated successfully!", isError: false });
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
    } else {
      setMsg({ text: res.error || "Update failed.", isError: true });
    }
  };

  // Convert executed orders history to CSV
  const handleExportCSV = () => {
    if (portfolio.orders.length === 0) {
      alert("No executed orders to export.");
      return;
    }

    const headers = ["Order ID", "Asset Sym", "Asset Name", "Type", "Execution Price (USD)", "Quantity", "Total Cost (USD)", "Timestamp"];
    const rows = portfolio.orders.map((o, i) => [
      `TX-${1000 + i}`,
      o.sym,
      o.name,
      o.type,
      o.price.toString(),
      o.qty.toString(),
      o.total.toString(),
      fT(o.time)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TradeX_Trades_Log_${session.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-[fadeUp_0.35s_ease_both]">
      
      {/* User Metadata & Security Reset */}
      <div className="bg-card border border-white/5 rounded-xl p-4 md:p-5 flex flex-col justify-between select-none">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">👤 Trader Profile</h3>
          <p className="text-[11px] text-white/40 mb-5 leading-relaxed">
            Your simulated trading terminal account credentials and settings logs.
          </p>

          <div className="space-y-4 bg-[#05050a] border border-white/5 rounded-xl p-4 font-mono text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-white/40">Full Name</span>
              <span className="text-white font-bold">{session.name}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-white/40">Registered Email</span>
              <span className="text-white font-bold">{session.username}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-white/40">Starting Capital</span>
              <span className="text-green font-bold">$1,000.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Account Active Since</span>
              <span className="text-white font-bold">{fT(session.joined)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3.5">
          <div className="h-px bg-white/5" />
          <h4 className="text-xs font-bold text-white uppercase">Ledger Export</h4>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Export your entire historical executed trades register in a structured comma-separated values (CSV) format.
          </p>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-accent/80 hover:scale-[1.01] inline-block w-fit"
          >
            📥 Export Trades Register (.csv)
          </button>
        </div>
      </div>

      {/* Security Credentials Password Update Form */}
      <div className="bg-card border border-white/5 rounded-xl p-4 md:p-5 select-none">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">🔑 Update Password</h3>
        <p className="text-[11px] text-white/40 mb-5 leading-relaxed">
          Maintain your terminal secure clearance credentials below.
        </p>

        <form onSubmit={handleUpdatePw} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">Current Password</label>
            <input
              type="password"
              required
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#05050a] border border-white/5 focus:border-accent rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">New Password</label>
            <input
              type="password"
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#05050a] border border-white/5 focus:border-accent rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 font-mono tracking-wider uppercase">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#05050a] border border-white/5 focus:border-accent rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          {msg.text && (
            <div className={`p-3 text-xs rounded-lg font-semibold ${msg.isError ? "bg-red/10 text-red border border-red/20" : "bg-green/10 text-green border border-green/20"}`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-accent text-white rounded-lg text-xs font-bold tracking-wide uppercase shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer select-none"
          >
            Update Password Credentials
          </button>
        </form>
      </div>

    </div>
  );
}
