// Official Crypto Brand Colors
export const cryptoBrandColors = {
  btc: { bg: '#F7931A', text: '#FFFFFF', iconColor: '#F7931A' },
  usdt: { bg: '#26A17B', text: '#FFFFFF', iconColor: '#26A17B' },
  usdc: { bg: '#2775CA', text: '#FFFFFF', iconColor: '#2775CA' },
  eth: { bg: '#627EEA', text: '#FFFFFF', iconColor: '#627EEA' },
  sol: { bg: '#14F195', text: '#000000', iconColor: '#14F195' },
  xrp: { bg: '#23292F', text: '#FFFFFF', iconColor: '#23292F' },
  trx: { bg: '#FF0013', text: '#FFFFFF', iconColor: '#FF0013' },
  bnb: { bg: '#F3BA2F', text: '#000000', iconColor: '#F3BA2F' },
  busd: { bg: '#F0B90B', text: '#000000', iconColor: '#F0B90B' },
  doge: { bg: '#C2A633', text: '#FFFFFF', iconColor: '#C2A633' },
  ada: { bg: '#0033AD', text: '#FFFFFF', iconColor: '#0033AD' },
  ltc: { bg: '#345D9D', text: '#FFFFFF', iconColor: '#345D9D' },
  dot: { bg: '#E6007A', text: '#FFFFFF', iconColor: '#E6007A' },
  avax: { bg: '#E84142', text: '#FFFFFF', iconColor: '#E84142' },
  link: { bg: '#375BD2', text: '#FFFFFF', iconColor: '#375BD2' },
  shib: { bg: '#FFA409', text: '#FFFFFF', iconColor: '#FFA409' },
  matic: { bg: '#8247E5', text: '#FFFFFF', iconColor: '#8247E5' },
};

export function getCryptoSymbol(method) {
  if (!method) return "btc";
  const str = (
    typeof method === 'string'
      ? method
      : method.icon_key ||
        method.coin ||
        method.alias ||
        method.symbol ||
        method.type ||
        method.name ||
        method.currency ||
        ""
  ).toLowerCase().trim();

  if (!str) return "btc";

  if (str.includes("btc") || str.includes("bitcoin")) return "btc";
  if (str.includes("usdt") || str.includes("tether")) return "usdt";
  if (str.includes("usdc")) return "usdc";
  if (str.includes("eth") || str.includes("ethereum")) return "eth";
  if (str.includes("sol") || str.includes("solana")) return "sol";
  if (str.includes("xrp") || str.includes("ripple")) return "xrp";
  if (str.includes("trx") || str.includes("tron")) return "trx";
  if (str.includes("bnb") || str.includes("binance")) return "bnb";
  if (str.includes("busd")) return "busd";
  if (str.includes("doge")) return "doge";
  if (str.includes("ada") || str.includes("cardano")) return "ada";
  if (str.includes("ltc") || str.includes("litecoin")) return "ltc";
  if (str.includes("dot") || str.includes("polkadot")) return "dot";
  if (str.includes("avax") || str.includes("avalanche")) return "avax";
  if (str.includes("link") || str.includes("chainlink")) return "link";
  if (str.includes("shib")) return "shib";
  if (str.includes("matic") || str.includes("polygon")) return "matic";

  const tokens = str.split(/[^a-z0-9]/).filter(Boolean);
  return tokens[0] || "btc";
}

// Full color logo URL (CoinCap CDN or direct API image)
export function getCryptoIconUrl(method) {
  if (!method) return `https://assets.coincap.io/assets/icons/btc@2x.png`;

  if (typeof method !== 'string') {
    const directImage = method.icon || method.logo || method.image || method.image_url || method.img;
    if (directImage) return directImage;
  }

  const sym = getCryptoSymbol(method);
  return `https://assets.coincap.io/assets/icons/${sym}@2x.png`;
}

// Local package SVG fallback
export function getCryptoLocalSvg(method) {
  const sym = getCryptoSymbol(method);
  return `https://assets.coincap.io/assets/icons/${sym}@2x.png`;
}

// Official Brand style for badge
export function getCryptoBrandStyle(method) {
  const sym = getCryptoSymbol(method);
  const brand = cryptoBrandColors[sym] || { bg: '#3B82F6', text: '#FFFFFF', iconColor: '#3B82F6' };
  return {
    backgroundColor: brand.bg,
    color: brand.text,
  };
}

export function getCryptoTextColor(method) {
  const sym = getCryptoSymbol(method);
  const brand = cryptoBrandColors[sym] || { iconColor: '#3B82F6' };
  return brand.iconColor;
}

export function getCryptoCoinTag(method) {
  if (!method) return "COIN";

  if (typeof method === "string") {
    return getCryptoSymbol(method).toUpperCase();
  }

  const explicitCoin = method.coin || method.symbol || method.code || method.token;
  if (explicitCoin) {
    return String(explicitCoin).toUpperCase();
  }

  const text = method.alias || method.name || method.currency || "";
  if (!text) return getCryptoSymbol(method).toUpperCase();

  const match = text.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim().toUpperCase();
  }

  return getCryptoSymbol(method).toUpperCase();
}

