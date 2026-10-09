<script setup>
import { computed, onMounted, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2 } from "lucide-vue-next";
import { useFollowerTradeBookStore } from "@/stores/fm/followerTradeBook";
import { useTickerStore } from "@/stores/shared/ticker";
import BaseTabs from "@/components/base/BaseTabs.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import { livePNL, calculateTotalFloatingPnl, calculateLegFloatingPnl } from "@/utils/livePNL.js";
import { subscribeTradeSymbols } from "@/utils/symbolUtils.js";
import { getAvatar } from "@/utils/avtar.js";

const route = useRoute();
const router = useRouter();
const store = useFollowerTradeBookStore();
const tickerStore = useTickerStore();

const followerId = computed(() => route.params.id);

const followerAccountNumber = computed(() => {
  return (
    localStorage.getItem("follower_account_number") ||
    store.followerInfo?.account?.account_number ||
    store.followerInfo?.account_number ||
    store.followerInfo?.trading_account_id ||
    "—"
  );
});

const fundManagerName = computed(() => {
  return (
    store.followerInfo?.fund_manager?.name ||
    store.followerInfo?.fund_manager?.label_name ||
    store.followerInfo?.fund_manager?.nickname ||
    store.followerInfo?.fund_manager?.user?.name ||
    store.followerInfo?.fund_manager_name ||
    store.followerInfo?.label_name ||
    store.followerInfo?.fm_name ||
    store.followerInfo?.name ||
    store.followerInfo?.offer?.fund_manager?.name ||
    store.followerInfo?.offer?.name ||
    localStorage.getItem("follower_fm_name") ||
    "Fund Manager"
  );
});

const fundManagerAvatarId = computed(() => {
  return (
    store.followerInfo?.fund_manager?.id ||
    store.followerInfo?.fund_manager_id ||
    store.followerInfo?.fm_id ||
    localStorage.getItem("follower_fm_avatar") ||
    store.followerInfo?.id
  );
});

const isHistory = computed(() => {
  return (
    route.query.from === "history" ||
    route.query.is_history === "true" ||
    route.query.source === "history" ||
    store.followerInfo?.status === "past" ||
    store.followerInfo?.status === "inactive" ||
    Boolean(store.followerInfo?.left_at)
  );
});

const tradeBookTabs = computed(() => {
  const tabs = [];

  if (!isHistory.value) {
    tabs.push({
      label: "Open Positions",
      value: "open_legs",
      count: store.openLegsFetched ? (store.openLegs?.length ?? 0) : undefined,
    });
  }

  tabs.push(
    {
      label: "Positions",
      value: "positions",
      count: store.tabState.positions?.isFetched
        ? (store.positionsPagination?.total_items ?? store.positionsData?.length ?? 0)
        : undefined,
    },
    {
      label: "Deals",
      value: "deals",
      count: store.tabState.deals?.isFetched
        ? (store.dealsPagination?.total_items ?? store.dealsData?.length ?? 0)
        : undefined,
    },
    {
      label: "Orders",
      value: "orders",
      count: store.tabState.orders?.isFetched
        ? (store.ordersPagination?.total_items ?? store.ordersData?.length ?? 0)
        : undefined,
    }
  );

  return tabs;
});

const actionOptions = [
  { label: "All Actions", value: "" },
  { label: "BUY", value: "0" },
  { label: "SELL", value: "1" },
];

const sortOrderOptions = [
  { label: "Newest First", value: "desc" },
  { label: "Oldest First", value: "asc" },
];

const perPageOptions = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const openLegsColumns = [
  { key: "trade_ref", label: "Trade Ref", width: "140px" },
  { key: "symbol", label: "Symbol", width: "120px" },
  { key: "type", label: "Type", width: "110px" },
  { key: "volume", label: "Volume", width: "100px" },
  { key: "open_price", label: "Entry Price", width: "120px" },
  { key: "current_price", label: "Current Price", width: "120px" },
  { key: "floating_pnl", label: "Floating PnL", width: "130px" },
  { key: "account_mode", label: "Account Mode", width: "130px" },
  { key: "time_open", label: "Time Opened", width: "160px" },
  { key: "action", label: "Action", align: "right", width: "100px" },
];

const positionsColumns = [
  { key: "position", label: "Trade ID", width: "130px" },
  { key: "symbol", label: "Symbol", width: "120px" },
  { key: "type", label: "Type", width: "110px" },
  { key: "volume", label: "Volume", width: "100px" },
  { key: "price_open", label: "Entry", width: "120px" },
  { key: "price_current", label: "Exit", width: "120px" },
  { key: "pnl", label: "PnL", width: "130px" },
  { key: "status", label: "Status", width: "110px" },
  { key: "time_create", label: "Time Opened", width: "160px" },
  { key: "close_time", label: "Time Closed", align: "right", width: "160px" },
];

const dealsColumns = [
  { key: "deal", label: "Trade ID", width: "130px" },
  { key: "symbol", label: "Symbol", width: "120px" },
  { key: "type", label: "Type", width: "110px" },
  { key: "volume", label: "Volume", width: "100px" },
  { key: "price", label: "Entry", width: "120px" },
  { key: "exit_price", label: "Exit", width: "120px" },
  { key: "pnl", label: "PnL", width: "130px" },
  { key: "status", label: "Status", width: "110px" },
  { key: "time", label: "Time Opened", width: "160px" },
  { key: "close_time", label: "Time Closed", align: "right", width: "160px" },
];

const ordersColumns = [
  { key: "ticket", label: "Trade ID", width: "130px" },
  { key: "symbol", label: "Symbol", width: "120px" },
  { key: "type", label: "Type", width: "110px" },
  { key: "volume", label: "Volume", width: "100px" },
  { key: "price_open", label: "Entry", width: "120px" },
  { key: "exit_price", label: "Exit", width: "120px" },
  { key: "pnl", label: "PnL", width: "130px" },
  { key: "status", label: "Status", width: "110px" },
  { key: "time_setup", label: "Time Opened", width: "160px" },
  { key: "close_time", label: "Time Closed", align: "right", width: "160px" },
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
  if (store.activeTab !== "open_legs") {
    store.applyFilters();
  }
};

const onActionFilterChange = (val) => {
  store.filters.action = val;
  if (store.activeTab !== "open_legs") {
    store.applyFilters();
  }
};

const onSortOrderChange = (val) => {
  store.filters.sort_order = val;
  if (store.activeTab !== "open_legs") {
    store.applyFilters();
  }
};

const onPageChange = (page) => {
  store.setPage(store.activeTab, page);
};

const onPerPageChange = (perPage) => {
  store.setPerPage(store.activeTab, perPage);
};

const currentTabPagination = computed(() => {
  return store.tabState[store.activeTab]?.pagination || { page: 1, per_page: 10, total_items: 0, total_pages: 1 };
});

const currentTabLoading = computed(() => {
  if (store.activeTab === "open_legs") return store.openLegsLoading;
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

const dynamicEnumFilters = computed(() => {
  if (store.activeTab === "open_positions" || store.activeTab === "open_legs") {
    return [];
  }

  const meta = store.filterMetadata;
  const currentTab = store.activeTab;

  let tabMeta = null;
  if (meta?.data?.[currentTab]) {
    tabMeta = meta.data[currentTab];
  } else if (meta?.[currentTab]) {
    tabMeta = meta[currentTab];
  }

  // Fallback defaults matching backend schema if filter API data is loading or null
  if (!tabMeta) {
    const fallbacks = {
      positions: {
        action: {
          type: "enum",
          options: [
            { label: "BUY", value: "BUY" },
            { label: "SELL", value: "SELL" },
          ],
        },
        result: {
          type: "enum",
          options: [
            { label: "profit", value: "profit" },
            { label: "loss", value: "loss" },
            { label: "breakeven", value: "breakeven" },
          ],
        },
        status: {
          type: "enum",
          options: [
            { label: "OPEN", value: "OPEN" },
            { label: "CLOSED", value: "CLOSED" },
          ],
        },
      },
      deals: {
        action: {
          type: "enum",
          options: [
            { label: "BUY", value: "BUY" },
            { label: "SELL", value: "SELL" },
          ],
        },
        entry: {
          type: "enum",
          options: [
            { label: "IN", value: "IN" },
            { label: "OUT", value: "OUT" },
            { label: "INOUT", value: "INOUT" },
            { label: "OUT_BY", value: "OUT_BY" },
          ],
        },
        result: {
          type: "enum",
          options: [
            { label: "profit", value: "profit" },
            { label: "loss", value: "loss" },
            { label: "breakeven", value: "breakeven" },
          ],
        },
      },
      orders: {
        type: {
          type: "enum",
          options: [
            { label: "BUY", value: "BUY" },
            { label: "SELL", value: "SELL" },
          ],
        },
        state: {
          type: "enum",
          options: [
            { label: "STARTED", value: "STARTED" },
            { label: "PLACED", value: "PLACED" },
            { label: "CANCELED", value: "CANCELED" },
            { label: "PARTIAL", value: "PARTIAL" },
            { label: "FILLED", value: "FILLED" },
            { label: "REJECTED", value: "REJECTED" },
            { label: "EXPIRED", value: "EXPIRED" },
          ],
        },
      },
    };
    tabMeta = fallbacks[currentTab] || {};
  }

  const list = [];
  for (const [filterKey, filterDef] of Object.entries(tabMeta)) {
    if (!filterDef || typeof filterDef !== "object") continue;

    if (filterDef.type === "enum" && Array.isArray(filterDef.options)) {
      const rawTitle = filterKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const placeholder = `All ${rawTitle}`;

      const options = filterDef.options.map((o) => {
        if (typeof o === "string") {
          return { label: o, value: o };
        }
        return {
          label: o.label || o.name || o.value,
          value: String(o.value),
        };
      });

      if (!options.some((o) => o.value === "" || o.value === null)) {
        options.unshift({ label: placeholder, value: "" });
      }

      list.push({
        key: filterKey,
        placeholder,
        options,
      });
    }
  }

  return list;
});

const onDynamicFilterChange = (key, val) => {
  store.setFilter(key, val);
};

const isAnyFilterActive = computed(() => {
  if (store.activeTab === "open_legs") {
    return Boolean(store.filters.search || store.filters.action);
  }
  return (
    Boolean(dateRange.value) ||
    Object.entries(store.filters).some(([key, val]) => {
      if (key === "sort_order") return val && val !== "desc";
      return val !== "" && val !== null && val !== undefined;
    })
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

const handleClosePosition = (leg) => {
  const positionId = leg.id || leg.position_id;
  if (positionId) {
    store.closePosition({ position_id: positionId });
  } else if (leg.real_trade_id) {
    store.closePosition({ real_trade_id: leg.real_trade_id });
  }
};

onMounted(() => {
  if (followerId.value) {
    store.setFollowerId(followerId.value);
    if (isHistory.value) {
      store.setActiveTab("positions");
    }
    store.fetchAll();
  }
});

watch(
  isHistory,
  (historyMode) => {
    if (historyMode && store.activeTab === "open_legs") {
      store.setActiveTab("positions");
    }
  },
  { immediate: true }
);

watch(
  followerId,
  (newId) => {
    if (newId) {
      store.setFollowerId(newId);
      if (isHistory.value) {
        store.setActiveTab("positions");
      }
      store.fetchAll();
    }
  }
);
</script>

<template>
  <div class="space-y-6">
    <!-- Follower Profile Info Card -->
    <div v-if="store.followerInfo" class="bg-card-background rounded-3xl p-5 shadow-none">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-14 h-14 rounded-full bg-primary/50 flex items-center justify-center text-accent text-xs font-semibold shrink-0 overflow-hidden">
            <img :src="getAvatar(fundManagerAvatarId)" class="w-14 h-14 rounded-full object-cover" />
          </div>
          <div>
            <div class="flex items-center flex-wrap gap-2">
              <h2 class="text-base font-bold text-primary-text">
                {{ fundManagerName }}
              </h2>
              <span
                class="px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider border"
                :class="store.followerInfo.status === 'active' ? 'bg-primary-green/10 text-primary-green border-primary-green/20' : 'bg-background text-secondary-text border-primary-border'"
              >
                {{ store.followerInfo.status || 'Active' }}
              </span>
              <span
                v-if="followerId"
                class="text-2xs py-0.5 font-mono font-bold text-primary-text"
              >
                Follower ID: #{{ followerId }}
              </span>
            </div>
            <p class="text-xs text-secondary-text mt-0.5">
              Trading Account: <strong class="text-primary-text font-mono">#{{ followerAccountNumber }}</strong>
              · Lot: <span class="capitalize text-primary font-semibold">{{ store.followerInfo.lot_type || 'Fixed' }}</span> ({{ store.followerInfo.lot_value ?? 1 }})
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-background rounded-2xl p-3 text-center">
            <p class="text-2xs text-secondary-text uppercase font-semibold">Total P&L</p>
            <p class="text-xs font-bold font-mono mt-0.5" :class="totalPositionsPnl >= 0 ? 'text-primary-green' : 'text-primary-red'">
              {{ formatPnl(totalPositionsPnl) }}
            </p>
          </div>
          <div class="bg-background rounded-2xl p-3 text-center">
            <p class="text-2xs text-secondary-text uppercase font-semibold">Realized</p>
            <p class="text-xs font-bold font-mono mt-0.5" :class="realizedPositionsProfit >= 0 ? 'text-primary-green' : 'text-primary-red'">
              {{ formatPnl(realizedPositionsProfit) }}
            </p>
          </div>
          <div class="bg-background rounded-2xl p-3 text-center">
            <p class="text-2xs text-secondary-text uppercase font-semibold">Floating</p>
            <p class="text-xs font-bold font-mono mt-0.5" :class="totalFloatingPnl >= 0 ? 'text-primary-green' : 'text-primary-red'">
              {{ formatPnl(totalFloatingPnl) }}
            </p>
          </div>
          <div class="bg-background rounded-2xl p-3 text-center">
            <p class="text-2xs text-secondary-text uppercase font-semibold">Joined Date</p>
            <p class="text-xs font-bold text-primary-text mt-0.5">
              {{ store.followerInfo?.joined_at || "—" }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Trade Book Tabs & Filter Toolbar -->
    <div class="rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-3">
      <!-- Top Row: Tabs & Search + Refresh -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Tabs -->
        <div class="w-full md:w-auto overflow-x-auto max-w-full shrink-0 scrollbar-none">
          <BaseTabs
            :model-value="store.activeTab"
            :tabs="tradeBookTabs"
            @update:model-value="onTabChange"
          />
        </div>

        <!-- Quick Search + Refresh Button -->
        <div class="flex items-center gap-2 w-full md:w-auto justify-end">
          <BaseSearch
            v-model="store.filters.search"
            placeholder="Search symbol, ticket..."
            container-class="w-full md:w-64"
            wrapper-class="border border-primary-border"
            @update:modelValue="onSearchInput"
          />

          <RefreshButton
            :loading="store.isRefreshing"
            title="Refresh"
            @click="store.fetchAll(true)"
          />
        </div>
      </div>

      <!-- Filter Controls Row (Dynamic API filters + Date Range + Sort + Clear Filters) -->
      <div
        v-if="store.activeTab === 'open_legs' || dynamicEnumFilters.length > 0 || isAnyFilterActive"
        class="pt-3 border-t border-primary-border/60 flex flex-wrap items-center gap-2.5"
      >
        <!-- Action Filter for Open Positions tab -->
        <template v-if="store.activeTab === 'open_legs'">
          <div class="w-full sm:w-36 md:w-40">
            <BaseSelect
              v-model="store.filters.action"
              :options="actionOptions"
              placeholder="All Actions"
              borderless
              rounded="full"
              @update:modelValue="onActionFilterChange"
            />
          </div>
        </template>

        <!-- Dynamic Enum Filters from API metadata -->
        <template v-else>
          <div
            v-for="filter in dynamicEnumFilters"
            :key="filter.key"
            class="w-full sm:w-36 md:w-40"
          >
            <BaseSelect
              :model-value="store.filters[filter.key] ?? ''"
              :options="filter.options"
              :placeholder="filter.placeholder"
              borderless
              rounded="full"
              @update:modelValue="onDynamicFilterChange(filter.key, $event)"
            />
          </div>

          <!-- Date Range Picker -->
          <BaseDateRangePicker
            class="w-fit"
            borderless
            placement="bottom-end"
            v-model="dateRange"
            @apply="handleDateApply"
            @clear="handleDateClear"
          />

          <!-- Sort Order Dropdown -->
          <div class="w-full sm:w-36 md:w-40">
            <BaseSelect
              v-model="store.filters.sort_order"
              :options="sortOrderOptions"
              placeholder="Sort Order"
              borderless
              rounded="full"
              @update:modelValue="onSortOrderChange"
            />
          </div>
        </template>

        <!-- Clear Filters Button -->
        <button
          v-if="isAnyFilterActive"
          type="button"
          class="px-4 py-2 text-xs font-medium text-secondary-text hover:text-primary-text transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 bg-background border border-primary-border rounded-full h-10"
          @click="handleResetFilters"
        >
          <span>Clear Filters</span>
        </button>
      </div>
    </div>

    <!-- TAB 0: OPEN POSITIONS (OPEN LEGS) TABLE -->
    <div v-if="store.activeTab === 'open_legs'">
      <DataTable
        :columns="openLegsColumns"
        :rows="filteredOpenLegs"
        :loading="currentTabLoading"
        row-key="id"
        empty-text="No Open Positions"
        empty-subtitle="There are currently no open trades active for this account."
      >
        <template #cell-trade_ref="{ row }">
          <span v-if="row.trade_number" class="text-primary font-bold font-mono">{{ row.trade_number }}</span>
          <span v-else class="font-mono font-semibold text-primary-text">#{{ row.id || row.position_id || row.position || row.ticket }}</span>
        </template>

        <template #cell-symbol="{ row }">
          <span class="font-semibold text-primary-text">{{ row.symbol }}</span>
        </template>

        <template #cell-type="{ row }">
          <BaseBadge :value="row.action ?? (row.type_name || row.type)" />
        </template>

        <template #cell-volume="{ row }">
          <span class="font-mono">{{ row.volume || row.volume_initial || row.lot || 0 }}</span>
        </template>

        <template #cell-open_price="{ row }">
          <span class="font-mono text-primary-text">{{ row.open_price || row.price_open || row.price || row.entry_price || '—' }}</span>
        </template>

        <template #cell-current_price="{ row }">
          <span class="font-mono text-secondary-text">{{ row.current_price || row.price_current || livePNL[row.symbol]?.price || '—' }}</span>
        </template>

        <template #cell-floating_pnl="{ row }">
          <span
            class="font-mono font-bold"
            :class="calculateLegFloatingPnl(row) >= 0 ? 'text-primary-green' : 'text-primary-red'"
          >
            {{ formatPnl(calculateLegFloatingPnl(row)) }}
          </span>
        </template>

        <template #cell-account_mode="{ row }">
          <span
            v-if="row.real_trade_id"
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          >
            Real Account
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-secondary-text/10 text-secondary-text border border-primary-border"
          >
            Copy Trading
          </span>
        </template>

        <template #cell-time_open="{ row }">
          <span class="text-secondary-text whitespace-nowrap">{{ row.time_open || row.opened_at || row.time_create || row.created_at || row.time || "—" }}</span>
        </template>

        <template #cell-action="{ row }">
          <div class="flex justify-end">
            <button
              v-if="row.real_trade_id"
              type="button"
              :disabled="store.closingPositionId === (row.id || row.position_id || row.real_trade_id)"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer border-0 disabled:opacity-50"
              @click="handleClosePosition(row)"
            >
              <Loader2 v-if="store.closingPositionId === (row.id || row.position_id || row.real_trade_id)" class="w-3 h-3 animate-spin" />
              <span>{{ store.closingPositionId === (row.id || row.position_id || row.real_trade_id) ? 'Closing...' : 'Close' }}</span>
            </button>
            <span v-else class="text-secondary-text/60 text-xs">—</span>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- TAB 1: POSITIONS TABLE -->
    <div v-else-if="store.activeTab === 'positions'">
      <DataTable
        :columns="positionsColumns"
        :rows="store.positionsData"
        :loading="currentTabLoading"
        :page="currentTabPagination.page"
        :total-pages="currentTabPagination.total_pages"
        :per-page="currentTabPagination.per_page"
        :total-items="currentTabPagination.total_items"
        :per-page-options="perPageOptions"
        @page-change="onPageChange"
        @per-page-change="onPerPageChange"
        row-key="id"
        empty-text="No Positions History"
        empty-subtitle="No closed position records match your selected filters."
      >
        <template #cell-position="{ row }">
          <span class="font-mono font-semibold text-primary-text">#{{ row.position || row.ticket || row.id }}</span>
        </template>

        <template #cell-symbol="{ row }">
          <span class="font-semibold text-primary-text">{{ row.symbol }}</span>
        </template>

        <template #cell-type="{ row }">
          <BaseBadge :value="row.action ?? (row.type_name || row.type)" />
        </template>

        <template #cell-volume="{ row }">
          <span class="font-mono">{{ row.volume_traded || row.volume_initial || row.volume || 0 }}</span>
        </template>

        <template #cell-price_open="{ row }">
          <span class="font-mono text-primary-text">{{ row.price_open || row.price || 0 }}</span>
        </template>

        <template #cell-price_current="{ row }">
          <span class="font-mono text-secondary-text">{{ row.price_current || row.price_close || '—' }}</span>
        </template>

        <template #cell-pnl="{ row }">
          <span
            class="font-mono font-bold"
            :class="getPositionPnl(row) >= 0 ? 'text-primary-green' : 'text-primary-red'"
          >
            {{ formatPnl(getPositionPnl(row)) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :value="row.status || 'Closed'" />
        </template>

        <template #cell-time_create="{ row }">
          <span class="text-secondary-text whitespace-nowrap">{{ row.time_create || row.time || row.opened_at || row.created_at || "—" }}</span>
        </template>

        <template #cell-close_time="{ row }">
          <div class="text-right">
            <span class="text-secondary-text whitespace-nowrap">{{ row.close_time || row.closed_at || row.time_close || (String(row.status || '').toUpperCase() === 'CLOSED' ? (row.time_update || row.updated_at) : null) || "—" }}</span>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- TAB 2: DEALS TABLE -->
    <div v-else-if="store.activeTab === 'deals'">
      <DataTable
        :columns="dealsColumns"
        :rows="store.dealsData"
        :loading="currentTabLoading"
        :page="currentTabPagination.page"
        :total-pages="currentTabPagination.total_pages"
        :per-page="currentTabPagination.per_page"
        :total-items="currentTabPagination.total_items"
        :per-page-options="perPageOptions"
        @page-change="onPageChange"
        @per-page-change="onPerPageChange"
        row-key="id"
        empty-text="No Deals History"
        empty-subtitle="No deal execution records match your selected filters."
      >
        <template #cell-deal="{ row }">
          <span class="font-mono font-semibold text-primary-text">#{{ row.deal || row.ticket || row.id }}</span>
        </template>

        <template #cell-symbol="{ row }">
          <span class="font-semibold text-primary-text">{{ row.symbol }}</span>
        </template>

        <template #cell-type="{ row }">
          <BaseBadge :value="row.action ?? (row.type_name || row.type)" />
        </template>

        <template #cell-volume="{ row }">
          <span class="font-mono">{{ row.volume || row.volume_initial || 0 }}</span>
        </template>

        <template #cell-price="{ row }">
          <span class="font-mono text-primary-text">{{ row.price != null ? row.price : (row.entry_price != null ? row.entry_price : '—') }}</span>
        </template>

        <template #cell-exit_price="{ row }">
          <span class="font-mono text-secondary-text">{{ row.exit_price != null ? row.exit_price : '—' }}</span>
        </template>

        <template #cell-pnl="{ row }">
          <span
            class="font-mono font-bold"
            :class="(row.profit ?? row.pnl ?? 0) >= 0 ? 'text-primary-green' : 'text-primary-red'"
          >
            {{ formatPnl(row.profit ?? row.pnl) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :value="row.status || 'Closed'" />
        </template>

        <template #cell-time="{ row }">
          <span class="text-secondary-text whitespace-nowrap">{{ row.time || row.time_create || row.opened_at || row.created_at || "—" }}</span>
        </template>

        <template #cell-close_time="{ row }">
          <div class="text-right">
            <span class="text-secondary-text whitespace-nowrap">{{ row.close_time || row.closed_at || row.time_close || (String(row.status || '').toUpperCase() === 'CLOSED' ? (row.time || row.closed_at) : null) || "—" }}</span>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- TAB 3: ORDERS TABLE -->
    <div v-else-if="store.activeTab === 'orders'">
      <DataTable
        :columns="ordersColumns"
        :rows="store.ordersData"
        :loading="currentTabLoading"
        :page="currentTabPagination.page"
        :total-pages="currentTabPagination.total_pages"
        :per-page="currentTabPagination.per_page"
        :total-items="currentTabPagination.total_items"
        :per-page-options="perPageOptions"
        @page-change="onPageChange"
        @per-page-change="onPerPageChange"
        row-key="id"
        empty-text="No Orders Found"
        empty-subtitle="No pending or historical order records match your selected filters."
      >
        <template #cell-ticket="{ row }">
          <span class="font-mono font-semibold text-primary-text">#{{ row.ticket || row.order || row.id }}</span>
        </template>

        <template #cell-symbol="{ row }">
          <span class="font-semibold text-primary-text">{{ row.symbol }}</span>
        </template>

        <template #cell-type="{ row }">
          <BaseBadge :value="row.action ?? (row.type_name || row.type)" />
        </template>

        <template #cell-volume="{ row }">
          <span class="font-mono">{{ row.volume_initial || row.volume || 0 }}</span>
        </template>

        <template #cell-price_open="{ row }">
          <span class="font-mono text-primary-text">{{ row.price_open || row.price || 0 }}</span>
        </template>

        <template #cell-exit_price="{ row }">
          <span class="font-mono text-secondary-text">—</span>
        </template>

        <template #cell-pnl="{ row }">
          <span class="font-mono text-secondary-text">—</span>
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :value="row.state_name || row.status || 'Placed'" />
        </template>

        <template #cell-time_setup="{ row }">
          <span class="text-secondary-text whitespace-nowrap">{{ row.time_setup || row.time || row.opened_at || row.created_at || "—" }}</span>
        </template>

        <template #cell-close_time="{ row }">
          <div class="text-right">
            <span class="text-secondary-text whitespace-nowrap">{{ row.close_time || row.closed_at || row.time_expiration || "—" }}</span>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
