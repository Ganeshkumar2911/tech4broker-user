<template>
  <div class="space-y-6">
    <!-- Top Card: Selected Account Dropdown + Account Meta (Matching Trading Reports) -->
    <div
      class="bg-card-background rounded-2xl p-5 flex flex-col md:flex-row gap-6"
    >
      <!-- Left: Selected Account Dropdown -->
      <div class="md:w-64 md:border-r md:border-primary-border md:pr-6 shrink-0">
        <p class="text-[11px] font-bold text-secondary-text uppercase tracking-wider mb-2">
          Selected Account
        </p>

        <BaseSelect
          :model-value="selectedAccountId"
          :options="accountOptions"
          @update:model-value="onAccountSelect"
          rounded="full"
        />
      </div>

      <!-- Right: Account Meta & Details -->
      <div class="flex-1 min-w-0 flex flex-col justify-center gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="activeAccount?.broker_currency || activeAccount?.currency"
            class="inline-flex items-center gap-1.5 bg-background border border-primary-border text-primary-text text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
          >
            <img
              v-if="isUsCurrency"
              :src="usFlg"
              class="w-3.5 h-3 rounded-[1px] object-cover"
              alt="US Flag"
            />
            <span v-else>{{ currencyFlag }}</span>
            {{ currencyLabel }}
          </span>


          <span v-if="activeAccount?.account_type || activeAccount?.raw?.account_type" class="text-xs font-semibold text-primary-text capitalize">
            {{ activeAccount?.account_type || activeAccount?.raw?.account_type }}   <span v-if="activeAccount?.broker_leverage" class="text-xs font-semibold text-primary-text">
            • Leverage: 1:{{ activeAccount?.broker_leverage }}
          </span>
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-x-8 gap-y-2">
          <div class="flex items-center gap-1.5 text-sm text-secondary-text">
            <Tooltip text="Total number of executed trading orders" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
            <span>Total Trades:</span>
            <span class="font-bold text-primary-text">{{ store.summary?.total_trades ?? 0 }}</span>
          </div>

          <div class="flex items-center gap-1.5 text-sm text-secondary-text">
            <Tooltip text="Total traded volume in standard lots" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
            <span>Total Volume:</span>
            <span class="font-bold text-primary-text">{{ formatNum(store.summary?.total_lots) }}</span>
          </div>

          <p v-if="activePositionTab !== 'open'" class="flex items-center gap-1.5 text-sm text-secondary-text">
            <Tooltip text="Total net profit and loss" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
            <span>Total PnL:</span>
            <span
              class="font-bold tabular-nums"
              :class="(store.summary?.total_pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ (store.summary?.total_pnl ?? 0) >= 0 ? "+" : "" }}{{ currencySymbol }} {{ formatNum(store.summary?.total_pnl) }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Summary Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <template v-if="store.loading">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-card-background rounded-2xl p-4 animate-pulse space-y-2"
        >
          <div class="h-3 w-20 bg-primary-border/30 rounded" />
          <div class="h-6 w-28 bg-primary-border/30 rounded" />
        </div>
      </template>

      <template v-else>
        <div class="bg-card-background rounded-2xl p-4">
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[11px] uppercase tracking-wide text-secondary-text font-semibold">
              Total Volume
            </p>
            <Tooltip text="Cumulative trade volume in standard lots" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-2xl font-bold text-primary-text">
            {{ formatNum(store.summary?.total_lots) }}
          </p>
        </div>

        <div class="bg-card-background rounded-2xl p-4">
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[11px] uppercase tracking-wide text-secondary-text font-semibold">
              Total Trades
            </p>
            <Tooltip text="Total number of trades executed" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-2xl font-bold text-primary-text">
            {{ store.summary?.total_trades ?? 0 }}
          </p>
        </div>

        <div
          v-if="activePositionTab !== 'open'"
          class="bg-card-background rounded-2xl p-4"
        >
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[11px] uppercase tracking-wide text-secondary-text font-semibold">
              Total PnL
            </p>
            <Tooltip text="Net realized profit and loss across all closed trades" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p
            class="text-2xl font-bold"
            :class="(store.summary?.total_pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'"
          >
            {{ (store.summary?.total_pnl ?? 0) >= 0 ? "+" : "" }}{{ currencySymbol }} {{ formatNum(store.summary?.total_pnl) }}
          </p>
        </div>
      </template>
    </div>

    <!-- Position Filter Tabs -->
    <div class="inline-flex h-10 items-center gap-1 rounded-full bg-card-background p-1 border border-primary-border/40">
      <button
        type="button"
        @click="activePositionTab = 'all'"
        class="h-full px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
        :class="
          activePositionTab === 'all'
            ? 'bg-button text-button-text font-bold'
            : 'text-secondary-text hover:text-primary-text'
        "
      >
        All Positions
      </button>

      <button
        type="button"
        @click="activePositionTab = 'open'"
        class="h-full px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
        :class="
          activePositionTab === 'open'
            ? 'bg-button text-button-text font-bold'
            : 'text-secondary-text hover:text-primary-text'
        "
      >
        Open
      </button>

      <button
        type="button"
        @click="activePositionTab = 'closed'"
        class="h-full px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
        :class="
          activePositionTab === 'closed'
            ? 'bg-button text-button-text font-bold'
            : 'text-secondary-text hover:text-primary-text'
        "
      >
        Closed
      </button>
    </div>

    <!-- WatchDataTable Container -->
    <div class="rounded-2xl overflow-hidden border-0">
      <WatchDataTable
        :columns="columns"
        :rows="store.data"
        :loading="store.loading"
        :page="store.pagination.page"
        :total-pages="store.pagination.total_pages"
        @update:page="handlePageChange"
        empty-text="No trades found"
      >
        <!-- Trade ID Slot -->
        <template #cell-trade_id="{ row }">
          <span class="text-sm font-medium text-primary-text">#{{ row.trade_id }}</span>
        </template>

        <!-- Symbol Slot -->
        <template #cell-symbol="{ value }">
          <span class="text-sm font-medium text-primary-text">{{ value }}</span>
        </template>

        <!-- Type Slot -->
        <template #cell-type="{ value }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium uppercase border"
            :class="
              String(value).toLowerCase() === 'buy'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            "
          >
            {{ value }}
          </span>
        </template>

        <!-- Volume Slot -->
        <template #cell-lot="{ value }">
          <span class="text-sm font-mono font-medium text-primary-text">
            {{ value != null ? Number(value).toFixed(2) : "0.00" }}
          </span>
        </template>

        <!-- Entry Price Slot -->
        <template #cell-entry_price="{ value }">
          <span class="text-sm font-mono font-medium text-primary-text">
            {{ value != null ? Number(value).toFixed(3) : "—" }}
          </span>
        </template>

        <!-- Exit Price Slot -->
        <template #cell-exit_price="{ value }">
          <span class="text-sm font-mono font-medium text-primary-text">
            {{ value != null ? Number(value).toFixed(3) : "—" }}
          </span>
        </template>

        <!-- PnL Slot -->
        <template #cell-profit="{ row }">
          <span
            class="text-sm font-mono font-medium"
            :class="pnlValue(row) >= 0 ? 'text-green-600' : 'text-red-600'"
          >
            {{ pnlValue(row) >= 0 ? '+' : '' }}{{ currencySymbol }}{{ formatNum(pnlValue(row)) }}
          </span>
        </template>

        <!-- Status Slot -->
        <template #cell-status="{ value }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize border"
            :class="
              String(value).toUpperCase() === 'OPEN'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-primary-border/20 text-secondary-text border-primary-border/40'
            "
          >
            {{ value }}
          </span>
        </template>

        <!-- Time Opened Slot -->
        <template #cell-open_time="{ value }">
          <span class="text-sm text-secondary-text font-medium">
            {{ value }}
          </span>
        </template>

        <!-- Time Closed Slot -->
        <template #cell-close_time="{ value }">
          <span class="text-sm text-secondary-text font-medium">
            {{ value ?? "—" }}
          </span>
        </template>
      </WatchDataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Info } from "lucide-vue-next";
import usFlg from "@/assets/us-flg.svg";

import { useAccountTradesStore } from "@/stores/client/accountsTrades";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import { livePNL } from "@/utils/livePNL";
import { useTickerStore } from "@/stores/shared/ticker";

const store = useAccountTradesStore();
const accountsStore = useTradingAccountsStore();
const tickerStore = useTickerStore();
const route = useRoute();
const router = useRouter();

const activeAccount = ref(null);
const selectedAccountId = ref(String(route.params.id || ""));
const activePositionTab = ref("all");
const activeCurrency = ref(localStorage.getItem("active_currency") || "USD");

const currencyCode = computed(() => {
  return (activeAccount.value?.broker_currency || activeAccount.value?.currency || "USD").toUpperCase();
});

const currencySymbol = computed(() => {
  const syms = { USD: "$", USC: "C" };
  return syms[activeCurrency.value?.toUpperCase()] || "$";
});

const isUsCurrency = computed(() => currencyCode.value === "USD" || currencyCode.value === "USC");

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

const currencyFlag = computed(() => CURRENCY_FLAGS[currencyCode.value] || "🌐");
const currencyLabel = computed(() => CURRENCY_LABELS[currencyCode.value] || currencyCode.value);

const accountOptions = computed(() => {
  return (accountsStore.data || []).map((acc) => ({
    label: `${(acc.platform || acc.account_type || acc.trading_type || "MT5").toUpperCase()}: #${acc.account_number || acc.login || acc.id}${acc.broker_label ? ` (${acc.broker_label})` : ""}`,
    value: String(acc.id || acc.account_id || acc.login),
  }));
});

const columns = [
  { key: "trade_id", label: "Trade ID" },
  { key: "symbol", label: "Symbol" },
  { key: "type", label: "Type" },
  { key: "lot", label: "Volume" },
  { key: "entry_price", label: "Entry" },
  { key: "exit_price", label: "Exit" },
  { key: "profit", label: "PnL", align: "right" },
  { key: "status", label: "Status", align: "center" },
  { key: "created_at", label: "Time Opened" },
  { key: "closed_at", label: "Time Closed", align: "right" },
];

const onAccountSelect = (newId) => {
  if (!newId) return;
  selectedAccountId.value = String(newId);
  const found = accountsStore.data.find(
    (a) => String(a.id || a.account_id || a.login) === String(newId)
  );
  if (found) {
    activeAccount.value = found;
    localStorage.setItem("active_account", JSON.stringify(found));
  }
  router.replace({ name: "account-trades", params: { id: newId } });
  store.fetchTrades(newId, true);
};

const getSideParam = () => {
  if (activePositionTab.value === "open") return "open";
  if (activePositionTab.value === "closed") return "closed";
  return null;
};

const handlePageChange = (page) => {
  store.setPage(page, getSideParam());
};

const isOpenTrade = (trade) =>
  String(trade?.status ?? "").toUpperCase() === "OPEN";

const pnlValue = (trade) => {
  const raw = isOpenTrade(trade) ? livePNL(trade) : trade?.profit ?? trade?.pnl;
  const val = Number(raw);
  return Number.isFinite(val) ? val : 0;
};

const formatNum = (val) =>
  (val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

watch(activePositionTab, () => {
  store.setPage(1, getSideParam());
});

watch(
  () => store.data,
  (newData) => {
    if (newData && newData.length > 0) {
      const uniqueSymbols = [
        ...new Set(newData.map((trade) => trade.symbol)),
      ].filter(Boolean);
      tickerStore.updateTickerList(uniqueSymbols);
    }
  },
  { deep: true }
);

onMounted(async () => {
  if (!accountsStore.data.length) {
    await accountsStore.fetchAccounts();
  }
  const initialId = String(route.params.id || "");
  selectedAccountId.value = initialId;

  const found = accountsStore.data.find(
    (a) => String(a.id || a.account_id || a.login) === initialId
  );
  if (found) {
    activeAccount.value = found;
  } else {
    try {
      const stored = localStorage.getItem("active_account");
      if (stored) activeAccount.value = JSON.parse(stored);
    } catch (e) {}
  }
  store.fetchTrades(initialId);
});
</script>