<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <template v-if="store.loading">
        <div v-for="n in 2" :key="n" class="bg-card-background rounded-3xl p-6 animate-pulse space-y-3">
          <div class="h-3 w-24 bg-background rounded" />
          <div class="h-7 w-28 bg-background rounded" />
        </div>
      </template>
      <template v-else>
        <div class="bg-card-background rounded-3xl p-6">
          <p class="text-[11px] uppercase tracking-wider text-secondary-text mb-1 font-medium">Total Internal Deposit</p>
          <p class="text-2xl font-bold font-mono text-primary-green">+${{ formatNum(store.summary.total_deposit) }}</p>
        </div>
        <div class="bg-card-background rounded-3xl p-6">
          <p class="text-[11px] uppercase tracking-wider text-secondary-text mb-1 font-medium">Total Internal Withdrawal</p>
          <p class="text-2xl font-bold font-mono text-primary-red">-${{ formatNum(store.summary.total_withdrawal) }}</p>
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

        <BaseDateRangePicker
          v-model="dateRange"
          borderless
          placement="left"
        />

        <button
          v-if="hasFilters"
          class="px-3 py-2 text-xs font-semibold text-secondary-text hover:text-primary-text hover:bg-background rounded-full transition-colors cursor-pointer"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>

      <div class="flex items-center gap-2">
        <Tooltip text="Refresh List">
          <RefreshButton
            :loading="store.loading"
            :icon-size="16"
            @click="store.fetchTransfers(true)"
          />
        </Tooltip>
      </div>
    </div>

    <!-- Internal Transfers Data Table using WatchDataTable -->
    <div class="bg-card-background border-0 shadow-none rounded-2xl sm:rounded-[28px] overflow-hidden">
      <WatchDataTable
        :show-tabs="false"
        :columns="columns"
        :rows="store.data"
        :loading="store.loading"
        :total-items="store.pagination.total_items"
        row-key="ledger_id"
        :page="store.pagination.page"
        :total-pages="store.pagination.total_pages"
        empty-text="No internal transfers found."
        @update:page="handlePageChange"
      >
        <!-- Custom Cell: Ledger ID / Description -->
        <template #cell-ledger_id="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="w-7 h-7 rounded-full bg-primary-blue/10 text-primary-blue flex items-center justify-center text-[10px] font-bold shrink-0"
            >
              #
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-1.5 mb-0.5">
                <span class="font-bold text-primary-text font-mono">#{{ row.ledger_id }}</span>
                <span
                  v-if="row.transaction_source"
                  class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-primary-border/40 text-secondary-text rounded"
                >
                  {{ row.transaction_source?.replace('_', ' ') }}
                </span>
              </div>
              <p class="text-[11px] text-secondary-text max-w-[280px] truncate" :title="row.description">
                {{ row.description || '—' }}
              </p>
              <span v-if="row.reference_id" class="text-[9px] text-secondary-text font-mono mt-0.5">
                Ref: {{ row.reference_id }}
              </span>
            </div>
          </div>
        </template>

        <!-- Custom Cell: Trading Account -->
        <template #cell-account_number="{ row }">
          <div class="flex flex-col">
            <span class="font-bold text-primary-text font-mono">#{{ row.account_number || '—' }}</span>
            <span class="text-[10px] text-secondary-text capitalize">
              {{ row.account_type }} · {{ row.broker_currency }}
            </span>
          </div>
        </template>

        <!-- Custom Cell: Type -->
        <template #cell-type="{ row }">
          <span
            class="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide border"
            :class="typeClass(row.type)"
          >
            {{ formatType(row.type) }}
          </span>
        </template>

        <!-- Custom Cell: Amount -->
        <template #cell-amount="{ row }">
          <div class="flex flex-col items-end">
            <span
              class="font-bold font-mono tabular-nums text-sm"
              :class="row.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
            >
              {{ row.type === 'deposit' ? '+' : '-' }}{{ formatMoney(row.amount, row.broker_currency) }}
            </span>
            <span class="text-[9px] text-secondary-text tabular-nums mt-0.5">
              Bal: {{ formatMoney(row.balance_before, row.broker_currency) }} ➜ {{ formatMoney(row.balance_after, row.broker_currency) }}
            </span>
          </div>
        </template>

        <!-- Custom Cell: Date -->
        <template #cell-created_at="{ row }">
          <span class="text-xs font-medium text-secondary-text whitespace-nowrap font-mono">
            {{ formatDate(row.created_at) }}
          </span>
        </template>
      </WatchDataTable>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { useInternalTransfersStore } from "@/stores/fm/internalTransfers";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";

const store = useInternalTransfersStore();
const dateRange = ref([null, null]);

const columns = [
  {
    key: "ledger_id",
    label: "LEDGER ID / DESCRIPTION",
    headerClass: "pl-6 sm:pl-8",
    cellClass: "pl-6 sm:pl-8",
  },
  { key: "account_number", label: "TRADING ACCOUNT" },
  { key: "type", label: "TYPE", align: "center" },
  { key: "amount", label: "AMOUNT", align: "right" },
  {
    key: "created_at",
    label: "DATE",
    align: "right",
    headerClass: "pr-6 sm:pr-8",
    cellClass: "pr-6 sm:pr-8",
  },
];

const typeOptions = computed(() =>
  (store.filterOptions.types ?? []).map((t) => ({
    label: formatType(t),
    value: t,
  }))
);

const hasFilters = computed(
  () => store.filters.type || store.filters.from_date || store.filters.to_date
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
  { deep: true }
);

const clearFilters = () => {
  dateRange.value = [null, null];
  store.resetFilters();
};

const refresh = () => {
  store.fetchTransfers(true);
};

const handlePageChange = (page) => {
  store.setPage(page);
};

const formatNum = (val) =>
  Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (val) => {
  if (!val) return "—";
  const date = new Date(val);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formattedDate} ${formattedTime}`;
};

const formatType = (t) =>
  t?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—";

const typeClass = (type) =>
  ({
    deposit: "bg-green-500/10 text-green-600 border-green-500/20",
    withdrawal: "bg-red-500/10 text-red-600 border-red-500/20",
  }[type] ?? "bg-primary-border/20 text-secondary-text border-primary-border");

const formatMoney = (amount, currency) => {
  const absAmount = Math.abs(amount ?? 0);
  const isUsc = currency?.toUpperCase() === "USC";
  const displayAmount = isUsc ? absAmount * 100 : absAmount;
  if (!currency) return `$${formatNum(displayAmount)}`;
  return /^[A-Z]{3}$/.test(currency)
    ? `${currency} ${formatNum(displayAmount)}`
    : `${currency}${formatNum(displayAmount)}`;
};

onMounted(() => {
  store.fetchTransfers();
});
</script>
