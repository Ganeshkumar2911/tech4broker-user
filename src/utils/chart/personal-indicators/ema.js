
export const emaSignal = {
  name: 'EMASignal',
  shortName: 'EMA+SIG',
  type: 'main',
  series: 'price',
  calcParams: [9, 21],
  figures: [
    { key: 'emaFast', title: 'EMA Fast: ', type: 'line' },
    { key: 'emaSlow', title: 'EMA Slow: ', type: 'line' }
  ],

  calc: (dataList, indicator) => {
    const rawFast = indicator?.calcParams?.[0];
    const rawSlow = indicator?.calcParams?.[1];

    const fast = Number.isFinite(Number(rawFast)) ? Math.max(1, Math.floor(Number(rawFast))) : 9;
    const slowRaw = Number.isFinite(Number(rawSlow)) ? Math.max(1, Math.floor(Number(rawSlow))) : 21;
    const slow = Math.max(fast + 1, slowRaw); // ensure slow > fast

    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const n = dataList.length;
    const out = {};
    const indexToTs = new Array(n);

    // alpha values
    const aFast = 2 / (fast + 1);
    const aSlow = 2 / (slow + 1);

    let prevFast = null;
    let prevSlow = null;

    // helper: compute small EPS to avoid float-equality traps
    const computeEPS = (a, b) => {
      const aVal = Number.isFinite(a) ? Math.abs(a) : 0;
      const bVal = Number.isFinite(b) ? Math.abs(b) : 0;
      const range = Math.max(Math.abs(a - b) || 0, Math.max(aVal, bVal));
      return Math.max(range * 1e-8, 1e-12);
    };

    for (let i = 0; i < n; i++) {
      const k = dataList[i];
      const ts = k?.timestamp ?? null;
      indexToTs[i] = ts;

      const close = (k && Number.isFinite(k.close)) ? k.close : 0;

      // update EMAs
      if (prevFast == null) prevFast = close;
      else prevFast = aFast * close + (1 - aFast) * prevFast;

      if (prevSlow == null) prevSlow = close;
      else prevSlow = aSlow * close + (1 - aSlow) * prevSlow;

      const emaFast = prevFast;
      const emaSlow = prevSlow;

      // read previous entry if available (closed-candle confirmation)
      const prevTs = (i - 1 >= 0) ? dataList[i - 1].timestamp : null;
      const prevEntry = (prevTs && out[prevTs]) ? out[prevTs] : null;
      const prevFastVal = prevEntry && Number.isFinite(prevEntry.emaFast) ? prevEntry.emaFast : emaFast;
      const prevSlowVal = prevEntry && Number.isFinite(prevEntry.emaSlow) ? prevEntry.emaSlow : emaSlow;

      const EPS = computeEPS(emaFast, emaSlow);

      // conservative crossover detection
      // BUY: prevFast < prevSlow AND emaFast > emaSlow
      // SELL: prevFast > prevSlow AND emaFast < emaSlow
      let signal = null;
      let triggerPrice = null;
      let level = null;

      if (i > 0) {
        if (prevFastVal < prevSlowVal - EPS && emaFast > emaSlow + EPS) {
          signal = 'BUY';
          triggerPrice = (emaFast + emaSlow) / 2; // marker reference
          level = 'MID';
        } else if (prevFastVal > prevSlowVal + EPS && emaFast < emaSlow - EPS) {
          signal = 'SELL';
          triggerPrice = (emaFast + emaSlow) / 2;
          level = 'MID';
        }
      }

      out[ts] = {
        emaFast,
        emaSlow,
        // simple string signal as requested
        signal,         // 'BUY' | 'SELL' | null
        triggerPrice,   // numeric or null
        level,          // 'MID' or null
        dataIndex: i,
        timestamp: ts
      };
    }

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

  // draw uses compatibility helper and draws markers; SMA/EMA lines typically rendered by chart engine via figures
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
      // choose reference price to place marker (prefer triggerPrice)
      const priceRef = Number.isFinite(data.triggerPrice) ? data.triggerPrice : ((Number.isFinite(data.emaFast) && Number.isFinite(data.emaSlow)) ? (data.emaFast + data.emaSlow) / 2 : null);
      if (priceRef == null || !Number.isFinite(priceRef)) continue;

      try {
        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(priceRef) + (isBuy ? -26 : 26);

        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = isBuy ? (style.buyFill || 'rgba(22,163,74,0.18)') : (style.sellFill || 'rgba(239,68,68,0.18)');
        ctx.fill();

        ctx.fillStyle = isBuy ? (style.buyColor || '#16a34a') : (style.sellColor || '#ef4444');
        ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y);

      } catch (e) {
        // ignore drawing error for this point
      }
    }

    ctx.restore();
  }
};