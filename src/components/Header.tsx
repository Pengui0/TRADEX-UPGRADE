import React, { useState } from "react";
import { UserSession, PortfolioState } from "../types";
import { fU, fINR } from "../utils";

interface HeaderProps {
  session: UserSession;
  portfolio: PortfolioState;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReset: () => void;
  onLogout: () => void;
  isFallback?: boolean;
}

export default function Header({
  session,
  portfolio,
  activeTab,
  onTabChange,
  onReset,
  onLogout,
  isFallback = false
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Split name for greeting
  const firstName = session.name.split(" ")[0];
  const initial = session.name.split(" ").map(n => n[0] || "").join("").substring(0, 2).toUpperCase() || "?";

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn("Fullscreen permission denied", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <header className="h-[56px] border-b border-white/5 bg-card/65 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 select-none">
      
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-green rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(94,102,255,0.25)]">
          <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-black tracking-tight text-white">
            Trade<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-green">X</span>
          </span>

          {/* Dynamic connection status badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5 select-none" title={isFallback ? "No live source reachable right now; showing simulated data" : "Live quotes: crypto via CoinGecko, US stocks via Nasdaq/Finnhub"}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isFallback ? "bg-amber-400" : "bg-emerald-400"}`} />
            <span className="text-[8px] font-mono font-bold tracking-wider text-white/40 uppercase">
              {isFallback ? "Fallback" : "Live"}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation menu */}
      <nav className="hidden lg:flex items-center bg-white/[0.02] border border-white/5 rounded-xl p-1 gap-1">
        {[
          { id: "trade", label: "Trade" },
          { id: "portfolio", label: "Portfolio" },
          { id: "orders", label: "Orders" },
          { id: "markets", label: "Markets" },
          { id: "analytics", label: "Analytics" },
          { id: "watchlist", label: "Watchlist" },
          { id: "alerts", label: "Alerts" },
          { id: "profile", label: "Profile" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === tab.id
                ? "bg-accent text-white shadow-[0_2px_8px_rgba(94,102,255,0.3)]"
                : "text-white/40 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right side Wallets & Session controls */}
      <div className="flex items-center gap-2.5">
        
        {/* Crypto Wallet Pill */}
        <div className="hidden md:flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1 cursor-default hover:border-accent/25 transition-all">
          <div className="w-1.5 h-1.5 rounded-full bg-green" />
          <div>
            <div className="text-[8px] font-mono font-bold text-white/30 uppercase tracking-wider">Crypto</div>
            <div className="text-[11px] font-mono font-bold text-green leading-none mt-0.5">{fU(portfolio.ccash)}</div>
          </div>
          <div className="text-[9px] font-mono text-white/20 ml-1 border-l border-white/10 pl-1.5 leading-none mt-1">
            {fINR(portfolio.ccash)}
          </div>
        </div>

        {/* Stock Wallet Pill */}
        <div className="hidden md:flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1 cursor-default hover:border-yellow/25 transition-all">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow" />
          <div>
            <div className="text-[8px] font-mono font-bold text-white/30 uppercase tracking-wider">Stocks</div>
            <div className="text-[11px] font-mono font-bold text-yellow leading-none mt-0.5">{fU(portfolio.scash)}</div>
          </div>
          <div className="text-[9px] font-mono text-white/20 ml-1 border-l border-white/10 pl-1.5 leading-none mt-1">
            {fINR(portfolio.scash)}
          </div>
        </div>

        {/* Quick Reset Account */}
        <button
          onClick={onReset}
          title="Reset Account balances"
          className="w-8 h-8 rounded-lg border border-white/5 bg-white/[0.02] text-white/40 hover:text-white flex items-center justify-center cursor-pointer transition-all hover:bg-white/5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className={`w-8 h-8 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-center cursor-pointer transition-all hover:bg-white/5 ${
            isFullscreen ? "text-accent border-accent/20" : "text-white/40 hover:text-white"
          }`}
        >
          {isFullscreen ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4.5 4.5M9 9V4.5M9 9H4.5M15 9l4.5-4.5M15 9V4.5M15 9h4.5M9 15l-4.5 4.5M9 15v4.5M9 15H4.5M15 15l4.5 4.5M15 15v4.5M15 15h4.5" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
            </svg>
          )}
        </button>

        {/* Profile User Dropdown */}
        <div className="relative border-l border-white/10 pl-2.5 ml-0.5">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1 cursor-pointer hover:border-white/15 select-none transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-green text-[9px] font-extrabold text-white flex items-center justify-center shadow-sm">
              {initial}
            </div>
            <span className="text-xs font-bold text-white/80 max-w-[80px] truncate">{firstName}</span>
            <svg className={`w-2.5 h-2.5 text-white/40 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          {dropdownOpen && (
            <>
              {/* Backing dismiss overlay */}
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              
              <div className="absolute top-[115%] right-0 w-[180px] bg-[#0c0c16]/95 backdrop-blur-md border border-white/10 rounded-xl py-1.5 shadow-2xl z-40 animate-[fadeUp_0.15s_ease_both]">
                <div className="px-3 py-2 border-b border-white/5">
                  <div className="text-[9px] text-white/30 font-mono tracking-wider uppercase">Trader Session</div>
                  <div className="text-xs font-bold text-white truncate mt-0.5">{session.name}</div>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onTabChange("profile");
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                >
                  👤 View Profile
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onReset();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                >
                  ↺ Reset Portfolio
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-red hover:bg-red/10 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  🚪 Sign Out
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
