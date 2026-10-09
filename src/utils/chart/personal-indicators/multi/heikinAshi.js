
export const dateKeyFromTs = (ts) => {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    // NOTE: This assumes pivotTF='D' (Daily). For other HTFs (4H, 1W), this logic must change.
    return `${yyyy}-${mm}-${dd}`;
}

export const getTypeFromParams = (t) => {
    t = (typeof t === 'string') ? t.toLowerCase() : String(t).toLowerCase();
    if (t === 'traditional') return 'traditional';
    if (t === 'classic' || t === 'classsic') return 'classic'; 
    if (t === 'fibonacci' || t === 'fib') return 'fibonacci';
    return 'classic'; // default
}

export const computeHeikinAshi = (dataList) => {
    const haBars = new Array(dataList.length).fill(null);
    let prevHAClose = dataList.length > 0 ? dataList[0].close : null;
    let prevHAOpen = dataList.length > 0 ? dataList[0].open : null;

    for (let i = 0; i < dataList.length; i++) {
        const k = dataList[i];
        if (!k) continue;

        const haClose = (k.open + k.high + k.low + k.close) / 4;
        let haOpen;

        if (i === 0) {
            haOpen = k.open;
        } else {
            haOpen = (prevHAOpen + prevHAClose) / 2;
        }

        const haHigh = Math.max(k.high, haOpen, haClose);
        const haLow = Math.min(k.low, haOpen, haClose);

        haBars[i] = {
            open: haOpen,
            close: haClose,
            high: haHigh,
            low: haLow,
            timestamp: k.timestamp
        };

        prevHAClose = haClose;
        prevHAOpen = haOpen;
    }
    return haBars;
};

// True Range calculation
export const computeTRs = (dataList) => {
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

export const highestWithIndex = (dataList, start, end) => {
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
    return { value: Number.isFinite(hh) ? hh : null, index: hhIdx };
}

export const lowestWithIndex = (dataList, start, end) => {
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
    return { value: Number.isFinite(ll) ? ll : null, index: llIdx };
}

export const crossover = (currentClose, previousClose, level) => {
    if(previousClose == null || level == null) return false;
    return (previousClose <= level) && (currentClose > level);
}
export const crossunder = (currentClose, previousClose, level) => {
    if(previousClose == null || level == null) return false;
    return (previousClose >= level) && (currentClose < level);
}