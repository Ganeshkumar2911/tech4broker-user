let chartInstance = null;

export const setChart = (instance) => {
    chartInstance = instance;
};

export const getChart = () => chartInstance;

export const getSymbolPricePrecision = (symbol, candles = []) => {
    if (candles && Array.isArray(candles) && candles.length > 0) {
        const lastCandle = candles.at(-1);
        const sample = Number(lastCandle?.close || lastCandle?.open || 0);
        if (sample > 0) {
            if (sample < 2) return 5;       // EURUSD, GBPUSD, AUDUSD, etc. (e.g. 1.16125)
            if (sample < 50) return 4;      // low price assets
            if (sample < 500) return 3;     // e.g. USDJPY ~150.235
            return 2;                       // XAUUSD, BTCUSD, Index, etc.
        }
    }

    const sym = String(symbol || '').toUpperCase();
    if (sym.includes('JPY')) return 3;
    if (sym.includes('XAU') || sym.includes('BTC') || sym.includes('ETH') || sym.includes('US30') || sym.includes('NAS100') || sym.includes('SPX')) {
        return 2;
    }
    return 5;
};

//chart types
export const chartTypes = [
    { value: "candle_solid", label: "Candle Solid", img: '/candle-icons/solid.svg', darkImg: '/candle-icons/solid-dark.svg' },
    { value: "candle_stroke", label: "Candle Stroke", img: '/candle-icons/hollow.svg', darkImg: '/candle-icons/hollow-dark.svg' },
    { value: "candle_up_stroke", label: "Candle Up Stroke", img: '/candle-icons/up-stroke.svg', darkImg: '/candle-icons/up-stroke-dark.svg' },
    { value: "candle_down_stroke", label: "Candle Down Stroke", img: '/candle-icons/down-stroke.svg', darkImg: '/candle-icons/down-stroke-dark.svg' },
    { value: "ohlc", label: "OHLC", img: '/candle-icons/bars.svg', darkImg: '/candle-icons/bars-dark.svg' },
    { value: "area", label: "Area", img: '/candle-icons/area.svg', darkImg: '/candle-icons/area-dark.svg' },
];

//intervals
export const intervals = [
    { label: '1 m', value: 'minute', span: 1, type: 'minute' },
    { label: '3 m', value: '3minute', span: 3, type: 'minute' },
    { label: '5 m', value: '5minute', span: 5, type: 'minute' },
    { label: '10 m', value: '10minute', span: 10, type: 'minute' },
    { label: '15 m', value: '15minute', span: 15, type: 'minute' },
    { label: '30 m', value: '30minute', span: 30, type: 'minute' },
    { label: '60 m', value: '60minute', span: 60, type: 'minute' },
    { label: '1 D', value: 'day', span: 1, type: 'day' },
];

export const isMainIndicator = (indicatorOrName) => {
    if (!indicatorOrName) return false;
    const name = typeof indicatorOrName === 'string' ? indicatorOrName : (indicatorOrName.name || '');
    const type = typeof indicatorOrName === 'object' ? indicatorOrName.type : '';
    const series = typeof indicatorOrName === 'object' ? indicatorOrName.series : '';

    if (type === 'main' || series === 'price') return true;
    if (type === 'sub' || series === 'volume') return false;

    const subList = [
        'MACD', 'RSI', 'KDJ', 'CCI', 'BIAS', 'WR', 'BRAR', 'DMI',
        'CR', 'PSY', 'AO', 'TRIX', 'MTM', 'VR', 'EMV', 'ROC',
        'OBV', 'PVT', 'AVP', 'VOL'
    ];
    if (subList.includes(name.toUpperCase())) return false;

    // Default to main for everything else (MA, SMA, EMA, BOLL, SAR, etc.)
    return true;
};

export const defaultIndicators = [
    { name: 'MA', type: 'main' },
    { name: 'EMA', type: 'main' },
    { name: 'SMA', type: 'main' },
    { name: 'BBI', type: 'main' },
    { name: 'BOLL', type: 'main' },
    { name: 'SAR', type: 'main' },
    { name: 'DMA', type: 'main' },
    { name: 'MCMA', type: 'main' },

    { name: 'MACD', type: 'sub' },
    { name: 'RSI', type: 'sub' },
    { name: 'KDJ', type: 'sub' },
    { name: 'CCI', type: 'sub' },
    { name: 'BIAS', type: 'sub' },
    { name: 'WR', type: 'sub' },
    { name: 'BRAR', type: 'sub' },
    { name: 'DMI', type: 'sub' },
    { name: 'CR', type: 'sub' },
    { name: 'PSY', type: 'sub' },
    { name: 'AO', type: 'sub' },
    { name: 'TRIX', type: 'sub' },
    { name: 'MTM', type: 'sub' },
    { name: 'VR', type: 'sub' },
    { name: 'EMV', type: 'sub' },
    { name: 'ROC', type: 'sub' },
    { name: 'OBV', type: 'sub' },
    { name: 'PVT', type: 'sub' },
    { name: 'AVP', type: 'sub' },
    { name: 'VOL', type: 'sub' }
];

export const entryArrow = {
    checkEventOn: () => false,
    name: 'arrowMarker',
    totalStep: 1,

    createPointFigures: ({ coordinates, overlay }) => {
        if (!coordinates.length) return []

        const { x, y } = coordinates[0]
        const signal = overlay.extendData?.signal

        return [{
            type: 'entryArrow',
            ignoreEvent: true,

            attrs: {
                x,
                y,
                size: 6,
                direction: signal === 'BUY' ? 'up' : 'down'
            },
            styles: {
                style: 'solid',
                color: signal === 'BUY' ? '#135fec' : '#FF0000'
            }
        }]

    }
}

export const arrowFigure = {
    name: 'entryArrow',

    draw: (ctx, attrs, styles) => {
        const { x, y } = attrs
        const signal = attrs.direction === 'up' ? 'BUY' : 'SELL'

        const radius = 7

        const bgColor = signal === 'BUY' ? '#16a34a' : '#ef4444' // green / red
        const text = signal === 'BUY' ? 'B' : 'S'

        ctx.save()

        // 🔵 Draw circle
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = bgColor
        ctx.fill()



        // 🔤 Draw text (centered)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, x - 0.5, y) // slight offset for visual centering

        ctx.restore()
    },

    checkEventOn: () => false
}