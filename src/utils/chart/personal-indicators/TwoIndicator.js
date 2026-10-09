
export const PivotSupertrend = {
  name: 'Pivot + Supertrend (Merged - Optimized)',
  shortName: 'PIVOT+SUPT',
  series: 'price',
  type: 'main',
  calcParams: [10, 3, 'classic'],      // supertrend: [atrPeriod, multiplier]
  // calcParamsPivot: ['classic'], // pivot type
  precision: 2,
  shouldOhlc: true,
  figures: [
    { key: 'superTrend', title: 'SUP: ', type: 'line' },
    { key: 'upper', title: 'SUP-UP: ', type: 'line' },
    { key: 'lower', title: 'SUP-DN: ', type: 'line' },
    { key: 'p', title: 'P: ', type: 'line' }
  ],

  // ---------- helpers ----------
  _dateKeyFromTs(ts) {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  _getPivotType(indicator) {
    const p = (indicator && indicator.calcParams && indicator.calcParams[2]) || PivotSupertrend.calcParams[2];
    const t = (typeof p === 'string') ? p.toLowerCase() : String(p).toLowerCase();
    if (t === 'traditional' || t === 'classsic') return 'classic';
    if (['classic', 'classicpivot', 'pivot'].includes(t)) return 'classic';
    if (t === 'woodie' || t === 'woodies') return 'woodie';
    if (t === 'fibonacci' || t === 'fib') return 'fibonacci';
    return 'classic';
  },

  // compute pivot levels (inlined math to avoid repeated calls)
  _computePivotLevels(typeName, H, L, C, O) {
    // ensure numbers
    H = Number(H); L = Number(L); C = Number(C); O = Number(O);
    const range = (H - L) || 0;
    let P, R1, R2, R3, S1, S2, S3;
    if (typeName === 'woodie') {
      P = (H + L + 2 * (Number.isFinite(O) ? O : C)) / 4;
      R1 = 2 * P - L; S1 = 2 * P - H;
      R2 = P + (H - L); S2 = P - (H - L);
      R3 = H + 2 * (P - L); S3 = L - 2 * (H - P);
    } else if (typeName === 'fibonacci') {
      P = (H + L + C) / 3;
      const diff = (H - L);
      const r1 = 0.382, r2 = 0.618, r3 = 1.0, r4 = 1.382, r5 = 1.618;
      R1 = P + r1 * diff; S1 = P - r1 * diff;
      R2 = P + r2 * diff; S2 = P - r2 * diff;
      R3 = P + r3 * diff; S3 = P - r3 * diff;
      // R4/R5 and S4/S5 are derived outside if needed
    } else {
      P = (H + L + C) / 3;
      R1 = 2 * P - L; S1 = 2 * P - H;
      R2 = P + (H - L); S2 = P - (H - L);
      R3 = H + 2 * (P - L); S3 = L - 2 * (H - P);
    }
    const R4 = R3 + range; const S4 = S3 - range;
    const R5 = R3 + 2 * range; const S5 = S3 - 2 * range;
    return { P, R1, R2, R3, R4, R5, S1, S2, S3, S4, S5 };
  },

  // ---------- optimized calc ----------
  calc(dataList, indicator) {
    // parse params
    const params = (indicator && indicator.calcParams) || PivotSupertrend.calcParams;
    const atrPeriod = Math.max(1, Math.floor(params[0] || 10));
    const atrMult = Math.max(0.1, Number(params[1] || 3));
    const pivotType = PivotSupertrend._getPivotType(indicator);

    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const n = dataList.length;

    // ---------- compute pivot byDate grouping ONCE ----------
    const byDate = Object.create(null);
    for (let i = 0; i < n; i++) {
      const k = dataList[i];
      const key = PivotSupertrend._dateKeyFromTs(k.timestamp);
      const v = byDate[key];
      if (!v) {
        byDate[key] = { high: k.high, low: k.low, open: (k.open ?? k['open']), close: k.close, firstIdx: i, lastIdx: i };
      } else {
        if (k.high > v.high) v.high = k.high;
        if (k.low < v.low) v.low = k.low;
        v.close = k.close;
        v.lastIdx = i;
      }
    }
    const dateKeys = Object.keys(byDate).sort();
    const prevOfDate = Object.create(null);
    for (let i = 1; i < dateKeys.length; i++) prevOfDate[dateKeys[i]] = dateKeys[i - 1];

    // ---------- compute TR array (simple loop) ----------
    const TR = new Array(n);
    for (let i = 0; i < n; i++) {
      const cur = dataList[i];
      if (!cur) { TR[i] = 0; continue; }
      if (i === 0) {
        TR[i] = (Number.isFinite(cur.high) && Number.isFinite(cur.low)) ? (cur.high - cur.low) : 0;
      } else {
        const prevClose = Number.isFinite(dataList[i - 1].close) ? dataList[i - 1].close : 0;
        const tr1 = (Number.isFinite(cur.high) && Number.isFinite(cur.low)) ? (cur.high - cur.low) : 0;
        const tr2 = (Number.isFinite(cur.high)) ? Math.abs(cur.high - prevClose) : 0;
        const tr3 = (Number.isFinite(cur.low)) ? Math.abs(cur.low - prevClose) : 0;
        let mx = tr1;
        if (tr2 > mx) mx = tr2;
        if (tr3 > mx) mx = tr3;
        TR[i] = mx;
      }
    }

    // ---------- ATR (Wilder smoothing) in single pass ----------
    const ATR = new Array(n).fill(null);
    if (n >= atrPeriod) {
      let sum = 0;
      for (let i = 0; i < atrPeriod; i++) sum += TR[i];
      let atrPrev = sum / atrPeriod;
      ATR[atrPeriod - 1] = atrPrev;
      for (let i = atrPeriod; i < n; i++) {
        const tr = TR[i];
        atrPrev = (atrPrev * (atrPeriod - 1) + tr) / atrPeriod;
        ATR[i] = atrPrev;
      }
    }

    // ---------- produce output object keyed by timestamp ----------
    const out = Object.create(null);
    const indexToTs = new Array(n);

    // keep supertrend state in local variables to avoid object property costs
    let prevFinalUpper = null;
    let prevFinalLower = null;
    let prevSuper = null;
    let prevDirection = null;

    // main loop: compute pivot levels (using previous-day OHLC) and supertrend per bar
    for (let i = 0; i < n; i++) {
      const k = dataList[i];
      const ts = k.timestamp;
      indexToTs[i] = ts;

      // --- pivot (previous trading day's OHLC)
      const dayKey = PivotSupertrend._dateKeyFromTs(ts);
      const prevKey = prevOfDate[dayKey];
      let p = null, r1 = null, r2 = null, r3 = null, r4 = null, r5 = null;
      let s1 = null, s2 = null, s3 = null, s4 = null, s5 = null;
      let prevHigh = null, prevLow = null, prevClose = null;
      if (prevKey) {
        const prevDay = byDate[prevKey];
        prevHigh = prevDay.high; prevLow = prevDay.low; prevClose = prevDay.close;
        const lv = PivotSupertrend._computePivotLevels(pivotType, prevDay.high, prevDay.low, prevDay.close, prevDay.open);
        p = Number.isFinite(lv.P) ? lv.P : null;
        r1 = Number.isFinite(lv.R1) ? lv.R1 : null;
        r2 = Number.isFinite(lv.R2) ? lv.R2 : null;
        r3 = Number.isFinite(lv.R3) ? lv.R3 : null;
        r4 = Number.isFinite(lv.R4) ? lv.R4 : null;
        r5 = Number.isFinite(lv.R5) ? lv.R5 : null;
        s1 = Number.isFinite(lv.S1) ? lv.S1 : null;
        s2 = Number.isFinite(lv.S2) ? lv.S2 : null;
        s3 = Number.isFinite(lv.S3) ? lv.S3 : null;
        s4 = Number.isFinite(lv.S4) ? lv.S4 : null;
        s5 = Number.isFinite(lv.S5) ? lv.S5 : null;
      }

      // --- supertrend
      const atr = ATR[i];
      let superVal = null;
      let finalUpper = null;
      let finalLower = null;
      let direction = null;

      if (Number.isFinite(atr)) {
        const high = Number.isFinite(k.high) ? k.high : null;
        const low = Number.isFinite(k.low) ? k.low : null;
        if (high != null && low != null) {
          const hl2 = (high + low) / 2;
          const basicUpper = hl2 + atrMult * atr;
          const basicLower = hl2 - atrMult * atr;

          // prev close cached
          const pClose = (i - 1 >= 0 && Number.isFinite(dataList[i - 1].close)) ? dataList[i - 1].close : null;

          finalUpper = basicUpper;
          finalLower = basicLower;

          if (prevFinalUpper != null && pClose != null) {
            if (basicUpper > prevFinalUpper && pClose <= prevFinalUpper) finalUpper = prevFinalUpper;
            else finalUpper = basicUpper;
          }
          if (prevFinalLower != null && pClose != null) {
            if (basicLower < prevFinalLower && pClose >= prevFinalLower) finalLower = prevFinalLower;
            else finalLower = basicLower;
          }

          if (prevSuper == null) {
            if (pClose != null && pClose <= finalUpper) { superVal = finalUpper; direction = 'down'; }
            else { superVal = finalLower; direction = 'up'; }
          } else {
            if (prevSuper === prevFinalUpper) {
              if (pClose != null && pClose <= finalUpper) { superVal = finalUpper; direction = 'down'; }
              else { superVal = finalLower; direction = 'up'; }
            } else if (prevSuper === prevFinalLower) {
              if (pClose != null && pClose >= finalLower) { superVal = finalLower; direction = 'up'; }
              else { superVal = finalUpper; direction = 'down'; }
            } else {
              if (pClose != null && pClose <= finalUpper) { superVal = finalUpper; direction = 'down'; }
              else { superVal = finalLower; direction = 'up'; }
            }
          }
        }
      }

      // --- signals
      let superSignal = null, pivotSignal = null, overallSignal = null;
      let superTrigger = null, pivotTrigger = null, overallTrigger = null;

      // supertrend flip detection
      if (prevDirection != null && direction != null && direction !== prevDirection) {
        if (direction === 'up') { superSignal = 'BUY'; superTrigger = superVal; }
        else if (direction === 'down') { superSignal = 'SELL'; superTrigger = superVal; }
      }

      // pivot basic crossing (R1/S1) using previous day's levels & closed candle confirmation
      if (prevHigh != null && prevLow != null && p != null && r1 != null && s1 != null) {
        const prevC = (i - 1 >= 0 && Number.isFinite(dataList[i - 1].close)) ? dataList[i - 1].close : null;
        const currC = Number.isFinite(k.close) ? k.close : null;
        if (prevC != null && currC != null) {
          if (r1 != null && prevC <= r1 && currC > r1) { pivotSignal = 'BUY'; pivotTrigger = r1; }
          else if (s1 != null && prevC >= s1 && currC < s1) { pivotSignal = 'SELL'; pivotTrigger = s1; }
        }
      }

      overallSignal = superSignal || pivotSignal || null;
      overallTrigger = superTrigger || pivotTrigger || null;

      // store prev states for next iteration
      prevFinalUpper = finalUpper;
      prevFinalLower = finalLower;
      prevSuper = superVal;
      prevDirection = direction;

      // assign output (primitives only)
      out[ts] = {
        p, r1, r2, r3, r4, r5,
        s1, s2, s3, s4, s5,
        prevHigh, prevLow, prevClose,
        superTrend: (Number.isFinite(superVal) ? superVal : null),
        upper: (Number.isFinite(finalUpper) ? finalUpper : null),
        lower: (Number.isFinite(finalLower) ? finalLower : null),
        direction,
        superSignal, pivotSignal,
        signal: overallSignal,
        triggerPrice: (Number.isFinite(overallTrigger) ? overallTrigger : null),
        dataIndex: i,
        timestamp: ts
      };
    }

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

  // ---------- optimized draw (more micro-optimizations) ----------
  draw({ ctx, indicator, xAxis, yAxis, style = {} }) {
    if (!ctx || !indicator?.result || !xAxis || !yAxis) return false;
    const resObj = indicator.result;
    if (!resObj) return false;

    const idxMap = indicator._indexToTs || (Array.isArray(resObj) ? resObj.map(r => r?.timestamp) : []);
    const totalLen = idxMap.length;
    const { from = 0, to = (totalLen ? totalLen - 1 : 0) } = xAxis._range || xAxis.range || {};
    const start = Math.max(0, from);
    const end = Math.min(to, totalLen - 1);
    if (end < start) return false;

    // keys to draw
    const pivotKeys = ['p', 'r1', 'r2', 'r3', 's1', 's2', 's3'];
    const pivotStyles = {
      p: { strokeStyle: style.pColor || '#f59e0b', lineWidth: 1.6, dash: [] },
      r1:{ strokeStyle: style.r1Color || '#DAA61C', lineWidth:1.1, dash:[] },
      r2:{ strokeStyle: style.r2Color || '#DAA61C', lineWidth:1.0, dash:[4,2] },
      r3:{ strokeStyle: style.r3Color || '#DAA61C', lineWidth:1.0, dash:[2,2] },
      s1:{ strokeStyle: style.s1Color || '#DAA61C', lineWidth:1.1, dash:[] },
      s2:{ strokeStyle: style.s2Color || '#DAA61C', lineWidth:1.0, dash:[4,2] },
      s3:{ strokeStyle: style.s3Color || '#DAA61C', lineWidth:1.0, dash:[2,2] }
    };

    const upColor = style.upColor || '#16a34a';
    const downColor = style.downColor || '#ef4444';
    const supLineWidth = style.supLineWidth || 2.5;

    // preallocate arrays
    const len = end - start + 1;
    const xs = new Array(len);
    const vals = Object.create(null);
    pivotKeys.forEach(k => vals[k] = new Array(len).fill(null));
    vals.superTrend = new Array(len).fill(null);
    vals.superDir = new Array(len).fill(null);
    vals.triggerPrice = new Array(len).fill(null);
    vals.overallSignal = new Array(len).fill(null);

    // fill xs and numeric arrays
    for (let i = start; i <= end; i++) {
      const idx = i - start;
      let x;
      try { x = xAxis.convertToPixel(i); } catch (e) { x = null; }
      xs[idx] = x;

      const ts = idxMap[i];
      let d = null;
      if (Array.isArray(resObj)) d = resObj[i] || null;
      else d = ts != null ? resObj[ts] : null;
      if (!d) continue;

      for (let k = 0; k < pivotKeys.length; k++) {
        const key = pivotKeys[k];
        const v = d[key];
        vals[key][idx] = (Number.isFinite(v) ? v : null);
      }
      vals.superTrend[idx] = Number.isFinite(d.superTrend) ? d.superTrend : null;
      vals.superDir[idx] = d.direction || null;
      vals.triggerPrice[idx] = Number.isFinite(d.triggerPrice) ? d.triggerPrice : null;
      vals.overallSignal[idx] = d.signal || null;
    }

    // helper to stroke contiguous segments for a numeric array
    const strokePath = (valueArr, opt) => {
      const dash = opt.dash || [];
      if (dash.length && ctx.setLineDash) ctx.setLineDash(dash);
      ctx.lineWidth = opt.lineWidth;
      ctx.strokeStyle = opt.strokeStyle;
      let started = false;
      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const x = xs[i];
        const v = valueArr[i];
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

    let drawnSignals = 0;
    try {
      ctx.save();

      // draw pivot lines (batch)
      for (let k = 0; k < pivotKeys.length; k++) {
        const key = pivotKeys[k];
        strokePath(vals[key], pivotStyles[key]);
      }

      // draw supertrend: contiguous segments colored by direction
      ctx.lineWidth = supLineWidth;
      let segStarted = false;
      let currentDir = null;
      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const x = xs[i];
        const v = vals.superTrend[i];
        const dir = vals.superDir[i];
        if (x == null || v == null) {
          if (segStarted) { ctx.stroke(); segStarted = false; currentDir = null; ctx.beginPath(); }
          continue;
        }
        const y = yAxis.convertToPixel(v);
        if (!segStarted || dir !== currentDir) {
          if (segStarted) ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.strokeStyle = (dir === 'up' ? upColor : downColor);
          currentDir = dir;
          segStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (segStarted) ctx.stroke();

      // draw signals (few points)
      ctx.font = style.signalFont || '500 13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < len; i++) {
        const sig = vals.overallSignal[i];
        if (!sig) continue;
        const isBuy = sig === 'BUY';
        const tp = vals.triggerPrice[i];
        const ref = (Number.isFinite(tp) ? tp : (vals.p[i] ?? vals.r1[i] ?? vals.s1[i]));
        if (ref == null) continue;
        const x = xs[i];
        let y; try { y = yAxis.convertToPixel(ref) + (isBuy ? -24 : 24); } catch (e) { continue; }
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = isBuy ? (style.buyFill || 'rgba(22,163,74,0.18)') : (style.sellFill || 'rgba(239,68,68,0.18)');
        ctx.fill();
        ctx.fillStyle = isBuy ? (style.buyColor || '#16a34a') : (style.sellColor || '#ef4444');
        ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y);
        drawnSignals++;
      }

      ctx.restore();
    } catch (err) {
      if (console && console.error) console.error('[PivotSupertrend.draw] rendering error', err);
    }

    return drawnSignals > 0;
  }
};