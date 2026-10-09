<template>
  <div class="min-h-screen pb-8">
    <div class="mx-auto">
      <!-- ========================================= -->
      <!-- SUMMARY CARD (IB REPORT STYLE WITH ANIMATION) -->
      <!-- ========================================= -->
      <div
        id="tour-ib-wallet-card"
        class="relative mt-4 space-y-4 overflow-hidden rounded-[35px] bg-[#171d31] p-6 sm:p-8 text-white shadow-xl transition-all duration-300 group"
      >
        <!-- Card Shine Animation -->
        <div class="card-shine pointer-events-none"></div>

        <!-- Ambient Background Glows -->
        <div
          class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        ></div>
        <div
          class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
        ></div>

        <!-- Header -->
        <div class="relative z-10 flex items-start justify-between">
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full bg-[#232941] px-4 py-2 border border-white/5"
            >
              <img
                :src="usFlg"
                class="w-4 h-3.5 rounded-[1px] object-cover"
                alt="US Flag"
              />
              <span class="text-[13px] font-semibold uppercase tracking-wide">
                US Dollar
              </span>
            </div>
          </div>

          <Tooltip :text="showBalance ? 'Hide Balance' : 'Show Balance'" position="top">
            <button
              @click="showBalance = !showBalance"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#232941] hover:bg-[#2e3654] transition cursor-pointer"
              aria-label="Toggle details visibility"
            >
              <span class="material-symbols-outlined text-sm sm:text-base">
                {{ showBalance ? "visibility" : "visibility_off" }}
              </span>
            </button>
          </Tooltip>
        </div>

        <!-- Wallet Balance -->
        <div class="relative z-10 space-y-0.5">
          <div class="flex items-center gap-1.5 text-[#8e94a7]">
            <Tooltip
              text="Current available IB wallet balance"
              position="top"
              wrap
            >
              <Info
                :size="11"
                class="text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
              />
            </Tooltip>
            <span class="text-[13px]">Wallet Balance</span>
          </div>

          <div class="flex items-baseline gap-2">
            <h2
              class="text-[23px] font-bold leading-none tracking-tight font-mono"
            >
              {{
                showBalance ? `$${formatNum(summary.wallet_balance)}` : "***"
              }}
            </h2>
            <span class="text-xs font-semibold text-white">USD</span>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div
          class="relative z-10 grid grid-cols-1 sm:grid-cols-2 overflow-hidden rounded-2xl bg-[#22283b] divide-y sm:divide-y-0 sm:divide-x divide-[#32384d] border border-white/5"
        >
          <!-- Total Commission -->
          <div class="p-4">
            <div class="flex items-center gap-1.5 text-[#8f96aa]">
              <Tooltip
                text="Total commission earned from client trading activity"
                position="top"
                wrap
              >
                <Info
                  :size="11"
                  class="text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
              <span class="text-[13px]">Total Commission</span>
            </div>
            <div class="flex items-baseline gap-2 mt-1.5">
              <h3
                class="text-[23px] font-bold leading-none text-[#22c55e] font-mono"
              >
                {{
                  showBalance
                    ? `+$${formatNum(summary.total_commission || 0)}`
                    : "***"
                }}
              </h3>
              <span class="text-xs font-semibold text-white">USD</span>
            </div>
          </div>

          <!-- Total Withdrawal -->
          <div class="p-4 sm:text-right">
            <div
              class="flex items-center justify-start sm:justify-end gap-1.5 text-[#8f96aa]"
            >
              <Tooltip
                text="Total amount withdrawn from your IB wallet"
                position="top"
                wrap
              >
                <Info
                  :size="11"
                  class="text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
              <span class="text-[13px]">Total Withdrawal</span>
            </div>
            <div
              class="flex items-baseline justify-start sm:justify-end gap-2 mt-1.5"
            >
              <h3 class="text-[23px] font-bold leading-none font-mono">
                {{
                  showBalance
                    ? `$${formatNum(Math.abs(summary.total_debit || summary.total_withdrawal || 0))}`
                    : "***"
                }}
              </h3>
              <span class="text-xs font-semibold text-white">USD</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================= -->
      <!-- FILTER BAR (OUTSIDE DATATABLE CARD) -->
      <!-- ========================================= -->
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <!-- Date Range Picker (50% on mobile, auto on desktop) -->
        <div class="w-[calc(50%-6px)] sm:w-auto">
          <BaseDateRangePicker
            v-model="dateRange"
            borderless
            placement="left"
            placeholder="Select Date Range"
            @update:modelValue="onDateRangeChange"
          />
        </div>

        <!-- Type Filter Select (50% on mobile, w-44 on desktop) -->
        <div class="w-[calc(50%-6px)] sm:w-44">
          <BaseSelect
            v-model="store.filters.type"
            :options="typeOptions"
            placeholder="Select Type"
            borderless
            rounded="full"
            @update:modelValue="store.applyFilters()"
          />
        </div>

        <!-- Clear Filters Button -->
        <button
          v-if="hasActiveFilters"
          @click="clearAllFilters"
          class="rounded-full px-4 py-2 text-xs font-medium text-secondary-text hover:bg-background hover:text-primary-text transition-colors cursor-pointer border border-primary-border"
        >
          Clear
        </button>

        <!-- Refresh Button at the End -->
        <Tooltip text="Refresh IB Wallet Transactions" position="left" class="ml-auto">
          <RefreshButton
            :loading="store.isLoading"
            @click="handleRefresh"
          />
        </Tooltip>
      </div>

      <!-- ========================================= -->
      <!-- DATATABLE SECTION -->
      <!-- ========================================= -->
      <div
        id="tour-ib-wallet-history"
        class="mt-6 overflow-hidden rounded-[28px] bg-card-background border-0 shadow-none"
      >
        <!-- Data Table -->
        <DataTable
          :columns="columns"
          :rows="store.data"
          :loading="store.isLoading"
          :skeleton-rows="6"
          row-key="ledger_id"
          :page="store.pagination.page"
          :total-pages="store.pagination.total_pages"
          :total-items="store.pagination.total_items"
          @update:page="store.changePage"
        >
          <!-- Custom ID Cell -->
          <template #cell-transaction_id="{ row }">
            <span class="font-bold underline cursor-pointer text-primary-text">
              #{{ row.transaction_id || row.id || "—" }}
            </span>
          </template>

          <!-- Custom Type Cell -->
          <template #cell-type="{ row }">
            <BaseBadge :value="row.type" />
          </template>

          <!-- Custom Amount Cell -->
          <template #cell-amount="{ row }">
            <span
              class="font-semibold tabular-nums"
              :class="
                Number(row.amount) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              "
            >
              {{ Number(row.amount) >= 0 ? "+" : "-" }}${{
                formatNum(Math.abs(row.amount))
              }}
            </span>
          </template>

          <!-- Custom Balance Before Cell -->
          <template #cell-balance_before="{ row }">
            <span class="text-secondary-text tabular-nums">
              ${{ formatNum(row.balance_before) }}
            </span>
          </template>

          <!-- Custom Balance After Cell -->
          <template #cell-balance_after="{ row }">
            <span class="text-primary-text tabular-nums font-medium">
              ${{ formatNum(row.balance_after) }}
            </span>
          </template>

          <!-- Custom Description Cell -->
          <template #cell-description="{ row }">
            <span
              class="text-secondary-text max-w-[200px] truncate block"
              :title="row.description"
            >
              {{ parseDesc(row.description) }}
            </span>
          </template>

          <!-- Custom Reference Cell -->
          <template #cell-reference_id="{ row }">
            <span class="text-secondary-text">
              {{ row.reference_id || "—" }}
            </span>
          </template>

          <!-- Custom Date Cell -->
          <template #cell-created_at="{ row }">
            <span class="text-secondary-text text-xs">
              {{ formatDateString(row.created_at) }}
            </span>
          </template>

          <!-- Empty State -->
          <template #empty>
            <EmptyState
              class="py-12"
              title="No Ledger Records"
              subtitle="No transaction records match your selected filters."
            />
          </template>
        </DataTable>
      </div>

      <!-- Disclaimer -->
      <AccountsDisclaimer class="mt-10" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { RefreshCw, Wallet, Info } from "lucide-vue-next";
import { useIbWalletStore } from "@/stores/ib/wallet";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import usFlg from "@/assets/us-flg.svg";

const store = useIbWalletStore();

// Card visibility state
const showBalance = ref(true);

// Date range state
const dateRange = ref([null, null]);

// Table Columns configuration
const columns = [
  {
    key: "transaction_id",
    label: "ID",
    tooltip: "Unique transaction identifier",
    headerClass: "pl-6 sm:pl-8",
    cellClass: "pl-6 sm:pl-8",
  },
  { key: "type", label: "TYPE", tooltip: "Transaction transaction type (Deposit, Withdrawal, etc.)" },
  { key: "balance_before", label: "BAL. BEFORE", tooltip: "Wallet balance before transaction" },
  { key: "amount", label: "AMOUNT", tooltip: "Transaction amount credited or debited" },
  { key: "balance_after", label: "BAL. AFTER", tooltip: "Wallet balance after transaction" },
  { key: "description", label: "DESCRIPTION", tooltip: "Transaction description or remarks" },
  { key: "reference_id", label: "REFERENCE", tooltip: "External reference number or payment ID" },
  {
    key: "created_at",
    label: "CREATED DATE",
    tooltip: "Timestamp when transaction was processed",
    align: "right",
    headerClass: "pr-6 sm:pr-8",
    cellClass: "pr-6 sm:pr-8",
  },
];

// Computed Summary
const summary = computed(() => store.summary ?? {});

// Computed Type Options for BaseSelect
const typeOptions = computed(() => {
  const typesList = store.filterOptions?.types?.length
    ? store.filterOptions.types
    : ["deposit", "withdrawal", "fee_paid"];
  const excluded = ["trade_pnl", "tradepnl", "ib_commission", "commission"];
  const filteredTypes = typesList.filter(
    (t) => !excluded.includes(String(t).toLowerCase()),
  );
  const options = [];
  filteredTypes.forEach((t) => {
    options.push({
      label: formatTypeLabel(t),
      value: t,
    });
  });
  return options;
});

// Check if any filters are currently active
const hasActiveFilters = computed(() => {
  return (
    !!store.filters.type || !!store.filters.from_date || !!store.filters.to_date
  );
});

// Label for date range display
const activeDateRangeLabel = computed(() => {
  if (store.filters.from_date && store.filters.to_date) {
    return `${store.filters.from_date} to ${store.filters.to_date}`;
  }
  return "";
});

// Date Range Picker Handler
const onDateRangeChange = (val) => {
  if (Array.isArray(val) && val[0] && val[1]) {
    const startDate = formatDateToYYYYMMDD(val[0]);
    const endDate = formatDateToYYYYMMDD(val[1]);
    store.filters.from_date = startDate;
    store.filters.to_date = endDate;
  } else {
    store.filters.from_date = "";
    store.filters.to_date = "";
  }
  store.applyFilters();
};

// Debounced Search Input Handler
let searchTimer = null;
const onSearchInput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    store.applyFilters();
  }, 400);
};

// Refresh Action Handler
const handleRefresh = () => {
  store.fetchWalletLedger(true);
};

// Clear All Filters
const clearAllFilters = () => {
  clearTimeout(searchTimer);
  dateRange.value = [null, null];
  store.resetFilters();
};

// Format Helpers
function formatNum(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateString(val) {
  if (!val) return "—";
  const date = new Date(val);
  if (isNaN(date.getTime())) return val;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateToYYYYMMDD(date) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTypeLabel(type) {
  if (!type) return "—";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseDesc(desc) {
  if (!desc) return "—";
  return desc.trim();
}

function getTypeBadgeClass(type) {
  switch (type) {
    case "deposit":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "withdrawal":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "ib_commission":
    case "commission":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "trade_pnl":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "fee_paid":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    default:
      return "bg-secondary-text/10 text-secondary-text border-primary-border";
  }
}

// Fetch initial data on mount
onMounted(() => {
  store.fetchWalletLedger();
});
</script>

<style scoped>
.card-shine {
  position: absolute;
  top: -40%;
  left: -60%;
  width: 45%;
  height: 180%;
  transform: rotate(25deg);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.03),
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.03),
    transparent
  );
  animation: shine 6s ease-in-out infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-140%) rotate(25deg);
  }
  35% {
    transform: translateX(220%) rotate(25deg);
  }
  100% {
    transform: translateX(220%) rotate(25deg);
  }
}
</style>
