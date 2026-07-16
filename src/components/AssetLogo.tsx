import React, { useState } from "react";
import { Asset } from "../types";

interface AssetLogoProps {
  asset: Asset;
  className?: string;
}

const STOCK_DOMAINS: { [id: string]: string } = {
  aapl: 'apple.com',
  msft: 'microsoft.com',
  nvda: 'nvidia.com',
  googl: 'google.com',
  meta: 'meta.com',
  tsla: 'tesla.com',
  amzn: 'amazon.com',
  nflx: 'netflix.com',
  amd: 'amd.com',
  intc: 'intel.com',
  jpm: 'jpmorganchase.com',
  bac: 'bankofamerica.com',
  gs: 'goldmansachs.com',
  v: 'visa.com',
  ma: 'mastercard.com',
  jnj: 'jnj.com',
  pfe: 'pfizer.com',
  xom: 'exxonmobil.com',
  wmt: 'walmart.com',
  ko: 'cocacola.com',
  orcl: 'oracle.com',
  crm: 'salesforce.com',
  adbe: 'adobe.com',
  qcom: 'qualcomm.com',
  avgo: 'broadcom.com',
  mu: 'micron.com',
  uber: 'uber.com',
  pypl: 'paypal.com',
  dis: 'disney.com',
  ba: 'boeing.com',
  cat: 'caterpillar.com',
  mcd: 'mcdonalds.com',
  nke: 'nike.com',
  cvx: 'chevron.com',
  abbv: 'abbvie.com',
  mrk: 'merck.com',
  amgn: 'amgen.com',
  cost: 'costco.com',
  spy: 'ssga.com',
  reliance: 'ril.com',
  tcs: 'tcs.com',
  infy: 'infosys.com',
  hdfcbank: 'hdfcbank.com',
  icicibank: 'icicibank.com',
  sbi: 'sbi.co.in',
  wipro: 'wipro.com',
  tatamotors: 'tatamotors.com',
  bajfinance: 'bajajfinserv.in',
  hcltech: 'hcltech.com',
  axisbank: 'axisbank.com',
  kotakbank: 'kotak.com',
  lt: 'larsentoubro.com',
  maruti: 'marutisuzuki.com',
  sunpharma: 'sunpharma.com',
  titan: 'titan.co.in',
  asianpaint: 'asianpaints.com',
  ultracemco: 'ultratechcement.com',
  adaniports: 'adaniports.com',
  ntpc: 'ntpc.co.in',
  ongc: 'ongcindia.com',
  powergrid: 'powergrid.in',
  nestleindia: 'nestle.in',
  tsm: 'tsmc.com',
  baba: 'alibabagroup.com',
  toyota: 'toyota.com',
  hsba: 'hsbc.com',
  shel: 'shell.com',
  ulvr: 'unilever.com',
  sap: 'sap.com',
  asml: 'asml.com',
  lvmh: 'lvmh.com',
  siegy: 'siemens.com',
  samsung: 'samsung.com',
  sony: 'sony.com',
  bidu: 'baidu.com',
  jd: 'jd.com',
  se: 'sea.com',
  grab: 'grab.com',
  rio: 'riotinto.com',
  bhp: 'bhp.com',
  amat: 'appliedmaterials.com',
  lmt: 'lockheedmartin.com',
  sbux: 'starbucks.com',
  brkb: 'berkshirehathaway.com',
  crwd: 'crowdstrike.com',
  snow: 'snowflake.com',
  pltr: 'palantir.com',
  hood: 'robinhood.com',
  coin: 'coinbase.com',
  rivn: 'rivian.com',
  drreddy: 'drreddys.com',
  divislab: 'divislabs.com',
  hindunilvr: 'hul.co.in',
  bajajfinsv: 'bajajfinserv.in',
  techm: 'techmahindra.com',
  nvo: 'novonordisk.com',
  arm: 'arm.com',
  shop: 'shopify.com'
};

const CRYPTO_LOGOS: { [id: string]: string } = {
  bitcoin: 'btc',
  ethereum: 'eth',
  binancecoin: 'bnb',
  solana: 'sol',
  ripple: 'xrp',
  cardano: 'ada',
  dogecoin: 'doge',
  'avalanche-2': 'avax',
  chainlink: 'link',
  near: 'near',
  polkadot: 'dot',
  uniswap: 'uni',
  litecoin: 'ltc',
  tron: 'trx',
  stellar: 'xlm'
};

export default function AssetLogo({ asset, className = "w-8 h-8" }: AssetLogoProps) {
  const [failed, setFailed] = useState(false);

  const isCrypto = asset.exch === "Crypto";
  let logoUrl = "";

  if (!failed) {
    if (isCrypto) {
      const coinSymbol = CRYPTO_LOGOS[asset.id] || asset.sym.toLowerCase();
      logoUrl = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${coinSymbol}.png`;
    } else {
      const domain = STOCK_DOMAINS[asset.id];
      if (domain) {
        logoUrl = `https://logo.clearbit.com/${domain}`;
      } else {
        logoUrl = `https://logo.clearbit.com/${asset.sym.toLowerCase()}.com`;
      }
    }
  }

  if (failed || !logoUrl) {
    return (
      <div
        className={`${className} rounded-full flex items-center justify-center text-[10px] font-extrabold font-mono uppercase tracking-tighter shrink-0 select-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]`}
        style={{ backgroundColor: asset.bg, color: asset.col }}
      >
        {asset.sym.substring(0, 3)}
      </div>
    );
  }

  return (
    <div className={`${className} bg-white/5 rounded-full p-1 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden relative group`}>
      <img
        src={logoUrl}
        alt={asset.name}
        className="w-full h-full object-contain rounded-full transition-all duration-300 group-hover:scale-115"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
