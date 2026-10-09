
export const TVTest = {
  name: 'TV_TEST_SIMPLE',
  shortName: 'TV Simple',
  series: 'price',
  type: 'main',
  // calcParams: single config object allowed
  calcParams: [{
    session: '',                 // optional session string "HHMM-HHMM". Empty = ignore session
    sessionOffsetMinutes: 330,   // default IST offset (only used if session provided)
    atrPeriod: 5,
    atrFactor: 5.0
  }],
  figures: [
    { key: 'supertrend', title: 'Supertrend', type: 'line' },
    { key: 'PP', title: 'PP', type: 'line' }
  ],

  // --- Helpers (compact) ---
  _computeHeikinAshi(dataList) {
    const n = dataList.length
    const ha = new Array(n)
    for (let i = 0; i < n; i++) {
      const o = dataList[i].open ?? 0
      const h = dataList[i].high ?? 0
      const l = dataList[i].low ?? 0
      const c = dataList[i].close ?? 0
      const haClose = (o + h + l + c) / 4
      if (i === 0) {
        const haOpen = (o + c) / 2
        ha[i] = { haOpen, haHigh: Math.max(h, haOpen, haClose), haLow: Math.min(l, haOpen, haClose), haClose }
      } else {
        const prev = ha[i - 1]
        const haOpen = (prev.haOpen + prev.haClose) / 2
        ha[i] = { haOpen, haHigh: Math.max(h, haOpen, haClose), haLow: Math.min(l, haOpen, haClose), haClose }
      }
    }
    return ha
  },

  _computeATR(barsArr, idx, period) {
    if (!Array.isArray(barsArr) || barsArr.length === 0) return 0
    const p = Math.max(1, Math.floor(period || 1))
    const start = Math.max(0, idx - p + 1)
    let sum = 0
    for (let j = start; j <= idx; j++) {
      const high = barsArr[j].high ?? 0
      const low = barsArr[j].low ?? 0
      const prevClose = j > 0 ? (barsArr[j - 1].close ?? 0) : (barsArr[j].close ?? 0)
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose))
      sum += tr
    }
    const len = idx - start + 1
    return len > 0 ? sum / len : 0
  },

  // previous full-day OHLC:
  _previousDayOHLC(dataList) {
    if (!Array.isArray(dataList) || dataList.length === 0) return { o: NaN, h: NaN, l: NaN, c: NaN }
    const dates = dataList.map(d => {
      const dt = new Date(d.timestamp)
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    })
    const lastDate = dates[dates.length - 1]
    let idx = dates.length - 1
    while (idx >= 0 && dates[idx] === lastDate) idx--
    if (idx < 0) {
      const d = dataList[0]
      return { o: d.open, h: d.high, l: d.low, c: d.close }
    }
    const targetDate = dates[idx]
    let o = NaN, h = -Infinity, l = Infinity, c = NaN
    let j = idx
    while (j >= 0 && dates[j] === targetDate) {
      const bar = dataList[j]
      o = isNaN(o) ? (bar.open ?? 0) : o
      h = Math.max(h, bar.high ?? -Infinity)
      l = Math.min(l, bar.low ?? Infinity)
      c = bar.close ?? 0
      j--
    }
    if (h === -Infinity) h = NaN
    if (l === Infinity) l = NaN
    return { o, h, l, c }
  },

  // session checker (optional). If session is empty, always true.
  _inSession(sessionStr, ts, offsetMinutes = 330) {
    if (!sessionStr) return true
    try {
      const parts = sessionStr.split('-').map(s => s.trim())
      if (parts.length < 2) return true
      const parseHHMM = s => { s = String(s).padStart(4,'0'); return parseInt(s.slice(0,2))*60 + parseInt(s.slice(2)) }
      const fromMin = parseHHMM(parts[0]), toMin = parseHHMM(parts[1])
      const dt = new Date(ts)
      const utcMin = dt.getUTCHours()*60 + dt.getUTCMinutes()
      let localMin = (utcMin + offsetMinutes) % 1440
      if (localMin < 0) localMin += 1440
      if (fromMin <= toMin) return localMin >= fromMin && localMin <= toMin
      return localMin >= fromMin || localMin <= toMin
    } catch (e) { return true }
  },

  // --- calc: compact and focused ---
  calc: (dataList, indicator) => {
    const defaults = {
      session: '',
      sessionOffsetMinutes: 330,
      atrPeriod: 5,
      atrFactor: 5.0
    }
    const cfgRaw = indicator?.calcParams?.[0] ?? indicator?.calcParams ?? {}
    const cfg = { ...defaults, ...(typeof cfgRaw === 'object' ? cfgRaw : {}) }

    const n = dataList.length
    if (n === 0) return []

    const ha = TVTest._computeHeikinAshi(dataList)
    const prevDay = TVTest._previousDayOHLC(dataList)
    const PP = (prevDay.h + prevDay.l + prevDay.c) / 3
    const s1 = (2 * PP) - prevDay.h
    const r1 = (2 * PP) - prevDay.l

    // Prepare result array (minimal fields)
    const res = new Array(n)

    // Prepare data for ATR on Heikin-Ashi
    const haBars = ha.map(h => ({ high: h.haHigh, low: h.haLow, close: h.haClose }))

    // For simple crossover detection, keep previous HA-close
    let prevHaClose = null

    for (let i = 0; i < n; i++) {
      const bar = dataList[i]
      const ts = bar.timestamp
      const inSession = TVTest._inSession(cfg.session, ts, cfg.sessionOffsetMinutes)

      const h = ha[i] || {}
      const close = h.haClose ?? (bar.close ?? 0)
      const open = h.haOpen ?? (bar.open ?? 0)

      // supertrend (Heikin-Ashi-based ATR)
      const atr = TVTest._computeATR(haBars, i, cfg.atrPeriod)
      // use simple band + rule: direction = -1 when Heikin-Ashi close > upperBandFinal (keeps previous logic compact)
      const upper = close + cfg.atrFactor * atr
      const lower = close - cfg.atrFactor * atr
      // simple direction: -1 if close > upper else 1 if close < lower else keep previous (we'll use local test)
      let direction = 1
      if (i > 0) {
        const prevClose = ha[i-1]?.haClose ?? dataList[i-1]?.close ?? 0
        direction = prevClose > upper ? -1 : (prevClose < lower ? 1 : 1)
      }
      const supertrend = direction === -1 ? lower : upper

      
      let signal = null
      if (prevHaClose != null && inSession) {
        if (prevHaClose <= PP && close > PP && (close > open)) signal = 'BUY'
        else if (prevHaClose >= PP && close < PP && (close < open)) signal = 'SELL'
      }

      res[i] = {
        timestamp: ts,
        dataIndex: i,
        haClose: close,
        haOpen: open,
        supertrend,
        direction,
        PP,
        s1,
        r1,
        signal
      }

      prevHaClose = close
    }

    return res
  },

  // compact draw for buy/sell markers
  draw: ({ ctx, indicator, xAxis, yAxis }) => {
    if (!ctx || !indicator?.result || !xAxis || !yAxis) return false

    const list = indicator.result
    const { from = 0, to = list.length - 1 } = xAxis._range || xAxis.range || {}
    ctx.save()
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let drew = 0
    for (let i = from; i <= to && i < list.length; i++) {
      const d = list[i]
      if (!d || !d.signal) continue
      const x = xAxis.convertToPixel(i)
      const y = yAxis.convertToPixel(d.haClose)
      ctx.beginPath()
      ctx.arc(x, y + (d.signal === 'BUY' ? -18 : 18), 10, 0, Math.PI * 2)
      ctx.fillStyle = d.signal === 'BUY' ? 'rgba(22,163,74,0.18)' : 'rgba(239,68,68,0.18)'
      ctx.fill()
      ctx.fillStyle = d.signal === 'BUY' ? '#16a34a' : '#ef4444'
      ctx.fillText(d.signal === 'BUY' ? '▲ BUY' : '▼ SELL', x, y + (d.signal === 'BUY' ? -18 : 18))
      drew++
    }
    ctx.restore()
    return drew > 0
  }
}

