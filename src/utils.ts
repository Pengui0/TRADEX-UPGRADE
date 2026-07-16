export const INR = 83.5;

export function fU(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const absN = Math.abs(n);
  const isNeg = n < 0;
  
  let formatted = "";
  if (absN >= 1e12) {
    formatted = (absN / 1e12).toFixed(2) + "T";
  } else if (absN >= 1e9) {
    formatted = (absN / 1e9).toFixed(2) + "B";
  } else if (absN >= 1e6) {
    formatted = (absN / 1e6).toFixed(2) + "M";
  } else if (absN >= 1000) {
    formatted = absN.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else {
    formatted = absN.toFixed(decimals);
  }
  
  return (isNeg ? "-$" : "$") + formatted;
}

export function fINR(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const r = n * INR;
  const absR = Math.abs(r);
  
  if (absR >= 1e7) {
    return "₹" + (r / 1e7).toFixed(2) + "Cr";
  }
  if (absR >= 1e5) {
    return "₹" + (r / 1e5).toFixed(2) + "L";
  }
  if (absR >= 1000) {
    return "₹" + r.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }
  return "₹" + r.toFixed(2);
}

export function fQ(n: number | null | undefined, isCrypto: boolean): string {
  if (n === null || n === undefined || isNaN(n) || n === 0) return "0";
  if (isCrypto) {
    if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(4);
    return n.toFixed(6);
  }
  return n.toFixed(4).replace(/\.?0+$/, "");
}

export function fP(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "0.00%";
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export function fT(ts: number | string): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

// Simple and safe hash for virtual user sessions (similar to standard djb2)
export function pwHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16) + "_" + str.length;
}
