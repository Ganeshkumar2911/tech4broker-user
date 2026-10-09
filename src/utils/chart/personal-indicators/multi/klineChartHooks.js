
const tradeState = {
    // Pine: long_short (1=Long, -1=Short, 0=None)
    longShort: 0, 
    // Pine: long_entered, short_entered (tracking if a position is OPEN)
    longEntered: false,
    shortEntered: false,
    // Pine: count1 (Daily signal counter)
    dailySignalCount: 0,
    // Pine: longPrice, shortPrice (Entry Price)
    longPrice: null,
    shortPrice: null,
    // Pine: last signal timestamp (for trade counting reset)
    lastSignalDay: null, 
    // User inputs
    maxTradesPerDay: 1, 
    stopLoss: 35,
    takeProfit: 50
};

// --- Helper Functions ---

// Equivalent to Pine Script's ta.change(time('D'))
const isNewDay = (currentTimestamp) => {
    const todayKey = dateKeyFromTs(currentTimestamp);
    if (tradeState.lastSignalDay === null) {
        tradeState.lastSignalDay = todayKey;
        return false;
    }
    if (tradeState.lastSignalDay !== todayKey) {
        tradeState.lastSignalDay = todayKey;
        return true;
    }
    return false;
};

// Equivalent to Pine Script's ta.valuewhen
const getEntryPrice = (signalCondition, currentClose, previousPrice) => {
    return signalCondition ? currentClose : previousPrice;
}


// --- Main Processing Function (Called on every real-time data update) ---
// This function would run when your chart data updates and gives you the indicator result.
export const processIndicatorResults = (currentIndicatorResult, klineBar) => {
    const { buy_signal, sell_signal, currentClose, timestamp } = currentIndicatorResult;

    // --- Daily Trade Counter Reset (Pine: count1 reset) ---
    if (isNewDay(timestamp)) {
        tradeState.dailySignalCount = 0;
    }

    // --- Trade Entry Logic (Pine: long_last, short_last) ---
    const rawBuy = buy_signal === 1;
    const rawSell = sell_signal === 1;

    // Check if a new entry is possible
    const longLast = rawBuy && (tradeState.longShort === 0 || tradeState.longShort === -1);
    const shortLast = rawSell && (tradeState.longShort === 0 || tradeState.longShort === 1);

    // --- SL/TP Targets ---
    let longStop = tradeState.longPrice ? tradeState.longPrice - tradeState.stopLoss : null;
    let shortStop = tradeState.shortPrice ? tradeState.shortPrice + tradeState.stopLoss : null;
    let longTake = tradeState.longPrice ? tradeState.longPrice + tradeState.takeProfit : null;
    let shortTake = tradeState.shortPrice ? tradeState.shortPrice - tradeState.takeProfit : null;

    // --- Exit Conditions (Pine: longSLhit, shortTPhit, etc.) ---
    const longSLhit = tradeState.longEntered && klineBar.low < longStop;
    const shortSLhit = tradeState.shortEntered && klineBar.high > shortStop;
    const longTPhit = tradeState.longEntered && klineBar.high > longTake;
    const shortTPhit = tradeState.shortEntered && klineBar.low < shortTake;
    
    const exitOccurred = longSLhit || shortSLhit || longTPhit || shortTPhit;

    // --- State Update ---

    // 1. Update Entry Prices (ta.valuewhen equivalent)
    if (longLast && !tradeState.longEntered) {
        tradeState.longPrice = currentClose;
    }
    if (shortLast && !tradeState.shortEntered) {
        tradeState.shortPrice = currentClose;
    }

    // 2. Update Position Status
    if (longLast && tradeState.dailySignalCount < tradeState.maxTradesPerDay) {
        tradeState.longShort = 1;
        tradeState.longEntered = true;
        tradeState.shortEntered = false;
        tradeState.dailySignalCount++;
    } else if (shortLast && tradeState.dailySignalCount < tradeState.maxTradesPerDay) {
        tradeState.longShort = -1;
        tradeState.shortEntered = true;
        tradeState.longEntered = false;
        tradeState.dailySignalCount++;
    }

    // 3. Close Position on Exit
    if (exitOccurred) {
        tradeState.longShort = 0;
        tradeState.longEntered = false;
        tradeState.shortEntered = false;
        // Optionally, reset long/shortPrice to null here
    }

    // --- Final Signal for UI/Alerts ---
    const finalBuy = (longLast && tradeState.dailySignalCount <= tradeState.maxTradesPerDay);
    const finalSell = (shortLast && tradeState.dailySignalCount <= tradeState.maxTradesPerDay);

    // Return the current trade state, which you can use to draw shapes/alerts on the chart
    return {
        finalBuy,
        finalSell,
        longSLhit,
        shortSLhit,
        longTPhit,
        shortTPhit,
        currentPosition: tradeState.longShort
    };
}