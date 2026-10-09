<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-vue-next";
import { useFmFullAnalysisStore } from "@/stores/fm/fullAnalysis";
import { useFmAnalysisStore } from "@/stores/fm/analysis";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useTickerStore } from "@/stores/shared/ticker";
import { subscribeTradeSymbols } from "@/utils/symbolUtils";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import DayTradeDrawer from "./DayTradeDrawer.vue";

const props = defineProps({
  fmId: {
    type: [String, Number],
    default: null,
  },
  isFollowed: {
    type: Boolean,
    default: null,
  },
  followerId: {
    type: [String, Number],
    default: null,
  },
});

const route = useRoute();
const store = useFmFullAnalysisStore();
const analysisStore = useFmAnalysisStore();
const snackbar = useSnackbarStore();
const tickerStore = useTickerStore();

const resolvedFmId = computed(() => props.fmId || route.params.id);
const resolvedIsFollowed = computed(() => {
  if (props.isFollowed !== null) return props.isFollowed;
  return route.query.is_followed === "true";
});
const resolvedFollowerId = computed(() => {
  if (props.followerId !== null) return props.followerId;
  return route.query.follower_id;
});

const activeCurrency = ref(localStorage.getItem("active_currency") || "USD");

const currencySymbol = computed(() => {
  const syms = { USD: "$", USC: "C" };
  return syms[activeCurrency.value?.toUpperCase()] || "$";
});

// ─── Date range (default: 3 months ago → today) ──────────────────────────────
const today = new Date();
const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);

const toDateISO = (d) => {
  if (!d) return "";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDate = ref(toDateISO(threeMonthsAgo));
const toDate = ref(toDateISO(today));

const dateRange = ref({
  start: threeMonthsAgo,
  end: today,
});

const currentDate = ref(new Date(today.getFullYear(), today.getMonth(), 1));
const selectedDay = ref(null);
const isDrawerOpen = ref(false);

// ─── Calendar helpers ─────────────────────────────────────────────────────────
const calendarYear = computed(() => currentDate.value.getFullYear());
const calendarMonth = computed(() => currentDate.value.getMonth());

const calendarMonthLabel = computed(() =>
  new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    currentDate.value,
  ),
);

const daysInMonth = computed(() =>
  new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate(),
);
const firstDayOfMonth = computed(() =>
  new Date(calendarYear.value, calendarMonth.value, 1).getDay(),
);

const calendarGrid = computed(() => {
  const grid = [];
  const totalCells =
    Math.ceil((firstDayOfMonth.value + daysInMonth.value) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDayOfMonth.value + 1;
    if (dayNum < 1 || dayNum > daysInMonth.value) {
      grid.push(null);
    } else {
      const dateStr = `${calendarYear.value}-${String(calendarMonth.value + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      grid.push({ day: dayNum, dateStr });
    }
  }
  return grid;
});

// ─── Nav restrictions ─────────────────────────────────────────────────────────
const fromMonthStart = computed(() => {
  const d = new Date(fromDate.value);
  return new Date(d.getFullYear(), d.getMonth(), 1);
});
const toMonthStart = computed(() => {
  const d = new Date(toDate.value);
  return new Date(d.getFullYear(), d.getMonth(), 1);
});
const canGoPrev = computed(() => currentDate.value > fromMonthStart.value);
const canGoNext = computed(() => currentDate.value < toMonthStart.value);

// ─── Trades mapped by date ────────────────────────────────────────────────────
const tradesByDate = computed(() => {
  const map = {};
  store.trades.forEach((trade) => {
    const rawDate = trade.time || trade.created_at;
    if (!rawDate) return;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return;
    const isUtc =
      typeof rawDate === "string" &&
      (rawDate.includes("GMT") || rawDate.includes("UTC") || rawDate.endsWith("Z"));
    const year = isUtc ? d.getUTCFullYear() : d.getFullYear();
    const month = String((isUtc ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, "0");
    const day = String(isUtc ? d.getUTCDate() : d.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;
    if (!map[key]) map[key] = { trades: [], pnl: 0 };
    map[key].trades.push(trade);
    map[key].pnl += (trade.profit ?? trade.pnl ?? 0);
  });
  return map;
});

const monthlyTotalPnl = computed(() =>
  Object.values(tradesByDate.value).reduce((sum, d) => sum + d.pnl, 0),
);

const selectedDayData = computed(() =>
  selectedDay.value ? tradesByDate.value[selectedDay.value] || null : null,
);

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return "";
  const d = new Date(selectedDay.value);
  if (isNaN(d.getTime())) return selectedDay.value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
});

// ─── Monthly stats ────────────────────────────────────────────────────
const monthStats = computed(() => {
  const days = Object.values(tradesByDate.value);
  const wins = days.filter((d) => d.pnl > 0).length;
  const total = days.length;
  return {
    winDays: wins,
    lossDays: total - wins,
    winRate: total ? Math.round((wins / total) * 100) : 0,
    totalTrades: days.reduce((s, d) => s + d.trades.length, 0),
  };
});

// ─── Data loading ─────────────────────────────────────────────────────────────
const loadDateRange = () => {
  if (!resolvedFmId.value) return;

  const start = new Date(fromDate.value);
  start.setHours(0, 0, 0, 0);
  const end = new Date(toDate.value);
  end.setHours(23, 59, 59, 999);

  store.fetchFmAnalysis(
    resolvedFmId.value,
    fromDate.value,
    toDate.value,
    resolvedIsFollowed.value,
    resolvedFollowerId.value,
  );

  analysisStore.fetchGrowthChart(
    resolvedFmId.value,
    resolvedIsFollowed.value,
    resolvedFollowerId.value,
    fromDate.value,
    toDate.value
  );

  analysisStore.fetchAnalytics(
    resolvedFmId.value,
    resolvedIsFollowed.value,
    resolvedFollowerId.value,
    true, // skipGrowthChart
    fromDate.value,
    toDate.value
  );

  if (currentDate.value < fromMonthStart.value)
    currentDate.value = new Date(fromMonthStart.value);
  if (currentDate.value > toMonthStart.value)
    currentDate.value = new Date(toMonthStart.value);
};

const handleDateRangeApply = (range) => {
  if (Array.isArray(range) && range.length === 2 && range[0] && range[1]) {
    fromDate.value = toDateISO(range[0]);
    toDate.value = toDateISO(range[1]);
  } else if (range && typeof range === "object" && range.start && range.end) {
    fromDate.value = toDateISO(range.start);
    toDate.value = toDateISO(range.end);
  }
  selectedDay.value = null;
  isDrawerOpen.value = false;
  loadDateRange();
};

const handleDateRangeClear = () => {
  fromDate.value = toDateISO(threeMonthsAgo);
  toDate.value = toDateISO(today);
  dateRange.value = {
    start: threeMonthsAgo,
    end: today,
  };
  selectedDay.value = null;
  isDrawerOpen.value = false;
  loadDateRange();
};

const prevMonth = () => {
  if (!canGoPrev.value) return;
  currentDate.value = new Date(calendarYear.value, calendarMonth.value - 1, 1);
  selectedDay.value = null;
  isDrawerOpen.value = false;
};

const nextMonth = () => {
  if (!canGoNext.value) return;
  currentDate.value = new Date(calendarYear.value, calendarMonth.value + 1, 1);
  selectedDay.value = null;
  isDrawerOpen.value = false;
};

const handleDayClick = (cell) => {
  if (!cell) return;
  const dayData = tradesByDate.value[cell.dateStr];
  if (!dayData || !dayData.trades || dayData.trades.length === 0) {
    snackbar.show("No data available for the selected date.", "info");
    return;
  }
  selectedDay.value = cell.dateStr;
  isDrawerOpen.value = true;
};

const closeDrawer = () => {
  isDrawerOpen.value = false;
};

watch(
  () => [resolvedFmId.value, resolvedIsFollowed.value, resolvedFollowerId.value],
  (newVals, oldVals) => {
    if (
      oldVals &&
      (newVals[0] !== oldVals[0] ||
        newVals[1] !== oldVals[1] ||
        newVals[2] !== oldVals[2])
    ) {
      loadDateRange();
    }
  },
);

watch(
  () => store.isFetched,
  (isFetched) => {
    if (isFetched && !store.loading && (!store.trades || store.trades.length === 0)) {
      snackbar.show("No data available for the selected date range.", "info");
    }
  },
);

watch(
  () => store.trades,
  (newTrades) => {
    if (Array.isArray(newTrades) && newTrades.length > 0) {
      subscribeTradeSymbols(newTrades, { onlyOpen: false });
    }
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  loadDateRange();
});
</script>

<template>
  <div class="flex flex-col gap-3 sm:gap-4 w-full">
    <!-- ── 1. Full-Width 4 Metric Cards Row ────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full">
      <!-- Total P&L -->
      <div
        class="bg-card-background rounded-xl p-3 sm:p-3.5 flex flex-col justify-between"
      >
        <span
          class="text-2xs font-semibold text-secondary-text uppercase tracking-wider"
          >Period P&L</span
        >
        <div class="flex items-center gap-1.5 mt-1">
          <component
            :is="monthlyTotalPnl >= 0 ? TrendingUp : TrendingDown"
            class="w-4 h-4 shrink-0"
            :class="
              monthlyTotalPnl >= 0 ? 'text-primary-green' : 'text-primary-red'
            "
          />
          <span
            class="text-base sm:text-lg font-bold tracking-tight truncate"
            :class="
              monthlyTotalPnl >= 0 ? 'text-primary-green' : 'text-primary-red'
            "
          >
            {{ monthlyTotalPnl >= 0 ? "+" : "" }}{{ currencySymbol
            }}{{ monthlyTotalPnl.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- Win Rate -->
      <div
        class="bg-card-background rounded-xl p-3 sm:p-3.5 flex flex-col justify-between"
      >
        <span
          class="text-2xs font-semibold text-secondary-text uppercase tracking-wider"
          >Win Rate</span
        >
        <div class="flex items-center gap-1.5 mt-1">
          <span
            class="text-base sm:text-lg font-bold tracking-tight text-primary-text truncate"
            >{{ monthStats.winRate }}%</span
          >
        </div>
      </div>

      <!-- Winning Days -->
      <div
        class="bg-card-background rounded-xl p-3 sm:p-3.5 flex flex-col justify-between"
      >
        <span
          class="text-2xs font-semibold text-secondary-text uppercase tracking-wider"
          >Winning Days</span
        >
        <div class="flex items-baseline gap-1 mt-1 truncate">
          <span
            class="text-base sm:text-lg font-bold tracking-tight text-primary-green"
            >{{ monthStats.winDays }}</span
          >
          <span class="text-xs text-secondary-text"
            >/ {{ monthStats.winDays + monthStats.lossDays }} days</span
          >
        </div>
      </div>

      <!-- Total Trades -->
      <div
        class="bg-card-background rounded-xl p-3 sm:p-3.5 flex flex-col justify-between"
      >
        <span
          class="text-2xs font-semibold text-secondary-text uppercase tracking-wider"
          >Total Trades</span
        >
        <div class="flex items-center mt-1">
          <span
            class="text-base sm:text-lg font-bold tracking-tight text-primary-text truncate"
            >{{ monthStats.totalTrades }}</span
          >
        </div>
      </div>
    </div>

    <!-- ── 2. Filters & Header Row Below Cards ──────────────────────────── -->
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full"
    >
      <h3 class="text-base sm:text-lg font-bold text-primary-text">
        Monthly Analytics
      </h3>

      <div
        class="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto"
      >
        <!-- Month switcher -->
        <div
          class="flex items-center gap-1 bg-card-background rounded-xl px-2.5 py-1.5"
        >
          <button
            @click="prevMonth"
            :disabled="!canGoPrev"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-secondary-text hover:bg-background hover:text-primary-text transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span
            class="text-xs text-primary-text font-semibold px-2 text-center whitespace-nowrap"
            >{{ calendarMonthLabel }}</span
          >
          <button
            @click="nextMonth"
            :disabled="!canGoNext"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-secondary-text hover:bg-background hover:text-primary-text transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- BaseDateRangePicker -->
        <div class="w-full sm:w-auto min-w-50 sm:min-w-60">
          <BaseDateRangePicker
            v-model="dateRange"
            class="w-full"
            placement="bottom-end"
            @apply="handleDateRangeApply"
            @clear="handleDateRangeClear"
          />
        </div>
      </div>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────── -->
    <div
      v-if="store.loading"
      class="flex flex-col items-center justify-center h-64 gap-3 text-secondary-text bg-card-background rounded-2xl"
    >
      <div
        class="w-8 h-8 border-2 border-primary-border border-t-primary rounded-full animate-spin"
      ></div>
      <p class="text-xs font-medium">Loading trading calendar…</p>
    </div>

    <template v-else>
      <!-- ── Calendar Grid ────────────────────────────────────────────── -->
      <div
        class="bg-card-background rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-x-auto"
      >
        <div class="min-w-135 md:min-w-0">
          <!-- Day labels -->
          <div class="grid grid-cols-7 mb-2 sm:mb-3">
            <div
              v-for="d in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
              :key="d"
              class="text-center text-2xs font-bold text-secondary-text uppercase tracking-wider py-1"
            >
              {{ d }}
            </div>
          </div>

          <!-- Grid cells -->
          <div class="grid grid-cols-7 gap-1 sm:gap-1.5">
            <div
              v-for="(cell, idx) in calendarGrid"
              :key="idx"
              class="relative rounded-xl min-h-16 sm:min-h-20 md:min-h-22 transition-all duration-150 select-none group"
              :class="[
                !cell ? 'bg-transparent' : 'cursor-pointer',
                cell && !tradesByDate[cell.dateStr]
                  ? 'bg-background hover:bg-primary-border/20 border border-transparent'
                  : '',
                cell && tradesByDate[cell.dateStr]?.pnl > 0
                  ? 'bg-primary-green/10 hover:bg-primary-green/20 border border-primary-green/20 hover:border-primary-green/40 shadow-xs'
                  : '',
                cell && tradesByDate[cell.dateStr]?.pnl < 0
                  ? 'bg-primary-red/10 hover:bg-primary-red/20 border border-primary-red/20 hover:border-primary-red/40 shadow-xs'
                  : '',
                cell && tradesByDate[cell.dateStr]?.pnl === 0
                  ? 'bg-background hover:bg-primary-border/20'
                  : '',
                cell && selectedDay === cell.dateStr && isDrawerOpen
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-card-background'
                  : '',
              ]"
              @click="handleDayClick(cell)"
            >
              <template v-if="cell">
                <!-- Day number -->
                <span
                  class="absolute top-1.5 sm:top-2 left-2 sm:left-2.5 text-2xs sm:text-[11px] font-semibold transition-colors"
                  :class="
                    tradesByDate[cell.dateStr]
                      ? tradesByDate[cell.dateStr].pnl >= 0
                        ? 'text-primary-green font-bold'
                        : 'text-primary-red font-bold'
                      : 'text-secondary-text'
                  "
                  >{{ cell.day }}</span
                >

                <!-- Indicator dot -->
                <span
                  v-if="tradesByDate[cell.dateStr]"
                  class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                  :class="
                    tradesByDate[cell.dateStr].pnl >= 0
                      ? 'bg-primary-green'
                      : 'bg-primary-red'
                  "
                />

                <!-- Trade data -->
                <div
                  v-if="tradesByDate[cell.dateStr]"
                  class="flex flex-col justify-end h-full px-1.5 sm:px-2 pb-1.5 sm:pb-2 pt-6 sm:pt-7"
                >
                  <p
                    class="text-[11px] sm:text-xs font-bold leading-tight truncate"
                    :class="
                      tradesByDate[cell.dateStr].pnl >= 0
                        ? 'text-primary-green'
                        : 'text-primary-red'
                    "
                  >
                    {{ tradesByDate[cell.dateStr].pnl >= 0 ? "+" : ""
                    }}{{ currencySymbol
                    }}{{ tradesByDate[cell.dateStr].pnl.toFixed(2) }}
                  </p>
                  <p
                    class="text-3xs sm:text-2xs text-secondary-text mt-0.5 font-medium truncate"
                  >
                    {{ tradesByDate[cell.dateStr].trades.length }} trade{{
                      tradesByDate[cell.dateStr].trades.length !== 1 ? "s" : ""
                    }}
                  </p>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty state ────────────────────────────────────────────── -->
      <div
        v-if="!store.loading && !Object.keys(tradesByDate).length"
        class="flex flex-col items-center justify-center h-44 gap-3 bg-card-background rounded-2xl"
      >
        <div
          class="w-10 h-10 rounded-2xl bg-background flex items-center justify-center"
        >
          <Activity class="w-5 h-5 text-secondary-text opacity-40" />
        </div>
        <div class="text-center">
          <p class="text-primary-text text-sm font-semibold">No trade records found</p>
          <p class="text-secondary-text text-xs mt-0.5">
            Try selecting a wider date range above
          </p>
        </div>
      </div>
    </template>

    <!-- ── Slide-Over Side Drawer for Selected Day ──────────────────── -->
    <DayTradeDrawer
      :open="isDrawerOpen"
      :date-str="selectedDay"
      :date-label="selectedDayLabel"
      :day-data="selectedDayData"
      :currency-symbol="currencySymbol"
      @close="closeDrawer"
    />
  </div>
</template>
