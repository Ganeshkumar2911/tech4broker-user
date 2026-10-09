<script setup>
import { computed, onMounted, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFollowerTradeBookStore } from "@/stores/fm/followerTradeBook";
import { useTickerStore } from "@/stores/shared/ticker";
import BaseTabs from "@/components/base/BaseTabs.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import Pagination from "@/components/base/Pagination.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import { formatDate } from "@/utils/timeFormatter.js";
import { livePNL, calculateTotalFloatingPnl, calculateLegFloatingPnl } from "@/utils/livePNL.js";
import { subscribeTradeSymbols } from "@/utils/symbolUtils.js";
import { getAvatar } from "@/utils/avtar.js";
import { ArrowLeft } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const store = useFollowerTradeBookStore();
const tickerStore = useTickerStore();

const followerId = computed(() => route.params.id);

const actionOptions = [
  { label: "All Actions", value: "" },
  { label: "BUY", value: "0" },
  { label: "SELL", value: "1" },
];

const statusOptions = [
  { label: "All Status", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Closed", value: "CLOSED" },
];

const resultOptions = [
  { label: "All Result", value: "" },
  { label: "Profit", value: "profit" },
  { label: "Loss", value: "loss" },
  { label: "Breakeven", value: "breakeven" },
];

const sortOrderOptions = [
  { label: "Newest First", value: "desc" },
  { label: "Oldest First", value: "asc" },
];

const fmt = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getCurrencySymbol = (currency) => {
  const c = String(currency || "").toUpperCase();
  if (c === "USC" || c === "CENT") return "C";
  return "$";
};

const followerCurrency = computed(() => {
  return (
    store.followerInfo?.broker_currency ||
    store.followerInfo?.currency ||
    store.positionsData?.[0]?.broker_currency ||
    store.dealsData?.[0]?.broker_currency ||
    store.ordersData?.[0]?.broker_currency ||
    "USD"
  );
});

const formatCurrency = (val, currency = null) => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const num = Number(val);
  const sym = getCurrencySymbol(currency || followerCurrency.value);
  return `${sym}${fmt(num)}`;
};

const formatPnl = (val, currency = null) => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";
  const sym = getCurrencySymbol(currency || followerCurrency.value);
  const prefix = num >= 0 ? `+${sym}` : `-${sym}`;
  return `${prefix}${Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const totalFloatingPnl = computed(() => {
  return calculateTotalFloatingPnl(store.openLegs);
});

const realizedPositionsProfit = computed(() => {
  const pnl = store.positionsSummary?.realized_pnl ?? store.positionsSummary?.total_profit;
  return pnl !== null && pnl !== undefined && !isNaN(pnl) ? Number(pnl) : 0;
});

const totalPositionsPnl = computed(() => {
  return realizedPositionsProfit.value + totalFloatingPnl.value;
});

const getPositionPnl = (pos) => {
  if (String(pos?.status).toUpperCase() === "OPEN") {
    return calculateLegFloatingPnl(pos);
  }
  const val = pos?.profit ?? pos?.pnl;
  if (val === null || val === undefined || isNaN(val)) return 0;
  return Number(val);
};

const filteredDealsData = computed(() => {
  const items = store.dealsData || [];
  if (!store.filters.result) return items;
  const res = store.filters.result.toLowerCase();
  return items.filter((row) => {
    const profit = Number(row.profit ?? row.pnl ?? 0);
    if (res === "profit") return profit > 0;
    if (res === "loss") return profit < 0;
    if (res === "breakeven") return profit === 0;
    return true;
  });
});

const filteredPositionsData = computed(() => {
  const items = store.positionsData || [];
  if (!store.filters.result) return items;
  const res = store.filters.result.toLowerCase();
  return items.filter((row) => {
    const profit = getPositionPnl(row);
    if (res === "profit") return profit > 0;
    if (res === "loss") return profit < 0;
    if (res === "breakeven") return profit === 0;
    return true;
  });
});

const filteredOrdersData = computed(() => {
  const items = store.ordersData || [];
  if (!store.filters.result) return items;
  const res = store.filters.result.toLowerCase();
  return items.filter((row) => {
    const profit = Number(row.profit ?? row.pnl ?? 0);
    if (res === "profit") return profit > 0;
    if (res === "loss") return profit < 0;
    if (res === "breakeven") return profit === 0;
    return true;
  });
});

const filteredOpenLegs = computed(() => {
  let list = store.openLegs || [];
  if (store.filters.search) {
    const q = store.filters.search.toLowerCase();
    list = list.filter(
      (item) =>
        String(item.symbol || "").toLowerCase().includes(q) ||
        String(item.id || "").toLowerCase().includes(q) ||
        String(item.trade_number || "").toLowerCase().includes(q) ||
        String(item.position_id || "").toLowerCase().includes(q)
    );
  }
  if (store.filters.action !== "") {
    const act = String(store.filters.action);
    list = list.filter((item) => {
      const isBuy =
        item.action === 0 ||
        item.action === "0" ||
        String(item.type).toUpperCase() === "BUY" ||
        String(item.type_name).toUpperCase() === "BUY";
      return act === "0" ? isBuy : !isBuy;
    });
  }
  return list;
});

const tradeBookTabs = computed(() => [
  {
    label: "Open Positions",
    value: "open_legs",
    count: filteredOpenLegs.value.length,
  },
  {
    label: "Deals",
    value: "deals",
    count:
      store.activeTab === "deals" || store.tabState.deals.isFetched
        ? filteredDealsData.value.length
        : undefined,
  },
  {
    label: "Positions",
    value: "positions",
    count:
      store.activeTab === "positions" || store.tabState.positions.isFetched
        ? filteredPositionsData.value.length
        : undefined,
  },
  {
    label: "Orders",
    value: "orders",
    count:
      store.activeTab === "orders" || store.tabState.orders.isFetched
        ? filteredOrdersData.value.length
        : undefined,
  },
]);

watch(
  [() => store.positionsData, () => store.ordersData, () => store.dealsData, () => store.openLegs],
  ([newPositions, newOrders, newDeals, newOpenLegs]) => {
    subscribeTradeSymbols([
      ...(newPositions || []),
      ...(newOrders || []),
      ...(newOpenLegs || []),
    ], { onlyOpen: false });
  },
  { deep: true, immediate: true }
);

const onTabChange = (tabKey) => {
  store.setActiveTab(tabKey);
};

const onSearchInput = () => {
  store.applyFilters();
};

const onActionFilterChange = (val) => {
  store.filters.action = val;
  store.applyFilters();
};

const onStatusFilterChange = (val) => {
  store.filters.status = val;
  store.applyFilters();
};

const onResultFilterChange = (val) => {
  store.filters.result = val;
  store.applyFilters();
};

const onSortOrderChange = (val) => {
  store.filters.sort_order = val;
  store.applyFilters();
};

const onPageChange = (page) => {
  store.setPage(store.activeTab, page);
};

const currentTabPagination = computed(() => {
  return store.tabState[store.activeTab]?.pagination || { page: 1, per_page: 10, total_items: 0, total_pages: 1 };
});

const currentTabLoading = computed(() => {
  return store.tabState[store.activeTab]?.loading || false;
});

const dateRange = ref(null);

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
  dateRange.value = null;
  store.resetFilters();
}

const isAnyFilterActive = computed(() => {
  return Boolean(
    store.filters.search ||
    store.filters.action ||
    store.filters.status ||
    store.filters.result ||
    store.filters.from_date ||
    store.filters.to_date ||
    dateRange.value ||
    (store.filters.sort_order && store.filters.sort_order !== "desc")
  );
});

const getActionTypeBadge = (action, type) => {
  const isBuy =
    action === 0 ||
    action === "0" ||
    String(type).toUpperCase() === "BUY" ||
    String(action).toUpperCase() === "BUY";
  return {
    label: isBuy ? "BUY" : "SELL",
    class: isBuy
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };
};

onMounted(() => {
  if (followerId.value) {
    store.setFollowerId(followerId.value);
    store.fetchAll();
  }
});

watch(
  followerId,
  (newId) => {
    if (newId) {
      store.setFollowerId(newId);
      store.fetchAll();
    }
  }
);
</script>

<template>
  <div class="space-y-6 min-h-screen">
    <!-- Top Bar Navigation / Header -->
    <div class="flex items-center justify-between gap-3 sm:gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">Follower Trade Book</h1>
          <span
            v-if="followerId"
            class="text-xs px-2.5 py-0.5 rounded-full bg-background border border-primary-border font-mono font-bold"
          >
            #{{ followerId }}
          </span>
        </div>
        <p class="text-xs text-secondary-text mt-0.5">
          Detailed deals, positions, orders, and execution records for this follower account.
        </p>
      </div>
    </div>

    <!-- Follower Profile Info & Key Metrics Section -->
    <div v-if="store.followerInfo" class="bg-card-background border border-primary-border/60 rounded-3xl p-5 space-y-4 shadow-none">
      <!-- Profile Header Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-primary-border/60">
        <div class="flex items-center gap-3.5">
          <div class="w-14 h-14 rounded-full bg-primary/50 flex items-center justify-center text-accent text-xs font-semibold shrink-0 overflow-hidden">
            <img :src="getAvatar(store.followerInfo.user?.id || store.followerInfo.id)" class="w-14 h-14 rounded-full object-cover" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-primary-text">
                {{ store.followerInfo.user?.name || store.followerInfo.user_name || 'Follower Account' }}
              </h2>
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                :class="store.followerInfo.status === 'active' || store.followerInfo.is_active ? 'bg-primary-green/10 text-primary-green border-primary-green/20' : 'bg-background text-secondary-text border-primary-border'"
              >
                {{ store.followerInfo.status || (store.followerInfo.is_active ? 'Active' : 'Inactive') }}
              </span>
            </div>
            <p class="text-xs text-secondary-text mt-0.5">
              Trading Account: <strong class="text-primary-text font-mono">#{{ store.followerInfo.account?.account_number || store.followerInfo.account_number || store.followerInfo.trading_account_id }}</strong>
              · Lot Type: <span class="capitalize text-primary font-semibold">{{ store.followerInfo.lot_type || 'Fixed' }}</span> (Value: {{ store.followerInfo.lot_value ?? 1 }})
              <span v-if="store.followerInfo.server || store.followerInfo.account?.server"> · Server: <span class="font-mono text-primary-text font-semibold">{{ store.followerInfo.server || store.followerInfo.account?.server }}</span></span>
            </p>
          </div>
        </div>
      </div>

      <!-- Metrics Grid Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <!-- 1. Total P&L -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Total P&L</p>
          <p class="text-xs sm:text-sm font-bold font-mono mt-0.5" :class="totalPositionsPnl >= 0 ? 'text-primary-green' : 'text-primary-red'">
            {{ formatPnl(totalPositionsPnl) }}
          </p>
        </div>

        <!-- 2. Realized P&L -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Realized P&L</p>
          <p class="text-xs sm:text-sm font-bold font-mono mt-0.5" :class="realizedPositionsProfit >= 0 ? 'text-primary-green' : 'text-primary-red'">
            {{ formatPnl(realizedPositionsProfit) }}
          </p>
        </div>

        <!-- 3. Floating P&L -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Floating P&L</p>
          <p class="text-xs sm:text-sm font-bold font-mono mt-0.5" :class="totalFloatingPnl >= 0 ? 'text-primary-green' : 'text-primary-red'">
            {{ formatPnl(totalFloatingPnl) }}
          </p>
        </div>

        <!-- 4. Equity -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Equity</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-primary-text mt-0.5">
            {{ formatCurrency(store.followerInfo.equity ?? store.followerInfo.account?.equity ?? store.followerInfo.account_equity) }}
          </p>
        </div>

        <!-- 5. Balance -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Balance</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-primary-text mt-0.5">
            {{ formatCurrency(store.followerInfo.balance ?? store.followerInfo.account?.balance ?? store.followerInfo.account_balance) }}
          </p>
        </div>

        <!-- 6. Total Lots -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Total Lots</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-primary-text mt-0.5">
            {{ store.dealsSummary?.total_volume ?? store.dealsSummary?.total_lot ?? store.followerInfo.total_lot ?? '0.00' }}
          </p>
        </div>

        <!-- 7. Total Deals -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Total Deals</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-primary-text mt-0.5">
            {{ store.dealsPagination?.total_items ?? store.dealsData?.length ?? 0 }}
          </p>
        </div>

        <!-- 8. Open Positions -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Open Positions</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-primary-text mt-0.5">
            {{ store.positionsPagination?.total_items ?? store.openLegs?.length ?? 0 }}
          </p>
        </div>

        <!-- 9. Pending Orders -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Pending Orders</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-primary-text mt-0.5">
            {{ store.ordersPagination?.total_items ?? store.ordersData?.length ?? 0 }}
          </p>
        </div>

        <!-- 10. Joined Date -->
        <div class="bg-background rounded-2xl p-3 text-center">
          <p class="text-[10px] text-secondary-text uppercase font-semibold">Joined Date</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-primary-text mt-0.5">
            {{ formatDate(store.followerInfo.created_at || store.followerInfo.joined_at) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Trade Book Tabs & Filter Toolbar -->
    <div class="space-y-3">
      <!-- Line 1: Tabs (Left) & Search + Refresh (Right) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <BaseTabs
          :model-value="store.activeTab"
          :tabs="tradeBookTabs"
          @update:model-value="onTabChange"
        />

        <div class="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <BaseSearch
            v-model="store.filters.search"
            placeholder="Search symbol, ticket..."
            container-class="w-full sm:w-64"
            @update:modelValue="onSearchInput"
          />

          <RefreshButton
            :loading="store.isRefreshing"
            title="Refresh"
            @click="store.fetchAll(true)"
          />
        </div>
      </div>

      <!-- Line 2: All Actions, Status, Results, and Newest (Sort) Dropdowns Bar -->
      <div class="flex flex-wrap items-center justify-between gap-2.5  rounded-2xl py-2.5">
        <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div class="w-full sm:w-36">
            <BaseSelect
              v-model="store.filters.action"
              :options="actionOptions"
              placeholder="All Actions"
              borderless
              rounded="full"
              @update:modelValue="onActionFilterChange"
            />
          </div>

          <div class="w-full sm:w-36">
            <BaseSelect
              v-model="store.filters.status"
              :options="statusOptions"
              placeholder="All Status"
              borderless
              rounded="full"
              @update:modelValue="onStatusFilterChange"
            />
          </div>

          <div class="w-full sm:w-36">
            <BaseSelect
              v-model="store.filters.result"
              :options="resultOptions"
              placeholder="All Result"
              borderless
              rounded="full"
              @update:modelValue="onResultFilterChange"
            />
          </div>
            <div class="w-full sm:w-40">
            <BaseSelect
              v-model="store.filters.sort_order"
              :options="sortOrderOptions"
              placeholder="Sort Order"
              borderless
              rounded="full"
              @update:modelValue="onSortOrderChange"
            />
          </div>

          <!-- Date Range Picker -->
          <BaseDateRangePicker
            class="w-fit"
            borderless
            placement="bottom-start"
            v-model="dateRange"
            @apply="handleDateApply"
            @clear="handleDateClear"
          />

          <button
            v-if="isAnyFilterActive"
            type="button"
            class="flex items-center justify-center px-4 h-9 rounded-full bg-background border border-primary-border text-primary-text text-xs font-medium hover:opacity-80 transition-all cursor-pointer shrink-0"
            @click="handleResetFilters"
          >
            Clear
          </button>

        </div>
      </div>
    </div>

    <!-- TAB 0: OPEN POSITIONS TABLE -->
    <div v-if="store.activeTab === 'open_legs'">
      <div class="bg-card-background border border-primary-border/60 rounded-3xl overflow-hidden shadow-none">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-background text-secondary-text uppercase text-[11px] font-semibold border-b border-primary-border">
              <tr>
                <th class="px-4 py-3.5 pl-6 sm:pl-8">Trade Ref</th>
                <th class="px-4 py-3.5">Symbol</th>
                <th class="px-4 py-3.5">Type</th>
                <th class="px-4 py-3.5">Volume</th>
                <th class="px-4 py-3.5">Entry Price</th>
                <th class="px-4 py-3.5">Current Price</th>
                <th class="px-4 py-3.5">Floating PnL</th>
                <th class="px-4 py-3.5">Account Mode</th>
                <th class="px-4 py-3.5 pr-6 sm:pr-8">Time Opened</th>
              </tr>
            </thead>
            <tbody v-if="store.openLegsLoading" class="divide-y divide-primary-border">
              <tr v-for="n in 3" :key="n" class="animate-pulse">
                <td colspan="9" class="px-4 py-3.5 bg-card-background/50">
                  <div class="h-3 bg-primary-border/60 rounded w-full"></div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="filteredOpenLegs.length === 0" class="divide-y divide-primary-border">
              <tr>
                <td colspan="9" class="text-center py-16 text-secondary-text text-xs">
                  No open positions currently.
                </td>
              </tr>
            </tbody>
            <tbody v-else class="divide-y divide-primary-border/60">
              <tr
                v-for="row in filteredOpenLegs"
                :key="row.id || row.position_id || row.ticket || row.real_trade_id"
                class="hover:bg-background/40 transition-colors"
              >
                <td class="px-4 py-3.5 pl-6 sm:pl-8 font-mono font-semibold text-primary-text">
                  <span v-if="row.trade_number" class="text-primary font-bold">{{ row.trade_number }}</span>
                  <span v-else>#{{ row.id || row.position_id || row.position || row.ticket }}</span>
                </td>
                <td class="px-4 py-3.5 font-semibold text-primary-text">
                  {{ row.symbol }}
                </td>
                <td class="px-4 py-3.5">
                  <BaseBadge :value="row.action ?? (row.type_name || row.type)" />
                </td>
                <td class="px-4 py-3.5 font-mono">
                  {{ row.volume || row.volume_initial || row.lot || 0 }}
                </td>
                <td class="px-4 py-3.5 font-mono text-primary-text">
                  {{ row.open_price || row.price_open || row.price || row.entry_price || '—' }}
                </td>
                <td class="px-4 py-3.5 font-mono text-secondary-text">
                  {{ row.current_price || row.price_current || livePNL[row.symbol]?.price || '—' }}
                </td>
                <td
                  class="px-4 py-3.5 font-mono font-bold"
                  :class="calculateLegFloatingPnl(row) >= 0 ? 'text-primary-green' : 'text-primary-red'"
                >
                  {{ formatPnl(calculateLegFloatingPnl(row)) }}
                </td>
                <td class="px-4 py-3.5">
                  <span
                    v-if="row.real_trade_id"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  >
                    Real Account
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary-text/10 text-secondary-text border border-primary-border"
                  >
                    Shadow
                  </span>
                </td>
                <td class="px-4 py-3.5 text-secondary-text whitespace-nowrap pr-6 sm:pr-8">
                  {{ formatDate(row.time_create || row.time || row.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 1: DEALS TABLE -->
    <div v-else-if="store.activeTab === 'deals'">
      <div class="bg-card-background border border-primary-border/60 rounded-3xl overflow-hidden shadow-none">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-background text-secondary-text uppercase text-[11px] font-semibold border-b border-primary-border">
              <tr>
                <th class="px-4 py-3.5 pl-6 sm:pl-8">Trade ID</th>
                <th class="px-4 py-3.5">Symbol</th>
                <th class="px-4 py-3.5">Type</th>
                <th class="px-4 py-3.5">Volume</th>
                <th class="px-4 py-3.5">Entry</th>
                <th class="px-4 py-3.5">Exit</th>
                <th class="px-4 py-3.5">PnL</th>
                <th class="px-4 py-3.5">Status</th>
                <th class="px-4 py-3.5">Time Opened</th>
                <th class="px-4 py-3.5 text-right pr-6 sm:pr-8">Time Closed</th>
              </tr>
            </thead>
            <tbody v-if="currentTabLoading" class="divide-y divide-primary-border">
              <tr v-for="n in 5" :key="n" class="animate-pulse">
                <td colspan="10" class="px-4 py-3.5 bg-card-background/50">
                  <div class="h-3 bg-primary-border/60 rounded w-full"></div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="filteredDealsData.length === 0" class="divide-y divide-primary-border">
              <tr>
                <td colspan="10" class="text-center py-16 text-secondary-text text-xs">
                  No deals found.
                </td>
              </tr>
            </tbody>
            <tbody v-else class="divide-y divide-primary-border/60">
              <tr
                v-for="row in filteredDealsData"
                :key="row.deal || row.ticket || row.id"
                class="hover:bg-background/40 transition-colors"
              >
                <td class="px-4 py-3.5 pl-6 sm:pl-8 font-mono font-semibold text-primary-text">
                  #{{ row.deal || row.ticket || row.id }}
                </td>
                <td class="px-4 py-3.5 font-semibold text-primary-text">
                  {{ row.symbol }}
                </td>
                <td class="px-4 py-3.5">
                  <BaseBadge :value="row.action ?? (row.type_name || row.type)" />
                </td>
                <td class="px-4 py-3.5 font-mono">
                  {{ row.volume || row.volume_initial || 0 }}
                </td>
                <td class="px-4 py-3.5 font-mono text-primary-text">
                  {{ row.price != null ? row.price : (row.entry_price != null ? row.entry_price : '—') }}
                </td>
                <td class="px-4 py-3.5 font-mono text-secondary-text">
                  {{ row.exit_price != null ? row.exit_price : '—' }}
                </td>
                <td
                  class="px-4 py-3.5 font-mono font-bold"
                  :class="(row.profit ?? row.pnl ?? 0) >= 0 ? 'text-primary-green' : 'text-primary-red'"
                >
                  {{ formatPnl(row.profit ?? row.pnl) }}
                </td>
                <td class="px-4 py-3.5">
                  <BaseBadge :value="row.status || 'Closed'" />
                </td>
                <td class="px-4 py-3.5 text-secondary-text whitespace-nowrap">
                  {{ formatDate(row.time || row.time_create || row.opened_at || row.created_at) }}
                </td>
                <td class="px-4 py-3.5 text-right pr-6 sm:pr-8 text-secondary-text whitespace-nowrap">
                  {{ formatDate(row.close_time || row.closed_at || row.time_close || (String(row.status || '').toUpperCase() === 'CLOSED' ? (row.time || row.closed_at) : null)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: POSITIONS TABLE -->
    <div v-else-if="store.activeTab === 'positions'">
      <div class="bg-card-background border border-primary-border/60 rounded-3xl overflow-hidden shadow-none">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-background text-secondary-text uppercase text-[11px] font-semibold border-b border-primary-border">
              <tr>
                <th class="px-4 py-3.5 pl-6 sm:pl-8">Trade ID</th>
                <th class="px-4 py-3.5">Symbol</th>
                <th class="px-4 py-3.5">Type</th>
                <th class="px-4 py-3.5">Volume</th>
                <th class="px-4 py-3.5">Entry</th>
                <th class="px-4 py-3.5">Exit</th>
                <th class="px-4 py-3.5">PnL</th>
                <th class="px-4 py-3.5">Status</th>
                <th class="px-4 py-3.5">Time Opened</th>
                <th class="px-4 py-3.5 text-right pr-6 sm:pr-8">Time Closed</th>
              </tr>
            </thead>
            <tbody v-if="currentTabLoading" class="divide-y divide-primary-border">
              <tr v-for="n in 5" :key="n" class="animate-pulse">
                <td colspan="10" class="px-4 py-3.5 bg-card-background/50">
                  <div class="h-3 bg-primary-border/60 rounded w-full"></div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="filteredPositionsData.length === 0" class="divide-y divide-primary-border">
              <tr>
                <td colspan="10" class="text-center py-16 text-secondary-text text-xs">
                  No positions found.
                </td>
              </tr>
            </tbody>
            <tbody v-else class="divide-y divide-primary-border/60">
              <tr
                v-for="row in filteredPositionsData"
                :key="row.position || row.ticket || row.id"
                class="hover:bg-background/40 transition-colors"
              >
                <td class="px-4 py-3.5 pl-6 sm:pl-8 font-mono font-semibold text-primary-text">
                  #{{ row.position || row.ticket || row.id }}
                </td>
                <td class="px-4 py-3.5 font-semibold text-primary-text">
                  {{ row.symbol }}
                </td>
                <td class="px-4 py-3.5">
                  <BaseBadge :value="row.action ?? (row.type_name || row.type)" />
                </td>
                <td class="px-4 py-3.5 font-mono">
                  {{ row.volume || row.volume_initial || row.volume_traded || 0 }}
                </td>
                <td class="px-4 py-3.5 font-mono text-primary-text">
                  {{ row.price_open || row.price || 0 }}
                </td>
                <td class="px-4 py-3.5 font-mono text-secondary-text">
                  {{ row.price_current || row.price_close || '—' }}
                </td>
                <td
                  class="px-4 py-3.5 font-mono font-bold"
                  :class="getPositionPnl(row) >= 0 ? 'text-primary-green' : 'text-primary-red'"
                >
                  {{ formatPnl(getPositionPnl(row)) }}
                </td>
                <td class="px-4 py-3.5">
                  <BaseBadge :value="row.status || 'Closed'" />
                </td>
                <td class="px-4 py-3.5 text-secondary-text whitespace-nowrap">
                  {{ formatDate(row.time_create || row.time || row.opened_at || row.created_at) }}
                </td>
                <td class="px-4 py-3.5 text-right pr-6 sm:pr-8 text-secondary-text whitespace-nowrap">
                  {{ formatDate(row.close_time || row.closed_at || row.time_close || (String(row.status || '').toUpperCase() === 'CLOSED' ? (row.time_update || row.updated_at) : null)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: ORDERS TABLE -->
    <div v-else-if="store.activeTab === 'orders'">
      <div class="bg-card-background border border-primary-border/60 rounded-3xl overflow-hidden shadow-none">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-background text-secondary-text uppercase text-[11px] font-semibold border-b border-primary-border">
              <tr>
                <th class="px-4 py-3.5 pl-6 sm:pl-8">Trade ID</th>
                <th class="px-4 py-3.5">Symbol</th>
                <th class="px-4 py-3.5">Type</th>
                <th class="px-4 py-3.5">Volume</th>
                <th class="px-4 py-3.5">Entry</th>
                <th class="px-4 py-3.5">Exit</th>
                <th class="px-4 py-3.5">PnL</th>
                <th class="px-4 py-3.5">Status</th>
                <th class="px-4 py-3.5">Time Opened</th>
                <th class="px-4 py-3.5 text-right pr-6 sm:pr-8">Time Closed</th>
              </tr>
            </thead>
            <tbody v-if="currentTabLoading" class="divide-y divide-primary-border">
              <tr v-for="n in 5" :key="n" class="animate-pulse">
                <td colspan="10" class="px-4 py-3.5 bg-card-background/50">
                  <div class="h-3 bg-primary-border/60 rounded w-full"></div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="filteredOrdersData.length === 0" class="divide-y divide-primary-border">
              <tr>
                <td colspan="10" class="text-center py-16 text-secondary-text text-xs">
                  No orders found.
                </td>
              </tr>
            </tbody>
            <tbody v-else class="divide-y divide-primary-border/60">
              <tr
                v-for="row in filteredOrdersData"
                :key="row.ticket || row.order || row.id"
                class="hover:bg-background/40 transition-colors"
              >
                <td class="px-4 py-3.5 pl-6 sm:pl-8 font-mono font-semibold text-primary-text">
                  #{{ row.ticket || row.order || row.id }}
                </td>
                <td class="px-4 py-3.5 font-semibold text-primary-text">
                  {{ row.symbol }}
                </td>
                <td class="px-4 py-3.5">
                  <BaseBadge :value="row.action ?? (row.type_name || row.type)" />
                </td>
                <td class="px-4 py-3.5 font-mono">
                  {{ row.volume_initial || row.volume || 0 }}
                </td>
                <td class="px-4 py-3.5 font-mono text-primary-text">
                  {{ row.price_open || row.price || 0 }}
                </td>
                <td class="px-4 py-3.5 font-mono text-secondary-text">
                  —
                </td>
                <td class="px-4 py-3.5 font-mono text-secondary-text">
                  —
                </td>
                <td class="px-4 py-3.5">
                  <BaseBadge :value="row.state_name || row.status || 'Placed'" />
                </td>
                <td class="px-4 py-3.5 text-secondary-text whitespace-nowrap">
                  {{ formatDate(row.time_setup || row.time || row.opened_at || row.created_at) }}
                </td>
                <td class="px-4 py-3.5 text-right pr-6 sm:pr-8 text-secondary-text whitespace-nowrap">
                  {{ formatDate(row.close_time || row.closed_at || row.time_expiration) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pagination Footer -->
    <div class="mt-4">
      <Pagination
        v-if="currentTabPagination.total_items > currentTabPagination.per_page"
        :pagination="currentTabPagination"
        @page-change="onPageChange"
      />
    </div>

    <!-- Disclaimer -->
    <AccountsDisclaimer />
  </div>
</template>
