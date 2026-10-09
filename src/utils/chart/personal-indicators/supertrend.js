
// import { handleAlert } from "@/stores/utils/alert";

export const Supertrend = {
  name: 'Supertrend',
  shortName: 'SUPT',
  series: 'price',
  type: 'main',
  calcParams: [10, 3], // default: ATR period 10, multiplier 3
  precision: 2,
  shouldOhlc: true,
  figures: [
    { key: 'superTrend', title: 'SUP: ', type: 'line' },
    { key: 'upper', title: 'UP: ', type: 'line' },
    { key: 'lower', title: 'DN: ', type: 'line' }
  ],

  // helper: compute True Range list
  _computeTRs(dataList) {
    const TR = new Array(dataList.length).fill(null);
    for (let i = 0; i < dataList.length; i++) {
      const cur = dataList[i];
      if (!cur) continue;
      if (i === 0) {
        TR[i] = (Number.isFinite(cur.high) && Number.isFinite(cur.low)) ? (cur.high - cur.low) : null;
      } else {
        const prevClose = dataList[i - 1] && Number.isFinite(dataList[i - 1].close) ? dataList[i - 1].close : null;
        const tr1 = (Number.isFinite(cur.high) && Number.isFinite(cur.low)) ? (cur.high - cur.low) : 0;
        const tr2 = (Number.isFinite(cur.high) && Number.isFinite(prevClose)) ? Math.abs(cur.high - prevClose) : 0;
        const tr3 = (Number.isFinite(cur.low) && Number.isFinite(prevClose)) ? Math.abs(cur.low - prevClose) : 0;
        TR[i] = Math.max(tr1, tr2, tr3);
      }
    }
    return TR;
  },

  calc: (dataList, indicator) => {
    const params = (indicator && indicator.calcParams) || Supertrend.calcParams;
    const period = Math.max(1, Math.floor(params[0] || 10));
    const multiplier = Math.max(0.1, Number(params[1] || 3));

    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const len = dataList.length;
    const TR = Supertrend._computeTRs(dataList);

    // ATR using Wilder's smoothing
    const ATR = new Array(len).fill(null);
    if (len >= period) {
      let sum = 0;
      for (let i = 0; i < period; i++) sum += (TR[i] || 0);
      let atrPrev = sum / period;
      ATR[period - 1] = atrPrev;
      for (let i = period; i < len; i++) {
        const tr = TR[i] || 0;
        atrPrev = (atrPrev * (period - 1) + tr) / period;
        ATR[i] = atrPrev;
      }
    }

    // output map keyed by timestamp and index->timestamp map
    const out = {};
    const indexToTs = new Array(len);

    // state
    let prevFinalUpper = null;
    let prevFinalLower = null;
    let prevSuper = null;
    let prevDirection = null;

    for (let i = 0; i < len; i++) {
      const k = dataList[i];
      const ts = k?.timestamp ?? null;
      indexToTs[i] = ts;

      if (!k) {
        out[ts] = { superTrend: null, upper: null, lower: null, direction: null, signal: null, triggerPrice: null, timestamp: ts, dataIndex: i };
        continue;
      }

      const atr = ATR[i];
      if (!Number.isFinite(atr)) {
        out[ts] = { superTrend: null, upper: null, lower: null, direction: null, signal: null, triggerPrice: null, timestamp: ts, dataIndex: i };
        continue;
      }

      const hl2 = (Number.isFinite(k.high) && Number.isFinite(k.low)) ? (k.high + k.low) / 2 : null;
      if (!Number.isFinite(hl2)) {
        out[ts] = { superTrend: null, upper: null, lower: null, direction: null, signal: null, triggerPrice: null, timestamp: ts, dataIndex: i };
        continue;
      }

      const basicUpper = hl2 + multiplier * atr;
      const basicLower = hl2 - multiplier * atr;

      // finalUpper / finalLower rules
      let finalUpper = basicUpper;
      let finalLower = basicLower;

      if (prevFinalUpper != null && Number.isFinite(prevFinalUpper)) {
        const prevClose = (i - 1 >= 0 && Number.isFinite(dataList[i - 1]?.close)) ? dataList[i - 1].close : null;
        if (basicUpper > prevFinalUpper && prevClose != null && prevClose <= prevFinalUpper) {
          finalUpper = prevFinalUpper;
        } else {
          finalUpper = basicUpper;
        }
      }

      if (prevFinalLower != null && Number.isFinite(prevFinalLower)) {
        const prevClose = (i - 1 >= 0 && Number.isFinite(dataList[i - 1]?.close)) ? dataList[i - 1].close : null;
        if (basicLower < prevFinalLower && prevClose != null && prevClose >= prevFinalLower) {
          finalLower = prevFinalLower;
        } else {
          finalLower = basicLower;
        }
      }

      // determine current superTrend and direction using previous super
      const close = Number.isFinite(k.close) ? k.close : null;
      let superTrendVal = null;
      let direction = null;

      if (prevSuper == null) {
        // initialization: choose based on close vs finalUpper
        if (close != null && close <= finalUpper) {
          superTrendVal = finalUpper;
          direction = 'down';
        } else {
          superTrendVal = finalLower;
          direction = 'up';
        }
      } else {
        if (prevSuper === prevFinalUpper) {
          // previous was trending down
          if (close != null && close <= finalUpper) {
            superTrendVal = finalUpper;
            direction = 'down';
          } else {
            superTrendVal = finalLower;
            direction = 'up';
          }
        } else if (prevSuper === prevFinalLower) {
          // previous was trending up
          if (close != null && close >= finalLower) {
            superTrendVal = finalLower;
            direction = 'up';
          } else {
            superTrendVal = finalUpper;
            direction = 'down';
          }
        } else {
          // safety fallback
          if (close != null && close <= finalUpper) {
            superTrendVal = finalUpper;
            direction = 'down';
          } else {
            superTrendVal = finalLower;
            direction = 'up';
          }
        }
      }


      let signal = null;
      let triggerPrice = null;
      let level = null; // for clarity, set 'SUPER' (the superTrend value) as level reference
      let prevSignal = null;

      // new signal approach 
      if (prevDirection != null && direction !== prevDirection) {
        if (direction === 'up') {
          signal = 'BUY';
          triggerPrice = superTrendVal;
          level = 'SUPER';
        } else if (direction === 'down') {
          signal = 'SELL';
          triggerPrice = superTrendVal;
          level = 'SUPER';
        }
      }

      // store current as previous for next iteration
      prevFinalUpper = finalUpper;
      prevFinalLower = finalLower;
      prevSuper = superTrendVal;
      prevDirection = direction;

      out[ts] = {
        // signal as simple string as requested
        signal,            // 'BUY' | 'SELL' | null
        triggerPrice,      // number or null
        level,             // 'SUPER' or null
        close,
        superTrend: Number.isFinite(superTrendVal) ? superTrendVal : null,
        upper: Number.isFinite(finalUpper) ? finalUpper : null,
        lower: Number.isFinite(finalLower) ? finalLower : null,
        direction,
        timestamp: ts,
        dataIndex: i
      };


      // handle alerts
      // if (i === len - 1 && signal) {
      //   handleAlert(indicator.name)
      // }

    }

    if (indicator) indicator._indexToTs = indexToTs;
    return out;
  },

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

    const upColor = style.upColor || '#16a34a';
    const downColor = style.downColor || '#ef4444';
    const lineWidth = style.lineWidth || 2;

    // Draw Supertrend as continuous colored segments grouped by direction
    let currentDir = null;
    let moved = false;
    for (let i = start; i <= end; i++) {
      const d = getResultByIndex(indicator, i);
      if (!d || d.superTrend == null || !Number.isFinite(d.superTrend)) {
        if (moved) {
          try { ctx.stroke(); } catch (e) { }
        }
        currentDir = null;
        moved = false;
        continue;
      }

      const x = xAxis.convertToPixel(i);
      const y = yAxis.convertToPixel(d.superTrend);

      // start new segment when direction changes
      if (!moved || d.direction !== currentDir) {
        if (moved) {
          try { ctx.stroke(); } catch (e) { }
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = d.direction === 'up' ? upColor : downColor;
        currentDir = d.direction;
        moved = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    if (moved) {
      try { ctx.stroke(); } catch (e) { }
    }

    // Draw flip markers (BUY/SELL) on top
    for (let i = start; i <= end; i++) {
      const d = getResultByIndex(indicator, i);
      if (!d || !d.signal) continue;

      // d.signal is a string now ('BUY'|'SELL'), but draw helper still accepts older object if present
      const sigType = (typeof d.signal === 'string') ? d.signal : (d.signal && d.signal.type) || null;
      if (!sigType) continue;
      const isBuy = sigType === 'BUY';
      try {
        const x = xAxis.convertToPixel(i);
        const refPrice = (Number.isFinite(d.triggerPrice) ? d.triggerPrice : (d.superTrend != null ? d.superTrend : (isBuy ? d.upper : d.lower)));
        if (refPrice == null || !Number.isFinite(refPrice)) continue;
        const y = yAxis.convertToPixel(refPrice) + (isBuy ? -22 : 22);

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = isBuy ? 'rgba(22,163,74,0.18)' : 'rgba(239,68,68,0.18)';
        ctx.fill();

        ctx.fillStyle = isBuy ? '#16a34a' : '#ef4444';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = (style.signalFont || '500 13px Arial');
        ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y);
      } catch (e) {
        // safe-guard drawing errors
      }
    }

    ctx.restore();
    return true;
  }
};