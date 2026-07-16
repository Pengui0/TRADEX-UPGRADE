import express from "express";
import path from "path";
import net from "net";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { YF_MAP, NSE_IDS, Asset, ALL_ASSETS } from "./src/types";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HMR_BASE_PORT = Number(process.env.HMR_PORT || 24678);

async function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort: number, maxPort = startPort + 20): Promise<number> {
  for (let port = startPort; port <= maxPort; port++) {
    if (await checkPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found between ${startPort} and ${maxPort}`);
}

let cachedPrices: { [id: string]: any } = {};
let lastFetchTime = 0;
let inrRate = 83.5;
let krwRate = 1340.0;
let rateLimitUntil = 0;

const DEFAULT_BASE_PRICES: { [id: string]: { p: number; c: number; mc: number } } = {
  // Cryptos
  "bitcoin": { p: 64250.0, c: 2.45, mc: 1260000000000 },
  "ethereum": { p: 3450.0, c: 1.82, mc: 415000000000 },
  "binancecoin": { p: 575.0, c: -0.45, mc: 88000000000 },
  "solana": { p: 142.5, c: 5.12, mc: 66000000000 },
  "ripple": { p: 0.56, c: 0.12, mc: 31000000000 },
  "cardano": { p: 0.42, c: -1.25, mc: 15000000000 },
  "dogecoin": { p: 0.115, c: 3.42, mc: 16000000000 },
  "avalanche-2": { p: 26.8, c: -2.1, mc: 10000000000 },
  "chainlink": { p: 13.7, c: 0.85, mc: 8000000000 },
  "near": { p: 4.85, c: 2.15, mc: 5000000000 },
  "polkadot": { p: 5.9, c: -0.6, mc: 8000000000 },
  "uniswap": { p: 7.2, c: 1.1, mc: 4000000000 },
  "litecoin": { p: 72.4, c: -0.3, mc: 5000000000 },
  "tron": { p: 0.125, c: 0.25, mc: 11000000000 },
  "stellar": { p: 0.098, c: -0.4, mc: 3000000000 },

  // Stocks (US)
  "aapl": { p: 188.3, c: 1.15, mc: 2950000000000 },
  "msft": { p: 415.5, c: 0.82, mc: 3100000000000 },
  "nvda": { p: 118.4, c: -2.45, mc: 2900000000000 },
  "googl": { p: 172.6, c: 0.45, mc: 2150000000000 },
  "meta": { p: 485.2, c: -1.12, mc: 1250000000000 },
  "tsla": { p: 178.5, c: 3.84, mc: 570000000000 },
  "amzn": { p: 182.4, c: 0.95, mc: 1900000000000 },
  "nflx": { p: 610.2, c: -0.55, mc: 265000000000 },
  "amd": { p: 154.6, c: -1.75, mc: 250000000000 },
  "intc": { p: 30.2, c: -0.22, mc: 130000000000 },
  "jpm": { p: 195.4, c: 0.35, mc: 560000000000 },
  "bac": { p: 38.2, c: 0.15, mc: 300000000000 },
  "gs": { p: 452.8, c: 0.65, mc: 150000000000 },
  "v": { p: 272.3, c: 0.25, mc: 550000000000 },
  "ma": { p: 442.5, c: 0.42, mc: 410000000000 },
  "jnj": { p: 148.6, c: -0.15, mc: 360000000000 },
  "pfe": { p: 27.4, c: -0.45, mc: 155000000000 },
  "xom": { p: 114.2, c: 0.55, mc: 460000000000 },
  "wmt": { p: 66.8, c: 0.18, mc: 540000000000 },
  "ko": { p: 62.5, c: -0.05, mc: 270000000000 },
  "orcl": { p: 138.4, c: 1.25, mc: 380000000000 },
  "crm": { p: 232.5, c: -0.85, mc: 225000000000 },
  "adbe": { p: 512.4, c: 0.35, mc: 230000000000 }
};

function getFallbackPrice(assetId: string): { p: number; c: number; hi: number; lo: number; mc: number; open: number } {
  let hash = 0;
  for (let i = 0; i < assetId.length; i++) {
    hash = assetId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const prng = () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  const defaultVal = DEFAULT_BASE_PRICES[assetId];
  let p = defaultVal ? defaultVal.p : (15 + prng() * 450);
  let c = defaultVal ? defaultVal.c : (prng() * 6 - 3);
  let mc = defaultVal ? defaultVal.mc : Math.round((100000000 + prng() * 900000000));

  // Add subtle dynamic real-time ticks
  const jitterPercent = (Math.random() - 0.5) * 0.003;
  p = parseFloat((p * (1 + jitterPercent)).toFixed(4));
  c = parseFloat((c + (Math.random() - 0.5) * 0.05).toFixed(3));

  const hi = parseFloat((p * (1 + Math.abs(prng() * 0.02))).toFixed(4));
  const lo = parseFloat((p * (1 - Math.abs(prng() * 0.02))).toFixed(4));
  const open = parseFloat((p / (1 + c / 100)).toFixed(4));

  return { p, c, hi, lo, mc, open };
}

function generateMockHistory(id: string, tf: string) {
  const basePriceInfo = getFallbackPrice(id);
  const startPrice = basePriceInfo.p;

  let pointsCount = 100;
  let intervalMs = 24 * 60 * 60 * 1000;

  switch (tf) {
    case "1D":
      pointsCount = 78;
      intervalMs = 5 * 60 * 1000;
      break;
    case "1W":
      pointsCount = 168;
      intervalMs = 60 * 60 * 1000;
      break;
    case "1M":
      pointsCount = 30;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "3M":
      pointsCount = 90;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "1Y":
      pointsCount = 365;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
  }

  const historyPoints: any[] = [];
  let currentPrice = startPrice * (1 - (basePriceInfo.c / 100));

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const prng = () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  const now = Date.now();
  const startTime = now - (pointsCount * intervalMs);

  for (let i = 0; i < pointsCount; i++) {
    const t = startTime + (i * intervalMs);
    const change = currentPrice * (prng() - 0.495) * 0.015;
    const openPrice = currentPrice;
    const closePrice = currentPrice + change;
    const highPrice = Math.max(openPrice, closePrice) + (Math.abs(prng() * currentPrice * 0.004));
    const lowPrice = Math.min(openPrice, closePrice) - (Math.abs(prng() * currentPrice * 0.004));
    const vol = Math.round(5000 + prng() * 250000);

    historyPoints.push({
      time: t,
      o: parseFloat(openPrice.toFixed(4)),
      h: parseFloat(highPrice.toFixed(4)),
      l: parseFloat(lowPrice.toFixed(4)),
      c: parseFloat(closePrice.toFixed(4)),
      v: vol
    });

    currentPrice = closePrice;
  }

  return historyPoints;
}

const DEFAULT_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const US_STOCK_ASSETS = ALL_ASSETS.filter((a: Asset) => a.exch === "NASDAQ" || a.exch === "NYSE");

// Finnhub's free tier is limited to 60 calls/min, and we have ~65 US-listed
// symbols, so we cache Finnhub results separately for 60s regardless of how
// often /api/prices itself is polled, and fetch in small batches rather than
// firing everything at once.
let finnhubCache: { [id: string]: any } = {};
let lastKnownGoodFinnhub: { [id: string]: any } = {};
let lastFinnhubFetchTime = 0;
const FINNHUB_REFRESH_MS = 60000;
const FINNHUB_BATCH_SIZE = 10;

async function fetchFinnhubQuote(asset: Asset, apiKey: string): Promise<any | null> {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(asset.sym)}&token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    // Finnhub returns all-zero fields for an unrecognized symbol rather than an error.
    if (!data || typeof data.c !== "number" || data.c === 0) return null;
    return {
      p: parseFloat(Number(data.c).toFixed(4)),
      c: parseFloat(Number(data.dp ?? 0).toFixed(3)),
      hi: parseFloat(Number(data.h ?? data.c).toFixed(4)),
      lo: parseFloat(Number(data.l ?? data.c).toFixed(4)),
      open: parseFloat(Number(data.pc ?? data.c).toFixed(4)),
      fromServer: true
    };
  } catch {
    return null;
  }
}

async function overlayFinnhubStocks(target: { [id: string]: any }): Promise<boolean> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey || US_STOCK_ASSETS.length === 0) return false;

  const now = Date.now();
  if (now - lastFinnhubFetchTime < FINNHUB_REFRESH_MS && Object.keys(finnhubCache).length > 0) {
    Object.assign(target, finnhubCache);
    return true;
  }

  const freshResults: { [id: string]: any } = {};
  for (let i = 0; i < US_STOCK_ASSETS.length; i += FINNHUB_BATCH_SIZE) {
    const batch = US_STOCK_ASSETS.slice(i, i + FINNHUB_BATCH_SIZE);
    const results = await Promise.all(batch.map((asset: Asset) => fetchFinnhubQuote(asset, apiKey)));
    batch.forEach((asset: Asset, idx: number) => {
      const quote = results[idx];
      if (quote) {
        // Keep whatever market cap we already have (Yahoo/hardcoded) - Finnhub's
        // market cap requires a separate paid-adjacent call we're skipping here.
        const existingMc = target[asset.id]?.mc ?? 0;
        freshResults[asset.id] = { ...quote, mc: existingMc };
      }
    });
  }

  if (Object.keys(freshResults).length > 0) {
    Object.assign(target, freshResults);
    finnhubCache = freshResults;
    lastKnownGoodFinnhub = { ...lastKnownGoodFinnhub, ...freshResults };
    lastFinnhubFetchTime = now;
    return true;
  }

  // This cycle's fetch failed, but if we have good data from a previous
  // successful cycle, keep showing that instead of flipping to "fallback".
  if (Object.keys(lastKnownGoodFinnhub).length > 0) {
    Object.assign(target, lastKnownGoodFinnhub);
    console.warn("[TradeX Server] Finnhub fetch failed this cycle - reusing last known good quotes.");
    return true;
  }

  console.warn("[TradeX Server] Finnhub returned no usable quotes - check FINNHUB_API_KEY.");
  return false;
}

const NASDAQ_API_HEADERS = {
  "User-Agent": DEFAULT_USER_AGENT,
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9"
};

let nasdaqCache: { [id: string]: any } = {};
let lastKnownGoodNasdaq: { [id: string]: any } = {};
let lastNasdaqFetchTime = 0;
const NASDAQ_REFRESH_MS = 60000;
const NASDAQ_BATCH_SIZE = 8;

function parseNasdaqPrice(value: string): number {
  const cleaned = value?.toString().replace(/[^0-9.-]+/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchNasdaqQuote(asset: Asset): Promise<any | null> {
  try {
    const url = `https://api.nasdaq.com/api/quote/${asset.sym}/info?assetclass=stocks`;
    const res = await fetch(url, { headers: NASDAQ_API_HEADERS });
    if (!res.ok) return null;
    const data: any = await res.json();
    const primary = data?.data?.primaryData;
    if (!primary || !primary.lastSalePrice) return null;

    const price = parseNasdaqPrice(primary.lastSalePrice);
    if (price === 0) return null;

    const change = parseNasdaqPrice(primary.netChange ?? "0");
    const percent = Number((primary.percentageChange ?? "0").toString().replace(/[%+]/g, "")) || 0;

    return {
      p: price,
      c: parseFloat(percent.toFixed(3)),
      hi: price,
      lo: price,
      mc: 0,
      open: price,
      fromServer: true
    };
  } catch {
    return null;
  }
}

async function overlayNasdaqStocks(target: { [id: string]: any }): Promise<boolean> {
  if (US_STOCK_ASSETS.length === 0) return false;

  const now = Date.now();
  if (now - lastNasdaqFetchTime < NASDAQ_REFRESH_MS && Object.keys(nasdaqCache).length > 0) {
    Object.assign(target, nasdaqCache);
    return true;
  }

  const freshResults: { [id: string]: any } = {};
  for (let i = 0; i < US_STOCK_ASSETS.length; i += NASDAQ_BATCH_SIZE) {
    const batch = US_STOCK_ASSETS.slice(i, i + NASDAQ_BATCH_SIZE);
    const results = await Promise.all(batch.map((asset: Asset) => fetchNasdaqQuote(asset)));
    batch.forEach((asset: Asset, idx: number) => {
      const quote = results[idx];
      if (quote) {
        const existingMc = target[asset.id]?.mc ?? 0;
        freshResults[asset.id] = { ...quote, mc: existingMc };
      }
    });
  }

  if (Object.keys(freshResults).length > 0) {
    Object.assign(target, freshResults);
    nasdaqCache = freshResults;
    lastKnownGoodNasdaq = { ...lastKnownGoodNasdaq, ...freshResults };
    lastNasdaqFetchTime = now;
    return true;
  }

  if (Object.keys(lastKnownGoodNasdaq).length > 0) {
    Object.assign(target, lastKnownGoodNasdaq);
    console.warn("[TradeX Server] Nasdaq fetch failed this cycle - reusing last known good quotes.");
    return true;
  }

  console.warn("[TradeX Server] Nasdaq returned no usable quotes.");
  return false;
}

const CRYPTO_ASSETS = ALL_ASSETS.filter((a: Asset) => a.exch === "Crypto");
const CRYPTO_IDS = CRYPTO_ASSETS.map((a: Asset) => a.id);
let lastKnownGoodCrypto: { [id: string]: any } = {};

// CoinGecko's public API needs no key and is more reliable than many other
// sources for crypto. Our crypto asset ids were already chosen to match
// CoinGecko's coin ids 1:1, so no symbol-mapping is needed here.
async function overlayCoinGeckoCrypto(target: { [id: string]: any }): Promise<boolean> {
  if (CRYPTO_IDS.length === 0) return false;
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS.join(",")}`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) {
      throw new Error(`CoinGecko API returned status ${res.status}`);
    }
    const data: any = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("CoinGecko API returned no coin data");
    }
    for (const coin of data) {
      if (!coin?.id) continue;
      const p = Number(coin.current_price ?? 0);
      const c = Number(coin.price_change_percentage_24h ?? 0);
      target[coin.id] = {
        p: parseFloat(p.toFixed(6)),
        c: parseFloat(c.toFixed(3)),
        hi: parseFloat(Number(coin.high_24h ?? p).toFixed(6)),
        lo: parseFloat(Number(coin.low_24h ?? p).toFixed(6)),
        mc: Math.round(Number(coin.market_cap ?? 0)),
        open: parseFloat((p / (1 + c / 100 || 1)).toFixed(6)),
        fromServer: true
      };
    }
    lastKnownGoodCrypto = { ...lastKnownGoodCrypto, ...Object.fromEntries(CRYPTO_IDS.map((id: string) => [id, target[id]]).filter(([, v]: any) => v?.fromServer)) };
    return true;
  } catch (error: any) {
    console.warn("[TradeX Server] Failed to fetch live crypto prices from CoinGecko:", error.message);
    if (Object.keys(lastKnownGoodCrypto).length > 0) {
      Object.assign(target, lastKnownGoodCrypto);
      return true;
    }
    return false;
  }
}

const EXCHANGE_RATE_SOURCES = [
  {
    url: "https://api.frankfurter.app/latest?from=USD&to=INR,KRW",
    parser: (data: any) => ({
      inr: Number(data?.rates?.INR ?? 0),
      krw: Number(data?.rates?.KRW ?? 0),
    }),
  },
  {
    url: "https://open.er-api.com/v6/latest/USD",
    parser: (data: any) => ({
      inr: Number(data?.rates?.INR ?? 0),
      krw: Number(data?.rates?.KRW ?? 0),
    }),
  },
];

async function fetchExchangeRates(): Promise<boolean> {
  for (const source of EXCHANGE_RATE_SOURCES) {
    try {
      const res = await fetch(source.url, { headers: { "Accept": "application/json" } });
      if (!res.ok) {
        continue;
      }
      const data: any = await res.json();
      const parsed = source.parser(data);
      if (parsed.inr > 0) {
        inrRate = parsed.inr;
      }
      if (parsed.krw > 0) {
        krwRate = parsed.krw;
      }
      return parsed.inr > 0 || parsed.krw > 0;
    } catch {
      continue;
    }
  }
  console.warn("[TradeX Server] Failed to fetch exchange rates from public sources; using last known rates.");
  return false;
}


async function fetchLivePrices() {
  const now = Date.now();
  if (lastFetchTime > 0 && (now - lastFetchTime) < 10000 && Object.keys(cachedPrices).length > 0) {
    return { ok: true, prices: cachedPrices, inr: inrRate, krw: krwRate };
  }

  // If we are currently back-off rate-limited, immediately serve walked fallbacks/cache to avoid spamming the external API
  if (now < rateLimitUntil) {
    const tempPrices: { [id: string]: any } = { ...cachedPrices };
    ALL_ASSETS.forEach((asset: Asset) => {
      if (!tempPrices[asset.id]) {
        tempPrices[asset.id] = getFallbackPrice(asset.id);
      } else {
        const pr = tempPrices[asset.id];
        const jitter = 1 + (Math.random() - 0.5) * 0.0015;
        pr.p = parseFloat((pr.p * jitter).toFixed(4));
        pr.c = parseFloat((pr.c + (Math.random() - 0.5) * 0.015).toFixed(3));
      }
    });
    cachedPrices = tempPrices;
    lastFetchTime = now;
    const cryptoLive1 = await overlayCoinGeckoCrypto(cachedPrices);
    const nasdaqLive1 = await overlayNasdaqStocks(cachedPrices);
    const stocksLive1 = await overlayFinnhubStocks(cachedPrices);
    return { ok: true, prices: cachedPrices, inr: inrRate, krw: krwRate, isFallback: !(cryptoLive1 || nasdaqLive1 || stocksLive1) };
  }

  try {
    const tempPrices: { [id: string]: any } = { ...cachedPrices };
    const cryptoLive1 = await overlayCoinGeckoCrypto(tempPrices);
    const nasdaqLive1 = await overlayNasdaqStocks(tempPrices);
    const stocksLive1 = await overlayFinnhubStocks(tempPrices);
    await fetchExchangeRates();
    const anyLiveSource = cryptoLive1 || nasdaqLive1 || stocksLive1;

    ALL_ASSETS.forEach((asset: Asset) => {
      if (!tempPrices[asset.id]) {
        tempPrices[asset.id] = getFallbackPrice(asset.id);
      }
    });

    if (Object.keys(tempPrices).length > 0) {
      cachedPrices = tempPrices;
      lastFetchTime = now;
    }

    return { ok: true, prices: cachedPrices, inr: inrRate, krw: krwRate, isFallback: !anyLiveSource };
  } catch (error: any) {
    const isRateLimited = error.message.includes("429") || Date.now() < rateLimitUntil;
    if (isRateLimited) {
      console.warn("[TradeX Server] Live quote fetch fallback active. Serving high-fidelity local simulator data.");
    } else {
      console.warn("[TradeX Server] Failed to fetch live prices (using cache/fallbacks):", error.message);
    }
    
    const tempPrices: { [id: string]: any } = { ...cachedPrices };
    ALL_ASSETS.forEach((asset: Asset) => {
      if (!tempPrices[asset.id]) {
        tempPrices[asset.id] = getFallbackPrice(asset.id);
      } else {
        // Apply slight real-time walk to existing cache values
        const pr = tempPrices[asset.id];
        const jitter = 1 + (Math.random() - 0.5) * 0.0015;
        pr.p = parseFloat((pr.p * jitter).toFixed(4));
        pr.c = parseFloat((pr.c + (Math.random() - 0.5) * 0.015).toFixed(3));
      }
    });
    cachedPrices = tempPrices;
    lastFetchTime = now;

    const cryptoLive2 = await overlayCoinGeckoCrypto(cachedPrices);
    const nasdaqLive2 = await overlayNasdaqStocks(cachedPrices);
    const stocksLive2 = await overlayFinnhubStocks(cachedPrices);
    return { ok: true, prices: cachedPrices, inr: inrRate, krw: krwRate, isFallback: !(cryptoLive2 || nasdaqLive2 || stocksLive2) };
  }
}

function AssetIdIsNse(id: string): boolean {
  return NSE_IDS.has(id);
}

app.get("/api/prices", async (req, res) => {
  const data = await fetchLivePrices();
  res.json(data);
});

app.get("/api/chart-history/:id", async (req, res) => {
  const id = req.params.id;
  const tf = (req.query.tf as string) || "1D";

  const yfSym = YF_MAP[id];
  if (!yfSym) {
    return res.status(404).json({ error: "Asset not found" });
  }

  // If rate limit is active, directly bypass fetch to avoid further requests
  if (Date.now() < rateLimitUntil) {
    const historyPoints = generateMockHistory(id, tf);
    return res.json({ ok: true, id, tf, prices: historyPoints, isFallback: true });
  }

  try {
    const historyPoints = await fetchTwelveDataChart(yfSym, tf);
    await fetchLivePrices();
    res.json({ ok: true, id, tf, prices: historyPoints });
  } catch (error: any) {
    const isRateLimited = error.message.includes("429") || Date.now() < rateLimitUntil;
    if (isRateLimited) {
      console.warn(`[TradeX Server] Live chart fetch fallback active. serving simulated history for ${id}.`);
    } else {
      console.warn(`[TradeX Server] Failed to fetch chart history for ${id} (using realistic fallback):`, error.message);
    }
    const historyPoints = generateMockHistory(id, tf);
    res.json({ ok: true, id, tf, prices: historyPoints, isFallback: true });
  }
});

function selectTwelveDataInterval(tf: string): string {
  switch (tf) {
    case "1D":
      return "5min";
    case "1W":
      return "30min";
    case "1M":
      return "1day";
    case "3M":
      return "1day";
    case "1Y":
      return "1week";
    default:
      return "1day";
  }
}

function selectTwelveDataOutputSize(tf: string): number {
  switch (tf) {
    case "1D":
      return 200;
    case "1W":
      return 250;
    case "1M":
      return 120;
    case "3M":
      return 120;
    case "1Y":
      return 100;
    default:
      return 120;
  }
}

async function fetchTwelveDataChart(symbol: string, tf: string): Promise<any[]> {
  const apiKey = process.env.TWELVEDATA_API_KEY || "demo";
  const interval = selectTwelveDataInterval(tf);
  const outputsize = selectTwelveDataOutputSize(tf);
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&format=JSON&apikey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) {
    throw new Error(`TwelveData chart returned status ${res.status}`);
  }
  const data: any = await res.json();
  if (data.status === "error" || !Array.isArray(data.values) || data.values.length === 0) {
    throw new Error(data.message || "TwelveData returned no chart values");
  }

  const values = [...data.values].reverse();
  return values.map((value: any) => ({
    time: Date.parse(value.datetime),
    o: parseFloat(value.open),
    h: parseFloat(value.high),
    l: parseFloat(value.low),
    c: parseFloat(value.close),
    v: Number(value.volume ?? 0)
  }));
}

async function startServer() {
  const finalPort = await findAvailablePort(PORT);
  let hmrPort = await findAvailablePort(HMR_BASE_PORT);

  if (finalPort !== PORT) {
    console.warn(`[TradeX] Port ${PORT} is busy. Using fallback HTTP port ${finalPort}.`);
  }
  if (hmrPort !== HMR_BASE_PORT) {
    console.warn(`[TradeX] HMR port ${HMR_BASE_PORT} is busy. Using fallback HMR port ${hmrPort}.`);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          host: "127.0.0.1",
          protocol: "ws",
          port: hmrPort,
          clientPort: hmrPort,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(finalPort, "0.0.0.0", () => {
    console.log(`[TradeX] Full-stack Node server running on http://localhost:${finalPort}`);
  });
}

fetchLivePrices().catch(err => {
  console.error("[TradeX Server] Failed to seed price cache:", err.message);
});

startServer();
