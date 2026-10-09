import { useTickerStore } from "@/stores/shared/ticker";

/**
 * Extracts unique symbols from an array of trade / order / position objects
 * or an API response object containing a `data` array.
 * By default, filters for open items (status === "OPEN").
 *
 * @param {Array<Object>|Object} items - Array of trade/order/position objects or response object
 * @param {Object} [options] - Extraction options
 * @param {boolean} [options.onlyOpen=true] - Whether to filter for open status only (default: true)
 * @param {string} [options.symbolKey="symbol"] - Property name of the symbol in each item
 * @param {string} [options.statusKey="status"] - Property name of the status in each item
 * @returns {string[]} Array of unique symbol strings
 */
export function extractUniqueSymbols(items = [], options = {}) {
  const {
    onlyOpen = true,
    symbolKey = "symbol",
    statusKey = "status",
  } = options;

  // Handle direct array or wrapped response object (e.g. res.data or res)
  const list = Array.isArray(items)
    ? items
    : Array.isArray(items?.data)
      ? items.data
      : Array.isArray(items?.data?.data)
        ? items.data.data
        : [];

  if (list.length === 0) {
    return [];
  }

  const filtered = onlyOpen
    ? list.filter((item) => {
        if (!item) return false;
        const status = String(item?.[statusKey] ?? item?.state_name ?? "").trim().toUpperCase();
        const state = item?.state;
        if (status || state !== undefined) {
          return (
            status === "OPEN" ||
            status === "STARTED" ||
            status === "PLACED" ||
            state === 1 ||
            state === 2
          );
        }
        // If no explicit status, check for open leg / order attributes
        return Boolean(item?.price_open !== undefined || item?.volume !== undefined || item?.action !== undefined);
      })
    : list;

  const symbols = filtered
    .map((item) => item?.[symbolKey] ?? item?.Symbol ?? item?.symbol_name)
    .filter((sym) => sym !== null && sym !== undefined && String(sym).trim() !== "");

  return [...new Set(symbols)];
}

/**
 * Alias for extractUniqueSymbols
 */
export const getUniqueSymbols = extractUniqueSymbols;

/**
 * Extracts unique symbols (by default for open trades only) from items and
 * subscribes them to the WebSocket ticker store via `tickerStore.updateTickerList(uniqueSymbols)`.
 *
 * @param {Array<Object>|Object} items - Array of trade/order/position objects or response object
 * @param {Object} [options] - Options passed to extractUniqueSymbols (default: { onlyOpen: true })
 * @returns {string[]} The list of unique symbols subscribed
 */
export function subscribeTradeSymbols(items = [], options = { onlyOpen: true }) {
  const uniqueSymbols = extractUniqueSymbols(items, options);
  if (uniqueSymbols.length > 0) {
    const tickerStore = useTickerStore();
    tickerStore.updateTickerList(uniqueSymbols);
  }
  return uniqueSymbols;
}

/**
 * Alias for subscribeTradeSymbols
 */
export const subscribeOpenTradeSymbols = subscribeTradeSymbols;

/**
 * Determines appropriate decimal digits for a symbol based on its name, tick digits, or price value.
 * - Forex 5-digit pairs (EURUSD, GBPUSD, AUDUSD, etc.): 5 decimal places
 * - Forex JPY pairs (USDJPY, EURJPY, GBPJPY, etc.): 3 decimal places
 * - Commodities / Indices / Crypto (XAUUSD, BTCUSD, US30, etc.): 2 decimal places
 */
export function getSymbolPrecision(symbol = '', fallbackPrice = 0, digitsFromTick = null) {
  if (digitsFromTick !== null && digitsFromTick !== undefined && !isNaN(Number(digitsFromTick))) {
    return Number(digitsFromTick);
  }

  const sym = String(symbol).toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Forex JPY pairs -> 3 decimals (e.g. USDJPY, EURJPY, GBPJPY)
  if (sym.includes('JPY')) {
    return 3;
  }

  // Major / Minor Forex 5-digit currencies
  const currencies = ['EUR', 'GBP', 'AUD', 'NZD', 'USD', 'CAD', 'CHF'];
  const isForexPair = sym.length === 6 &&
    currencies.some(c => sym.startsWith(c)) &&
    currencies.some(c => sym.endsWith(c));

  if (isForexPair) {
    return 5;
  }

  const price = Number(fallbackPrice);
  if (!isNaN(price) && price > 0) {
    if (price >= 100) return 2;
    if (price < 1) return 5;
  }

  return 2;
}

/**
 * Formats a symbol price with appropriate decimal precision.
 */
export function formatSymbolPrice(val, symbol = '', digitsFromTick = null) {
  if (val === undefined || val === null || isNaN(Number(val)) || Number(val) <= 0) {
    return '- -';
  }
  const num = Number(val);
  const precision = getSymbolPrecision(symbol, num, digitsFromTick);
  return num.toFixed(precision);
}

/**
 * Safely calculates spread in points or USD price difference without floating-point string length issues.
 * Dynamically computes ask - bid in real-time so spread moves on every WebSocket price tick.
 */
export function calculateSpreadPoints(symbol = '', tick = null) {
  if (!tick) return '0';

  const ask = tick.ask != null ? Number(tick.ask) : null;
  const bid = tick.bid != null ? Number(tick.bid) : null;

  if (ask != null && bid != null && !isNaN(ask) && !isNaN(bid) && ask > 0 && bid > 0) {
    const diff = ask - bid;
    if (diff >= 0) {
      const sym = String(symbol).toUpperCase();

      // Crypto (BTCUSD, ETHUSD, SOLUSD, etc.): Spread is actual USD dollar difference!
      if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('CRYPTO')) {
        return diff >= 10 ? String(Math.round(diff)) : diff.toFixed(2);
      }

      // Indices (US30, NAS100, SPX, GER30, HK50): Spread is index point difference
      if (sym.includes('US30') || sym.includes('NAS') || sym.includes('SPX') || sym.includes('GER') || sym.includes('HK50')) {
        return diff >= 10 ? String(Math.round(diff)) : diff.toFixed(1);
      }

      // Forex & Metals (EURUSD, USDJPY, XAUUSD)
      const precision = getSymbolPrecision(symbol, ask, tick.digits);
      const factor = Math.pow(10, precision);
      const spreadPoints = Math.round(diff * factor);
      return String(spreadPoints);
    }
  }

  if (tick.spread != null && !isNaN(Number(tick.spread))) {
    const rawSpread = Number(tick.spread);
    return rawSpread >= 10 ? String(Math.round(rawSpread)) : rawSpread.toFixed(1);
  }

  return '0';
}

export default {
  extractUniqueSymbols,
  getUniqueSymbols,
  subscribeTradeSymbols,
  subscribeOpenTradeSymbols,
  getSymbolPrecision,
  formatSymbolPrice,
  calculateSpreadPoints,
};

