<template>
  <div class="space-y-6 min-h-screen">
    <!-- Summary Metric Cards (5 Cards) -->
    <div id="tour-fm-tradebooks-metrics" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Loading Skeleton -->
      <template v-if="store.isLoading">
        <div
          v-for="n in 5"
          :key="n"
          class="bg-card-background border border-primary-border/40 rounded-2xl p-4 animate-pulse space-y-3"
        >
          <div class="h-3 w-20 bg-primary-border/40 rounded" />
          <div class="h-7 w-28 bg-primary-border/40 rounded" />
        </div>
      </template>

      <template v-else>
        <!-- Total Trades -->
        <div
          class="bg-card-background border border-primary-border/40 rounded-2xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="text-[11px] font-bold uppercase tracking-wider text-secondary-text truncate"
                >Total Trades</span
              >
              <Tooltip text="Total number of master trades executed by fund manager" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <span class="material-symbols-outlined text-primary text-lg select-none">analytics</span>
          </div>
          <p class="text-2xl font-bold text-primary-text mt-2 font-mono tabular-nums">
            {{ store.summary.total_trades || 0 }}
          </p>
        </div>

        <!-- Open Trades -->
        <div
          class="bg-card-background border border-primary-border/40 rounded-2xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="text-[11px] font-bold uppercase tracking-wider text-secondary-text truncate"
                >Open Trades</span
              >
              <Tooltip text="Currently active open master positions" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <span class="material-symbols-outlined text-amber-500 text-lg select-none">schedule</span>
          </div>
          <p class="text-2xl font-bold text-amber-500 mt-2 font-mono tabular-nums">
            {{ store.summary.open_trades || 0 }}
          </p>
        </div>

        <!-- Closed Trades -->
        <div
          class="bg-card-background border border-primary-border/40 rounded-2xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="text-[11px] font-bold uppercase tracking-wider text-secondary-text truncate"
                >Closed Trades</span
              >
              <Tooltip text="Historical closed master positions" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <span class="material-symbols-outlined text-emerald-500 text-lg select-none">check_circle</span>
          </div>
          <p class="text-2xl font-bold text-primary-text mt-2 font-mono tabular-nums">
            {{ store.summary.closed_trades || 0 }}
          </p>
        </div>

        <!-- Total Volume -->
        <div
          class="bg-card-background border border-primary-border/40 rounded-2xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="text-[11px] font-bold uppercase tracking-wider text-secondary-text truncate"
                >Total Volume</span
              >
              <Tooltip text="Cumulative traded volume in standard lots" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <span class="material-symbols-outlined text-primary text-lg select-none">payments</span>
          </div>
          <p class="text-2xl font-bold text-primary-text mt-2 font-mono tabular-nums">
            {{ formatLot(store.summary.total_lot) }}
            <span class="text-xs font-normal text-secondary-text ml-1">Lots</span>
          </p>
        </div>

        <!-- Total PnL -->
        <div
          class="bg-card-background border border-primary-border/40 rounded-2xl p-4 flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="text-[11px] font-bold uppercase tracking-wider text-secondary-text truncate"
                >Total PnL</span
              >
              <Tooltip text="Total net profit and loss generated across all trades" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <span
              v-if="(store.summary.total_pnl || 0) >= 0"
              class="material-symbols-outlined text-emerald-500 text-lg select-none"
            >trending_up</span>
            <span
              v-else
              class="material-symbols-outlined text-rose-500 text-lg select-none"
            >trending_down</span>
          </div>
          <p
            class="text-2xl font-bold mt-2 font-mono tabular-nums"
            :class="
              (store.summary.total_pnl || 0) >= 0
                ? 'text-emerald-500'
                : 'text-rose-500'
            "
          >
            {{
              formatPnl(
                store.summary.total_pnl,
                store.summary.broker_currency ||
                  (store.trades[0] && store.trades[0].broker_currency)
              )
            }}
          </p>
        </div>
      </template>
    </div>

    <!-- Filters Row -->
    <div id="tour-fm-tradebooks-filters" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search Input -->
        <BaseSearch
          :model-value="searchInput"
          placeholder="Search symbols, accounts..."
          container-class="w-full sm:w-64"
          @update:modelValue="handleSearch"
        />

        <!-- Status Filter -->
        <div class="w-36">
          <BaseSelect
            :model-value="store.filters.status"
            :options="STATUS_OPTIONS"
            borderless
            rounded="full"
            @update:model-value="store.setStatusFilter"
          />
        </div>

        <!-- Type Filter -->
        <div class="w-32">
          <BaseSelect
            :model-value="store.filters.type"
            :options="TYPE_OPTIONS"
            borderless
            rounded="full"
            @update:model-value="store.setTypeFilter"
          />
        </div>

        <!-- Date Range Picker -->
        <BaseDateRangePicker
          class="w-fit"
          borderless
          placement="right"
          v-model="dateRange"
          @apply="handleDateApply"
          @clear="handleDateClear"
        />

        <!-- Reset Button -->
        <button
          v-if="hasActiveFilters"
          type="button"
          @click="handleResetFilters"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full text-secondary-text hover:text-primary-text bg-card-background border border-primary-border transition-colors cursor-pointer"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <RefreshButton
          :loading="store.isRefreshing || store.isLoading"
          title="Refresh"
          :icon-size="16"
          button-class="w-9 h-9"
          @click="store.fetchMasterTrades(true)"
        />
      </div>
    </div>

    <!-- Master Trades Table -->
    <div id="tour-fm-tradebooks-table" class="bg-card-background border-0 shadow-none rounded-2xl overflow-hidden">
      <WatchDataTable
        :show-tabs="false"
        :columns="columns"
        :rows="store.trades"
        :loading="store.isLoading"
        :total-items="store.pagination.total_items"
        row-key="id"
        :page="store.pagination.page"
        :total-pages="store.pagination.total_pages"
        empty-text="No master trades found."
        @update:page="store.setPage"
      >
        <!-- Position ID Cell -->
        <template #cell-positionId="{ row }">
          <span class="font-bold text-primary-text font-mono">
            #{{ row.mt5_position_id || row.id }}
          </span>
        </template>

        <!-- Account Cell -->
        <template #cell-account="{ row }">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-primary-text">{{ row.account_number || "-" }}</span>
            <span
              v-if="row.broker_currency"
              class="text-2xs font-semibold px-1.5 py-0.5 rounded border uppercase"
              :class="
                row.broker_currency?.toUpperCase() === 'USC'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-primary-blue/10 text-primary-blue border-primary-blue/20'
              "
            >
              {{ row.broker_currency }}
            </span>
          </div>
        </template>

        <!-- Symbol Cell -->
        <template #cell-symbol="{ row }">
          <span class="font-bold text-primary-text">{{ row.symbol || "—" }}</span>
        </template>

        <!-- Type Cell -->
        <template #cell-type="{ row }">
          <span
            class="text-2xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border"
            :class="
              (row.type || row.order_type) === 'BUY'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            "
          >
            {{ row.type || row.order_type || "—" }}
          </span>
        </template>

        <!-- Status Cell -->
        <template #cell-status="{ row }">
          <span
            class="text-2xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border"
            :class="
              row.status === 'OPEN'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            "
          >
            {{ row.status || "CLOSED" }}
          </span>
        </template>

        <!-- Volume Cell -->
        <template #cell-volume="{ row }">
          <span class="font-semibold font-mono tabular-nums text-primary-text">
            {{ formatLot(row.lot || row.quantity || row.volume) }}
          </span>
        </template>

        <!-- Entry Price Cell -->
        <template #cell-entryPrice="{ row }">
          <span class="font-semibold font-mono tabular-nums text-primary-text">
            {{ formatPrice(row.entry_price || row.open_price) }}
          </span>
        </template>

        <!-- Exit Price Cell -->
        <template #cell-exitPrice="{ row }">
          <span class="font-semibold font-mono tabular-nums text-primary-text">
            {{ formatPrice(row.exit_price || row.close_price) }}
          </span>
        </template>

        <!-- PnL Cell -->
        <template #cell-pnl="{ row }">
          <span
            class="font-bold font-mono tabular-nums"
            :class="
              Number(getTradePnl(row)) >= 0
                ? 'text-emerald-500'
                : 'text-rose-500'
            "
          >
            {{ formatPnl(getTradePnl(row), row.broker_currency) }}
          </span>
        </template>

        <!-- Opened At Cell -->
        <template #cell-openedAt="{ row }">
          <span class="text-xs text-secondary-text font-mono">
            {{ formatDateVal(row.created_at || row.open_time || row.opened_at) }}
          </span>
        </template>

        <!-- Closed At Cell -->
        <template #cell-closedAt="{ row }">
          <span class="text-xs text-secondary-text font-mono">
            {{ formatDateVal(row.close_time || row.closed_at) }}
          </span>
        </template>
      </WatchDataTable>
    </div>

    <!-- Disclaimer -->
    <AccountsDisclaimer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { RotateCcw, Info } from "lucide-vue-next";
import RefreshButton from "@/components/base/RefreshButton.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";

import {
  useFmTradeBookStore,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from "@/stores/fm/tradeBook";
import { livePNL } from "@/utils/livePNL.js";
import { subscribeTradeSymbols } from "@/utils/symbolUtils.js";

const store = useFmTradeBookStore();

const searchInput = ref("");
const dateRange = ref(null);

const columns = [
  { key: "positionId", label: "Position ID", headerClass: "pl-6 sm:pl-8", cellClass: "pl-6 sm:pl-8" },
  { key: "account", label: "Account" },
  { key: "symbol", label: "Symbol" },
  { key: "type", label: "Type", align: "center" },
  { key: "status", label: "Status", align: "center" },
  { key: "volume", label: "Volume", align: "right" },
  { key: "entryPrice", label: "Entry Price", align: "right" },
  { key: "exitPrice", label: "Exit Price", align: "right" },
  { key: "pnl", label: "PnL", align: "right" },
  { key: "openedAt", label: "Opened At", align: "right" },
  { key: "closedAt", label: "Closed At", align: "right", headerClass: "pr-6 sm:pr-8", cellClass: "pr-6 sm:pr-8" },
];

const hasActiveFilters = computed(() => {
  return (
    store.filters.search !== "" ||
    store.filters.status !== "" ||
    store.filters.type !== "" ||
    store.filters.from_date !== "" ||
    store.filters.to_date !== "" ||
    dateRange.value !== null
  );
});

function handleSearch(val) {
  searchInput.value = val;
  store.setSearch(val);
}

function formatDateToYYYYMMDD(val) {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function handleDateApply(val) {
  if (Array.isArray(val) && val.length === 2 && val[0] && val[1]) {
    store.setDateFilter(formatDateToYYYYMMDD(val[0]), formatDateToYYYYMMDD(val[1]));
  } else if (val && typeof val === "object" && val.start && val.end) {
    store.setDateFilter(formatDateToYYYYMMDD(val.start), formatDateToYYYYMMDD(val.end));
  } else {
    store.setDateFilter("", "");
  }
}

function handleDateClear() {
  dateRange.value = null;
  store.setDateFilter("", "");
}

function handleResetFilters() {
  searchInput.value = "";
  dateRange.value = null;
  store.resetFilters();
}

function formatPrice(val) {
  if (val === null || val === undefined || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return "-";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  });
}

function formatLot(val) {
  if (val === null || val === undefined) return "0.00";
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function getCurrencySymbol(currency) {
  const c = String(currency || "").toUpperCase();
  return c === "USC" || c === "CENT" ? "C" : "$";
}

function formatPnl(val, currency = "USD") {
  if (val === null || val === undefined || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return "-";
  const sym = getCurrencySymbol(currency);
  const prefix = num >= 0 ? `+${sym}` : `-${sym}`;
  return `${prefix}${Math.abs(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getTradePnl(trade) {
  return livePNL(trade);
}

function formatDateVal(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
}

watch(
  () => store.trades,
  (newTrades) => {
    if (newTrades && newTrades.length > 0) {
      subscribeTradeSymbols(newTrades, { onlyOpen: false });
    }
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  store.fetchMasterTrades();
});
</script>
