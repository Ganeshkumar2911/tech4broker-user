<template>
  <div class="space-y-6">
    <!-- Header & Navigation Tabs -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h4 class="text-primary-text font-bold text-lg">Your Wallet</h4>
        <p class="text-secondary-text text-xs">
          View your wallet balance, transactions, and fee history.
        </p>
      </div>

      <!-- Navigation Tabs -->
      <div id="tour-fm-wallet-tabs">
        <BaseTabs
          v-model="activeTab"
          :tabs="tabs"
        />
      </div>
    </div>

    <!-- Main Content Tab: Account Transactions -->
    <div v-if="activeTab === 'transactions'" class="space-y-6">
      <!-- Summary Cards Grid -->
      <div id="tour-fm-wallet-summary" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Skeleton Loading -->
        <template v-if="store.isLoading">
          <div
            v-for="n in 4"
            :key="n"
            class="bg-card-background rounded-3xl p-6 animate-pulse space-y-3"
          >
            <div class="h-3 w-24 bg-background rounded" />
            <div class="h-7 w-32 bg-background rounded" />
          </div>
        </template>

        <!-- FM Wallet Summary Cards -->
        <template v-else>
          <div class="bg-card-background rounded-3xl p-6">
            <div class="flex items-center gap-1.5 min-w-0 mb-1">
              <p class="text-[11px] text-secondary-text font-medium uppercase tracking-wider truncate">
                Total Deposit
              </p>
              <Tooltip text="Total deposit amount credited to your wallet" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <p class="text-2xl font-bold text-primary-green font-mono">
              +${{ formatNum(store.summary.total_deposit) }}
            </p>
          </div>

          <div class="bg-card-background rounded-3xl p-6">
            <div class="flex items-center gap-1.5 min-w-0 mb-1">
              <p class="text-[11px] text-secondary-text font-medium uppercase tracking-wider truncate">
                Wallet Balance
              </p>
              <Tooltip text="Current available wallet balance" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <p
              class="text-2xl font-bold font-mono"
              :class="
                store.summary.wallet_balance >= 0
                  ? 'text-primary-text'
                  : 'text-primary-red'
              "
            >
              ${{ formatNum(store.summary.wallet_balance) }}
            </p>
          </div>

          <div class="bg-card-background rounded-3xl p-6">
            <div class="flex items-center gap-1.5 min-w-0 mb-1">
              <p class="text-[11px] text-secondary-text font-medium uppercase tracking-wider truncate">
                Total FM Fee
              </p>
              <Tooltip text="Total management and performance fees earned" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <p class="text-2xl font-bold font-mono text-primary-text">
              ${{ formatNum(Math.abs(store.summary.total_fm_fee || 0)) }}
            </p>
          </div>

          <div class="bg-card-background rounded-3xl p-6">
            <div class="flex items-center gap-1.5 min-w-0 mb-1">
              <p class="text-[11px] text-secondary-text font-medium uppercase tracking-wider truncate">
                Total Withdrawal
              </p>
              <Tooltip text="Total withdrawals processed from your wallet" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <p class="text-2xl font-bold font-mono text-primary-red">
              -${{ formatNum(Math.abs(store.summary.total_withdrawal || 0)) }}
            </p>
          </div>
        </template>
      </div>

      <!-- Filters & Actions Toolbar -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <BaseSelect
            v-model="store.filters.type"
            :options="typeOptions"
            placeholder="All Types"
            class="w-full sm:w-44"
            rounded="full"
            :borderless="true"
            @update:modelValue="store.applyFilters()"
          />

          <!-- Reusable Base Date Range Picker -->
          <BaseDateRangePicker v-model="dateRange" placement="left" borderless />

          <button
            v-if="hasFilters"
            class="px-3 py-2 text-xs font-semibold text-secondary-text hover:text-primary-text hover:bg-background rounded-full transition-colors cursor-pointer"
            @click="handleResetFilters"
          >
            Clear Filters
          </button>
        </div>

        <div class="flex items-center gap-2">
          <Tooltip text="Refresh List">
            <RefreshButton
              :loading="store.isLoading"
              :icon-size="16"
              @click="store.fetchWallet(true)"
            />
          </Tooltip>
        </div>
      </div>

      <!-- Wallet Data Table using WatchDataTable -->
      <div id="tour-fm-wallet-table" class="bg-card-background border-0 shadow-none rounded-2xl sm:rounded-[28px] overflow-hidden">
        <WatchDataTable
          :show-tabs="false"
          :columns="columns"
          :rows="store.data"
          :loading="store.isLoading"
          :total-items="store.pagination.total_items"
          row-key="payment_id"
          :page="store.pagination.page"
          :total-pages="store.pagination.total_pages"
          empty-text="No wallet transactions found."
          @update:page="handlePageChange"
        >
          <!-- Cell: Payment ID / Reference -->
          <template #cell-payment_id="{ row }">
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-full bg-primary-blue/10 text-primary-blue flex items-center justify-center text-[10px] font-bold shrink-0"
              >
                #
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-primary-text font-mono">
                  #{{ row.reference_id || row.payment_id || "—" }}
                </span>
                <span
                  v-if="row.external_payment_id"
                  class="text-[10px] text-secondary-text font-mono truncate max-w-[120px]"
                  :title="row.external_payment_id"
                >
                  Ref: {{ row.external_payment_id }}
                </span>
                <span
                  v-else-if="row.reference_id && row.payment_id"
                  class="text-[10px] text-secondary-text font-mono truncate max-w-[120px]"
                >
                  ID: {{ row.payment_id }}
                </span>
              </div>
            </div>
          </template>

          <!-- Cell: Trading Account -->
          <template #cell-account_number="{ row }">
            <div
              v-if="String(row.type || '').toLowerCase() === 'fm_fee'"
              class="flex items-center gap-1.5"
            >
              <span class="font-bold text-primary-text font-mono">
                Wallet
              </span>
            </div>
            <div v-else class="flex flex-col gap-0.5">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-primary-text font-mono">
                  #{{ row.account_number || "—" }}
                </span>
                <span
                  v-if="row.broker_currency"
                  class="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-primary-border/40 text-secondary-text rounded"
                >
                  {{ row.broker_currency }}
                </span>
              </div>
              <div
                class="flex items-center gap-1.5 text-[10px] text-secondary-text"
              >
                <span v-if="row.trading_account_id">ID: {{ row.trading_account_id }}</span>
                <span
                  v-if="row.account_type"
                  class="capitalize font-semibold"
                  :class="accountTypeColor(row.account_type)"
                >
                  · {{ row.account_type }}
                </span>
              </div>
            </div>
          </template>

          <!-- Cell: Gateway / Method -->
          <template #cell-gateway="{ row }">
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-primary-text capitalize">
                {{ displayValue(row.gateway) }}
              </span>
              <span v-if="row.method" class="text-[10px] text-secondary-text capitalize">
                via {{ displayValue(row.method) }}
              </span>
            </div>
          </template>

          <!-- Cell: Type -->
          <template #cell-type="{ row }">
            <span
              class="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide border"
              :class="typeClass(row.type)"
            >
              {{ formatType(row.type) }}
            </span>
          </template>

          <!-- Cell: Description -->
          <template #cell-description="{ row }">
            <span
              class="text-xs font-medium text-secondary-text truncate max-w-[200px] block"
              :title="row.description || row.remarks || row.comment || '—'"
            >
              {{ row.description || row.remarks || row.comment || "—" }}
            </span>
          </template>

          <!-- Cell: Amount -->
          <template #cell-amount="{ row }">
            <div class="flex flex-col items-end">
              <span
                class="font-bold font-mono tabular-nums text-sm"
                :class="isIncome(row) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
              >
                {{ formatEntryAmount(row) }}
              </span>
              <span
                v-if="row.broker_currency?.toUpperCase() === 'USC'"
                class="text-[9px] text-secondary-text uppercase font-semibold"
              >
                USC
              </span>
            </div>
          </template>



          <!-- Cell: Date -->
          <template #cell-created_at="{ row }">
            <span
              class="text-xs font-medium text-secondary-text whitespace-nowrap font-mono"
            >
              {{ formatDate(row.created_at) }}
            </span>
          </template>
        </WatchDataTable>
      </div>
    </div>

    <!-- Secondary Tab: Internal Transfers -->
    <!-- <div v-else-if="activeTab === 'transfers'">
      <InternalTransfers />
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { Info } from "lucide-vue-next";
import { useFmWalletStore } from "@/stores/fm/yourWallet";
import BaseTabs from "@/components/base/BaseTabs.vue";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
// import InternalTransfers from "./InternalTransfers.vue";

const activeTab = ref("transactions");
const tabs = [
  { label: "Account Transactions", value: "transactions" },
  // { label: "Internal Transfers", value: "transfers" },
];

const store = useFmWalletStore();
const dateRange = ref([null, null]);

const columns = [
  {
    key: "payment_id",
    label: "ID / REFERENCE",
    headerClass: "pl-6 sm:pl-8",
    cellClass: "pl-6 sm:pl-8",
  },
  { key: "account_number", label: "TRADING ACCOUNT" },
  { key: "gateway", label: "PAYMENT METHOD" },
  { key: "type", label: "TYPE", align: "center" },
  { key: "description", label: "DESCRIPTION" },
  { key: "amount", label: "AMOUNT", align: "right" },
  {
    key: "created_at",
    label: "DATE",
    align: "right",
    headerClass: "pr-6 sm:pr-8",
    cellClass: "pr-6 sm:pr-8",
  },
];

const handlePageChange = (page) => {
  store.pagination.page = page;
  store.changePage(page);
};

const typeOptions = computed(() =>
  (store.filterOptions?.types ?? []).map((t) => ({
    label: formatType(t),
    value: t,
  })),
);

const hasFilters = computed(
  () => store.filters.type || store.filters.from_date || store.filters.to_date,
);

const formatDateToYYYYMMDD = (d) => {
  if (!d) return "";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

watch(
  dateRange,
  (newRange) => {
    const [start, end] = newRange || [];
    store.filters.from_date = formatDateToYYYYMMDD(start);
    store.filters.to_date = formatDateToYYYYMMDD(end);
    store.applyFilters();
  },
  { deep: true },
);

const handleResetFilters = () => {
  dateRange.value = [null, null];
  store.resetFilters();
};

const formatNum = (val) =>
  Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (val) =>
  val
    ? new Date(val).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatType = (t) =>
  t?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—";

const displayValue = (val) =>
  val === null || val === undefined || val === "" ? "—" : val;

const isIncome = (entry) => {
  const type = String(entry.type || "").toLowerCase();
  if (type === "deposit") return true;
  if (type === "withdrawal" || type === "withdraw") return false;
  return entry.amount >= 0;
};

const formatEntryAmount = (entry) => {
  const isUsc = entry.broker_currency?.toUpperCase() === "USC";
  const symbol = isUsc ? "USC " : "$";
  const amount = isUsc
    ? Math.abs(entry.amount || 0) * 100
    : Math.abs(entry.amount || 0);
  return `${isIncome(entry) ? "+" : "-"}${symbol}${formatNum(amount)}`;
};

const typeClass = (type) =>
  ({
    deposit: "bg-green-500/10 text-green-600 border-green-500/20",
    withdrawal: "bg-red-500/10 text-red-600 border-red-500/20",
    trade_pnl: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    fee_paid: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  })[type] ?? "bg-primary-border/20 text-secondary-text border-primary-border";

const statusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (["completed", "approved", "success", "active"].includes(s)) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }
  if (["pending", "processing"].includes(s)) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }
  if (["failed", "rejected", "cancelled"].includes(s)) {
    return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  }
  return "bg-secondary-text/10 text-secondary-text border-primary-border";
};

const accountTypeColor = (type) => {
  const t = String(type || "").toLowerCase();
  if (t === "live") return "text-green-600";
  if (t === "demo") return "text-blue-600";
  return "text-secondary-text";
};

onMounted(() => store.fetchWallet());
</script>
