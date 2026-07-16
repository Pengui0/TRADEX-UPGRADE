import React, { useState, useEffect } from "react";
import { pwHash } from "../utils";
import { UserSession } from "../types";
import { sb } from "../supabase";

interface AuthProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [tab, setTab] = useState<"login" | "reg">("login");
  const [traderCount, setTraderCount] = useState<number | null>(null);

  // Form fields
  const [lUser, setLUser] = useState("");
  const [lPass, setLPass] = useState("");
  const [rName, setRName] = useState("");
  const [rUser, setRUser] = useState("");
  const [rPass, setRPass] = useState("");
  const [rPass2, setRPass2] = useState("");

  // States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch trader count from Supabase
  const loadTraderCount = async () => {
    try {
      const { count } = await sb.from("traders").select("*", { count: "exact", head: true });
      setTraderCount(count || 0);
    } catch (e) {
      console.warn("Could not load trader count from Supabase.", e);
    }
  };

  useEffect(() => {
    loadTraderCount();
  }, []);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const username = lUser.trim().toLowerCase();
    if (!username || !lPass) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await sb
        .from("traders")
        .select("username, name, joined_at, pw_hash")
        .eq("username", username)
        .single();

      if (error || !data) {
        setErrorMsg("Account not found. Please register first.");
        setLoading(false);
        return;
      }

      if (data.pw_hash !== pwHash(lPass)) {
        setErrorMsg("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }

      const session: UserSession = {
        username: data.username,
        name: data.name,
        joined: data.joined_at,
        pwHash: data.pw_hash,
      };

      setSuccessMsg("Access authorized. Redirecting...");
      setTimeout(() => {
        onLoginSuccess(session);
      }, 800);
    } catch (err: any) {
      setErrorMsg("Network error. Supabase database server is offline.");
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const username = rUser.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!rName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (username.length < 3) {
      setErrorMsg("Username must be at least 3 characters (letters, numbers, underscores).");
      return;
    }
    if (rPass.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (rPass !== rPass2) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Check if username taken
      const { data: existing } = await sb
        .from("traders")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (existing) {
        setErrorMsg("Username is already taken.");
        setLoading(false);
        return;
      }

      const hash = pwHash(rPass);
      const joinedAt = new Date().toISOString();

      const { data, error } = await sb
        .from("traders")
        .insert({
          username,
          name: rName.trim(),
          pw_hash: hash,
          ccash: 500, // decreased virtual capital as requested ($500 crypto)
          scash: 500, // decreased virtual capital as requested ($500 stocks)
          holdings: {},
          orders: [],
          budget: 0,
          inv: 0,
          realised_pnl: 0,
          net_worth: 1000, // $1000 total capital
          pnl: 0,
          trade_count: 0,
          joined_at: joinedAt,
          updated_at: joinedAt,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSuccessMsg("Account created successfully! Logging you in...");
      loadTraderCount();
      
      const session: UserSession = {
        username,
        name: rName.trim(),
        joined: joinedAt,
        pwHash: hash,
      };

      setTimeout(() => {
        onLoginSuccess(session);
      }, 1000);
    } catch (err: any) {
      setErrorMsg("Registration failed: " + (err.message || "Database connection error."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth" className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center p-4">
      {/* Fine Monochrome Grid Mesh */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />

      {/* Top Logo */}
      <div className="flex flex-col items-center gap-1.5 relative z-10 mb-6 animate-[fadeUp_0.6s_ease_both]">
        <div className="w-[54px] h-[54px] bg-white border border-white/10 rounded-xl flex items-center justify-center">
          <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div className="text-2xl font-black text-white leading-none font-display">
          Trade<span className="text-neutral-400">X</span>
        </div>
        <p className="text-[10px] font-mono tracking-widest text-white/45 uppercase">
          Virtual Trading Desk
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-[820px] bg-[#09090b] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col md:flex-row relative z-10 shadow-2xl">
        
        {/* Left Side branding panel */}
        <div className="hidden md:flex md:w-[320px] flex-shrink-0 bg-[#0c0c0e] border-r border-neutral-800 p-8 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-lg font-black text-white font-display">Trade<span className="text-neutral-400">X</span></div>
            </div>
            <p className="text-[11px] text-white/40 font-mono">Secure simulation gateway</p>
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-start gap-3">
              <span className="text-xl">📈</span>
              <div>
                <h4 className="text-xs font-bold text-white font-display">Real-Time Nasdaq & CoinGecko Quotes</h4>
                <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed font-sans">Direct live quotes for US, NSE, and major global markets.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📊</span>
              <div>
                <h4 className="text-xs font-bold text-white font-display">Institutional Charts</h4>
                <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed font-sans">Advanced drawing instruments, MAs, RSIs, and indicators.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">💼</span>
              <div>
                <h4 className="text-xs font-bold text-white">$1,000 Mock Balance</h4>
                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">$500 stocks + $500 cryptos to master markets risk-free.</p>
              </div>
            </div>
          </div>

          {/* Trader counter badge */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-green/10 border border-green/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_8px_rgba(0,229,153,1)] animate-pulse" />
              <span className="text-[10px] font-mono text-green font-bold uppercase tracking-wider">
                {traderCount !== null ? `${traderCount} traders active` : "connecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side auth form */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {tab === "login" ? "Welcome back" : "Create simulated account"}
            </h2>
            <p className="text-xs text-white/40 mt-1">
              {tab === "login" ? "Access your simulated portfolio credentials" : "Configure virtual starting parameters"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5 gap-0.5 mb-6">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                tab === "login"
                  ? "bg-accent text-white shadow-[0_2px_10px_rgba(94,102,255,0.4)]"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("reg")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                tab === "reg"
                  ? "bg-accent text-white shadow-[0_2px_10px_rgba(94,102,255,0.4)]"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* Error and Success Indicators */}
          {errorMsg && (
            <div className="p-3 bg-red/10 border border-red/20 text-red text-xs rounded-lg mb-4 flex items-center gap-2 animate-[fadeUp_0.2s_ease_both]">
              <span>⚠️</span>
              <div>{errorMsg}</div>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green/10 border border-green/20 text-green text-xs rounded-lg mb-4 flex items-center gap-2 animate-[fadeUp_0.2s_ease_both]">
              <span>✓</span>
              <div>{successMsg}</div>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === "login" ? (
            <form onSubmit={doLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase font-mono">Username</label>
                <input
                  type="text"
                  value={lUser}
                  onChange={(e) => setLUser(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-accent focus:bg-accent/5 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase font-mono">Password</label>
                <input
                  type="password"
                  value={lPass}
                  onChange={(e) => setLPass(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-accent focus:bg-accent/5 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder-white/10"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-accent to-[#7b85ff] text-white rounded-lg text-sm font-bold shadow-[0_4px_16px_rgba(94,102,255,0.3)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer mt-2"
              >
                {loading ? "Verifying..." : "Sign In →"}
              </button>
            </form>
          ) : (
            // REGISTER FORM
            <form onSubmit={doRegister} className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase font-mono">Full Name</label>
                <input
                  type="text"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder="e.g. Satoshi Nakamoto"
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-accent focus:bg-accent/5 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase font-mono">Username</label>
                <input
                  type="text"
                  value={rUser}
                  onChange={(e) => setRUser(e.target.value)}
                  placeholder="Only letters/numbers/underscores"
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-accent focus:bg-accent/5 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase font-mono">Password (6+ chars)</label>
                <input
                  type="password"
                  value={rPass}
                  onChange={(e) => setRPass(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-accent focus:bg-accent/5 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 tracking-wider uppercase font-mono">Confirm Password</label>
                <input
                  type="password"
                  value={rPass2}
                  onChange={(e) => setRPass2(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-accent focus:bg-accent/5 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder-white/10"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-accent to-[#7b85ff] text-white rounded-lg text-sm font-bold shadow-[0_4px_16px_rgba(94,102,255,0.3)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer mt-2"
              >
                {loading ? "Creating..." : "Create Account →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
