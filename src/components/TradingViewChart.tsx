import React, { useEffect, useRef, useState } from "react";
import { OHLCPoint, ChartDrawing, Asset } from "../types";
import { fU, fINR } from "../utils";

interface TradingViewChartProps {
  asset: Asset;
  activeTF: string;
  onTimeframeChange: (tf: string) => void;
  livePrice?: number;
}

export default function TradingViewChart({
  asset,
  activeTF,
  onTimeframeChange,
  livePrice
}: TradingViewChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<OHLCPoint[]>([]);

  // Chart settings
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [showVol, setShowVol] = useState(true);
  const [showMA, setShowMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0);

  // Interaction / Drawing states
  const [activeTool, setActiveTool] = useState<string>("pointer");
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<ChartDrawing | null>(null);

  // Crosshair coordinates
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number; idx: number } | null>(null);

  // Load history from fullstack Express backend
  const loadChartHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chart-history/${asset.id}?tf=${activeTF}`);
      if (!res.ok) throw new Error("Could not pull historical data");
      const data = await res.json();
      if (data.ok && Array.isArray(data.prices)) {
        setHistory(data.prices);
      }
    } catch (e) {
      console.warn(`Failed to pull history for ${asset.id}, seeding realistic mock candles`, e);
      // Fallback generator if server has connection glitches
      seedMockHistory();
    } finally {
      setLoading(false);
    }
  };

  const seedMockHistory = () => {
    const bars = activeTF === "1D" ? 78 : activeTF === "1W" ? 84 : activeTF === "1M" ? 30 : activeTF === "3M" ? 90 : activeTF === "1Y" ? 52 : 75;
    const baseP = livePrice || 150;
    const list: OHLCPoint[] = [];
    let p = baseP * 0.95;
    const now = Date.now();
    const gap = { "1D": 5 * 60 * 1000, "1W": 60 * 60 * 1000, "1M": 24 * 60 * 60 * 1000, "3M": 24 * 60 * 60 * 1000, "1Y": 7 * 24 * 60 * 60 * 1000 }[activeTF] || 5 * 60 * 1000;

    for (let i = 0; i < bars; i++) {
      const change = (Math.random() - 0.49) * 0.015;
      const open = p;
      const close = Math.max(open * (1 + change), 0.01);
      const diff = Math.abs(close - open);
      const high = Math.max(open, close) + diff * (Math.random() * 0.6);
      const low = Math.max(Math.min(open, close) - diff * (Math.random() * 0.6), 0.01);
      const v = Math.round(5000 + Math.random() * 25000);

      list.push({
        time: now - (bars - i) * gap,
        o: parseFloat(open.toFixed(4)),
        h: parseFloat(high.toFixed(4)),
        l: parseFloat(low.toFixed(4)),
        c: parseFloat(close.toFixed(4)),
        v
      });
      p = close;
    }
    // Set last close to livePrice
    if (list.length > 0 && livePrice) {
      const last = list[list.length - 1];
      last.c = livePrice;
      last.h = Math.max(last.h, livePrice);
      last.l = Math.min(last.l, livePrice);
    }
    setHistory(list);
  };

  useEffect(() => {
    loadChartHistory();
  }, [asset.id, activeTF]);

  const visibleHistory = React.useMemo(() => {
    if (history.length === 0) return history;
    const zoomFactors = [1, 1.4, 2, 3, 4.5];
    const factor = zoomFactors[Math.min(zoomFactors.length - 1, Math.max(0, zoomLevel))];
    const visibleCount = Math.max(12, Math.min(history.length, Math.round(history.length / factor)));
    return history.slice(-visibleCount);
  }, [history, zoomLevel]);

  // Hook live prices directly into chart close point
  useEffect(() => {
    if (history.length > 0 && livePrice) {
      setHistory((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];
        last.c = livePrice;
        last.h = Math.max(last.h, livePrice);
        last.l = Math.min(last.l, livePrice);
        return updated;
      });
    }
  }, [livePrice]);

  // Clear drawings when switching assets
  useEffect(() => {
    setDrawings([]);
    setCurrentDrawing(null);
  }, [asset.id]);

  // Tech Indicators: Moving Average
  const getMA = (data: OHLCPoint[], period: number): (number | null)[] => {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      const slice = data.slice(i - period + 1, i + 1);
      return slice.reduce((s, d) => s + d.c, 0) / period;
    });
  };

  // Tech Indicators: RSI-14
  const getRSI = (data: OHLCPoint[], period = 14): (number | null)[] => {
    const rsi: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        rsi.push(null);
        continue;
      }
      let gains = 0, losses = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const d = data[j].c - data[j - 1]?.c || 0;
        if (d > 0) gains += d;
        else losses -= d;
      }
      const rs = (gains / period) / ((losses / period) || 0.001);
      rsi.push(100 - 100 / (1 + rs));
    }
    return rsi;
  };

  // Canvas Plotting Coordinates Mapper
  const getCoords = (mx: number, my: number, W: number, H: number, data: OHLCPoint[]) => {
    const pad = { l: 8, r: 60, t: 18, b: 28 };
    const vH = showVol ? 40 : 0;
    const rH = showRSI ? 80 : 0;
    const rGap = showRSI ? 12 : 0;

    const mainH = H - vH - rH - rGap - pad.t - pad.b;
    const chartW = W - pad.l - pad.r;

    const vals = data.flatMap((d) => [d.h, d.l]);
    const mn = Math.min(...vals), mxv = Math.max(...vals), rng = mxv - mn || 0.001;
    const rp = rng * 0.06;
    const lo = mn - rp, hi = mxv + rp, range = hi - lo;

    const toX = (i: number) => pad.l + i * (chartW / (data.length - 1));
    const toY = (v: number) => pad.t + mainH * (1 - (v - lo) / range);

    const idx = Math.max(0, Math.min(data.length - 1, Math.round((mx - pad.l) / chartW * (data.length - 1))));
    const price = lo + range * (1 - (my - pad.t) / mainH);

    return { idx, price, px: toX(idx), py: toY(price), toX, toY, lo, hi, range, mainH, pad, chartW };
  };

  // Trigger main Canvas Redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.parentElement?.offsetWidth || 600;
    // Fixed standard viewport height
    const H = 340;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { l: 8, r: 60, t: 18, b: 28 };
    const vH = showVol ? 40 : 0;
    const rH = showRSI ? 80 : 0;
    const rGap = showRSI ? 12 : 0;

    const mainH = H - vH - rH - rGap - pad.t - pad.b;
    const chartW = W - pad.l - pad.r;

    const upColor = "#00e599";
    const dnColor = "#ff4d66";
    const gridColor = "rgba(255, 255, 255, 0.035)";
    const textCol = "rgba(132, 137, 165, 0.6)";

    // Clean background
    ctx.fillStyle = "#07070d";
    ctx.fillRect(0, 0, W, H);

    // Draw Price bounds
    const vals = visibleHistory.flatMap((d) => [d.h, d.l]);
    const mn = Math.min(...vals), mxv = Math.max(...vals), rng = mxv - mn || 0.001;
    const rp = rng * 0.06;
    const lo = mn - rp, hi = mxv + rp, range = hi - lo;

    const toX = (i: number) => pad.l + i * (chartW / Math.max(1, visibleHistory.length - 1));
    const toY = (v: number) => pad.t + mainH * (1 - (v - lo) / range);

    // Grid lines for main chart
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + i * (mainH / 5);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = pad.l + i * (chartW / 6);
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + mainH);
      ctx.stroke();
    }

    // Volume columns rendering
    if (showVol) {
      const volY0 = pad.t + mainH;
      const maxVol = Math.max(...visibleHistory.map((d) => d.v));
      visibleHistory.forEach((d, i) => {
        const x = toX(i);
        const bw = Math.max(1.5, chartW / Math.max(visibleHistory.length, 1) * 0.55);
        const vh = (d.v / (maxVol || 1)) * (vH - 6);
        ctx.fillStyle = d.c >= d.o ? "rgba(0, 229, 153, 0.2)" : "rgba(255, 77, 102, 0.18)";
        ctx.fillRect(x - bw / 2, volY0 + vH - vh, bw, vh);
      });
    }

    // RSI plotting
    if (showRSI) {
      const rsiY0 = pad.t + mainH + vH + rGap;
      const rsiVals = getRSI(visibleHistory);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      [30, 50, 70].forEach((lvl) => {
        const y = rsiY0 + (1 - lvl / 100) * (rH - 8);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(W - pad.r, y);
        ctx.stroke();
        ctx.fillStyle = textCol;
        ctx.font = "9px DM Mono";
        ctx.textAlign = "right";
        ctx.fillText(lvl.toString(), W - pad.r + 52, y + 3);
      });

      ctx.beginPath();
      let first = true;
      rsiVals.forEach((r, i) => {
        if (r === null) return;
        const x = toX(i);
        const y = rsiY0 + (1 - r / 100) * (rH - 8);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = "rgba(94, 102, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = textCol;
      ctx.font = "9px DM Mono";
      ctx.textAlign = "left";
      ctx.fillText("RSI 14", pad.l + 4, rsiY0 + 10);
    }

    // Moving Averages 20 / 50 lines
    if (showMA) {
      const ma20 = getMA(visibleHistory, 20);
      const ma50 = getMA(visibleHistory, 50);

      // Yellow MA20
      ctx.beginPath();
      let first20 = true;
      ma20.forEach((v, i) => {
        if (v === null) return;
        const x = toX(i), y = toY(v);
        if (first20) {
          ctx.moveTo(x, y);
          first20 = false;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = "rgba(255, 196, 61, 0.75)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Blue MA50
      ctx.beginPath();
      let first50 = true;
      ma50.forEach((v, i) => {
        if (v === null) return;
        const x = toX(i), y = toY(v);
        if (first50) {
          ctx.moveTo(x, y);
          first50 = false;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = "rgba(94, 102, 255, 0.75)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Render Price Curves or Candlesticks
    if (chartType === "line") {
      // Area Fill
      const grad = ctx.createLinearGradient(0, toY(mxv), 0, toY(mn));
      grad.addColorStop(0, "rgba(0, 229, 153, 0.12)");
      grad.addColorStop(1, "rgba(0, 229, 153, 0)");
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(visibleHistory[0].c));
      visibleHistory.forEach((d, i) => ctx.lineTo(toX(i), toY(d.c)));
      ctx.lineTo(toX(visibleHistory.length - 1), pad.t + mainH);
      ctx.lineTo(toX(0), pad.t + mainH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(visibleHistory[0].c));
      visibleHistory.forEach((d, i) => ctx.lineTo(toX(i), toY(d.c)));
      ctx.strokeStyle = upColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Draw Candlesticks
      const bw = Math.max(4, Math.min(18, Math.floor(chartW / Math.max(visibleHistory.length, 1) * 0.75)));
      visibleHistory.forEach((d, i) => {
        const x = Math.round(toX(i));
        const up = d.c >= d.o;
        const col = up ? upColor : dnColor;

        // Wick
        const wickTop = Math.round(toY(d.h));
        const wickBottom = Math.round(toY(d.l));
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, wickTop);
        ctx.lineTo(x, wickBottom);
        ctx.stroke();

        // Body
        const yHigh = Math.round(toY(Math.max(d.o, d.c)));
        const yLow = Math.round(toY(Math.min(d.o, d.c)));
        const bh = Math.max(3, yLow - yHigh);
        const bodyX = Math.round(x - bw / 2);
        ctx.fillStyle = up ? "rgba(0, 229, 153, 0.9)" : "rgba(255, 77, 102, 0.9)";
        ctx.fillRect(bodyX, yHigh, bw, bh);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.strokeRect(bodyX, yHigh, bw, bh);
      });
    }

    // Render Price Axis Labels
    ctx.font = "10px DM Mono";
    ctx.textAlign = "left";
    ctx.fillStyle = textCol;
    for (let i = 0; i <= 5; i++) {
      const v = lo + range * (1 - i / 5);
      const y = pad.t + i * (mainH / 5);
      const lbl = v >= 1000 ? v.toFixed(0) : v >= 10 ? v.toFixed(2) : v.toFixed(4);
      ctx.fillText(lbl, W - pad.r + 4, y + 3);
    }

    // Time Axis Labels
    ctx.textAlign = "center";
    ctx.font = "9px DM Mono";
    const segmentCount = 6;
    for (let i = 0; i <= segmentCount; i++) {
      const idx = Math.floor(i * (visibleHistory.length - 1) / segmentCount);
      const x = toX(idx);
      const d = new Date(visibleHistory[idx].time);
      const lbl = activeTF === "1D"
        ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      ctx.fillText(lbl, x, pad.t + mainH + 15);
    }

    // Current Price Dashed Tracker Line
    const lastPriceValue = visibleHistory[visibleHistory.length - 1]?.c || livePrice || lo;
    const curY = toY(lastPriceValue);
    const lastUp = lastPriceValue >= (visibleHistory[visibleHistory.length - 2]?.c || lastPriceValue);
    ctx.strokeStyle = lastUp ? "rgba(0, 229, 153, 0.4)" : "rgba(255, 77, 102, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.l, curY);
    ctx.lineTo(W - pad.r, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Price indicator block on axis
    ctx.fillStyle = lastUp ? upColor : dnColor;
    ctx.fillRect(W - pad.r + 1, curY - 9, pad.r - 2, 18);
    ctx.fillStyle = "#030307";
    ctx.font = "bold 9px DM Mono";
    ctx.textAlign = "left";
    const lpLbl = lastPriceValue >= 1000 ? lastPriceValue.toFixed(0) : lastPriceValue >= 10 ? lastPriceValue.toFixed(2) : lastPriceValue.toFixed(4);
    ctx.fillText(lpLbl, W - pad.r + 4, curY + 3);

    // Crosshair Lines
    if (hoverCoords && activeTool === "crosshair") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      // vertical crosshair
      ctx.moveTo(hoverCoords.x, pad.t);
      ctx.lineTo(hoverCoords.x, pad.t + mainH);
      ctx.stroke();
      // horizontal crosshair
      ctx.beginPath();
      ctx.moveTo(pad.l, hoverCoords.y);
      ctx.lineTo(W - pad.r, hoverCoords.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw existing drawings
    const allDrawings = [...drawings, ...(currentDrawing ? [currentDrawing] : [])];
    allDrawings.forEach((dr) => {
      ctx.save();
      ctx.strokeStyle = dr.color;
      ctx.fillStyle = dr.color;
      ctx.lineWidth = 1.5;

      const p = dr.points;
      if ((dr.type === "trendline" || dr.type === "ray") && p.length >= 1) {
        const x1 = toX(p[0].idx), y1 = toY(p[0].price);
        const x2 = p.length >= 2 ? toX(p[1].idx) : (dr.end?.px ?? x1);
        const y2 = p.length >= 2 ? toY(p[1].price) : (dr.end?.py ?? y1);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x1, y1, 3, 0, Math.PI * 2);
        ctx.arc(x2, y2, 3, 0, Math.PI * 2);
        ctx.fill();

        if (dr.type === "ray" && p.length >= 2) {
          const dx = x2 - x1, dy = y2 - y1;
          const ext = Math.max(W, H) * 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 + dx * ext, y2 + dy * ext);
          ctx.stroke();
        }
      } else if (dr.type === "hline" && p.length >= 1) {
        const y = toY(p[0].price);
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(W - pad.r, y);
        ctx.stroke();
        ctx.font = "bold 9px DM Mono";
        ctx.fillText(fU(p[0].price), pad.l + 4, y - 4);
      } else if (dr.type === "vline" && p.length >= 1) {
        const x = toX(p[0].idx);
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, pad.t);
        ctx.lineTo(x, pad.t + mainH);
        ctx.stroke();
      } else if (dr.type === "rect" && p.length >= 1) {
        const x1 = toX(p[0].idx), y1 = toY(p[0].price);
        const x2 = p.length >= 2 ? toX(p[1].idx) : (dr.end?.px ?? x1);
        const y2 = p.length >= 2 ? toY(p[1].price) : (dr.end?.py ?? y1);

        const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillStyle = "rgba(94, 102, 255, 0.05)";
        ctx.fillRect(rx, ry, rw, rh);
      } else if (dr.type === "fib" && p.length >= 1) {
        const y1 = toY(p[0].price);
        const y2 = p.length >= 2 ? toY(p[1].price) : (dr.end?.py ?? y1);
        const fibs = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const labels = ["0%", "23.6%", "38.2%", "50%", "61.8%", "78.6%", "100%"];

        fibs.forEach((f, idx) => {
          const fy = y1 + (y2 - y1) * f;
          ctx.strokeStyle = "rgba(255, 196, 61, 0.4)";
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(pad.l, fy);
          ctx.lineTo(W - pad.r, fy);
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 196, 61, 0.8)";
          ctx.font = "8px DM Mono";
          const pVal = p[0].price + (p.length >= 2 ? p[1].price - p[0].price : 0) * f;
          ctx.fillText(`${labels[idx]} (${fU(pVal)})`, pad.l + 4, fy - 2);
        });
      } else if (dr.type === "measure" && p.length >= 1) {
        const x1 = toX(p[0].idx), y1 = toY(p[0].price);
        const x2 = p.length >= 2 ? toX(p[1].idx) : (dr.end?.px ?? x1);
        const y2 = p.length >= 2 ? toY(p[1].price) : (dr.end?.py ?? y1);

        ctx.strokeStyle = "rgba(255, 196, 61, 0.6)";
        ctx.fillStyle = "rgba(255, 196, 61, 0.08)";
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));

        if (p.length >= 2) {
          const pct = ((p[1].price - p[0].price) / p[0].price * 100).toFixed(2);
          ctx.fillStyle = "rgba(255, 196, 61, 1)";
          ctx.font = "bold 9px DM Mono";
          ctx.textAlign = "center";
          ctx.fillText(`${pct}%`, (x1 + x2) / 2, (y1 + y2) / 2);
        }
      } else if (dr.type === "text" && p.length >= 1) {
        ctx.font = "bold 10px DM Sans";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillText(dr.text || "Note", toX(p[0].idx), toY(p[0].price));
      }
      ctx.restore();
    });

  }, [history, chartType, showVol, showMA, showRSI, hoverCoords, activeTool, drawings, currentDrawing]);

  // Handle Drawings on Mouse Down/Up
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (visibleHistory.length < 2 || activeTool === "pointer" || activeTool === "crosshair") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cd = getCoords(mx, my, canvas.offsetWidth, canvas.offsetHeight, visibleHistory);

    if (activeTool === "eraser") {
      setDrawings((prev) => prev.slice(0, -1));
      return;
    }

    if (activeTool === "hline") {
      setDrawings((prev) => [
        ...prev,
        { type: "hline", points: [{ idx: cd.idx, price: cd.price }], color: "#5e66ff" }
      ]);
      return;
    }

    if (activeTool === "vline") {
      setDrawings((prev) => [
        ...prev,
        { type: "vline", points: [{ idx: cd.idx, price: cd.price }], color: "#5e66ff" }
      ]);
      return;
    }

    if (activeTool === "text") {
      const txt = prompt("Enter label note:", "Note");
      if (txt) {
        setDrawings((prev) => [
          ...prev,
          { type: "text", points: [{ idx: cd.idx, price: cd.price }], color: "#eef1f8", text: txt }
        ]);
      }
      return;
    }

    // Multi-click tools (trendline, fib, rectangle, ray, measure)
    const colorMap: { [key: string]: string } = {
      trendline: "#5e66ff",
      ray: "#00e599",
      rect: "#5e66ff",
      fib: "#ffc43d",
      measure: "#ffc43d"
    };

    setCurrentDrawing({
      type: activeTool as any,
      points: [{ idx: cd.idx, price: cd.price }],
      color: colorMap[activeTool] || "#5e66ff",
      end: null
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || visibleHistory.length < 2) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cd = getCoords(mx, my, canvas.offsetWidth, canvas.offsetHeight, visibleHistory);

    setHoverCoords({ x: mx, y: my, idx: cd.idx });

    if (currentDrawing) {
      setCurrentDrawing((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          end: { px: cd.px, py: cd.py, idx: cd.idx, price: cd.price }
        };
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cd = getCoords(mx, my, canvas.offsetWidth, canvas.offsetHeight, visibleHistory);

    const completedPoints = [...currentDrawing.points, { idx: cd.idx, price: cd.price }];
    setDrawings((prev) => [
      ...prev,
      { ...currentDrawing, points: completedPoints, end: null }
    ]);
    setCurrentDrawing(null);
  };

  const handleMouseLeave = () => {
    setHoverCoords(null);
    if (currentDrawing) setCurrentDrawing(null);
  };

  // Download canvas screenshot
  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tradex-chart-${asset.sym}-${activeTF}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="w-full bg-card border border-white/5 rounded-xl overflow-hidden shadow-xl">
      {/* Chart toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#07070d] border-b border-white/5">
        
        {/* Timeframe selector */}
        <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5 gap-0.5 select-none">
          {["1D", "1W", "1M", "3M", "1Y"].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md cursor-pointer transition-all ${
                activeTF === tf
                  ? "bg-accent text-white shadow-[0_2px_8px_rgba(94,102,255,0.3)]"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart type & Indicator toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5 gap-0.5 select-none">
            <button
              onClick={() => setChartType("candle")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md cursor-pointer ${
                chartType === "candle" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              🕯 Candles
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md cursor-pointer ${
                chartType === "line" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              📈 Line
            </button>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Indicators buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowVol(!showVol)}
              className={`px-2 py-1 text-[10px] font-mono tracking-wider font-bold rounded border cursor-pointer transition-all uppercase ${
                showVol
                  ? "bg-green/10 border-green/30 text-green"
                  : "bg-transparent border-white/5 text-white/30"
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setShowMA(!showMA)}
              className={`px-2 py-1 text-[10px] font-mono tracking-wider font-bold rounded border cursor-pointer transition-all uppercase ${
                showMA
                  ? "bg-yellow/10 border-yellow/30 text-yellow"
                  : "bg-transparent border-white/5 text-white/30"
              }`}
            >
              MA 20/50
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-1 text-[10px] font-mono tracking-wider font-bold rounded border cursor-pointer transition-all uppercase ${
                showRSI
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-transparent border-white/5 text-white/30"
              }`}
            >
              RSI 14
            </button>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Screenshot & Clear Drawings */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomLevel(Math.max(0, zoomLevel - 1))}
              title="Zoom In"
              className="px-2 py-1 text-[10px] font-bold bg-white/5 border border-white/10 rounded hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              ➕
            </button>
            <button
              onClick={() => setZoomLevel(Math.min(4, zoomLevel + 1))}
              title="Zoom Out"
              className="px-2 py-1 text-[10px] font-bold bg-white/5 border border-white/10 rounded hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              ➖
            </button>
            <span className="px-2 py-1 text-[10px] font-mono rounded bg-white/5 text-white/60">{Math.round((1 / [1,1.4,2,3,4.5][zoomLevel]) * 100)}%</span>
            <button
              onClick={takeScreenshot}
              title="Camera Capture"
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer transition-all"
            >
              📸
            </button>
            <button
              onClick={() => setDrawings([])}
              title="Clear Drawings"
              className="px-2 py-1 text-[10px] font-bold bg-red/10 border border-red/20 text-red rounded hover:bg-red/20 cursor-pointer transition-all"
            >
              🗑 Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main viewport with drawing tools on left and canvas on right */}
      <div className="flex h-[340px] relative">
        
        {/* Drawing sidebar */}
        <div className="w-[44px] bg-[#07070d] border-r border-white/5 flex flex-col items-center py-2.5 gap-1 select-none overflow-y-auto">
          {[
            { id: "pointer", icon: "⬈", label: "Pointer" },
            { id: "crosshair", icon: "✛", label: "Crosshair" },
            { id: "trendline", icon: "╱", label: "Trend Line" },
            { id: "ray", icon: "⟶", label: "Ray" },
            { id: "hline", icon: "⏷", label: "Horizontal Line" },
            { id: "vline", icon: "⏵", label: "Vertical Line" },
            { id: "rect", icon: "▭", label: "Rectangle" },
            { id: "fib", icon: "≚", label: "Fibonacci" },
            { id: "text", icon: "🔤", label: "Text Label" },
            { id: "measure", icon: "📏", label: "Measure" },
            { id: "eraser", icon: "⌫", label: "Erase Last" }
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold cursor-pointer transition-all ${
                activeTool === tool.id
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "text-white/30 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Chart canvas */}
        <div className="flex-1 relative bg-[#07070d]">
          {loading && (
            <div className="absolute inset-0 bg-[#07070d]/80 z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono tracking-widest text-white/40 uppercase">Loading Live Candles...</span>
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`block w-full h-[340px] select-none ${
              activeTool === "pointer" ? "cursor-default" : "cursor-crosshair"
            }`}
          />

          {/* Custom Overlay tooltip coordinates */}
          {hoverCoords && visibleHistory[hoverCoords.idx] && (
            <div className="absolute top-3 left-3 z-10 pointer-events-none bg-[#030307]/90 border border-white/10 rounded-lg p-2 font-mono text-[9px] text-white/50 leading-relaxed shadow-lg">
              <div className="text-[8px] font-bold text-white mb-0.5">
                {new Date(visibleHistory[hoverCoords.idx].time).toLocaleString("en-US", { hour12: false })}
              </div>
              <div>Open: <span className="text-white">{fU(visibleHistory[hoverCoords.idx].o)}</span></div>
              <div>High: <span className="text-green">{fU(visibleHistory[hoverCoords.idx].h)}</span></div>
              <div>Low: <span className="text-red">{fU(visibleHistory[hoverCoords.idx].l)}</span></div>
              <div>Close: <span className="text-white font-bold">{fU(visibleHistory[hoverCoords.idx].c)}</span></div>
              <div>Vol: <span className="text-white">{visibleHistory[hoverCoords.idx].v.toLocaleString()}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
