export const Donchian = {
  name: 'Donchian',
  shortName: 'DN',
  series: 'price',
  type: 'main',
  calcParams: [20, true],
  figures: [
    { key: 'upper', title: 'Upper', type: 'line' },
    { key: 'lower', title: 'Lower', type: 'line' },
    { key: 'mid', title: 'Mid', type: 'line' }
  ],

  // helper: robust parse of calcParams
  _parseParams(indicator) {
    let raw = indicator?.calcParams;
    if (typeof raw === 'string') raw = raw.split(',').map(s => s.trim());
    if (typeof raw === 'number') raw = [raw];
    if (!Array.isArray(raw)) raw = indicator?.calcParams ? [indicator.calcParams] : [20, true];

    // length
    const lenCandidate = Number(raw[0]);
    const length = Number.isFinite(lenCandidate) && !Number.isNaN(lenCandidate) ? Math.max(1, Math.floor(lenCandidate)) : 20;

    // showMid
    let showMid = true;
    if (raw.length >= 2) {
      const s = raw[1];
      if (typeof s === 'boolean') showMid = s;
      else if (typeof s === 'string') showMid = s.toLowerCase() === 'true';
      else if (typeof s === 'number') showMid = Boolean(s);
    }

    return { length, showMid };
  },

  calc: (dataList, indicator) => {
    const { length, showMid } = Donchian._parseParams(indicator);

    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const n = dataList.length;
    // return object keyed by timestamp
    const out = {};
    const indexToTs = new Array(n);

    // naive sliding-window (O(n * length)) — fine for typical lengths (20/55)
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - length + 1);
      let upper = -Infinity;
      let lower = Infinity;

      for (let j = start; j <= i; j++) {
        const bar = dataList[j];
        const hh = (bar && Number.isFinite(bar.high)) ? bar.high : (Number.isFinite(bar.close) ? bar.close : 0);
        const ll = (bar && Number.isFinite(bar.low)) ? bar.low : (Number.isFinite(bar.close) ? bar.close : 0);
        if (hh > upper) upper = hh;
        if (ll < lower) lower = ll;
      }

      if (!isFinite(upper)) upper = null;
      if (!isFinite(lower)) lower = null;

      const mid = (upper != null && lower != null && showMid) ? (upper + lower) / 2 : null;

      // compute robust previous-window upper/lower (for i>0)
      let prevUpper = null;
      let prevLower = null;
      if (i > 0) {
        const prevTs = dataList[i - 1].timestamp;
        if (out[prevTs]) {
          prevUpper = out[prevTs].upper;
          prevLower = out[prevTs].lower;
        } else {
          // fallback: recompute previous window (safe)
          const pStart = Math.max(0, (i - 1) - length + 1);
          let pUpper = -Infinity;
          let pLower = Infinity;
          for (let j = pStart; j <= i - 1; j++) {
            const bar = dataList[j];
            const hh = (bar && Number.isFinite(bar.high)) ? bar.high : (Number.isFinite(bar.close) ? bar.close : 0);
            const ll = (bar && Number.isFinite(bar.low)) ? bar.low : (Number.isFinite(bar.close) ? bar.close : 0);
            if (hh > pUpper) pUpper = hh;
            if (ll < pLower) pLower = ll;
          }
          prevUpper = isFinite(pUpper) ? pUpper : null;
          prevLower = isFinite(pLower) ? pLower : null;
        }
      }

      // signal detection on candle-close crossing of previous bar vs current bar
      // Use conservative crossing rule: prevClose < prevLevel && currClose >= level -> BUY
      //                                     prevClose > prevLevel && currClose <= level -> SELL
      let signal = null;
      if (i > 0 && upper != null && lower != null) {
        const prevClose = Number.isFinite(dataList[i - 1].close) ? dataList[i - 1].close : 0;
        const currClose = Number.isFinite(dataList[i].close) ? dataList[i].close : 0;

        // safe fallback for prevUpper/prevLower if still null -> treat as equal to current
        const pU = (prevUpper != null) ? prevUpper : upper;
        const pL = (prevLower != null) ? prevLower : lower;

        // BUY: previous close strictly below previous upper AND current close >= current upper
        if (Number.isFinite(pU) && Number.isFinite(upper)) {
          if (prevClose < pU && currClose >= upper) {
            signal = 'BUY';
          }
        }

        // SELL: previous close strictly above previous lower AND current close <= current lower
        if (!signal && Number.isFinite(pL) && Number.isFinite(lower)) {
          if (prevClose > pL && currClose <= lower) {
            signal = 'SELL';
          }
        }
      }

      const ts = dataList[i].timestamp;
      indexToTs[i] = ts;

      out[ts] = {
        upper,
        lower,
        mid,
        signal,
        dataIndex: i,
        timestamp: ts
      };
    }

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

  draw: ({ ctx, indicator, xAxis, yAxis }) => {
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

    // determine range safely
    const { from = 0, to = (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : 0)) } = xAxis._range || xAxis.range || {};
    const start = Math.max(0, from);
    const end = Math.min(to, (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : to)));

    ctx.save();
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = start; i <= end; i++) {
      const d = getResultByIndex(indicator, i);
      if (!d) continue;

      // draw mid small dot if available
      if (d.mid != null) {
        try {
          const xm = xAxis.convertToPixel(i);
          const ym = yAxis.convertToPixel(d.mid);
          ctx.beginPath();
          ctx.arc(xm, ym, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(150,150,150,0.9)';
          ctx.fill();
        } catch (e) {
          // convertToPixel may throw or be unavailable; skip gracefully
        }
      }

      if (!d.signal) continue;

      
      const isBuy = d.signal === 'BUY';
      const priceRef = isBuy ? d.upper : d.lower;
      if (priceRef == null || !Number.isFinite(priceRef)) continue;

      try {
        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(priceRef) + (isBuy ? -22 : 22);

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = isBuy ? 'rgba(22,163,74,0.18)' : 'rgba(239,68,68,0.18)';
        ctx.fill();

        ctx.fillStyle = isBuy ? '#16a34a' : '#ef4444';
        ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y);

      } catch (e) {
        // safe-guard drawing errors
      }
    }

    ctx.restore();
  }
};