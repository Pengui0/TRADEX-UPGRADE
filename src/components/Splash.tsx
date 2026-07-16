import React, { useEffect, useState } from "react";
import { ALL_ASSETS } from "../types";

interface SplashProps {
  onComplete: () => void;
}

const WORLD_EXCHANGES = [
  "Connecting to NASDAQ...",
  "Synchronizing NYSE ticker symbols...",
  "Bootstrapping NSE real-time quotes...",
  "Retrieving KRX index data...",
  "Establishing London Stock Exchange gateway...",
  "Finalizing secure portfolio ledger...",
  "Ready!"
];

export default function Splash({ onComplete }: SplashProps) {
  const [exchangeStatus, setExchangeStatus] = useState(WORLD_EXCHANGES[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Staggered status updates
    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      statusIdx++;
      if (statusIdx < WORLD_EXCHANGES.length) {
        setExchangeStatus(WORLD_EXCHANGES[statusIdx]);
      }
    }, 600);

    // Smooth progress bar fill
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.2;
      });
    }, 40);

    // Fade out splash after 4.5s
    const timeout = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearInterval(statusInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div
      id="splash"
      className="fixed inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fine Monochrome Grid Mesh */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />

      {/* High-Contrast Concentric Technical Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10 w-[220px] aspect-square" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 w-[340px] aspect-square" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 w-[460px] aspect-square" />

      {/* Main Logo Card */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Brand Emblem */}
        <div className="w-[84px] h-[84px] bg-white border border-white/10 rounded-2xl flex items-center justify-center mb-6 transition-transform hover:scale-105 duration-500">
          <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>

        {/* Brand Display Typography */}
        <h1 className="text-5xl font-black tracking-tight text-white mb-1 font-display">
          Trade<span className="text-neutral-400">X</span>
        </h1>
        <p className="text-[10px] font-mono tracking-[0.3em] text-white/45 uppercase mb-8">
          Virtual Stock & Crypto Ecosystem
        </p>

        {/* Counter PNL Metrics */}
        <div className="flex items-center gap-6 mb-8 px-6 py-2 rounded-full bg-white/[0.04] border border-white/10">
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-white">98+</div>
            <div className="text-[8px] tracking-wider uppercase text-white/40 mt-0.5">Stocks</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-white">15+</div>
            <div className="text-[8px] tracking-wider uppercase text-white/40 mt-0.5">Cryptos</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-white">LIVE</div>
            <div className="text-[8px] tracking-wider uppercase text-white/40 mt-0.5">Quotes</div>
          </div>
        </div>

        {/* Progress bar container */}
        <div className="w-[180px] h-[2px] bg-white/5 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-accent to-green shadow-[0_0_8px_rgba(94,102,255,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Sync Console status text */}
        <p className="text-[10px] font-mono text-white/40 min-h-[14px]">
          {exchangeStatus}
        </p>
      </div>

      {/* Scrolling Stock Ticker Backdrop (Aesthetic) */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-white/[0.01] border-t border-white/5 flex items-center overflow-hidden select-none opacity-30">
        <div className="flex gap-12 whitespace-nowrap animate-[tickScroll_20s_linear_infinite] font-mono text-[10px]">
          {ALL_ASSETS.slice(0, 15).map((a) => (
            <span key={a.id} className="flex gap-2">
              <span className="text-white/60 font-bold">{a.sym}</span>
              <span className="text-green">▲ 1.45%</span>
            </span>
          ))}
          {ALL_ASSETS.slice(0, 15).map((a) => (
            <span key={`dup-${a.id}`} className="flex gap-2">
              <span className="text-white/60 font-bold">{a.sym}</span>
              <span className="text-green">▲ 1.45%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
