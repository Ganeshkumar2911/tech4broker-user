// returns array same length as dataList of {haOpen, haHigh, haLow, haClose}
_computeHeikinAshi: (dataList) => {
  const n = dataList.length
  const ha = new Array(n)
  if (n === 0) return ha
  // haClose = (open + high + low + close) / 4
  // haOpen = (prev_haOpen + prev_haClose) / 2, initialize with (open+close)/2 of first bar
  for (let i = 0; i < n; i++) {
    const o = dataList[i].open ?? 0
    const h = dataList[i].high ?? 0
    const l = dataList[i].low ?? 0
    const c = dataList[i].close ?? 0
    const haClose = (o + h + l + c) / 4
    if (i === 0) {
      const haOpen = (o + c) / 2
      const haHigh = Math.max(h, haOpen, haClose)
      const haLow = Math.min(l, haOpen, haClose)
      ha[i] = { haOpen, haHigh, haLow, haClose }
    } else {
      const prev = ha[i - 1]
      const haOpen = (prev.haOpen + prev.haClose) / 2
      const haHigh = Math.max(h, haOpen, haClose)
      const haLow = Math.min(l, haOpen, haClose)
      ha[i] = { haOpen, haHigh, haLow, haClose }
    }
  }
  return ha
}


const Donchian = {
  name: 'Donchian',
  shortName: 'DN',
  series: 'price',
  type: 'main',
  calcParams: [20, true],
  figures: [
    { key: 'upper', title: 'Upper', type: 'line' },
    { key: 'lower', title: 'Lower', type: 'line' },
    { key: 'mid', title: 'Mid', type: 'line' }
  ],

  // helper: robust parse of calcParams
  _parseParams(indicator) {
    let raw = indicator?.calcParams
    if (typeof raw === 'string') raw = raw.split(',').map(s => s.trim())
    if (typeof raw === 'number') raw = [raw]
    if (!Array.isArray(raw)) raw = indicator?.calcParams ? [indicator.calcParams] : [20, true]

    const parsed = []
    // length
    const lenCandidate = Number(raw[0])
    const length = Number.isFinite(lenCandidate) && !Number.isNaN(lenCandidate) ? Math.max(1, Math.floor(lenCandidate)) : 20
    parsed.push(length)

    // showMid
    let showMid = true
    if (raw.length >= 2) {
      const s = raw[1]
      if (typeof s === 'boolean') showMid = s
      else if (typeof s === 'string') showMid = s.toLowerCase() === 'true'
      else if (typeof s === 'number') showMid = Boolean(s)
    }
    parsed.push(showMid)

    return { length: parsed[0], showMid: parsed[1] }
  },

  calc: (dataList, indicator) => {
    const { length, showMid } = Donchian._parseParams(indicator)
    

    const n = dataList.length
    const result = new Array(n)

    // helper to compute highest high and lowest low in a sliding window
    // naive O(n * length) but length typically small (20). If you need performance on 100k bars, we can optimize with deque.
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - length + 1)
      let upper = -Infinity
      let lower = Infinity

      for (let j = start; j <= i; j++) {
        const bar = dataList[j]
        const hh = bar.high ?? (bar.close ?? 0)
        const ll = bar.low ?? (bar.close ?? 0)
        if (hh > upper) upper = hh
        if (ll < lower) lower = ll
      }

      if (!isFinite(upper)) upper = null
      if (!isFinite(lower)) lower = null

      const mid = (upper != null && lower != null && showMid) ? (upper + lower) / 2 : null

      // signal detection on candle-close crossing of previous bar vs current bar
      let signal = null
      if (i > 0 && upper != null && lower != null) {
        const prevClose = dataList[i - 1].close ?? 0
        const close = dataList[i].close ?? 0
        // crossed above upper
        if (prevClose <= (result[i - 1]?.upper ?? upper) && close > upper) signal = 'BUY'
        // crossed below lower
        else if (prevClose >= (result[i - 1]?.lower ?? lower) && close < lower) signal = 'SELL'
      }

      result[i] = {
        upper,
        lower,
        mid,
        signal,
        dataIndex: i,
        timestamp: dataList[i].timestamp
      }
    }

    return result
  },

  draw: ({ ctx, indicator, xAxis, yAxis }) => {
    if (!ctx || !indicator?.result || !xAxis || !yAxis) return false
    const list = indicator.result
    const { from = 0, to = list.length - 1 } = xAxis._range || xAxis.range || {}
    ctx.save()
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    let drawn = 0
    for (let i = from; i <= to && i < list.length; i++) {
      const d = list[i]
      if (!d) continue

      // draw mid small dot if available
      if (d.mid != null) {
        const xm = xAxis.convertToPixel(i)
        const ym = yAxis.convertToPixel(d.mid)
        ctx.beginPath()
        ctx.arc(xm, ym, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(150,150,150,0.9)'
        ctx.fill()
      }

      if (!d.signal) continue

      const isBuy = d.signal === 'BUY'
      const priceRef = isBuy ? d.upper : d.lower
      const x = xAxis.convertToPixel(i)
      const y = yAxis.convertToPixel(priceRef) + (isBuy ? -22 : 22)

      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.fillStyle = isBuy ? 'rgba(22,163,74,0.18)' : 'rgba(239,68,68,0.18)'
      ctx.fill()

      ctx.fillStyle = isBuy ? '#16a34a' : '#ef4444'
      ctx.fillText(isBuy ? '▲ BUY' : '▼ SELL', x, y)

      drawn++
    }

    ctx.restore()
    return drawn > 0
  }
}

export default Donchian
