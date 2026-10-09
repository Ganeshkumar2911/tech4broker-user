<template>
    <div id="tour-trading-chart"
        class="w-full flex-col flex h-full min-h-0 min-w-0 overflow-hidden bg-card-background border border-primary-border rounded-lg select-none">
        <div class="shrink-0">
            <Topbar />
        </div>
        <div class="flex-1 flex min-h-0 min-w-0 relative overflow-hidden">
            <Sidebar class="shrink-0" />
            <div class="flex-1 relative h-full w-full min-h-0 min-w-0 overflow-hidden">
                <!-- Hovering Top-Right Quick BUY & SELL Action Bar -->
                <div id="tour-trading-quick-order"
                    class="absolute top-3 right-4 z-40 flex items-center gap-2 select-none pointer-events-auto">
                    <!-- SELL Button -->
                    <button @click="orderStore.openOrderModal('Sell')"
                        class=" min-w-25 gap-2 px-3.5 py-1.5 leading-tight rounded-lg bg-primary-red/10 hover:bg-primary-red/20 text-center border border-red-500/30 cursor-pointer">
                        <p
                            class="text-primary-red text-[10px] text-center font-extrabold tracking-wider uppercase opacity-90">
                            SELL
                        </p>
                        <p class="text-xs text-primary-red font-mono font-bold mt-0.5">{{ formattedBid }}</p>
                    </button>

                    <!-- BUY Button -->
                    <button @click="orderStore.openOrderModal('Buy')"
                        class=" min-w-25 gap-2 px-3.5 py-1.5 leading-tight rounded-lg bg-primary-green/10 hover:bg-primary-green/20 text-center border border-green-500/30 cursor-pointer">
                        <p
                            class="text-primary-green text-[10px] text-center font-extrabold tracking-wider uppercase opacity-90">
                            BUY
                        </p>
                        <p class="text-xs text-primary-green font-mono font-bold mt-0.5">{{ formattedAsk }}</p>
                    </button>
                </div>

                <div ref="chartRef" id="chart" class="absolute inset-0 select-none" @dragstart.prevent
                    @selectstart.prevent>
                </div>

                <!-- Floating Indicator Controls & Overlay Bar -->
                <div class="absolute top-10 left-2 z-30 flex flex-col gap-2 pointer-events-none">
                    <ManageIndicator v-for="indicator in selectedIndicators" :key="indicator.id || indicator.name"
                        :indicator="indicator" class="pointer-events-auto" />
                    <OverlayStyleModal v-if="activeOverlay" class="pointer-events-auto" />
                </div>

                <!-- Floating Exness-Style DOM Position Labels -->
                <template v-for="pos in openPositionsForChart" :key="pos.position_ticket || pos.id">
                    <!-- Entry Label -->
                    <div :ref="el => setEntryLabelRef(pos.position_ticket || pos.id)(el)" class="exness-label-container"
                        :class="{ 'selected': String(pos.position_ticket || pos.id) === String(selectedTicket) }"
                        @click.stop="selectedTicket = (pos.position_ticket || pos.id); syncPositionOverlays()">
                        <div class="exness-label entry bg-card-background border border-primary-blue text-primary-text">
                            <div class="exness-label-part qty bg-primary-blue text-white font-bold">{{ pos.type ||
                                (pos.action === 0 ? 'BUY' : 'SELL') }} {{ pos.lot || pos.volume || '0.01' }}</div>
                            <div class="exness-label-part pnl font-bold"></div>
                            <div class="exness-label-part price text-[9px] border-l border-primary-border px-1.5"></div>
                            <div class="exness-label-close close-btn text-primary-blue hover:bg-primary-blue/20"
                                @click.stop="directClosePosition(pos)">✕</div>
                        </div>
                    </div>

                    <!-- Stop Loss (SL) Label -->
                    <div v-show="getPosSlPrice(pos) || localPendingSL[pos.position_ticket || pos.id]"
                        :ref="el => setStopLossLabelRef(pos.position_ticket || pos.id)(el)"
                        :class="['exness-label stoploss bg-card-background border border-primary-red text-primary-text', { 'pending': !getPosSlPrice(pos) }]"
                        @mousedown="(e) => handleLabelMouseDown('sl', pos.position_ticket || pos.id, e)"
                        @touchstart="(e) => handleLabelTouchStart('sl', pos.position_ticket || pos.id, e)">
                        <div class="exness-label-badge bg-primary-red text-white">SL</div>
                        <div class="exness-label-part qty bg-primary-red text-white">{{ pos.lot || pos.volume || '0.01'
                        }}</div>
                        <div class="exness-label-part pnl font-bold"></div>
                        <div class="exness-label-part price text-[9px] border-l border-primary-border px-1.5"></div>
                        <div class="exness-label-close close-btn text-primary-red hover:bg-primary-red/20"
                            @click.stop="removePositionSl(pos.position_ticket || pos.id)">✕</div>
                    </div>

                    <!-- Take Profit (TP) Label -->
                    <div v-show="getPosTpPrice(pos) || localPendingTP[pos.position_ticket || pos.id]"
                        :ref="el => setTargetLabelRef(pos.position_ticket || pos.id)(el)"
                        :class="['exness-label target bg-card-background border border-primary-green text-primary-text', { 'pending': !getPosTpPrice(pos) }]"
                        @mousedown="(e) => handleLabelMouseDown('tp', pos.position_ticket || pos.id, e)"
                        @touchstart="(e) => handleLabelTouchStart('tp', pos.position_ticket || pos.id, e)">
                        <div class="exness-label-badge bg-primary-green text-white">TP</div>
                        <div class="exness-label-part qty bg-primary-green text-white">{{ pos.lot || pos.volume ||
                            '0.01' }}</div>
                        <div class="exness-label-part pnl font-bold"></div>
                        <div class="exness-label-part price text-[9px] border-l border-primary-border px-1.5"></div>
                        <div class="exness-label-close close-btn text-primary-green hover:bg-primary-green/20"
                            @click.stop="removePositionTp(pos.position_ticket || pos.id)">✕</div>
                    </div>
                </template>

                <!-- Selected Position Interactive SL/TP Control Panel -->
                <SelectedPositionBar :selected-position="selectedPosition" :selected-pos-side="selectedPosSide"
                    :selected-pos-entry="selectedPosEntry" :has-selected-sl="hasSelectedSl"
                    :has-selected-tp="hasSelectedTp" :selected-sl-text="selectedSlText"
                    :selected-tp-text="selectedTpText" @deselect="selectedTicket = null; syncPositionOverlays()"
                    @add-sl="addDefaultSl(selectedTicket)" @remove-sl="removePositionSl(selectedTicket)"
                    @add-tp="addDefaultTp(selectedTicket)" @remove-tp="removePositionTp(selectedTicket)"
                    @close-position="openCloseModalForSelected" />

                <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                    <LoaderCircle class="animate-spin h-8 w-8 text-primary" />
                </div>
            </div>
        </div>

        <IndicatorSelectModal />
        <ChartStyleModal />

        <!-- Position Square Off Confirmation Modal -->
        <ClosePositionModal :is-open="isCloseModalOpen" :ticket="selectedTicket" :total-lot="selectedPositionLot"
            :closing="closing" @close="isCloseModalOpen = false" @submit="submitClosePosition" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { init, dispose, registerOverlay, registerFigure } from 'klinecharts';
import { storeToRefs } from 'pinia';

import Sidebar from '@/components/shared/chart/common/sidebar.vue';
import Topbar from '@/components/shared/chart/common/topbar.vue';
import IndicatorSelectModal from '@/components/shared/chart/indicator-modal/IndicatorSelectModal.vue';
import ManageIndicator from '@/components/shared/chart/indicator-modal/ManageIndicator.vue';
import OverlayStyleModal from '@/components/shared/chart/overlay-modal/OverlayStyleModal.vue';
import ChartStyleModal from '@/components/shared/chart/style-modal/ChartStyleModal.vue';
import ClosePositionModal from '@/pages/client/chart-trading/trades/positions/ClosePositionModal.vue';
import SelectedPositionBar from './SelectedPositionBar.vue';

import { useChartStore } from '@/stores/client/chart.js';
import { useTickerStore } from '@/stores/shared/ticker';
import { useThemeStore } from '@/stores/shared/theme';
import usePositionsStore from '@/stores/client/positions';
import useOrderStore from '@/stores/client/orders';
import { useSnackbarStore } from '@/stores/shared/snackbar';

import { arrowFigure, entryArrow, getChart, setChart, isMainIndicator, getSymbolPricePrecision } from '@/utils/chart/chart';
import { applyChartStyles } from '@/utils/chart/chartStyles';
import allCustomIndicators from '@/utils/chart/personal-indicators';
import { livePNL } from '@/utils/livePNL';
import { LoaderCircle, X } from 'lucide-vue-next';

const SERVER_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

// ─── Stores ───────────────────────────────────────────────────────────────────

const chartStore = useChartStore();
const tickerStore = useTickerStore();
const themeStore = useThemeStore();
const positionsStore = usePositionsStore();
const orderStore = useOrderStore();
const snackbar = useSnackbarStore();

const {
    currentSymbol,
    selectedInterval,
    selectedCandleType,
    historicalCandles,
    selectedIndicators,
    activeOverlay,
    chartStyleOverrides,
} = storeToRefs(chartStore);

const loading = ref(false);
const chartRef = ref(null);
let chart = null; // Plain JS variable to avoid Vue reactivity proxy overhead

// Position Square Off Modal State
const isCloseModalOpen = ref(false);
const selectedTicket = ref(null);
const selectedPositionLot = ref(0);
const closing = ref(false);

// Local pending SL/TP prices during dragging or manual addition
const localPendingSL = ref({});
const localPendingTP = ref({});

// Refs for DOM Label elements
const entryLabelRefs = ref({});
const targetLabelRefs = ref({});
const stopLossLabelRefs = ref({});

const setEntryLabelRef = (id) => (el) => {
    if (el) entryLabelRefs.value[id] = el;
    else delete entryLabelRefs.value[id];
};
const setTargetLabelRef = (id) => (el) => {
    if (el) targetLabelRefs.value[id] = el;
    else delete targetLabelRefs.value[id];
};
const setStopLossLabelRef = (id) => (el) => {
    if (el) stopLossLabelRefs.value[id] = el;
    else delete stopLossLabelRefs.value[id];
};

const dragPricesRef = ref({ target: null, stopLoss: null });
const isDraggingRef = ref(null);

// Non-reactive tick state — intentionally outside Vue reactivity for performance
let barCallback = null;
let currentCandle = null;
let resizeObserver = null;
let overlaysRegistered = false;

// ─── Interval helpers ─────────────────────────────────────────────────────────

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function getIntervalInMs(interval) {
    if (typeof interval === 'object' && interval) {
        interval = interval.value || interval.type || 'minute';
    }
    const str = String(interval || 'minute');
    if (str === 'minute' || str === '1m' || str === '1') return MINUTE_MS;
    if (str === 'day' || str === '1d' || str === 'D') return DAY_MS;
    if (str.endsWith('minute')) return (parseInt(str) || 1) * MINUTE_MS;
    if (str.endsWith('m')) return (parseInt(str) || 1) * MINUTE_MS;
    if (str.endsWith('h')) return (parseInt(str) || 1) * 60 * MINUTE_MS;
    if (str.endsWith('d')) return (parseInt(str) || 1) * DAY_MS;
    const num = parseInt(str);
    if (!isNaN(num) && num > 0) return num * MINUTE_MS;
    return MINUTE_MS;
}

function normalizeTimestamp(timestamp, interval) {
    const intervalStr = typeof interval === 'object' && interval ? (interval.value || 'minute') : String(interval || 'minute');
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return Date.now();

    if (intervalStr === 'day' || intervalStr === '1d' || intervalStr === 'D') {
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }
    if (intervalStr === 'week' || intervalStr === '1w' || intervalStr === 'W') {
        const day = date.getDay();
        date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }

    const intervalMs = getIntervalInMs(intervalStr);
    return Math.floor(date.getTime() / intervalMs) * intervalMs;
}

function getPricePrecision(candles, symbol) {
    const symbolName = String(symbol || '').toUpperCase();
    const fallback = symbolName.includes('JPY') ? 3 : (symbolName.includes('XAU') ? 2 : 4);
    const prices = candles.flatMap(({ open, high, low, close }) => [open, high, low, close]);
    const precision = prices.reduce((maximum, price) => {
        const value = Number(price);
        if (!Number.isFinite(value)) return maximum;
        const [, decimals = ''] = value.toString().split('.');
        return Math.max(maximum, decimals.length);
    }, 0);

    return Math.min(8, Math.max(fallback, precision));
}

// ─── Custom Canvas Overlay Lines Registration ──────────────────────────────────

function registerCustomOverlays() {
    if (overlaysRegistered) return;
    overlaysRegistered = true;

    registerOverlay({
        name: 'positionLine',
        needDefaultPointFigure: false,
        needDefaultXAxisFigure: false,
        needDefaultYAxisFigure: false,
        createPointFigures: ({ coordinates, bounding, overlay }) => {
            updateLabelsDOM();
            if (!coordinates.length) return [];
            const { y } = coordinates[0];
            const sideColor = overlay.extendData?.side === 'SELL' ? '#ef4444' : '#3b82f6';
            return [{
                type: 'line',
                attrs: {
                    coordinates: [
                        { x: 0, y },
                        { x: bounding.width || 5000, y }
                    ]
                },
                styles: {
                    style: 'solid',
                    size: 1.5,
                    color: sideColor
                }
            }];
        }
    });

    registerOverlay({
        name: 'slLine',
        needDefaultPointFigure: false,
        needDefaultXAxisFigure: false,
        needDefaultYAxisFigure: false,
        createPointFigures: ({ coordinates, bounding }) => {
            updateLabelsDOM();
            if (!coordinates.length) return [];
            const { y } = coordinates[0];
            return [{
                type: 'line',
                attrs: {
                    coordinates: [
                        { x: 0, y },
                        { x: bounding.width || 5000, y }
                    ]
                },
                styles: {
                    style: 'dashed',
                    size: 1.5,
                    color: '#ef4444'
                }
            }];
        }
    });

    registerOverlay({
        name: 'tpLine',
        needDefaultPointFigure: false,
        needDefaultXAxisFigure: false,
        needDefaultYAxisFigure: false,
        createPointFigures: ({ coordinates, bounding }) => {
            updateLabelsDOM();
            if (!coordinates.length) return [];
            const { y } = coordinates[0];
            return [{
                type: 'line',
                attrs: {
                    coordinates: [
                        { x: 0, y },
                        { x: bounding.width || 5000, y }
                    ]
                },
                styles: {
                    style: 'dashed',
                    size: 1.5,
                    color: '#22c55e'
                }
            }];
        }
    });

    registerFigure(arrowFigure);
    registerOverlay(entryArrow);
}

function normalizeChartSymbol(symbol) {
    let s = String(symbol ?? '').trim();
    if (s.toLowerCase().endsWith('.c')) {
        s = s.slice(0, -2);
    }
    const normalized = s
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

    if (normalized === 'BTCUSDT') return 'BTCUSD';
    return normalized;
}

// Helper to extract SL/TP prices from position object safely
const getPosSlPrice = (pos) => {
    if (!pos) return null;
    const sl = Number(pos.price_sl ?? pos.sl ?? 0);
    return sl > 0 ? sl : null;
};

const getPosTpPrice = (pos) => {
    if (!pos) return null;
    const tp = Number(pos.price_tp ?? pos.tp ?? 0);
    return tp > 0 ? tp : null;
};

// Helper to get current Last Traded Price (LTP) for a position
const getPosLtp = (pos) => {
    if (!pos) return null;
    const sym = normalizeChartSymbol(pos.symbol || currentSymbol.value);
    const ltpData = tickerStore.getLastPrice(sym);
    let price = 0;
    if (ltpData) {
        price = Number(
            (ltpData.last && ltpData.last > 0) ? ltpData.last :
                (ltpData.ltp && ltpData.ltp > 0) ? ltpData.ltp :
                    (ltpData.LTP && ltpData.LTP > 0) ? ltpData.LTP :
                        (ltpData.close && ltpData.close > 0) ? ltpData.close :
                            (ltpData.bid && ltpData.bid > 0) ? ltpData.bid :
                                (ltpData.ask && ltpData.ask > 0) ? ltpData.ask : 0
        );
    }
    if (!price || isNaN(price) || price <= 0) {
        if (currentCandle?.close && currentCandle.close > 0) {
            price = Number(currentCandle.close);
        }
    }
    if (!price || isNaN(price) || price <= 0) {
        const lastCandle = historicalCandles.value?.at(-1);
        if (lastCandle?.close && lastCandle.close > 0) {
            price = Number(lastCandle.close);
        }
    }
    if (!price || isNaN(price) || price <= 0) {
        const entryPrice = Number(pos.entry_price || pos.price_open || 0);
        if (entryPrice > 0) price = entryPrice;
    }
    return price > 0 ? price : null;
};

// ─── Open Position Chart Overlays Sync ────────────────────────────────────────

const openPositionsForChart = computed(() => {
    if (!positionsStore.data || !Array.isArray(positionsStore.data)) return [];
    const sym = normalizeChartSymbol(currentSymbol.value);
    return positionsStore.data.filter(pos => {
        if (pos.status === 'CLOSED') return false;
        const posSym = normalizeChartSymbol(pos.symbol);
        return posSym === sym;
    });
});

function syncPositionOverlays() {
    if (!chart) return;

    // Clear existing position/SL/TP overlays
    const existing = chart.getOverlays();
    existing.forEach(o => {
        if (o.name === 'positionLine' || o.name === 'slLine' || o.name === 'tpLine' || String(o.id || '').startsWith('pos_')) {
            chart.removeOverlay({ id: o.id });
        }
    });

    const positions = openPositionsForChart.value;
    if (!positions.length) {
        updateLabelsDOM();
        return;
    }

    const anchorTime = currentCandle?.timestamp || (historicalCandles.value?.at(-1)?.timestamp) || Date.now();

    positions.forEach(pos => {
        const entryPrice = Number(pos.entry_price || pos.price_open || 0);
        if (!entryPrice || entryPrice <= 0) return;

        const ticket = pos.position_ticket || pos.id;
        const side = String(pos.type || (pos.action === 0 ? 'BUY' : 'SELL')).toUpperCase();
        const volume = String(pos.lot || pos.volume || '0.01');

        // 1. Entry Position Line Overlay
        chart.createOverlay({
            id: `pos_entry_${ticket}`,
            name: 'positionLine',
            lock: true,
            extendData: {
                ticket: ticket,
                side: side,
                volume: volume,
                price: entryPrice,
                rawPosition: pos
            },
            points: [{ timestamp: anchorTime, value: entryPrice }],
            onClick: () => {
                selectedTicket.value = ticket;
                selectedPositionLot.value = pos.lot || pos.volume || 0.01;
            }
        });

        // 2. SL Line Overlay (Active or Local Pending)
        const activeSl = localPendingSL.value[ticket] ?? getPosSlPrice(pos);
        if (activeSl && activeSl > 0) {
            chart.createOverlay({
                id: `pos_sl_${ticket}`,
                name: 'slLine',
                lock: true,
                extendData: { ticket, slPrice: activeSl, rawPosition: pos },
                points: [{ timestamp: anchorTime, value: activeSl }]
            });
        }

        // 3. TP Line Overlay (Active or Local Pending)
        const activeTp = localPendingTP.value[ticket] ?? getPosTpPrice(pos);
        if (activeTp && activeTp > 0) {
            chart.createOverlay({
                id: `pos_tp_${ticket}`,
                name: 'tpLine',
                lock: true,
                extendData: { ticket, tpPrice: activeTp, rawPosition: pos },
                points: [{ timestamp: anchorTime, value: activeTp }]
            });
        }
    });

    nextTick(() => {
        updateLabelsDOM();
    });
}

// Update label coordinates and content directly on DOM elements
function updateLabelsDOM() {
    if (!chart || !openPositionsForChart.value.length) return;
    try {
        openPositionsForChart.value.forEach(pos => {
            const id = pos.position_ticket || pos.id;
            const entryPrice = Number(pos.entry_price || pos.price_open || 0);

            // 1. Entry Label
            const entryEl = entryLabelRefs.value[id];
            if (entryEl && entryPrice > 0) {
                const res = chart.convertToPixel({ value: entryPrice }, { paneId: 'candle_pane' });
                const y = Array.isArray(res) ? res[0]?.y : res?.y;
                if (y !== undefined) entryEl.style.top = `${y}px`;

                const pnlEl = entryEl.querySelector('.pnl');
                if (pnlEl) {
                    const pnlVal = livePNL(pos);
                    pnlEl.textContent = `${pnlVal >= 0 ? '+' : ''}${Number(pnlVal).toFixed(2)}`;
                    pnlEl.style.color = pnlVal >= 0 ? '#34A853' : '#EA4335';
                }
                const priceEl = entryEl.querySelector('.price');
                if (priceEl) priceEl.textContent = entryPrice > 100 ? entryPrice.toFixed(2) : entryPrice.toFixed(4);
            }

            // 2. SL Label
            const stopLossEl = stopLossLabelRefs.value[id];
            const activeSL = localPendingSL.value[id] ?? getPosSlPrice(pos);
            if (stopLossEl && activeSL && activeSL > 0) {
                const val = dragPricesRef.value.stopLoss !== null && isDraggingRef.value === `sl-${id}` ? dragPricesRef.value.stopLoss : activeSL;
                const res = chart.convertToPixel({ value: val }, { paneId: 'candle_pane' });
                const y = Array.isArray(res) ? res[0]?.y : res?.y;
                if (y !== undefined) stopLossEl.style.top = `${y}px`;

                const priceEl = stopLossEl.querySelector('.price');
                if (priceEl) priceEl.textContent = val > 100 ? val.toFixed(2) : val.toFixed(4);
            }

            // 3. TP Label
            const targetEl = targetLabelRefs.value[id];
            const activeTP = localPendingTP.value[id] ?? getPosTpPrice(pos);
            if (targetEl && activeTP && activeTP > 0) {
                const val = dragPricesRef.value.target !== null && isDraggingRef.value === `tp-${id}` ? dragPricesRef.value.target : activeTP;
                const res = chart.convertToPixel({ value: val }, { paneId: 'candle_pane' });
                const y = Array.isArray(res) ? res[0]?.y : res?.y;
                if (y !== undefined) targetEl.style.top = `${y}px`;

                const priceEl = targetEl.querySelector('.price');
                if (priceEl) priceEl.textContent = val > 100 ? val.toFixed(2) : val.toFixed(4);
            }
        });
    } catch (e) {
        // Ignore errors during label update
    }
}

// Smooth Mouse/Touch Dragging for SL and TP Labels with Real-time Clamping
const handleLabelMouseDown = (labelType, id, e) => {
    if (e.button !== 0) return; // Primary mouse button only
    e.preventDefault();
    e.stopPropagation();

    const pos = openPositionsForChart.value.find(p => String(p.position_ticket || p.id) === String(id));
    if (!pos || !chart) return;

    isDraggingRef.value = `${labelType}-${id}`;
    const startY = e.clientY;

    const initialPrice = labelType === 'tp'
        ? (localPendingTP.value[id] ?? getPosTpPrice(pos))
        : (localPendingSL.value[id] ?? getPosSlPrice(pos));

    if (!initialPrice) return;

    const res = chart.convertToPixel({ value: initialPrice }, { paneId: 'candle_pane' });
    const startPixelY = Array.isArray(res) ? res[0]?.y : res?.y;
    if (startPixelY === undefined) return;

    const handleMouseMove = (moveEvent) => {
        if (!isDraggingRef.value || !chart) return;
        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        const deltaY = moveEvent.clientY - startY;
        const newPixelY = startPixelY + deltaY;
        const pointRes = chart.convertFromPixel({ x: 0, y: newPixelY }, { paneId: 'candle_pane' });
        let newPrice = Array.isArray(pointRes) ? pointRes[0]?.value : pointRes?.value;

        if (newPrice && !isNaN(newPrice) && newPrice > 0) {
            newPrice = Number(newPrice.toFixed(4));
            const ltp = getPosLtp(pos);
            const side = String(pos.type || (pos.action === 0 ? 'BUY' : 'SELL')).toUpperCase();
            if (ltp && ltp > 0) {
                const offset = ltp > 1000 ? 0.1 : (ltp > 50 ? 0.01 : 0.0001);
                if (side === 'BUY') {
                    if (labelType === 'sl' && newPrice >= ltp) {
                        newPrice = Number((ltp - offset).toFixed(4));
                    } else if (labelType === 'tp' && newPrice <= ltp) {
                        newPrice = Number((ltp + offset).toFixed(4));
                    }
                } else if (side === 'SELL') {
                    if (labelType === 'sl' && newPrice <= ltp) {
                        newPrice = Number((ltp + offset).toFixed(4));
                    } else if (labelType === 'tp' && newPrice >= ltp) {
                        newPrice = Number((ltp - offset).toFixed(4));
                    }
                }
            }

            if (labelType === 'tp') {
                dragPricesRef.value.target = newPrice;
                localPendingTP.value[id] = newPrice;
                chart.overrideOverlay({ id: `pos_tp_${id}`, points: [{ value: newPrice }] });
            } else {
                dragPricesRef.value.stopLoss = newPrice;
                localPendingSL.value[id] = newPrice;
                chart.overrideOverlay({ id: `pos_sl_${id}`, points: [{ value: newPrice }] });
            }
            updateLabelsDOM();
        }
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const finalPrice = labelType === 'tp'
            ? (dragPricesRef.value.target !== null ? dragPricesRef.value.target : localPendingTP.value[id])
            : (dragPricesRef.value.stopLoss !== null ? dragPricesRef.value.stopLoss : localPendingSL.value[id]);

        isDraggingRef.value = null;
        dragPricesRef.value.target = null;
        dragPricesRef.value.stopLoss = null;

        if (finalPrice && !isNaN(finalPrice) && finalPrice > 0) {
            if (labelType === 'tp') {
                updatePositionSlTp(id, { tp: finalPrice });
            } else {
                updatePositionSlTp(id, { sl: finalPrice });
            }
        }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
};

const handleLabelTouchStart = (labelType, id, e) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();

    const pos = openPositionsForChart.value.find(p => String(p.position_ticket || p.id) === String(id));
    if (!pos || !chart) return;

    isDraggingRef.value = `${labelType}-${id}`;
    const startY = e.touches[0].clientY;

    const initialPrice = labelType === 'tp'
        ? (localPendingTP.value[id] ?? getPosTpPrice(pos))
        : (localPendingSL.value[id] ?? getPosSlPrice(pos));

    if (!initialPrice) return;

    const res = chart.convertToPixel({ value: initialPrice }, { paneId: 'candle_pane' });
    const startPixelY = Array.isArray(res) ? res[0]?.y : res?.y;
    if (startPixelY === undefined) return;

    const handleTouchMove = (moveEvent) => {
        if (moveEvent.touches.length !== 1 || !isDraggingRef.value || !chart) return;
        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        const touch = moveEvent.touches[0];
        const deltaY = touch.clientY - startY;
        const newPixelY = startPixelY + deltaY;
        const pointRes = chart.convertFromPixel({ x: 0, y: newPixelY }, { paneId: 'candle_pane' });
        let newPrice = Array.isArray(pointRes) ? pointRes[0]?.value : pointRes?.value;

        if (newPrice && !isNaN(newPrice) && newPrice > 0) {
            newPrice = Number(newPrice.toFixed(4));
            const ltp = getPosLtp(pos);
            const side = String(pos.type || (pos.action === 0 ? 'BUY' : 'SELL')).toUpperCase();
            if (ltp && ltp > 0) {
                const offset = ltp > 1000 ? 0.1 : (ltp > 50 ? 0.01 : 0.0001);
                if (side === 'BUY') {
                    if (labelType === 'sl' && newPrice >= ltp) {
                        newPrice = Number((ltp - offset).toFixed(4));
                    } else if (labelType === 'tp' && newPrice <= ltp) {
                        newPrice = Number((ltp + offset).toFixed(4));
                    }
                } else if (side === 'SELL') {
                    if (labelType === 'sl' && newPrice <= ltp) {
                        newPrice = Number((ltp + offset).toFixed(4));
                    } else if (labelType === 'tp' && newPrice >= ltp) {
                        newPrice = Number((ltp - offset).toFixed(4));
                    }
                }
            }

            if (labelType === 'tp') {
                dragPricesRef.value.target = newPrice;
                localPendingTP.value[id] = newPrice;
                chart.overrideOverlay({ id: `pos_tp_${id}`, points: [{ value: newPrice }] });
            } else {
                dragPricesRef.value.stopLoss = newPrice;
                localPendingSL.value[id] = newPrice;
                chart.overrideOverlay({ id: `pos_sl_${id}`, points: [{ value: newPrice }] });
            }
            updateLabelsDOM();
        }
    };

    const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);

        const finalPrice = labelType === 'tp'
            ? (dragPricesRef.value.target !== null ? dragPricesRef.value.target : localPendingTP.value[id])
            : (dragPricesRef.value.stopLoss !== null ? dragPricesRef.value.stopLoss : localPendingSL.value[id]);

        isDraggingRef.value = null;
        dragPricesRef.value.target = null;
        dragPricesRef.value.stopLoss = null;

        if (finalPrice && !isNaN(finalPrice) && finalPrice > 0) {
            if (labelType === 'tp') {
                updatePositionSlTp(id, { tp: finalPrice });
            } else {
                updatePositionSlTp(id, { sl: finalPrice });
            }
        }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
};

// Backend update helpers for SL / TP with strict side & LTP validation
const updatePositionSlTp = async (ticket, { sl, tp }) => {
    const pos = positionsStore.data.find(p => String(p.position_ticket) === String(ticket) || String(p.id) === String(ticket));
    if (!pos) {
        console.warn("Position not found for ticket:", ticket);
        return;
    }

    const realTicket = pos.position_ticket || pos.id || ticket;

    const currentSl = localPendingSL.value[ticket] ?? localPendingSL.value[realTicket] ?? getPosSlPrice(pos);
    const currentTp = localPendingTP.value[ticket] ?? localPendingTP.value[realTicket] ?? getPosTpPrice(pos);

    const newSl = sl !== undefined ? sl : currentSl;
    const newTp = tp !== undefined ? tp : currentTp;

    const side = String(pos.type || (pos.action === 0 ? 'BUY' : 'SELL')).toUpperCase();
    const ltp = getPosLtp(pos);

    if (ltp && ltp > 0) {
        const formattedLtp = ltp > 100 ? ltp.toFixed(2) : ltp.toFixed(4);
        if (newSl !== undefined && newSl !== null && newSl > 0) {
            if (side === 'BUY' && Number(newSl) >= ltp) {
                snackbar.show(`Stop Loss for BUY order must be below current LTP (${formattedLtp})`, 'error');
                delete localPendingSL.value[ticket];
                delete localPendingSL.value[realTicket];
                syncPositionOverlays();
                return;
            }
            if (side === 'SELL' && Number(newSl) <= ltp) {
                snackbar.show(`Stop Loss for SELL order must be above current LTP (${formattedLtp})`, 'error');
                delete localPendingSL.value[ticket];
                delete localPendingSL.value[realTicket];
                syncPositionOverlays();
                return;
            }
        }
        if (newTp !== undefined && newTp !== null && newTp > 0) {
            if (side === 'BUY' && Number(newTp) <= ltp) {
                snackbar.show(`Take Profit for BUY order must be above current LTP (${formattedLtp})`, 'error');
                delete localPendingTP.value[ticket];
                delete localPendingTP.value[realTicket];
                syncPositionOverlays();
                return;
            }
            if (side === 'SELL' && Number(newTp) >= ltp) {
                snackbar.show(`Take Profit for SELL order must be below current LTP (${formattedLtp})`, 'error');
                delete localPendingTP.value[ticket];
                delete localPendingTP.value[realTicket];
                syncPositionOverlays();
                return;
            }
        }
    }

    const payload = {};
    if (newSl !== undefined && newSl !== null && newSl > 0) {
        payload.sl = Number(newSl);
        payload.price_sl = Number(newSl);
    }
    if (newTp !== undefined && newTp !== null && newTp > 0) {
        payload.tp = Number(newTp);
        payload.price_tp = Number(newTp);
    }

    const prevSl = pos.price_sl ?? pos.sl;
    const prevTp = pos.price_tp ?? pos.tp;

    // Optimistically update memory object
    if (newSl !== undefined && newSl !== null && newSl > 0) {
        pos.price_sl = Number(newSl);
        pos.sl = Number(newSl);
    }
    if (newTp !== undefined && newTp !== null && newTp > 0) {
        pos.price_tp = Number(newTp);
        pos.tp = Number(newTp);
    }

    try {
        await positionsStore.modifySlTp(realTicket, payload);
    } catch (err) {
        console.error("Failed to update position SL/TP:", err);
        if (prevSl !== undefined) {
            pos.price_sl = prevSl;
            pos.sl = prevSl;
        }
        if (prevTp !== undefined) {
            pos.price_tp = prevTp;
            pos.tp = prevTp;
        }
    } finally {
        delete localPendingSL.value[ticket];
        delete localPendingSL.value[realTicket];
        delete localPendingTP.value[ticket];
        delete localPendingTP.value[realTicket];
        syncPositionOverlays();
    }
};

const removePositionSl = async (ticket) => {
    delete localPendingSL.value[ticket];
    const pos = positionsStore.data.find(p => String(p.position_ticket || p.id) === String(ticket));
    const prevSl = pos ? (pos.price_sl ?? pos.sl) : 0;
    if (pos) {
        pos.price_sl = 0;
        pos.sl = 0;
    }

    const currentTp = getPosTpPrice(pos);
    const payload = { sl: 0 };
    if (currentTp) payload.tp = Number(currentTp);

    try {
        await positionsStore.modifySlTp(ticket, payload);
    } catch (err) {
        console.error("Failed to remove SL:", err);
        if (pos) {
            pos.price_sl = prevSl;
            pos.sl = prevSl;
        }
    } finally {
        syncPositionOverlays();
    }
};

const removePositionTp = async (ticket) => {
    delete localPendingTP.value[ticket];
    const pos = positionsStore.data.find(p => String(p.position_ticket || p.id) === String(ticket));
    const prevTp = pos ? (pos.price_tp ?? pos.tp) : 0;
    if (pos) {
        pos.price_tp = 0;
        pos.tp = 0;
    }

    const currentSl = getPosSlPrice(pos);
    const payload = { tp: 0 };
    if (currentSl) payload.sl = Number(currentSl);

    try {
        await positionsStore.modifySlTp(ticket, payload);
    } catch (err) {
        console.error("Failed to remove TP:", err);
        if (pos) {
            pos.price_tp = prevTp;
            pos.tp = prevTp;
        }
    } finally {
        syncPositionOverlays();
    }
};

const addDefaultSl = (ticket) => {
    const pos = positionsStore.data.find(p => String(p.position_ticket || p.id) === String(ticket));
    if (!pos) return;
    const ltp = getPosLtp(pos);
    const entryPrice = Number(pos.entry_price || pos.price_open || 0);
    const basePrice = (ltp && ltp > 0) ? ltp : entryPrice;
    if (!basePrice) return;
    const side = String(pos.type || (pos.action === 0 ? 'BUY' : 'SELL')).toUpperCase();
    const offset = basePrice > 1000 ? 5 : (basePrice > 50 ? 0.5 : 0.002);
    let targetPrice = side === 'BUY' ? basePrice - offset : basePrice + offset;
    if (side === 'BUY' && targetPrice >= basePrice) targetPrice = basePrice - offset;
    if (side === 'SELL' && targetPrice <= basePrice) targetPrice = basePrice + offset;
    localPendingSL.value[ticket] = Number(targetPrice.toFixed(4));
    syncPositionOverlays();
};

const addDefaultTp = (ticket) => {
    const pos = positionsStore.data.find(p => String(p.position_ticket || p.id) === String(ticket));
    if (!pos) return;
    const ltp = getPosLtp(pos);
    const entryPrice = Number(pos.entry_price || pos.price_open || 0);
    const basePrice = (ltp && ltp > 0) ? ltp : entryPrice;
    if (!basePrice) return;
    const side = String(pos.type || (pos.action === 0 ? 'BUY' : 'SELL')).toUpperCase();
    const offset = basePrice > 1000 ? 5 : (basePrice > 50 ? 0.5 : 0.002);
    let targetPrice = side === 'BUY' ? basePrice + offset : basePrice - offset;
    if (side === 'BUY' && targetPrice <= basePrice) targetPrice = basePrice + offset;
    if (side === 'SELL' && targetPrice >= basePrice) targetPrice = basePrice - offset;
    localPendingTP.value[ticket] = Number(targetPrice.toFixed(4));
    syncPositionOverlays();
};

// Selected position computed helpers for floating control bar
const selectedPosition = computed(() => {
    if (!selectedTicket.value) return null;
    return positionsStore.data.find(p => String(p.position_ticket || p.id) === String(selectedTicket.value));
});

const selectedPosSide = computed(() => {
    if (!selectedPosition.value) return '';
    const pos = selectedPosition.value;
    return String(pos.type || (pos.action === 0 ? 'BUY' : 'SELL')).toUpperCase();
});

const selectedPosEntry = computed(() => {
    if (!selectedPosition.value) return '';
    const price = Number(selectedPosition.value.entry_price || selectedPosition.value.price_open || 0);
    return price > 100 ? price.toFixed(2) : price.toFixed(4);
});

const hasSelectedSl = computed(() => {
    if (!selectedTicket.value) return false;
    const ticket = selectedTicket.value;
    if (localPendingSL.value[ticket]) return true;
    return Boolean(getPosSlPrice(selectedPosition.value));
});

const hasSelectedTp = computed(() => {
    if (!selectedTicket.value) return false;
    const ticket = selectedTicket.value;
    if (localPendingTP.value[ticket]) return true;
    return Boolean(getPosTpPrice(selectedPosition.value));
});

const selectedSlText = computed(() => {
    if (!selectedTicket.value) return '';
    const ticket = selectedTicket.value;
    const sl = localPendingSL.value[ticket] ?? getPosSlPrice(selectedPosition.value);
    if (!sl) return '';
    return sl > 100 ? sl.toFixed(2) : sl.toFixed(4);
});

const selectedTpText = computed(() => {
    if (!selectedTicket.value) return '';
    const ticket = selectedTicket.value;
    const tp = localPendingTP.value[ticket] ?? getPosTpPrice(selectedPosition.value);
    if (!tp) return '';
    return tp > 100 ? tp.toFixed(2) : tp.toFixed(4);
});

const openCloseModal = (pos) => {
    selectedTicket.value = pos.position_ticket || pos.id;
    selectedPositionLot.value = Number(pos.lot || pos.volume_initial || pos.volume || 0.01);
    isCloseModalOpen.value = true;
};

const openCloseModalForSelected = () => {
    if (!selectedPosition.value) return;
    openCloseModal(selectedPosition.value);
};

const submitClosePosition = async (payload) => {
    if (!selectedTicket.value) return;
    closing.value = true;
    try {
        await positionsStore.closePosition(selectedTicket.value, payload);
        isCloseModalOpen.value = false;
        syncPositionOverlays();
    } catch (err) {
        console.error("Failed to close position from chart:", err);
    } finally {
        closing.value = false;
    }
};

const directClosePosition = async (pos) => {
    const ticket = pos?.position_ticket || pos?.id;
    if (!ticket) return;
    closing.value = true;
    try {
        await positionsStore.closePosition(ticket, { comment: 'Direct Chart Close' });
        if (String(selectedTicket.value) === String(ticket)) {
            selectedTicket.value = null;
        }
        syncPositionOverlays();
    } catch (err) {
        console.error("Failed to direct close position from chart:", err);
    } finally {
        closing.value = false;
    }
};

watch(openPositionsForChart, () => {
    syncPositionOverlays();
}, { deep: true });

watch(
    () => orderStore.selectedAccount,
    (newAcc) => {
        if (newAcc) {
            positionsStore.fetchPositions(newAcc);
        }
    },
    { immediate: true }
);

// ─── Chart lifecycle ──────────────────────────────────────────────────────────

async function createChart() {
    loading.value = true;

    registerCustomOverlays();

    await chartStore.getHistoricalData();
    const candles = historicalCandles.value;

    if (!candles.length) {
        loading.value = false;
        return;
    }

    const intervalVal = typeof selectedInterval.value === 'object'
        ? selectedInterval.value?.value
        : selectedInterval.value;

    const lastCandle = { ...candles.at(-1) };
    if (!lastCandle.timestamp && lastCandle.date) {
        lastCandle.timestamp = new Date(lastCandle.date).getTime();
    }

    lastCandle.timestamp = normalizeTimestamp(lastCandle.timestamp, intervalVal);
    currentCandle = lastCandle;

    // ADD THIS
    console.log('[CHART INIT]', {
        lastCandleDate: candles.at(-1).date,
        lastCandleMs: currentCandle.timestamp,
        lastCandleDateParsed: new Date(currentCandle.timestamp).toISOString(),
    });

    const el = chartRef.value || document.getElementById('chart');
    if (!el) {
        loading.value = false;
        return;
    }

    const instance = init(el, { timezone: 'Asia/Kolkata' });
    chart = instance;
    setChart(instance);

    instance.subscribeAction('onScroll', () => updateLabelsDOM());
    instance.subscribeAction('onZoom', () => updateLabelsDOM());

    instance.setStyles({
        candle: {
            tooltip: {
                showRule: 'follow_cross',
                showType: 'standard'
            }
        }
    });
    applyChartStyles(themeStore.isDark ? 'dark' : 'light', chartStyleOverrides.value, instance);

    const precision = getSymbolPricePrecision(currentSymbol.value, candles);
    instance.setSymbol({
        ticker: currentSymbol.value,
        pricePrecision: precision,
        volumePrecision: 2
    });
    instance.setPeriod(intervalVal || 'minute');

    instance.setDataLoader({
        getBars: ({ callback }) => {
            // ✅ Normalize all historical candles to have "timestamp"
            const normalized = candles.map(c => ({
                ...c,
                timestamp: c.timestamp
                    ? normalizeTimestamp(c.timestamp, intervalVal)
                    : normalizeTimestamp(new Date(c.date).getTime(), intervalVal),
            }));

            callback(normalized);

            setTimeout(() => {
                chartStore.restoreDrawings();
                syncPositionOverlays();
            }, 0);
            loading.value = false;
        },
        subscribeBar: ({ callback }) => {
            barCallback = callback;
        },
    });

    if (selectedIndicators.value.length) {
        selectedIndicators.value.forEach(ind => {
            const isMain = isMainIndicator(ind);
            const paneId = isMain ? 'candle_pane' : (ind.paneId && ind.paneId !== 'candle_pane' ? ind.paneId : `pane-${ind.name}`);
            try {
                const createdId = instance.createIndicator({
                    name: ind.name,
                    paneId: paneId,
                    calcParams: ind.calcParams,
                    styles: ind.styles,
                    createTooltipDataSource: () => ({
                        name: '',
                        legends: []
                    })
                }, true);
                if (createdId) {
                    ind.id = createdId;
                    ind.paneId = paneId;
                }
            } catch (e) {
                console.error(`Failed to create indicator ${ind.name}:`, e);
            }
        });
    }
}

function destroyChart() {
    if (!chart) return;
    dispose('chart');
    chart = null;
    setChart(null);
    barCallback = null;
    currentCandle = null;
}

async function reloadChart() {
    destroyChart();
    await createChart();
}

// ─── Resize handling ──────────────────────────────────────────────────────────

let resizeFrame = null;
function handleResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
        chart?.resize();
        updateLabelsDOM();
        resizeFrame = null;
    });
}

// ─── Live price ───────────────────────────────────────────────────────────────

const liveData = computed(() => {
    const sym = currentSymbol.value;
    return tickerStore.getLastPrice(sym) || tickerStore.getLastPrice(normalizeChartSymbol(sym));
});

const formattedBid = computed(() => {
    const ltpData = liveData.value;
    if (ltpData && ltpData.bid && ltpData.bid > 0) {
        return ltpData.bid > 100 ? ltpData.bid.toFixed(2) : ltpData.bid.toFixed(4);
    }
    if (currentCandle?.close && currentCandle.close > 0) {
        return currentCandle.close > 100 ? currentCandle.close.toFixed(2) : currentCandle.close.toFixed(4);
    }
    return '- -';
});

const formattedAsk = computed(() => {
    const ltpData = liveData.value;
    if (ltpData && ltpData.ask && ltpData.ask > 0) {
        return ltpData.ask > 100 ? ltpData.ask.toFixed(2) : ltpData.ask.toFixed(4);
    }
    if (currentCandle?.close && currentCandle.close > 0) {
        return currentCandle.close > 100 ? currentCandle.close.toFixed(2) : currentCandle.close.toFixed(4);
    }
    return '- -';
});

watch(liveData, (ltpData) => {
    if (!ltpData || !currentCandle) return;

    let price = 0;
    if (ltpData.last && ltpData.last > 0) {
        price = Number(ltpData.last);
    } else if (ltpData.bid > 0 && ltpData.ask > 0) {
        price = (Number(ltpData.bid) + Number(ltpData.ask)) / 2;
    } else if (ltpData.bid > 0) {
        price = Number(ltpData.bid);
    } else if (ltpData.ask > 0) {
        price = Number(ltpData.ask);
    }

    if (!price || isNaN(price) || price <= 0) return;

    const rawTime = ltpData.time;
    let tickMs = 0;

    if (typeof rawTime === 'number' && rawTime > 0) {
        tickMs = rawTime > 1e10 ? Math.floor(rawTime) : Math.floor(rawTime * 1000);
        tickMs = tickMs + SERVER_UTC_OFFSET_MS; // ✅ shift tick to match historical UTC+3
    } else if (rawTime) {
        const parsed = new Date(rawTime).getTime();
        if (!isNaN(parsed) && parsed > 0) tickMs = parsed + SERVER_UTC_OFFSET_MS;
    }

    if (!tickMs || isNaN(tickMs) || tickMs <= 0) {
        tickMs = Date.now() + SERVER_UTC_OFFSET_MS;
    }
    const intervalVal = selectedInterval.value?.value || selectedInterval.value || 'minute';
    const tickCandleTime = normalizeTimestamp(tickMs, intervalVal);

    if (tickCandleTime > currentCandle.timestamp) {
        const openPrice = currentCandle.close || price;
        currentCandle = {
            timestamp: tickCandleTime,
            open: openPrice,
            high: Math.max(openPrice, price),
            low: Math.min(openPrice, price),
            close: price,
            volume: 1,
        };
        console.debug(`[Chart] New candle @ ${new Date(tickCandleTime).toISOString()}`);
    } else {
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
        currentCandle.volume = (currentCandle.volume || 0) + 1;
    }

    if (barCallback) barCallback(currentCandle);
    if (chart && typeof chart.updateData === 'function') chart.updateData(currentCandle);

    syncPositionOverlays();
});

// ─── Watchers ─────────────────────────────────────────────────────────────────

watch(
    () => [currentSymbol.value, selectedInterval.value?.value || selectedInterval.value],
    async ([newSymbol, newInterval], oldVal) => {
        if (!newSymbol || !oldVal) return;
        const [oldSymbol, oldInterval] = oldVal;
        if (newSymbol === oldSymbol && newInterval === oldInterval) return;

        tickerStore.updateTickerList([normalizeChartSymbol(newSymbol)]);
        await reloadChart();
    }
);

watch(
    () => selectedCandleType.value?.value || selectedCandleType.value,
    (newType) => {
        if (!newType) return;
        if (chartStore.chartStyleOverrides?.candle) {
            chartStore.chartStyleOverrides.candle.type = newType;
        }
        if (chart) {
            applyChartStyles(themeStore.isDark ? 'dark' : 'light', chartStore.chartStyleOverrides, chart);
        }
    }
);

watch(
    () => themeStore.isDark,
    (isDark) => {
        if (chart) {
            applyChartStyles(isDark ? 'dark' : 'light', chartStyleOverrides.value, chart);
            updateLabelsDOM();
        }
    }
);

// ─── Mount / Unmount ──────────────────────────────────────────────────────────

onMounted(async () => {
    if (currentSymbol.value) {
        tickerStore.updateTickerList([normalizeChartSymbol(currentSymbol.value)]);
    }

    await createChart();

    window.addEventListener('resize', handleResize);

    const el = chartRef.value || document.getElementById('chart');
    if (el) {
        resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        resizeObserver.observe(el);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    resizeObserver?.disconnect();
    resizeObserver = null;
    destroyChart();
});
</script>

<style scoped>
.exness-label-container {
    position: absolute;
    left: 20px;
    transform: translateY(-50%);
    z-index: 50;
    display: flex;
    flex-direction: row;
    align-items: center;
    pointer-events: auto;
    transition: none !important;
}

.exness-label {
    position: absolute;
    left: 20px;
    transform: translateY(-50%);
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 500;
    box-shadow: 0px 2px 6px -1px rgba(0, 0, 0, 0.2);
    z-index: 50;
    cursor: ns-resize;
    user-select: none;
    align-items: center;
    border-radius: 4px;
    overflow: hidden;
    transition: none !important;
    background-color: var(--color-card-background, #ffffff);
    color: var(--color-primary-text, #0f172a);
}

.exness-label-container .exness-label {
    position: static;
    transform: none;
}

.exness-label-badge {
    background-color: #666;
    color: #fff;
    padding: 0 5px;
    font-size: 9px;
    font-weight: 700;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    flex-shrink: 0;
}

.exness-label-part {
    padding: 1px 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    white-space: nowrap;
    flex-shrink: 0;
}

.exness-label-part.price {
    border-left: 1px solid var(--color-primary-border, #e2e8f0);
}

.exness-label-close {
    padding: 1px 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background-color 0.2s;
}

.exness-label-close:hover {
    background-color: rgba(128, 128, 128, 0.15);
}

.exness-label.entry {
    border: 1px solid #2196F3;
}

.exness-label.entry .qty {
    background-color: #2196F3;
    color: white;
    font-weight: 700;
}

.exness-label.entry .close-btn {
    border-left: 1px solid #2196F3;
    color: #2196F3;
}

.exness-label.target {
    border: 1px solid #22c55e;
}

.exness-label.target .qty {
    background-color: #22c55e;
    color: white;
}

.exness-label.target .close-btn {
    border-left: 1px solid #22c55e;
    color: #22c55e;
}

.exness-label.target .exness-label-badge {
    background-color: #22c55e;
}

.exness-label.stoploss {
    border: 1px solid #ef4444;
}

.exness-label.stoploss .qty {
    background-color: #ef4444;
    color: white;
}

.exness-label.stoploss .close-btn {
    border-left: 1px solid #ef4444;
    color: #ef4444;
}

.exness-label.stoploss .exness-label-badge {
    background-color: #ef4444;
}

.exness-label.target.pending {
    border: 1px dashed #22c55e !important;
}

.exness-label.stoploss.pending {
    border: 1px dashed #ef4444 !important;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translate(-50%, 10px);
}
</style>
