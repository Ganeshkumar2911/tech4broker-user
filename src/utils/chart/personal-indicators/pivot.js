
export const PivotPoints = {
  name: 'Pivot Points (Multi-type) 5-level',
  shortName: 'PIVOT5',
  series: 'price',
  type: 'main',
  // default: classic
  calcParams: ['classic'],
  precision: 2,
  shouldOhlc: false,
  figures: [
    { key: 'p', title: 'P: ', type: 'line' },
    { key: 'r1', title: 'R1: ', type: 'line' },
    { key: 'r2', title: 'R2: ', type: 'line' },
    { key: 'r3', title: 'R3: ', type: 'line' },
    { key: 'r4', title: 'R4: ', type: 'line' },
    { key: 'r5', title: 'R5: ', type: 'line' },
    { key: 's1', title: 'S1: ', type: 'line' },
    { key: 's2', title: 'S2: ', type: 'line' },
    { key: 's3', title: 'S3: ', type: 'line' },
    { key: 's4', title: 'S4: ', type: 'line' },
    { key: 's5', title: 'S5: ', type: 'line' }
  ],

  // helper: create date key string (YYYY-MM-DD) using local timezone
  _dateKeyFromTs: (ts) => {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  // normalize type string
  _getTypeFromParams: (indicator) => {
    const p = (indicator && indicator.calcParams && indicator.calcParams[0]) || PivotPoints.calcParams[0];
    const t = (typeof p === 'string') ? p.toLowerCase() : String(p).toLowerCase();
    if (t === 'traditional') return 'classic';
    if (t === 'classsic') return 'classic'; // tolerate common typo
    if (['classic', 'classicpivot', 'pivot'].includes(t)) return 'classic';
    if (t === 'woodie' || t === 'woodies') return 'woodie';
    if (t === 'fibonacci' || t === 'fib') return 'fibonacci';
    // default
    return 'classic';
  },

  calc: (dataList, indicator) => {
    // Return an object keyed by timestamp and set indicator._indexToTs for draw compatibility
    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const multiResult = {};
    const type = PivotPoints._getTypeFromParams(indicator);

    // 1) Group candles by local date => compute previous day OHLC for each day present
    const byDate = {}; // dateKey -> { high, low, close, open, firstIdx, lastIdx }
    for (let i = 0; i < dataList.length; i++) {
      const k = dataList[i];
      const key = PivotPoints._dateKeyFromTs(k.timestamp);
      if (!byDate[key]) {
        byDate[key] = { high: k.high, low: k.low, close: k.close, open: (k.open ?? k['open']), firstIdx: i, lastIdx: i };
      } else {
        const B = byDate[key];
        if (k.high > B.high) B.high = k.high;
        if (k.low < B.low) B.low = k.low;
        B.close = k.close; // last seen close for that day
        B.lastIdx = i;
      }
    }

    // Sorted date keys ascending
    const dateKeys = Object.keys(byDate).sort();

    // Map dateKey -> previousDateKey
    const prevOfDate = {};
    for (let i = 1; i < dateKeys.length; i++) prevOfDate[dateKeys[i]] = dateKeys[i - 1];

    // helper: compute levels for different types
    const computeLevels = (typeName, H, L, C, O) => {
      // default ensure numbers
      H = Number(H); L = Number(L); C = Number(C); O = Number(O);
      let P = null;
      let range = (H - L) || 0;

      if (typeName === 'classic') {
        // Classic / Traditional
        P = (H + L + C) / 3;
        const R1 = 2 * P - L;
        const S1 = 2 * P - H;
        const R2 = P + (H - L);
        const S2 = P - (H - L);
        const R3 = H + 2 * (P - L);
        const S3 = L - 2 * (H - P);
        const R4 = R3 + range;
        const S4 = S3 - range;
        const R5 = R3 + 2 * range;
        const S5 = S3 - 2 * range;
        return { P, R1, R2, R3, R4, R5, S1, S2, S3, S4, S5 };
      }

      if (typeName === 'woodie') {
        P = (H + L + 2 * (Number.isFinite(O) ? O : C)) / 4;
        const R1 = (2 * P) - L;
        const S1 = (2 * P) - H;
        const R2 = P + (H - L);
        const S2 = P - (H - L);
        const R3 = H + 2 * (P - L);
        const S3 = L - 2 * (H - P);
        const R4 = R3 + range;
        const S4 = S3 - range;
        const R5 = R3 + 2 * range;
        const S5 = S3 - 2 * range;
        return { P, R1, R2, R3, R4, R5, S1, S2, S3, S4, S5 };
      }

      if (typeName === 'fibonacci') {
        P = (H + L + C) / 3;
        const diff = (H - L);
        // usual fib ratios
        const r1 = 0.382, r2 = 0.618, r3 = 1.0, r4 = 1.382, r5 = 1.618;
        const R1 = P + r1 * diff;
        const S1 = P - r1 * diff;
        const R2 = P + r2 * diff;
        const S2 = P - r2 * diff;
        const R3 = P + r3 * diff;
        const S3 = P - r3 * diff;
        const R4 = P + r4 * diff;
        const S4 = P - r4 * diff;
        const R5 = P + r5 * diff;
        const S5 = P - r5 * diff;
        return { P, R1, R2, R3, R4, R5, S1, S2, S3, S4, S5 };
      }

      // fallback to classic
      P = (H + L + C) / 3;
      const R1 = 2 * P - L;
      const S1 = 2 * P - H;
      const R2 = P + (H - L);
      const S2 = P - (H - L);
      const R3 = H + 2 * (P - L);
      const S3 = L - 2 * (H - P);
      const R4 = R3 + range;
      const S4 = S3 - range;
      const R5 = R3 + 2 * range;
      const S5 = S3 - 2 * range;
      return { P, R1, R2, R3, R4, R5, S1, S2, S3, S4, S5 };
    };

    // Build output (object keyed by timestamp) and index->timestamp map
    const out = {};
    const indexToTs = new Array(dataList.length);

    for (let i = 0; i < dataList.length; i++) {
      const k = dataList[i];
      const ts = k.timestamp;
      indexToTs[i] = ts;

      const key = PivotPoints._dateKeyFromTs(ts);
      const prevKey = prevOfDate[key];

      if (!prevKey) {
        out[ts] = {
          p: null, r1: null, r2: null, r3: null, r4: null, r5: null,
          s1: null, s2: null, s3: null, s4: null, s5: null,
          prevHigh: null, prevLow: null, prevClose: null,
          timestamp: ts,
          dataIndex: i,
          typeUsed: type
        };
        continue;
      }

      const prev = byDate[prevKey];
      const H = prev.high;
      const L = prev.low;
      const C = prev.close;
      const O = prev.open;

      const levels = computeLevels(type, H, L, C, O);

      // pivot points
      out[ts] = {
        p: Number.isFinite(levels.P) ? levels.P : null,
        r1: Number.isFinite(levels.R1) ? levels.R1 : null,
        r2: Number.isFinite(levels.R2) ? levels.R2 : null,
        r3: Number.isFinite(levels.R3) ? levels.R3 : null,
        r4: Number.isFinite(levels.R4) ? levels.R4 : null,
        r5: Number.isFinite(levels.R5) ? levels.R5 : null,
        s1: Number.isFinite(levels.S1) ? levels.S1 : null,
        s2: Number.isFinite(levels.S2) ? levels.S2 : null,
        s3: Number.isFinite(levels.S3) ? levels.S3 : null,
        s4: Number.isFinite(levels.S4) ? levels.S4 : null,
        s5: Number.isFinite(levels.S5) ? levels.S5 : null,
        prevHigh: H, prevLow: L, prevClose: C,
        timestamp: ts,
        dataIndex: i,
        typeUsed: type
      };
    }

    multiResult.pivot = out;

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

  // draw: draws the pivot lines across visible range; compatible with both array and object-shaped results
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

    // determine range
    const { from = 0, to = (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : 0)) } = xAxis._range || xAxis.range || {};
    const start = Math.max(0, from);
    const end = Math.min(to, (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : to)));

    ctx.save();

    const typeUsed = (indicator && PivotPoints._getTypeFromParams(indicator)) || 'classic';

    const palette = {
      p: style.pColor || (typeUsed === 'fibonacci' ? '#f97316' : '#f59e0b'),
      r1: style.r1Color || '#DAA61C',
      r2: style.r2Color || '#DAA61C',
      r3: style.r3Color || '#DAA61C',
      r4: style.r4Color || '#DAA61C',
      r5: style.r5Color || '#DAA61C',
      s1: style.s1Color || '#DAA61C',
      s2: style.s2Color || '#DAA61C',
      s3: style.s3Color || '#DAA61C',
      s4: style.s4Color || '#DAA61C',
      s5: style.s5Color || '#DAA61C'
    };

    const styles = {
      p: { strokeStyle: palette.p, lineWidth: 2, dash: [] },
      r1: { strokeStyle: palette.r1, lineWidth: 1.1, dash: [] },
      r2: { strokeStyle: palette.r2, lineWidth: 1.1, dash: [4, 2] },
      r3: { strokeStyle: palette.r3, lineWidth: 1.1, dash: [2, 2] },
      r4: { strokeStyle: palette.r4, lineWidth: 1, dash: [2, 4] },
      r5: { strokeStyle: palette.r5, lineWidth: 1, dash: [1, 3] },
      s1: { strokeStyle: palette.s1, lineWidth: 1.1, dash: [] },
      s2: { strokeStyle: palette.s2, lineWidth: 1.1, dash: [4, 2] },
      s3: { strokeStyle: palette.s3, lineWidth: 1.1, dash: [2, 2] },
      s4: { strokeStyle: palette.s4, lineWidth: 1, dash: [2, 4] },
      s5: { strokeStyle: palette.s5, lineWidth: 1, dash: [1, 3] }
    };

    const drawLevelLine = (key, opt) => {
      ctx.beginPath();
      if (opt.dash && ctx.setLineDash) ctx.setLineDash(opt.dash);
      ctx.lineWidth = opt.lineWidth;
      ctx.strokeStyle = opt.strokeStyle;

      let moved = false;
      for (let i = start; i <= end; i++) {
        const d = getResultByIndex(indicator, i);
        if (!d) continue;
        const v = d[key];
        if (v == null || !Number.isFinite(v)) continue;
        const x = xAxis.convertToPixel(i);
        const y = yAxis.convertToPixel(v);

        if (!moved) {
          ctx.moveTo(x, y);
          moved = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (moved) ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]); // reset
    };

    Object.keys(styles).forEach(k => {
      drawLevelLine(k, styles[k]);
    });

    ctx.restore();
    return true;
  }
};
