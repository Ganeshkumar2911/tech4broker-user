
const dateKeyFromTs = (ts) => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
const getTypeFromParams = (t='') => {
  t = (typeof t === 'string') ? t.toLowerCase() : String(t).toLowerCase();
  if (t === 'traditional') return 'classic';
  if (t === 'classsic') return 'classic'; // tolerate common typo
  if (['classic', 'classicpivot', 'pivot'].includes(t)) return 'classic';
  if (t === 'woodie' || t === 'woodies') return 'woodie';
  if (t === 'fibonacci' || t === 'fib') return 'fibonacci';
  // default
  return 'classic';
}

const parseParams = (indicator) => {
  let raw = indicator?.calcParams;
  if(!raw || !Array.isArray(raw) || raw.length === 0) {
    // default
    raw = indicator?.calcParams ? [indicator.calcParams] : [true, true, true, 20, true, 'classic', 10, 3]
  }

  let type = (raw[6] && getTypeFromParams(raw[6])) || 'classic';
  let data = {
    showPivot: raw[0] || false,
    showDonchian: raw[1] || false,
    showSupertrend: raw[2] || false,
    len1: raw[3] || 13,
    len2: raw[4] || 9,
    len3: raw[5] || 5,
    pivotType: type,
    AtrPeriod: raw[7] || 10,
    multiplier: raw[8] || 3
  }

  return data
}


const computeTRs = (dataList) => {
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
}

const highestWithIndex = (dataList, start, end) => {
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
}

const lowestWithIndex = (dataList, start, end) => {
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
} 

const crossover = (currentClose, previousClose, level) => {
  return (previousClose <= level) && (currentClose > level);
}
const crossunder = (currentClose, previousClose, level) => {
  return (previousClose >= level) && (currentClose < level);
} 

export const MultiIndicator = {
  name: 'MultiIndicator',
  shortName: 'MultiIndicator',
  series: 'price',
  type: 'main',
  // default: classic
  // showPivot, showDonchian, showSupertrend/ATR, len1, len2, len3, pivotType, AtrPeriod, multiplier 
  calcParams: [true, true, true, 13, 9, 5, 'classic', 10, 3],
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
    { key: 's5', title: 'S5: ', type: 'line' },

    // Supertrend Lines
    { key: 'st_up', title: 'ST Up', type: 'line' },
    { key: 'st_down', title: 'ST Down', type: 'line' },
  ],
  calc: (dataList, indicator) => {
    // Return an object keyed by timestamp and set indicator._indexToTs for draw compatibility
    if (!Array.isArray(dataList) || dataList.length === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    const len = dataList.length;
    const { showPivot, showDonchian, showSupertrend, len1, len2, len3, pivotType, AtrPeriod, multiplier } = parseParams(indicator);


    
    const byDate = {}; // dateKey -> { high, low, close, open, firstIdx, lastIdx }
    for (let i = 0; i < dataList.length; i++) {
      const k = dataList[i];
      const key = dateKeyFromTs(k.timestamp);
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


    const out = {};
    const superOut = {};
    const donchianOut = {};
    const indexToTs = new Array(dataList.length);

    let prevFinalUpper = null;
    let prevFinalLower = null;
    let prevSuper = null;
    let prevDirection = null;
    let previousClose = null;

    const TR = computeTRs(dataList);

    // ATR using Wilder's smoothing
    const ATR = new Array(len).fill(null);
    if (len >= AtrPeriod) {
      let sum = 0;
      for (let i = 0; i < AtrPeriod; i++) sum += (TR[i] || 0);
      let atrPrev = sum / AtrPeriod;
      ATR[AtrPeriod - 1] = atrPrev;
      for (let i = AtrPeriod; i < len; i++) {
        const tr = TR[i] || 0;
        atrPrev = (atrPrev * (AtrPeriod - 1) + tr) / AtrPeriod;
        ATR[i] = atrPrev;
      }
    }

    try {
      for (let i = 0; i < dataList.length; i++) {
        const k = dataList[i];
        const ts = k.timestamp;
        indexToTs[i] = ts;

        const key = dateKeyFromTs(ts);
        const prevKey = prevOfDate[key];

        if (!prevKey) {
          out[ts] = {
            p: null, r1: null, r2: null, r3: null, r4: null, r5: null,
            s1: null, s2: null, s3: null, s4: null, s5: null,
            prevHigh: null, prevLow: null, prevClose: null,
            timestamp: ts,
            dataIndex: i,
            typeUsed: pivotType
          };
          previousClose = null;
          continue;
        }

        const prev = byDate[prevKey];
        const H = prev.high;
        const L = prev.low;
        const C = prev.close;
        const O = prev.open;

        const levels = computeLevels(pivotType, H, L, C, O);

        // out[ts] = {
        //   p: Number.isFinite(levels.P) ? levels.P : null,
        //   r1: Number.isFinite(levels.R1) ? levels.R1 : null,
        //   r2: Number.isFinite(levels.R2) ? levels.R2 : null,
        //   r3: Number.isFinite(levels.R3) ? levels.R3 : null,
        //   r4: Number.isFinite(levels.R4) ? levels.R4 : null,
        //   r5: Number.isFinite(levels.R5) ? levels.R5 : null,
        //   s1: Number.isFinite(levels.S1) ? levels.S1 : null,
        //   s2: Number.isFinite(levels.S2) ? levels.S2 : null,
        //   s3: Number.isFinite(levels.S3) ? levels.S3 : null,
        //   s4: Number.isFinite(levels.S4) ? levels.S4 : null,
        //   s5: Number.isFinite(levels.S5) ? levels.S5 : null,
        //   prevHigh: H, prevLow: L, prevClose: C,
        //   timestamp: ts,
        //   dataIndex: i,
        //   typeUsed: pivotType
        // };



        // Supertrend  
        


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
        
        // store current as previous for next iteration
        prevFinalUpper = finalUpper;
        prevFinalLower = finalLower;
        prevSuper = superTrendVal;
        prevDirection = direction;

        superOut[ts] = {
          close,
          superTrend: Number.isFinite(superTrendVal) ? superTrendVal : null,
          upper: Number.isFinite(finalUpper) ? finalUpper : null,
          lower: Number.isFinite(finalLower) ? finalLower : null,
          direction,
          timestamp: ts,
          dataIndex: i
        };


        // // for donchian
        // // windows end at i, start accordingly
        // const s1 = Math.max(0, i - len1 + 1);
        // const s2 = Math.max(0, i - len2 + 1);
        // const s3 = Math.max(0, i - len3 + 1);

        // const h1 = highestWithIndex(dataList, s1, i);
        // const h2 = highestWithIndex(dataList, s2, i);
        // const h3 = highestWithIndex(dataList, s3, i);

        // const l1 = lowestWithIndex(dataList, s1, i);
        // const l2 = lowestWithIndex(dataList, s2, i);
        // const l3 = lowestWithIndex(dataList, s3, i);

        // // default values (null if insufficient history)
        // const upper1 = h1.value;
        // const upper2 = h2.value;
        // const upper3 = h3.value;
        // const lower1 = l1.value;
        // const lower2 = l2.value;
        // const lower3 = l3.value;


        // // donchianOut[ts] = {
        // //   close,
        // //   upper1,
        // //   upper2,
        // //   upper3,
        // //   lower1,
        // //   lower2,
        // //   lower3,
        // //   timestamp: ts,
        // //   dataIndex: i
        // // }


        // const buyCondition = (upper1 === upper2 && upper2 === upper3 && upper1 === upper3);
        // const sellCondition = (lower1 === lower2 && lower2 === lower3 && lower1 === lower3);

        // const crossoverCheck_buy = 
        //   (Number.isFinite(levels.S2) && k.low < levels.S2 && crossover(k.close, previousClose, levels.S2)) ||
        //   (Number.isFinite(levels.S1) && k.low < levels.S1 && crossover(k.close, previousClose, levels.S1)) ||
        //   (Number.isFinite(levels.P) && k.low < levels.P && crossover(k.close, previousClose, levels.P)) ||
        //   (Number.isFinite(levels.R1) && k.low < levels.R1 && crossover(k.close, previousClose, levels.R1)) ||
        //   (Number.isFinite(levels.R2) && k.low < levels.R2 && crossover(k.close, previousClose, levels.R2));

        // const call_buy = 
        //     direction === 'down' && 
        //     crossoverCheck_buy && 
        //     k.close > k.open && 
        //     buyCondition;


        // const crossunderCheck_sell = 
        //     (Number.isFinite(levels.S2) && k.high > levels.S2 && crossunder(k.close, previousClose, levels.S2)) ||
        //     (Number.isFinite(levels.S1) && k.high > levels.S1 && crossunder(k.close, previousClose, levels.S1)) ||
        //     (Number.isFinite(levels.P) && k.high > levels.P && crossunder(k.close, previousClose, levels.P)) ||
        //     (Number.isFinite(levels.R1) && k.high > levels.R1 && crossunder(k.close, previousClose, levels.R1)) ||
        //     (Number.isFinite(levels.R2) && k.high > levels.R2 && crossunder(k.close, previousClose, levels.R2));

        // const call_sell = 
        //     direction === 'up' && 
        //     crossunderCheck_sell && 
        //     k.close < k.open && 
        //     sellCondition;


        // //buy - sel condition defined
        // if(call_buy || call_sell) {
        //   console.log("print call buy and sell ", call_buy, call_sell)
        // }


        out[ts] = {
          p: showPivot ? levels.P : null, r1: showPivot ? levels.R1 : null, s1: showPivot ? levels.S1 : null,
          r2: showPivot ? levels.R2 : null, s2: showPivot ? levels.S2 : null, r3: showPivot ? levels.R3 : null,
          s3: showPivot ? levels.S3 : null, r4: showPivot ? levels.R4 : null, s4: showPivot ? levels.S4 : null,
          r5: showPivot ? levels.R5 : null, s5: showPivot ? levels.S5 : null,

          st_up: (direction === 'up') ? superTrendVal : null,
          st_down: (direction === 'down') ? superTrendVal : null,

          buy_signal: call_buy ? 1 : 0,
          sell_signal: call_sell ? 1 : 0,

          prevHigh: H, prevLow: L, prevClose: C,
          timestamp: ts,
          dataIndex: i,
          typeUsed: pivotType
        };
        previousClose = close;
      }
    } catch (error) {
      console.error("print error inside indicator", error)
    }

    if (indicator) indicator._indexToTs = indexToTs;
    
    indicator.multiResult = {
      pivot: out,
      donchian: donchianOut,
      superTrend: superOut
    }
    return out;
  },

  // draw: draws the pivot lines across visible range; compatible with both array and object-shaped results
  draw: ({ ctx, indicator, xAxis, yAxis, style = {} }) => {
    return false;
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

    const { showPivot, showDonchian, showSupertrend, donchianPeriod, showPivotMidLine, pivotType, AtrPeriod, multiplier } = parseParams(indicator);

    const palette = {
      p: style.pColor || (pivotType === 'fibonacci' ? '#f97316' : '#f59e0b'),
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
