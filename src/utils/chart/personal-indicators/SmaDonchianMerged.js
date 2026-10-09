
export const SmaDonchianMerged = {
  name: 'SMA + Donchian (Merged)',
  shortName: 'SMA+DN',
  series: 'price',
  type: 'main',
  // [fast=9, slow=21, donchianLen=20, showMid=true]
  calcParams: [9, 21, 20, true],
  precision: 4,
  figures: [
    { key: 'smaFast', title: 'SMA Fast: ', type: 'line' },
    { key: 'smaSlow', title: 'SMA Slow: ', type: 'line' },
    { key: 'upper', title: 'Donchian Upper', type: 'line' },
    { key: 'lower', title: 'Donchian Lower', type: 'line' },
    { key: 'mid', title: 'Donchian Mid', type: 'line' }
  ],

  _parseParams(ind) {
    const raw = ind?.calcParams;
    let a = Array.isArray(raw) ? raw.slice() : null;
    if (!a) a = SmaDonchianMerged.calcParams.slice();
    const fast = Math.max(1, Math.floor(Number(a[0] ?? 9)));
    const slow = Math.max(fast + 1, Math.floor(Number(a[1] ?? 21)));
    const dlen = Math.max(1, Math.floor(Number(a[2] ?? 20)));
    const showMid = (a.length >= 4) ? Boolean(a[3]) : true;
    return { fast, slow, dlen, showMid };
  },

  calc(dataList, indicator) {
    const { fast, slow, dlen, showMid } = SmaDonchianMerged._parseParams(indicator);
    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const n = dataList.length;
    const out = Object.create(null);
    const indexToTs = new Array(n);

    // rolling sums for SMA
    let sumFast = 0, sumSlow = 0;
    const qFast = [];
    const qSlow = [];

    // Donchian sliding window (naive but fine for small lengths). Use deque if needed.
    const highs = [], lows = [];

    // helper previous stored values for closed-candle confirmation
    let prevSmaFast = null, prevSmaSlow = null;
    let prevUpper = null, prevLower = null;

    for (let i = 0; i < n; i++) {
      const k = dataList[i];
      const ts = k?.timestamp ?? null;
      indexToTs[i] = ts;

      const close = Number.isFinite(k?.close) ? k.close : 0;
      const high = Number.isFinite(k?.high) ? k.high : close;
      const low = Number.isFinite(k?.low) ? k.low : close;

      // update SMA fast
      qFast.push(close);
      sumFast += close;
      if (qFast.length > fast) sumFast -= qFast.shift();
      const smaFast = (qFast.length > 0) ? (sumFast / qFast.length) : null;

      // update SMA slow
      qSlow.push(close);
      sumSlow += close;
      if (qSlow.length > slow) sumSlow -= qSlow.shift();
      const smaSlow = (qSlow.length > 0) ? (sumSlow / qSlow.length) : null;

      // update Donchian rolling arrays
      highs.push(high); lows.push(low);
      if (highs.length > dlen) { highs.shift(); lows.shift(); }

      let upper = null, lower = null, mid = null;
      if (highs.length === dlen) {
        // compute min/max in window
        let hh = -Infinity, ll = Infinity;
        for (let j = 0; j < dlen; j++) {
          const h = highs[j], l = lows[j];
          if (h > hh) hh = h;
          if (l < ll) ll = l;
        }
        upper = isFinite(hh) ? hh : null;
        lower = isFinite(ll) ? ll : null;
        mid = (upper != null && lower != null && showMid) ? (upper + lower) / 2 : null;
      }

      // detect signals (closed-candle; use previous bar values)
      let smaSignal = null;
      let donchianSignal = null;
      let triggerPrice = null;

      if (i > 0) {
        // SMA crossover: prevFast <= prevSlow and now fast > slow => BUY
        if (prevSmaFast != null && prevSmaSlow != null && smaFast != null && smaSlow != null) {
          const EPS = Math.max(Math.abs(smaFast - smaSlow) * 1e-8, 1e-12);
          if (prevSmaFast <= prevSmaSlow - EPS && smaFast > smaSlow + EPS) {
            smaSignal = 'BUY';
            triggerPrice = (smaFast + smaSlow) / 2;
          } else if (prevSmaFast >= prevSmaSlow + EPS && smaFast < smaSlow - EPS) {
            smaSignal = 'SELL';
            triggerPrice = (smaFast + smaSlow) / 2;
          }
        }

        // Donchian breakout: prevClose <= prevUpper && close > upper => BUY
        const prevClose = Number.isFinite(dataList[i - 1]?.close) ? dataList[i - 1].close : null;
        if (prevUpper != null && prevLower != null && prevClose != null && upper != null && lower != null) {
          const EPSu = Math.max(Math.abs(upper) * 1e-8, 1e-12);
          const EPSl = Math.max(Math.abs(lower) * 1e-8, 1e-12);
          if (prevClose <= prevUpper + EPSu && close > upper + EPSu) {
            donchianSignal = 'BUY';
            triggerPrice = upper;
          } else if (prevClose >= prevLower - EPSl && close < lower - EPSl) {
            donchianSignal = 'SELL';
            triggerPrice = lower;
          }
        }
      }

      // precedence: Donchian over SMA
      const signal = donchianSignal || smaSignal || null;

      // store primitives
      out[ts] = {
        smaFast: (smaFast != null ? smaFast : null),
        smaSlow: (smaSlow != null ? smaSlow : null),
        upper, lower, mid,
        smaSignal, donchianSignal,
        signal,
        triggerPrice: (Number.isFinite(triggerPrice) ? triggerPrice : null),
        dataIndex: i,
        timestamp: ts
      };

      // save prev values for next iteration
      prevSmaFast = smaFast;
      prevSmaSlow = smaSlow;
      prevUpper = upper;
      prevLower = lower;
    }

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

  // optimized draw: draw smaFast/smaSlow lines + donchian upper/lower with signals
  draw({ ctx, indicator, xAxis, yAxis, style = {} }) {
    if (!ctx || !indicator?.result || !xAxis || !yAxis) return false;
    const res = indicator.result;
    if (!res) return false;

    const idxMap = indicator._indexToTs || (Array.isArray(res) ? res.map(r => r?.timestamp) : []);
    const total = idxMap.length;
    const { from = 0, to = (total ? total - 1 : 0) } = xAxis._range || xAxis.range || {};
    const start = Math.max(0, from);
    const end = Math.min(to, total - 1);
    if (end < start) return false;

    // prepare arrays
    const len = end - start + 1;
    const xs = new Array(len);
    const smaFastArr = new Array(len).fill(null);
    const smaSlowArr = new Array(len).fill(null);
    const upperArr = new Array(len).fill(null);
    const lowerArr = new Array(len).fill(null);
    const midArr = new Array(len).fill(null);
    const sigArr = new Array(len).fill(null);
    const tpArr = new Array(len).fill(null);

    // fill numeric arrays and xs in one pass
    for (let i = start; i <= end; i++) {
      const idx = i - start;
      let x;
      try { x = xAxis.convertToPixel(i); } catch (e) { x = null; }
      xs[idx] = x;

      const ts = idxMap[i];
      let item = null;
      if (Array.isArray(res)) item = res[i] || null;
      else item = (ts != null) ? res[ts] : null;
      if (!item) continue;

      smaFastArr[idx] = Number.isFinite(item.smaFast) ? item.smaFast : null;
      smaSlowArr[idx] = Number.isFinite(item.smaSlow) ? item.smaSlow : null;
      upperArr[idx] = Number.isFinite(item.upper) ? item.upper : null;
      lowerArr[idx] = Number.isFinite(item.lower) ? item.lower : null;
      midArr[idx] = Number.isFinite(item.mid) ? item.mid : null;
      sigArr[idx] = item.signal || null;
      tpArr[idx] = Number.isFinite(item.triggerPrice) ? item.triggerPrice : null;
    }

    // helper stroke for arrays
    const strokeLine = (valArr, opt) => {
      const dash = opt.dash || [];
      if (dash.length && ctx.setLineDash) ctx.setLineDash(dash);
      ctx.lineWidth = opt.lineWidth;
      ctx.strokeStyle = opt.strokeStyle;
      let started = false;
      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const x = xs[i];
        const v = valArr[i];
        if (x == null || v == null) {
          if (started) { ctx.stroke(); started = false; ctx.beginPath(); }
          continue;
        }
        let y;
        try { y = yAxis.convertToPixel(v); } catch (e) { y = null; }
        if (y == null) { if (started) { ctx.stroke(); started = false; ctx.beginPath(); } continue; }
        if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
      }
      if (started) ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]);
    };

    // drawing
    try {
      ctx.save();

      // SMA lines
      strokeLine(smaFastArr, { strokeStyle: style.fastColor || '#1f77b4', lineWidth: 1.6 });
      strokeLine(smaSlowArr, { strokeStyle: style.slowColor || '#ff7f0e', lineWidth: 1.6, dash: [4, 2] });

      // Donchian lines
      strokeLine(upperArr, { strokeStyle: style.upColor || '#2b8a3e', lineWidth: 1.2 });
      strokeLine(lowerArr, { strokeStyle: style.lowColor || '#d62828', lineWidth: 1.2 });
      if (style.showMid !== false) {
        strokeLine(midArr, { strokeStyle: style.midColor || '#666666', lineWidth: 0.9, dash: [2, 2] });
      }

      // signals (markers)
      ctx.font = style.signalFont || '500 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let drawn = 0;
      for (let i = 0; i < len; i++) {
        const sig = sigArr[i];
        if (!sig) continue;
        const isBuy = sig === 'BUY';
        const ref = tpArr[i] != null ? tpArr[i] : (isBuy ? upperArr[i] ?? midArr[i] : lowerArr[i] ?? midArr[i]);
        if (ref == null) continue;
        const x = xs[i];
        let y;
        try { y = yAxis.convertToPixel(ref) + (isBuy ? -20 : 20); } catch (e) { continue; }

        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fillStyle = isBuy ? (style.buyFill || 'rgba(22,163,74,0.18)') : (style.sellFill || 'rgba(239,68,68,0.18)');
        ctx.fill();
        ctx.fillStyle = isBuy ? (style.buyColor || '#16a34a') : (style.sellColor || '#ef4444');
        ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y);
        drawn++;
      }

      ctx.restore();
      return drawn > 0;
    } catch (err) {
      if (console && console.error) console.error('[SmaDonchianMerged.draw] err', err);
      return false;
    }
  }
};