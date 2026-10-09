
// import { handleAlert } from '../stores/utils/alert'

export const Bollinger = {
  name: 'Bollinger Band',
  shortName: 'BOLL',
  series: 'price',
  type: 'main',
  calcParams: [20, 2, 'reversion', 1],
  precision: 4,
  figures: [
    { key: 'up', title: 'UP', type: 'line' },
    { key: 'mid', title: 'MID', type: 'line' },
    { key: 'dn', title: 'DN', type: 'line' }
  ],

  _parseParams(ind) {
    let raw = ind?.calcParams;
    if (typeof raw === 'string') raw = raw.split(',').map(s => s.trim());
    if (typeof raw === 'number') raw = [raw];
    if (!Array.isArray(raw)) raw = ind?.calcParams ? [ind.calcParams] : [20, 2, 'reversion', 1];

    const period = Math.max(1, Math.floor(Number(raw[0] ?? 20)));
    const mult = Number.isFinite(Number(raw[1])) ? Math.max(0, Number(raw[1])) : 2;
    const mode = raw[2] && String(raw[2]).toLowerCase() === 'breakout' ? 'breakout' : 'reversion';
    const confirm = Number.isFinite(Number(raw[3])) ? Math.max(1, Math.floor(Number(raw[3]))) : 1;
    return { period, mult, mode, confirm };
  },

  // faster rolling stddev: maintain sum and sumsq for O(1) update
  _updateWindowStats(window, sumRef, sumSqRef, value, period) {
    window.push(value);
    sumRef.sum += value;
    sumSqRef.sumSq += value * value;
    if (window.length > period) {
      const removed = window.shift();
      sumRef.sum -= removed;
      sumSqRef.sumSq -= removed * removed;
    }
    const len = window.length;
    if (len === 0) return { mean: 0, sd: 0, len: 0 };
    const mean = sumRef.sum / len;
    // variance = (sumSq / n) - mean^2; protect negative tiny precision noise
    let variance = (sumSqRef.sumSq / len) - (mean * mean);
    if (variance < 0 && variance > -1e-12) variance = 0;
    const sd = Math.sqrt(Math.max(0, variance));
    return { mean, sd, len };
  },

  calc: (dataList, indicator) => {
    const { period, mult, mode, confirm } = Bollinger._parseParams(indicator);
    const n = Array.isArray(dataList) ? dataList.length : 0;
    if (n === 0) {
      if (indicator) indicator._indexToTs = [];
      return {};
    }

    // output object keyed by timestamp
    const out = {};
    const indexToTs = new Array(n);

    // rolling window state (value = close)
    const window = [];
    const sumRef = { sum: 0 };
    const sumSqRef = { sumSq: 0 };

    // reversion mode counters
    let upperOvershootCounter = 0;
    let lowerOvershootCounter = 0;

    // helper: EPS scaled to channel size
    const epsFor = (a, b) => {
      const scale = Math.max(Math.abs(a || 0), Math.abs(b || 0), 1);
      return Math.max(scale * 1e-8, 1e-12);
    };

    // fallback to recompute previous bands for prev index if needed
    const recomputeBands = (endIdx) => {
      // compute mid & sd using closes [endIdx - period + 1 .. endIdx]
      const start = Math.max(0, endIdx - period + 1);
      let s = 0, ss = 0, cnt = 0;
      for (let j = start; j <= endIdx; j++) {
        const v = Number.isFinite(dataList[j]?.close) ? dataList[j].close : 0;
        s += v; ss += v * v; cnt++;
      }
      if (cnt === 0) return { mid: null, up: null, dn: null };
      const mean = s / cnt;
      let varr = (ss / cnt) - (mean * mean);
      if (varr < 0 && varr > -1e-12) varr = 0;
      const sd = Math.sqrt(Math.max(0, varr));
      return { mid: mean, up: mean + mult * sd, dn: mean - mult * sd };
    };

    for (let i = 0; i < n; i++) {
      const k = dataList[i];
      const ts = k?.timestamp ?? null;
      indexToTs[i] = ts;

      const close = Number.isFinite(k?.close) ? k.close : 0;

      // update rolling stats
      const { mean, sd, len } = Bollinger._updateWindowStats(window, sumRef, sumSqRef, close, period);
      const mid = (len === period) ? mean : null;
      const up = (len === period) ? (mean + mult * sd) : null;
      const dn = (len === period) ? (mean - mult * sd) : null;

      // default
      let signal = null;
      let triggerPrice = null;
      let level = null;

      if (i > 0 && mid != null && up != null && dn != null) {
        // robust prev bands retrieval
        let prevUp = null, prevDn = null, prevMid = null;
        const prevTs = dataList[i - 1]?.timestamp;
        if (prevTs && out[prevTs]) {
          prevUp = out[prevTs].up;
          prevDn = out[prevTs].dn;
          prevMid = out[prevTs].mid;
        } else {
          const rec = recomputeBands(i - 1);
          prevMid = rec.mid; prevUp = rec.up; prevDn = rec.dn;
        }

        const prevClose = Number.isFinite(dataList[i - 1]?.close) ? dataList[i - 1].close : 0;

        const EPS_up = epsFor(up, prevUp);
        const EPS_dn = epsFor(dn, prevDn);

        if (mode === 'breakout') {
          // canonical breakout: prevClose <= prevUp  AND close > up  -> BUY
          if (prevClose <= (prevUp ?? up) + EPS_up && close > up + EPS_up) {
            signal = 'BUY'; triggerPrice = up; level = 'UP';
          } else if (prevClose >= (prevDn ?? dn) - EPS_dn && close < dn - EPS_dn) {
            signal = 'SELL'; triggerPrice = dn; level = 'DN';
          }
        } else { // reversion
          // decrement counters
          if (upperOvershootCounter > 0) upperOvershootCounter--;
          if (lowerOvershootCounter > 0) lowerOvershootCounter--;

          // detect overshoot: both prev and current are beyond band (strong overshoot)
          const nowUpperOvershoot = (prevClose > (prevUp ?? up) + EPS_up) && (close > up + EPS_up);
          const nowLowerOvershoot = (prevClose < (prevDn ?? dn) - EPS_dn) && (close < dn - EPS_dn);

          if (nowUpperOvershoot) upperOvershootCounter = confirm;
          if (nowLowerOvershoot) lowerOvershootCounter = confirm;

          // recovery detection: if overshoot active and we cross back across band on close
          // when we had an upper overshoot and now prevClose >= up AND close < up -> SELL
          if (upperOvershootCounter > 0 && (prevClose >= up - EPS_up) && (close < up - EPS_up)) {
            signal = 'SELL'; triggerPrice = up; level = 'UP';
            upperOvershootCounter = 0; lowerOvershootCounter = 0;
          }

          // when we had lower overshoot active and now prevClose <= dn AND close > dn -> BUY
          if (lowerOvershootCounter > 0 && (prevClose <= dn + EPS_dn) && (close > dn + EPS_dn)) {
            signal = 'BUY'; triggerPrice = dn; level = 'DN';
            upperOvershootCounter = 0; lowerOvershootCounter = 0;
          }
        }
      }

      out[ts] = {
        mid,
        up,
        dn,
        // signal fields requested: simple string + metadata on the same object
        signal,         // 'BUY'|'SELL'|null
        triggerPrice,   // numeric or null
        level,          // 'UP' | 'DN' | null
        dataIndex: i,
        timestamp: ts,
        _close: close   // included for drawing fallback
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

    const { from = 0, to = (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : 0)) } = xAxis._range || xAxis.range || {};
    const start = Math.max(0, from);
    const end = Math.min(to, (indicator._indexToTs ? indicator._indexToTs.length - 1 : (Array.isArray(indicator.result) ? indicator.result.length - 1 : to)));

    ctx.save();
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = start; i <= end; i++) {
      const d = getResultByIndex(indicator, i);
      if (!d) continue;
      if (!d.signal) continue;

      const x = xAxis.convertToPixel(i);

      // choose numeric price reference: prefer mid, fall back to up/dn, then close (internal)
      const priceRef = (d.mid != null && Number.isFinite(d.mid)) ? d.mid :
        (d.up != null && Number.isFinite(d.up)) ? d.up :
          (d.dn != null && Number.isFinite(d.dn)) ? d.dn :
            (d._close != null ? d._close : 0);

      const y = yAxis.convertToPixel(priceRef) + (d.signal === 'BUY' ? -18 : 18);

      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fillStyle = d.signal === 'BUY' ? 'rgba(22,163,74,0.18)' : 'rgba(239,68,68,0.18)';
      ctx.fill();

      ctx.fillStyle = d.signal === 'BUY' ? '#16a34a' : '#ef4444';
      ctx.fillText(d.signal === 'BUY' ? '▲ BUY' : '▼ SELL', x, y);
    }

    ctx.restore();
  }
};