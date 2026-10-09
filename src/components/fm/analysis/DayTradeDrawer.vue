<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-vue-next";
import DayPnlChart from "./DayPnlChart.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import AccountFilterTabs from "@/components/client/accounts/AccountFilterTabs.vue";
import { livePNL } from "@/utils/livePNL";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  dateStr: {
    type: String,
    default: "",
  },
  dateLabel: {
    type: String,
    default: "",
  },
  dayData: {
    type: Object,
    default: null,
  },
  currencySymbol: {
    type: String,
    default: "$",
  },
});

const emit = defineEmits(["close"]);

const statusFilter = ref("all");

// Reset filter on open
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      statusFilter.value = "all";
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },
);

// Keydown ESC listener
const handleKeyDown = (e) => {
  if (e.key === "Escape" && props.open) {
    emit("close");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  document.body.style.overflow = "";
});

const allTrades = computed(() => props.dayData?.trades || []);

const isOpenTrade = (trade) =>
  String(trade?.status ?? "").toUpperCase() === "OPEN";

const pnlValue = (trade) => {
  const raw = isOpenTrade(trade) ? livePNL(trade) : (trade?.profit ?? trade?.pnl);
  const val = Number(raw);
  return Number.isFinite(val) ? val : 0;
};

const formatNum = (val, digits = 2) =>
  (val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });



// Filtered trades
const filteredTrades = computed(() => {
  if (statusFilter.value === "all") return allTrades.value;
  return allTrades.value.filter((trade) => {
    const s = String(trade.status || "").toLowerCase();
    return s === statusFilter.value;
  });
});

const counts = computed(() => {
  const all = allTrades.value.length;
  const open = allTrades.value.filter((t) => isOpenTrade(t)).length;
  const closed = allTrades.value.filter(
    (t) => String(t.status || "").toLowerCase() === "closed",
  ).length;
  return { all, open, closed };
});

const filterTabs = computed(() => [
  { label: "All", value: "all", count: counts.value.all },
  { label: "Open", value: "open", count: counts.value.open },
  { label: "Closed", value: "closed", count: counts.value.closed },
]);

// DataTable Columns Definition matching theme
const columns = [
  { key: "symbol", label: "Symbol" },
  { key: "account", label: "Account No." },
  { key: "side", label: "Side", align: "center" },
  { key: "lot", label: "Volume", align: "right" },
  { key: "pnl", label: "P&L", align: "right" },
  { key: "entry", label: "Entry Price / Time" },
  { key: "exit", label: "Exit Price / Time" },
  { key: "status", label: "Status", align: "center" },
  { key: "ticket", label: "Ticket", align: "right" },
];

// Day-level summary statistics
const dayStats = computed(() => {
  const trades = allTrades.value;
  if (!trades.length) {
    return {
      totalPnl: 0,
      totalVolume: 0,
      winTrades: 0,
      lossTrades: 0,
      winRate: 0,
      bestTrade: 0,
      worstTrade: 0,
      avgPnl: 0,
    };
  }

  let totalPnl = 0;
  let totalVolume = 0;
  let winTrades = 0;
  let bestTrade = -Infinity;
  let worstTrade = Infinity;

  trades.forEach((trade) => {
    const pnl = pnlValue(trade);
    totalPnl += pnl;
    totalVolume += Number(trade.lot || 0);

    if (pnl > 0) winTrades++;
    if (pnl > bestTrade) bestTrade = pnl;
    if (pnl < worstTrade) worstTrade = pnl;
  });

  const total = trades.length;
  const winRate = total ? Math.round((winTrades / total) * 100) : 0;
  const avgPnl = total ? totalPnl / total : 0;

  return {
    totalPnl,
    totalVolume: Number(totalVolume.toFixed(2)),
    winTrades,
    lossTrades: total - winTrades,
    winRate,
    bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
    worstTrade: worstTrade === Infinity ? 0 : worstTrade,
    avgPnl,
  };
});

const formattedLongDate = computed(() => {
  if (!props.dateStr) return props.dateLabel || "Selected Day";
  const d = new Date(props.dateStr);
  if (isNaN(d.getTime())) return props.dateLabel || props.dateStr;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
});
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop Overlay -->
    <transition name="drawer-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs transition-opacity"
        @click="$emit('close')"
      />
    </transition>

    <!-- Side Panel Drawer -->
    <transition name="drawer-slide">
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 z-101 flex w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl 2xl:max-w-6xl flex-col bg-card-background border-l border-primary-border shadow-2xl overflow-hidden font-sans"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <!-- ── Drawer Sticky Header ──────────────────────────────────────── -->
        <div
          class="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-primary-border bg-card-background/95 backdrop-blur-md sticky top-0 z-20 shrink-0"
        >
          <div class="flex items-center gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-primary-text font-bold text-base sm:text-lg tracking-tight">
                  {{ formattedLongDate }}
                </h3>
                <span
                  class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-background border border-primary-border text-secondary-text"
                >
                  {{ counts.all }} {{ counts.all === 1 ? "trade" : "trades" }}
                </span>
              </div>
              <p class="text-secondary-text text-xs mt-0.5">
                Detailed day trade analysis & execution history
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Close Button -->
            <button
              @click="$emit('close')"
              class="w-8 h-8 rounded-lg flex items-center justify-center bg-background border border-primary-border text-secondary-text hover:text-primary-text hover:bg-primary-border/20 transition-all cursor-pointer"
              aria-label="Close panel"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- ── Drawer Scrollable Body ───────────────────────────────────── -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <!-- ── Quick Metrics Grid ──────────────────────────────────────── -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <!-- Total PnL -->
            <div
              class="bg-background  rounded-xl p-3 sm:p-3.5 flex flex-col justify-between"
            >
              <span class="text-2xs font-semibold text-secondary-text uppercase tracking-wider">
                Daily Net P&L
              </span>
              <p
                class="text-base sm:text-lg font-bold mt-1 font-mono tracking-tight tabular-nums"
                :class="
                  dayStats.totalPnl >= 0 ? 'text-primary-green' : 'text-primary-red'
                "
              >
                {{ dayStats.totalPnl >= 0 ? "+" : "" }}{{ currencySymbol }}{{ formatNum(dayStats.totalPnl) }}
              </p>
            </div>

            <!-- Win Rate -->
            <div
              class="bg-background  rounded-xl p-3 sm:p-3.5 flex flex-col justify-between"
            >
              <div class="flex items-center justify-between">
                <span class="text-2xs font-semibold text-secondary-text uppercase tracking-wider">
                  Win Rate
                </span>
                <span class="text-2xs font-mono text-secondary-text">
                  {{ dayStats.winTrades }}/{{ counts.all }}
                </span>
              </div>
              <div class="mt-1">
                <p class="text-base sm:text-lg font-bold text-primary-text font-mono tracking-tight">
                  {{ dayStats.winRate }}%
                </p>
                <div class="w-full h-1 bg-card-background rounded-full overflow-hidden mt-1">
                  <div
                    class="h-full bg-primary-green rounded-full transition-all duration-300"
                    :style="{ width: dayStats.winRate + '%' }"
                  />
                </div>
              </div>
            </div>

            <!-- Total Volume -->
            <div
              class="bg-background  rounded-xl p-3 sm:p-3.5 flex flex-col justify-between"
            >
              <span class="text-2xs font-semibold text-secondary-text uppercase tracking-wider">
                Total Volume
              </span>
              <p class="text-base sm:text-lg font-bold text-primary-text font-mono mt-1 tracking-tight">
                {{ dayStats.totalVolume }} <span class="text-xs font-normal text-secondary-text">Lots</span>
              </p>
            </div>

            <!-- Best Trade -->
            <div
              class="bg-background  rounded-xl p-3 sm:p-3.5 flex flex-col justify-between"
            >
              <span class="text-2xs font-semibold text-secondary-text uppercase tracking-wider">
                Best Trade
              </span>
              <p class="text-base sm:text-lg font-bold text-primary-green font-mono mt-1 tracking-tight tabular-nums">
                +{{ currencySymbol }}{{ formatNum(dayStats.bestTrade) }}
              </p>
            </div>
          </div>

          <!-- ── PnL Progression Chart Section ───────────────────────────── -->
          <div
            class="bg-background  rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 class="text-base sm:text-lg font-bold text-primary-text">
                  Day P&L Progression
                </h4>
                <p class="text-xs text-secondary-text mt-0.5 font-medium">
                  Cumulative profit & loss curve across executed trades
                </p>
              </div>

              <div class="flex items-center gap-2 text-[11px] font-medium text-secondary-text font-mono">
                <span class="inline-block w-2.5 h-2.5 rounded-full" :class="dayStats.totalPnl >= 0 ? 'bg-primary-green' : 'bg-primary-red'"></span>
                <span>Cumulative Curve</span>
              </div>
            </div>

            <!-- Chart Canvas Container -->
            <div class="w-full pt-2">
              <DayPnlChart
                :trades="allTrades"
                :currency-symbol="currencySymbol"
              />
            </div>
          </div>

          <!-- ── Trades Section Header & Detached Filter Tabs ───────────── -->
          <div
            class="flex items-center justify-between gap-3 pt-1"
          >
            <h4 class="text-base sm:text-lg font-bold text-primary-text">
              Trades History
            </h4>

            <!-- AccountFilterTabs component -->
            <AccountFilterTabs
              :model-value="statusFilter"
              :tabs="filterTabs"
              bordered
              @update:model-value="statusFilter = $event"
            />
          </div>

          <!-- ── Trades Table Section ────────────────────────────────────── -->
          <div
            class="bg-background  rounded-2xl overflow-hidden shadow-xs"
          >
            <!-- DataTable Component -->
            <div class="overflow-x-auto">
              <DataTable
                :columns="columns"
                :rows="filteredTrades"
                row-key="trade_id"
                empty-text="No trades match this filter"
                empty-subtitle="Try switching to another status tab."
                :show-summary="false"
              >
                <!-- Symbol -->
                <template #cell-symbol="{ row }">
                  <span class="text-xs font-semibold text-primary-text">{{ row.symbol }}</span>
                </template>

                <!-- Account -->
                <template #cell-account="{ row }">
                  <span class="text-xs font-medium text-secondary-text">
                    {{ row.account_number || "-" }}
                  </span>
                </template>

                <!-- Side -->
                <template #cell-side="{ row }">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                    :class="
                      (row.side || row.type || '').toLowerCase() === 'buy'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    "
                  >
                    {{ row.side || row.type }}
                  </span>
                </template>

                <!-- Volume / Lot -->
                <template #cell-lot="{ row }">
                  <span class="text-xs font-semibold text-primary-text">{{ row.lot }}</span>
                </template>

                <!-- P&L -->
                <template #cell-pnl="{ row }">
                  <span
                    class="text-xs font-semibold tabular-nums"
                    :class="{
                      'text-primary-green': pnlValue(row) > 0,
                      'text-primary-red': pnlValue(row) < 0,
                      'text-secondary-text': pnlValue(row) === 0,
                    }"
                  >
                    {{ pnlValue(row) >= 0 ? "+" : "" }}{{ currencySymbol }}{{ formatNum(pnlValue(row)) }}
                  </span>
                </template>

                <!-- Entry Price & Time -->
                <template #cell-entry="{ row }">
                  <div class="text-xs font-medium">
                    <div class="text-primary-text font-semibold">{{ row.entry_price != null ? row.entry_price : "-" }}</div>
                    <div class="text-[10px] text-secondary-text whitespace-nowrap">{{ row.created_at || row.time || "-" }}</div>
                  </div>
                </template>

                <!-- Exit Price & Time -->
                <template #cell-exit="{ row }">
                  <div class="text-xs font-medium">
                    <div class="text-primary-text font-semibold">
                      {{
                        row.status?.toLowerCase() === "open"
                          ? "-"
                          : row.exit_price != null
                            ? row.exit_price
                            : "-"
                      }}
                    </div>
                    <div class="text-[10px] text-secondary-text whitespace-nowrap">
                      {{
                        row.status?.toLowerCase() === "open"
                          ? "-"
                          : (row.closed_at || "-")
                      }}
                    </div>
                  </div>
                </template>

                <!-- Status -->
                <template #cell-status="{ row }">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                    :class="
                      row.status?.toLowerCase() === 'open'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-card-background text-secondary-text border border-primary-border/50'
                    "
                  >
                    {{ row.status || 'CLOSED' }}
                  </span>
                </template>

                <!-- Ticket -->
                <template #cell-ticket="{ row }">
                  <span class="text-xs font-medium text-secondary-text">
                    #{{ row.ticket || row.trade_id || row.external_id || "-" }}
                  </span>
                </template>
              </DataTable>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease-out;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-slide-leave-active {
  transition: transform 0.2s cubic-bezier(0.7, 0, 0.84, 0);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
