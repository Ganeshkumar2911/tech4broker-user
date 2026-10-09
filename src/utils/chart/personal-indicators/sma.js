/**
 * SMASignal: Fast/Slow SMA crossover signal generator
 * calcParams: [fastPeriod = 9, slowPeriod = 21]
 * - returns object keyed by timestamp with entries:
 *   { smaFast, smaSlow, signal, triggerPrice, level, dataIndex, timestamp }
 * - signal: 'BUY' when fast crosses above slow on candle-close
 *           'SELL' when fast crosses below slow on candle-close
 *
 * Efficient: uses rolling sums for O(n) processing.
 */
export const smaSignal = {
  name: 'SMASignal',
  shortName: 'SMA+SIG',
  type: 'main',
  series: 'price',
  /* default fast=9 slow=21 */
  calcParams: [9, 21],
  figures: [
    { key: 'smaFast', title: 'SMA Fast: ', type: 'line' },
    { key: 'smaSlow', title: 'SMA Slow: ', type: 'line' }
  ],

  calc: (dataList, indicator) => {
    const rawFast = indicator?.calcParams?.[0];
    const rawSlow = indicator?.calcParams?.[1];

    const fastPeriod = Number.isFinite(Number(rawFast)) ? Math.max(1, Math.floor(Number(rawFast))) : 9;
    const slowPeriod = Number.isFinite(Number(rawSlow)) ? Math.max(fastPeriod + 1, Math.floor(Number(rawSlow))) : Math.max(fastPeriod + 1, 21);

    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const n = dataList.length;
    const out = {};               // keyed by timestamp
    const indexToTs = new Array(n);

    // rolling sums and simple queues
    let sumFast = 0, sumSlow = 0;
    const qFast = [], qSlow = [];

    const avg = (s, len) => (len > 0 ? s / len : 0);

    // helper to read previous entry safely from out
    const getPrevEntry = (i) => {
      if (i <= 0) return null;
      const prevTs = dataList[i - 1].timestamp;
      return out[prevTs] || null;
    };

    // small EPS to avoid floating equality traps (scale by price)
    const computeEPS = (a, b) => {
      const range = Math.abs((a != null && b != null) ? (a - b) : (Math.max(Math.abs(a || 0), Math.abs(b || 0))));
      return Math.max(range * 1e-8, 1e-12);
    };

    for (let i = 0; i < n; i++) {
      const k = dataList[i];
      const ts = k?.timestamp ?? null;
      indexToTs[i] = ts;

      const close = (k && Number.isFinite(k.close)) ? k.close : 0;

      // update fast
      qFast.push(close);
      sumFast += close;
      if (qFast.length > fastPeriod) sumFast -= qFast.shift();

      // update slow
      qSlow.push(close);
      sumSlow += close;
      if (qSlow.length > slowPeriod) sumSlow -= qSlow.shift();

      const smaFast = avg(sumFast, qFast.length);
      const smaSlow = avg(sumSlow, qSlow.length);

      // previous SMA values (from previous output entry) for closed-candle confirmation
      const prev = getPrevEntry(i);
      const prevFast = prev && Number.isFinite(prev.smaFast) ? prev.smaFast : smaFast;
      const prevSlow = prev && Number.isFinite(prev.smaSlow) ? prev.smaSlow : smaSlow;

      // compute EPS based on SMA distance to avoid float equality issues
      const EPS = computeEPS(smaFast, smaSlow);

      // conservative crossover detection (closed-candle confirmation)
      // BUY: prevFast < prevSlow AND smaFast > smaSlow
      // SELL: prevFast > prevSlow AND smaFast < smaSlow
      let signal = null;
      let triggerPrice = null;
      let level = null;

      if (i > 0) {
        // use strict crossing with EPS tolerance
        if ((prevFast < prevSlow - EPS) && (smaFast > smaSlow + EPS)) {
          signal = 'BUY';
          // choose triggerPrice for visual marker: midpoint of the two SMAs at the cross-close
          triggerPrice = (smaFast + smaSlow) / 2;
          level = 'MID';
        } else if ((prevFast > prevSlow + EPS) && (smaFast < smaSlow - EPS)) {
          signal = 'SELL';
          triggerPrice = (smaFast + smaSlow) / 2;
          level = 'MID';
        }
      }

      out[ts] = {
        smaFast,
        smaSlow,
        // simple string as requested
        signal,         // 'BUY' | 'SELL' | null
        triggerPrice,   // numeric or null
        level,          // 'MID' or null
        dataIndex: i,
        timestamp: ts
      };
    }
    // indicator.myselfHostedResult = {}

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

  // Custom draw for signals (draws small circle + text near sma)
  draw: ({ ctx, indicator, xAxis, yAxis, style = {} }) => {
    if (!ctx || !indicator?.result || !xAxis || !yAxis) return false;

    // helper: fetch result entry by integer index (supports legacy array and new object keyed-by-timestamp)
    const getResultByIndex = (ind, idx) => {
      const res = ind.result;
      if (!res) return null;
      if (Array.isArray(res)) return res[idx] || null; // legacy
      const idxMap = ind._indexToTs || [];
      const ts = idxMap[idx];
      if (ts == null) return null;
      return res[ts] || null;
    };

    const { from = 0, to = (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : 0)) } = xAxis._range || xAxis.range || {};
    const start = Math.max(0, from);
    const end = Math.min(to, (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : to)));

    ctx.save();
    ctx.font = style.font || 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = start; i <= end; i++) {
      const data = getResultByIndex(indicator, i);
      if (!data) continue;

      const sig = (typeof data.signal === 'string') ? data.signal : (data.signal && data.signal.type) || null;
      if (!sig) continue;

      const isBuy = sig === 'BUY';
      // choose reference price to place marker (prefers triggerPrice if present, else average of SMAs)
      const priceRef = Number.isFinite(data.triggerPrice) ? data.triggerPrice : ((Number.isFinite(data.smaFast) && Number.isFinite(data.smaSlow)) ? (data.smaFast + data.smaSlow) / 2 : null);
      if (priceRef == null || !Number.isFinite(priceRef)) continue;

      try {
        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(priceRef) + (isBuy ? -28 : 28);

        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = isBuy ? (style.buyFill || 'rgba(22,163,74,0.18)') : (style.sellFill || 'rgba(239,68,68,0.18)');
        ctx.fill();

        ctx.fillStyle = isBuy ? (style.buyColor || '#16a34a') : (style.sellColor || '#ef4444');
        ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y);

      } catch (e) {
        // ignore drawing errors for a point
      }
    }

    ctx.restore();
  }
};
