export interface Asset {
  id: string;
  name: string;
  sym: string;
  col: string;
  bg: string;
  sector?: string;
  region: string;
  exch: string;
  price?: number;
  chg?: number;
}

export interface PriceData {
  p: number;      // price in USD (converted)
  c: number;      // 24h change percent
  hi: number;     // 24h high
  lo: number;     // 24h low
  mc: number;     // market cap
  open: number;   // previous close / open
}

export interface CachedPrices {
  [id: string]: PriceData;
}

export interface Holding {
  qty: number;
  avgBuy: number;
}

export interface Holdings {
  [id: string]: Holding;
}

export interface Order {
  id: string;
  name: string;
  sym: string;
  type: 'buy' | 'sell';
  price: number;
  qty: number;
  total: number;
  time: number;
  orderType: 'market' | 'limit' | 'sl' | 'tp';
  limitPrice?: number;
}

export interface PendingOrder {
  id: string;
  name: string;
  sym: string;
  orderType: 'limit' | 'sl' | 'tp';
  limitPrice: number;
  usd: number;
  qty: number;
  mode: 'buy' | 'sell';
  time: number;
}

export interface PriceAlert {
  id: string;
  dir: 'above' | 'below';
  price: number;
  active: boolean;
  created: number;
}

export interface UserSession {
  username: string;
  name: string;
  joined: string;
  pwHash: string;
}

export interface PortfolioState {
  ccash: number;       // Crypto Wallet Cash (USD)
  scash: number;       // Stock Wallet Cash (USD)
  h: Holdings;         // Holdings dictionary
  orders: Order[];     // Historical orders
  budget: number;      // Spending limit
  inv?: number;        // Cumulative investment
  realisedPnl: number; // Realised profit/loss
  alerts?: PriceAlert[]; // Price alerts list
}

export interface OHLCPoint {
  time: number; // timestamp in ms
  o: number;    // open
  h: number;    // high
  l: number;    // low
  c: number;    // close
  v: number;    // volume
}

// Custom drawing shapes for TradeX Chart
export interface ChartDrawing {
  type: 'pointer' | 'crosshair' | 'trendline' | 'hline' | 'vline' | 'ray' | 'rect' | 'fib' | 'text' | 'measure' | 'eraser';
  points: { idx: number; price: number }[];
  color: string;
  text?: string;
  end?: { px: number; py: number; idx: number; price: number } | null;
}

// Asset meta definition
export const CRYPTOS: Asset[] = [
  { id: 'bitcoin', name: 'Bitcoin', sym: 'BTC', col: '#f7931a', bg: 'rgba(247,147,26,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'ethereum', name: 'Ethereum', sym: 'ETH', col: '#627eea', bg: 'rgba(98,126,234,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'binancecoin', name: 'BNB', sym: 'BNB', col: '#f3ba2f', bg: 'rgba(243,186,47,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'solana', name: 'Solana', sym: 'SOL', col: '#9945ff', bg: 'rgba(153,69,255,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'ripple', name: 'XRP', sym: 'XRP', col: '#00aae4', bg: 'rgba(0,170,228,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'cardano', name: 'Cardano', sym: 'ADA', col: '#0d9bd6', bg: 'rgba(13,155,214,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'dogecoin', name: 'Dogecoin', sym: 'DOGE', col: '#c2a633', bg: 'rgba(194,166,51,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'avalanche-2', name: 'Avalanche', sym: 'AVAX', col: '#e84142', bg: 'rgba(232,65,66,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'chainlink', name: 'Chainlink', sym: 'LINK', col: '#2a5ada', bg: 'rgba(42,90,218,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'near', name: 'NEAR Protocol', sym: 'NEAR', col: '#00c1de', bg: 'rgba(0,193,222,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'polkadot', name: 'Polkadot', sym: 'DOT', col: '#e6007a', bg: 'rgba(230,0,122,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'uniswap', name: 'Uniswap', sym: 'UNI', col: '#ff007a', bg: 'rgba(255,0,122,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'litecoin', name: 'Litecoin', sym: 'LTC', col: '#bfbbbb', bg: 'rgba(191,187,187,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'tron', name: 'TRON', sym: 'TRX', col: '#ff0013', bg: 'rgba(255,0,19,.12)', region: 'Global', exch: 'Crypto' },
  { id: 'stellar', name: 'Stellar', sym: 'XLM', col: '#08b5e5', bg: 'rgba(8,181,229,.12)', region: 'Global', exch: 'Crypto' }
];

export const STOCKS: Asset[] = [
  // US Tech
  { id: 'aapl', name: 'Apple Inc.', sym: 'AAPL', col: '#a8b2c1', bg: 'rgba(168,178,193,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'msft', name: 'Microsoft Corp.', sym: 'MSFT', col: '#00a4ef', bg: 'rgba(0,164,239,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'nvda', name: 'NVIDIA Corp.', sym: 'NVDA', col: '#76b900', bg: 'rgba(118,185,0,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'googl', name: 'Alphabet Inc.', sym: 'GOOGL', col: '#4285f4', bg: 'rgba(66,133,244,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'meta', name: 'Meta Platforms', sym: 'META', col: '#0082fb', bg: 'rgba(0,130,251,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'tsla', name: 'Tesla Inc.', sym: 'TSLA', col: '#cc0000', bg: 'rgba(204,0,0,.12)', sector: 'Auto', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'amzn', name: 'Amazon.com Inc.', sym: 'AMZN', col: '#ff9900', bg: 'rgba(255,153,0,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'nflx', name: 'Netflix Inc.', sym: 'NFLX', col: '#e50914', bg: 'rgba(229,9,20,.12)', sector: 'Media', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'amd', name: 'Advanced Micro Devices', sym: 'AMD', col: '#ed1c24', bg: 'rgba(237,28,36,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'intc', name: 'Intel Corp.', sym: 'INTC', col: '#0071c5', bg: 'rgba(0,113,197,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  // Finance & Retail
  { id: 'jpm', name: 'JPMorgan Chase', sym: 'JPM', col: '#005eb8', bg: 'rgba(0,94,184,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NYSE' },
  { id: 'bac', name: 'Bank of America', sym: 'BAC', col: '#dc1431', bg: 'rgba(220,20,49,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NYSE' },
  { id: 'gs', name: 'Goldman Sachs', sym: 'GS', col: '#6699cc', bg: 'rgba(102,153,204,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NYSE' },
  { id: 'v', name: 'Visa Inc.', sym: 'V', col: '#1a1f71', bg: 'rgba(26,31,113,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NYSE' },
  { id: 'ma', name: 'Mastercard Inc.', sym: 'MA', col: '#eb001b', bg: 'rgba(235,0,27,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NYSE' },
  { id: 'jnj', name: 'Johnson & Johnson', sym: 'JNJ', col: '#d51900', bg: 'rgba(213,25,0,.12)', sector: 'Health', region: '🇺🇸', exch: 'NYSE' },
  { id: 'pfe', name: 'Pfizer Inc.', sym: 'PFE', col: '#0093d0', bg: 'rgba(0,147,208,.12)', sector: 'Health', region: '🇺🇸', exch: 'NYSE' },
  { id: 'xom', name: 'Exxon Mobil Corp.', sym: 'XOM', col: '#ff0000', bg: 'rgba(180,0,0,.12)', sector: 'Energy', region: '🇺🇸', exch: 'NYSE' },
  { id: 'wmt', name: 'Walmart Inc.', sym: 'WMT', col: '#0071ce', bg: 'rgba(0,113,206,.12)', sector: 'Retail', region: '🇺🇸', exch: 'NYSE' },
  { id: 'ko', name: 'Coca-Cola Co.', sym: 'KO', col: '#f40000', bg: 'rgba(244,0,0,.12)', sector: 'FMCG', region: '🇺🇸', exch: 'NYSE' },
  // More US Tech/Services
  { id: 'orcl', name: 'Oracle Corp.', sym: 'ORCL', col: '#f80000', bg: 'rgba(248,0,0,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NYSE' },
  { id: 'crm', name: 'Salesforce Inc.', sym: 'CRM', col: '#009edb', bg: 'rgba(0,158,219,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NYSE' },
  { id: 'adbe', name: 'Adobe Inc.', sym: 'ADBE', col: '#ff0000', bg: 'rgba(255,0,0,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'qcom', name: 'Qualcomm Inc.', sym: 'QCOM', col: '#3253dc', bg: 'rgba(50,83,220,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'avgo', name: 'Broadcom Inc.', sym: 'AVGO', col: '#cc0000', bg: 'rgba(204,0,0,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'mu', name: 'Micron Technology', sym: 'MU', col: '#00a0dc', bg: 'rgba(0,160,220,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'uber', name: 'Uber Technologies', sym: 'UBER', col: '#222222', bg: 'rgba(80,80,80,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NYSE' },
  { id: 'pypl', name: 'PayPal Holdings', sym: 'PYPL', col: '#003087', bg: 'rgba(0,48,135,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'dis', name: 'Walt Disney Co.', sym: 'DIS', col: '#006e99', bg: 'rgba(0,110,153,.12)', sector: 'Media', region: '🇺🇸', exch: 'NYSE' },
  { id: 'ba', name: 'Boeing Co.', sym: 'BA', col: '#1d428a', bg: 'rgba(29,66,138,.12)', sector: 'Aerospace', region: '🇺🇸', exch: 'NYSE' },
  { id: 'cat', name: 'Caterpillar Inc.', sym: 'CAT', col: '#ffcd11', bg: 'rgba(255,205,17,.12)', sector: 'Industrial', region: '🇺🇸', exch: 'NYSE' },
  { id: 'mcd', name: 'McDonald\'s Corp.', sym: 'MCD', col: '#ffbc0d', bg: 'rgba(255,188,13,.12)', sector: 'FMCG', region: '🇺🇸', exch: 'NYSE' },
  { id: 'nke', name: 'Nike Inc.', sym: 'NKE', col: '#111111', bg: 'rgba(80,80,80,.12)', sector: 'Retail', region: '🇺🇸', exch: 'NYSE' },
  { id: 'cvx', name: 'Chevron Corp.', sym: 'CVX', col: '#0072ce', bg: 'rgba(0,114,206,.12)', sector: 'Energy', region: '🇺🇸', exch: 'NYSE' },
  { id: 'abbv', name: 'AbbVie Inc.', sym: 'ABBV', col: '#071d49', bg: 'rgba(7,29,73,.12)', sector: 'Health', region: '🇺🇸', exch: 'NYSE' },
  { id: 'mrk', name: 'Merck & Co.', sym: 'MRK', col: '#00857c', bg: 'rgba(0,133,124,.12)', sector: 'Health', region: '🇺🇸', exch: 'NYSE' },
  { id: 'amgn', name: 'Amgen Inc.', sym: 'AMGN', col: '#002a5c', bg: 'rgba(0,42,92,.12)', sector: 'Health', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'cost', name: 'Costco Wholesale', sym: 'COST', col: '#005daa', bg: 'rgba(0,93,170,.12)', sector: 'Retail', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'spy', name: 'S&P 500 ETF', sym: 'SPY', col: '#c41230', bg: 'rgba(196,18,48,.12)', sector: 'ETF', region: '🇺🇸', exch: 'NYSE' },
  // Indian stocks
  { id: 'reliance', name: 'Reliance Industries', sym: 'RELIANCE', col: '#1a6bc4', bg: 'rgba(26,107,196,.12)', sector: 'Energy', region: '🇮🇳', exch: 'NSE' },
  { id: 'tcs', name: 'Tata Consultancy', sym: 'TCS', col: '#c1272d', bg: 'rgba(193,39,45,.12)', sector: 'Tech', region: '🇮🇳', exch: 'NSE' },
  { id: 'infy', name: 'Infosys Ltd.', sym: 'INFY', col: '#007dc5', bg: 'rgba(0,125,197,.12)', sector: 'Tech', region: '🇮🇳', exch: 'NSE' },
  { id: 'hdfcbank', name: 'HDFC Bank Ltd.', sym: 'HDFCBANK', col: '#004c8f', bg: 'rgba(0,76,143,.12)', sector: 'Finance', region: '🇮🇳', exch: 'NSE' },
  { id: 'icicibank', name: 'ICICI Bank Ltd.', sym: 'ICICIBANK', col: '#f7941d', bg: 'rgba(247,148,29,.12)', sector: 'Finance', region: '🇮🇳', exch: 'NSE' },
  { id: 'sbi', name: 'State Bank of India', sym: 'SBIN', col: '#1e4db7', bg: 'rgba(30,77,183,.12)', sector: 'Finance', region: '🇮🇳', exch: 'NSE' },
  { id: 'wipro', name: 'Wipro Ltd.', sym: 'WIPRO', col: '#0d5eb4', bg: 'rgba(13,94,180,.12)', sector: 'Tech', region: '🇮🇳', exch: 'NSE' },
  { id: 'tatamotors', name: 'Tata Motors Ltd.', sym: 'TATAMOTORS', col: '#2c6faf', bg: 'rgba(44,111,175,.12)', sector: 'Auto', region: '🇮🇳', exch: 'NSE' },
  { id: 'bajfinance', name: 'Bajaj Finance', sym: 'BAJFINANCE', col: '#003399', bg: 'rgba(0,51,153,.12)', sector: 'Finance', region: '🇮🇳', exch: 'NSE' },
  { id: 'hcltech', name: 'HCL Technologies', sym: 'HCLTECH', col: '#0076be', bg: 'rgba(0,118,190,.12)', sector: 'Tech', region: '🇮🇳', exch: 'NSE' },
  { id: 'axisbank', name: 'Axis Bank Ltd.', sym: 'AXISBANK', col: '#97144d', bg: 'rgba(151,20,77,.12)', sector: 'Finance', region: '🇮🇳', exch: 'NSE' },
  { id: 'kotakbank', name: 'Kotak Mahindra Bank', sym: 'KOTAKBANK', col: '#ed1c24', bg: 'rgba(237,28,36,.12)', sector: 'Finance', region: '🇮🇳', exch: 'NSE' },
  { id: 'lt', name: 'Larsen & Toubro', sym: 'LT', col: '#004990', bg: 'rgba(0,73,144,.12)', sector: 'Industrial', region: '🇮🇳', exch: 'NSE' },
  { id: 'maruti', name: 'Maruti Suzuki Ltd.', sym: 'MARUTI', col: '#003087', bg: 'rgba(0,48,135,.12)', sector: 'Auto', region: '🇮🇳', exch: 'NSE' },
  { id: 'sunpharma', name: 'Sun Pharma Industries', sym: 'SUNPHARMA', col: '#f47920', bg: 'rgba(244,121,32,.12)', sector: 'Health', region: '🇮🇳', exch: 'NSE' },
  { id: 'titan', name: 'Titan Company Ltd.', sym: 'TITAN', col: '#003087', bg: 'rgba(0,48,135,.12)', sector: 'Retail', region: '🇮🇳', exch: 'NSE' },
  { id: 'asianpaint', name: 'Asian Paints Ltd.', sym: 'ASIANPAINT', col: '#ef3e23', bg: 'rgba(239,62,35,.12)', sector: 'FMCG', region: '🇮🇳', exch: 'NSE' },
  { id: 'ultracemco', name: 'UltraTech Cement', sym: 'ULTRACEMCO', col: '#005baa', bg: 'rgba(0,91,170,.12)', sector: 'Industrial', region: '🇮🇳', exch: 'NSE' },
  { id: 'adaniports', name: 'Adani Ports & SEZ', sym: 'ADANIPORTS', col: '#002d62', bg: 'rgba(0,45,98,.12)', sector: 'Industrial', region: '🇮🇳', exch: 'NSE' },
  { id: 'ntpc', name: 'NTPC Ltd.', sym: 'NTPC', col: '#006838', bg: 'rgba(0,104,56,.12)', sector: 'Energy', region: '🇮🇳', exch: 'NSE' },
  { id: 'ongc', name: 'ONGC Ltd.', sym: 'ONGC', col: '#006b3c', bg: 'rgba(0,107,60,.12)', sector: 'Energy', region: '🇮🇳', exch: 'NSE' },
  { id: 'powergrid', name: 'Power Grid Corp.', sym: 'POWERGRID', col: '#003087', bg: 'rgba(0,48,135,.12)', sector: 'Energy', region: '🇮🇳', exch: 'NSE' },
  { id: 'nestleindia', name: 'Nestle India Ltd.', sym: 'NESTLEIND', col: '#e2001a', bg: 'rgba(226,0,26,.12)', sector: 'FMCG', region: '🇮🇳', exch: 'NSE' },
  // International Global Stocks
  { id: 'tsm', name: 'Taiwan Semiconductor', sym: 'TSM', col: '#00b4d8', bg: 'rgba(0,180,216,.12)', sector: 'Tech', region: '🇹🇼', exch: 'NYSE' },
  { id: 'baba', name: 'Alibaba Group', sym: 'BABA', col: '#ff6600', bg: 'rgba(255,102,0,.12)', sector: 'Tech', region: '🇨🇳', exch: 'NYSE' },
  { id: 'toyota', name: 'Toyota Motor', sym: 'TM', col: '#eb0a1e', bg: 'rgba(235,10,30,.12)', sector: 'Auto', region: '🇯🇵', exch: 'NYSE' },
  { id: 'hsba', name: 'HSBC Holdings', sym: 'HSBC', col: '#db0011', bg: 'rgba(219,0,17,.12)', sector: 'Finance', region: '🇬🇧', exch: 'NYSE' },
  { id: 'shel', name: 'Shell Plc', sym: 'SHEL', col: '#dd1d21', bg: 'rgba(221,29,33,.12)', sector: 'Energy', region: '🇬🇧', exch: 'NYSE' },
  { id: 'ulvr', name: 'Unilever Plc', sym: 'UL', col: '#1f36c7', bg: 'rgba(31,54,199,.12)', sector: 'FMCG', region: '🇬🇧', exch: 'NYSE' },
  { id: 'sap', name: 'SAP SE', sym: 'SAP', col: '#0070f2', bg: 'rgba(0,112,242,.12)', sector: 'Tech', region: '🇩🇪', exch: 'NYSE' },
  { id: 'asml', name: 'ASML Holding', sym: 'ASML', col: '#0097d8', bg: 'rgba(0,151,216,.12)', sector: 'Tech', region: '🇳🇱', exch: 'NASDAQ' },
  { id: 'lvmh', name: 'LVMH Moët Hennessy', sym: 'LVMUY', col: '#b8a06a', bg: 'rgba(184,160,106,.12)', sector: 'Retail', region: '🇫🇷', exch: 'OTC' },
  { id: 'siegy', name: 'Siemens AG', sym: 'SIEGY', col: '#009999', bg: 'rgba(0,153,153,.12)', sector: 'Industrial', region: '🇩🇪', exch: 'OTC' },
  { id: 'samsung', name: 'Samsung Electronics', sym: 'SSNLF', col: '#1428a0', bg: 'rgba(20,40,160,.12)', sector: 'Tech', region: '🇰🇷', exch: 'KRX' },
  { id: 'sony', name: 'Sony Group Corp.', sym: 'SONY', col: '#000000', bg: 'rgba(60,60,60,.12)', sector: 'Tech', region: '🇯🇵', exch: 'NYSE' },
  { id: 'bidu', name: 'Baidu Inc.', sym: 'BIDU', col: '#2932e1', bg: 'rgba(41,50,225,.12)', sector: 'Tech', region: '🇨🇳', exch: 'NASDAQ' },
  { id: 'jd', name: 'JD.com Inc.', sym: 'JD', col: '#e2231a', bg: 'rgba(226,35,26,.12)', sector: 'Tech', region: '🇨🇳', exch: 'NASDAQ' },
  { id: 'se', name: 'Sea Limited', sym: 'SE', col: '#ee4d2d', bg: 'rgba(238,77,45,.12)', sector: 'Tech', region: '🇸🇬', exch: 'NYSE' },
  { id: 'grab', name: 'Grab Holdings', sym: 'GRAB', col: '#00b14f', bg: 'rgba(0,177,79,.12)', sector: 'Tech', region: '🇸🇬', exch: 'NASDAQ' },
  { id: 'rio', name: 'Rio Tinto Group', sym: 'RIO', col: '#e2001a', bg: 'rgba(226,0,26,.12)', sector: 'Energy', region: '🇦🇺', exch: 'NYSE' },
  { id: 'bhp', name: 'BHP Group Ltd.', sym: 'BHP', col: '#ef3340', bg: 'rgba(239,51,64,.12)', sector: 'Energy', region: '🇦🇺', exch: 'NYSE' },
  { id: 'amat', name: 'Applied Materials', sym: 'AMAT', col: '#00a0df', bg: 'rgba(0,160,223,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'lmt', name: 'Lockheed Martin', sym: 'LMT', col: '#0033a0', bg: 'rgba(0,51,160,.12)', sector: 'Aerospace', region: '🇺🇸', exch: 'NYSE' },
  { id: 'sbux', name: 'Starbucks Corp.', sym: 'SBUX', col: '#00704a', bg: 'rgba(0,112,74,.12)', sector: 'FMCG', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'brkb', name: 'Berkshire Hathaway', sym: 'BRK.B', col: '#6b3a2a', bg: 'rgba(107,58,42,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NYSE' },
  { id: 'crwd', name: 'CrowdStrike Holdings', sym: 'CRWD', col: '#e4281c', bg: 'rgba(228,40,28,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'snow', name: 'Snowflake Inc.', sym: 'SNOW', col: '#29b5e8', bg: 'rgba(41,181,232,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NYSE' },
  { id: 'pltr', name: 'Palantir Technologies', sym: 'PLTR', col: '#111111', bg: 'rgba(60,60,60,.12)', sector: 'Tech', region: '🇺🇸', exch: 'NYSE' },
  { id: 'hood', name: 'Robinhood Markets', sym: 'HOOD', col: '#00c805', bg: 'rgba(0,200,5,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'coin', name: 'Coinbase Global', sym: 'COIN', col: '#0052ff', bg: 'rgba(0,82,255,.12)', sector: 'Finance', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'rivn', name: 'Rivian Automotive', sym: 'RIVN', col: '#59d4c8', bg: 'rgba(89,212,200,.12)', sector: 'Auto', region: '🇺🇸', exch: 'NASDAQ' },
  { id: 'drreddy', name: 'Dr. Reddy\'s Labs', sym: 'DRREDDY', col: '#e2001a', bg: 'rgba(226,0,26,.12)', sector: 'Health', region: '🇮🇳', exch: 'NSE' },
  { id: 'divislab', name: 'Divi\'s Laboratories', sym: 'DIVISLAB', col: '#003087', bg: 'rgba(0,48,135,.12)', sector: 'Health', region: '🇮🇳', exch: 'NSE' },
  { id: 'hindunilvr', name: 'Hindustan Unilever', sym: 'HINDUNILVR', col: '#003087', bg: 'rgba(0,48,135,.12)', sector: 'FMCG', region: '🇮🇳', exch: 'NSE' },
  { id: 'bajajfinsv', name: 'Bajaj Finserv Ltd.', sym: 'BAJAJFINSV', col: '#003399', bg: 'rgba(0,51,153,.12)', sector: 'Finance', region: '🇮🇳', exch: 'NSE' },
  { id: 'techm', name: 'Tech Mahindra Ltd.', sym: 'TECHM', col: '#c8202e', bg: 'rgba(200,32,46,.12)', sector: 'Tech', region: '🇮🇳', exch: 'NSE' },
  { id: 'nvo', name: 'Novo Nordisk A/S', sym: 'NVO', col: '#004494', bg: 'rgba(0,68,148,.12)', sector: 'Health', region: '🇩🇰', exch: 'NYSE' },
  { id: 'arm', name: 'ARM Holdings Plc', sym: 'ARM', col: '#0091bd', bg: 'rgba(0,145,189,.12)', sector: 'Tech', region: '🇬🇧', exch: 'NASDAQ' },
  { id: 'shop', name: 'Shopify Inc.', sym: 'SHOP', col: '#96bf48', bg: 'rgba(150,191,72,.12)', sector: 'Tech', region: '🇨🇦', exch: 'NYSE' }
];

export const ALL_ASSETS: Asset[] = [...CRYPTOS, ...STOCKS];

export const ASSET_MAP: { [id: string]: Asset } = {};
ALL_ASSETS.forEach(a => {
  ASSET_MAP[a.id] = a;
});

// Yahoo Finance Symbol mappings
export const YF_MAP: { [id: string]: string } = {
  bitcoin: 'BTC-USD',
  ethereum: 'ETH-USD',
  binancecoin: 'BNB-USD',
  solana: 'SOL-USD',
  ripple: 'XRP-USD',
  cardano: 'ADA-USD',
  dogecoin: 'DOGE-USD',
  'avalanche-2': 'AVAX-USD',
  chainlink: 'LINK-USD',
  near: 'NEAR-USD',
  polkadot: 'DOT-USD',
  uniswap: 'UNI-USD',
  litecoin: 'LTC-USD',
  tron: 'TRX-USD',
  stellar: 'XLM-USD',
  // Stocks
  aapl: 'AAPL', msft: 'MSFT', nvda: 'NVDA', googl: 'GOOGL', meta: 'META',
  tsla: 'TSLA', amzn: 'AMZN', nflx: 'NFLX', amd: 'AMD', intc: 'INTC',
  jpm: 'JPM', bac: 'BAC', gs: 'GS', v: 'V', ma: 'MA', jnj: 'JNJ',
  pfe: 'PFE', xom: 'XOM', wmt: 'WMT', ko: 'KO',
  orcl: 'ORCL', crm: 'CRM', adbe: 'ADBE', qcom: 'QCOM', avgo: 'AVGO',
  mu: 'MU', uber: 'UBER', pypl: 'PYPL', dis: 'DIS', ba: 'BA',
  cat: 'CAT', mcd: 'MCD', nke: 'NKE', cvx: 'CVX', abbv: 'ABBV',
  mrk: 'MRK', amgn: 'AMGN', cost: 'COST', spy: 'SPY',
  tsm: 'TSM', baba: 'BABA', toyota: 'TM',
  hsba: 'HSBC', shel: 'SHEL', ulvr: 'UL',
  sap: 'SAP', asml: 'ASML', lvmh: 'LVMUY', siegy: 'SIEGY',
  samsung: 'SSNLF', sony: 'SONY', bidu: 'BIDU', jd: 'JD',
  se: 'SE', grab: 'GRAB', rio: 'RIO', bhp: 'BHP',
  amat: 'AMAT', lmt: 'LMT', sbux: 'SBUX', brkb: 'BRK-B',
  crwd: 'CRWD', snow: 'SNOW', pltr: 'PLTR', hood: 'HOOD',
  coin: 'COIN', rivn: 'RIVN', nvo: 'NVO', arm: 'ARM', shop: 'SHOP',
  // NSE
  drreddy: 'DRREDDY.NS', divislab: 'DIVISLAB.NS', hindunilvr: 'HINDUNILVR.NS',
  bajajfinsv: 'BAJAJFINSV.NS', techm: 'TECHM.NS', reliance: 'RELIANCE.NS',
  tcs: 'TCS.NS', infy: 'INFY.NS', hdfcbank: 'HDFCBANK.NS',
  icicibank: 'ICICIBANK.NS', sbi: 'SBIN.NS', wipro: 'WIPRO.NS',
  tatamotors: 'TATAMOTORS.BO', bajfinance: 'BAJFINANCE.NS',
  hcltech: 'HCLTECH.NS', axisbank: 'AXISBANK.NS', kotakbank: 'KOTAKBANK.NS',
  lt: 'LT.NS', maruti: 'MARUTI.NS', sunpharma: 'SUNPHARMA.NS',
  titan: 'TITAN.NS', asianpaint: 'ASIANPAINT.NS', ultracemco: 'ULTRACEMCO.NS',
  adaniports: 'ADANIPORTS.NS', ntpc: 'NTPC.NS', ongc: 'ONGC.NS',
  powergrid: 'POWERGRID.NS', nestleindia: 'NESTLEIND.NS'
};

export const NSE_IDS = new Set([
  'reliance', 'tcs', 'infy', 'hdfcbank', 'icicibank', 'sbi', 'wipro', 'tatamotors',
  'bajfinance', 'hcltech', 'axisbank', 'kotakbank', 'lt', 'maruti', 'sunpharma',
  'titan', 'asianpaint', 'ultracemco', 'adaniports', 'ntpc', 'ongc', 'powergrid', 'nestleindia',
  'drreddy', 'divislab', 'hindunilvr', 'bajajfinsv', 'techm'
]);
