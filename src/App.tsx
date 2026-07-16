import React, { useState, useEffect } from "react";
import Splash from "./components/Splash";
import Auth from "./components/Auth";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TradeTab from "./components/TradeTab";
import PortfolioTab from "./components/PortfolioTab";
import OrdersTab from "./components/OrdersTab";
import MarketsTab from "./components/MarketsTab";
import WatchlistTab from "./components/WatchlistTab";
import AlertsTab from "./components/AlertsTab";
import AnalyticsTab from "./components/AnalyticsTab";
import ProfileTab from "./components/ProfileTab";
import TradingViewChart from "./components/TradingViewChart";
import { fU } from "./utils";
import { sb } from "./supabase";

import {
  UserSession,
  PortfolioState,
  PriceData,
  PendingOrder,
  PriceAlert,
  ALL_ASSETS,
  ASSET_MAP,
  Asset
} from "./types";

interface NotificationMsg {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  text: string;
  time: number;
}

const DEFAULT_PORTFOLIO: PortfolioState = {
  scash: 500,
  ccash: 500,
  h: {},
  orders: [],
  realisedPnl: 0,
  budget: 0,
  alerts: []
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState<UserSession | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioState>(DEFAULT_PORTFOLIO);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  // Navigation / UI State
  const [activeTab, setActiveTab] = useState("trade");
  const [showTradeXView, setShowTradeXView] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>("apple");
  const [activeAssetClass, setActiveAssetClass] = useState<"stocks" | "crypto">("stocks");
  const [activeTF, setActiveTF] = useState("1D");
  const [watchlist, setWatchlist] = useState<string[]>(["apple", "microsoft", "bitcoin", "ethereum"]);
  const [recentViewed, setRecentViewed] = useState<string[]>([]);

  // TradeX Bottom View Desk state
  const [txUsdValue, setTxUsdValue] = useState("");
  const [txLimitValue, setTxLimitValue] = useState("");
  const [txQtyValue, setTxQtyValue] = useState("");
  const [txTradeMode, setTxTradeMode] = useState<"buy" | "sell">("buy");
  const [txOrderType, setTxOrderType] = useState<"market" | "limit" | "sl" | "tp">("market");

  // Synchronizers for TradeX View desk
  const syncTxFromUSD = (val: string) => {
    setTxUsdValue(val);
    const asset = selectedAssetId ? ASSET_MAP[selectedAssetId] : null;
    const pr = selectedAssetId ? prices[selectedAssetId] : null;
    if (pr && pr.p > 0) {
      const q = (parseFloat(val) || 0) / pr.p;
      setTxQtyValue(q > 0 ? q.toFixed(asset?.exch === "Crypto" ? 6 : 4) : "");
    } else {
      setTxQtyValue("");
    }
  };

  const syncTxFromQty = (val: string) => {
    setTxQtyValue(val);
    const pr = selectedAssetId ? prices[selectedAssetId] : null;
    if (pr && pr.p > 0) {
      const u = (parseFloat(val) || 0) * pr.p;
      setTxUsdValue(u > 0 ? u.toFixed(2) : "");
    } else {
      setTxUsdValue("");
    }
  };

  const handleTxExecuteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;
    const usd = parseFloat(txUsdValue) || 0;
    const limit = parseFloat(txLimitValue) || 0;
    handleExecuteTrade(txTradeMode, txOrderType, usd, limit);
    setTxUsdValue("");
    setTxQtyValue("");
    setTxLimitValue("");
  };

  const handleSystemWipe = () => {
    if (window.confirm("CRITICAL INSTANCE RESET\n\nThis will completely wipe and purge ALL simulated balances, portfolio holdings, custom credentials, passwords, bookmarks, and historical orders in this browser.\n\nAre you absolutely sure you want to clean-slate everything?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Dynamic Market prices
  const [prices, setPrices] = useState<{ [id: string]: PriceData }>({});
  const [isFallback, setIsFallback] = useState(false);
  const [equityHistory, setEquityHistory] = useState<{ time: number; value: number }[]>([]);

  // Local notifications toasts
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);

  // 1. Fetch initial prices & poll continuously
  useEffect(() => {
    // Populate default fallback prices first
    const initPrices: { [id: string]: PriceData } = {};
    ALL_ASSETS.forEach((a) => {
      const pVal = a.id === "bitcoin" ? 95420 : a.id === "ethereum" ? 2750 : a.id === "solana" ? 180 : 150;
      initPrices[a.id] = {
        p: pVal,
        c: 1.25,
        lo: pVal * 0.95,
        hi: pVal * 1.05,
        mc: 250000000000,
        open: pVal
      };
    });
    setPrices(initPrices);

    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        if (res.ok) {
          const data = await res.json();
          if (data && data.prices) {
            setPrices(data.prices);
            setIsFallback(!!data.isFallback);
          }
        }
      } catch (err) {
        console.warn("Could not fetch live market prices", err);
        setIsFallback(true);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 8000); // Poll every 8 seconds
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch specific chart history / Sync watchlist / Load user session data
  useEffect(() => {
    const savedSess = localStorage.getItem("tradex_session");
    if (savedSess) {
      try {
        const sess: UserSession = JSON.parse(savedSess);
        setSession(sess);

        // Load specific user assets and settings
        const userHash = sess.pwHash || "local";
        const savedPf = localStorage.getItem(`tradex_pf_${userHash}`);
        if (savedPf) {
          setPortfolio(JSON.parse(savedPf));
        } else {
          // New User starting cash
          const initPf = { ...DEFAULT_PORTFOLIO };
          setPortfolio(initPf);
          localStorage.setItem(`tradex_pf_${userHash}`, JSON.stringify(initPf));
        }

        const savedPending = localStorage.getItem(`tradex_pending_${userHash}`);
        if (savedPending) {
          setPendingOrders(JSON.parse(savedPending));
        }

        const savedWl = localStorage.getItem(`tradex_wl_${userHash}`);
        if (savedWl) {
          setWatchlist(JSON.parse(savedWl));
        }

        const savedRec = localStorage.getItem(`tradex_rec_${userHash}`);
        if (savedRec) {
          setRecentViewed(JSON.parse(savedRec));
        }

        const savedEq = localStorage.getItem(`tradex_eq_${userHash}`);
        if (savedEq) {
          setEquityHistory(JSON.parse(savedEq));
        } else {
          setEquityHistory([{ time: Date.now(), value: 1000 }]);
        }

      } catch (e) {
        console.error("Session load error", e);
      }
    }
  }, []);

  // Sync TradeX View inputs when active asset changes
  useEffect(() => {
    setTxUsdValue("");
    setTxQtyValue("");
    setTxLimitValue("");
    setTxOrderType("market");
  }, [selectedAssetId]);

  const syncPortfolioToSupabase = async (newPf: PortfolioState) => {
    if (!session) return;
    try {
      await sb
        .from("traders")
        .update({
          ccash: newPf.ccash,
          scash: newPf.scash,
          holdings: newPf.h,
          orders: newPf.orders,
          budget: newPf.budget,
          realised_pnl: newPf.realisedPnl,
          updated_at: new Date().toISOString(),
        })
        .eq("username", session.username);
    } catch (err) {
      console.warn("[TradeX] Could not sync portfolio to Supabase:", err);
    }
  };

  // 3. Save states on modification
  const saveUserData = (newPf: PortfolioState, newPending?: PendingOrder[]) => {
    if (!session) return;
    const userHash = session.pwHash || "local";
    setPortfolio(newPf);
    localStorage.setItem(`tradex_pf_${userHash}`, JSON.stringify(newPf));

    if (newPending) {
      setPendingOrders(newPending);
      localStorage.setItem(`tradex_pending_${userHash}`, JSON.stringify(newPending));
    }

    syncPortfolioToSupabase(newPf);
  };

  // Add floating toast message
  const triggerToast = (title: string, text: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newMsg: NotificationMsg = { id, title, text, type, time: Date.now() };
    setNotifications((prev) => [newMsg, ...prev].slice(0, 5));

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((m) => m.id !== id));
    }, 5000);
  };

  // 4. Process Pending Trigger Orders and Custom Alert Thresholds on price tick update
  useEffect(() => {
    if (!session || Object.keys(prices).length === 0) return;

    let pfChanged = false;
    let pendingChanged = false;

    const updatedPf = { ...portfolio };
    const updatedPending = [...pendingOrders];
    const triggerLogs: PendingOrder[] = [];

    // Evaluate Pending Limits/SL/TP orders
    for (let i = updatedPending.length - 1; i >= 0; i--) {
      const order = updatedPending[i];
      const pr = prices[order.id];
      if (!pr) continue;

      let triggered = false;

      // Buy Triggers
      if (order.mode === "buy") {
        if (order.orderType === "limit" && pr.p <= order.limitPrice) triggered = true;
        else if (order.orderType === "sl" && pr.p >= order.limitPrice) triggered = true;
        else if (order.orderType === "tp" && pr.p <= order.limitPrice) triggered = true;
      }
      // Sell Triggers
      else {
        if (order.orderType === "limit" && pr.p >= order.limitPrice) triggered = true;
        else if (order.orderType === "sl" && pr.p <= order.limitPrice) triggered = true;
        else if (order.orderType === "tp" && pr.p >= order.limitPrice) triggered = true;
      }

      if (triggered) {
        // Execute the triggered order
        const isCrypto = ASSET_MAP[order.id]?.exch === "Crypto";
        const cashPool = isCrypto ? updatedPf.ccash : updatedPf.scash;

        if (order.mode === "buy") {
          if (cashPool >= order.usd) {
            // Deduct cash
            if (isCrypto) updatedPf.ccash -= order.usd;
            else updatedPf.scash -= order.usd;

            // Update holdings
            const curH = updatedPf.h[order.id] || { qty: 0, avgBuy: 0 };
            const totalQty = curH.qty + order.qty;
            const avgCost = totalQty > 0 ? (curH.qty * curH.avgBuy + order.usd) / totalQty : 0;

            updatedPf.h[order.id] = { qty: totalQty, avgBuy: avgCost };

            // Log executed trade
            updatedPf.orders = [
              {
                id: order.id,
                sym: order.sym,
                name: order.name,
                type: "buy",
                price: pr.p,
                qty: order.qty,
                total: order.usd,
                time: Date.now(),
                orderType: order.orderType
              },
              ...updatedPf.orders
            ];

            pfChanged = true;
            triggerToast(
              "🕐 Trigger Order Executed!",
              `Your limit buy trigger for ${order.qty.toFixed(4)} ${order.sym} at $${order.limitPrice} was hit and completed.`,
              "success"
            );
          } else {
            triggerToast(
              "⚠️ Trigger Failed",
              `Insufficient funds to execute pending buy of ${order.sym}. Order canceled.`,
              "error"
            );
          }
        } else {
          // Sell order
          const curH = updatedPf.h[order.id];
          if (curH && curH.qty >= order.qty) {
            // Add Cash
            if (isCrypto) updatedPf.ccash += order.usd;
            else updatedPf.scash += order.usd;

            // Deduct quantity
            curH.qty -= order.qty;

            // Log realized profits
            const profit = (pr.p - curH.avgBuy) * order.qty;
            updatedPf.realisedPnl += profit;

            // Clear holding if zero
            if (curH.qty < 0.00001) {
              delete updatedPf.h[order.id];
            }

            // Log executed trade
            updatedPf.orders = [
              {
                id: order.id,
                sym: order.sym,
                name: order.name,
                type: "sell",
                price: pr.p,
                qty: order.qty,
                total: order.usd,
                time: Date.now(),
                orderType: order.orderType
              },
              ...updatedPf.orders
            ];

            pfChanged = true;
            triggerToast(
              "🕐 Trigger Order Executed!",
              `Your take-profit/stop-loss sell trigger for ${order.qty.toFixed(4)} ${order.sym} at $${order.limitPrice} was hit and completed.`,
              "success"
            );
          } else {
            triggerToast(
              "⚠️ Trigger Failed",
              `You do not hold enough quantity of ${order.sym} to fulfill the pending trigger sell.`,
              "error"
            );
          }
        }

        // Remove from pending
        updatedPending.splice(i, 1);
        pendingChanged = true;
      }
    }

    // Evaluate Custom Alerts
    if (updatedPf.alerts && updatedPf.alerts.length > 0) {
      let alertsChanged = false;
      const updatedAlerts = updatedPf.alerts.map((a) => {
        if (!a.active) return a;
        const pr = prices[a.id];
        if (!pr) return a;

        let triggered = false;
        if (a.dir === "above" && pr.p >= a.price) triggered = true;
        if (a.dir === "below" && pr.p <= a.price) triggered = true;

        if (triggered) {
          alertsChanged = true;
          triggerToast(
            "🔔 Price Alert Breached!",
            `${ASSET_MAP[a.id]?.sym || a.id} has breached your target of $${a.price}. Current: $${pr.p}.`,
            "info"
          );
          return { ...a, active: false };
        }
        return a;
      });

      if (alertsChanged) {
        updatedPf.alerts = updatedAlerts;
        pfChanged = true;
      }
    }

    if (pfChanged || pendingChanged) {
      saveUserData(updatedPf, pendingChanged ? updatedPending : undefined);
    }

    // Append periodic Equity Curve history point (every 30s max, or on asset value updates)
    let totalHoldingsVal = 0;
    Object.entries(portfolio.h).forEach(([id, h]) => {
      const p = prices[id]?.p || 0;
      totalHoldingsVal += (h as any).qty * p;
    });
    const currentNetWorth = portfolio.ccash + portfolio.scash + totalHoldingsVal;

    // Throttle history ticks
    const lastPoint = equityHistory[equityHistory.length - 1];
    if (!lastPoint || Math.abs(lastPoint.value - currentNetWorth) > 1 || Date.now() - lastPoint.time > 30000) {
      const newHist = [...equityHistory, { time: Date.now(), value: currentNetWorth }].slice(-60); // Keep max 60 data points
      setEquityHistory(newHist);
      if (session) {
        localStorage.setItem(`tradex_eq_${session.pwHash || "local"}`, JSON.stringify(newHist));
      }
    }

  }, [prices]);

  // 5. Auth / Session Callbacks
  const handleAuthComplete = (sess: UserSession) => {
    setSession(sess);
    localStorage.setItem("tradex_session", JSON.stringify(sess));

    const userHash = sess.pwHash || "local";
    const savedPf = localStorage.getItem(`tradex_pf_${userHash}`);
    if (savedPf) {
      setPortfolio(JSON.parse(savedPf));
    } else {
      const initPf = { ...DEFAULT_PORTFOLIO };
      setPortfolio(initPf);
      localStorage.setItem(`tradex_pf_${userHash}`, JSON.stringify(initPf));
    }

    const savedPending = localStorage.getItem(`tradex_pending_${userHash}`);
    setPendingOrders(savedPending ? JSON.parse(savedPending) : []);

    const savedWl = localStorage.getItem(`tradex_wl_${userHash}`);
    setWatchlist(savedWl ? JSON.parse(savedWl) : ["apple", "microsoft", "bitcoin", "ethereum"]);

    const savedRec = localStorage.getItem(`tradex_rec_${userHash}`);
    setRecentViewed(savedRec ? JSON.parse(savedRec) : []);

    const savedEq = localStorage.getItem(`tradex_eq_${userHash}`);
    setEquityHistory(savedEq ? JSON.parse(savedEq) : [{ time: Date.now(), value: 1000 }]);

    triggerToast("🔓 Secure Login", `Welcome back, ${sess.name}! Access terminal online.`, "success");
  };

  const handleLogout = () => {
    setSession(null);
    setPortfolio(DEFAULT_PORTFOLIO);
    setPendingOrders([]);
    setWatchlist(["apple", "microsoft", "bitcoin", "ethereum"]);
    setRecentViewed([]);
    setEquityHistory([]);
    localStorage.removeItem("tradex_session");
    triggerToast("🚪 Closed Clearance", "Terminal session securely destroyed.", "info");
  };

  const handleResetPortfolio = async () => {
    if (!window.confirm("Are you sure you want to reset your balances to starting $1,000 capital ($500 stock / $500 crypto)? This clears your active mock holdings.")) return;
    const cleanPf = { ...DEFAULT_PORTFOLIO };
    saveUserData(cleanPf, []);
    setEquityHistory([{ time: Date.now(), value: 1000 }]);
    if (session) {
      localStorage.removeItem(`tradex_eq_${session.pwHash || "local"}`);
    }

    try {
      await sb
        .from("traders")
        .update({
          ccash: cleanPf.ccash,
          scash: cleanPf.scash,
          holdings: cleanPf.h,
          orders: cleanPf.orders,
          budget: cleanPf.budget,
          realised_pnl: cleanPf.realisedPnl,
          updated_at: new Date().toISOString(),
        })
        .eq("username", session?.username);
    } catch (err) {
      console.warn("[TradeX] Could not reset portfolio in Supabase:", err);
    }

    triggerToast("↺ System Balances Reset", "Simulation values calibrated back to $1,000.00.", "success");
  };

  const handleUpdatePassword = async (oldPw: string, newPw: string) => {
    if (!session) return { success: false, error: "No active session." };
    // Basic local hash verification
    const storedPwHash = session.pwHash;
    const inputHash = btoa(oldPw); // basic base64 hash mimicking real security
    if (inputHash !== storedPwHash) {
      return { success: false, error: "Incorrect current password validation." };
    }

    const newHash = btoa(newPw);
    const updatedSess = { ...session, pwHash: newHash };
    setSession(updatedSess);
    localStorage.setItem("tradex_session", JSON.stringify(updatedSess));

    // Migrate storage items under the new hash key
    const curPf = localStorage.getItem(`tradex_pf_${storedPwHash}`) || JSON.stringify(portfolio);
    localStorage.setItem(`tradex_pf_${newHash}`, curPf);
    localStorage.removeItem(`tradex_pf_${storedPwHash}`);

    return { success: true };
  };

  // 6. Action Triggers
  const handleToggleWatchlist = (id: string) => {
    let nextWl = [...watchlist];
    if (watchlist.includes(id)) {
      nextWl = nextWl.filter((i) => i !== id);
      triggerToast("⭐ Removed Bookmark", `${ASSET_MAP[id]?.name || id} was removed from your watchlist.`);
    } else {
      nextWl.push(id);
      triggerToast("⭐ Added Bookmark", `${ASSET_MAP[id]?.name || id} has been starred.`);
    }
    setWatchlist(nextWl);
    if (session) {
      localStorage.setItem(`tradex_wl_${session.pwHash || "local"}`, JSON.stringify(nextWl));
    }
  };

  const handleAddToWatchlist = (id: string) => {
    if (!watchlist.includes(id)) {
      const nextWl = [...watchlist, id];
      setWatchlist(nextWl);
      if (session) {
        localStorage.setItem(`tradex_wl_${session.pwHash || "local"}`, JSON.stringify(nextWl));
      }
      triggerToast("⭐ Star Added", `${ASSET_MAP[id]?.sym} added to favorites.`);
    }
  };

  const handleRemoveFromWatchlist = (id: string) => {
    const nextWl = watchlist.filter((i) => i !== id);
    setWatchlist(nextWl);
    if (session) {
      localStorage.setItem(`tradex_wl_${session.pwHash || "local"}`, JSON.stringify(nextWl));
    }
    triggerToast("🗑 Bookmark Removed", `${ASSET_MAP[id]?.sym} removed.`);
  };

  const handleClearWatchlist = () => {
    setWatchlist([]);
    if (session) {
      localStorage.setItem(`tradex_wl_${session.pwHash || "local"}`, JSON.stringify([]));
    }
    triggerToast("⭐ Watchlist Cleared", "All bookmarks flushed.");
  };

  const handleAssetSelect = (id: string) => {
    setSelectedAssetId(id);

    // Track recently viewed
    const nextRec = [id, ...recentViewed.filter((x) => x !== id)].slice(0, 6);
    setRecentViewed(nextRec);
    if (session) {
      localStorage.setItem(`tradex_rec_${session.pwHash || "local"}`, JSON.stringify(nextRec));
    }
  };

  const handleSelectAndTrade = (id: string, assetClass: "stocks" | "crypto") => {
    setSelectedAssetId(id);
    setActiveAssetClass(assetClass);
    setActiveTab("trade");

    // Track recently viewed
    const nextRec = [id, ...recentViewed.filter((x) => x !== id)].slice(0, 6);
    setRecentViewed(nextRec);
    if (session) {
      localStorage.setItem(`tradex_rec_${session.pwHash || "local"}`, JSON.stringify(nextRec));
    }
  };

  const handleSetBudget = (b: number) => {
    const nextPf = { ...portfolio, budget: b };
    saveUserData(nextPf);
    triggerToast("💰 Limit Budget Defined", `Trading max limit set to $${b}.`);
  };

  const handleClearBudget = () => {
    const nextPf = { ...portfolio, budget: 0 };
    saveUserData(nextPf);
    triggerToast("💰 Limit Budget Cleared", "Investing restriction removed.");
  };

  const handleCancelPending = (idx: number) => {
    const item = pendingOrders[idx];
    const nextPending = pendingOrders.filter((_, i) => i !== idx);
    saveUserData(portfolio, nextPending);
    triggerToast("🗑 Trigger Cancelled", `Limit order for ${item.sym} aborted.`);
  };

  const handleClearHistory = () => {
    if (!window.confirm("Do you want to permanently clear your completed trades ledger?")) return;
    const nextPf = { ...portfolio, orders: [], realisedPnl: 0 };
    saveUserData(nextPf);
    triggerToast("📜 History Flushed", "Executed orders clean.");
  };

  const handleCreateAlert = (id: string, dir: "above" | "below", price: number) => {
    const newAlert: PriceAlert = {
      id,
      dir,
      price,
      active: true,
      created: Date.now()
    };

    const nextPf = {
      ...portfolio,
      alerts: [newAlert, ...(portfolio.alerts || [])]
    };
    saveUserData(nextPf);
    triggerToast("🔔 Price Alert Armed", `${ASSET_MAP[id]?.sym} watching trigger at $${price}.`);
  };

  const handleDeleteAlert = (idx: number, isActive: boolean) => {
    const all = portfolio.alerts || [];
    const activeList = all.filter((a) => a.active);
    const trigList = all.filter((a) => !a.active);

    let nextAlerts: PriceAlert[] = [];
    if (isActive) {
      const remainingActive = activeList.filter((_, i) => i !== idx);
      nextAlerts = [...remainingActive, ...trigList];
    } else {
      const remainingTrig = trigList.filter((_, i) => i !== idx);
      nextAlerts = [...activeList, ...remainingTrig];
    }

    const nextPf = { ...portfolio, alerts: nextAlerts };
    saveUserData(nextPf);
    triggerToast("🔔 Alert Deleted", "Threshold notification removed.");
  };

  // 7. Order Execution desk handler (Market and Pending triggers)
  const handleExecuteTrade = (
    mode: "buy" | "sell",
    orderType: "market" | "limit" | "sl" | "tp",
    usdAmount: number,
    limitPrice: number
  ) => {
    if (!selectedAssetId) return;
    const asset = ASSET_MAP[selectedAssetId];
    const pr = prices[selectedAssetId];
    if (!asset || !pr) return;

    const priceToUse = orderType === "market" ? pr.p : limitPrice;
    if (priceToUse <= 0) {
      triggerToast("⚠️ Trigger Failed", "Limit price trigger cannot be negative or zero.", "error");
      return;
    }

    const qty = usdAmount / priceToUse;
    const isCrypto = asset.exch === "Crypto";

    // A. Pending limit order dispatcher
    if (orderType !== "market") {
      const newPending: PendingOrder = {
        id: asset.id,
        sym: asset.sym,
        name: asset.name,
        mode,
        orderType,
        limitPrice,
        usd: usdAmount,
        qty,
        time: Date.now()
      };

      const nextPending = [newPending, ...pendingOrders];
      saveUserData(portfolio, nextPending);

      triggerToast(
        "🕐 Trigger Order Booked!",
        `Your ${orderType.toUpperCase()} ${mode} order for ${qty.toFixed(4)} ${asset.sym} is pending at limit target $${limitPrice}.`,
        "info"
      );
      return;
    }

    // B. Market order dispatcher
    const currentCash = isCrypto ? portfolio.ccash : portfolio.scash;
    const nextPf = { ...portfolio };

    if (mode === "buy") {
      // Check budget spending limit
      let totalHoldingsVal = 0;
      Object.entries(portfolio.h).forEach(([id, h]) => {
        totalHoldingsVal += (h as any).qty * (prices[id]?.p || 0);
      });

      if (portfolio.budget > 0 && totalHoldingsVal + usdAmount > portfolio.budget) {
        triggerToast("🛑 Budget Blocked", "This buy exceeds your set portfolio investment budget limit cap.", "error");
        return;
      }

      if (currentCash >= usdAmount) {
        if (isCrypto) nextPf.ccash -= usdAmount;
        else nextPf.scash -= usdAmount;

        const curH = nextPf.h[asset.id] || { qty: 0, avgBuy: 0 };
        const totalQty = curH.qty + qty;
        const avgCost = totalQty > 0 ? (curH.qty * curH.avgBuy + usdAmount) / totalQty : 0;

        nextPf.h[asset.id] = { qty: totalQty, avgBuy: avgCost };

        // Log transaction history
        nextPf.orders = [
          {
            id: asset.id,
            sym: asset.sym,
            name: asset.name,
            type: "buy",
            price: pr.p,
            qty,
            total: usdAmount,
            time: Date.now(),
            orderType: "market"
          },
          ...nextPf.orders
        ];

        saveUserData(nextPf);
        triggerToast("✓ Order Executed", `Completed buy order of ${qty.toFixed(isCrypto ? 6 : 4)} units of ${asset.sym}.`, "success");
      } else {
        triggerToast("🛑 Purchase Failed", "Insufficient funds in matching wallet.", "error");
      }
    } else {
      // Sell Mode
      const curH = nextPf.h[asset.id];
      if (curH && curH.qty >= qty - 0.000001) {
        if (isCrypto) nextPf.ccash += usdAmount;
        else nextPf.scash += usdAmount;

        curH.qty -= qty;
        const profit = (pr.p - curH.avgBuy) * qty;
        nextPf.realisedPnl += profit;

        if (curH.qty < 0.00001) {
          delete nextPf.h[asset.id];
        }

        // Log transaction history
        nextPf.orders = [
          {
            id: asset.id,
            sym: asset.sym,
            name: asset.name,
            type: "sell",
            price: pr.p,
            qty,
            total: usdAmount,
            time: Date.now(),
            orderType: "market"
          },
          ...nextPf.orders
        ];

        saveUserData(nextPf);
        triggerToast("✓ Order Executed", `Completed sell order of ${qty.toFixed(isCrypto ? 6 : 4)} units of ${asset.sym}.`, "success");
      } else {
        triggerToast("🛑 Sale Failed", "You do not own enough quantity of this asset to fulfill the transaction.", "error");
      }
    }
  };

  const handleQuickSellAll = (id: string) => {
    const asset = ASSET_MAP[id];
    const curH = portfolio.h[id];
    const pr = prices[id];
    if (!asset || !curH || !pr || curH.qty <= 0) return;

    if (!window.confirm(`Are you sure you want to completely sell all ${curH.qty.toFixed(4)} holdings of ${asset.sym} at the current market price of $${pr.p}?`)) return;

    const val = curH.qty * pr.p;
    const isCrypto = asset.exch === "Crypto";
    const nextPf = { ...portfolio };

    if (isCrypto) nextPf.ccash += val;
    else nextPf.scash += val;

    const profit = (pr.p - curH.avgBuy) * curH.qty;
    nextPf.realisedPnl += profit;

    delete nextPf.h[id];

    nextPf.orders = [
      {
        id: asset.id,
        sym: asset.sym,
        name: asset.name,
        type: "sell",
        price: pr.p,
        qty: curH.qty,
        total: val,
        time: Date.now(),
        orderType: "market"
      },
      ...nextPf.orders
    ];

    saveUserData(nextPf);
    triggerToast("✓ Position Liquidated", `Entire holding of ${asset.sym} sold for $${val.toFixed(2)}.`, "success");
  };

  // Render correct view tab
  const renderActiveView = () => {
    const selectedAsset = selectedAssetId ? ASSET_MAP[selectedAssetId] : null;

    switch (activeTab) {
      case "trade":
        return (
          <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
            {/* Sidebar selection */}
            <Sidebar
              prices={prices}
              selectedId={selectedAssetId}
              onSelect={handleAssetSelect}
              activeAssetClass={activeAssetClass}
              onAssetClassChange={setActiveAssetClass}
            />

            {/* Central trading stage cockpit */}
            <div className="flex-1 overflow-y-auto pr-1">
              <TradeTab
                selectedAsset={selectedAsset}
                prices={prices}
                portfolio={portfolio}
                activeTF={activeTF}
                onTimeframeChange={setActiveTF}
                onExecuteTrade={handleExecuteTrade}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>
          </div>
        );
      case "portfolio":
        return (
          <div className="h-full overflow-y-auto pr-1 pb-16">
            <PortfolioTab
              portfolio={portfolio}
              prices={prices}
              onQuickSell={handleQuickSellAll}
              onSelectAndTrade={handleSelectAndTrade}
              onSetBudget={handleSetBudget}
              onClearBudget={handleClearBudget}
            />
          </div>
        );
      case "orders":
        return (
          <div className="h-full overflow-y-auto pr-1 pb-16">
            <OrdersTab
              portfolio={portfolio}
              pendingOrders={pendingOrders}
              onCancelPending={handleCancelPending}
              onClearHistory={handleClearHistory}
            />
          </div>
        );
      case "markets":
        return (
          <div className="h-full overflow-y-auto pr-1 pb-16">
            <MarketsTab prices={prices} onSelectAndTrade={handleSelectAndTrade} />
          </div>
        );
      case "watchlist":
        return (
          <div className="h-full overflow-y-auto pr-1 pb-16">
            <WatchlistTab
              prices={prices}
              watchlist={watchlist}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              onClearWatchlist={handleClearWatchlist}
              recentViewed={recentViewed}
              onSelectAndTrade={handleSelectAndTrade}
            />
          </div>
        );
      case "alerts":
        return (
          <div className="h-full overflow-y-auto pr-1 pb-16">
            <AlertsTab
              prices={prices}
              alerts={portfolio.alerts || []}
              onCreateAlert={handleCreateAlert}
              onDeleteAlert={handleDeleteAlert}
            />
          </div>
        );
      case "analytics":
        return (
          <div className="h-full overflow-y-auto pr-1 pb-16">
            <AnalyticsTab
              portfolio={portfolio}
              prices={prices}
              equityHistory={equityHistory}
            />
          </div>
        );
      case "profile":
        return (
          <div className="h-full overflow-y-auto pr-1 pb-16">
            <ProfileTab
              session={session!}
              portfolio={portfolio}
              onUpdatePassword={handleUpdatePassword}
              onReset={handleResetPortfolio}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // A. Splash Phase
  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  // B. Auth Phase
  if (!session) {
    return <Auth onLoginSuccess={handleAuthComplete} />;
  }

  const selectedAsset = selectedAssetId ? ASSET_MAP[selectedAssetId] : null;
  const activePriceData = selectedAsset ? prices[selectedAsset.id] : null;

  // C. Authenticated Main Layout Workspace
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#030307] text-white flex flex-col font-sans select-none antialiased">
      {/* Universal header bar */}
      <Header
        session={session}
        portfolio={portfolio}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleResetPortfolio}
        onLogout={handleLogout}
        isFallback={isFallback}
      />

      {/* Floating Alerts / Match notifications center */}
      <div className="fixed top-16 right-4 z-50 pointer-events-none space-y-2 select-none w-[320px]">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-xl border-l-4 border shadow-2xl bg-[#121214] animate-[slideIn_0.2s_ease_both] ${
              n.type === "error"
                ? "border-l-[#ff3b5c] border-white/10 text-white"
                : n.type === "info"
                ? "border-l-white border-white/10 text-white"
                : "border-l-[#00f099] border-white/10 text-white"
            }`}
          >
            <div className="text-xs font-bold flex items-center justify-between text-white font-display">
              <span className="flex items-center gap-1.5">
                {n.type === "error" ? "🛑" : n.type === "info" ? "ℹ️" : "✅"} {n.title}
              </span>
              <button
                onClick={() => setNotifications((prev) => prev.filter((m) => m.id !== n.id))}
                className="text-white/40 hover:text-white cursor-pointer font-bold font-mono text-xs p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-white/80 mt-1.5 leading-relaxed font-sans">{n.text}</p>
          </div>
        ))}
      </div>

      {/* Main viewport frame content with bottom offset for floating action bar */}
      <main className="flex-1 min-h-0 p-4 md:p-5 overflow-hidden pb-24">
        <div className="w-full h-full">
          {renderActiveView()}
        </div>
      </main>

      {/* Floating Sticky Bottom Control Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
        <button
          onClick={() => setShowTradeXView(true)}
          className="px-6 py-3.5 bg-white text-black hover:bg-neutral-100 rounded-full font-display font-black text-xs tracking-wider uppercase shadow-[0_8px_30px_rgba(255,255,255,0.35)] cursor-pointer flex items-center gap-2.5 transition-all active:scale-95 duration-150 border border-neutral-300"
        >
          <span>📊 Open TradeX View</span>
          <span className="w-2 h-2 rounded-full bg-[#00f099] animate-pulse" />
        </button>
      </div>

      {/* Fullscreen TradeX Pro Cockpit Overlay */}
      {showTradeXView && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-sans select-none overflow-hidden animate-[fadeIn_0.2s_ease_both]">
          {/* Header */}
          <header className="h-[64px] border-b border-neutral-800 bg-[#0c0c0e] flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-black font-display tracking-tight text-white flex items-center gap-2">
                  <span>TRADEX COCKPIT</span>
                  <span className="text-[9px] font-mono font-normal text-white/40 px-1.5 py-0.5 border border-neutral-800 rounded">UNIFIED VIEW v2.5</span>
                </h1>
                <p className="text-[9px] font-mono text-white/45 mt-0.5">HIGH PERFORMANCE MONOCHROME TERMINAL</p>
              </div>
            </div>
            
            {/* Quick Balance Pills */}
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-[#121214] border border-neutral-800 rounded px-3 py-1 text-xs">
                <span className="text-white/45 mr-1.5 font-display text-[10px]">STOCKS WALLET:</span>
                <span className="font-mono text-white font-bold">{fU(portfolio.scash)}</span>
              </div>
              <div className="bg-[#121214] border border-neutral-800 rounded px-3 py-1 text-xs">
                <span className="text-white/45 mr-1.5 font-display text-[10px]">CRYPTO WALLET:</span>
                <span className="font-mono text-[#00f099] font-bold">{fU(portfolio.ccash)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowTradeXView(false)}
              className="px-4 py-2 bg-[#ff3b5c] text-white hover:bg-red-600 rounded font-display font-bold text-xs tracking-wider uppercase cursor-pointer transition-all active:scale-95 duration-100"
            >
              ✕ Close View
            </button>
          </header>

          {/* Grid Panel Body */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-[#050505]">
            {/* Column 1: Live Prices List */}
            <div className="lg:col-span-2 border-r border-neutral-800 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-neutral-800 bg-[#09090b] shrink-0">
                <h2 className="text-[9px] font-mono tracking-wider text-white/45 uppercase">MARKET PRICES</h2>
                <p className="text-[8px] text-white/35 mt-0.5">Click ticker to update chart</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-neutral-900">
                {ALL_ASSETS.map((asset) => {
                  const pr = prices[asset.id];
                  const pVal = pr?.p || 0;
                  const pChg = pr?.c || 0;
                  const isSelected = selectedAssetId === asset.id;
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`w-full text-left p-2.5 px-3 flex items-center justify-between transition-all ${
                        isSelected ? "bg-white text-black font-bold" : "hover:bg-neutral-900/60 text-white"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="font-display font-bold text-xs flex items-center gap-1 min-w-0">
                          <span className="truncate max-w-[75px]">{asset.name}</span>
                          <span className={`text-[8px] font-mono font-medium px-1 rounded shrink-0 ${isSelected ? "bg-black/10 text-black/85 font-bold" : "bg-neutral-850 text-white/50"}`}>
                            {asset.sym}
                          </span>
                        </div>
                        <div className={`text-[8px] font-mono mt-0.5 ${isSelected ? "text-black/60" : "text-white/35"}`}>
                          {asset.exch}
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0 pl-1">
                        <div className="text-xs font-bold">
                          {pVal > 0 ? `$${pVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "..."}
                        </div>
                        {pVal > 0 && (
                          <div className={`text-[8px] font-black mt-0.5 ${pChg >= 0 ? (isSelected ? "text-green-850 font-black" : "text-[#00f099]") : (isSelected ? "text-red-850 font-black" : "text-[#ff3b5c]")}`}>
                            {pChg >= 0 ? "▲" : "▼"}{Math.abs(pChg).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Columns 2-3: Chart Stage */}
            <div className="lg:col-span-7 border-r border-neutral-800 flex flex-col overflow-hidden">
              <div className="p-4 bg-[#09090b] border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📊</span>
                  <div>
                    <h2 className="text-sm font-display font-black text-white flex items-center gap-1.5">
                      <span>{selectedAsset?.name}</span>
                      <span className="text-xs font-mono font-normal text-white/40">// {selectedAsset?.sym}</span>
                    </h2>
                    <p className="text-[10px] font-mono text-white/45">{selectedAsset?.exch} Asset Class</p>
                  </div>
                </div>
                {/* Live Large price */}
                <div className="text-right">
                  <span className="text-xl font-mono font-bold tracking-tight text-white">
                    {activePriceData?.p ? `$${activePriceData.p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "Loading..."}
                  </span>
                  {activePriceData?.c !== undefined && (
                    <div className={`text-[10px] font-mono font-black ${activePriceData.c >= 0 ? "text-[#00f099]" : "text-[#ff3b5c]"}`}>
                      {activePriceData.c >= 0 ? "▲" : "▼"} {activePriceData.c.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Chart embed frame */}
              <div className="flex-1 p-4 bg-black flex flex-col justify-center relative min-h-[360px] overflow-hidden">
                {selectedAsset ? (
                  <TradingViewChart
                    asset={selectedAsset}
                    activeTF={activeTF}
                    onTimeframeChange={setActiveTF}
                    livePrice={activePriceData?.p}
                  />
                ) : (
                  <div className="text-center text-xs text-white/40 font-mono">SELECT A TICKER ON THE LEFT TO POPULATE CHART HISTORY</div>
                )}
              </div>
            </div>

            {/* Column 4: Unified Trading execution Desk & Maintenance Tools */}
            <div className="lg:col-span-3 p-5 flex flex-col overflow-y-auto bg-[#09090b] h-full gap-5 border-t lg:border-t-0 border-neutral-800">
              <div>
                <h3 className="text-[10px] font-mono tracking-wider text-white/45 uppercase mb-1">TRANSACTION ROUTING CENTER</h3>
                <p className="text-[9px] text-white/40 leading-relaxed">Secure instant client ledger transaction execution terminal.</p>
              </div>

              {/* Balances summary */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="p-3 bg-black border border-neutral-800 rounded">
                  <div className="text-[9px] font-mono text-white/35 uppercase">STOCKS CASH</div>
                  <div className="text-xs font-mono font-black text-[#f59e0b] mt-1">{fU(portfolio.scash)}</div>
                </div>
                <div className="p-3 bg-black border border-neutral-800 rounded">
                  <div className="text-[9px] font-mono text-white/35 uppercase">CRYPTO CASH</div>
                  <div className="text-xs font-mono font-black text-[#00f099] mt-1">{fU(portfolio.ccash)}</div>
                </div>
              </div>

              {/* Execution Form */}
              <form onSubmit={handleTxExecuteSubmit} className="space-y-4 shrink-0">
                {/* Trade Mode selector */}
                <div className="grid grid-cols-2 gap-1 bg-black p-0.5 border border-neutral-800 rounded">
                  <button
                    type="button"
                    onClick={() => setTxTradeMode("buy")}
                    className={`py-1.5 text-xs font-bold font-display rounded transition-all cursor-pointer ${
                      txTradeMode === "buy" ? "bg-white text-black" : "text-white/40 hover:text-white"
                    }`}
                  >
                    BUY {selectedAsset?.sym}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxTradeMode("sell")}
                    className={`py-1.5 text-xs font-bold font-display rounded transition-all cursor-pointer ${
                      txTradeMode === "sell" ? "bg-[#ff3b5c] text-white animate-pulse" : "text-white/40 hover:text-white"
                    }`}
                  >
                    SELL {selectedAsset?.sym}
                  </button>
                </div>

                {/* Order Type */}
                <div>
                  <label className="text-[9px] font-mono text-white/40 block mb-1">EXECUTION ROUTE</label>
                  <select
                    value={txOrderType}
                    onChange={(e: any) => setTxOrderType(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                  >
                    <option value="market">MARKET EXECUTION</option>
                    <option value="limit">LIMIT MATCH</option>
                    <option value="sl">STOP LOSS MATURED</option>
                    <option value="tp">TAKE PROFIT TARGET</option>
                  </select>
                </div>

                {/* Amount entry */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-mono text-white/40 block mb-1">TRANSACTION VALUE (USD)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-mono text-white/40">$</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={txUsdValue}
                        onChange={(e) => syncTxFromUSD(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded pl-6 pr-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-white/40 block mb-1">ASSET AMOUNT ({selectedAsset?.sym})</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={txQtyValue}
                      onChange={(e) => syncTxFromQty(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                    />
                  </div>

                  {txOrderType !== "market" && (
                    <div>
                      <label className="text-[9px] font-mono text-white/40 block mb-1">TRIGGER/LIMIT MATCH PRICE (USD)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Target rate in USD"
                        value={txLimitValue}
                        onChange={(e) => setTxLimitValue(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                      />
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!txUsdValue || parseFloat(txUsdValue) <= 0}
                  className={`w-full py-3 rounded font-display font-black text-xs tracking-wider uppercase cursor-pointer transition-all active:scale-[0.98] ${
                    !txUsdValue || parseFloat(txUsdValue) <= 0
                      ? "bg-neutral-850 text-white/20 border border-neutral-800/10 cursor-not-allowed"
                      : txTradeMode === "buy"
                      ? "bg-white text-black hover:bg-neutral-200"
                      : "bg-[#ff3b5c] text-white hover:bg-red-600"
                  }`}
                >
                  TRANSMIT LEDGER EXECUTION
                </button>
              </form>

              {/* Maintenance Tools - Clear and reset user data */}
              <div className="mt-auto border-t border-neutral-800 pt-5 space-y-3 shrink-0">
                <div>
                  <h4 className="text-[10px] font-mono tracking-wider text-white/35 uppercase mb-1">COCKPIT DATA UTILITIES</h4>
                  <p className="text-[9px] text-white/40">Flush local memory, clear logins, and reset active balances</p>
                </div>
                
                <button
                  onClick={handleSystemWipe}
                  className="w-full py-2.5 bg-[#ff3b5c]/10 text-[#ff3b5c] hover:bg-[#ff3b5c] hover:text-white border border-[#ff3b5c]/20 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  ☣️ WIPE PREVIOUS TRADER DATA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
