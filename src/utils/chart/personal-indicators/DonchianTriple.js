
export const DonchianTriple = {
  name: 'Donchian Triple (Same-bar)',
  shortName: 'DN3',
  series: 'price',
  type: 'main',
  calcParams: [13, 9, 5, 'samebar'],
  precision: 2,
  figures: [
    { key: 'upper1', title: 'U1', type: 'line' },
    { key: 'lower1', title: 'L1', type: 'line' },
    { key: 'upper2', title: 'U2', type: 'line' },
    { key: 'lower2', title: 'L2', type: 'line' },
    { key: 'upper3', title: 'U3', type: 'line' },
    { key: 'lower3', title: 'L3', type: 'line' }
  ],

  _parseParams(ind) {
    const raw = ind?.calcParams;
    let a = Array.isArray(raw) ? raw.slice() : (typeof raw === 'number' ? [raw] : null);
    if (!a) a = DonchianTriple.calcParams.slice();
    const l1 = Math.max(1, Math.floor(Number(a[0] || 13)));
    const l2 = Math.max(1, Math.floor(Number(a[1] || 9)));
    const l3 = Math.max(1, Math.floor(Number(a[2] || 5)));
    const mode = String(a[3] || 'samebar').toLowerCase() === 'numeric' ? 'numeric' : 'samebar';
    return { len1: l1, len2: l2, len3: l3, mode };
  },

  // helper: find highest high and its index (absolute index in series) in window [start..end] inclusive
  _highestWithIndex(dataList, start, end) {
    let hh = -Infinity;
    let hhIdx = -1;
    for (let j = start; j <= end; j++) {
      const v = dataList[j];
      const h = Number.isFinite(v?.high) ? v.high : -Infinity;
      if (h > hh) {
        hh = h;
        hhIdx = j;
      }
    }
    if (!isFinite(hh)) return { value: null, index: null };
    return { value: hh, index: hhIdx };
  },

  // helper: find lowest low and its index (absolute index)
  _lowestWithIndex(dataList, start, end) {
    let ll = Infinity;
    let llIdx = -1;
    for (let j = start; j <= end; j++) {
      const v = dataList[j];
      const l = Number.isFinite(v?.low) ? v.low : Infinity;
      if (l < ll) {
        ll = l;
        llIdx = j;
      }
    }
    if (!isFinite(ll)) return { value: null, index: null };
    return { value: ll, index: llIdx };
  },

  calc: (dataList, indicator) => {
    const { len1, len2, len3, mode } = DonchianTriple._parseParams(indicator);
    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const n = dataList.length;
    const out = {};
    const indexToTs = new Array(n);

    // for each bar i compute the three upper/lower + their indices
    for (let i = 0; i < n; i++) {
      const ts = dataList[i]?.timestamp ?? null;
      indexToTs[i] = ts;

      // windows end at i, start accordingly
      const s1 = Math.max(0, i - len1 + 1);
      const s2 = Math.max(0, i - len2 + 1);
      const s3 = Math.max(0, i - len3 + 1);

      const h1 = DonchianTriple._highestWithIndex(dataList, s1, i);
      const h2 = DonchianTriple._highestWithIndex(dataList, s2, i);
      const h3 = DonchianTriple._highestWithIndex(dataList, s3, i);

      const l1 = DonchianTriple._lowestWithIndex(dataList, s1, i);
      const l2 = DonchianTriple._lowestWithIndex(dataList, s2, i);
      const l3 = DonchianTriple._lowestWithIndex(dataList, s3, i);

      // default values (null if insufficient history)
      const upper1 = h1.value;
      const upper2 = h2.value;
      const upper3 = h3.value;
      const lower1 = l1.value;
      const lower2 = l2.value;
      const lower3 = l3.value;

      // signals: use same-bar index match + closed-candle confirmation
      let signal = null;
      let triggerPrice = null;
      let matchIndex = null;

      if (i > 0 && upper1 != null && upper2 != null && upper3 != null && lower1 != null && lower2 != null && lower3 != null) {
        const prevClose = Number.isFinite(dataList[i - 1].close) ? dataList[i - 1].close : null;
        const currClose = Number.isFinite(dataList[i].close) ? dataList[i].close : null;

        // BUY condition: all uppers have same absolute index (same bar produced highest high for each window)
        if (h1.index === h2.index && h2.index === h3.index && h1.index !== null) {
          const highValue = upper1; // equal values by definition of same index
          // closed-candle confirmation: prevClose < highValue AND currClose > highValue
          if (prevClose != null && currClose != null && prevClose < highValue && currClose > highValue) {
            signal = 'BUY';
            triggerPrice = highValue;
            matchIndex = h1.index;
          }
        }

        // SELL condition: all lowers have same absolute index
        if (!signal && l1.index === l2.index && l2.index === l3.index && l1.index !== null) {
          const lowValue = lower1;
          if (prevClose != null && currClose != null && prevClose > lowValue && currClose < lowValue) {
            signal = 'SELL';
            triggerPrice = lowValue;
            matchIndex = l1.index;
          }
        }
      }

      out[ts] = {
        upper1, lower1,
        upper2, lower2,
        upper3, lower3,
        // metadata for consumer/draw
        signal,           // 'BUY' | 'SELL' | null
        triggerPrice,     // numeric or null (price that matched)
        matchIndex,       // absolute bar index of the matching high/low (or null)
        dataIndex: i,
        timestamp: ts
      };
    }

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

  // draw three channel lines + markers for signals
  draw: ({ ctx, indicator, xAxis, yAxis, style = {} }) => {
    if (!ctx || !indicator?.result || !xAxis || !yAxis) return false;

    // helper to read by index (support array or obj-shaped result)
    const getResultByIndex = (ind, idx) => {
      const res = ind.result;
      if (!res) return null;
      if (Array.isArray(res)) return res[idx] || null;
      const idxMap = ind._indexToTs || [];
      const ts = idxMap[idx];
      if (ts == null) return null;
      return res[ts] || null;
    };

    const { from = 0, to = (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : 0)) } = xAxis._range || xAxis.range || {};
    const start = Math.max(0, from);
    const end = Math.min(to, (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : to)));

    ctx.save();
    // styles (can override via style object)
    const colors = {
      u1: style.u1Color || '#1f77b4',
      u2: style.u2Color || '#3b82f6',
      u3: style.u3Color || '#60a5fa',
      l1: style.l1Color || '#d9534f',
      l2: style.l2Color || '#f97316',
      l3: style.l3Color || '#fb923c'
    };
    const lineWidth = style.lineWidth || 1.2;

    // draw helper: draw path for a key across visible range
    const drawKeyLine = (key, opt) => {
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
        let x;
        try { x = xAxis.convertToPixel(i); } catch (e) { continue; }
        let y;
        try { y = yAxis.convertToPixel(v); } catch (e) { continue; }

        if (!moved) {
          ctx.moveTo(x, y);
          moved = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (moved) ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]);
    };

    // draw three uppers and three lowers
    drawKeyLine('upper1', { strokeStyle: colors.u1, lineWidth, dash: [] });
    drawKeyLine('upper2', { strokeStyle: colors.u2, lineWidth: Math.max(0.8, lineWidth - 0.3), dash: [4, 2] });
    drawKeyLine('upper3', { strokeStyle: colors.u3, lineWidth: Math.max(0.8, lineWidth - 0.6), dash: [2, 2] });

    drawKeyLine('lower1', { strokeStyle: colors.l1, lineWidth, dash: [] });
    drawKeyLine('lower2', { strokeStyle: colors.l2, lineWidth: Math.max(0.8, lineWidth - 0.3), dash: [4, 2] });
    drawKeyLine('lower3', { strokeStyle: colors.l3, lineWidth: Math.max(0.8, lineWidth - 0.6), dash: [2, 2] });

    // draw markers for signals
    ctx.font = style.font || '500 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let drawn = 0;
    for (let i = start; i <= end; i++) {
      const d = getResultByIndex(indicator, i);
      if (!d || !d.signal) continue;
      const isBuy = d.signal === 'BUY';
      const priceRef = Number.isFinite(d.triggerPrice) ? d.triggerPrice : (isBuy ? d.upper1 ?? d.upper2 ?? d.upper3 : d.lower1 ?? d.lower2 ?? d.lower3);
      if (priceRef == null || !Number.isFinite(priceRef)) continue;
      let x, y;
      try {
        x = xAxis.convertToPixel(i);
        y = yAxis.convertToPixel(priceRef) + (isBuy ? -20 : 20);
      } catch (e) { continue; }

      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fillStyle = isBuy ? (style.buyFill || 'rgba(22,163,74,0.18)') : (style.sellFill || 'rgba(239,68,68,0.18)');
      ctx.fill();

      ctx.fillStyle = isBuy ? (style.buyColor || '#16a34a') : (style.sellColor || '#ef4444');
      ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y);

      drawn++;
    }

    ctx.restore();
  }
};