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
            class="inline-flex items-center gap-1.5 bg-background text-primary-text text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
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
            {{ activeAccount?.account_type || activeAccount?.raw?.account_type }} <span v-if="activeAccount?.broker_leverage" class="text-xs font-semibold text-primary-text">
            • Leverage: 1:{{ activeAccount?.broker_leverage }}
          </span>
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-x-8 gap-y-2">
          <div class="flex items-center gap-1.5 text-sm text-secondary-text">
            <Tooltip text="Current available account balance" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
            <span>Balance:</span>
            <span class="font-bold text-primary-text tabular-nums">
              {{ formatNum(activeAccount?.balance) }} {{ currencyDisplay }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 text-sm text-secondary-text">
            <Tooltip text="Real-time floating profit and loss" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
            <span>PnL:</span>
            <span
              class="font-bold tabular-nums"
              :class="(activeAccount?.pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ (activeAccount?.pnl ?? 0) >= 0 ? "+" : "" }}{{ formatNum(activeAccount?.pnl) }} {{ currencyDisplay }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <template v-if="store.isLoading">
        <div v-for="n in 6" :key="n" class="bg-card-background rounded-2xl p-4 animate-pulse space-y-2">
          <div class="h-3 w-20 bg-primary-border/30 rounded" />
          <div class="h-6 w-24 bg-primary-border/30 rounded" />
        </div>
      </template>
      <template v-else>
        <div class="bg-card-background rounded-2xl p-4">
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[10px] uppercase tracking-wide text-secondary-text font-semibold">Current Balance</p>
            <Tooltip text="Current available account balance" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-lg font-bold truncate" :class="(store.summary?.net_flow ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ (store.summary?.net_flow ?? 0) >= 0 ? '+' : '' }}{{ store.summary?.current_balance ?? '0.00' }} {{ currencyDisplay }}
          </p>
        </div>
        <div class="bg-card-background rounded-2xl p-4">
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[10px] uppercase tracking-wide text-secondary-text font-semibold">Total Transactions</p>
            <Tooltip text="Total number of deposit, withdrawal and transfer transactions" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-lg font-bold text-primary-text">{{ store.summary?.total_transactions ?? 0 }}</p>
        </div>
        <div class="bg-card-background rounded-2xl p-4">
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[10px] uppercase tracking-wide text-secondary-text font-semibold">Total Credits</p>
            <Tooltip text="Total promotional or trading credits on account" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-lg font-bold text-green-600">+{{ formatNum(store.summary?.current_credit) }} {{ currencyDisplay }}</p>
        </div>
        <div class="bg-card-background rounded-2xl p-4">
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[10px] uppercase tracking-wide text-secondary-text font-semibold">Current Equity</p>
            <Tooltip text="Real-time account equity (Balance + Credit + Floating P&L)" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-lg font-bold text-green-600">{{ store.summary?.current_equity ?? '0.00' }} {{ currencyDisplay }}</p>
        </div>
        <div class="bg-card-background rounded-2xl p-4">
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[10px] uppercase tracking-wide text-secondary-text font-semibold">Total Deposit</p>
            <Tooltip text="Cumulative deposits made into this account" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-lg font-bold text-green-600">+{{ formatNum(store.summary?.total_deposit) }} {{ currencyDisplay }}</p>
        </div>
        <div class="bg-card-background rounded-2xl p-4">
          <div class="flex items-center gap-1.5 mb-1">
            <p class="text-[10px] uppercase tracking-wide text-secondary-text font-semibold">Total Withdrawal</p>
            <Tooltip text="Cumulative withdrawals made from this account" position="top" wrap>
              <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
            </Tooltip>
          </div>
          <p class="text-lg font-bold text-red-600">-{{ formatNum(store.summary?.total_withdrawal) }} {{ currencyDisplay }}</p>
        </div>
      </template>
    </div>

    <!-- Header Title (Matching Tickets style) -->
    <div>
      <h3 class="text-lg font-bold text-primary-text">
        Transaction Report
      </h3>
      <p class="text-xs text-secondary-text mt-0.5 font-medium">
        Detailed list of all deposits, withdrawals, and account transactions.
      </p>
    </div>

    <!-- Filters & Controls Toolbar -->
    <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Deposit / Withdrawal Filter Tabs -->
      <div class="inline-flex items-center gap-1 rounded-full bg-card-background p-1 border border-primary-border/40 max-w-full overflow-x-auto no-scrollbar h-10">
        <button
          v-for="tab in TYPE_TABS"
          :key="tab.value"
          type="button"
          @click="selectedType = tab.value"
          class="px-3.5 h-full flex items-center justify-center text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
          :class="
            selectedType === tab.value
              ? 'bg-button text-button-text font-bold'
              : 'text-secondary-text hover:text-primary-text'
          "
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Date Range Picker & Refresh Button Row -->
      <div class="flex items-center justify-between gap-3 w-full sm:w-auto">
        <div class="flex-1 sm:w-auto min-w-0 sm:min-w-[200px]">
          <BaseDateRangePicker
            v-model="dateRange"
            placeholder="Select Date Range"
            borderless
            placement="left"
          />
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <RefreshButton
            :loading="store.isLoading"
            title="Refresh Transactions"
            :icon-size="16"
            button-class="w-9 h-9"
            @click="onRefresh"
          />
        </div>
      </div>
    </div>

    <!-- WatchDataTable Container -->
    <div class="rounded-2xl overflow-hidden border-0">
      <WatchDataTable
        :columns="columns"
        :rows="filteredRows"
        :loading="store.isLoading"
        :page="store.pagination.page"
        :total-pages="store.pagination.total_pages"
        :sortable="true"
        @update:page="handlePageChange"
        empty-text="No transactions found"
      >
        <!-- Transaction Slot -->
        <template #cell-transaction_id="{ row }">
          <div class="py-0.5">
            <p class="text-sm font-medium text-primary-text">#{{ row.transaction_id }}</p>
            <p v-if="row.description" class="text-xs text-secondary-text max-w-[200px] truncate mt-0.5">
              {{ row.description }}
            </p>
          </div>
        </template>

        <!-- Type Slot -->
        <template #cell-type="{ value }">
          <BaseBadge :value="value" />
        </template>

        <!-- Direction Slot -->
        <template #cell-direction="{ value }">
          <BaseBadge :value="value" />
        </template>

        <!-- Amount Slot -->
        <template #cell-amount="{ row }">
          <span
            class="font-mono font-medium text-sm"
            :class="row.direction === 'credit' ? 'text-green-600' : 'text-red-600'"
          >
            {{ row.direction === 'credit' ? '+' : '-' }}{{ formatNum(row.amount) }} {{ currencyDisplay }}
          </span>
        </template>

        <!-- Reference Slot -->
        <template #cell-reference_id="{ value }">
          <span class="text-sm text-secondary-text font-medium">
            {{ value || "—" }}
          </span>
        </template>

        <!-- Date Slot -->
        <template #cell-created_at="{ value }">
          <span class="text-sm text-secondary-text font-medium">
            {{ formatDate(value) }}
          </span>
        </template>
      </WatchDataTable>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowUpRight, ArrowDownLeft, Info } from "lucide-vue-next";
import usFlg from "@/assets/us-flg.svg";

import { useAccountTransactionsStore } from "@/stores/client/transactions";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";

const store = useAccountTransactionsStore();
const accountsStore = useTradingAccountsStore();
const route = useRoute();
const router = useRouter();

const activeAccount = ref(null);
const selectedAccountId = ref(String(route.params.id || ""));

const TYPE_TABS = [
  { label: "All", value: "all" },
  { label: "Deposit", value: "deposit" },
  { label: "Withdrawal", value: "withdrawal" },
];

const selectedType = ref("all");
const dateRange = ref({ startDate: null, endDate: null });


const onRefresh = () => {
  store.fetchTransactions(selectedAccountId.value, true);
};

const filteredRows = computed(() => {
  let list = store.data || [];

  // Filter by Deposit / Withdrawal / Type
  if (selectedType.value && selectedType.value !== "all") {
    list = list.filter((row) => {
      const type = String(row.type || "").toLowerCase();
      const direction = String(row.direction || "").toLowerCase();
      if (selectedType.value === "deposit") {
        return type === "deposit" || direction === "credit";
      }
      if (selectedType.value === "withdrawal") {
        return type === "withdrawal" || direction === "debit";
      }
      return type === selectedType.value;
    });
  }

  // Filter by Date Range
  if (dateRange.value?.startDate && dateRange.value?.endDate) {
    const startTime = new Date(dateRange.value.startDate).getTime();
    const endTime = new Date(dateRange.value.endDate).setHours(23, 59, 59, 999);
    list = list.filter((row) => {
      if (!row.created_at) return false;
      const t = new Date(row.created_at).getTime();
      return t >= startTime && t <= endTime;
    });
  }

  return list;
});

const accountOptions = computed(() => {
  return (accountsStore.data || []).map((acc) => ({
    label: `${(acc.platform || acc.account_type || acc.trading_type || "MT5").toUpperCase()}: #${acc.account_number || acc.login || acc.id}${acc.broker_label ? ` (${acc.broker_label})` : ""}`,
    value: String(acc.id || acc.account_id || acc.login),
  }));
});

const currencyCode = computed(() => {
  return (activeAccount.value?.broker_currency || activeAccount.value?.currency || "USD").toUpperCase();
});

const currencyDisplay = computed(() => currencyCode.value);

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

const columns = [
  { key: "transaction_id", label: "Transaction", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "direction", label: "Direction", sortable: true },
  { key: "amount", label: "Amount", align: "right", sortable: true },
  { key: "reference_id", label: "Reference", align: "center", sortable: true },
  { key: "created_at", label: "Date", align: "right", sortable: true },
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
  router.replace({ name: "account-transactions", params: { id: newId } });
  store.fetchTransactions(newId, true);
};

const handlePageChange = (page) => {
  store.setPage(page);
  store.fetchTransactions(selectedAccountId.value, true);
};

const formatNum = (val) =>
  (val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (val) => {
  if (!val) return "—";
  const date = new Date(val);
  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${datePart} ${timePart}`;
};

const formatType = (t) =>
  t?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—";

const typeClass = (type) =>
  ({
    trade_pnl: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    fee_paid: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    deposit: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    withdrawal: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    bonus: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  }[type] ?? "bg-primary-border/20 text-secondary-text border-primary-border/40");

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
  store.fetchTransactions(initialId);
});
</script>