import { useTickerStore } from "@/stores/shared/ticker";

/**
 * Calculates raw floating PnL (number) for a single open leg / trade / position
 *
 * Formula:
 * - BUY:  (bid - price_open) * volume * contract_size
 * - SELL: (price_open - ask) * volume * contract_size
 * - Scaled x100 if broker_currency is USC or CENT
 *
 * @param {Object} leg - Trade or open leg object
 * @returns {number} Floating PnL as number (0 if price unavailable or invalid)
 */
export function calculateLegFloatingPnl(leg) {
  if (!leg) return 0;

  // If trade already closed, use backend profit/pnl
  const status = String(leg?.status || "").toUpperCase();
  if (status === "CLOSED") {
    const val = leg?.profit ?? leg?.pnl ?? 0;
    return Number(val) || 0;
  }

  const tickerStore = useTickerStore();
  const livePrice = tickerStore.getLastPrice(leg?.symbol);

  if (!livePrice) {
    // If not closed and ticker price not arrived yet, fallback to stored profit if present
    const val = leg?.profit ?? leg?.pnl;
    return val !== null && val !== undefined && !isNaN(val) ? Number(val) : 0;
  }

  const priceOpen = Number(
    leg?.price_open ?? leg?.entry_price ?? leg?.open_price ?? 0,
  );
  const volume = Number(
    leg?.volume ?? leg?.lot ?? leg?.quantity ?? leg?.volume_initial ?? 0,
  );

  if (volume <= 0 || priceOpen <= 0) {
    const val = leg?.profit ?? leg?.pnl;
    return val !== null && val !== undefined && !isNaN(val) ? Number(val) : 0;
  }

  // Determine BUY vs SELL
  // MT5 action: 0 = BUY, 1 = SELL
  let isBuy = true;
  if (leg?.action !== undefined && leg?.action !== null) {
    isBuy = Number(leg.action) === 0;
  } else if (leg?.type) {
    isBuy = String(leg.type).toUpperCase() === "BUY";
  } else if (leg?.type_name) {
    isBuy = String(leg.type_name).toUpperCase() === "BUY";
  }

  let pnl = 0;
  if (isBuy) {
    // BUY: close happens at BID (fallback to last)
    const currentPrice = Number(livePrice?.bid ?? livePrice?.last ?? 0);
    if (currentPrice > 0) {
      pnl = (currentPrice - priceOpen) * volume;
    }
  } else {
    // SELL: close happens at ASK (fallback to last)
    const currentPrice = Number(livePrice?.ask ?? livePrice?.last ?? 0);
    if (currentPrice > 0) {
      pnl = (priceOpen - currentPrice) * volume;
    }
  }

  const contractSize = Number(leg?.contract_size || livePrice?.contract || 1);
  pnl = pnl * contractSize;

  // Scale USC / CENT currencies or .c symbol suffix x100
  const currency = String(
    leg?.broker_currency || leg?.currency || "",
  ).toUpperCase();
  const isCentSymbol = Boolean(
    leg?.symbol && String(leg.symbol).toLowerCase().endsWith(".c"),
  );
  const isCentCurrency = currency === "USC" || currency === "CENT";

  if (isCentSymbol || isCentCurrency) {
    pnl = pnl * 100;
  }

  return pnl;
}

/**
 * Calculates sum of floating PnL for an array of open legs
 *
 * @param {Array<Object>} legs - Array of open leg objects
 * @returns {number} Summed floating PnL
 */
export function calculateTotalFloatingPnl(legs = []) {
  if (!Array.isArray(legs) || legs.length === 0) return 0;

  return legs.reduce((total, leg) => {
    return total + calculateLegFloatingPnl(leg);
  }, 0);
}

/**
 * Live PnL formatter for table rows / components (backwards compatible)
 *
 * @param {Object} trade
 * @returns {string} Formatted PnL string (e.g. "12.34" or "0.00")
 */
export function livePNL(trade) {
  if (!trade) return "0.00";

  const status = String(trade?.status || "").toUpperCase();
  if (status === "CLOSED") {
    return Number(trade?.profit ?? trade?.pnl ?? 0).toFixed(2);
  }

  const pnl = calculateLegFloatingPnl(trade);
  return Number(pnl).toFixed(2);
}

export default {
  calculateLegFloatingPnl,
  calculateTotalFloatingPnl,
  livePNL,
};
