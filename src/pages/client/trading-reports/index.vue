<template>
  <div class="space-y-6">
    <!-- <div class="flex items-center gap-1.5">
      <h2 class="text-primary-text font-bold text-2xl">Trading Reports</h2>
      <Tooltip text="Detailed trade history, execution prices, volumes, and P&L statements" position="top" wrap>
        <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
      </Tooltip>
    </div> -->

    <!-- Account summary -->
    <div
      class="bg-card-background rounded-2xl p-5 flex flex-col lg:flex-row gap-6"
    >
      <!-- Selected account dropdown -->
      <div
        id="tour-reports-account-selector"
        class="md:w-64 md:border-r md:border-primary-border md:pr-6 shrink-0 flex flex-col justify-center"
      >
        <BaseSelect
          :model-value="reportsStore.selectedAccountId ? String(reportsStore.selectedAccountId) : null"
          :options="accountOptions"
          :is-loading="accountsStore.loading"
          placeholder="Select account"
          rounded="full"
          @update:model-value="(val) => reportsStore.selectAccount(val)"
        />
      </div>

      <!-- Account meta + summary -->
      <div id="tour-reports-content" class="flex-1 min-w-0 flex items-center justify-between gap-4">
        <div class="space-y-4 min-w-0 flex-1">
          <div class="space-y-2">
            <div
              v-if="
                selectedAccount?.broker_label ||
                selectedAccount?.broker_group ||
                selectedAccount?.groupLabel ||
                selectedAccount?.server
              "
              class="flex items-center gap-1.5"
            >
              <Tooltip text="Trading Server & Account Group" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
              <p class="text-sm text-secondary-text cursor-default">
                <span
                  v-if="
                    selectedAccount?.broker_label || selectedAccount?.groupLabel
                  "
                  class="font-semibold text-secondary-text"
                  >{{
                    selectedAccount?.broker_label || selectedAccount?.groupLabel
                  }}</span
                >
                <span
                  v-if="
                    (selectedAccount?.broker_label ||
                      selectedAccount?.groupLabel) &&
                    (selectedAccount?.broker_group || selectedAccount?.server)
                  "
                >
                  •
                </span>
                <span
                  class="text-primary-text font-semibold"
                  v-if="selectedAccount?.broker_group || selectedAccount?.server"
                  >{{
                    selectedAccount?.broker_group || selectedAccount?.server
                  }}</span
                >
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span
                v-if="
                  selectedAccount?.broker_currency || selectedAccount?.currency
                "
                class="inline-flex items-center gap-1.5 bg-background border border-primary-border text-primary-text text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-normal"
              >
                <img
                  v-if="isUsCurrency"
                  :src="usFlg"
                  class="w-3.5 h-3 rounded-[1px] object-cover"
                  alt="US Flag"
                />
                <span v-else>{{
                  getCurrencyFlag(
                    selectedAccount?.broker_currency ||
                      selectedAccount?.currency,
                  )
                }}</span>
                {{
                  getCurrencyLabel(
                    selectedAccount?.broker_currency ||
                      selectedAccount?.currency,
                  )
                }}
              </span>
              <span
                v-if="selectedAccount?.account_number || selectedAccount?.login"
                class="text-xs text-secondary-text"
              >
                <span
                  v-if="selectedAccount?.platform"
                  class="font-semibold text-primary-text mr-1"
                  >{{ selectedAccount.platform }}:</span
                >
                {{
                  selectedAccount?.account_number ||
                  selectedAccount?.login
                }}
              </span>
              <span
                v-if="selectedAccount?.id || selectedAccount?.idStatus"
                class="text-xs font-semibold text-primary-text"
              >
                ID: {{ selectedAccount?.id || selectedAccount?.idStatus }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div class="flex items-center gap-1.5 text-sm text-secondary-text">
              <Tooltip text="Total number of executed trading orders" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
              <span>Total Trades:</span>
              <span class="font-bold text-primary-text">{{
                reportsStore.summary?.total_trades ?? 0
              }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-sm text-secondary-text">
              <Tooltip text="Total traded volume in standard lots" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
              <span>Total Volume:</span>
              <span class="font-bold text-primary-text">{{
                formatNumber(reportsStore.summary?.total_lots ?? 0)
              }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-sm text-secondary-text">
              <Tooltip text="Total net profit and loss across trades" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
              <span>Total PNL:</span>
              <span
                class="font-bold"
                :class="
                  totalPnl < 0
                    ? 'text-primary-red'
                    : 'text-primary-green'
                "
              >
                {{ totalPnl < 0 ? "" : "+" }}{{ formatNumber(totalPnl) }}
              </span>
            </div>
          </div>
        </div>

        <span
          class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-normal border shrink-0 self-center"
          :class="
            isAccountActive
              ? 'bg-primary-green/10 text-primary-green border-primary-green/20'
              : 'bg-secondary-text/10 text-secondary-text border-primary-border'
          "
        >
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
          {{ isAccountActive ? "Active" : "Inactive" }}
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row md:max-[980px]:flex-col justify-between gap-3">
      <!-- Left: Side Tabs (Opening List / Close List) -->
      <div id="tour-reports-status-tabs" class="w-full sm:w-auto shrink-0">
        <BaseTabs
          :model-value="reportsStore.filters.side"
          :tabs="SIDE_TABS"
          over-ride-class="border border-primary-border/40 p-1 gap-1.5"
          button-class="!text-sm font-medium px-5 sm:px-6 min-w-[76px] sm:min-w-[96px] justify-center"
          @update:model-value="reportsStore.setSide"
        />
      </div>

      <!-- Right Controls: Date Range, Type Select, Column Filter & Refresh -->
      <div id="tour-reports-date-filters" class="flex flex-wrap items-center justify-between sm:justify-end md:justify-start min-[1024px]:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
        <!-- Date Range Picker -->
        <div class="w-full sm:w-auto min-w-0 sm:min-w-[200px] shrink-0">
          <BaseDateRangePicker
            v-model="dateRange"
            placeholder="Select Date Range"
            borderless
            @apply="handleDateApply"
            @clear="handleDateClear"
          />
        </div>

        <!-- Type Select ("All") -->
        <div class="w-36 sm:w-32 flex-1 sm:flex-none shrink-0">
          <BaseSelect
            :model-value="reportsStore.filters.type"
            :options="TYPE_OPTIONS"
            borderless
            rounded="full"
            @update:model-value="reportsStore.setType"
          />
        </div>

        <!-- Action Controls: Refresh -->
        <div class="flex items-center gap-2 shrink-0">
          <Tooltip text="Refresh Trading Reports" position="left">
            <RefreshButton
              :loading="reportsStore.loading"
              :icon-size="16"
              button-class="w-9 h-9"
              @click="onRefresh"
            />
          </Tooltip>
        </div>
      </div>
    </div>

    <!-- Trades table -->
    <div
      id="tour-reports-table"
      class="bg-card-background border-0 shadow-none rounded-2xl overflow-hidden"
    >
      <div>
        <WatchDataTable
          :show-tabs="true"
          :columns="columns"
          :rows="reportsStore.trades"
          :loading="reportsStore.loading"
          :total-items="reportsStore.pagination.total_items"
          row-key="trade_id"
          :page="reportsStore.pagination.page"
          :total-pages="reportsStore.pagination.total_pages"
          :per-page="reportsStore.pagination.per_page"
          :row-class="getRowClass"
          customizable-columns
          column-storage-key="panther_trading_reports_columns"
          empty-text="No trades found for the selected filters."
          @update:page="reportsStore.setPage"
          @per-page-change="reportsStore.setPerPage"
          @update:per-page="reportsStore.setPerPage"
        >
          <template #cell-trade_id="{ value }">
            <span class="text-sm font-medium text-primary-text">#{{ value }}</span>
          </template>

          <template #cell-entry="{ row }">
            <div>
              <p class="text-sm font-medium text-primary-text">
                {{ formatNumber(row.entry_price) }}
              </p>
              <p class="text-xs text-secondary-text font-medium">
                {{ formatDateTime(row.created_at).date }} at
                {{ formatDateTime(row.created_at).time }}
              </p>
            </div>
          </template>

          <template #cell-exit="{ row }">
            <div>
              <p class="text-sm font-medium text-primary-text">
                {{
                  row.exit_price != null ? formatNumber(row.exit_price) : "—"
                }}
              </p>
              <p class="text-xs text-secondary-text font-medium">
                {{
                  row.closed_at
                    ? `${formatDateTime(row.closed_at).date} at ${formatDateTime(row.closed_at).time}`
                    : "—"
                }}
              </p>
            </div>
          </template>

          <template #cell-lot="{ value }">
            <span class="text-sm font-medium font-mono text-primary-text">{{ value }}</span>
          </template>

          <template #cell-symbol="{ value }">
            <span class="text-sm font-medium text-primary-text">{{ value }}</span>
          </template>

          <template #cell-type="{ value, row }">
            <BaseBadge
              :value="value || row?.type || row?.action"
              custom-class="tracking-normal"
            />
          </template>

          <template #cell-pnl="{ row }">
            <span
              class="text-sm font-medium font-mono tabular-nums"
              :class="getPnl(row) < 0 ? 'text-primary-red' : 'text-primary-green'"
            >
              {{ getPnl(row) < 0 ? "" : "+" }}{{ formatNumber(getPnl(row)) }}
            </span>
          </template>
        </WatchDataTable>
      </div>
    </div>

    <AccountsDisclaimer />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { ChevronDown, RotateCw, Info } from "lucide-vue-next";

import DownloadButton from "@/components/base/DownloadButton.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import usFlg from "@/assets/us-flg.svg";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import {
  useTradingReportsStore,
  SIDE_TABS,
  TYPE_OPTIONS,
} from "@/stores/client/tradingReports";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useTickerStore } from "@/stores/shared/ticker";
import { formatDateTime, formatNumber } from "@/utils/formatters";
import { livePNL } from "@/utils/livePNL";
import { subscribeTradeSymbols } from "@/utils/symbolUtils";

import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import BaseTabs from "@/components/base/BaseTabs.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";

const accountsStore = useTradingAccountsStore();
const reportsStore = useTradingReportsStore();
const tickerStore = useTickerStore();
const snackbar = useSnackbarStore();
const dateRange = ref(null);

// ─── Table Columns ──────────────────────────────────────
const columns = [
  {
    key: "trade_id",
    label: "Trade ID",
    tooltip: "Unique trade order identifier",
  },
  { key: "symbol", label: "Item", tooltip: "Trading asset or currency symbol", align: "center" },
  { key: "type", label: "Type", tooltip: "Order direction (Buy or Sell)", align: "center" },
  { key: "entry", label: "Entry", tooltip: "Position opening price and timestamp" },
  { key: "exit", label: "Exit", tooltip: "Position closing price and timestamp" },
  { key: "lot", label: "Volume", tooltip: "Traded volume in standard lots", align: "right" },
  { key: "pnl", label: "PNL", tooltip: "Realized or floating profit and loss", align: "right" },
];

const selectedAccount = computed(
  () =>
    accountsStore.data.find(
      (acc) => String(acc.id) === String(reportsStore.selectedAccountId),
    ) || null,
);

const isAccountActive = computed(() => {
  if (!selectedAccount.value) return false;
  return (
    selectedAccount.value.status === true ||
    selectedAccount.value.status === "active" ||
    selectedAccount.value.status === 1 ||
    selectedAccount.value.status === "1"
  );
});

const selectedAccountLabel = computed(() => {
  if (accountsStore.loading) {
    return "Loading...";
  }

  if (!accountsStore.data.length) {
    return "No accounts available";
  }

  if (!selectedAccount.value) {
    return "Select account";
  }

  return (
    selectedAccount.value.account_number ||
    selectedAccount.value.login ||
    selectedAccount.value.id ||
    "—"
  );
});

const CURRENCY_FLAGS = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  JPY: "🇯🇵",
};

const CURRENCY_LABELS = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  JPY: "Japanese Yen",
  USC: "US Cent",
};

const isUsCurrency = computed(() => {
  const cur = (selectedAccount.value?.broker_currency || selectedAccount.value?.currency)?.toUpperCase();
  return cur === "USD" || cur === "USC";
});

const getCurrencyFlag = (currency) => {
  const cur = (currency || "").toUpperCase();
  return CURRENCY_FLAGS[cur] || "";
};

const getCurrencyLabel = (currency) => {
  const cur = (currency || "").toUpperCase();
  return CURRENCY_LABELS[cur] || currency || "";
};

const accountOptions = computed(() => {
  return (accountsStore.data || []).map((acc) => ({
    value: String(acc.id),
    label: String(acc.account_number || acc.login || acc.id || "Account"),
    ...acc,
    raw: acc,
  }));
});

// ─── Actions ────────────────────────────────────────────
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
  let fromDate = null;
  let toDate = null;

  if (Array.isArray(val) && val.length === 2 && val[0] && val[1]) {
    fromDate = formatDateToYYYYMMDD(val[0]);
    toDate = formatDateToYYYYMMDD(val[1]);
  } else if (
    val &&
    typeof val === "object" &&
    (val.start || val.fromDate) &&
    (val.end || val.toDate)
  ) {
    fromDate = formatDateToYYYYMMDD(val.start || val.fromDate);
    toDate = formatDateToYYYYMMDD(val.end || val.toDate);
  }

  reportsStore.setDateRange(fromDate, toDate);
}

function handleDateClear() {
  dateRange.value = null;
  reportsStore.setDateRange(null, null);
}

const onRefresh = () => {
  reportsStore.fetchTrades(reportsStore.selectedAccountId, true);
};

const onDownload = () => {
  // TODO: wire up to a real export endpoint once available.
  snackbar.show("Preparing your report download...", "info");
};

// ─── Trade Status & Row Styling ────────────────────────
const isTradeClosed = (row) => {
  if (!row) return false;
  const status = String(row?.status || "").toLowerCase();
  if (status === "closed" || status === "close" || status === "0") return true;
  if (status === "open" || status === "active" || status === "1") return false;
  if (row.exit_price != null || row.closed_at) return true;
  return false;
};

const getRowClass = (row) => {
  if (isTradeClosed(row)) {
    return "opacity-60 hover:opacity-100 transition-opacity duration-200";
  }
  return "opacity-100";
};

// ─── Live PnL & Ticker Subscription ────────────────────
const getPnl = (trade) => {
  if (!trade) return 0;
  const val = Number(livePNL(trade));
  return Number.isFinite(val) ? val : 0;
};

const totalPnl = computed(() => {
  if (!reportsStore.trades || !reportsStore.trades.length) {
    return Number(reportsStore.summary?.total_pnl ?? 0);
  }
  const hasOpenTrades = reportsStore.trades.some(
    (t) => String(t?.status || "").toUpperCase() !== "CLOSED",
  );
  if (hasOpenTrades) {
    return reportsStore.trades.reduce((sum, trade) => sum + getPnl(trade), 0);
  }
  return Number(reportsStore.summary?.total_pnl ?? 0);
});

watch(
  () => reportsStore.trades,
  (trades) => {
    if (trades && trades.length) {
      subscribeTradeSymbols(trades, { onlyOpen: false });
    }
  },
  { immediate: true, deep: true },
);

onMounted(() => {
  tickerStore.startWebSocket();
  accountsStore.fetchAccounts();
});

// Default-select the first available account once the accounts list loads.
watch(
  () => accountsStore.data,
  (accounts) => {
    if (accounts.length && !reportsStore.selectedAccountId) {
      reportsStore.selectAccount(accounts[0].id);
    }
  },
  { immediate: true },
);
</script>

