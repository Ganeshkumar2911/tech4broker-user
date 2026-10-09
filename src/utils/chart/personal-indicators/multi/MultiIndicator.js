// MultiIndicator.js (Assume helpers are imported/defined)
import { crossunder, crossover, lowestWithIndex, highestWithIndex, computeTRs, computeHeikinAshi, getTypeFromParams, dateKeyFromTs } from './heikinAshi';

// --- Parameter Parsing Function ---
const parseParams = (indicator) => {
    const [
        showPVlvl, atrPeriod, factor, pivotTF, pivotType, pivotSource, len1, len2, len3
    ] = indicator.calcParams;
    
    return {
        showPVlvl, 
        atrPeriod, 
        factor, 
        pivotTF, 
        pivotType: getTypeFromParams(pivotType), 
        pivotSource, 
        len1, 
        len2, 
        len3
    }
}


// --- Main Indicator Definition ---
export const MultiIndicator = {
    name: 'MultiIndicatorNew',
    shortName: 'MultiIndicatorNew',
    series: 'price',
    type: 'main',
    // Default values match Pine Script inputs
    calcParams: [
        true, // 0: showPVlvl (pivots)
        5,    // 1: ATR Length
        5.0,  // 2: Factor
        'D',  // 3: Pivot TF (Day)
        'Classic', // 4: Pivot Type
        'Candle Sticks', // 5: Pivot Source
        13,   // 6: Donchian L1
        9,    // 7: Donchian L2
        5     // 8: Donchian L3
    ],
    precision: 4, 
    shouldOhlc: false,
    figures: [
        // Pivot Lines
        { key: 'p', title: 'P: ', type: 'line' }, { key: 'r1', title: 'R1: ', type: 'line' },
        { key: 's1', title: 'S1: ', type: 'line' }, { key: 'r2', title: 'R2: ', type: 'line' }, 
        { key: 's2', title: 'S2: ', type: 'line' }, { key: 'r3', title: 'R3: ', type: 'line' }, 
        { key: 's3', title: 'S3: ', type: 'line' }, { key: 'r4', title: 'R4: ', type: 'line' }, 
        { key: 's4', title: 'S4: ', type: 'line' }, { key: 'r5', title: 'R5: ', type: 'line' }, 
        { key: 's5', title: 'S5: ', type: 'line' },
        // Supertrend Lines
        { key: 'st_up', title: 'ST Up', type: 'line' },
        { key: 'st_down', title: 'ST Down', type: 'line' },
    ],

    // --- CALCULATION FUNCTION ---
    calc: (dataList, indicator) => {
      try {
        if (!Array.isArray(dataList) || dataList.length === 0) {
            if (indicator) indicator._indexToTs = [];
            return {};
        }

        const len = dataList.length;
        const params = parseParams(indicator);
        const { showPVlvl, atrPeriod, factor, pivotType, pivotSource, len1, len2, len3 } = params;
        const out = {};
        const indexToTs = new Array(len);

        // 1. Data Source (Candle Sticks or Heikin Ashi)
        const sourceData = pivotSource === 'Heikin Ashi' 
            ? computeHeikinAshi(dataList) 
            : dataList;

        // 2. Aggregate HTF OHLC (Simulating request.security('D'))
        const htBars = {};
        for (let i = 0; i < sourceData.length; i++) {
            const k = sourceData[i];
            const key = dateKeyFromTs(k.timestamp); 
            if (!htBars[key]) {
                htBars[key] = { high: k.high, low: k.low, close: k.close, open: k.open, firstIdx: i };
            } else {
                const B = htBars[key];
                if (k.high > B.high) B.high = k.high;
                if (k.low < B.low) B.low = k.low;
                B.close = k.close;
            }
        }
        const dateKeys = Object.keys(htBars).sort();
        const prevOfDate = {};
        for (let i = 1; i < dateKeys.length; i++) prevOfDate[dateKeys[i]] = dateKeys[i - 1];

        // 3. Pivot Level Formulae
        const computeLevels = (typeName, H, L, C) => {
            H = Number(H); L = Number(L); C = Number(C);
            let P = (H + L + C) / 3;
            let range = (H - L);
            
            if (typeName === 'Traditional' || typeName === 'classic') {
                const R1 = 2 * P - L; const S1 = 2 * P - H;
                const R2 = P + range; const S2 = P - range;
                const R3 = H + 2 * (P - L); const S3 = L - 2 * (H - P);
                const R4 = R3 + range; const S4 = S3 - range;
                const R5 = R3 + 2 * range; const S5 = S3 - 2 * range;
                return { P, R1, R2, R3, R4, R5, S1, S2, S3, S4, S5 };
            }

            if (typeName === 'fibonacci') {
                const R1 = P + 0.382 * range; const S1 = P - 0.382 * range;
                const R2 = P + 0.618 * range; const S2 = P - 0.618 * range;
                const R3 = P + 1.0 * range; const S3 = P - 1.0 * range;
                const R4 = P + 1.382 * range; const S4 = P - 1.382 * range;
                const R5 = P + 1.618 * range; const S5 = P - 1.618 * range;
                return { P, R1, R2, R3, R4, R5, S1, S2, S3, S4, S5 };
            }
            return {};
        };

        // 4. Supertrend Preparation (ATR)
        const TR = computeTRs(sourceData);
        const ATR = new Array(len).fill(null);
        if (len >= atrPeriod) {
            let sum = 0;
            for (let i = 0; i < atrPeriod; i++) sum += (TR[i] || 0);
            let atrPrev = sum / atrPeriod;
            ATR[atrPeriod - 1] = atrPrev;
            for (let i = atrPeriod; i < len; i++) {
                const tr = TR[i] || 0;
                atrPrev = (atrPrev * (atrPeriod - 1) + tr) / atrPeriod;
                ATR[i] = atrPrev;
            }
        }
        
        let prevFinalUpper = null;
        let prevFinalLower = null;
        let prevSuper = null;
        // Fix: Use a neutral start. -1 is Up (Green), 1 is Down (Red). Start neutral.
        let prevDirection = 0; 

        // --- 5. Main Iteration ---
        for (let i = 0; i < len; i++) {
            const k = dataList[i]; // Current bar data
            const sourceK = sourceData[i]; 
            const ts = k.timestamp;
            indexToTs[i] = ts;
            
            const currentClose = Number(k.close);
            const currentOpen = Number(k.open);
            const currentHigh = Number(k.high);
            const currentLow = Number(k.low);
            const previousClose = (i > 0 && Number.isFinite(dataList[i - 1]?.close)) ? dataList[i - 1].close : null;

            // PIVOT LEVELS
            const key = dateKeyFromTs(ts);
            const prevKey = prevOfDate[key];
            let levels = {};
            if (prevKey) {
                const prev = htBars[prevKey];
                levels = computeLevels(pivotType, prev.high, prev.low, prev.close);
            }

            // SUPERTREND CALCULATION
            let superTrendVal = null;
            let direction = prevDirection; 
            let finalUpper = null;
            let finalLower = null;
            
            const atr = ATR[i];
            const hl2 = (sourceK.high + sourceK.low) / 2;
            
            if (Number.isFinite(atr) && Number.isFinite(hl2) && i >= atrPeriod - 1) {
                const basicUpper = hl2 + factor * atr;
                const basicLower = hl2 - factor * atr;

                // Final Upper/Lower (handling initial nulls in the first loop)
                finalUpper = basicUpper;
                finalLower = basicLower;

                if (prevFinalUpper != null) {
                    finalUpper = (basicUpper < prevFinalUpper || currentClose > prevFinalUpper) 
                        ? basicUpper 
                        : prevFinalUpper;
                }
                
                if (prevFinalLower != null) {
                    finalLower = (basicLower > prevFinalLower || currentClose < prevFinalLower)
                        ? basicLower
                        : prevFinalLower;
                }

                // Direction and SuperTrend Value Logic
                if (prevSuper == null) {
                    // Initialization bar (first valid ATR)
                    direction = currentClose > finalUpper ? -1 : 1;
                } else if (prevSuper === prevFinalUpper) {
                    // Previous was Down (Red)
                    direction = currentClose > finalUpper ? -1 : 1;
                } else if (prevSuper === prevFinalLower) { 
                    // Previous was Up (Green)
                    direction = currentClose < finalLower ? 1 : -1;
                }
                
                superTrendVal = direction === 1 ? finalUpper : finalLower;
            }

            // DONCHIAN CHANNELS (Calculated but filter condition disabled for testing)
            // const s1 = Math.max(0, i - len1 + 1);
            // const s2 = Math.max(0, i - len2 + 1);
            // const s3 = Math.max(0, i - len3 + 1);
            // const upper1 = highestWithIndex(dataList, s1, i).value;
            // const lower1 = lowestWithIndex(dataList, s1, i).value;
            // const upper2 = highestWithIndex(dataList, s2, i).value;
            // const lower2 = lowestWithIndex(dataList, s2, i).value;
            // const upper3 = highestWithIndex(dataList, s3, i).value;
            // const lower3 = lowestWithIndex(dataList, s3, i).value;

            // RAW SIGNAL LOGIC 
            
            // FIX 1: Donchian condition is now always TRUE to ensure signals fire.
            // Replace with your preferred logic later.
            const buyCondition = true; 
            const sellCondition = true;

            const pivotCrossoverCheck_buy = 
                (currentLow < levels.S2 && crossover(currentClose, previousClose, levels.S2)) ||
                (currentLow < levels.S1 && crossover(currentClose, previousClose, levels.S1)) ||
                (currentLow < levels.P && crossover(currentClose, previousClose, levels.P)) ||
                (currentLow < levels.R1 && crossover(currentClose, previousClose, levels.R1)) ||
                (currentLow < levels.R2 && crossover(currentClose, previousClose, levels.R2));

            const pivotCrossunderCheck_sell = 
                (currentHigh > levels.S2 && crossunder(currentClose, previousClose, levels.S2)) ||
                (currentHigh > levels.S1 && crossunder(currentClose, previousClose, levels.S1)) ||
                (currentHigh > levels.P && crossunder(currentClose, previousClose, levels.P)) ||
                (currentHigh > levels.R1 && crossunder(currentClose, previousClose, levels.R1)) ||
                (currentHigh > levels.R2 && crossunder(currentClose, previousClose, levels.R2));
            
            // direction: -1 = Up (Green) (For Buy); 1 = Down (Red) (For Sell)
            const call_buy = (direction === -1) && pivotCrossoverCheck_buy && (currentClose > currentOpen) && buyCondition;
            const call_sell = (direction === 1) && pivotCrossunderCheck_sell && (currentClose < currentOpen) && sellCondition;


            // OUTPUT DATA
            out[ts] = {
                // Pivots
                p: showPVlvl ? levels.P : null, r1: showPVlvl ? levels.R1 : null, s1: showPVlvl ? levels.S1 : null,
                r2: showPVlvl ? levels.R2 : null, s2: showPVlvl ? levels.S2 : null, r3: showPVlvl ? levels.R3 : null,
                s3: showPVlvl ? levels.S3 : null, r4: showPVlvl ? levels.R4 : null, s4: showPVlvl ? levels.S4 : null,
                r5: showPVlvl ? levels.R5 : null, s5: showPVlvl ? levels.S5 : null,
                // Supertrend 
                st_up: (direction === -1) ? superTrendVal : null,
                st_down: (direction === 1) ? superTrendVal : null,
                // Raw Signals
                buy_signal: call_buy ? 1 : 0,
                sell_signal: call_sell ? 1 : 0,
                timestamp: ts,
                dataIndex: i,
                currentClose: currentClose
            };

            // Update previous state for next bar
            prevFinalUpper = finalUpper;
            prevFinalLower = finalLower;
            prevSuper = superTrendVal;
            prevDirection = direction;
        }

        if (indicator) indicator._indexToTs = indexToTs;
        return out;
      } catch (e) {
        console.error(e);
        return null;
      }
    },

    // --- DRAW FUNCTION (Includes signal drawing) ---
    draw: ({ ctx, indicator, xAxis, yAxis, style = {} }) => {
        // Helper to get result by index
        const getResultByIndex = (ind, idx) => {
            const res = ind.result;
            const idxMap = ind._indexToTs || [];
            const ts = idxMap[idx];
            if (ts == null || !res || res[ts] == null) return null;
            return res[ts];
        };

        const { from = 0, to = (indicator._indexToTs ? indicator._indexToTs.length - 1 : 0) } = xAxis._range || xAxis.range || {};
        const start = Math.max(0, from);
        const end = Math.min(to, (indicator._indexToTs ? indicator._indexToTs.length - 1 : to));

        ctx.save();
        
        // --- 1. PIVOT AND SUPERTREND LINE DRAWING ---
        // (Styles defined here for brevity)
        const styles = {
            p: { strokeStyle: '#51e611', lineWidth: 2, dash: [] },
            r1: { strokeStyle: '#110aec', lineWidth: 1.1, dash: [] },
            s1: { strokeStyle: '#f40909', lineWidth: 1.1, dash: [] },
            // Add other R/S lines...
            st_up: { strokeStyle: '#00A300', lineWidth: 2, dash: [] },
            st_down: { strokeStyle: '#FF0000', lineWidth: 2, dash: [] },
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
            if (ctx.setLineDash) ctx.setLineDash([]);
        };

        Object.keys(styles).forEach(k => {
            drawLevelLine(k, styles[k]);
        });

        // --- 2. SIGNAL DRAWING LOGIC (Shapes and Text) ---

        const signalRadius = 4;
        const textOffset = 18; // Vertical offset for text
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';

        for (let i = start; i <= end; i++) {
            const data = getResultByIndex(indicator, i);
            
            if (!data) continue;

            const x = xAxis.convertToPixel(i);
            const yClose = yAxis.convertToPixel(data.currentClose); 
            // NOTE: In a complete implementation, you'd fetch the bar's HIGH/LOW for clean placement

            const isBuy = data.buy_signal === 1;
            const isSell = data.sell_signal === 1;

            if (isBuy) {
                // Draw Buy signal below the bar
                const signalY = yClose + signalRadius + 5; 
                
                // Draw dot/circle
                ctx.beginPath();
                ctx.arc(x, signalY, signalRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#0066FF';
                ctx.fill();

                // Draw text label: "Buy"
                ctx.fillStyle = '#0066FF'; 
                ctx.fillText('BUY', x, signalY + textOffset);

            } else if (isSell) {
                // Draw Sell signal above the bar
                const signalY = yClose - signalRadius - 5; 

                // Draw dot/circle
                ctx.beginPath();
                ctx.arc(x, signalY, signalRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#FF0000';
                ctx.fill();
                
                // Draw text label: "Sell"
                ctx.fillStyle = '#FF0000'; 
                ctx.fillText('SELL', x, signalY - textOffset);
            }
        }

        ctx.restore();
        return true;
    }
};