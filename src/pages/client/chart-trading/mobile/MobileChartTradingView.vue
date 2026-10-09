<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ChevronLeft,
  Star,
  Minus,
  Plus,
  Loader2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Search,
  Pencil,
  Sun,
  Moon,
} from "lucide-vue-next";
import KLineChartDemo from "@/components/chart/KLineChartDemo.vue";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import { useTickerStore } from "@/stores/shared/ticker";
import { useWatchlistStore } from "@/stores/client/watchlist";
import useOrderStore from "@/stores/client/orders";
import usePositionsStore from "@/stores/client/positions";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useProfileStore } from "@/stores/shared/profile";
import { useThemeStore } from "@/stores/shared/theme";
import { formatSymbolPrice } from "@/utils/symbolUtils";

import usFlg from "@/assets/us-flg.svg";
import BaseSelect from "@/components/base/BaseSelect.vue";
import MobileMarketViewModal from "./MobileMarketViewModal.vue";
import PositionActionSheet from "./PositionActionSheet.vue";

const props = defineProps({
  symbol: {
    type: String,
    default: "XAUUSD",
  },
});

const route = useRoute();
const router = useRouter();

const homeStore = useTradingAccountsStore();
const tickerStore = useTickerStore();
const watchlistStore = useWatchlistStore();
const orderStore = useOrderStore();
const positionsStore = usePositionsStore();
const snackbar = useSnackbarStore();
const profileStore = useProfileStore();
const themeStore = useThemeStore();

function handleBack() {
  if (window.history.state && window.history.state.back) {
    router.back();
  } else {
    const role = profileStore.activeRole || profileStore.user?.role;
    if (role === "ib") {
      router.push("/ib-dashboard");
    } else if (role === "fm") {
      router.push("/fm-dashboard");
    } else {
      router.push("/dashboard");
    }
  }
}

const selectedSymbol = ref("");
const isMarketModalOpen = ref(false);

const symbol = computed(() =>
  String(
    selectedSymbol.value ||
      props.symbol ||
      route.params.symbol ||
      route.query.symbol ||
      "XAUUSD",
  ).toUpperCase(),
);

function handleMarketSymbolSelect(sym) {
  if (!sym) return;
  selectedSymbol.value = sym;
  if (route.query.symbol !== sym) {
    router.replace({ query: { ...route.query, symbol: sym } });
  }
  isMarketModalOpen.value = false;
}

const availableSymbols = computed(() => {
  const defaultList = [
    "XAUUSD",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "BTCUSD",
    "ETHUSD",
    "US30",
    "NAS100",
  ];
  const watchlistSyms = (watchlistStore.activeSymbols || [])
    .map((s) => (typeof s === "string" ? s : s?.symbol))
    .filter(Boolean);
  return Array.from(new Set([...watchlistSyms, ...defaultList]));
});

function selectSymbol(sym) {
  selectedSymbol.value = sym;
  isSymbolDropdownOpen.value = false;
  if (route.query.symbol !== sym) {
    router.replace({ query: { ...route.query, symbol: sym } });
  }
}

// Trading Account Selection State & Logic
const accountList = computed(() => {
  return (homeStore.data || []).filter((acc) => {
    const type = String(
      acc.account_category || acc.account_type || acc.type || acc.platform || "",
    ).toLowerCase();
    const isDemo =
      acc.is_demo === true ||
      acc.is_demo === 1 ||
      acc.is_demo === "1" ||
      acc.isDemo === true ||
      type.includes("demo");
    return !isDemo;
  });
});

const accountOptions = computed(() => {
  return accountList.value.map((acc) => {
    const accNum = acc.account_number || acc.login || acc.id || "";
    const type = String(
      acc.account_category || acc.type || "LIVE",
    ).toUpperCase();
    const id = acc.id || acc.account_number || acc.login;
    return {
      label: `${type}-${accNum}`,
      value: id,
      groupLabel: acc.groupLabel || acc.server || "Swap free STP",
      equity: acc.equity,
      balance: acc.balance,
      category: type,
      account_number: accNum,
      raw: acc,
    };
  });
});

const selectedAccount = computed(() => {
  if (!accountList.value || !accountList.value.length) return null;
  if (homeStore.selectedAccountId) {
    return (
      accountList.value.find(
        (a) =>
          String(a.id || a.login || a.account_number) ===
          String(homeStore.selectedAccountId),
      ) || accountList.value[0]
    );
  }
  return accountList.value[0];
});

const selectedAccountId = computed({
  get: () => {
    if (homeStore.selectedAccountId) return homeStore.selectedAccountId;
    const first = accountOptions.value[0];
    return first ? first.value : null;
  },
  set: (id) => {
    if (id) {
      homeStore.selectedAccountId = id;
      if (orderStore.selectedAccount !== id) {
        orderStore.selectedAccount = id;
      }
      if (typeof positionsStore.fetchPositions === "function") {
        positionsStore.fetchPositions(id);
      }
    }
  },
});

const activeAccountLabel = computed(() => {
  if (!selectedAccount.value) return "LIVE-1278922-MT5";
  const accNum =
    selectedAccount.value.account_number ||
    selectedAccount.value.login ||
    selectedAccount.value.id ||
    "1278922";
  const type = String(
    selectedAccount.value.account_category ||
      selectedAccount.value.type ||
      "LIVE",
  ).toUpperCase();
  return `${type}-${accNum}`;
});

function selectTradingAccount(acc) {
  const id = acc.id || acc.account_number || acc.login;
  if (id) {
    selectedAccountId.value = id;
  }
}
const activeTab = ref("chart");
const isPlacingOrder = ref(false);
const activePlacingDirection = ref("");

// Execution Mode options
const executionModes = [
  "Market Execution",
  "Buy Limit",
  "Sell Limit",
  "Buy Stop",
  "Sell Stop",
];
const selectedExecutionMode = ref("Market Execution");

const isMarketExecution = computed(
  () => selectedExecutionMode.value === "Market Execution",
);

const pendingOrderAction = computed(() => {
  const mode = selectedExecutionMode.value || "";
  if (mode.startsWith("Buy")) return "BUY";
  if (mode.startsWith("Sell")) return "SELL";
  return "BUY";
});

const pendingOrderLabel = computed(() => {
  return `Place ${selectedExecutionMode.value}`;
});

const isPendingBuy = computed(() => {
  return (selectedExecutionMode.value || "").startsWith("Buy");
});

// SL / TP Expand & Mode State
const isSlTpExpanded = ref(false);
const slTpMode = ref("price");
const isSlChecked = ref(true);
const isTpChecked = ref(true);
const stopLossVal = ref("");
const targetVal = ref("");
const limitPriceVal = ref("");
const orderCommentVal = ref("");
const showCommentInput = ref(false);

function setSlTpMode(mode) {
  slTpMode.value = "price";
  stopLossVal.value = "";
  targetVal.value = "";
}

function toggleSlTpExpand() {
  isSlTpExpanded.value = !isSlTpExpanded.value;
  if (isSlTpExpanded.value) {
    isSlChecked.value = true;
    isTpChecked.value = true;
  }
}

watch([isSlChecked, isTpChecked], ([slChecked, tpChecked]) => {
  if (!slChecked && !tpChecked) {
    isSlTpExpanded.value = false;
    isSlChecked.value = true;
    isTpChecked.value = true;
    stopLossVal.value = "";
    targetVal.value = "";
  }
});

function stepUpLimitPrice() {
  const cur = Number(limitPriceVal.value || limitPricePlaceholder.value || priceData.value.price || 0);
  limitPriceVal.value = (cur + 0.01).toFixed(2);
}

function stepDownLimitPrice() {
  const cur = Number(limitPriceVal.value || limitPricePlaceholder.value || priceData.value.price || 0);
  if (cur > 0.01) {
    limitPriceVal.value = (cur - 0.01).toFixed(2);
  }
}

function stepUpStopLoss() {
  const step = slTpMode.value === "pips" ? 1 : 0.01;
  const cur = Number(
    stopLossVal.value ||
      (slTpMode.value === "price" ? priceData.value.price : 10) ||
      0,
  );
  const nextVal = cur + step;
  stopLossVal.value =
    slTpMode.value === "pips"
      ? String(Math.round(nextVal))
      : nextVal.toFixed(2);
}

function stepDownStopLoss() {
  const step = slTpMode.value === "pips" ? 1 : 0.01;
  const cur = Number(
    stopLossVal.value ||
      (slTpMode.value === "price" ? priceData.value.price : 10) ||
      0,
  );
  if (cur > step) {
    const nextVal = cur - step;
    stopLossVal.value =
      slTpMode.value === "pips"
        ? String(Math.round(nextVal))
        : nextVal.toFixed(2);
  }
}

function stepUpTarget() {
  const step = slTpMode.value === "pips" ? 1 : 0.01;
  const cur = Number(
    targetVal.value ||
      (slTpMode.value === "price" ? priceData.value.price : 10) ||
      0,
  );
  const nextVal = cur + step;
  targetVal.value =
    slTpMode.value === "pips"
      ? String(Math.round(nextVal))
      : nextVal.toFixed(2);
}

function stepDownTarget() {
  const step = slTpMode.value === "pips" ? 1 : 0.01;
  const cur = Number(
    targetVal.value ||
      (slTpMode.value === "price" ? priceData.value.price : 10) ||
      0,
  );
  if (cur > step) {
    const nextVal = cur - step;
    targetVal.value =
      slTpMode.value === "pips"
        ? String(Math.round(nextVal))
        : nextVal.toFixed(2);
  }
}

onMounted(() => {
  tickerStore.startWebSocket();
  tickerStore.updateTickerList([symbol.value]);

  if (!homeStore.data || !homeStore.data.length) {
    homeStore.fetchAccounts();
  }
  if (typeof watchlistStore.fetchWatchlists === "function") {
    watchlistStore.fetchWatchlists();
  }

  expandScrollY = getScrollPos();
  const container = document.querySelector(".overflow-y-auto");
  if (container) {
    container.addEventListener("scroll", handleScroll, { passive: true });
  }
  window.addEventListener("scroll", handleScroll, {
    passive: true,
    capture: true,
  });
});

onUnmounted(() => {
  const container = document.querySelector(".overflow-y-auto");
  if (container) {
    container.removeEventListener("scroll", handleScroll);
  }
  window.removeEventListener("scroll", handleScroll, { capture: true });
});

watch(
  () => homeStore.data,
  (accounts) => {
    if (accounts && accounts.length > 0) {
      const savedAccId = typeof localStorage !== 'undefined' ? localStorage.getItem("chart_selected_account_id") : null;
      const found = savedAccId
        ? accounts.find((a) => String(a.id || a.account_number || a.login) === String(savedAccId))
        : null;
      const target = found || (homeStore.selectedAccountId
        ? accounts.find((a) => String(a.id || a.account_number || a.login) === String(homeStore.selectedAccountId)) || accounts[0]
        : accounts[0]);
      const id = target.id || target.account_number || target.login;
      if (id && homeStore.selectedAccountId !== id) {
        homeStore.selectedAccountId = id;
      }
    }
  },
  { immediate: true },
);

watch(
  () => homeStore.selectedAccountId,
  (accId) => {
    if (accId) {
      orderStore.selectedAccount = accId;
      orderStore.fetchOrders(accId);
      orderStore.fetchPendingOrders(accId);
      positionsStore.fetchPositions(accId);
    }
  },
  { immediate: true },
);

const activeCandle = ref({
  open: "-",
  high: "-",
  low: "-",
  close: "-",
  volume: "-",
  time: "-",
});

function handleCandleChange(candle) {
  if (!candle) return;
  const dateObj = candle.timestamp ? new Date(candle.timestamp) : new Date();
  const timeStr = dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  activeCandle.value = {
    open:
      typeof candle.open === "number"
        ? candle.open > 100
          ? candle.open.toFixed(2)
          : candle.open.toFixed(4)
        : candle.open,
    high:
      typeof candle.high === "number"
        ? candle.high > 100
          ? candle.high.toFixed(2)
          : candle.high.toFixed(4)
        : candle.high,
    low:
      typeof candle.low === "number"
        ? candle.low > 100
          ? candle.low.toFixed(2)
          : candle.low.toFixed(4)
        : candle.low,
    close:
      typeof candle.close === "number"
        ? candle.close > 100
          ? candle.close.toFixed(2)
          : candle.close.toFixed(4)
        : candle.close,
    volume: candle.volume !== undefined ? String(candle.volume) : "0",
    time: timeStr,
  };
}

const liveTick = computed(() => tickerStore.getLastPrice(symbol.value));

const formattedBid = computed(() => {
  const b = liveTick.value?.bid;
  if (b == null || isNaN(Number(b))) return "75,229.29";
  const num = Number(b);
  return num > 100
    ? num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : num.toFixed(4);
});

const formattedAsk = computed(() => {
  const a = liveTick.value?.ask;
  if (a == null || isNaN(Number(a))) return "75,229.29";
  const num = Number(a);
  return num > 100
    ? num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : num.toFixed(4);
});

const tickFlash = ref("");
let flashTimer = null;

watch(
  () => liveTick.value?.bid || liveTick.value?.last,
  (newVal, oldVal) => {
    const cur = Number(newVal);
    const prev = Number(oldVal);
    if (!isNaN(cur) && !isNaN(prev) && prev > 0 && cur !== prev) {
      tickFlash.value = cur > prev ? "up" : "down";
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => {
        tickFlash.value = "";
      }, 1000);
    }
  },
);

const askFlash = ref("");
const bidFlash = ref("");
let askFlashTimer = null;
let bidFlashTimer = null;

watch(
  () => liveTick.value?.ask,
  (newVal, oldVal) => {
    const cur = Number(newVal);
    const prev = Number(oldVal);
    if (!isNaN(cur) && !isNaN(prev) && prev > 0 && cur !== prev) {
      askFlash.value = cur > prev ? "up" : "down";
      clearTimeout(askFlashTimer);
      askFlashTimer = setTimeout(() => {
        askFlash.value = "";
      }, 1000);
    }
  },
);

watch(
  () => liveTick.value?.bid,
  (newVal, oldVal) => {
    const cur = Number(newVal);
    const prev = Number(oldVal);
    if (!isNaN(cur) && !isNaN(prev) && prev > 0 && cur !== prev) {
      bidFlash.value = cur > prev ? "up" : "down";
      clearTimeout(bidFlashTimer);
      bidFlashTimer = setTimeout(() => {
        bidFlash.value = "";
      }, 1000);
    }
  },
);

const askColorClass = computed(() => {
  if (askFlash.value === "up") return "text-[#12A879] animate-pulse font-bold";
  if (askFlash.value === "down")
    return "text-[#E5484D] animate-pulse font-bold";
  return "text-[#12A879] font-bold";
});

const bidColorClass = computed(() => {
  if (bidFlash.value === "up") return "text-[#12A879] animate-pulse font-bold";
  if (bidFlash.value === "down")
    return "text-[#E5484D] animate-pulse font-bold";
  return "text-[#E5484D] font-bold";
});

const priceColorClass = computed(() => {
  if (tickFlash.value === "up")
    return "text-[#12A879] animate-pulse font-black";
  if (tickFlash.value === "down")
    return "text-[#E5484D] animate-pulse font-black";

  const chg =
    liveTick.value?.change != null ? Number(liveTick.value.change) : 0;
  if (chg < 0) return "text-[#E5484D]";
  return "text-[#12A879]";
});

const priceData = computed(() => {
  const b = Number(liveTick.value?.bid);
  const a = Number(liveTick.value?.ask);
  const rawChg = liveTick.value?.change;
  const rawPct = liveTick.value?.changePercent;

  const hasChange = rawChg != null || rawPct != null;
  const chg = rawChg != null ? Number(rawChg) : 98.22;
  const pct = rawPct != null ? Number(rawPct) : 0.91;

  const isGreen = chg >= 0;
  const priceStr =
    !isNaN(b) && b > 0 ? formatSymbolPrice(b, symbol.value, liveTick.value?.digits) : "75,229.29";
  const changeStr =
    hasChange && (chg !== 0 || pct !== 0)
      ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`
      : "+98.22 (+0.91%)";

  return {
    price: priceStr,
    change: changeStr,
    isGreen,
    open: activeCandle.value.open,
    high: activeCandle.value.high,
    low: activeCandle.value.low,
    close: activeCandle.value.close,
    sell: formattedBid.value,
    buy: formattedAsk.value,
  };
});

const limitPricePlaceholder = computed(() => {
  const tick = liveTick.value;
  const mode = selectedExecutionMode.value || "";
  const isBuy = mode.startsWith("Buy");

  if (isBuy) {
    const ask = Number(tick?.ask);
    if (!isNaN(ask) && ask > 0) {
      return formatSymbolPrice(ask, symbol.value, tick?.digits);
    }
    const buyPrice = priceData.value?.buy;
    if (buyPrice && buyPrice !== "75,229.29") {
      return String(buyPrice).replace(/,/g, "");
    }
    return "0.00";
  } else {
    const bid = Number(tick?.bid);
    if (!isNaN(bid) && bid > 0) {
      return formatSymbolPrice(bid, symbol.value, tick?.digits);
    }
    const sellPrice = priceData.value?.sell;
    if (sellPrice && sellPrice !== "75,229.29") {
      return String(sellPrice).replace(/,/g, "");
    }
    return "0.00";
  }
});

function extractSymbolName(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    if (item.symbol) {
      return typeof item.symbol === "string"
        ? item.symbol
        : item.symbol.symbol || item.symbol.name || "";
    }
    return item.symbol_name || item.name || "";
  }
  return String(item);
}

const isFavorite = computed(() => {
  const currentSym = symbol.value.toUpperCase();
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
  const currentSymbol = symbol.value;

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
      err?.message ||
        `Failed to ${wasFavorite ? "remove" : "add"} ${currentSymbol}`,
      "error",
    );
  }
}

const tradeSubFilter = ref("all"); // 'all' | 'positions' | 'orders'
const tradeSideFilter = ref("all");
const tradeSearchQuery = ref("");
const swipedItemId = ref(null);

const touchStartX = ref(0);
const touchStartY = ref(0);
const touchDiffX = ref(0);

const isModifyModalOpen = ref(false);
const modifyItem = ref(null);
const modifySl = ref("");
const modifyTp = ref("");
const isModifying = ref(false);

const isCloseModalOpen = ref(false);
const closeItem = ref(null);
const closeVolume = ref(0.01);
const isClosing = ref(false);

const isTradeDetailsOpen = ref(false);
const selectedTradeItem = ref(null);
const isBulkOperationsOpen = ref(false);

const symbolDescriptions = {
  EURUSD: "Euro / U.S. Dollar",
  GBPUSD: "British Pound / U.S. Dollar",
  USDJPY: "U.S. Dollar / Japanese Yen",
  AUDUSD: "Australian Dollar / U.S. Dollar",
  USDCAD: "U.S. Dollar / Canadian Dollar",
  USDCHF: "U.S. Dollar / Swiss Franc",
  NZDUSD: "New Zealand Dollar / U.S. Dollar",
  EURGBP: "Euro / British Pound",
  EURJPY: "Euro / Japanese Yen",
  GBPJPY: "British Pound / Japanese Yen",
  BTCUSD: "Bitcoin / U.S. Dollar",
  ETHUSD: "Ethereum / U.S. Dollar",
  SOLUSD: "Solana / U.S. Dollar",
  XAUUSD: "Gold / U.S. Dollar",
  XAGUSD: "Silver / U.S. Dollar",
  US30: "Wall Street 30 Index",
  NAS100: "US Tech 100 Index",
  SPX500: "S&P 500 Index",
};

function getSymbolDescription(sym) {
  return symbolDescriptions[sym] || "Forex / Spot Instrument";
}

const sideOptions = [
  { value: "all", label: "All Sides" },
  { value: "BUY", label: "BUY Only" },
  { value: "SELL", label: "SELL Only" },
];

const openPositions = computed(() => {
  return (positionsStore.data || [])
    .filter((p) => String(p.status || "").toUpperCase() !== "CLOSED")
    .map((p) => ({
      ...p,
      _itemType: "position",
    }));
});

const profitablePositions = computed(() => {
  return openPositions.value.filter((p) => getLivePnl(p) > 0);
});

const losingPositions = computed(() => {
  return openPositions.value.filter((p) => getLivePnl(p) < 0);
});

const buyPositions = computed(() => {
  return openPositions.value.filter((p) =>
    String(p.type || p.action || p.side || "").toUpperCase().includes("BUY")
  );
});

const sellPositions = computed(() => {
  return openPositions.value.filter(
    (p) => !String(p.type || p.action || p.side || "").toUpperCase().includes("BUY")
  );
});

const pendingOrders = computed(() => {
  return (orderStore.ordersData || [])
    .filter((o) => {
      const st = String(o.state_name || o.state || o.status || "").toUpperCase();
      return st === "PLACED" || st === "PENDING" || st === "ACTIVE" || st === "1";
    })
    .map((o) => ({
      ...o,
      _itemType: "order",
    }));
});

const combinedTradeItems = computed(() => {
  return [...openPositions.value, ...pendingOrders.value];
});

const filteredTradeItems = computed(() => {
  let list = [];
  if (tradeSubFilter.value === "positions") list = openPositions.value;
  else if (tradeSubFilter.value === "orders") list = pendingOrders.value;
  else list = combinedTradeItems.value;

  if (tradeSideFilter.value !== "all") {
    list = list.filter((item) => {
      const s = String(item.type || item.action || item.side || "").toUpperCase();
      return s.includes(tradeSideFilter.value);
    });
  }

  if (tradeSearchQuery.value.trim()) {
    const q = tradeSearchQuery.value.toLowerCase().trim();
    list = list.filter((item) => {
      const sym = String(item.symbol || "").toLowerCase();
      const tkt = String(item.ticket || item.order_ticket || item.id || "").toLowerCase();
      return sym.includes(q) || tkt.includes(q);
    });
  }

  return list;
});

function getCurrentPrice(item) {
  const tick = tickerStore.getLastPrice(item.symbol);
  const isBuy = String(item.type || item.action || item.side || "").toUpperCase().includes("BUY");
  if (isBuy && tick?.bid != null) return Number(tick.bid);
  if (!isBuy && tick?.ask != null) return Number(tick.ask);
  if (tick?.last != null) return Number(tick.last);
  return Number(item.price_current || item.current_price || item.price || item.open_price || 0);
}

function getLivePnl(item) {
  if (item.pnl != null && !isNaN(Number(item.pnl)) && Number(item.pnl) !== 0) {
    return Number(item.pnl);
  }
  if (item.profit != null && !isNaN(Number(item.profit)) && Number(item.profit) !== 0) {
    return Number(item.profit);
  }
  const cur = getCurrentPrice(item);
  const open = Number(item.price_open || item.entry_price || item.price || 0);
  if (!cur || !open || open <= 0) return 0.00;
  const vol = Number(item.volume || item.lot || item.lots || 1);
  const isBuy = String(item.type || item.action || item.side || "").toUpperCase().includes("BUY");
  const diff = isBuy ? cur - open : open - cur;
  return Number((diff * vol * 100).toFixed(2));
}

function getItemKey(item) {
  return item._itemType + "_" + (item.ticket || item.order_ticket || item.id);
}

function handleTouchStart(e, item) {
  if (!e.touches || !e.touches[0]) return;
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
  touchDiffX.value = 0;
}

function handleTouchMove(e, item) {
  if (!e.touches || !e.touches[0]) return;
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  const diffX = currentX - touchStartX.value;
  const diffY = currentY - touchStartY.value;

  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
    touchDiffX.value = diffX;
  }
}

function handleTouchEnd(item) {
  const itemKey = getItemKey(item);
  if (touchDiffX.value < -35) {
    swipedItemId.value = itemKey;
  } else if (touchDiffX.value > 35) {
    if (swipedItemId.value === itemKey) {
      swipedItemId.value = null;
    }
  }
  touchDiffX.value = 0;
}

function toggleSwipeItem(item) {
  const key = getItemKey(item);
  if (swipedItemId.value === key) {
    swipedItemId.value = null;
  } else {
    swipedItemId.value = key;
  }
}

function handleTradeItemClick(item) {
  if (swipedItemId.value) {
    swipedItemId.value = null;
    return;
  }
  selectedTradeItem.value = item;
  isTradeDetailsOpen.value = true;
}

function handleActionClose(item) {
  isTradeDetailsOpen.value = false;
  openCloseModal(item);
}

function handleActionModify(item) {
  isTradeDetailsOpen.value = false;
  openModifyModal(item);
}

function handleActionTrade(item) {
  isTradeDetailsOpen.value = false;
  if (item?.symbol) {
    orderStore.selectedSymbol = item.symbol;
    activeTab.value = "chart";
    isOrderModalOpen.value = true;
  }
}

function handleActionChart(item) {
  isTradeDetailsOpen.value = false;
  if (item?.symbol) {
    orderStore.selectedSymbol = item.symbol;
    activeTab.value = "chart";
  }
}

function handleActionBulkOperations() {
  isTradeDetailsOpen.value = false;
  isBulkOperationsOpen.value = true;
}

async function executeBulkClose(type) {
  let targets = [];
  if (type === "all") targets = [...openPositions.value];
  else if (type === "profitable") targets = [...profitablePositions.value];
  else if (type === "losing") targets = [...losingPositions.value];
  else if (type === "buy") targets = [...buyPositions.value];
  else if (type === "sell") targets = [...sellPositions.value];

  if (!targets.length) return;
  isBulkOperationsOpen.value = false;

  try {
    for (const pos of targets) {
      const ticket = pos.position_ticket || pos.ticket || pos.id;
      if (ticket) {
        await positionsStore.closePosition(ticket, { volume: Number(pos.volume || pos.lot || pos.lots || 0.01) });
      }
    }
    if (homeStore.selectedAccountId) positionsStore.fetchPositions(homeStore.selectedAccountId);
    snackbar.show(`Closed ${targets.length} position(s) successfully`, "success");
  } catch (err) {
    snackbar.show("Failed to close some positions", "error");
  }
}

async function executeBulkCancelOrders() {
  const targets = [...pendingOrders.value];
  if (!targets.length) return;
  isBulkOperationsOpen.value = false;

  try {
    for (const ord of targets) {
      const ticket = ord.ticket || ord.order_ticket || ord.id;
      if (ticket) {
        await orderStore.cancelOrder(ticket);
      }
    }
    if (homeStore.selectedAccountId) orderStore.fetchPendingOrders(homeStore.selectedAccountId);
    snackbar.show(`Cancelled ${targets.length} order(s) successfully`, "success");
  } catch (err) {
    snackbar.show("Failed to cancel some orders", "error");
  }
}

function formatPnlNumber(val) {
  if (val == null || isNaN(Number(val))) return "0.00";
  const num = Number(val);
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPriceDelta(item) {
  const cur = getCurrentPrice(item);
  const open = Number(item.price_open || item.entry_price || item.price || 0);
  if (!cur || !open) return "0.00";
  const isBuy = String(item.type || item.action || item.side || "").toUpperCase().includes("BUY");
  const diff = isBuy ? cur - open : open - cur;
  return (diff >= 0 ? "+" : "") + formatNum(diff);
}

function getPriceDeltaPercent(item) {
  const cur = getCurrentPrice(item);
  const open = Number(item.price_open || item.entry_price || item.price || 0);
  if (!cur || !open || open === 0) return "0.00";
  const isBuy = String(item.type || item.action || item.side || "").toUpperCase().includes("BUY");
  const diff = isBuy ? cur - open : open - cur;
  const pct = (diff / open) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(2);
}

function isPositiveDelta(item) {
  const cur = getCurrentPrice(item);
  const open = Number(item.price_open || item.entry_price || item.price || 0);
  const isBuy = String(item.type || item.action || item.side || "").toUpperCase().includes("BUY");
  return isBuy ? cur >= open : open >= cur;
}

function formatSlTp(val) {
  if (val == null || val === "" || Number(val) === 0 || isNaN(Number(val))) return "-";
  return formatNum(val);
}

function formatSwap(val) {
  if (val == null || isNaN(Number(val))) return "-0.00";
  const num = Number(val);
  return (num < 0 ? "-" : "") + Math.abs(num).toFixed(2);
}

function openModifyModal(item) {
  modifyItem.value = item;
  modifySl.value = item.sl || item.price_sl || "";
  modifyTp.value = item.tp || item.price_tp || "";
  isModifyModalOpen.value = true;
  swipedItemId.value = null;
}

async function handleSaveModify() {
  if (!modifyItem.value) return;
  isModifying.value = true;
  try {
    const tkt = modifyItem.value.position_ticket || modifyItem.value.ticket || modifyItem.value.id;
    if (modifyItem.value._itemType === "order" || modifyItem.value.order_ticket) {
      await orderStore.modifyOrder(tkt, { sl: modifySl.value, tp: modifyTp.value });
      if (homeStore.selectedAccountId) orderStore.fetchPendingOrders(homeStore.selectedAccountId);
    } else {
      await positionsStore.modifySlTp(tkt, { sl: modifySl.value, tp: modifyTp.value });
      if (homeStore.selectedAccountId) positionsStore.fetchPositions(homeStore.selectedAccountId);
    }
    snackbar.show(`Updated SL/TP successfully`, "success");
    isModifyModalOpen.value = false;
    modifyItem.value = null;
  } catch (err) {
    snackbar.show(err?.message || "Failed to modify trade", "error");
  } finally {
    isModifying.value = false;
  }
}

function openCloseModal(item) {
  closeItem.value = item;
  closeVolume.value = Number(item.volume || item.lot || item.lots || 0.01);
  isCloseModalOpen.value = true;
  swipedItemId.value = null;
}

async function handleConfirmClose() {
  if (!closeItem.value) return;
  isClosing.value = true;
  try {
    const item = closeItem.value;
    if (item._itemType === "order" || item.order_ticket) {
      const ticket = item.ticket || item.order_ticket || item.id;
      await orderStore.cancelOrder(ticket);
      if (homeStore.selectedAccountId) orderStore.fetchPendingOrders(homeStore.selectedAccountId);
    } else {
      const ticket = item.position_ticket || item.ticket || item.id;
      await positionsStore.closePosition(ticket, { volume: closeVolume.value });
      if (homeStore.selectedAccountId) positionsStore.fetchPositions(homeStore.selectedAccountId);
    }
    isCloseModalOpen.value = false;
    closeItem.value = null;
  } catch (err) {
    console.error("Close action failed:", err);
  } finally {
    isClosing.value = false;
  }
}

function formatNum(val) {
  if (val == null || isNaN(Number(val))) return "- -";
  const num = Number(val);
  return num > 100 ? num.toFixed(2) : num.toFixed(4);
}

function formatDateTime(val) {
  if (!val) return "2026.06.27 12:12:24";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd} ${hh}:${min}:${ss}`;
  } catch (e) {
    return String(val);
  }
}

const tabs = computed(() => [
  { key: "chart", label: "Chart" },
  { key: "orders", label: `Trades (${combinedTradeItems.value.length})` },
  { key: "info", label: "Info" },
  { key: "analysis", label: "Analysis" },
]);

const freeMargin = computed(() => {
  if (!selectedAccount.value) return "0.00";
  const val =
    selectedAccount.value.freeMargin ??
    selectedAccount.value.free_margin ??
    selectedAccount.value.balance ??
    0;
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});
const accountCurrency = computed(
  () => selectedAccount.value?.currency || "USD",
);

const lots = ref(0.01);
const lotStep = 0.01;

function increaseLots() {
  lots.value = Number((lots.value + lotStep).toFixed(2));
}

function decreaseLots() {
  if (lots.value > 0.01) {
    lots.value = Number((lots.value - lotStep).toFixed(2));
  }
}

async function onTrade(direction) {
  if (lots.value < 0.01) {
    snackbar.show("Minimum Lot must be at least 0.01", "error");
    return;
  }

  const accId = homeStore.selectedAccountId;
  if (!accId) {
    snackbar.show("Please select a trading account first.", "error");
    return;
  }

  const targetAccount = homeStore.data?.find(
    (acc) => (acc.id ?? acc.raw?.id) == accId,
  );
  const brokerCurrency = (
    targetAccount?.broker_currency ||
    targetAccount?.currency ||
    targetAccount?.raw?.broker_currency ||
    targetAccount?.raw?.currency ||
    ""
  ).toUpperCase();

  let finalSymbol = String(symbol.value);
  if (brokerCurrency === "USC") {
    finalSymbol = finalSymbol.endsWith(".c") ? finalSymbol : `${finalSymbol}.c`;
  }

  let tradeType = "";
  if (selectedExecutionMode.value === "Market Execution") {
    tradeType = direction.toUpperCase();
  } else {
    if (selectedExecutionMode.value === "Buy Limit") tradeType = "BUY_LIMIT";
    else if (selectedExecutionMode.value === "Sell Limit")
      tradeType = "SELL_LIMIT";
    else if (selectedExecutionMode.value === "Buy Stop") tradeType = "BUY_STOP";
    else if (selectedExecutionMode.value === "Sell Stop")
      tradeType = "SELL_STOP";
    else tradeType = direction.toUpperCase();
  }

  const isLimit = selectedExecutionMode.value !== "Market Execution";

  let referencePrice = 0;
  if (isLimit) {
    if (!limitPriceVal.value || Number(limitPriceVal.value) <= 0) {
      snackbar.show(
        "Please enter a valid entry price for pending order",
        "error",
      );
      return;
    }
    referencePrice = Number(limitPriceVal.value);
  } else {
    referencePrice =
      direction.toUpperCase() === "BUY"
        ? Number(liveTick.value?.ask) || Number(liveTick.value?.bid) || 0
        : Number(liveTick.value?.bid) || Number(liveTick.value?.ask) || 0;
  }

  const payload = {
    trading_account_id: Number(accId),
    symbol: finalSymbol,
    type: tradeType,
    volume: Number(lots.value),
  };

  if (isLimit) {
    payload.price = referencePrice;
  } else if (referencePrice > 0) {
    payload.price = referencePrice;
  }

  if (
    isSlChecked.value &&
    stopLossVal.value !== null &&
    stopLossVal.value !== ""
  ) {
    const rawSl = Number(stopLossVal.value);
    let slPrice = rawSl;
    if (slTpMode.value === "pips") {
      const pipMultiplier = referencePrice > 100 ? 0.1 : 0.0001;
      slPrice =
        direction.toUpperCase() === "BUY"
          ? referencePrice - rawSl * pipMultiplier
          : referencePrice + rawSl * pipMultiplier;
    }

    if (referencePrice > 0) {
      const formattedRef =
        referencePrice > 100
          ? referencePrice.toFixed(2)
          : referencePrice.toFixed(4);
      const priceLabel = isLimit ? "entry" : "current LTP";
      if (direction.toUpperCase() === "BUY" && slPrice >= referencePrice) {
        snackbar.show(
          `Stop Loss for BUY order must be below ${priceLabel} price (${formattedRef})`,
          "error",
        );
        return;
      }
      if (direction.toUpperCase() === "SELL" && slPrice <= referencePrice) {
        snackbar.show(
          `Stop Loss for SELL order must be above ${priceLabel} price (${formattedRef})`,
          "error",
        );
        return;
      }
    }
    payload.sl = Number(slPrice.toFixed(referencePrice > 100 ? 2 : 4));
  }

  if (isTpChecked.value && targetVal.value !== null && targetVal.value !== "") {
    const rawTp = Number(targetVal.value);
    let tpPrice = rawTp;
    if (slTpMode.value === "pips") {
      const pipMultiplier = referencePrice > 100 ? 0.1 : 0.0001;
      tpPrice =
        direction.toUpperCase() === "BUY"
          ? referencePrice + rawTp * pipMultiplier
          : referencePrice - rawTp * pipMultiplier;
    }

    if (referencePrice > 0) {
      const formattedRef =
        referencePrice > 100
          ? referencePrice.toFixed(2)
          : referencePrice.toFixed(4);
      const priceLabel = isLimit ? "entry" : "current LTP";
      if (direction.toUpperCase() === "BUY" && tpPrice <= referencePrice) {
        snackbar.show(
          `Take Profit for BUY order must be above ${priceLabel} price (${formattedRef})`,
          "error",
        );
        return;
      }
      if (direction.toUpperCase() === "SELL" && tpPrice >= referencePrice) {
        snackbar.show(
          `Take Profit for SELL order must be below ${priceLabel} price (${formattedRef})`,
          "error",
        );
        return;
      }
    }
    payload.tp = Number(tpPrice.toFixed(referencePrice > 100 ? 2 : 4));
  }

  payload.comment = orderCommentVal.value
    ? orderCommentVal.value.trim()
    : `Manual ${tradeType}`;

  activePlacingDirection.value = direction.toUpperCase();
  isPlacingOrder.value = true;

  try {
    await orderStore.placeOrder(payload);
    orderStore.fetchOrders(accId);
    positionsStore.fetchPositions(accId);
    orderCommentVal.value = "";
    showCommentInput.value = false;
    limitPriceVal.value = "";
    stopLossVal.value = "";
    targetVal.value = "";
    isTradingCardCollapsed.value = true;
  } catch (err) {
    console.error("Order placement error:", err);
  } finally {
    isPlacingOrder.value = false;
    activePlacingDirection.value = "";
  }
}

async function handleCancelItem(item) {
  if (item.ticket || item.order_ticket) {
    const ticket = item.ticket || item.order_ticket;
    await orderStore.cancelOrder(ticket);
  } else if (item.position_ticket || item.id) {
    const ticket = item.position_ticket || item.id;
    await positionsStore.closePosition(ticket);
  }
}

const isTradingCardCollapsed = ref(true);
let expandScrollY = 0;

function getScrollPos() {
  const container = document.querySelector(".overflow-y-auto");
  if (container) {
    return container.scrollTop;
  }
  return window.scrollY || document.documentElement?.scrollTop || 0;
}

function toggleTradingCard() {
  isTradingCardCollapsed.value = !isTradingCardCollapsed.value;
  if (!isTradingCardCollapsed.value) {
    expandScrollY = getScrollPos();
  }
}

const isPositionSheetOpen = ref(false);
const activePositionTicket = ref(null);
const klineChartRef = ref(null);

const activePosition = computed(() => {
  if (!activePositionTicket.value) return null;
  const allPos = positionsStore.data || [];
  const foundPos = allPos.find(
    (p) =>
      String(p.position_ticket || p.order_ticket || p.id || p.ticket) ===
      String(activePositionTicket.value),
  );
  if (foundPos) return foundPos;
  const allOrders = orderStore.pendingOrdersData || [];
  return (
    allOrders.find(
      (o) =>
        String(o.order_ticket || o.position_ticket || o.id || o.ticket) ===
        String(activePositionTicket.value),
    ) || null
  );
});

const isDraftSlActive = computed(() => {
  if (!activePositionTicket.value || !klineChartRef.value) return false;
  return Boolean(klineChartRef.value.draftSlMap?.[activePositionTicket.value]);
});

const isDraftTpActive = computed(() => {
  if (!activePositionTicket.value || !klineChartRef.value) return false;
  return Boolean(klineChartRef.value.draftTpMap?.[activePositionTicket.value]);
});

const draftSlVal = computed(() => {
  if (!activePositionTicket.value || !klineChartRef.value) return null;
  return klineChartRef.value.draftSlMap?.[activePositionTicket.value] ?? null;
});

const draftTpVal = computed(() => {
  if (!activePositionTicket.value || !klineChartRef.value) return null;
  return klineChartRef.value.draftTpMap?.[activePositionTicket.value] ?? null;
});

function handleToggleDraftSl() {
  if (activePositionTicket.value && klineChartRef.value?.toggleDraftSl) {
    klineChartRef.value.toggleDraftSl(activePositionTicket.value);
  }
}

function handleToggleDraftTp() {
  if (activePositionTicket.value && klineChartRef.value?.toggleDraftTp) {
    klineChartRef.value.toggleDraftTp(activePositionTicket.value);
  }
}

function openPositionSheet(ticket) {
  if (!ticket) return;
  activePositionTicket.value = ticket;
  isPositionSheetOpen.value = true;
  isTradingCardCollapsed.value = false;
}

function closePositionSheet() {
  isPositionSheetOpen.value = false;
  activePositionTicket.value = null;
  isTradingCardCollapsed.value = true;
}

async function handleClosePositionFromSheet() {
  if (!activePosition.value) return;
  const ticket =
    activePosition.value.position_ticket ||
    activePosition.value.order_ticket ||
    activePosition.value.id ||
    activePosition.value.ticket;
  try {
    if (
      activePosition.value.order_ticket ||
      activePosition.value.state ||
      activePosition.value._itemType === "order"
    ) {
      await orderStore.cancelOrder(ticket);
      const accId = homeStore.selectedAccountId;
      if (accId) orderStore.fetchPendingOrders(accId);
    } else {
      await positionsStore.closePosition(ticket);
      const accId = homeStore.selectedAccountId;
      if (accId) positionsStore.fetchPositions(accId);
    }
  } catch (err) {
    console.error("Error closing position from sheet:", err);
  } finally {
    closePositionSheet();
  }
}

async function handleUpdateSlTpFromSheet({ sl, tp }) {
  if (!activePosition.value) return;
  const ticket =
    activePosition.value.position_ticket ||
    activePosition.value.order_ticket ||
    activePosition.value.id ||
    activePosition.value.ticket;
  try {
    if (
      activePosition.value.order_ticket ||
      activePosition.value.state ||
      activePosition.value._itemType === "order"
    ) {
      await orderStore.modifyOrder(ticket, { sl, tp });
      const accId = homeStore.selectedAccountId;
      if (accId) orderStore.fetchPendingOrders(accId);
    } else {
      await positionsStore.modifySlTp(ticket, { sl, tp });
      const accId = homeStore.selectedAccountId;
      if (accId) positionsStore.fetchPositions(accId);
    }
  } catch (err) {
    console.error("Error modifying SL/TP from sheet:", err);
  }
}

function handleScroll() {
  if (isPositionSheetOpen.value) return;
  if (!isTradingCardCollapsed.value) {
    const currentY = getScrollPos();
    if (Math.abs(currentY - expandScrollY) > 20) {
      isTradingCardCollapsed.value = true;
    }
  }
}
</script>

<template>
  <div
    class="w-full min-h-full bg-white dark:bg-[#0B0F19] text-[#0F1424] dark:text-[#F8FAFC] flex flex-col justify-start font-sans transition-colors duration-200"
    :class="activeTab === 'chart' ? (isTradingCardCollapsed ? 'pb-14' : 'pb-52') : 'pb-8'"
  >
    <!-- Header Navigation (Scrolls away) -->
    <div class="px-4 pt-3 pb-2 flex items-center justify-between bg-white dark:bg-[#0B0F19] border-b border-transparent dark:border-slate-800/60">
      <!-- Left Section -->
      <div class="flex items-center gap-3">
        <!-- Back Circle Button -->
        <button
          type="button"
          @click="handleBack"
          class="w-10 h-10 rounded-full bg-[#F4F5F7] dark:bg-slate-800 flex items-center justify-center text-[#0F1424] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>

        <!-- Symbol Title & Live Change (Navigates to Market Page) -->
        <div
          @click="isMarketModalOpen = true"
          class="flex flex-col cursor-pointer select-none group"
          title="Open Watchlist & Market Page"
        >
          <span
            class="font-symbol text-[#0F1424] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <span>{{ symbol }}</span>
            <ChevronDown
              class="w-4 h-4 text-[#0F1424] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0"
            />
          </span>
          <span class="text-[11.5px] font-medium text-[#8C93A3] dark:text-slate-400">
            Ask: <span :class="askColorClass">{{ formattedAsk }}</span> / Bid:
            <span :class="bidColorClass">{{ formattedBid }}</span>
          </span>
        </div>
      </div>

      <!-- Right Section (Star Favorite Button & Theme Toggle) -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="toggleFavorite"
          class="w-10 h-10 rounded-full bg-[#F4F5F7] dark:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          :class="
            isFavorite
              ? 'text-[#E0CA3C]'
              : 'text-[#9CA3AF] dark:text-slate-400 hover:text-[#0F1424] dark:hover:text-white'
          "
          :title="isFavorite ? 'Remove from Watchlist' : 'Add to Watchlist'"
        >
          <Star class="w-5 h-5" :class="isFavorite ? 'fill-[#E0CA3C]' : ''" />
        </button>

        <button
          type="button"
          @click="themeStore.toggleTheme($event)"
          class="w-10 h-10 rounded-full bg-[#F4F5F7] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer text-[#0F1424] dark:text-white"
          :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
          <Moon v-else class="w-5 h-5 text-slate-700" />
        </button>
      </div>
    </div>

    <!-- Trading Account Selector Row (Scrolls away) -->
    <div
      class="px-4 py-2 flex items-center justify-between border-t border-slate-100/60 dark:border-slate-800/80 bg-white dark:bg-[#0B0F19]"
    >
      <span class="text-sm font-bold text-[#0F1424] dark:text-white">
        Trading Account
      </span>

      <div class="max-w-[200px]">
        <BaseSelect
          v-model="selectedAccountId"
          :options="accountOptions"
          placeholder="Select Account"
          height="32px"
          rounded="full"
          button-class="bg-slate-200/80 dark:bg-slate-800 text-[#0F1424] dark:text-white text-xs font-bold px-3 py-1 border border-slate-200/50 dark:border-slate-700 shadow-none"
        >
          <template #trigger="{ label }">
            <div class="flex items-center gap-1.5 min-w-0 mr-1">
              <div
                class="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <img
                  :src="usFlg"
                  class="w-full h-full object-cover rounded-full"
                  alt="US Flag"
                />
              </div>
              <span class="truncate text-xs font-bold text-[#0F1424] dark:text-white">{{ label }}</span>
            </div>
          </template>

          <template #option="{ option, selected }">
            <div class="flex items-center justify-between w-full min-w-0 py-0.5 text-left">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div
                  class="w-8.5 h-8.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0 overflow-hidden"
                >
                  <img
                    :src="usFlg"
                    class="w-5 h-5 rounded-full object-cover"
                    alt="US Flag"
                  />
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold text-[#0F1424] dark:text-white truncate">
                      {{ option.label }}
                    </span>
                  </div>
                  <span class="text-xs font-medium text-gray-500 dark:text-slate-400 truncate mt-0.5">
                    {{ option.groupLabel }}
                    <template v-if="option.equity || option.balance">
                      · ${{ option.equity || option.balance }}
                    </template>
                  </span>
                </div>
              </div>

              <!-- Selected Account Tick Checkmark -->
              <Check
                v-if="selected || String(option.value) === String(selectedAccountId)"
                class="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400 shrink-0 ml-2 stroke-[2.5]"
              />
            </div>
          </template>
        </BaseSelect>
      </div>
    </div>

    <!-- Main Navigation Tabs Bar (Sticky at top when scrolled) -->
    <div class="sticky top-0 z-40 px-4 pt-2.5 flex items-center gap-6 bg-white dark:bg-[#0B0F19] border-b border-slate-100 dark:border-slate-800 shadow-xs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="activeTab = tab.key"
        class="relative pb-2.5 transition-colors cursor-pointer group"
      >
        <span
          class="text-sm sm:text-base transition-colors"
          :class="
            activeTab === tab.key
              ? 'font-bold text-[#0F1424] dark:text-white'
              : 'font-medium text-[#8C93A3] dark:text-slate-400 hover:text-[#0F1424] dark:hover:text-white'
          "
        >
          {{ tab.label }}
        </span>
        <span
          v-if="activeTab === tab.key"
          class="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-[3px] bg-[#0F1424] dark:bg-white rounded-full"
        ></span>
      </button>
    </div>

    <!-- Price Summary Header & 2x2 OHLC Stats -->
    <div
      class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B0F19] flex items-start justify-between"
    >
      <!-- Left Price Summary Block -->
      <div class="flex flex-col gap-0.5">
        <h2
          class="font-live-price transition-colors duration-200"
          :class="priceColorClass"
        >
          {{ priceData.price }}
        </h2>
        <span class="text-xs font-medium text-[#8C93A3] dark:text-slate-400">
          Ask: <span :class="askColorClass">{{ formattedAsk }}</span> / Bid:
          <span :class="bidColorClass">{{ formattedBid }}</span>
        </span>
      </div>

      <!-- Right 2x2 OHLC Stats Grid -->
      <div
        class="grid grid-cols-2 gap-x-6 gap-y-1.5 text-right text-xs font-sans"
      >
        <div>
          <span class="text-[#9CA3AF] dark:text-slate-500 block font-medium text-[10px] font-sans"
            >Open</span
          >
          <span class="font-semibold text-[#0F1424] dark:text-white font-sans">{{
            priceData.open
          }}</span>
        </div>
        <div>
          <span class="text-[#9CA3AF] dark:text-slate-500 block font-medium text-[10px] font-sans"
            >High</span
          >
          <span class="font-semibold text-[#0F1424] dark:text-white font-sans">{{
            priceData.high
          }}</span>
        </div>
        <div>
          <span class="text-[#9CA3AF] dark:text-slate-500 block font-medium text-[10px] font-sans"
            >Low</span
          >
          <span class="font-semibold text-[#0F1424] dark:text-white font-sans">{{
            priceData.low
          }}</span>
        </div>
        <div>
          <span class="text-[#9CA3AF] dark:text-slate-500 block font-medium text-[10px] font-sans"
            >Close</span
          >
          <span class="font-semibold text-[#0F1424] dark:text-white font-sans">{{
            priceData.close
          }}</span>
        </div>
      </div>
    </div>

    <!-- Tab View Contents -->
    <div class="flex-1">
      <!-- Chart Tab -->
      <div v-if="activeTab === 'chart'" class="flex flex-col">
        <!-- KLineChart Component -->
        <KLineChartDemo
          ref="klineChartRef"
          :symbol="symbol"
          :positions="positionsStore.data"
          :isCollapsed="isTradingCardCollapsed"
          :disableScrollAndZoom="true"
          @candleChange="handleCandleChange"
          @openPositionSheet="openPositionSheet"
          @openMarketModal="isMarketModalOpen = true"
        />
      </div>

      <!-- Orders & Active Trades Tab (All Active Trades List) -->
      <div v-else-if="activeTab === 'orders'" class="flex flex-col bg-white dark:bg-[#0B0F19] min-h-0 flex-1">
        <div class="px-4 pt-2 pb-20 flex flex-col gap-2">
          <!-- Active Trades Cards List -->
          <div class="flex flex-col">
            <template v-if="positionsStore.loading || orderStore.ordersLoading">
              <div class="flex flex-col divide-y divide-gray-100 dark:divide-slate-800">
                <div v-for="n in 4" :key="`skel_trade_${n}`" class="py-3 px-1 flex flex-col gap-2 animate-pulse">
                  <div class="flex items-center justify-between">
                    <div class="h-4.5 w-28 bg-gray-200 dark:bg-slate-800 rounded"></div>
                    <div class="h-4.5 w-16 bg-gray-200 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="h-3.5 w-36 bg-gray-100 dark:bg-slate-800/60 rounded"></div>
                    <div class="h-3.5 w-24 bg-gray-100 dark:bg-slate-800/60 rounded"></div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="!combinedTradeItems.length">
              <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                <p class="text-sm font-bold text-[#0F1424] dark:text-white">No Active Trades</p>
                <p class="text-xs text-[#9CA3AF] dark:text-slate-400 max-w-xs">You have no open positions or placed orders.</p>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col gap-2.5">
                <div
                  v-for="item in combinedTradeItems"
                  :key="getItemKey(item)"
                  class="relative overflow-hidden rounded-2xl bg-card-surface"
                >
                  <!-- Background Action Buttons (Revealed on Swipe Right-to-Left) -->
                  <div class="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2 z-0">
                    <button
                      type="button"
                      @click.stop="openModifyModal(item)"
                      class="h-[82%] px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer min-w-[68px] shadow-xs"
                      title="Modify Trade"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                      <span>Modify</span>
                    </button>

                    <button
                      type="button"
                      @click.stop="openCloseModal(item)"
                      class="h-[82%] px-3 bg-[#E5484D] hover:bg-[#DC2626] text-white text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer min-w-[68px] shadow-xs"
                      :title="item._itemType === 'order' ? 'Cancel Order' : 'Close Position'"
                    >
                      <X class="w-3.5 h-3.5" />
                      <span>{{ item._itemType === 'order' ? 'Cancel' : 'Close' }}</span>
                    </button>
                  </div>

                  <!-- Foreground Trade Card Container -->
                  <div
                    class="relative z-10 bg-[#F8FAFC] dark:bg-[#131B2E] p-3 sm:p-3.5 flex flex-col gap-1 transition-transform duration-250 ease-out select-none cursor-pointer"
                    :style="{
                      transform: swipedItemId === getItemKey(item) ? 'translateX(-165px)' : 'translateX(0px)'
                    }"
                    @touchstart="(e) => handleTouchStart(e, item)"
                    @touchmove="(e) => handleTouchMove(e, item)"
                    @touchend="() => handleTouchEnd(item)"
                    @click="handleTradeItemClick(item)"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="font-bold text-sm text-[#0F1424] dark:text-white truncate">
                          {{ item.symbol }}
                        </span>
                        <span
                          class="font-semibold text-xs sm:text-sm leading-none tracking-[0.01em]"
                          :class="
                            String(item.type || item.action || item.side || '').toUpperCase().includes('BUY')
                              ? 'text-[#2563EB]'
                              : 'text-[#E5484D]'
                          "
                        >
                          {{ String(item.type || item.action || item.side || 'BUY').toUpperCase().includes('BUY') ? 'Buy' : 'Sell' }} {{ item.volume || item.lot || item.lots || '0.01' }}
                        </span>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <span
                          v-if="item._itemType === 'order'"
                          class="font-bold text-xs sm:text-sm text-[#2563EB]"
                        >
                          {{ item.state_name || item.state || item.status || 'Placed' }}
                        </span>
                        <span
                          v-else
                          class="font-bold text-sm sm:text-base tracking-tight"
                          :class="getLivePnl(item) >= 0 ? 'text-[#2563EB]' : 'text-[#E5484D]'"
                        >
                          {{ getLivePnl(item).toFixed(2) }}
                        </span>
                      </div>
                    </div>

                    <!-- Bottom Line: Entry -> Current / LTP (Left) | Timestamp (Right) -->
                    <div class="flex items-center justify-between gap-2 text-xs text-[#6B7280] dark:text-slate-400">
                      <div class="truncate">
                        <template v-if="item._itemType === 'order'">
                          {{ formatNum(item.price_order || item.price_open || item.price || item.entry_price) }}
                        </template>
                        <template v-else>
                          {{ formatNum(item.price_open || item.entry_price || item.price) }} &rarr; {{ formatNum(getCurrentPrice(item)) }}
                        </template>
                      </div>

                      <div class="text-[#9CA3AF] dark:text-slate-500 shrink-0 text-xs">
                        {{ formatDateTime(item.time || item.created_at || item.open_time) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Info Tab -->
      <div
        v-else-if="activeTab === 'info'"
        class="px-4 py-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs bg-white dark:bg-[#0B0F19]"
      >
        <div class="py-2.5 flex justify-between">
          <span class="text-[#9CA3AF] dark:text-slate-400 font-medium">Contract Size</span>
          <span class="font-bold text-[#0F1424] dark:text-white">100 oz</span>
        </div>
        <div class="py-2.5 flex justify-between">
          <span class="text-[#9CA3AF] dark:text-slate-400 font-medium">Minimum Volume</span>
          <span class="font-bold text-[#0F1424] dark:text-white">0.01 Lots</span>
        </div>
        <div class="py-2.5 flex justify-between">
          <span class="text-[#9CA3AF] dark:text-slate-400 font-medium">Maximum Volume</span>
          <span class="font-bold text-[#0F1424] dark:text-white">100.00 Lots</span>
        </div>
        <div class="py-2.5 flex justify-between">
          <span class="text-[#9CA3AF] dark:text-slate-400 font-medium">Margin Rate</span>
          <span class="font-bold text-[#0F1424] dark:text-white">1%</span>
        </div>
      </div>

      <!-- Analysis Tab -->
      <div
        v-else-if="activeTab === 'analysis'"
        class="px-4 py-4 text-xs flex flex-col gap-3 bg-white dark:bg-[#0B0F19]"
      >
        <div
          class="bg-[#F4F5F7] dark:bg-[#131B2E] border border-transparent dark:border-slate-800 p-3.5 rounded-xl flex justify-between items-center"
        >
          <span class="font-bold text-[#0F1424] dark:text-white">RSI (14)</span>
          <span class="font-bold text-[#12A879]">54.2 (Buy)</span>
        </div>
        <div
          class="bg-[#F4F5F7] dark:bg-[#131B2E] border border-transparent dark:border-slate-800 p-3.5 rounded-xl flex justify-between items-center"
        >
          <span class="font-bold text-[#0F1424] dark:text-white">MACD</span>
          <span class="font-bold text-[#12A879]">Bullish Crossover</span>
        </div>
      </div>
    </div>

    <!-- Bottom Trading Controls Box (Only visible in Chart Tab) -->
    <div
      v-if="activeTab === 'chart'"
      class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white dark:bg-[#131B2E] rounded-t-[22px] p-3.5 sm:p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.45)] border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 sm:gap-3 transition-all duration-300 ease-in-out"
      :class="isPositionSheetOpen ? 'z-[150]' : 'z-50'"
    >
      <!-- Drag Handle Bar / Expand-Collapse Bar -->
      <div
        v-if="!isPositionSheetOpen"
        @click="toggleTradingCard"
        class="w-full flex items-center justify-center py-0.5 cursor-pointer group"
        title="Toggle trading panel"
      >
        <div
          class="w-10 h-1 rounded-full bg-gray-300 dark:bg-slate-700 group-hover:bg-gray-400 dark:group-hover:bg-slate-600 transition-colors"
        ></div>
      </div>

      <!-- POSITION ACTION SHEET PANEL -->
      <PositionActionSheet
        v-if="isPositionSheetOpen && activePosition"
        :position="activePosition"
        :liveBid="Number(liveTick?.bid)"
        :liveAsk="Number(liveTick?.ask)"
        :isDraftSlActive="isDraftSlActive"
        :isDraftTpActive="isDraftTpActive"
        :draftSlValue="draftSlVal"
        :draftTpValue="draftTpVal"
        @close="closePositionSheet"
        @closePosition="handleClosePositionFromSheet"
        @toggleDraftSl="handleToggleDraftSl"
        @toggleDraftTp="handleToggleDraftTp"
      />

      <template v-else>
        <!-- COLLAPSED COMPACT STATE -->
        <div
          v-if="isTradingCardCollapsed"
          class="flex flex-col gap-2 pt-0.5 pb-1"
        >
          <!-- Market Execution: Side-by-side Sell & Buy buttons -->
          <div v-if="isMarketExecution" class="grid grid-cols-2 gap-1.5">
            <!-- Sell Button (Red - Rounded on Left) -->
            <button
              type="button"
              :disabled="isPlacingOrder || lots < 0.01"
              @click="onTrade('SELL')"
              class="btn-sell-action disabled:opacity-50 text-white py-2 px-3 flex items-center justify-between transition-all active:scale-[0.98] shadow-xs cursor-pointer"
            >
              <span
                class="text-[11px] font-semibold opacity-90 flex items-center gap-1"
              >
                <Loader2
                  v-if="isPlacingOrder && activePlacingDirection === 'SELL'"
                  class="w-3.5 h-3.5 animate-spin"
                />
                Sell
              </span>
              <span class="text-[14px] font-extrabold tracking-tight">{{
                priceData.sell
              }}</span>
            </button>

            <!-- Buy Button (Green - Rounded on Right) -->
            <button
              type="button"
              :disabled="isPlacingOrder || lots < 0.01"
              @click="onTrade('BUY')"
              class="btn-buy-action disabled:opacity-50 text-white py-2 px-3 flex items-center justify-between transition-all active:scale-[0.98] shadow-xs cursor-pointer"
            >
              <span
                class="text-[11px] font-semibold opacity-90 flex items-center gap-1"
              >
                <Loader2
                  v-if="isPlacingOrder && activePlacingDirection === 'BUY'"
                  class="w-3.5 h-3.5 animate-spin"
                />
                Buy
              </span>
              <span class="text-[14px] font-extrabold tracking-tight">{{
                priceData.buy
              }}</span>
            </button>
          </div>

          <!-- Pending Orders: Single Action Button -->
          <button
            v-else
            type="button"
            :disabled="isPlacingOrder || lots < 0.01"
            @click="onTrade(pendingOrderAction)"
            class="w-full py-2 px-4 rounded-full text-white font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50"
            :class="
              isPendingBuy
                ? 'bg-[#12A879] hover:bg-[#0F946A]'
                : 'bg-[#E5484D] hover:bg-[#D43B40]'
            "
          >
            <Loader2 v-if="isPlacingOrder" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ pendingOrderLabel }}</span>
          </button>
        </div>

        <!-- EXPANDED FULL STATE -->
        <div v-else class="flex flex-col gap-2.5 sm:gap-3">
          <!-- Header: Symbol & Change Rate -->
          <div class="flex items-center justify-between">
            <span class="font-symbol text-xs sm:text-sm text-[#0F1424] dark:text-white">
              {{ symbol }}
            </span>
            <span class="text-[11.5px] font-medium text-[#8C93A3] dark:text-slate-400">
              Ask: <span :class="askColorClass">{{ formattedAsk }}</span> / Bid:
              <span :class="bidColorClass">{{ formattedBid }}</span>
            </span>
          </div>

          <!-- Execution Mode Tabs -->
          <div
            class="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1"
          >
            <button
              v-for="mode in executionModes"
              :key="mode"
              type="button"
              @click="selectedExecutionMode = mode"
              class="font-tab text-[12.5px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
              :class="
                selectedExecutionMode === mode
                  ? 'font-tab-active text-[#0F1424] dark:text-white border-[#0F1424] dark:border-white'
                  : 'font-tab-inactive text-[#8C93A3] dark:text-slate-400 hover:text-[#0F1424] dark:hover:text-white'
              "
            >
              {{ mode }}
            </button>
          </div>

          <!-- Limit / Stop Price Input (if not Market Execution) -->
          <div
            v-if="selectedExecutionMode !== 'Market Execution'"
            class="flex flex-col gap-1"
          >
            <label
              class="text-[10.5px] font-bold text-[#9CA3AF] dark:text-slate-400 uppercase tracking-wider"
              >Entry Price</label
            >
            <div
              class="flex items-center bg-[#F4F5F7] dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-xl px-2.5 h-8.5"
            >
              <input
                v-model="limitPriceVal"
                type="number"
                step="0.01"
                :placeholder="limitPricePlaceholder"
                class="w-full bg-transparent text-xs font-bold text-[#0F1424] dark:text-white focus:outline-none placeholder:text-[#8C93A3] dark:placeholder:text-slate-500"
              />
              <div class="flex flex-col shrink-0 ml-1 -mr-1">
                <button
                  type="button"
                  @click="stepUpLimitPrice"
                  class="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Increase"
                >
                  <ChevronUp class="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  @click="stepDownLimitPrice"
                  class="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Decrease"
                >
                  <ChevronDown class="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          <!-- Lot Size Control Box -->
          <div class="flex flex-col gap-1">
            <div
              class="bg-[#F4F5F7] dark:bg-slate-800/90 rounded-xl py-1 px-3 flex items-center justify-between border transition-colors"
              :class="lots < 0.01 ? 'border-[#E5484D]' : 'border-slate-200/80 dark:border-slate-700'"
            >
              <!-- Decrease Lot Button -->
              <button
                type="button"
                @click="decreaseLots"
                class="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#0F1424] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="Decrease Lots"
              >
                <Minus class="w-3.5 h-3.5" />
              </button>

              <!-- Lot Title & Current Value -->
              <div class="flex flex-col items-center justify-center">
                <span
                  class="text-[9.5px] font-semibold text-[#9CA3AF] dark:text-slate-400 leading-none"
                  >Lots</span
                >
                <span class="font-lot-value text-xs font-bold text-[#0F1424] dark:text-white">
                  {{ lots }}
                </span>
              </div>

              <!-- Increase Lot Button -->
              <button
                type="button"
                @click="increaseLots"
                class="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#0F1424] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="Increase Lots"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Lot Validation Warning -->
            <span
              v-if="lots < 0.01"
              class="text-[11px] font-medium text-[#E5484D] px-1"
            >
              Minimum Lot must be at least 0.01
            </span>
          </div>

          <!-- Collapsed vs Expanded SL / TP Section -->
          <button
            v-if="!isSlTpExpanded"
            type="button"
            @click="toggleSlTpExpand"
            class="w-full py-2 bg-[#F4F5F7] dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-[#0F1424] dark:text-white font-sltp text-xs rounded-xl transition-colors text-center cursor-pointer border border-transparent"
          >
            All Stoploss/target
          </button>

          <!-- Expanded State: SL & Target Inputs -->
          <div v-else class="space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <!-- Left: Stop Loss / Price Box -->
              <div
                class="bg-[#F4F5F7] dark:bg-slate-800/90 rounded-xl h-8.5 px-2.5 flex items-center justify-between gap-1 border border-slate-200/60 dark:border-slate-700 min-w-0"
              >
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    @click="isSlChecked = !isSlChecked"
                    class="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    :class="
                      isSlChecked
                        ? 'bg-[#11182A] dark:bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'
                    "
                  >
                    <Check v-if="isSlChecked" class="w-2.5 h-2.5 stroke-[3]" />
                  </button>
                  <input
                    v-model="stopLossVal"
                    type="number"
                    step="0.01"
                    :placeholder="
                      slTpMode === 'price' ? 'Stop Loss' : 'SL Pips'
                    "
                    class="w-full bg-transparent text-xs font-sltp text-[#0F1424] dark:text-white focus:outline-none placeholder:text-[#8C93A3] dark:placeholder:text-slate-500 min-w-0"
                  />
                </div>
                <div class="flex flex-col shrink-0 leading-none">
                  <button
                    type="button"
                    @click="stepUpStopLoss"
                    class="p-0 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer leading-none"
                    title="Increase"
                  >
                    <ChevronUp class="w-3 h-3 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    @click="stepDownStopLoss"
                    class="p-0 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer leading-none"
                    title="Decrease"
                  >
                    <ChevronDown class="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              <!-- Right: Target / Take Profit Box -->
              <div
                class="bg-[#F4F5F7] dark:bg-slate-800/90 rounded-xl h-8.5 px-2.5 flex items-center justify-between gap-1 border border-slate-200/60 dark:border-slate-700 min-w-0"
              >
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    @click="isTpChecked = !isTpChecked"
                    class="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    :class="
                      isTpChecked
                        ? 'bg-[#11182A] dark:bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'
                    "
                  >
                    <Check v-if="isTpChecked" class="w-2.5 h-2.5 stroke-[3]" />
                  </button>
                  <input
                    v-model="targetVal"
                    type="number"
                    step="0.01"
                    :placeholder="slTpMode === 'price' ? 'Target' : 'TP Pips'"
                    class="w-full bg-transparent text-xs font-sltp text-[#0F1424] dark:text-white focus:outline-none placeholder:text-[#8C93A3] dark:placeholder:text-slate-500 min-w-0"
                  />
                </div>
                <div class="flex flex-col shrink-0 leading-none">
                  <button
                    type="button"
                    @click="stepUpTarget"
                    class="p-0 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer leading-none"
                    title="Increase"
                  >
                    <ChevronUp class="w-3 h-3 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    @click="stepDownTarget"
                    class="p-0 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer leading-none"
                    title="Decrease"
                  >
                    <ChevronDown class="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Comment Field Toggle -->
          <div class="flex flex-col gap-1">
            <button
              v-if="!showCommentInput"
              type="button"
              @click="showCommentInput = true"
              class="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#2563EB] dark:text-blue-400 hover:text-[#1d4ed8] dark:hover:text-blue-300 transition-colors cursor-pointer py-0 self-start"
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>Add Comment</span>
            </button>

            <div v-else class="flex flex-col gap-1 transition-all">
              <div class="flex items-center justify-between">
                <label
                  class="text-[10px] font-bold text-[#9CA3AF] dark:text-slate-400 uppercase tracking-wider"
                  >Comment</label
                >
                <button
                  type="button"
                  @click="
                    showCommentInput = false;
                    orderCommentVal = '';
                  "
                  class="text-[10.5px] font-semibold text-[#9CA3AF] dark:text-slate-400 hover:text-[#E5484D] transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <input
                v-model="orderCommentVal"
                type="text"
                placeholder="Add a comment..."
                class="w-full h-8.5 px-2.5 bg-[#F4F5F7] dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-[#0F1424] dark:text-white focus:outline-none placeholder:text-[#8C93A3] dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div v-if="isMarketExecution" class="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              :disabled="isPlacingOrder || lots < 0.01"
              @click="onTrade('SELL')"
              class="btn-sell-action disabled:opacity-50 text-white py-1 px-2 flex flex-col items-center justify-center transition-all active:scale-[0.98] cursor-pointer"
            >
              <span
                class="text-[9.5px] font-semibold opacity-90 flex items-center gap-1"
              >
                <Loader2
                  v-if="isPlacingOrder && activePlacingDirection === 'SELL'"
                  class="w-3 h-3 animate-spin"
                />
                Sell
              </span>
              <span class="text-[12.5px] font-bold tracking-tight mt-0.5">{{
                priceData.sell
              }}</span>
            </button>

            <button
              type="button"
              :disabled="isPlacingOrder || lots < 0.01"
              @click="onTrade('BUY')"
              class="btn-buy-action disabled:opacity-50 text-white py-1 px-2 flex flex-col items-center justify-center transition-all active:scale-[0.98] cursor-pointer"
            >
              <span
                class="text-[9.5px] font-semibold opacity-90 flex items-center gap-1"
              >
                <Loader2
                  v-if="isPlacingOrder && activePlacingDirection === 'BUY'"
                  class="w-3 h-3 animate-spin"
                />
                Buy
              </span>
              <span class="text-[12.5px] font-bold tracking-tight mt-0.5">{{
                priceData.buy
              }}</span>
            </button>
          </div>

          <div v-else class="pt-1">
            <button
              type="button"
              :disabled="isPlacingOrder || lots < 0.01"
              @click="onTrade(pendingOrderAction)"
              class="w-full py-1.5 px-3 rounded-full text-white font-extrabold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50"
              :class="
                isPendingBuy
                  ? 'bg-[#12A879] hover:bg-[#0F946A]'
                  : 'bg-[#E5484D] hover:bg-[#D43B40]'
              "
            >
              <Loader2 v-if="isPlacingOrder" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ pendingOrderLabel }}</span>
            </button>
          </div>

          <!-- Free Margin & Collapse Link -->
          <div class="flex items-center justify-between pt-1">
            <span class="text-[11px] font-semibold text-[#0F1424] dark:text-white">
              Free Margin: {{ freeMargin }} {{ accountCurrency }}
            </span>
            <button
              type="button"
              @click="isTradingCardCollapsed = true"
              class="text-[10.5px] font-bold text-[#9CA3AF] dark:text-slate-400 hover:text-[#0F1424] dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Collapse</span>
              <ChevronDown class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Modify SL/TP Bottom Sheet Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isModifyModalOpen"
          class="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-xs transition-opacity"
          @click="isModifyModalOpen = false"
        />
      </Transition>

      <Transition name="slide-up">
        <div
          v-if="isModifyModalOpen && modifyItem"
          class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white dark:bg-[#131B2E] rounded-t-[28px] p-5 shadow-2xl z-[9999] flex flex-col gap-4 text-[#0F1424] dark:text-white border-t border-slate-100 dark:border-slate-800"
        >
          <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <h3 class="text-base font-bold text-[#0F1424] dark:text-white">Modify Trade</h3>
            <button
              type="button"
              @click="isModifyModalOpen = false"
              class="w-8 h-8 rounded-full flex items-center justify-center text-[#8C93A3] dark:text-slate-400 hover:text-[#0F1424] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="bg-[#F4F5F7] dark:bg-slate-800/80 border border-transparent dark:border-slate-700/60 rounded-2xl p-4 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-[#0F1424] dark:text-white truncate">{{ modifyItem.symbol }}</span>
                <span
                  class="font-bold text-xs px-2 py-0.5 rounded-md"
                  :class="String(modifyItem.type || modifyItem.action || modifyItem.side || 'BUY').toUpperCase().includes('BUY') ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-[#E5484D]/10 text-[#E5484D]'"
                >
                  {{ String(modifyItem.type || modifyItem.action || modifyItem.side || 'BUY').toUpperCase().includes('BUY') ? 'Buy' : 'Sell' }} {{ modifyItem.volume || modifyItem.lot || '0.01' }}
                </span>
              </div>

              <span
                v-if="modifyItem._itemType !== 'order'"
                class="font-extrabold text-base tracking-tight"
                :class="getLivePnl(modifyItem) >= 0 ? 'text-[#2563EB]' : 'text-[#E5484D]'"
              >
                {{ getLivePnl(modifyItem) >= 0 ? '+' : '' }}${{ getLivePnl(modifyItem).toFixed(2) }}
              </span>
            </div>

            <div class="flex items-center justify-between text-xs text-[#6B7280] dark:text-slate-400 pt-1 border-t border-gray-200/60 dark:border-slate-700">
              <span>Open: {{ formatNum(modifyItem.price_open || modifyItem.entry_price || modifyItem.price) }}</span>
              <span v-if="modifyItem._itemType !== 'order'">Current: {{ formatNum(getCurrentPrice(modifyItem)) }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-[#8C93A3] dark:text-slate-400 uppercase tracking-wider">Stop Loss (SL)</label>
            <input
              v-model="modifySl"
              type="number"
              step="0.0001"
              placeholder="Set Stop Loss"
              class="w-full bg-[#F4F5F7] dark:bg-slate-800 text-xs font-bold text-[#0F1424] dark:text-white py-3 px-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-[#8C93A3] dark:text-slate-400 uppercase tracking-wider">Take Profit (TP)</label>
            <input
              v-model="modifyTp"
              type="number"
              step="0.0001"
              placeholder="Set Take Profit"
              class="w-full bg-[#F4F5F7] dark:bg-slate-800 text-xs font-bold text-[#0F1424] dark:text-white py-3 px-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 mt-1">
            <button
              type="button"
              @click="isModifyModalOpen = false"
              class="flex-1 py-3 text-xs font-bold text-[#6B7280] dark:text-slate-300 bg-[#F4F5F7] dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="handleSaveModify"
              :disabled="isModifying"
              class="flex-1 py-3 text-xs font-bold text-white bg-[#0F1424] dark:bg-blue-600 hover:bg-[#1B2234] dark:hover:bg-blue-500 rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Loader2 v-if="isModifying" class="w-4 h-4 animate-spin text-white" />
              <span>Modify Order</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Close Position / Order Bottom Sheet Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isCloseModalOpen"
          class="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-xs transition-opacity"
          @click="isCloseModalOpen = false"
        />
      </Transition>

      <Transition name="slide-up">
        <div
          v-if="isCloseModalOpen && closeItem"
          class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white dark:bg-[#131B2E] rounded-t-[28px] p-5 shadow-2xl z-[9999] flex flex-col gap-4 text-[#0F1424] dark:text-white border-t border-slate-100 dark:border-slate-800"
        >
          <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <h3 class="text-base font-bold text-[#0F1424] dark:text-white">
              {{ closeItem._itemType === 'order' ? 'Cancel Order' : 'Close Position' }}
            </h3>
            <button
              type="button"
              @click="isCloseModalOpen = false"
              class="w-8 h-8 rounded-full flex items-center justify-center text-[#8C93A3] dark:text-slate-400 hover:text-[#0F1424] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="bg-[#F4F5F7] dark:bg-slate-800/80 border border-transparent dark:border-slate-700/60 rounded-2xl p-4 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-[#0F1424] dark:text-white truncate">{{ closeItem.symbol }}</span>
                <span
                  class="font-bold text-xs px-2 py-0.5 rounded-md"
                  :class="String(closeItem.type || closeItem.action || closeItem.side || 'BUY').toUpperCase().includes('BUY') ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-[#E5484D]/10 text-[#E5484D]'"
                >
                  {{ String(closeItem.type || closeItem.action || closeItem.side || 'BUY').toUpperCase().includes('BUY') ? 'Buy' : 'Sell' }} {{ closeItem.volume || closeItem.lot || '0.01' }}
                </span>
              </div>

              <span
                v-if="closeItem._itemType !== 'order'"
                class="font-extrabold text-base tracking-tight"
                :class="getLivePnl(closeItem) >= 0 ? 'text-[#2563EB]' : 'text-[#E5484D]'"
              >
                {{ getLivePnl(closeItem) >= 0 ? '+' : '' }}${{ getLivePnl(closeItem).toFixed(2) }}
              </span>
            </div>

            <div class="flex items-center justify-between text-xs text-[#6B7280] dark:text-slate-400 pt-1 border-t border-gray-200/60 dark:border-slate-700">
              <span>Open: {{ formatNum(closeItem.price_open || closeItem.entry_price || closeItem.price) }}</span>
              <span v-if="closeItem._itemType !== 'order'">Current: {{ formatNum(getCurrentPrice(closeItem)) }}</span>
            </div>
          </div>

          <div v-if="closeItem._itemType !== 'order'" class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs font-bold text-[#8C93A3] dark:text-slate-400 uppercase tracking-wider">
              <span>Close Volume (Lots)</span>
              <span class="text-xs font-semibold text-[#2563EB] dark:text-blue-400 cursor-pointer" @click="closeVolume = Number(closeItem.volume || closeItem.lot || 0.01)">Max: {{ closeItem.volume || closeItem.lot || '0.01' }}</span>
            </div>
            <input
              v-model.number="closeVolume"
              type="number"
              step="0.01"
              :max="Number(closeItem.volume || closeItem.lot || 0.01)"
              min="0.01"
              placeholder="Volume to close"
              class="w-full bg-[#F4F5F7] dark:bg-slate-800 text-xs font-bold text-[#0F1424] dark:text-white py-3 px-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 mt-1">
            <button
              type="button"
              @click="isCloseModalOpen = false"
              class="flex-1 py-3 text-xs font-bold text-[#6B7280] dark:text-slate-300 bg-[#F4F5F7] dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Keep Position
            </button>
            <button
              type="button"
              @click="handleConfirmClose"
              :disabled="isClosing"
              class="flex-1 py-3 text-xs font-bold text-white bg-[#E5484D] hover:bg-[#DC2626] rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Loader2 v-if="isClosing" class="w-4 h-4 animate-spin text-white" />
              <span>{{ closeItem._itemType === 'order' ? 'Confirm Cancel' : 'Confirm Close' }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Trade Details & Actions Bottom Sheet Modal (As per design) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isTradeDetailsOpen"
          class="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-xs transition-opacity"
          @click="isTradeDetailsOpen = false"
        />
      </Transition>

      <Transition name="slide-up">
        <div
          v-if="isTradeDetailsOpen && selectedTradeItem"
          class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-[9999] flex flex-col gap-2.5 px-3.5 pb-6 pointer-events-auto"
        >
          <!-- Top Details Card -->
          <div class="bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-md rounded-[24px] p-4.5 shadow-2xl border border-gray-100/90 dark:border-slate-800 flex flex-col gap-2 text-[#0F1424] dark:text-white">
            <!-- Header Line: Symbol + Direction & Lot | Ticket -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-base">
                <span class="text-[#0F1424] dark:text-white font-bold">{{ selectedTradeItem.symbol }}</span>
                <span
                  class="font-semibold tracking-tight text-sm"
                  :class="String(selectedTradeItem.type || selectedTradeItem.action || selectedTradeItem.side || 'BUY').toUpperCase().includes('BUY') ? 'text-[#2563EB]' : 'text-[#E5484D]'"
                >
                  {{ String(selectedTradeItem.type || selectedTradeItem.action || selectedTradeItem.side || 'BUY').toUpperCase().includes('BUY') ? 'buy' : 'sell' }} {{ selectedTradeItem.volume || selectedTradeItem.lot || selectedTradeItem.lots || '0.01' }}
                </span>
              </div>
              <span class="text-xs font-normal text-[#8C93A3] dark:text-slate-400">
                #{{ selectedTradeItem.position_ticket || selectedTradeItem.ticket || selectedTradeItem.id }}
              </span>
            </div>

            <!-- Description Line -->
            <div class="text-xs text-[#8C93A3] dark:text-slate-400 font-normal">
              {{ getSymbolDescription(selectedTradeItem.symbol) }}
            </div>

            <!-- Price & Profit Line -->
            <div class="flex items-baseline justify-between mt-0.5">
              <div class="text-sm font-medium text-[#0F1424] dark:text-white tracking-tight">
                <template v-if="selectedTradeItem._itemType === 'order'">
                  Market &bull; {{ formatNum(selectedTradeItem.price_open || selectedTradeItem.entry_price || selectedTradeItem.price) }}
                </template>
                <template v-else>
                  {{ formatNum(selectedTradeItem.price_open || selectedTradeItem.entry_price || selectedTradeItem.price) }} &rarr; {{ formatNum(getCurrentPrice(selectedTradeItem)) }}
                </template>
              </div>

              <div
                v-if="selectedTradeItem._itemType === 'order'"
                class="font-bold text-lg text-[#2563EB]"
              >
                {{ selectedTradeItem.state_name || selectedTradeItem.state || selectedTradeItem.status || 'Placed' }}
              </div>
              <div
                v-else
                class="font-bold text-xl sm:text-2xl tracking-tight"
                :class="getLivePnl(selectedTradeItem) >= 0 ? 'text-[#2563EB]' : 'text-[#E5484D]'"
              >
                {{ formatPnlNumber(getLivePnl(selectedTradeItem)) }}
              </div>
            </div>

            <!-- Delta / Difference Line (for positions) -->
            <div
              v-if="selectedTradeItem._itemType !== 'order'"
              class="flex items-center gap-1 text-xs font-semibold"
              :class="isPositiveDelta(selectedTradeItem) ? 'text-[#2563EB]' : 'text-[#E5484D]'"
            >
              <span>&Delta; = {{ getPriceDelta(selectedTradeItem) }} ({{ getPriceDeltaPercent(selectedTradeItem) }}%)</span>
              <span class="text-[10px] leading-none">{{ isPositiveDelta(selectedTradeItem) ? '&#9650;' : '&#9660;' }}</span>
            </div>

            <!-- S/L & Swap Row -->
            <div class="flex items-center justify-between text-xs text-[#8C93A3] dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span class="font-medium text-[#8C93A3] dark:text-slate-400">S/L:</span>
                <span class="ml-2 font-semibold text-[#475569] dark:text-slate-300">{{ formatSlTp(selectedTradeItem.sl || selectedTradeItem.price_sl) }}</span>
              </div>
              <div>
                <span class="font-medium text-[#8C93A3] dark:text-slate-400">Swap:</span>
                <span class="ml-2 font-semibold text-[#475569] dark:text-slate-300">{{ formatSwap(selectedTradeItem.swap || selectedTradeItem.storage) }}</span>
              </div>
            </div>

            <!-- T/P & Timestamp Row -->
            <div class="flex items-center justify-between text-xs text-[#8C93A3] dark:text-slate-400">
              <div>
                <span class="font-medium text-[#8C93A3] dark:text-slate-400">T/P:</span>
                <span class="ml-2 font-semibold text-[#475569] dark:text-slate-300">{{ formatSlTp(selectedTradeItem.tp || selectedTradeItem.price_tp) }}</span>
              </div>
              <div class="font-medium text-[#8C93A3] dark:text-slate-400">
                {{ formatDateTime(selectedTradeItem.time || selectedTradeItem.created_at || selectedTradeItem.open_time) }}
              </div>
            </div>
          </div>

          <!-- Bottom Actions Sheet (Clean Vertical Options Stack) -->
          <div class="bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-md rounded-[24px] overflow-hidden shadow-2xl border border-gray-100/90 dark:border-slate-800 flex flex-col divide-y divide-gray-100/70 dark:divide-slate-800">
            <!-- Close Position / Cancel Order Button -->
            <button
              type="button"
              @click="handleActionClose(selectedTradeItem)"
              class="w-full py-3.5 sm:py-4 px-4 text-center text-base font-semibold text-[#E5484D] hover:bg-red-50/40 dark:hover:bg-red-950/30 active:bg-red-50/70 transition-colors cursor-pointer select-none"
            >
              {{ selectedTradeItem._itemType === 'order' ? 'Cancel order' : 'Close position' }}
            </button>

            <!-- Modify Position / Modify Order Button -->
            <button
              type="button"
              @click="handleActionModify(selectedTradeItem)"
              class="w-full py-3.5 sm:py-4 px-4 text-center text-base font-semibold text-[#2563EB] dark:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 active:bg-blue-50/70 transition-colors cursor-pointer select-none"
            >
              {{ selectedTradeItem._itemType === 'order' ? 'Modify order' : 'Modify position' }}
            </button>

            <!-- Chart Button -->
            <button
              type="button"
              @click="handleActionChart(selectedTradeItem)"
              class="w-full py-3.5 sm:py-4 px-4 text-center text-base font-semibold text-[#2563EB] dark:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 active:bg-blue-50/70 transition-colors cursor-pointer select-none"
            >
              Chart
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Mobile Market View Modal -->
    <MobileMarketViewModal
      :isOpen="isMarketModalOpen"
      @close="isMarketModalOpen = false"
      @selectSymbol="handleMarketSymbolSelect"
    />
  </div>
</template>

<style scoped>
/* Custom Button Utilities */
.btn-sell-action {
  background: linear-gradient(135deg, #e5484d 0%, #cc3b40 100%);
  border-radius: 12px 4px 4px 12px;
}
.btn-buy-action {
  background: linear-gradient(135deg, #12a879 0%, #0f946a 100%);
  border-radius: 4px 12px 12px 4px;
}
.font-symbol {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.font-live-price {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.font-tab-active {
  font-weight: 800;
  border-bottom: 2px solid currentColor;
  padding-bottom: 2px;
}
.font-tab-inactive {
  font-weight: 600;
  padding-bottom: 2px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
