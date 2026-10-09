<template>
  <div>
    <!-- ========================================= -->
    <!-- FILTER BAR -->
    <!-- ========================================= -->

    <div
      class="mt-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4"
    >
      <!-- Top Filter Bar -->
      <div class="flex items-center gap-3 sm:gap-4 flex-wrap">
        <!-- Date Range -->
        <div class="w-full sm:w-auto">
          <BaseDateRangePicker v-model="dateRange" placement="left" borderless />
        </div>

        <!-- Instrument -->
        <div class="relative w-full sm:w-auto">
          <BaseSelect
            v-model="instrument"
            :options="instruments"
            borderless
            rounded="full"
            width="160px"
            height="42px"
            placeholder="All Instrument"
          />
        </div>
      </div>
    </div>

    <!-- ========================================= -->
    <!-- SUMMARY -->
    <!-- ========================================= -->

    <div class="mt-6 rounded-[28px] bg-card-background p-6 sm:p-8 border-0 shadow-none">
      <div
        class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-6"
      >
        <div
          v-for="(item, idx) in summaryCards"
          :key="idx"
          class="px-2 md:px-2 space-y-1"
        >
          <p class="text-xs font-bold text-secondary-text">
            {{ item.title }}
          </p>

          <h2 class="font-bold leading-none text-primary-text">
            {{ money(item.amount) }}
            <span class="font-bold text-primary-text"> USD </span>
          </h2>

          <p class="text-xs text-secondary-text">
            {{ money(item.lots) }} Standard Lots
          </p>
        </div>
      </div>
    </div>

    <!-- ========================================= -->
    <!-- TABLE -->
    <!-- ========================================= -->

    <div
      class="mt-6 overflow-hidden rounded-[28px] "
    >
      <!-- Mode Toggle: Date vs Account -->
      <div
        class="flex h-10 w-full rounded-full bg-card-background border border-primary-border p-1 mb-6"
      >
        <button
          v-for="mode in reportModes"
          :key="mode.value"
          @click="changeMode(mode.value)"
          :class="[
            'h-8 flex-1 rounded-full text-sm font-semibold transition cursor-pointer flex items-center justify-center',
            reportMode === mode.value
              ? 'bg-button text-button-text font-bold shadow-sm'
              : 'text-secondary-text hover:text-primary-text',
          ]"
        >
          {{ mode.label }}
        </button>
      </div>

      <!-- Search on left, Period Pills + Download & Refresh at the right end -->
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4"
      >
        <BaseSearch
          v-model="keyword"
          placeholder="Search..."
          container-class="w-full sm:w-[280px]"
        />

        <div class="flex flex-wrap items-center gap-3 shrink-0">
          <!-- Period Pills -->
          <div
            class="inline-flex items-center h-10 rounded-full bg-card-background border border-primary-border p-1"
          >
            <button
              v-for="p in periods"
              :key="p.value"
              @click="changePeriod(p.value)"
              :class="[
                'h-8 rounded-full px-4 text-xs font-semibold flex items-center justify-center transition cursor-pointer',
                period === p.value
                  ? 'bg-button text-button-text font-bold shadow-sm'
                  : 'text-secondary-text hover:text-primary-text',
              ]"
            >
              {{ p.label }}
            </button>
          </div>

          <DownloadButton @click="downloadReport" />
          <RefreshButton
            :loading="loading"
            title="Refresh"
            @click="refreshReport"
          />
        </div>
      </div>

      <!-- Table -->
      <DataTable
        :columns="activeColumns"
        :rows="filteredReports"
        :loading="loading"
        :show-summary="true"
      >
        <template #cell-notional="{ value }">
          {{ money(value) }}
        </template>

        <template #cell-rebate="{ value }">
          {{ money(value) }}
        </template>

        <template #empty>
          <EmptyState
            class="flex-1 justify-center min-w-[500px] py-12"
            title="No Data"
            subtitle="There is no data to show you right now"
          />
        </template>
      </DataTable>
    </div>

    <!-- ========================================= -->
    <!-- DISCLAIMER -->
    <!-- ========================================= -->
    <AccountsDisclaimer class="mt-10" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import DownloadButton from "@/components/base/DownloadButton.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import EmptyState from "@/components/base/EmptyState.vue";

/* ==========================================================
   FILTERS
========================================================== */

const dateType = ref("month_to_date");
const dateTypes = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Month to date", value: "month_to_date" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Custom", value: "custom" },
];

const instrument = ref("all");
const instruments = [
  { label: "All Instrument", value: "all" },
  { label: "Forex", value: "forex" },
  { label: "Gold", value: "gold" },
  { label: "Silver", value: "silver" },
  { label: "Indices", value: "indices" },
  { label: "Crypto", value: "crypto" },
  { label: "Commodities", value: "commodities" },
];

const end = new Date();
const start = new Date();
start.setDate(start.getDate() - 1);
const dateRange = ref([start, end]);

const loading = ref(false);

/* ==========================================================
   SUMMARY CARDS
========================================================== */

const summaryCards = ref([
  { title: "Forex", amount: 0, lots: 0 },
  { title: "Forex", amount: 0, lots: 0 },
  { title: "Forex", amount: 0, lots: 0 },
  { title: "Forex", amount: 0, lots: 0 },
  { title: "Forex", amount: 0, lots: 0 },
  { title: "Forex", amount: 0, lots: 0 },
]);

/* ==========================================================
   TABLE DATA
========================================================== */

const reports = ref([]);

/* ==========================================================
   SEARCH
========================================================== */

const keyword = ref("");
const filteredReports = computed(() => {
  if (!keyword.value) return reports.value;

  return reports.value.filter((item) => {
    const searchTarget = reportMode.value === "date" ? item.day : item.account;
    return searchTarget?.toLowerCase().includes(keyword.value.toLowerCase());
  });
});

/* ==========================================================
   TOGGLES
========================================================== */

const reportMode = ref("account");

const reportModes = [
  { label: "Date", value: "date" },
  { label: "Account", value: "account" },
];

const period = ref("week");
const periods = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Years", value: "years" },
];

/* ==========================================================
   TOTALS
========================================================== */

const totalRecords = computed(() => reports.value.length);

/* ==========================================================
   FORMATTERS
========================================================== */

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ==========================================================
   EVENTS
========================================================== */

function updateReport() {
  console.log("Update Report");
}
function downloadReport() {
  console.log("Download Report");
}
function refreshReport() {
  console.log("Refresh Report");
}
function clearFilters() {
  dateType.value = "month_to_date";
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 1);
  dateRange.value = [start, end];
  instrument.value = "all";
  keyword.value = "";
}
function changePeriod(value) {
  period.value = value;
}
function changeMode(value) {
  reportMode.value = value;
}

/* ==========================================================
   TABLE HEADERS
========================================================== */

const activeColumns = computed(() => {
  if (reportMode.value === "date") {
    return [
      { key: "day", label: "DAY" },
      { key: "notional", label: "NOTIONAL VALUE" },
      { key: "rebate", label: "TOTAL REBATE", align: "right" },
    ];
  } else {
    // account mode
    return [
      { key: "account", label: "ACCOUNT" },
      { key: "notional", label: "NOTIONAL VALUE" },
      { key: "rebate", label: "TOTAL REBATE", align: "right" },
    ];
  }
});
</script>
