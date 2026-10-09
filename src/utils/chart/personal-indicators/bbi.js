
export const bbiIndicator = {
  name: 'BBISignal',
  shortName: 'BBI+SIG',
  type: 'main',
  series: 'price',
  calcParams: [3, 6, 12, 24],
  figures: [
    { key: 'bbi', title: 'BBI: ', type: 'line' }
    // add ma3/ma6/ma12/ma24 here if you want to plot them
  ],

  calc: (dataList, indicator) => {
    const rawParams = indicator?.calcParams || [3, 6, 12, 24];
    const parsed = Array.isArray(rawParams) ? rawParams.map(n => Math.max(1, Math.floor(Number(n) || 0))) : [3,6,12,24];
    const [p3 = 3, p6 = 6, p12 = 12, p24 = 24] = (parsed.length >= 4 ? parsed : [3,6,12,24]);

    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const n = dataList.length;
    const out = {};
    const indexToTs = new Array(n);

    // rolling sums and queues for each period
    let sum3 = 0, sum6 = 0, sum12 = 0, sum24 = 0;
    const q3 = [], q6 = [], q12 = [], q24 = [];

    const avg = (s, l) => (l > 0 ? s / l : 0);

    // helper to recompute previous BBI window if needed (rare)
    const recomputeBBIForIndex = (idx) => {
      const start = Math.max(0, idx - 1);
      // we'll compute ma's ending at idx (inclusive)
      const windows = { p3, p6, p12, p24 };
      const sums = { p3: 0, p6: 0, p12: 0, p24: 0 };
      const counts = { p3: 0, p6: 0, p12: 0, p24: 0 };
      for (let j = Math.max(0, idx - Math.max(p3,p6,p12,p24) + 1); j <= idx; j++) {
        const c = Number.isFinite(dataList[j]?.close) ? dataList[j].close : 0;
        if (idx - j < p3) { sums.p3 += c; counts.p3++;}
        if (idx - j < p6) { sums.p6 += c; counts.p6++;}
        if (idx - j < p12){ sums.p12 += c; counts.p12++;}
        if (idx - j < p24){ sums.p24 += c; counts.p24++;}
      }
      const ma3 = avg(sums.p3, counts.p3);
      const ma6 = avg(sums.p6, counts.p6);
      const ma12 = avg(sums.p12, counts.p12);
      const ma24 = avg(sums.p24, counts.p24);
      return { ma3, ma6, ma12, ma24, bbi: (ma3 + ma6 + ma12 + ma24) / 4 };
    };

    // EPS helper scaled to BBI size
    const epsFor = (a, b) => {
      const size = Math.max(Math.abs(a || 0), Math.abs(b || 0));
      return Math.max(size * 1e-8, 1e-12);
    };

    for (let i = 0; i < n; i++) {
      const k = dataList[i];
      const ts = k?.timestamp ?? null;
      indexToTs[i] = ts;

      const close = Number.isFinite(k?.close) ? k.close : 0;

      // update windows
      q3.push(close); sum3 += close; if (q3.length > p3) sum3 -= q3.shift();
      q6.push(close); sum6 += close; if (q6.length > p6) sum6 -= q6.shift();
      q12.push(close); sum12 += close; if (q12.length > p12) sum12 -= q12.shift();
      q24.push(close); sum24 += close; if (q24.length > p24) sum24 -= q24.shift();

      const ma3 = avg(sum3, q3.length);
      const ma6 = avg(sum6, q6.length);
      const ma12 = avg(sum12, q12.length);
      const ma24 = avg(sum24, q24.length);

      const bbi = (ma3 + ma6 + ma12 + ma24) / 4;

      // robust previous BBI retrieval (prefer cached out, else recompute)
      let prevBBI = null;
      if (i > 0) {
        const prevTs = dataList[i - 1]?.timestamp;
        if (prevTs && out[prevTs]) {
          prevBBI = out[prevTs].bbi;
        } else {
          // fallback recompute
          prevBBI = recomputeBBIForIndex(i - 1).bbi;
        }
      }

      // signal detection — strict crossing on candle-close with EPS
      let signal = null;
      let triggerPrice = null;
      let level = null;
      if (i > 0 && prevBBI != null) {
        const prevClose = Number.isFinite(dataList[i - 1]?.close) ? dataList[i - 1].close : 0;
        const EPS = epsFor(bbi, prevBBI);

        // BUY: prevClose < prevBBI - EPS  AND close > bbi + EPS
        if (prevClose < prevBBI - EPS && close > bbi + EPS) {
          signal = 'BUY';
          triggerPrice = bbi;
          level = 'BBI';
        }
        // SELL: prevClose > prevBBI + EPS AND close < bbi - EPS
        else if (prevClose > prevBBI + EPS && close < bbi - EPS) {
          signal = 'SELL';
          triggerPrice = bbi;
          level = 'BBI';
        }
      }

      out[ts] = {
        ma3,
        ma6,
        ma12,
        ma24,
        bbi,
        // simple string signal and metadata on same object
        signal,          // 'BUY' | 'SELL' | null
        triggerPrice,    // numeric or null
        level,            // 'BBI' or null
        dataIndex: i,
        timestamp: ts
      };
    }

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

  // draw: compatible with array or object-shaped results
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
    ctx.font = style.font || '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let drawn = 0;
    for (let i = start; i <= end; i++) {
      const d = getResultByIndex(indicator, i);
      if (!d) continue;

      // draw small dot for bbi
      if (Number.isFinite(d.bbi)) {
        try {
          const x = xAxis.convertToPixel(i);
          const y = yAxis.convertToPixel(d.bbi);
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = style.bbiDotFill || 'rgba(255,215,0,0.95)'; // gold-ish
          ctx.fill();
        } catch (e) {
          // ignore pixel conversion errors
        }
      }

      if (!d.signal) {
        drawn++;
        continue;
      }

      const isBuy = d.signal === 'BUY';
      // marker offset and draw
      try {
        const x = xAxis.convertToPixel(i);
        const refPrice = Number.isFinite(d.triggerPrice) ? d.triggerPrice : d.bbi;
        if (refPrice == null || !Number.isFinite(refPrice)) { drawn++; continue; }
        const y = yAxis.convertToPixel(refPrice) + (isBuy ? -26 : 26);

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = isBuy ? (style.buyFill || 'rgba(22,163,74,0.18)') : (style.sellFill || 'rgba(239,68,68,0.18)');
        ctx.fill();

        ctx.fillStyle = isBuy ? (style.buyColor || '#16a34a') : (style.sellColor || '#ef4444');
        ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y);

        drawn++;
      } catch (e) {
        // skip drawing error for this point
      }
    }

    ctx.restore();
  }
};