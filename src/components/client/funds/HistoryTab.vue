<template>
  <div class="space-y-6">
    <!-- Header + Filter Tabs Bar -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <!-- Left Filters: Level 1 (Main Mode) -->
      <div class="flex items-center gap-3 px-4">
        <!-- Level 1: Account Transactions | Internal Transfer -->
        <AccountFilterTabs
          :model-value="mainMode"
          :tabs="mainTabs"
          bordered
          @update:model-value="setMainMode"
        />
      </div>

      <!-- Right Filters: Level 2 (All | Deposit | Withdrawals) & DatePicker -->
      <div class="flex items-center gap-3 self-start md:self-auto flex-wrap pr-4">
        <!-- Level 2: All | Deposit | Withdrawals -->
        <AccountFilterTabs
          :model-value="typeFilter"
          :tabs="subTabs"
          bordered
          @update:model-value="onTypeFilterChange"
        />

        <BaseDateRangePicker
          borderless
          v-model="dateRange"
          bg-class="bg-card-background border border-primary-border"
        />

        <!-- <DownloadButton label="Export" bordered @click="exportData" /> -->
      </div>
    </div>


    <!-- Table Container -->
    <div class="rounded-2xl overflow-hidden">
      <WatchDataTable
        :columns="columns"
        :rows="filteredRows"
        :loading="loading"
        :page="pagination.page"
        :total-pages="pagination.total_pages"
        :total-items="pagination.total_items"
        :per-page="pagination.per_page"
        :per-page-options="[10, 20, 50, 100]"
        sortable
        empty-text="No transaction history found"
        @update:page="onPageChange"
        @page-change="onPageChange"
        @per-page-change="onPerPageChange"
        @update:per-page="onPerPageChange"
      >
        <!-- Date Slot -->
        <template #cell-created_at="{ value }">
          <span class="text-xs text-secondary-text font-medium">
            {{ formatDate(value) }}
          </span>
        </template>

        <!-- Trading Account Slot -->
        <template #cell-account_number="{ row }">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-primary-text">
              #{{ row.account_number || "—" }}
            </span>
            <BaseBadge
              v-if="row.account_type"
              :value="row.account_type"
              size="2xs"
              text-case="uppercase"
            />
          </div>
        </template>

        <!-- Type Slot -->
        <template #cell-type="{ value }">
          <BaseBadge :value="value" />
        </template>

        <!-- Method Slot (Account Transactions) -->
        <template #cell-method="{ row }">
          <span class="text-sm font-medium text-primary-text capitalize">
            {{ row.method || row.gateway || "—" }}
          </span>
        </template>

        <!-- Description Slot (Internal Transfers) -->
        <template #cell-description="{ value }">
          <span class="text-sm text-secondary-text font-medium">
            {{ value || "—" }}
          </span>
        </template>

        <!-- Amount Slot -->
        <template #cell-amount="{ row }">
          <span
            class="font-mono font-medium text-sm"
            :class="
              String(row.type).toLowerCase() === 'deposit' ||
              Number(row.amount) > 0
                ? 'text-green-600'
                : 'text-red-600'
            "
          >
          {{ row.broker_currency === 'USC' ? row.amount * 100 : row.amount }}
          </span>
        </template>

        <!-- Status Slot (Account Transactions) -->
        <template #cell-approval_status="{ row }">
          <div class="flex justify-end">
            <BaseBadge :value="row.approval_status || row.payment_status" />
          </div>
        </template>

        <!-- Balance After Slot (Internal Transfers) -->
        <template #cell-balance_after="{ row }">
          <span class="font-mono text-sm font-medium text-primary-text">
            {{ formatMoney(row.balance_after, row.broker_currency) }}
          </span>
        </template>
      </WatchDataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import AccountFilterTabs from "@/components/client/accounts/AccountFilterTabs.vue";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import DownloadButton from "@/components/base/DownloadButton.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const snackbar = useSnackbarStore();

// Main Mode: 'transactions' | 'internal_transfers'
const mainMode = ref("transactions");

const mainTabs = [
  { label: "Account Transactions", value: "transactions" },
  { label: "Internal Transfer", value: "internal_transfers" },
];

// Sub Filter: 'all' | 'deposit' | 'withdrawal'
const typeFilter = ref("all");

const subTabs = [
  { label: "All", value: "all" },
  { label: "Deposit", value: "deposit" },
  { label: "Withdrawals", value: "withdrawal" },
];

const dateRange = ref([null, null]);
const loading = ref(false);
const rows = ref([]);

const pagination = reactive({
  page: 1,
  per_page: 10,
  total_items: 0,
  total_pages: 1,
});

const summary = ref(null);

const formatDateToYYYYMMDD = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const columns = computed(() => {
  if (mainMode.value === "transactions") {
    return [
      {
        key: "created_at",
        label: "Date",
      },
      { key: "account_number", label: "Trading Account" },
      { key: "type", label: "Type" },
      { key: "method", label: "Method / Gateway" },
      { key: "amount", label: "Amount", align: "right" },
      {
        key: "approval_status",
        label: "Status",
        align: "right",
      },
    ];
  } else {
    return [
      {
        key: "created_at",
        label: "Date",
      },
      { key: "account_number", label: "Trading Account" },
      { key: "type", label: "Type" },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount", align: "right" },
      {
        key: "balance_after",
        label: "Balance After",
        align: "right",
      },
    ];
  }
});

const fetchHistoryData = () => {
  loading.value = true;
  const endpoint =
    mainMode.value === "transactions"
      ? urls.wallet.list
      : urls.wallet.internalTransfers;

  const params = {
    page: pagination.page,
    per_page: pagination.per_page,
  };

  if (typeFilter.value !== "all") {
    params.type = typeFilter.value;
  }

  const [start, end] = dateRange.value || [];
  if (start) {
    const fromStr = formatDateToYYYYMMDD(start);
    if (fromStr) params.from_date = fromStr;
  }
  if (end) {
    const toStr = formatDateToYYYYMMDD(end);
    if (toStr) params.to_date = toStr;
  }

  const successHandler = (res) => {
    const dataObj = res?.data || res || [];
    rows.value = Array.isArray(dataObj) ? dataObj : dataObj?.data || [];

    if (res?.pagination) {
      const savedPerPage = pagination.per_page;
      Object.assign(pagination, res.pagination);
      if (res.pagination.per_page) {
        pagination.per_page = Number(res.pagination.per_page);
      } else {
        pagination.per_page = savedPerPage;
      }
    }
    if (res?.summary) {
      summary.value = res.summary;
    }
    loading.value = false;
  };

  const failureHandler = (err) => {
    loading.value = false;
    rows.value = [];
    snackbar.show(err?.message || "Failed to load history.", "error");
  };

  apiRequest(urls.KEYS.GET, endpoint, {
    params,
    isTokenRequired: true,
    cancelPrevious: true,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

watch(
  dateRange,
  () => {
    pagination.page = 1;
    fetchHistoryData();
  },
  { deep: true },
);

const setMainMode = (mode) => {
  if (mainMode.value === mode) return;
  mainMode.value = mode;
  typeFilter.value = "all";
  pagination.page = 1;
  fetchHistoryData();
};

const onTypeFilterChange = (val) => {
  typeFilter.value = val;
  pagination.page = 1;
  fetchHistoryData();
};

const onPageChange = (newPage) => {
  pagination.page = newPage;
  fetchHistoryData();
};

const onPerPageChange = (newPerPage) => {
  const count =
    typeof newPerPage === "object" && newPerPage !== null
      ? (newPerPage.per_page ?? newPerPage.value)
      : newPerPage;
  const num = Number(count);
  if (!isNaN(num) && num > 0) {
    pagination.per_page = num;
    pagination.page = 1;
    fetchHistoryData();
  }
};

const filteredRows = computed(() => {
  const [start, end] = dateRange.value;
  if (!start || !end) return rows.value;

  return rows.value.filter((item) => {
    const dateVal = item.created_at || item.date;
    if (!dateVal) return true;
    const itemDate = new Date(dateVal);
    if (isNaN(itemDate.getTime())) return true;
    return itemDate >= start && itemDate <= end;
  });
});

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (amount, currency = "USD") => {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `${amount || 0} ${currency || "USD"}`;
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency || "USD"}`;
};

const getTypeClass = (type) => {
  const t = String(type).toLowerCase();
  if (t === "deposit") {
    return "bg-green-500/10 text-green-600 border-green-500/20";
  }
  if (t === "withdrawal") {
    return "bg-red-500/10 text-red-600 border-red-500/20";
  }
  return "bg-blue-500/10 text-blue-600 border-blue-500/20";
};

const getStatusClass = (status) => {
  const s = String(status).toLowerCase();
  if (
    s === "approved" ||
    s === "paid" ||
    s === "success" ||
    s === "completed"
  ) {
    return "bg-green-500/10 text-green-600 border-green-500/20";
  }
  if (s === "pending" || s === "in_progress") {
    return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  }
  if (s === "rejected" || s === "failed" || s === "cancelled") {
    return "bg-red-500/10 text-red-600 border-red-500/20";
  }
  return "bg-gray-500/10 text-gray-600 border-gray-500/20";
};

const exportData = () => {
  if (!filteredRows.value.length) {
    snackbar.show("No data available to export.", "info");
    return;
  }
  snackbar.show("Exporting transaction history...", "info");
};

onMounted(() => {
  fetchHistoryData();
});
</script>
