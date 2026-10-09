<script setup>
import { computed, ref, watch, nextTick } from "vue";
import { X, Search, Filter } from "lucide-vue-next";
import totalIcon from "@/assets/tickets/total.svg";
import openIcon from "@/assets/tickets/open.svg";
import solvedIcon from "@/assets/tickets/solved.svg";
import DataTable from "@/components/base/datatable/DataTable.vue";
import Pagination from "@/components/base/Pagination.vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import Tooltip from "@/components/base/Tooltip.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  account: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);
const snackbar = useSnackbarStore();

const isLoading = ref(false);
const trades = ref([]);
const summary = ref({
  total_trades: 0,
  total_pnl: 0,
  total_lots: 0,
});
const pagination = ref({
  page: 1,
  per_page: 10,
  total_items: 0,
  total_pages: 1,
});

// Filters
const selectedType = ref("all");
const selectedSide = ref("all");
const dateRange = ref({ start: null, end: null });

const typeOptions = [
  { label: "All Types", value: "all" },
  { label: "Buy", value: "BUY" },
  { label: "Sell", value: "SELL" },
];

const sideOptions = [
  { label: "All Sides", value: "all" },
  { label: "Open", value: "OPEN" },
  { label: "Closed", value: "CLOSED" },
];

const fetchTrades = async (page = 1) => {
  if (!props.account?.id) return;
  isLoading.value = true;
  
  try {
    const params = {
      page,
      per_page: pagination.value.per_page,
    };
    
    if (selectedType.value !== "all") params.type = selectedType.value;
    if (selectedSide.value !== "all") params.side = selectedSide.value;
    const formatDateParam = (d) => {
      if (!d) return null;
      if (typeof d === "string") return d.split("T")[0];
      if (d instanceof Date) return d.toISOString().split("T")[0];
      return String(d).split("T")[0];
    };

    if (dateRange.value.start) params.from_date = formatDateParam(dateRange.value.start);
    if (dateRange.value.end) params.to_date = formatDateParam(dateRange.value.end);

    const res = await apiRequest(urls.KEYS.GET, urls.ib.accountTrades(props.account.id), { params });
    
    if (res?.status === "success") {
      trades.value = res.data || [];
      if (res.summary) summary.value = res.summary;
      if (res.pagination) pagination.value = res.pagination;
    }
  } catch (error) {
    console.error("Failed to load trades:", error);
    snackbar.show("Failed to load trades", "error");
    trades.value = [];
  } finally {
    isLoading.value = false;
  }
};

let isResettingFilters = false;

watch(() => props.open, async (isOpen) => {
  if (isOpen && props.account) {
    isResettingFilters = true;
    selectedType.value = "all";
    selectedSide.value = "all";
    dateRange.value = { start: null, end: null };
    
    await nextTick();
    isResettingFilters = false;
    fetchTrades(1);
  } else {
    trades.value = [];
  }
});

watch([selectedType, selectedSide, dateRange], () => {
  if (props.open && !isResettingFilters) fetchTrades(1);
}, { deep: true });

const onPageChange = (newPage) => {
  fetchTrades(newPage);
};

const formatNum = (val) => {
  if (val === null || val === undefined) return "0.00";
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const tradeColumns = [
  { key: "trade_id", label: "ID" },
  { key: "symbol", label: "SYMBOL" },
  { key: "type", label: "TYPE" },
  { key: "lot", label: "LOT", align: "right" },
  { key: "prices", label: "ENTRY / EXIT", align: "right" },
  { key: "dates", label: "OPENED / CLOSED" },
  { key: "pnl", label: "PNL", align: "right" },
];
</script>

<template>
  <Transition name="drawer">
    <div
      v-if="open"
      class="fixed inset-0 z-50 overflow-hidden flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        @click="emit('close')"
      />

      <!-- Drawer Panel -->
      <div
        class="relative w-full max-w-3xl bg-card-background border-l border-primary-border text-primary-text h-full flex flex-col z-10 no-scrollbar transition-colors shadow-2xl"
      >
        <!-- Header -->
        <div
          class="shrink-0 z-20 bg-card-background/95 backdrop-blur-md border-b border-primary-border px-5 py-4 flex flex-col gap-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold text-primary-text truncate">
                    Account Trades
                  </h3>
                  <span
                    class="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    Account #{{ account?.account_number || account?.id }}
                  </span>
                </div>
                <p class="text-xs text-secondary-text truncate mt-1">
                  View full trade history for this trading account.
                </p>
              </div>
            </div>
            
            <button
              @click="emit('close')"
              class="w-8 h-8 flex items-center justify-center rounded-full text-secondary-text hover:bg-background hover:text-primary-text transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Summary Metrics -->
          <div class="bg-card-background border-0 shadow-none rounded-2xl p-4 sm:p-5">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-primary-border">
              <!-- Total Trades -->
              <div class="flex items-center gap-3 pb-4 sm:pb-0 sm:pr-6">
                <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
                  <img :src="totalIcon" alt="Total Trades" class="w-full h-full object-contain dark:brightness-0 dark:invert transition-all" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <p class="text-xs font-semibold text-secondary-text truncate">Total Trades</p>
                  </div>
                  <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums">
                    {{ summary.total_trades }}
                  </h3>
                </div>
              </div>

              <!-- Total Lots -->
              <div class="flex items-center gap-3 py-4 sm:py-0 sm:px-6">
                <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
                  <img :src="openIcon" alt="Total Lots" class="w-full h-full object-contain dark:brightness-0 dark:invert transition-all" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <p class="text-xs font-semibold text-secondary-text truncate">Total Lots</p>
                  </div>
                  <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums">
                    {{ formatNum(summary.total_lots) }}
                  </h3>
                </div>
              </div>

              <!-- Total PnL -->
              <div class="flex items-center gap-3 pt-4 sm:pt-0 sm:pl-6">
                <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
                  <img :src="solvedIcon" alt="Total PnL" class="w-full h-full object-contain dark:brightness-0 dark:invert transition-all" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <p class="text-xs font-semibold text-secondary-text truncate">Total PnL</p>
                  </div>
                  <h3 class="text-2xl font-bold mt-0.5 font-mono tabular-nums" :class="Number(summary.total_pnl) >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                    {{ Number(summary.total_pnl) >= 0 ? '+' : '' }}${{ formatNum(summary.total_pnl) }}
                  </h3>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-3">
            <BaseSelect v-model="selectedType" :options="typeOptions" class="w-32" rounded="full" variant="surface" />
            <BaseSelect v-model="selectedSide" :options="sideOptions" class="w-32" rounded="full" variant="surface" />
            <BaseDateRangePicker v-model="dateRange" class="w-64" rounded="full" variant="surface" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 p-5 overflow-y-auto">
          <div class="border border-primary-border/40 rounded-2xl overflow-hidden bg-background">
            <DataTable
              :columns="tradeColumns"
              :rows="trades"
              :loading="isLoading"
              empty-text="No trades found for this account."
            >
              <!-- ID Cell -->
              <template #cell-trade_id="{ row }">
                <span class="font-mono text-xs font-semibold text-primary-text">
                  #{{ row.trade_id }}
                </span>
              </template>

              <!-- Symbol Cell -->
              <template #cell-symbol="{ row }">
                <span class="font-bold text-xs text-primary-text">{{ row.symbol }}</span>
              </template>

              <!-- Type & Status Cell -->
              <template #cell-type="{ row }">
                <div class="flex flex-col items-start gap-1">
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                    :class="String(row.type).toUpperCase() === 'BUY' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'"
                  >
                    {{ row.type }}
                  </span>
                  <span
                    class="text-[10px] font-semibold"
                    :class="String(row.status).toUpperCase() === 'OPEN' ? 'text-blue-500' : 'text-secondary-text'"
                  >
                    {{ row.status }}
                  </span>
                </div>
              </template>

              <!-- Lot Cell -->
              <template #cell-lot="{ row }">
                <span class="font-mono text-xs text-primary-text">{{ formatNum(row.lot) }}</span>
              </template>

              <!-- Prices Cell -->
              <template #cell-prices="{ row }">
                <div class="flex flex-col items-end gap-1 font-mono text-[11px]">
                  <span class="text-primary-text">{{ row.entry_price ? formatNum(row.entry_price) : '—' }}</span>
                  <span class="text-secondary-text">{{ row.exit_price ? formatNum(row.exit_price) : '—' }}</span>
                </div>
              </template>

              <!-- Dates Cell -->
              <template #cell-dates="{ row }">
                <div class="flex flex-col gap-1 text-[11px]">
                  <span class="text-primary-text">{{ formatDate(row.created_at) }}</span>
                  <span class="text-secondary-text">{{ formatDate(row.closed_at) }}</span>
                </div>
              </template>

              <!-- PNL Cell -->
              <template #cell-pnl="{ row }">
                <span
                  class="font-mono text-xs font-bold"
                  :class="Number(row.pnl) >= 0 ? 'text-emerald-500' : 'text-rose-500'"
                >
                  {{ Number(row.pnl) >= 0 ? '+' : '' }}${{ formatNum(row.pnl) }}
                </span>
              </template>
            </DataTable>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="shrink-0 z-20 bg-card-background border-t border-primary-border p-4" v-if="pagination.total_pages > 1">
          <Pagination
            :current-page="pagination.page"
            :total-pages="pagination.total_pages"
            @page-change="onPageChange"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-enter-from {
  opacity: 0;
}
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .relative,
.drawer-leave-to .relative {
  transform: translateX(100%);
}

.drawer-enter-to .relative,
.drawer-leave-from .relative {
  transform: translateX(0);
}

/* Base Select scoping */
:deep(.base-select) {
  min-height: 36px;
}
:deep(.base-select .select-trigger) {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  font-size: 0.75rem;
}
:deep(.base-date-picker) {
  height: 36px;
}
:deep(.base-date-picker input) {
  font-size: 0.75rem;
}
</style>
