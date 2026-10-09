
export const PivotMix = {
  name: 'Pivot Mix',
  shortName: 'PIVOTMix',
  series: 'price',
  type: 'main',
  calcParams: [true, true, true, 20], // no params required for classic daily pivots
  precision: 2,
  shouldOhlc: false,
  // figures: [
  //   { key: 'p', title: 'P: ', type: 'line' },
  //   { key: 'r1', title: 'R1: ', type: 'line' },
  //   { key: 'r2', title: 'R2: ', type: 'line' },
  //   { key: 'r3', title: 'R3: ', type: 'line' },
  //   { key: 'r4', title: 'R4: ', type: 'line' },
  //   { key: 'r5', title: 'R5: ', type: 'line' },
  //   { key: 's1', title: 'S1: ', type: 'line' },
  //   { key: 's2', title: 'S2: ', type: 'line' },
  //   { key: 's3', title: 'S3: ', type: 'line' },
  //   { key: 's4', title: 'S4: ', type: 'line' },
  //   { key: 's5', title: 'S5: ', type: 'line' },

  //   { key: 'upper', title: 'UP: ', type: 'line' },
  //   { key: 'mid',   title: 'MID: ', type: 'line' },
  //   { key: 'lower', title: 'DN: ', type: 'line' }
  // ],

  // helper: create date key string (YYYY-MM-DD) using local timezone
  _dateKeyFromTs: (ts) => {
    const d = new Date(ts);
    // produce YYYY-MM-DD (local)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  calc: (dataList, indicator) => {
    if (!Array.isArray(dataList) || dataList.length === 0) return [];

    const showPivot = indicator.calcParams[0];
    const showDonchian = indicator.calcParams[1];
    const showATR = indicator.calcParams[2];


    let pivotResults, donchianResults, atrResults;

    if(showPivot) {
      // 1) Group candles by local date => compute previous day OHLC for each day present
      const byDate = {}; // dateKey -> { high, low, close, firstIdx, lastIdx }
      for (let i = 0; i < dataList.length; i++) {
        const k = dataList[i];
        const key = PivotMix._dateKeyFromTs(k.timestamp);
        if (!byDate[key]) {
          byDate[key] = { high: k.high, low: k.low, close: k.close, firstIdx: i, lastIdx: i };
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

      // Map dateKey -> previousDateKey (so we can quickly find prev day for any candle's date)
      const prevOfDate = {};
      for (let i = 1; i < dateKeys.length; i++) {
        prevOfDate[dateKeys[i]] = dateKeys[i - 1];
      }

      // 2) Build result array: for each candle i, use previous trading day's OHLC (if exists)
      pivotResults = new Array(dataList.length).fill(null);
      for (let i = 0; i < dataList.length; i++) {
        const k = dataList[i];
        const key = PivotMix._dateKeyFromTs(k.timestamp);
        const prevKey = prevOfDate[key];
        if (!prevKey) {
          // no previous full day available (e.g., first day in series)
          pivotResults[i] = {
            p: null, r1: null, r2: null, r3: null, r4: null, r5: null,
            s1: null, s2: null, s3: null, s4: null, s5: null,
            timestamp: k.timestamp,
            dataIndex: i
          };
          continue;
        }

        const prev = byDate[prevKey];
        const H = prev.high;
        const L = prev.low;
        const C = prev.close;


        // compute pivot and levels
        const P = (H + L + C) / 3;
        const R1 = 2 * P - L;
        const S1 = 2 * P - H;
        const R2 = P + (H - L);
        const S2 = P - (H - L);
        const R3 = H + 2 * (P - L);
        const S3 = L - 2 * (H - P);
        const range = (H - L) || 0;
        const R4 = R3 + range;
        const S4 = S3 - range;
        const R5 = R3 + 2 * range;
        const S5 = S3 - 2 * range;
        

        pivotResults[i] = {
          p: P,
          r1: R1, r2: R2, r3: R3, r4: R4, r5: R5,
          s1: S1, s2: S2, s3: S3, s4: S4, s5: S5,
          // include raw previous-day OHLC for debugging or external usage if desired
          prevHigh: H, prevLow: L, prevClose: C,
          timestamp: k.timestamp,
          dataIndex: i
        };
      }
    }

    if(showDonchian) {
      const params = (indicator && indicator.calcParams);
      const period = Math.max(1, params[3] || 20);
      if (!Array.isArray(dataList) || dataList.length === 0) return [];

      donchianResults = new Array(dataList.length);

      for (let i = 0; i < dataList.length; i++) {
        const start = Math.max(0, i - period + 1);
        let highest = -Infinity;
        let lowest = Infinity;

        for (let j = start; j <= i; j++) {
          const c = dataList[j];
          if (!c) continue;
          if (Number.isFinite(c.high) && c.high > highest) highest = c.high;
          if (Number.isFinite(c.low) && c.low < lowest) lowest = c.low;
        }

        const upper = highest === -Infinity ? null : highest;
        const lower = lowest === Infinity ? null : lowest;
        const mid   = (upper != null && lower != null) ? (upper + lower) / 2 : null;

        donchianResults[i] = {
          upper,
          mid,
          lower,
          timestamp: dataList[i].timestamp,
          dataIndex: i
        };
      }
    }

    // return pivotResults
    return {
      pivot: pivotResults,
      donchian: donchianResults
    };
  },
  
  // draw: draws the pivot lines across visible range; no signals.
  // Expects indicator.result to be an array (calc returns an array).
  draw: ({ ctx, indicator, xAxis, yAxis, style = {} }) => {
    if (!ctx || !indicator?.result || !xAxis || !yAxis) return false;
    
    const drawPivot = () => {
      let list = indicator.result.pivot || [];
      if (!Array.isArray(list)) return false;

      const { from = 0, to = list.length - 1 } = xAxis._range || xAxis.range || {};
      const start = Math.max(0, from);
      const end = Math.min(list.length - 1, to);

      ctx.save();      

      // default styles (can be overridden by passing style object)
      const styles = {
        p: { strokeStyle: style.pColor || '#f59e0b', lineWidth: 2, dash: [] },
        r1: { strokeStyle: style.r1Color || '#DAA61C', lineWidth: 1.1, dash: [] },
        r2: { strokeStyle: style.r2Color || '#DAA61C', lineWidth: 1.1, dash: [4, 2] },
        r3: { strokeStyle: style.r3Color || '#DAA61C', lineWidth: 1.1, dash: [2, 2] },
        r4: { strokeStyle: style.r4Color || '#DAA61C', lineWidth: 1, dash: [2, 4] },
        r5: { strokeStyle: style.r5Color || '#DAA61C', lineWidth: 1, dash: [1, 3] },
        s1: { strokeStyle: style.s1Color || '#DAA61C', lineWidth: 1.1, dash: [] },
        s2: { strokeStyle: style.s2Color || '#DAA61C', lineWidth: 1.1, dash: [4, 2] },
        s3: { strokeStyle: style.s3Color || '#DAA61C', lineWidth: 1.1, dash: [2, 2] },
        s4: { strokeStyle: style.s4Color || '#DAA61C', lineWidth: 1, dash: [2, 4] },
        s5: { strokeStyle: style.s5Color || '#DAA61C', lineWidth: 1, dash: [1, 3] }
      };

      
      // generic function: draw continuous horizontal-level line for a given key.
      // since pivot levels are same across a trading day, we can draw them per index using value at that index.
      const drawLevelLine = (key, opt) => {
        ctx.beginPath();
        if (opt.dash && ctx.setLineDash) ctx.setLineDash(opt.dash);
        ctx.lineWidth = opt.lineWidth;
        ctx.strokeStyle = opt.strokeStyle;

        let moved = false;
        for (let i = start; i <= end; i++) {
          const d = list[i];
          if (!d) continue;
          const v = d[key];
          if (v == null || !Number.isFinite(v)) continue;
          const x = xAxis.convertToPixel(i);
          const y = yAxis.convertToPixel(v);


          const isSignal = d?.signal || ''
          const isBuy = i%2===0
          if(key==='p' && isSignal) {
            ctx.beginPath()
            ctx.arc(x, y, 14, 0, Math.PI * 2)
            ctx.fillStyle = isBuy ? 'rgba(22,163,74,0.18)' : 'rgba(239,68,68,0.18)'
            ctx.fill()

            ctx.fillStyle = isBuy ? '#16a34a' : '#ef4444'
            ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y)
          }

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

      // draw all levels
      Object.keys(styles).forEach(k => {
        drawLevelLine(k, styles[k]);
      });

      ctx.restore();
      return true;

    }

    const drawDonchian = () => {
      const list = indicator.result?.donchian || [];
      if (!Array.isArray(list)) return false;

      const { from = 0, to = list.length - 1 } = xAxis._range || xAxis.range || {};
      const start = Math.max(0, from);
      const end   = Math.min(list.length - 1, to);

      ctx.save();

      // default styles (can be overridden by passing style object)
      // const d = list[end];
      // console.log("print de ",end,  d)
      // if(d) {
      //   const txt = `UP: ${d.upper.toFixed(2)} MID: ${d.mid.toFixed(2)} LOW: ${d.lower.toFixed(2)}`; 
      //   console.log("print axisViewRect", xAxis,  xAxis.viewRect)
      //   const xHead = xAxis.viewRect.right - 6; // example x position
      //   const yHead = yAxis.convertToPixel(d.mid);
      //   ctx.fillText(txt, xHead, yHead);
      // }

      // Line colors (you can customize)
      const styles = {
        upper: { strokeStyle: style.upperColor || '#0ea5e9', lineWidth: 1.2, dash: [] },
        mid:   { strokeStyle: style.midColor   || '#94a3b8', lineWidth: 1,   dash: [4, 2] },
        lower: { strokeStyle: style.lowerColor || '#0ea5e9', lineWidth: 1.2, dash: [] }
      };

      const drawLine = (key, opt) => {
        ctx.beginPath();
        if (opt.dash && ctx.setLineDash) ctx.setLineDash(opt.dash);
        ctx.lineWidth = opt.lineWidth;
        ctx.strokeStyle = opt.strokeStyle;

        let moved = false;
        for (let i = start; i <= end; i++) {
          const d = list[i];
          if (!d || d[key] == null || !Number.isFinite(d[key])) continue;

          const x = xAxis.convertToPixel(i);
          const y = yAxis.convertToPixel(d[key]);

          if (!moved) {
            ctx.moveTo(x, y);
            moved = true;
          } else {
            ctx.lineTo(x, y);
          }
        }

        if (moved) ctx.stroke();
        ctx.setLineDash([]); // reset
      };

      // draw 3 lines
      drawLine('upper', styles.upper);
      drawLine('mid', styles.mid);
      drawLine('lower', styles.lower);

      ctx.restore();
      return true;
    }
    
    drawPivot()
    drawDonchian()
  }
};



