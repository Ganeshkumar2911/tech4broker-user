<script setup>
import {
  ref,
  onMounted,
  computed,
  onUnmounted,
  watch,
  nextTick,
  toRaw,
} from "vue";
import { init, dispose, registerOverlay } from "klinecharts";
import {
  Settings,
  Trash2,
  X,
  Loader2,
  ChevronsRight,
  PlusCircle,
  Minus,
  Plus,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Star,
  Minimize2,
  Sun,
  Moon,
} from "lucide-vue-next";
import { useChartStore } from "@/stores/client/chart";
import { useProfileStore } from "@/stores/shared/profile";
import { useTickerStore } from "@/stores/shared/ticker";
import { useWatchlistStore } from "@/stores/client/watchlist";
import usePositionsStore from "@/stores/client/positions";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import useOrderStore from "@/stores/client/orders";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useThemeStore } from "@/stores/shared/theme";
import { symbolSegment } from "@/utils/symbolsegment";
import { livePNL } from "@/utils/livePNL";
import {
  defaultFibonacciSettings,
  customFibonacciOverlay,
} from "./overlays/customFibonacciOverlay";
import {
  positionLineOverlay,
  slTpLineOverlay,
} from "./overlays/positionOverlays";
import FibonacciSettingsModal from "./modals/FibonacciSettingsModal.vue";
import DrawingSettingsModal from "./modals/DrawingSettingsModal.vue";
import ChartSettingsModal from "./modals/ChartSettingsModal.vue";
import IntervalSelector from "./IntervalSelector.vue";
import ChartRangesAndSentiments from "./ChartRangesAndSentiments.vue";

const props = defineProps({
  instrumentToken: {
    type: [String, Number],
    default: "XAUUSD",
  },
  symbol: {
    type: String,
    default: "XAUUSD",
  },
  exchange: {
    type: String,
    default: "FOREX",
  },
  interval: {
    type: String,
    default: "minute",
  },
  selectedInterval: {
    type: Object,
    default: () => ({ label: "1 m", shortLabel: "1m", value: "minute" }),
  },
  positions: {
    type: Array,
    default: () => [],
  },
  selectedPositionId: {
    type: [String, Number],
    default: null,
  },
  isCollapsed: {
    type: Boolean,
    default: false,
  },
  intervals: {
    type: Array,
    default: undefined,
  },
  fixed: {
    type: Boolean,
    default: false,
  },
  disableScrollAndZoom: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "positionUpdate",
  "squareOffPosition",
  "selectPosition",
  "deselectPosition",
  "update:selectedInterval",
  "pendingSLChange",
  "pendingTPChange",
  "candleChange",
  "trade",
  "openPositionSheet",
  "openMarketModal",
]);

const chartStore = useChartStore();
const tickerStore = useTickerStore();
const profileStore = useProfileStore();
const watchlistStore = useWatchlistStore();
const positionsStore = usePositionsStore();
const homeStore = useTradingAccountsStore();
const orderStore = useOrderStore();
const snackbar = useSnackbarStore();
const themeStore = useThemeStore();

// Watchlist Star & Favorite Logic for Zoom Topbar
function extractSymbolName(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (item.symbol) return String(item.symbol);
  if (item.name) return String(item.name);
  return String(item);
}

const isFavorite = computed(() => {
  const currentSym = (props.symbol || "").toUpperCase();
  if (!currentSym) return false;
  const cleanCurrent = currentSym.split(".")[0];

  if (watchlistStore.activeSymbols && watchlistStore.activeSymbols.length > 0) {
    const found = watchlistStore.activeSymbols.some((s) => {
      const symStr = extractSymbolName(s).toUpperCase();
      if (!symStr) return false;
      const cleanSym = symStr.split(".")[0];
      return symStr === currentSym || cleanSym === cleanCurrent;
    });
    if (found) return true;
  }

  if (watchlistStore.watchlists && watchlistStore.watchlists.length > 0) {
    return watchlistStore.watchlists.some((wl) => {
      if (!wl.symbols || !Array.isArray(wl.symbols)) return false;
      return wl.symbols.some((s) => {
        const symStr = extractSymbolName(s).toUpperCase();
        if (!symStr) return false;
        const cleanSym = symStr.split(".")[0];
        return symStr === currentSym || cleanSym === cleanCurrent;
      });
    });
  }

  return false;
});

function findWatchlistIdWithSymbol(sym) {
  if (!sym) return null;
  const currentSym = String(sym).toUpperCase();
  const cleanCurrent = currentSym.split(".")[0];

  if (
    watchlistStore.activeWatchlistId &&
    watchlistStore.activeSymbols?.length
  ) {
    const found = watchlistStore.activeSymbols.some((s) => {
      const symStr = extractSymbolName(s).toUpperCase();
      if (!symStr) return false;
      const cleanSym = symStr.split(".")[0];
      return symStr === currentSym || cleanSym === cleanCurrent;
    });
    if (found) return watchlistStore.activeWatchlistId;
  }

  if (watchlistStore.watchlists?.length) {
    for (const wl of watchlistStore.watchlists) {
      if (wl.symbols && Array.isArray(wl.symbols)) {
        const found = wl.symbols.some((s) => {
          const symStr = extractSymbolName(s).toUpperCase();
          if (!symStr) return false;
          const cleanSym = symStr.split(".")[0];
          return symStr === currentSym || cleanSym === cleanCurrent;
        });
        if (found) return wl.id;
      }
    }
  }
  return null;
}

async function toggleFavorite() {
  let activeWlId = watchlistStore.activeWatchlistId;
  if (!activeWlId) {
    try {
      const list = await watchlistStore.fetchWatchlists();
      activeWlId = watchlistStore.activeWatchlistId || list?.[0]?.id;
    } catch (e) {
      // ignore
    }
  }

  if (!activeWlId) {
    snackbar.show("No active watchlist found.", "error");
    return;
  }

  const wasFavorite = isFavorite.value;
  const currentSymbol = props.symbol;

  try {
    if (wasFavorite) {
      const targetWlId = findWatchlistIdWithSymbol(currentSymbol) || activeWlId;
      await watchlistStore.removeSymbolByName(targetWlId, currentSymbol);
      snackbar.show(`${currentSymbol} removed from watchlist`, "success");
    } else {
      await watchlistStore.addSymbolToWatchlist(activeWlId, currentSymbol);
      snackbar.show(`${currentSymbol} added to watchlist`, "success");
    }
  } catch (err) {
    snackbar.show(
      err?.message || "Failed to update watchlist",
      "error"
    );
  }
}

// Floating Trade Widget State & Handlers
const floatingLots = ref(0.01);
const isPlacingFloatingOrder = ref(false);
const activeFloatingDirection = ref("");
const isFloatingBarMinimized = ref(false);

// Floating Trade Widget Draggable State
const floatingPanelPos = ref({ x: null, y: null });
const isDraggingFloatingPanel = ref(false);
const floatingPanelRef = ref(null);

function startDragFloatingPanel(e) {
  if (e.target.closest("button, input")) return;

  const panelEl = floatingPanelRef.value;
  if (!panelEl) return;

  const rect = panelEl.getBoundingClientRect();
  const startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
  const startY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
  const offsetX = startX - rect.left;
  const offsetY = startY - rect.top;

  isDraggingFloatingPanel.value = true;

  function onMove(moveEvent) {
    if (!isDraggingFloatingPanel.value) return;
    const currentX =
      moveEvent.clientX ||
      (moveEvent.touches && moveEvent.touches[0]?.clientX) ||
      0;
    const currentY =
      moveEvent.clientY ||
      (moveEvent.touches && moveEvent.touches[0]?.clientY) ||
      0;

    let newX = currentX - offsetX;
    let newY = currentY - offsetY;

    const maxX = window.innerWidth - rect.width - 12;
    const maxY = window.innerHeight - rect.height - 12;
    newX = Math.max(12, Math.min(newX, maxX));
    newY = Math.max(12, Math.min(newY, maxY));

    floatingPanelPos.value = { x: newX, y: newY };
  }

  function onEnd() {
    isDraggingFloatingPanel.value = false;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onEnd);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onEnd);
}

const livePriceTicker = computed(() => tickerStore.getLastPrice(props.symbol));

const floatingBidPrice = computed(() => {
  const p = livePriceTicker.value?.bid;
  if (p && !isNaN(Number(p))) return Number(p);
  if (activeCandleData.value?.close) {
    const c = Number(String(activeCandleData.value.close).replace(/,/g, ""));
    if (!isNaN(c)) return c;
  }
  return null;
});

const floatingAskPrice = computed(() => {
  const p = livePriceTicker.value?.ask;
  if (p && !isNaN(Number(p))) return Number(p);
  if (floatingBidPrice.value) return floatingBidPrice.value;
  return null;
});

const formattedBidPrice = computed(() => {
  if (floatingBidPrice.value === null) return "--";
  return floatingBidPrice.value > 100
    ? floatingBidPrice.value.toFixed(2)
    : floatingBidPrice.value.toFixed(4);
});

const formattedAskPrice = computed(() => {
  if (floatingAskPrice.value === null) return "--";
  return floatingAskPrice.value > 100
    ? floatingAskPrice.value.toFixed(2)
    : floatingAskPrice.value.toFixed(4);
});

function incrementFloatingLots() {
  const val = Number((floatingLots.value + 0.01).toFixed(2));
  floatingLots.value = val;
}

function decrementFloatingLots() {
  if (floatingLots.value <= 0.01) return;
  const val = Number((floatingLots.value - 0.01).toFixed(2));
  floatingLots.value = Math.max(0.01, val);
}

function onFloatingLotsInput(e) {
  const val = Number(e.target.value);
  if (!isNaN(val) && val >= 0.01) {
    floatingLots.value = val;
  }
}

async function executeFloatingTrade(direction) {
  if (floatingLots.value < 0.01) {
    snackbar.show("Minimum Lot must be at least 0.01", "error");
    return;
  }

  const accId = homeStore.selectedAccountId || orderStore.selectedAccount;
  if (!accId) {
    snackbar.show("Please select a trading account first.", "error");
    return;
  }

  const targetAccount = homeStore.data?.find(
    (acc) => (acc.id ?? acc.raw?.id) == accId
  );
  const brokerCurrency = (
    targetAccount?.broker_currency ||
    targetAccount?.currency ||
    targetAccount?.raw?.broker_currency ||
    targetAccount?.raw?.currency ||
    ""
  ).toUpperCase();

  let finalSymbol = String(props.symbol);
  if (brokerCurrency === "USC") {
    finalSymbol = finalSymbol.endsWith(".c") ? finalSymbol : `${finalSymbol}.c`;
  }

  const tradeType = direction.toUpperCase();
  let referencePrice = tradeType === "BUY" ? (floatingAskPrice.value || 0) : (floatingBidPrice.value || 0);

  const payload = {
    trading_account_id: Number(accId),
    symbol: finalSymbol,
    type: tradeType,
    volume: Number(floatingLots.value),
    comment: `Chart Zoom ${tradeType}`,
  };

  if (referencePrice > 0) {
    payload.price = referencePrice;
  }

  isPlacingFloatingOrder.value = true;
  activeFloatingDirection.value = tradeType;

  try {
    await orderStore.placeOrder(payload);
    orderStore.fetchOrders(accId);
    positionsStore.fetchPositions(accId);
    emit("trade", { direction: tradeType, volume: Number(floatingLots.value), symbol: finalSymbol });
  } catch (err) {
    console.error("Floating trade error:", err);
  } finally {
    isPlacingFloatingOrder.value = false;
    activeFloatingDirection.value = "";
  }
}

const activeCandleData = ref({
  open: "64,811.44",
  high: "64,823.46",
  low: "64,787.89",
  close: "64,800.99",
  volume: "84",
  time: "05:06",
});

function updateCandleData(candle) {
  if (!candle) return;
  const dateObj = candle.timestamp ? new Date(candle.timestamp) : new Date();
  const timeStr = dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  activeCandleData.value = {
    open:
      typeof candle.open === "number"
        ? candle.open.toLocaleString()
        : candle.open,
    high:
      typeof candle.high === "number"
        ? candle.high.toLocaleString()
        : candle.high,
    low:
      typeof candle.low === "number" ? candle.low.toLocaleString() : candle.low,
    close:
      typeof candle.close === "number"
        ? candle.close.toLocaleString()
        : candle.close,
    volume: candle.volume !== undefined ? candle.volume : "0",
    time: timeStr,
  };
  emit("candleChange", candle);
}

watch(
  () => props.isCollapsed,
  () => {
    nextTick(() => {
      resizeChart();
    });
  },
);

const currentInterval = ref(
  props.selectedInterval || { label: "1 m", shortLabel: "1m", value: "minute" },
);

const SERVER_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function getIntervalInMs(interval) {
  if (typeof interval === "object" && interval) {
    interval = interval.value || interval.type || "minute";
  }
  const str = String(interval || "minute");
  if (str === "minute" || str === "1m" || str === "1") return MINUTE_MS;
  if (str === "day" || str === "1d" || str === "D") return DAY_MS;
  if (str.endsWith("minute")) return (parseInt(str) || 1) * MINUTE_MS;
  if (str.endsWith("m")) return (parseInt(str) || 1) * MINUTE_MS;
  if (str.endsWith("h")) return (parseInt(str) || 1) * 60 * MINUTE_MS;
  if (str.endsWith("d")) return (parseInt(str) || 1) * DAY_MS;
  const num = parseInt(str);
  if (!isNaN(num) && num > 0) return num * MINUTE_MS;
  return MINUTE_MS;
}

function normalizeTimestamp(timestamp, interval) {
  const intervalStr =
    typeof interval === "object" && interval
      ? interval.value || "minute"
      : String(interval || "minute");
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return Date.now();

  if (intervalStr === "day" || intervalStr === "1d" || intervalStr === "D") {
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }
  if (intervalStr === "week" || intervalStr === "1w" || intervalStr === "W") {
    const day = date.getDay();
    date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  const intervalMs = getIntervalInMs(intervalStr);
  return Math.floor(date.getTime() / intervalMs) * intervalMs;
}

const mapPeriodFromInterval = (val) => {
  if (val === "minute" || val === "1M" || val === "1m")
    return { type: "minute", span: 1 };
  if (val === "3minute" || val === "3M" || val === "3m")
    return { type: "minute", span: 3 };
  if (val === "5minute" || val === "5M" || val === "5m")
    return { type: "minute", span: 5 };
  if (val === "15minute" || val === "15M" || val === "15m")
    return { type: "minute", span: 15 };
  if (val === "30minute" || val === "30M" || val === "30m")
    return { type: "minute", span: 30 };
  if (val === "60minute" || val === "60M" || val === "60m" || val === "1H" || val === "1h")
    return { type: "minute", span: 60 };
  if (val === "day" || val === "1D" || val === "1d" || val === "D")
    return { type: "day", span: 1 };
  return { type: "minute", span: 1 };
};

const selectInterval = (item) => {
  currentInterval.value = item;
  emit("update:selectedInterval", item);
  if (chartRef) {
    const period = mapPeriodFromInterval(item.value);
    chartRef.setPeriod(period);
    loadHistoricalData();
  }
};

const chartContainer = ref(null);
let chartRef = null;
const isLoadingChart = ref(true);

const isChartSettingsOpen = ref(false);
const isFibModalOpen = ref(false);
const isGenericModalOpen = ref(false);

const activeDrawing = ref(null);
const activeFibConfig = ref(null);

const chartSettings = ref({
  backgroundColor: "#ffffff",
  grid: {
    showHorizontal: true,
    showVertical: true,
    color: "#F1F5F9",
    style: "dash",
  },
  candle: {
    type: "candle_solid",
    upColor: "#089981",
    downColor: "#F23645",
  },
  axis: {
    textColor: "#8A92A3",
  },
});

const applyChartStyles = (chart, settings) => {
  if (!chart || !settings) return;
  const candleTypeMap = {
    candlestick: "candle_solid",
    hollow: "candle_stroke",
    line: "area",
    bars: "ohlc",
  };
  const candleType = candleTypeMap[settings.candle?.type] || "candle_solid";

  const showTooltip = isFullscreen.value;
  const isDark = themeStore.isDark;
  const bgColor = isDark ? "#0B0F19" : (settings.backgroundColor || "#ffffff");
  const gridColor = isDark ? "#1E293B" : (settings.grid?.color || "#F1F5F9");
  const axisColor = isDark ? "#1E293B" : "#E2E8F0";
  const textColor = isDark ? "#94A3B8" : (settings.axis?.textColor || "#8A92A3");

  chart.setStyles({
    grid: {
      show: settings.grid.showHorizontal || settings.grid.showVertical,
      horizontal: {
        show: settings.grid.showHorizontal,
        color: gridColor,
        style: settings.grid.style,
      },
      vertical: {
        show: settings.grid.showVertical,
        color: gridColor,
        style: settings.grid.style,
      },
    },
    candle: {
      type: candleType,
      tooltip: {
        showRule: showTooltip ? "always" : "none",
        showType: showTooltip ? "standard" : "none",
        title: {
          show: false,
          template: "",
        },
        legend: {
          marginRight: 6,
          size: 9,
          template: ({ current }, styles) => {
            const isUp = current ? current.close >= current.open : true;
            const ohlcColor = isUp
              ? (styles?.bar?.upColor || settings.candle?.upColor || "#12A879")
              : (styles?.bar?.downColor || settings.candle?.downColor || "#E5484D");
            return [
              { title: { text: "O: ", color: ohlcColor }, value: { text: "{open}", color: ohlcColor } },
              { title: { text: "H: ", color: ohlcColor }, value: { text: "{high}", color: ohlcColor } },
              { title: { text: "L: ", color: ohlcColor }, value: { text: "{low}", color: ohlcColor } },
              { title: { text: "C: ", color: ohlcColor }, value: { text: "{close}", color: ohlcColor } },
            ];
          },
        },
        labels: ["O: ", "H: ", "L: ", "C: "],
        text: {
          family: "Inter, sans-serif",
          fontFamily: "Inter, sans-serif",
          size: 11,
        },
      },
      bar: {
        upColor: settings.candle.upColor,
        downColor: settings.candle.downColor,
        upBorderColor: settings.candle.upColor,
        downBorderColor: settings.candle.downColor,
        upWickColor: settings.candle.upColor,
        downWickColor: settings.candle.downColor,
      },
    },
    indicator: {
      tooltip: {
        showRule: showTooltip ? "always" : "none",
        showType: showTooltip ? "standard" : "none",
        text: {
          family: "Inter, sans-serif",
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    xAxis: {
      axisLine: { show: true, color: axisColor },
      tickLine: { show: false },
      tickText: { color: textColor, family: "Inter, sans-serif", fontFamily: "Inter, sans-serif" },
    },
    yAxis: {
      axisLine: { show: true, color: axisColor },
      tickLine: { show: false },
      tickText: { color: textColor, family: "Inter, sans-serif", fontFamily: "Inter, sans-serif" },
    },
    separator: {
      color: axisColor,
    },
    background: {
      color: bgColor,
    },
  });
};

// NEW: handler for saving chart settings from the modal (previously missing)
function handleSaveChartSettings(newSettings) {
  chartSettings.value = newSettings;
  applyChartStyles(chartRef, newSettings);
  isChartSettingsOpen.value = false;
}

const isFullscreen = ref(false);
const showResetButton = ref(false);

watch(
  () => themeStore.isDark,
  () => {
    if (chartRef) {
      applyChartStyles(chartRef, chartSettings.value);
    }
  }
);

watch(isFullscreen, () => {
  showResetButton.value = false;
  if (chartRef) {
    applyChartStyles(chartRef, chartSettings.value);
    updateChartInteractivity();
  }
});

function updateChartInteractivity() {
  if (!chartRef) return;
  const isFixed = (props.fixed || props.disableScrollAndZoom) && !isFullscreen.value;
  chartRef.setZoomEnabled(!isFixed);
  chartRef.setScrollEnabled(!isFixed);
  if (typeof chartRef.overrideYAxis === "function") {
    try {
      chartRef.overrideYAxis({ scrollZoomEnabled: !isFixed });
    } catch (e) {
      // ignore
    }
  }
}

watch(
  () => [props.fixed, props.disableScrollAndZoom],
  () => {
    updateChartInteractivity();
  }
);

function handlePopState() {
  if (isFullscreen.value) {
    isFullscreen.value = false;
    showResetButton.value = false;
    window.removeEventListener("popstate", handlePopState);
    if (chartRef) {
      updateChartInteractivity();
      nextTick(() => {
        resizeChart();
      });
    }
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  showResetButton.value = false;

  if (isFullscreen.value) {
    history.pushState({ chartFullscreen: true }, "");
    window.addEventListener("popstate", handlePopState);
  } else {
    window.removeEventListener("popstate", handlePopState);
    if (history.state?.chartFullscreen) {
      history.back();
    }
  }

  if (chartRef) {
    updateChartInteractivity();
    nextTick(() => {
      resizeChart();
    });
  }
}

let initialBarSpace = 6;
let initialOffsetRightDistance = 50;

function resizeChart() {
  if (chartRef && chartContainer.value) {
    chartRef.resize();
  }
}

function checkResetButtonVisibility() {
  if (!chartRef || !isFullscreen.value) {
    showResetButton.value = false;
    return;
  }
  try {
    const dataList = chartRef.getDataList?.() || [];
    const totalBars = dataList.length;
    if (totalBars === 0) {
      showResetButton.value = false;
      return;
    }
    const visibleRange = chartRef.getVisibleRange?.();
    const currentBarSpace = chartRef.getBarSpace?.()?.bar;
    const currentOffsetRight = chartRef.getOffsetRightDistance?.();

    // 1. Zoom check: has bar scale changed?
    const isZoomed = Boolean(
      initialBarSpace &&
      currentBarSpace &&
      Math.abs(currentBarSpace - initialBarSpace) > 0.4
    );

    // 2. Scrolled left (into past history)
    const isScrolledLeft = Boolean(
      visibleRange &&
      (visibleRange.realTo < totalBars || visibleRange.to < totalBars - 1)
    );

    // 3. Scrolled right (pushed latest candle left, showing future blank space)
    const defaultOffsetBars = Math.round((initialOffsetRightDistance || 50) / (currentBarSpace || initialBarSpace || 6));
    const isScrolledRight = Boolean(
      (currentOffsetRight !== undefined && initialOffsetRightDistance !== undefined && currentOffsetRight > initialOffsetRightDistance + 12) ||
      (visibleRange && visibleRange.realTo > totalBars + defaultOffsetBars + 1.5)
    );

    showResetButton.value = isZoomed || isScrolledLeft || isScrolledRight;
  } catch (e) {
    // fallback
  }
}

function handleResetView() {
  if (!chartRef) return;
  try {
    // 1. Reset zoom level (bar space) back to initial default
    if (typeof chartRef.setBarSpace === "function" && initialBarSpace) {
      chartRef.setBarSpace(initialBarSpace);
    }
    // 2. Reset Y-axis scale / auto-fit to visible candle prices (recovers off-screen candles)
    if (typeof chartRef.overrideYAxis === "function") {
      chartRef.overrideYAxis({ scrollZoomEnabled: true });
    }
    // 3. Jump scroll back to real-time live candle immediately
    if (typeof chartRef.scrollToRealTime === "function") {
      chartRef.scrollToRealTime(0);
    }
    // 4. Force chart layout redraw
    if (typeof chartRef.resize === "function") {
      chartRef.resize();
    }
  } catch (e) {
    console.warn("Reset view error:", e);
  }
  showResetButton.value = false;
  setTimeout(() => {
    checkResetButtonVisibility();
  }, 150);
}

function getBasePriceForSymbol(symbol) {
  if (!symbol) return 2500.0;
  const sym = String(symbol).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (sym.includes("XAU") || sym.includes("GOLD")) return 2500.0;
  if (sym.includes("XAG") || sym.includes("SILVER")) return 29.5;
  if (sym.includes("EURUSD")) return 1.085;
  if (sym.includes("GBPUSD")) return 1.312;
  if (sym.includes("USDJPY")) return 145.5;
  if (sym.includes("AUDUSD")) return 0.675;
  if (sym.includes("USDCAD")) return 1.352;
  if (sym.includes("USDCHF")) return 0.851;
  if (sym.includes("NZDUSD")) return 0.618;
  if (sym.includes("BTC")) return 65000.0;
  if (sym.includes("ETH")) return 2600.0;
  if (sym.includes("US30") || sym.includes("DJI")) return 41200.0;
  if (sym.includes("US500") || sym.includes("SPX")) return 5600.0;
  if (sym.includes("US100") || sym.includes("NDX")) return 19500.0;
  if (sym.includes("OIL") || sym.includes("WTI")) return 75.0;
  return 100.0;
}

function generateMockCandles(symbolStr, intervalStr, targetPrice = 0) {
  const sym = String(symbolStr || "XAUUSD").toUpperCase();
  const price = targetPrice && targetPrice > 0 ? targetPrice : getBasePriceForSymbol(sym);

  const period = mapPeriodFromInterval(intervalStr);
  let stepMs = 60000;
  if (period.type === "minute") stepMs = period.span * 60000;
  else if (period.type === "hour") stepMs = period.span * 3600000;
  else if (period.type === "day") stepMs = period.span * 86400000;

  const nowMs = Math.floor(Date.now() / stepMs) * stepMs;
  const count = 100;
  const candles = [];

  let currentP = price * 0.985;
  const precision = price > 100 ? 2 : 4;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = nowMs - i * stepMs;
    const volatility = currentP * 0.0025;
    const change = (Math.random() - 0.47) * volatility;
    const open = currentP;
    const close = Math.max(0.0001, open + change);
    const high = Math.max(open, close) + Math.random() * volatility * 0.4;
    const low = Math.min(open, close) - Math.random() * volatility * 0.4;
    const volume = Math.floor(Math.random() * 300) + 20;

    candles.push({
      timestamp,
      open: Number(open.toFixed(precision)),
      high: Number(high.toFixed(precision)),
      low: Number(low.toFixed(precision)),
      close: Number(close.toFixed(precision)),
      volume,
    });

    currentP = close;
  }

  if (candles.length > 0 && price > 0) {
    const last = candles[candles.length - 1];
    last.close = Number(price.toFixed(precision));
    if (last.high < last.close) last.high = last.close;
    if (last.low > last.close) last.low = last.close;
  }

  return candles;
}

async function fetchAndFormatCandles() {
  const symbolStr = String(props.symbol || "XAUUSD").toUpperCase();
  const intervalVal = currentInterval.value?.value || props.interval || "minute";

  let candles = [];
  try {
    if (typeof chartStore.fetchHistoricalData === "function") {
      candles = await chartStore.fetchHistoricalData(symbolStr, intervalVal);
    } else if (typeof chartStore.getHistoricalData === "function") {
      candles = await chartStore.getHistoricalData(symbolStr, intervalVal);
    }
  } catch (e) {
    console.error("Error fetching historical data:", e);
  }

  let parsed = toRaw(candles ?? [])
    .map((item) => {
      let ts = item.timestamp || (item.date ? new Date(item.date).getTime() : 0);
      if (typeof ts === "number" && ts < 1e10 && ts > 0) {
        ts = ts * 1000;
      }
      return {
        timestamp: normalizeTimestamp(ts || Date.now(), intervalVal),
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume || 0),
      };
    })
    .filter(
      (item) =>
        Number.isFinite(item.timestamp) &&
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close) &&
        item.open > 0 &&
        item.high > 0 &&
        item.low > 0 &&
        item.close > 0
    );

  let targetPrice = 0;
  const ltpData = tickerStore.getLastPrice(symbolStr);
  if (ltpData) {
    if (ltpData.last && Number(ltpData.last) > 0) targetPrice = Number(ltpData.last);
    else if (ltpData.bid > 0 && ltpData.ask > 0) targetPrice = (Number(ltpData.bid) + Number(ltpData.ask)) / 2;
    else if (ltpData.bid > 0) targetPrice = Number(ltpData.bid);
    else if (ltpData.ask > 0) targetPrice = Number(ltpData.ask);
  }
  if (!targetPrice) {
    targetPrice = getBasePriceForSymbol(symbolStr);
  }

  if (!parsed.length) {
    return [];
  }

  // Sort strictly by timestamp ascending (oldest first, newest last)
  parsed.sort((a, b) => a.timestamp - b.timestamp);

  return parsed;
}

const loadHistoricalData = async () => {
  if (!chartRef) return;
  isLoadingChart.value = true;
  try {
    const formattedData = await fetchAndFormatCandles();
    if (chartRef && Array.isArray(formattedData) && formattedData.length > 0) {
      const intervalVal = currentInterval.value?.value || props.interval || "minute";
      if (typeof chartRef.setDataLoader === "function") {
        chartRef.setDataLoader({
          getBars: (params) => {
            params.callback(formattedData, false);
          },
          subscribeBar: (params) => {
            realTimeBarCallback = params.callback;
          },
          unsubscribeBar: () => {
            realTimeBarCallback = null;
          },
        });
        chartRef.resetData();
      } else if (typeof chartRef.applyNewData === "function") {
        chartRef.applyNewData(formattedData);
      }
      const last = { ...formattedData[formattedData.length - 1] };
      last.timestamp = normalizeTimestamp(last.timestamp, intervalVal);
      currentCandle = last;
      updateCandleData(currentCandle);
      updateChartInteractivity();
    }
  } catch (err) {
    console.error("Error loading historical data:", err);
  } finally {
    isLoadingChart.value = false;
    showResetButton.value = false;
  }
};

watch(
  () => props.symbol,
  (newSym) => {
    if (newSym && chartRef) {
      tickerStore.updateTickerList([newSym]);
      chartRef.setSymbol({
        ticker: newSym,
        pricePrecision: newSym.includes("JPY") ? 3 : (newSym.includes("XAU") || newSym.includes("BTC") ? 2 : 5),
        volumePrecision: 0,
      });
      loadHistoricalData();
    }
  }
);

watch(
  livePriceTicker,
  (newTicker) => {
    if (!newTicker || !chartRef || !currentCandle) return;
    let ltp = 0;
    if (newTicker.last && Number(newTicker.last) > 0) {
      ltp = Number(newTicker.last);
    } else if (newTicker.bid > 0 && newTicker.ask > 0) {
      ltp = (Number(newTicker.bid) + Number(newTicker.ask)) / 2;
    } else if (newTicker.bid > 0) {
      ltp = Number(newTicker.bid);
    } else if (newTicker.ask > 0) {
      ltp = Number(newTicker.ask);
    }

    if (!ltp || isNaN(ltp) || ltp <= 0) return;

    const rawTime = newTicker.time;
    let tickMs = 0;

    if (typeof rawTime === "number" && rawTime > 0) {
      tickMs = rawTime > 1e10 ? Math.floor(rawTime) : Math.floor(rawTime * 1000);
      tickMs = tickMs + SERVER_UTC_OFFSET_MS;
    } else if (rawTime) {
      const parsed = new Date(rawTime).getTime();
      if (!isNaN(parsed) && parsed > 0) tickMs = parsed + SERVER_UTC_OFFSET_MS;
    }

    if (!tickMs || isNaN(tickMs) || tickMs <= 0) {
      tickMs = Date.now() + SERVER_UTC_OFFSET_MS;
    }

    const intervalVal = currentInterval.value?.value || props.interval || "minute";
    const tickCandleTime = normalizeTimestamp(tickMs, intervalVal);

    if (tickCandleTime > currentCandle.timestamp) {
      const openPrice = currentCandle.close || ltp;
      currentCandle = {
        timestamp: tickCandleTime,
        open: openPrice,
        high: Math.max(openPrice, ltp),
        low: Math.min(openPrice, ltp),
        close: ltp,
        volume: 1,
      };
    } else {
      currentCandle.high = Math.max(currentCandle.high, ltp);
      currentCandle.low = Math.min(currentCandle.low, ltp);
      currentCandle.close = ltp;
      currentCandle.volume = (currentCandle.volume || 0) + 1;
    }

    if (typeof realTimeBarCallback === "function") {
      realTimeBarCallback(currentCandle);
    }
    if (chartRef && typeof chartRef.updateData === "function") {
      chartRef.updateData(currentCandle);
    }
    updateCandleData(currentCandle);
  },
  { deep: true }
);

let currentCandle = null;
let realTimeBarCallback = null;

const labelYMap = ref({});
const slYMap = ref({});
const tpYMap = ref({});

const formatTradedPrice = (val) => {
  if (!val || isNaN(Number(val))) return "--";
  const num = Number(val);
  return num > 100 ? num.toFixed(2) : num.toFixed(4);
};

const getPositionPnl = (pos) => {
  if (!pos) return 0;
  try {
    const calcPnl = livePNL(pos);
    if (calcPnl !== undefined && calcPnl !== null && !isNaN(Number(calcPnl))) {
      return Number(calcPnl);
    }
  } catch (e) {
    // fallback if livePNL calculation throws error
  }
  if (pos.unrealized_pnl !== undefined) return Number(pos.unrealized_pnl);
  if (pos.pnl !== undefined) return Number(pos.pnl);
  if (pos.profit !== undefined) return Number(pos.profit);
  return 0;
};

const getPosSlPrice = (pos) => {
  if (!pos) return null;
  const sl =
    pos.price_sl ??
    pos.sl_price ??
    pos.sl ??
    pos.stop_loss ??
    pos.stopLoss ??
    pos.stop_loss_price ??
    pos.price_loss ??
    pos.tp_sl?.sl;
  return sl && !isNaN(Number(sl)) && Number(sl) > 0 ? Number(sl) : null;
};

const getPosTpPrice = (pos) => {
  if (!pos) return null;
  const tp =
    pos.price_tp ??
    pos.tp_price ??
    pos.tp ??
    pos.take_profit ??
    pos.takeProfit ??
    pos.take_profit_price ??
    pos.price_profit ??
    pos.tp_sl?.tp;
  return tp && !isNaN(Number(tp)) && Number(tp) > 0 ? Number(tp) : null;
};

const isPendingOrder = (pos) => {
  if (!pos) return false;
  const side = String(pos.type || pos.action || pos.side || pos.order_type || "").toUpperCase();
  return Boolean(
    pos._itemType === "order" ||
    pos.order_ticket ||
    pos.status === "PLACED" ||
    pos.state === "PLACED" ||
    pos.is_pending ||
    pos.isPending ||
    side.includes("LIMIT") ||
    side.includes("STOP")
  );
};

const openPositionsForChart = computed(() => {
  const posData = Array.isArray(props.positions)
    ? props.positions
    : positionsStore.data || [];
  const pendingOrds = orderStore.pendingOrdersData || [];
  const allPositions = [...posData, ...pendingOrds];

  const cleanSym = String(props.symbol || "XAUUSD").toUpperCase();
  return allPositions.filter((p) => {
    const pSym = String(p.symbol || "").toUpperCase();
    return pSym === cleanSym || pSym.replace(/\.c$/i, "") === cleanSym;
  });
});

async function handleSquareOffPosition(pos) {
  const ticket = pos.position_ticket || pos.id || pos.ticket;
  if (!ticket) return;

  try {
    if (typeof positionsStore.closePosition === "function") {
      await positionsStore.closePosition(ticket);
      snackbar.show("Position squared off successfully", "success");
      const accId = homeStore.selectedAccountId;
      if (accId) positionsStore.fetchPositions(accId);
    }
  } catch (err) {
    console.error("Error closing position:", err);
  }
}

let updatePositionsPositionInterval = null;

const updatePositionsYPixels = () => {
  if (!chartRef || !openPositionsForChart.value.length) {
    labelYMap.value = {};
    slYMap.value = {};
    tpYMap.value = {};
    return;
  }

  const map = {};
  const slMap = {};
  const tpMap = {};

  const containerHeight = chartContainer.value?.clientHeight || 400;

  openPositionsForChart.value.forEach((pos) => {
    const ticket = pos.position_ticket || pos.order_ticket || pos.id || pos.ticket;

    // 1. Entry Price Y position
    const price = Number(
      pos.entry_price || pos.price_open || pos.price || pos.traded_price,
    );
    if (price && !isNaN(price)) {
      const res = chartRef.convertToPixel(
        { value: price },
        { paneId: "candle_pane" },
      );
      const y = Array.isArray(res) ? res[0]?.y : res?.y;
      if (y !== undefined && y >= 25 && y <= containerHeight - 15) {
        map[ticket] = y;
      }
    }

    // 2. Stop Loss (SL) Y position
    const slPrice = draftSlMap.value[ticket] ?? getPosSlPrice(pos);
    if (slPrice && !isNaN(slPrice)) {
      const res = chartRef.convertToPixel(
        { value: slPrice },
        { paneId: "candle_pane" },
      );
      const y = Array.isArray(res) ? res[0]?.y : res?.y;
      if (y !== undefined && y >= 25 && y <= containerHeight - 15) {
        slMap[ticket] = y;
      }
    }

    // 3. Take Profit (TP) Y position
    const tpPrice = draftTpMap.value[ticket] ?? getPosTpPrice(pos);
    if (tpPrice && !isNaN(tpPrice)) {
      const res = chartRef.convertToPixel(
        { value: tpPrice },
        { paneId: "candle_pane" },
      );
      const y = Array.isArray(res) ? res[0]?.y : res?.y;
      if (y !== undefined && y >= 25 && y <= containerHeight - 15) {
        tpMap[ticket] = y;
      }
    }
  });

  labelYMap.value = map;
  slYMap.value = slMap;
  tpYMap.value = tpMap;
};

const activeOverlayIds = new Set();
let dragDebounceTimer = null;

const draftSlMap = ref({});
const draftTpMap = ref({});
const isDraftSlMap = ref({});
const isDraftTpMap = ref({});

const isSlDraft = (pos) => {
  if (!pos) return false;
  const ticket = pos.position_ticket || pos.order_ticket || pos.id || pos.ticket;
  const serverSl = getPosSlPrice(pos);
  if (serverSl && serverSl > 0 && isDraftSlMap.value[ticket] === false) return false;
  return Boolean(
    isDraftSlMap.value[ticket] ||
    (draftSlMap.value[ticket] !== undefined && (!serverSl || serverSl <= 0))
  );
};

const isTpDraft = (pos) => {
  if (!pos) return false;
  const ticket = pos.position_ticket || pos.order_ticket || pos.id || pos.ticket;
  const serverTp = getPosTpPrice(pos);
  if (serverTp && serverTp > 0 && isDraftTpMap.value[ticket] === false) return false;
  return Boolean(
    isDraftTpMap.value[ticket] ||
    (draftTpMap.value[ticket] !== undefined && (!serverTp || serverTp <= 0))
  );
};

const removeDraftSl = (ticket) => {
  if (!ticket) return;
  const pos = openPositionsForChart.value.find(
    (p) => String(p.position_ticket || p.id || p.ticket) === String(ticket)
  );
  const serverSl = getPosSlPrice(pos);

  delete draftSlMap.value[ticket];
  delete isDraftSlMap.value[ticket];
  delete slYMap.value[ticket];
  if (serverSl && serverSl > 0) {
    positionsStore.modifySlTp(ticket, { sl: null, tp: getPosTpPrice(pos) });
  }
  syncPositionOverlays();
  updatePositionsYMap();
};

const toggleDraftSl = (ticket) => {
  if (!ticket) return;
  const pos = openPositionsForChart.value.find(
    (p) => String(p.position_ticket || p.id || p.ticket) === String(ticket)
  );
  const serverSl = getPosSlPrice(pos);

  // If not present, add draft SL line; if already present, do not remove
  if (draftSlMap.value[ticket] === undefined && (!serverSl || serverSl <= 0)) {
    const side = String(pos?.type || pos?.action || pos?.side || "BUY").toUpperCase();
    const isBuy = side.includes("BUY");
    const refP = Number(pos?.entry_price || pos?.price_open || pos?.price || livePriceTicker.value?.bid || 100);
    const isHigh = refP > 100;
    const pipOffset = isHigh ? 2.0 : 0.0020;
    const defaultSl = isBuy ? refP - pipOffset : refP + pipOffset;
    const decimals = isHigh ? 2 : 4;

    draftSlMap.value[ticket] = Number(defaultSl.toFixed(decimals));
    isDraftSlMap.value[ticket] = true;
  }
  syncPositionOverlays();
  updatePositionsYMap();
};

const removeDraftTp = (ticket) => {
  if (!ticket) return;
  const pos = openPositionsForChart.value.find(
    (p) => String(p.position_ticket || p.id || p.ticket) === String(ticket)
  );
  const serverTp = getPosTpPrice(pos);

  delete draftTpMap.value[ticket];
  delete isDraftTpMap.value[ticket];
  delete tpYMap.value[ticket];
  if (serverTp && serverTp > 0) {
    positionsStore.modifySlTp(ticket, { sl: getPosSlPrice(pos), tp: null });
  }
  syncPositionOverlays();
  updatePositionsYMap();
};

const toggleDraftTp = (ticket) => {
  if (!ticket) return;
  const pos = openPositionsForChart.value.find(
    (p) => String(p.position_ticket || p.id || p.ticket) === String(ticket)
  );
  const serverTp = getPosTpPrice(pos);

  if (draftTpMap.value[ticket] === undefined && (!serverTp || serverTp <= 0)) {
    const side = String(pos?.type || pos?.action || pos?.side || "BUY").toUpperCase();
    const isBuy = side.includes("BUY");
    const refP = Number(pos?.entry_price || pos?.price_open || pos?.price || livePriceTicker.value?.bid || 100);
    const isHigh = refP > 100;
    const pipOffset = isHigh ? 2.0 : 0.0020;
    const defaultTp = isBuy ? refP + pipOffset : refP - pipOffset;
    const decimals = isHigh ? 2 : 4;

    draftTpMap.value[ticket] = Number(defaultTp.toFixed(decimals));
    isDraftTpMap.value[ticket] = true;
  }
  syncPositionOverlays();
  updatePositionsYMap();
};

const justDraggedBadge = ref(false);

function onBadgeClick(ticket) {
  if (justDraggedBadge.value) {
    justDraggedBadge.value = false;
    return;
  }
  emit("openPositionSheet", ticket);
}

function startDragBadge(e, pos, kind) {
  if (e.target.closest("button")) return;

  const ticket = pos.position_ticket || pos.id || pos.ticket;
  if (!ticket || !chartRef || !chartContainer.value) return;

  // Lock body scroll while dragging SL/TP badge
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  const startY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
  let hasMoved = false;

  function onMove(moveEvent) {
    if (moveEvent.cancelable) {
      moveEvent.preventDefault();
    }
    const currentY =
      moveEvent.clientY ||
      (moveEvent.touches && moveEvent.touches[0]?.clientY) ||
      0;
    if (Math.abs(currentY - startY) > 3) {
      hasMoved = true;
    }

    const rect = chartContainer.value.getBoundingClientRect();
    const relativeY = currentY - rect.top;

    const res = chartRef.convertFromPixel(
      { y: relativeY },
      { paneId: "candle_pane" }
    );
    const priceVal = Array.isArray(res) ? res[0]?.value : res?.value;

    if (priceVal && !isNaN(priceVal) && priceVal > 0) {
      const decimals = priceVal > 100 ? 2 : 4;
      const formattedPrice = Number(priceVal.toFixed(decimals));

      if (kind === "SL") {
        draftSlMap.value[ticket] = formattedPrice;
      } else {
        draftTpMap.value[ticket] = formattedPrice;
      }
      syncPositionOverlays();
      updatePositionsYMap();
    }
  }

  async function onEnd() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
    window.removeEventListener("touchcancel", onEnd);

    // Restore body scroll after drag ends
    document.body.style.overflow = "";
    document.body.style.touchAction = "";

    if (hasMoved) {
      justDraggedBadge.value = true;
      setTimeout(() => {
        justDraggedBadge.value = false;
      }, 200);

      const finalPrice =
        kind === "SL"
          ? draftSlMap.value[ticket]
          : draftTpMap.value[ticket];
      if (finalPrice && finalPrice > 0) {
        const serverSl = getPosSlPrice(pos);
        const serverTp = getPosTpPrice(pos);
        const finalSl =
          kind === "SL" ? finalPrice : (draftSlMap.value[ticket] ?? serverSl);
        const finalTp =
          kind === "TP" ? finalPrice : (draftTpMap.value[ticket] ?? serverTp);

        try {
          await positionsStore.modifySlTp(ticket, {
            sl: finalSl,
            tp: finalTp,
          });
          if (kind === "SL") {
            delete isDraftSlMap.value[ticket];
          } else {
            delete isDraftTpMap.value[ticket];
          }
          syncPositionOverlays();
          snackbar.show(
            `${kind} order updated to ${formatTradedPrice(finalPrice)}`,
            "success"
          );
        } catch (err) {
          console.error(`Error placing ${kind} order:`, err);
        }
      }
    }
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onEnd);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onEnd);
  window.addEventListener("touchcancel", onEnd);
}

defineExpose({
  toggleDraftSl,
  toggleDraftTp,
  removeDraftSl,
  removeDraftTp,
  draftSlMap,
  draftTpMap,
});

const syncPositionOverlays = () => {
  if (!chartRef) return;

  const currentOverlayIds = new Set();
  const positions = openPositionsForChart.value;

  positions.forEach((pos) => {
    const ticket = pos.position_ticket || pos.order_ticket || pos.id || pos.ticket;
    if (!ticket) return;

    const side = String(pos.type || pos.action || pos.side || pos.order_type || "BUY").toUpperCase();
    const isSell = side.includes("SELL");
    const isPending = isPendingOrder(pos);
    const entryPrice = Number(
      pos.entry_price || pos.price_open || pos.price || pos.traded_price || pos.price_order
    );
    const volume = pos.volume || pos.lot || pos.lots || pos.volume_initial || pos.volume_current || "0.01";
    const pnlVal = getPositionPnl(pos);
    const formattedPnl = `${pnlVal >= 0 ? "+$" : "-$"}${Math.abs(pnlVal).toFixed(2)}`;

    // 1. Entry / Limit Line Overlay
    if (entryPrice && !isNaN(entryPrice)) {
      const entryId = `pos_entry_${ticket}`;
      currentOverlayIds.add(entryId);

      const extendData = {
        ticket,
        side: isSell ? "SELL" : "BUY",
        volume,
        entryPrice: formatTradedPrice(entryPrice),
        pnl: pnlVal,
        formattedPnl,
        isSell,
        isPending,
        orderType: side,
      };

      if (activeOverlayIds.has(entryId)) {
        chartRef.overrideOverlay({
          id: entryId,
          points: [{ value: entryPrice }],
          extendData,
        });
      } else {
        chartRef.createOverlay({
          id: entryId,
          name: "positionLine",
          points: [{ value: entryPrice }],
          lock: true,
          extendData,
        });
        activeOverlayIds.add(entryId);
      }
    }

    // 2. Stop Loss (SL) Overlay
    const slPrice = draftSlMap.value[ticket] ?? getPosSlPrice(pos);
    if (slPrice && !isNaN(slPrice)) {
      const slId = `pos_sl_${ticket}`;
      currentOverlayIds.add(slId);

      const extendData = {
        ticket,
        kind: "SL",
        price: formatTradedPrice(slPrice),
        pnl: pnlVal,
        isDraft: isSlDraft(pos),
      };

      if (activeOverlayIds.has(slId)) {
        chartRef.overrideOverlay({
          id: slId,
          points: [{ value: slPrice }],
          extendData,
        });
      } else {
        chartRef.createOverlay({
          id: slId,
          name: "slTpLine",
          points: [{ value: slPrice }],
          lock: false,
          extendData,
        });
        activeOverlayIds.add(slId);
      }
    }

    // 3. Take Profit (TP) Overlay
    const tpPrice = draftTpMap.value[ticket] ?? getPosTpPrice(pos);
    if (tpPrice && !isNaN(tpPrice)) {
      const tpId = `pos_tp_${ticket}`;
      currentOverlayIds.add(tpId);

      const extendData = {
        ticket,
        kind: "TP",
        price: formatTradedPrice(tpPrice),
        pnl: pnlVal,
        isDraft: isTpDraft(pos),
      };

      if (activeOverlayIds.has(tpId)) {
        chartRef.overrideOverlay({
          id: tpId,
          points: [{ value: tpPrice }],
          extendData,
        });
      } else {
        chartRef.createOverlay({
          id: tpId,
          name: "slTpLine",
          points: [{ value: tpPrice }],
          lock: false,
          extendData,
        });
        activeOverlayIds.add(tpId);
      }
    }
  });

  activeOverlayIds.forEach((id) => {
    if (!currentOverlayIds.has(id)) {
      chartRef.removeOverlay({ id });
      activeOverlayIds.delete(id);
    }
  });
};

watch(
  [openPositionsForChart, draftSlMap, draftTpMap],
  () => {
    updatePositionsYPixels();
    syncPositionOverlays();
  },
  { deep: true }
);

watch(
  () => homeStore.selectedAccountId || orderStore.selectedAccount,
  (accId) => {
    if (accId) {
      orderStore.fetchPendingOrders(accId);
    }
  },
  { immediate: true }
);

let resizeObserver = null;
let interactionRafId = null;

const onUserInteraction = () => {
  if (interactionRafId) cancelAnimationFrame(interactionRafId);
  interactionRafId = requestAnimationFrame(() => {
    updatePositionsYPixels();
  });
};

// NEW: module-level guard so registerOverlay is only ever called once per page load,
// even if this component mounts/unmounts/remounts multiple times.
let overlayRegistered = false;

onMounted(async () => {
  if (!chartContainer.value) return;

  if (props.symbol) {
    tickerStore.startWebSocket();
    tickerStore.updateTickerList([props.symbol]);
  }

  chartRef = init(chartContainer.value);
  if (chartRef) {
    const bs = chartRef.getBarSpace?.();
    if (bs?.bar) initialBarSpace = bs.bar;
    initialOffsetRightDistance = chartRef.getOffsetRightDistance?.() ?? 50;
  }
  applyChartStyles(chartRef, chartSettings.value);
  updateChartInteractivity();

  chartRef.setSymbol({
    ticker: props.symbol || "XAUUSD",
    pricePrecision: props.symbol?.includes("JPY") ? 3 : (props.symbol?.includes("XAU") ? 2 : 4),
    volumePrecision: 0,
  });

  // FIX: guard against "overlay already registered" errors on remount,
  // which previously threw and aborted the rest of onMounted before
  // loadHistoricalData() (and therefore chartRef.applyNewData()) ever ran.
  if (!overlayRegistered) {
    try {
      registerOverlay(customFibonacciOverlay);
      registerOverlay(positionLineOverlay);
      registerOverlay(slTpLineOverlay);
    } catch (e) {
      console.warn("customOverlay registration skipped:", e);
    }
    overlayRegistered = true;
  }

  try {
    chartRef.subscribeAction("onOverlayClick", (param) => {
      const overlay = param?.overlay || param;
      if (overlay?.extendData?.ticket) {
        emit("openPositionSheet", overlay.extendData.ticket);
      }
    });

    chartRef.subscribeAction("onOverlayDrawEnd", (param) => {
      const overlay = param?.overlay || param;
      if (
        overlay &&
        overlay.name === "slTpLine" &&
        overlay.extendData?.ticket &&
        overlay.points?.[0]?.value
      ) {
        const ticket = overlay.extendData.ticket;
        const kind = overlay.extendData.kind;
        const newPrice = Number(overlay.points[0].value);
        if (ticket && newPrice > 0) {
          if (dragDebounceTimer) clearTimeout(dragDebounceTimer);
          dragDebounceTimer = setTimeout(async () => {
            const pos = openPositionsForChart.value.find(
              (p) => String(p.position_ticket || p.id || p.ticket) === String(ticket)
            );
            const isSl = kind === "SL";
            const serverSl = getPosSlPrice(pos);
            const serverTp = getPosTpPrice(pos);

            const finalSl = isSl ? newPrice : (draftSlMap.value[ticket] ?? serverSl);
            const finalTp = !isSl ? newPrice : (draftTpMap.value[ticket] ?? serverTp);

            try {
              await positionsStore.modifySlTp(ticket, { sl: finalSl, tp: finalTp });
              if (isSl) {
                delete draftSlMap.value[ticket];
                delete isDraftSlMap.value[ticket];
              } else {
                delete draftTpMap.value[ticket];
                delete isDraftTpMap.value[ticket];
              }
              syncPositionOverlays();
              snackbar.show(`${kind} set to ${formatTradedPrice(newPrice)}`, "success");
            } catch (err) {
              console.error(`Error setting ${kind}:`, err);
            }
          }, 300);
        }
      }
    });

    const handleChartTransformChange = () => {
      checkResetButtonVisibility();
      updatePositionsYPixels();
    };

    chartRef.subscribeAction("onScroll", handleChartTransformChange);
    chartRef.subscribeAction("onZoom", handleChartTransformChange);
    chartRef.subscribeAction("onVisibleRangeChange", handleChartTransformChange);
  } catch (err) {
    console.warn("subscribeAction error:", err);
  }

  const period = mapPeriodFromInterval(currentInterval.value.value);
  chartRef.setPeriod(period);

  await loadHistoricalData();

  if (chartContainer.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      resizeChart();
      updatePositionsYPixels();
    });
    resizeObserver.observe(chartContainer.value);
  }

  if (chartContainer.value) {
    chartContainer.value.addEventListener("wheel", onUserInteraction, { passive: true });
    chartContainer.value.addEventListener("pointermove", onUserInteraction, { passive: true });
    chartContainer.value.addEventListener("touchmove", onUserInteraction, { passive: true });
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resizeChart();
      updatePositionsYPixels();
    });
  });

  updatePositionsPositionInterval = setInterval(() => {
    updatePositionsYPixels();
    syncPositionOverlays();
  }, 100);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (chartContainer.value) {
    chartContainer.value.removeEventListener("wheel", onUserInteraction);
    chartContainer.value.removeEventListener("pointermove", onUserInteraction);
    chartContainer.value.removeEventListener("touchmove", onUserInteraction);
  }
  if (interactionRafId) {
    cancelAnimationFrame(interactionRafId);
    interactionRafId = null;
  }
  if (updatePositionsPositionInterval) {
    clearInterval(updatePositionsPositionInterval);
    updatePositionsPositionInterval = null;
  }
  if (chartRef && chartContainer.value) {
    dispose(chartContainer.value);
    chartRef = null;
  }
});
</script>

<template>
  <div
    class="w-full flex flex-col bg-white dark:bg-[#0B0F19]"
    :class="
      isFullscreen
        ? 'fixed inset-0 z-[100] h-screen w-screen p-3 overflow-hidden justify-between'
        : ''
    "
  >
    <!-- Zoom View Topbar (Only visible in Fullscreen/Zoom mode) -->
    <div
      v-if="isFullscreen"
      class="w-full flex items-center justify-between pb-2 mb-1 border-b border-gray-100 dark:border-slate-800 select-none shrink-0"
    >
      <!-- Left: Back Button & Symbol Name with Live Ask/Bid prices -->
      <div class="flex items-center gap-2.5">
        <!-- Back Button to Exit Zoom View -->
        <button
          type="button"
          @click="toggleFullscreen"
          class="w-9 h-9 rounded-full bg-[#F4F5F7] dark:bg-slate-800 hover:bg-gray-200/80 dark:hover:bg-slate-700 text-[#0F1424] dark:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Back to normal view"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>

        <div
          @click="emit('openMarketModal')"
          class="flex flex-col cursor-pointer select-none group"
          title="Change Symbol"
        >
          <div class="flex items-center gap-1 text-[#0F1424] dark:text-white group-hover:text-blue-500 transition-colors">
            <span class="font-symbol font-bold text-base tracking-tight">
              {{ props.symbol }}
            </span>
            <ChevronDown class="w-4 h-4 text-[#0F1424] dark:text-white group-hover:text-blue-500 transition-colors shrink-0" />
          </div>
          <div class="text-[11px] font-medium text-[#8C93A3] dark:text-slate-400 flex items-center gap-1.5 font-mono">
            <span>Ask: <strong class="text-[#12A879]">{{ formattedAskPrice }}</strong></span>
            <span>/</span>
            <span>Bid: <strong class="text-[#E5484D]">{{ formattedBidPrice }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Right: Star & Theme Toggle Button -->
      <div class="flex items-center gap-2">
        <!-- Watchlist Star Favorite Button -->
        <button
          type="button"
          @click="toggleFavorite"
          class="w-9 h-9 rounded-full bg-[#F4F5F7] dark:bg-slate-800 hover:bg-gray-200/80 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          :class="
            isFavorite
              ? 'text-[#E0CA3C]'
              : 'text-[#9CA3AF] dark:text-slate-400 hover:text-[#0F1424] dark:hover:text-white'
          "
          :title="isFavorite ? 'Remove from Watchlist' : 'Add to Watchlist'"
        >
          <Star class="w-4.5 h-4.5" :class="isFavorite ? 'fill-[#E0CA3C]' : ''" />
        </button>

        <!-- Theme Toggle Button -->
        <button
          type="button"
          @click="themeStore.toggleTheme($event)"
          class="w-9 h-9 rounded-full bg-[#F4F5F7] dark:bg-slate-800 hover:bg-gray-200/80 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer text-[#0F1424] dark:text-white"
          :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <Sun v-if="themeStore.isDark" class="w-4.5 h-4.5 text-amber-400" />
          <Moon v-else class="w-4.5 h-4.5 text-slate-700" />
        </button>
      </div>
    </div>

    <!-- Timeframe Interval Selector with Zoom Toggle -->
    <IntervalSelector
      :intervals="props.intervals"
      :selectedInterval="currentInterval"
      :isFullscreen="isFullscreen"
      :ohlcData="activeCandleData"
      @select="selectInterval"
      @toggleFullscreen="toggleFullscreen"
    />

    <!-- Main Chart Canvas Container -->
    <div
      ref="chartContainer"
      class="w-full relative select-none overflow-hidden"
      :class="{ 'pointer-events-none touch-pan-y': (props.fixed || props.disableScrollAndZoom) && !isFullscreen }"
      :style="{
        height: isFullscreen
          ? 'calc(100vh - 115px)'
          : props.isCollapsed
            ? 'clamp(320px, calc(100dvh - 360px), 520px)'
            : '320px',
        minHeight: '280px',
        width: '100%',
        touchAction: (props.fixed || props.disableScrollAndZoom) && !isFullscreen ? 'pan-y' : 'auto',
      }"
    >
      <!-- Loader -->
      <div
        v-if="isLoadingChart"
        class="absolute inset-0 z-20 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm flex flex-col p-4 select-none overflow-hidden items-center justify-center"
      >
        <div
          class="bg-white/90 dark:bg-[#131B2E]/90 shadow-lg border border-gray-100 dark:border-slate-800 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-gray-700 dark:text-slate-200"
        >
          <Loader2 class="w-4 h-4 animate-spin text-[#0F1424] dark:text-white" />
          <span>Loading chart data...</span>
        </div>
      </div>

      <!-- Traded Position & SL / TP Overlay Badges (MT5 Style) -->
      <div v-if="!isLoadingChart" class="absolute inset-0 z-30 pointer-events-none overflow-hidden">
        <template v-for="pos in openPositionsForChart" :key="pos.position_ticket || pos.order_ticket || pos.id || pos.ticket">
          <!-- 1. Entry Badge (Only for active open positions, NOT for placed limit/pending orders) -->
          <template v-if="!isPendingOrder(pos) && labelYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket] !== undefined && labelYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket] >= 25">
            <div
              @click.stop="emit('openPositionSheet', pos.position_ticket || pos.order_ticket || pos.id || pos.ticket)"
              class="absolute left-3 flex items-center bg-white dark:bg-[#131B2E] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-dashed text-[11px] font-medium transition-none pointer-events-auto select-none overflow-hidden cursor-pointer"
              :class="String(pos.type || pos.action || pos.side || '').toUpperCase().includes('SELL') ? 'border-[#E5484D]' : 'border-[#2563EB]'"
              :style="{
                top: '0px',
                transform: `translate3d(0, ${labelYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket]}px, 0) translateY(-50%)`,
                willChange: 'transform',
              }"
            >
              <!-- Ticket Pill -->
              <span
                class="px-2 py-0.5 font-mono font-extrabold text-white text-[10.5px] uppercase tracking-wider flex items-center border-r border-dashed border-white/40"
                :class="String(pos.type || pos.action || pos.side || '').toUpperCase().includes('SELL') ? 'bg-[#E5484D]' : 'bg-[#2563EB]'"
              >
                {{ pos.position_ticket || pos.order_ticket || pos.id || pos.ticket || '100000' }}
              </span>

              <!-- Middle Info: PnL + Label + Price -->
              <div class="px-2 py-0.5 flex items-center gap-1.5 bg-white dark:bg-[#131B2E]">
                <span
                  class="font-extrabold font-mono text-[11px]"
                  :class="getPositionPnl(pos) >= 0 ? 'text-[#12A879]' : 'text-[#E5484D]'"
                >
                  {{ getPositionPnl(pos) >= 0 ? '+' : '' }}{{ getPositionPnl(pos).toFixed(2) }} O
                </span>
                <span class="text-[#0F1424] dark:text-[#F8FAFC] font-mono font-bold text-[11px]">
                  {{ formatTradedPrice(pos.entry_price || pos.price_open || pos.price || pos.traded_price) }}
                </span>
              </div>

              <!-- Right [x] close button -->
              <button
                type="button"
                @click.stop="handleSquareOffPosition(pos)"
                class="px-1.5 py-0.5 flex items-center justify-center border-l border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-[#131B2E] hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors cursor-pointer"
                :class="String(pos.type || pos.action || pos.side || '').toUpperCase().includes('SELL') ? 'text-[#E5484D]' : 'text-[#2563EB]'"
                title="Square Off Position"
              >
                x
              </button>
            </div>
          </template>

          <!-- 2. Stop Loss (SL) Badge -->
          <template v-if="!isPendingOrder(pos) && slYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket] !== undefined && slYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket] >= 25">
            <div
              @pointerdown="startDragBadge($event, pos, 'SL')"
              @touchstart="startDragBadge($event, pos, 'SL')"
              @click.stop="onBadgeClick(pos.position_ticket || pos.order_ticket || pos.id || pos.ticket)"
              class="absolute left-3 flex items-center bg-white dark:bg-[#131B2E] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-dashed text-[11px] font-medium transition-none pointer-events-auto select-none overflow-hidden cursor-grab active:cursor-grabbing"
              :class="isSlDraft(pos) ? 'border-gray-400 dark:border-slate-500' : 'border-[#E5484D]'"
              :style="{
                top: '0px',
                transform: `translate3d(0, ${slYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket]}px, 0) translateY(-50%)`,
                willChange: 'transform',
              }"
            >
              <!-- Ticket Pill -->
              <span
                class="px-2 py-0.5 font-mono font-extrabold text-white text-[10.5px] uppercase tracking-wider border-r border-dashed border-white/40"
                :class="isSlDraft(pos) ? 'bg-gray-400 dark:bg-slate-600' : 'bg-[#E5484D]'"
              >
                {{ pos.position_ticket || pos.order_ticket || pos.id || pos.ticket || '100000' }}
              </span>

              <!-- Middle Info: PnL + SL + Price -->
              <div class="px-2 py-0.5 flex items-center gap-1.5 bg-white dark:bg-[#131B2E]">
                <span
                  class="font-extrabold font-mono text-[11px]"
                  :class="isSlDraft(pos) ? 'text-gray-500 dark:text-slate-400' : 'text-[#E5484D]'"
                >
                  {{ getPositionPnl(pos) >= 0 ? '+' : '' }}{{ getPositionPnl(pos).toFixed(2) }} SL
                </span>
                <span class="text-[#0F1424] dark:text-[#F8FAFC] font-mono font-bold text-[11px]">
                  {{ formatTradedPrice(draftSlMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket] || getPosSlPrice(pos)) }}
                </span>
              </div>

              <!-- Right [x] remove SL button -->
              <button
                type="button"
                @click.stop="removeDraftSl(pos.position_ticket || pos.order_ticket || pos.id || pos.ticket)"
                class="px-1.5 py-0.5 flex items-center justify-center border-l border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-[#131B2E] hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors cursor-pointer"
                :class="isSlDraft(pos) ? 'text-gray-500 hover:text-red-500' : 'text-[#E5484D]'"
                title="Remove Stop Loss"
              >
                x
              </button>
            </div>
          </template>

          <!-- 3. Take Profit (TG) Badge -->
          <template v-if="!isPendingOrder(pos) && tpYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket] !== undefined && tpYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket] >= 25">
            <div
              @pointerdown="startDragBadge($event, pos, 'TP')"
              @touchstart="startDragBadge($event, pos, 'TP')"
              @click.stop="onBadgeClick(pos.position_ticket || pos.order_ticket || pos.id || pos.ticket)"
              class="absolute left-3 flex items-center bg-white dark:bg-[#131B2E] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-dashed text-[11px] font-medium transition-none pointer-events-auto select-none overflow-hidden cursor-grab active:cursor-grabbing"
              :class="isTpDraft(pos) ? 'border-gray-400 dark:border-slate-500' : 'border-[#0F946A]'"
              :style="{
                top: '0px',
                transform: `translate3d(0, ${tpYMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket]}px, 0) translateY(-50%)`,
                willChange: 'transform',
              }"
            >
              <!-- Ticket Pill -->
              <span
                class="px-2 py-0.5 font-mono font-extrabold text-white text-[10.5px] uppercase tracking-wider border-r border-dashed border-white/40"
                :class="isTpDraft(pos) ? 'bg-gray-400 dark:bg-slate-600' : 'bg-[#0F946A]'"
              >
                {{ pos.position_ticket || pos.order_ticket || pos.id || pos.ticket || '100000' }}
              </span>

              <!-- Middle Info: PnL + TG + Price -->
              <div class="px-2 py-0.5 flex items-center gap-1.5 bg-white dark:bg-[#131B2E]">
                <span
                  class="font-extrabold font-mono text-[11px]"
                  :class="isTpDraft(pos) ? 'text-gray-500 dark:text-slate-400' : 'text-[#0F946A]'"
                >
                  {{ getPositionPnl(pos) >= 0 ? '+' : '' }}{{ getPositionPnl(pos).toFixed(2) }} TG
                </span>
                <span class="text-[#0F1424] dark:text-[#F8FAFC] font-mono font-bold text-[11px]">
                  {{ formatTradedPrice(draftTpMap[pos.position_ticket || pos.order_ticket || pos.id || pos.ticket] || getPosTpPrice(pos)) }}
                </span>
              </div>

              <!-- Right [x] remove TP button -->
              <button
                type="button"
                @click.stop="removeDraftTp(pos.position_ticket || pos.order_ticket || pos.id || pos.ticket)"
                class="px-1.5 py-0.5 flex items-center justify-center border-l border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-[#131B2E] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold transition-colors cursor-pointer"
                :class="isTpDraft(pos) ? 'text-gray-500 hover:text-emerald-500' : 'text-[#0F946A]'"
                title="Remove Take Profit"
              >
                x
              </button>
            </div>
          </template>
        </template>
      </div>

      <!-- Floating Buy/Sell Trading Panel (Draggable in Fullscreen/Zoom mode) -->
      <div
        v-if="isFullscreen && !isLoadingChart"
        ref="floatingPanelRef"
        @pointerdown="startDragFloatingPanel"
        @touchstart="startDragFloatingPanel"
        class="absolute z-40 transition-none pointer-events-auto cursor-grab active:cursor-grabbing select-none"
        :style="
          floatingPanelPos.x !== null && floatingPanelPos.y !== null
            ? { left: `${floatingPanelPos.x}px`, top: `${floatingPanelPos.y}px` }
            : { right: '12px', top: '12px' }
        "
      >
        <!-- Minimized Floating Toggle Badge -->
        <div
          v-if="isFloatingBarMinimized"
          @click="isFloatingBarMinimized = false"
          class="bg-white/95 dark:bg-[#131B2E]/95 hover:bg-white dark:hover:bg-[#182238] backdrop-blur-md border border-gray-200/90 dark:border-slate-700 shadow-md rounded-full px-2.5 py-1 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 text-[11px] font-bold text-[#0F1424] dark:text-white"
        >
          <GripVertical class="w-3 h-3 text-gray-400 dark:text-slate-500 shrink-0 cursor-grab active:cursor-grabbing" />
          <span class="w-1.5 h-1.5 rounded-full bg-[#12A879] animate-pulse"></span>
          <span>Buy / Sell</span>
          <ChevronDown class="w-3 h-3 text-gray-500 dark:text-slate-400" />
        </div>

        <!-- Full Floating Action Bar -->
        <div
          v-else
          class="bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-md border border-gray-200/90 dark:border-slate-700 shadow-[0_4px_20px_rgb(0,0,0,0.25)] rounded-xl p-1 flex items-center gap-1 select-none"
        >
          <!-- Drag Handle Icon -->
          <div class="px-0.5 cursor-grab active:cursor-grabbing text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors shrink-0" title="Drag Panel">
            <GripVertical class="w-3.5 h-3.5" />
          </div>

          <!-- Sell Button (Red) -->
          <button
            type="button"
            :disabled="isPlacingFloatingOrder || floatingLots < 0.01"
            @click="executeFloatingTrade('SELL')"
            class="h-9 bg-[#E5484D] hover:bg-[#D43B40] disabled:opacity-50 text-white px-2 rounded-lg font-bold flex flex-col items-center justify-center leading-none active:scale-95 transition-colors cursor-pointer shadow-xs w-[64px] shrink-0"
          >
            <div class="flex items-center gap-0.5">
              <Loader2
                v-if="isPlacingFloatingOrder && activeFloatingDirection === 'SELL'"
                class="w-2.5 h-2.5 animate-spin"
              />
              <span class="text-[9px] tracking-wider uppercase font-extrabold opacity-90">Sell</span>
            </div>
            <span class="text-[11px] font-mono tabular-nums tracking-tighter font-extrabold mt-0.5">{{ formattedBidPrice }}</span>
          </button>

          <!-- Lot Size Adjuster (Same Height as Buy/Sell Buttons) -->
          <div class="h-9 flex items-center bg-gray-100/90 dark:bg-slate-800 border border-gray-200/60 dark:border-slate-700 rounded-lg overflow-hidden shrink-0">
            <button
              type="button"
              @click="decrementFloatingLots"
              :disabled="floatingLots <= 0.01 || isPlacingFloatingOrder"
              class="h-full px-2 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Decrease Lots"
            >
              <Minus class="w-3 h-3 stroke-[2.5]" />
            </button>
            <input
              type="number"
              step="0.01"
              min="0.01"
              :value="floatingLots"
              @input="onFloatingLotsInput"
              :disabled="isPlacingFloatingOrder"
              class="w-8 text-center bg-transparent text-[11px] font-bold font-mono text-[#0F1424] dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              @click="incrementFloatingLots"
              :disabled="isPlacingFloatingOrder"
              class="h-full px-2 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Increase Lots"
            >
              <Plus class="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>

          <!-- Buy Button (Green) -->
          <button
            type="button"
            :disabled="isPlacingFloatingOrder || floatingLots < 0.01"
            @click="executeFloatingTrade('BUY')"
            class="h-9 bg-[#12A879] hover:bg-[#0F946A] disabled:opacity-50 text-white px-2 rounded-lg font-bold flex flex-col items-center justify-center leading-none active:scale-95 transition-colors cursor-pointer shadow-xs w-[64px] shrink-0"
          >
            <div class="flex items-center gap-0.5">
              <Loader2
                v-if="isPlacingFloatingOrder && activeFloatingDirection === 'BUY'"
                class="w-2.5 h-2.5 animate-spin"
              />
              <span class="text-[9px] tracking-wider uppercase font-extrabold opacity-90">Buy</span>
            </div>
            <span class="text-[11px] font-mono tabular-nums tracking-tighter font-extrabold mt-0.5">{{ formattedAskPrice }}</span>
          </button>
        </div>
      </div>

      <!-- Reset View Button (Zoom / Fullscreen view - only shown when scrolled or zoomed away) -->
      <button
        v-if="isFullscreen && !isLoadingChart && showResetButton"
        type="button"
        @click.stop="handleResetView"
        @pointerdown.stop
        @touchstart.stop
        class="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-[#131B2E] hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 border border-gray-200/90 dark:border-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.25)] rounded-full px-4 py-1.5 flex items-center gap-1.5 cursor-pointer transition-all select-none text-xs font-semibold text-[#0F1424] dark:text-white pointer-events-auto"
      >
        <span>Reset View</span>
        <ChevronsRight class="w-3.5 h-3.5 text-gray-400 dark:text-slate-400 stroke-[2.2]" />
      </button>
    </div>

    <!-- Ranges & Market Sentiments Section -->
    <ChartRangesAndSentiments
      v-if="!isFullscreen"
      :symbol="props.symbol"
      :currentPrice="activeCandleData.close || 65600.29"
    />
    <!-- Modals -->
    <ChartSettingsModal
      :isOpen="isChartSettingsOpen"
      :settings="chartSettings"
      @close="isChartSettingsOpen = false"
      @save="handleSaveChartSettings"
    />
    <FibonacciSettingsModal
      :isOpen="isFibModalOpen"
      :config="activeFibConfig"
      @close="isFibModalOpen = false"
    />
    <DrawingSettingsModal
      :isOpen="isGenericModalOpen"
      :overlay="activeDrawing?.overlayInstance"
      @close="isGenericModalOpen = false"
    />
  </div>
</template>

<style scoped>
.touch-pan-y :deep(canvas) {
  touch-action: pan-y !important;
}
</style>