<template>
  <div class="px-4 pb-8 space-y-6">
    <!-- Note Banner -->
    <div
      v-if="store.note"
      class="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-secondary-text"
    >
      <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <span class="leading-relaxed">{{ store.note }}</span>
    </div>

    <!-- Summary Cards -->
    <div class="bg-card-background border-0 shadow-none rounded-2xl p-4 sm:p-5">
      <div
        class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-primary-border"
      >
        <!-- Metric 1: Total Fees -->
        <div class="flex items-center gap-3 pb-4 sm:pb-0 sm:pr-6">
          <div
            class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0"
          >
            <DollarSign class="w-full h-full text-primary-text" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-xs font-semibold text-secondary-text truncate">
                Total Fees
              </p>
              <Info
                :size="11"
                class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
                title="Aggregated performance fees"
              />
            </div>
            <h3
              class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums"
            >
              <span
                v-if="store.loading && !store.records?.length"
                class="inline-block h-6 w-24 bg-background rounded animate-pulse"
              ></span>
              <span v-else
                >{{ topCurrencySymbol
                }}{{ formatNum(store.summary.total_fees) }}</span
              >
            </h3>
          </div>
        </div>

        <!-- Metric 2: Broker Net -->
        <!-- <div class="flex items-center gap-3 py-4 sm:py-0 sm:px-6">
          <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
            <Building2 class="w-full h-full text-primary-text" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-xs font-semibold text-secondary-text truncate">Broker Net</p>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" title="Net broker commission" />
            </div>
            <h3 class="text-2xl font-bold text-primary-green mt-0.5 font-mono tabular-nums">
              <span v-if="store.loading && !store.records?.length" class="inline-block h-6 w-24 bg-background rounded animate-pulse"></span>
              <span v-else>{{ topCurrencySymbol }}{{ formatNum(store.summary.broker_net) }}</span>
            </h3>
          </div>
        </div> -->

        <!-- Metric 3: IB Pool -->
        <!-- <div class="flex items-center gap-3 pt-4 sm:pt-0 sm:pl-6">
          <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
            <GitBranch class="w-full h-full text-primary-text" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-xs font-semibold text-secondary-text truncate">IB Pool</p>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" title="Distributed to partner network" />
            </div>
            <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums">
              <span v-if="store.loading && !store.records?.length" class="inline-block h-6 w-24 bg-background rounded animate-pulse"></span>
              <span v-else>{{ topCurrencySymbol }}{{ formatNum(store.summary.ib_pool ?? store.summary.ib_distributed) }}</span>
            </h3>
          </div>
        </div> -->
      </div>
    </div>

    <!-- Filter Bar -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card-background border border-primary-border rounded-xl p-2.5"
    >
      <div class="flex items-center gap-2 flex-wrap flex-1">
        <!-- Dynamic Filters -->
        <BaseSelect
          v-for="filter in dynamicFilters"
          :key="filter.key"
          v-model="store.filters[filter.key]"
          :options="filter.options"
          :placeholder="filter.placeholder"
          class="w-full sm:w-42"
          @update:modelValue="handleFilterChange"
        />

        <!-- Amount View Toggle -->
        <div
          v-if="store.currency?.available_views?.length"
          class="flex items-center rounded-lg border border-primary-border bg-card-background overflow-hidden h-9"
        >
          <button
            v-for="v in store.currency.available_views"
            :key="v.key"
            :disabled="store.loading"
            class="px-3 h-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            :class="
              store.filters.amount_view === v.key
                ? 'bg-primary text-white'
                : 'text-secondary-text hover:text-primary-text hover:bg-background'
            "
            :title="v.description"
            @click="store.setAmountView(v.key)"
          >
            {{ v.label }}
          </button>
        </div>

        <!-- Per page selector -->
        <BaseSelect
          :modelValue="store.pagination.per_page"
          :options="store.perPageOptions"
          placeholder="Per page..."
          class="w-20 sm:w-20"
          @update:modelValue="store.updatePerPage"
        />
      </div>

      <!-- Refresh Button -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="store.loading"
          class="inline-flex items-center justify-center rounded-lg border border-primary-border p-2 text-secondary-text transition-colors hover:text-primary-text hover:bg-background disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          title="Refresh"
          @click="() => store.fetchSettlements()"
        >
          <RotateCw
            class="h-3.5 w-3.5"
            :class="{ 'animate-spin': store.loading }"
          />
        </button>

        <!-- <button
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors cursor-pointer"
          @click="openRunModal"
        >
          <PlayCircle class="w-3.5 h-3.5" />
          <span>Preview & Run</span>
        </button> -->
      </div>
    </div>

    <!-- Table -->
    <div class="w-full">
      <DataTable
        :columns="columns"
        :rows="store.records"
        :loading="store.loading"
        :skeleton-rows="8"
        :page="store.pagination.current_page || 1"
        :total-pages="store.pagination.total_pages"
        :per-page="store.pagination.per_page"
        :total-items="store.pagination.total_items"
        :show-pagination-info="true"
        :show-per-page="false"
        clickable-rows
        @row-click="(row) => goToDetail(row.settlement_id)"
        @page-change="handlePageChange"
      >
        <!-- Custom Empty State -->
        <template #empty>
          <div class="py-16 text-center flex flex-col items-center gap-3">
            <div
              class="w-12 h-12 rounded-full bg-card-background border border-primary-border flex items-center justify-center"
            >
              <ReceiptText class="w-5 h-5 text-secondary-text" />
            </div>
            <p class="text-sm font-semibold text-primary-text">
              No settlements found
            </p>
            <p class="text-xs text-secondary-text">
              Try adjusting your filters or search criteria
            </p>
            <button
              v-if="hasActiveFilters"
              class="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
              @click="clearFilters"
            >
              Clear Filters
            </button>
          </div>
        </template>

        <!-- Columns -->
        <template #cell-settlement_id="{ row }">
          <span class="text-xs font-bold font-mono text-primary"
            >#{{ row.settlement_id }}</span
          >
        </template>

        <template #cell-fm_details="{ row }">
          <p class="text-xs font-semibold text-primary-text">
            {{ row.fm_name || "FM" }}
          </p>
          <p class="text-[11px] text-secondary-text font-mono">
            FM ID: #{{ row.fm_id }}
          </p>
        </template>

        <template #cell-executed_period="{ row }">
          <p class="text-xs font-medium text-primary-text">
            {{ formatDate(row.executed_at) || row.period }}
          </p>
          <p
            v-if="row.settlement_period_start"
            class="text-2xs text-secondary-text mt-0.5"
          >
            {{ row.settlement_period_start }} –
            {{row.settlement_period_end }}
          </p>
        </template>

        <template #cell-settlement_type="{ row }">
          <span
            v-if="row.settlement_type"
            class="px-1.5 py-0.5 rounded text-2xs uppercase font-bold bg-background border border-primary-border text-secondary-text"
          >
            {{ row.settlement_type }}
          </span>
          <span v-else class="text-xs text-secondary-text">—</span>
        </template>

        <template #cell-gross_pnl="{ row }">
          <span
            class="text-xs font-bold tabular-nums"
            :class="
              getNetProfit(row) >= 0 ? 'text-primary-green' : 'text-primary-red'
            "
          >
            {{ formatNetProfit(row) }}
          </span>
        </template>

        <template #cell-gross_fee="{ row }">
          <span class="text-xs font-medium text-primary-text tabular-nums">
            {{ formatValWithCurrency(getGrossFee(row), row) }}
          </span>
        </template>

        <template #cell-net_pnl="{ row }">
          <span
            class="text-xs font-bold tabular-nums"
            :class="
              getNetPnl(row) >= 0 ? 'text-primary-green' : 'text-primary-red'
            "
          >
            {{ formatNetPnl(row) }}
          </span>
        </template>

        <template #cell-followers_count="{ row }">
          <span
            class="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium bg-background border border-primary-border text-primary-text"
          >
            {{ row.followers_count ?? 0 }}
          </span>
        </template>

        <template #cell-trades_count="{ row }">
          <span
            class="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-background border border-primary-border text-primary-text"
          >
            {{ row.trades_count ?? 0 }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <span
            class="text-2xs font-medium px-2 py-0.5 rounded-full border capitalize inline-block"
            :class="statusClass(row.status)"
          >
            {{ row.status }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1.5" @click.stop>
            <button
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-medium transition-colors cursor-pointer"
              title="View Settlement Details"
              @click="goToDetail(row.settlement_id)"
            >
              <Eye class="w-3.5 h-3.5" />
              <span>View</span>
            </button>
            <button
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary-border text-xs text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer"
              title="View Flat Trades"
              @click="goToTrade(row.settlement_id)"
            >
              <BarChart2 class="w-3.5 h-3.5" />
              <span>Trades</span>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Confirm Dialog -->
    <RunSettlementConfirm
      :open="confirmOpen"
      :settlement="runStore.settlement"
      :currency="topCurrencySymbol"
      :run-loading="runStore.runLoading"
      @close="confirmOpen = false"
      @confirm="handleConfirmRun"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ReceiptText,
  DollarSign,
  Building2,
  GitBranch,
  Search,
  X,
  RotateCcw,
  RotateCw,
  Eye,
  BarChart2,
  Info,
  PlayCircle,
} from "lucide-vue-next";
import { useSettlementsStore } from "@/stores/fm/settlements/settlements";
import { useRunSettlementStore } from "@/stores/fm/settlements/runSettlement";
import Pagination from "@/components/base/Pagination.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import RunSettlementConfirm from "@/components/fm/settlements/RunSettlementConfirm.vue";

const columns = [
  { key: "settlement_id", label: "ID" },
  { key: "fm_details", label: "FM Details" },
  { key: "executed_period", label: "Executed / Period" },
  { key: "settlement_type", label: "Type" },
  { key: "gross_pnl", label: "Gross P&L" },
  { key: "gross_fee", label: "Gross Fee" },
  { key: "net_pnl", label: "Net P&L" },
  { key: "followers_count", label: "Followers", align: "center" },
  { key: "trades_count", label: "Trades", align: "center" },
  { key: "status", label: "Status", align: "center" },
  { key: "actions", label: "Actions", align: "right", width: "150px" },
];

const router = useRouter();
const store = useSettlementsStore();
const runStore = useRunSettlementStore();

const confirmOpen = ref(false);

const openRunModal = () => {
  runStore.fetchSettlement(store.filters.amount_view);
  confirmOpen.value = true;
};

const handleConfirmRun = async () => {
  await runStore.runSettlement();
  confirmOpen.value = false;
  store.fetchSettlements();
};

const filterConfig = [
  {
    key: "user_id",
    source: "clients",
    placeholder: "All Clients",
    labelKey: "name",
    fallbackLabelPrefix: "User #",
    valueKey: "user_id",
  },
  {
    key: "trading_account_id",
    source: "trading_accounts",
    placeholder: "All Accounts",
    labelKey: "account_number",
    fallbackLabelPrefix: "Account #",
    valueKey: "trading_account_id",
  },
  {
    key: "offer_id",
    source: "offers",
    placeholder: "All Offers",
    labelKey: "offer_name",
    fallbackLabelPrefix: "Offer #",
    valueKey: "offer_id",
  },
];

const dynamicFilters = computed(() => {
  return filterConfig
    .map((config) => {
      const rawOptions = store.filterOptions[config.source] || [];
      if (!rawOptions.length) return null;

      const options = [
        { label: config.placeholder, value: null },
        ...rawOptions.map((item) => ({
          label:
            item[config.labelKey] ||
            `${config.fallbackLabelPrefix}${item[config.valueKey]}`,
          value: item[config.valueKey],
        })),
      ];

      return {
        key: config.key,
        placeholder: config.placeholder,
        options,
      };
    })
    .filter(Boolean);
});

const hasActiveFilters = computed(() => {
  return filterConfig.some((config) => store.filters[config.key]);
});

const handleFilterChange = () => {
  store.applyFilters();
};

const clearFilters = () => {
  filterConfig.forEach((config) => {
    store.filters[config.key] = null;
  });
  store.applyFilters();
};

const handlePageChange = (page) => {
  store.setPage(page);
};

const formatNum = (val) =>
  (Number(val) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getCurrencySymbol = (currency) => {
  const c = String(currency || "")
    .trim()
    .toUpperCase();
  if (c === "USC" || c === "CENT" || c === "CENTS") return "C";
  if (c === "CAD") return "C$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  if (c === "INR") return "₹";
  if (c === "JPY") return "¥";
  if (c === "USD") return "$";
  return c ? `${c} ` : "$";
};

const getRecordCurrency = (row) => {
  if (row.currency) {
    if (row.currency.selected_view === "usd") {
      return row.currency.payout_currency || "USD";
    }
    return (
      row.currency.account_currency ||
      (row.amounts_in_account_units ? "USC" : "USD")
    );
  }
  return row.amounts_in_account_units ? "USC" : "USD";
};

const formatValWithCurrency = (val, row) => {
  const curr = getRecordCurrency(row);
  const sym = getCurrencySymbol(curr);
  const num = Number(val) || 0;
  const isNegative = num < 0;
  const formatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? "-" : ""}${sym}${formatted}`;
};

const getNetPnl = (row) => {
  if (!row) return 0;
  const isUsd =
    (store.filters.amount_view ||
      store.currency?.selected_view ||
      row?.currency?.selected_view) === "usd";
  if (isUsd) {
    return (
      row.net_pnl_after_fees ??
      row.display?.net_pnl_after_fees ??
      row.net_pnl ??
      0
    );
  }
  return (
    row.net_pnl_after_fees_account_units ??
    row.display?.net_pnl_after_fees_account_units ??
    row.net_pnl_account_units ??
    row.net_pnl_after_fees ??
    0
  );
};

const formatNetPnl = (row) => {
  const val = getNetPnl(row);
  const curr = getRecordCurrency(row);
  const sym = getCurrencySymbol(curr);
  const num = Number(val) || 0;
  const sign = num > 0 ? "+" : num < 0 ? "-" : "";
  const formatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${sym}${formatted}`;
};

const formatNetProfit = (row) => {
  const val = getNetProfit(row);
  const curr = getRecordCurrency(row);
  const sym = getCurrencySymbol(curr);
  const num = Number(val) || 0;
  const sign = num > 0 ? "+" : num < 0 ? "-" : "";
  const formatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${sym}${formatted}`;
};

const topCurrencySymbol = computed(() => {
  const c = store.currency;
  if (!c) return "$";
  const cur =
    c.selected_view === "usd"
      ? c.payout_currency || "USD"
      : c.account_currency || "USD";
  return getCurrencySymbol(cur);
});

const getNetProfit = (row) =>
  row.display?.net_profit ??
  row.display?.gross_pnl ??
  row.net_profit ??
  row.gross_pnl ??
  0;

const getGrossFee = (row) => row.display?.gross_fee ?? row.gross_fee ?? 0;

const getFmShare = (row) =>
  row.display?.fm_share ??
  row.display?.fm_net_after_agents ??
  row.fm_share ??
  row.fm_net_after_agents ??
  0;

const getIbShare = (row) =>
  row.display?.ib_pool ??
  row.display?.ib_distributed ??
  row.ib_pool ??
  row.ib_distributed ??
  0;

const getBrokerNet = (row) => row.display?.broker_net ?? row.broker_net ?? 0;

const formatDate = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return String(val);
  }
};

const formatDateShort = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return String(val);
  }
};

const statusClass = (s) =>
  ({
    completed: "bg-primary-green/10 text-primary-green border-primary-green/20",
    pending:
      "bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20",
    failed: "bg-primary-red/10 text-primary-red border-primary-red/20",
  })[String(s).toLowerCase()] ??
  "bg-background text-secondary-text border-primary-border";

const goToDetail = (settlementId) => {
  router.push(`/fm-settlements/${settlementId}`);
};

const goToTrade = (settlementId) => {
  router.push(`/fm-settlements/trades/${settlementId}`);
};

onMounted(() => {
  store.fetchFilterOptions();
  store.fetchSettlements();
});
</script>
