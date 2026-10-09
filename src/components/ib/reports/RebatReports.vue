<template>
  <div>
    <div class="mt-6 flex flex-wrap items-center gap-5">
      <!-- Date Range Selector -->
      <BaseDateRangePicker placement="left" borderless v-model="dateRange" />
    </div>

    <!-- Summary BaseCard -->
    <div class="mt-6">
      <BaseCard class="w-full" wrapperClass="h-auto">
        <!-- Loading Skeleton -->
        <div
          v-if="loading"
          class="flex-1 flex flex-col justify-between w-full h-full space-y-3.5 sm:space-y-4 animate-pulse"
        >
          <div class="flex justify-between items-center w-full">
            <div class="h-7 w-28 rounded-full bg-white/10"></div>
            <div class="h-7 w-7 rounded-full bg-white/10"></div>
          </div>

          <div class="space-y-2">
            <div class="h-3 w-20 rounded bg-white/10"></div>
            <div class="h-7 w-32 rounded bg-white/10"></div>
          </div>

          <div
            class="rounded-xl sm:rounded-2xl bg-card-background/40 p-3 sm:px-4 sm:py-3 grid grid-cols-2 gap-4 items-center"
          >
            <div class="space-y-2 border-r border-white/10 pr-4">
              <div class="h-3 w-20 rounded bg-white/10"></div>
              <div class="h-6 w-24 rounded bg-white/10"></div>
            </div>
            <div class="space-y-2 pl-2 sm:pl-4">
              <div class="h-3 w-20 rounded bg-white/10"></div>
              <div class="h-6 w-24 rounded bg-white/10"></div>
            </div>
          </div>
        </div>

        <!-- Loaded Card Content -->
        <div
          v-else
          class="flex-1 flex flex-col gap-4 sm:gap-5 justify-between min-w-0"
        >
          <!-- Header -->
          <div class="flex justify-between items-center w-full gap-2 min-w-0">
            <div
              class="inline-flex items-center gap-1.5 sm:gap-2 rounded-full w-fit bg-white/10 px-3 sm:px-3.5 py-1 sm:py-1.5 text-xs font-semibold uppercase tracking-wide"
            >
              <img
                :src="usFlg"
                class="w-4 h-3.5 rounded-[1px] object-cover"
                alt="US Flag"
              />
              <span>US Dollar</span>
            </div>

            <button
              type="button"
              @click="toggleMask"
              class="cursor-pointer flex justify-center items-center w-fit bg-white/10 p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors shrink-0"
              aria-label="Toggle details visibility"
            >
              <BaseIcon
                :name="isMasked ? 'visibility_off' : 'remove_red_eye'"
                :size="16"
              />
            </button>
          </div>

          <!-- Net Funding -->
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 text-white/60">
              <span class="text-xs sm:text-[13px]">Net Funding</span>
              <Tooltip
                text="Net funding calculated as total deposits minus total withdrawals"
                position="right"
              >
                <Info
                  :size="11"
                  class="text-white/40 hover:text-white/80 transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>

            <div class="flex items-end gap-2">
              <h2
                class="text-lg font-bold leading-none tracking-tight font-mono"
              >
                {{ formattedNetFunding }}
              </h2>
              <p class="text-[11px] font-semibold text-white/70">USD</p>
            </div>
          </div>

          <!-- Bottom (Deposit & Withdrawal) -->
          <div
            class="rounded-xl sm:rounded-2xl bg-card-background/40 p-3 sm:px-5 sm:py-4 grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4 items-center min-w-0"
          >
            <!-- Deposit -->
            <div
              class="min-w-0 pr-3 sm:pr-4 min-[400px]:border-r border-white/10"
            >
              <div class="flex items-center gap-1.5 text-white/60 mb-1">
                <span class="text-[11px] sm:text-xs">Total Deposit</span>
                <Tooltip
                  text="Total amount deposited during the selected period"
                  position="right"
                >
                  <Info
                    :size="11"
                    class="text-white/40 hover:text-white/80 transition-colors cursor-pointer shrink-0"
                  />
                </Tooltip>
              </div>

              <div class="flex items-end gap-1.5">
                <h3 class="text-lg font-bold leading-none font-mono">
                  {{ formattedTotalDeposit }}
                </h3>
                <span class="text-[11px] font-semibold text-white/70">
                  USD
                </span>
              </div>
            </div>

            <!-- Withdrawal -->
            <div
              class="min-w-0 min-[400px]:text-right min-[400px]:pl-3 sm:pl-4"
            >
              <div
                class="flex items-center min-[400px]:justify-end gap-1.5 text-white/60 mb-1"
              >
                <span class="text-[11px] sm:text-xs">Total Withdrawal</span>
                <Tooltip
                  text="Total amount withdrawn during the selected period"
                  position="end"
                >
                  <Info
                    :size="11"
                    class="text-white/40 hover:text-white/80 transition-colors cursor-pointer shrink-0"
                  />
                </Tooltip>
              </div>

              <div class="flex items-end min-[400px]:justify-end gap-1.5">
                <h3 class="text-lg font-bold leading-none font-mono">
                  {{ formattedTotalWithdrawal }}
                </h3>
                <span class="text-[11px] font-semibold text-white/70">
                  USD
                </span>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    
    <div
      class="mt-6 overflow-hidden rounded-[28px] border-0 shadow-none py-6"
    >
      <!-- Search on left, Download & Refresh at the right end -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <BaseSearch
          v-model="search"
          placeholder="Search with user id, name..."
          container-class="w-full sm:w-[280px]"
        />
        <div class="flex items-center gap-3 shrink-0">
          <DownloadButton @click="downloadReport" />
          <button
            type="button"
            @click="refreshReport"
            class="flex items-center justify-center w-10 h-10 rounded-full bg-card-background border border-primary-border text-primary-text hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Refresh"
          >
            <BaseIcon
              name="refresh"
              :size="18"
              :class="{ 'animate-spin': loading }"
            />
          </button>
        </div>
      </div>

      <!-- Table -->
      <WatchDataTable
        :rows="marketRows"
        :columns="marketColumns"
        :loading="loading"
        :show-summary="false"
      />
    </div>
    <Disclaimer :data="disclaimerData" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

import {
  Search,
  Download,
  RefreshCw,
  CalendarDays,
  ChevronDown,
  Eye,
  Info,
} from "lucide-vue-next";
import BaseTabs from "@/components/base/BaseTabs.vue";
import DownloadButton from "@/components/base/DownloadButton.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import Disclaimer from "@/components/common/Disclaimer.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import BaseCard from "@/components/base/BaseCard.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import usFlg from "@/assets/us-flg.svg";

const dateRange = ref([null, null]);
const loading = ref(false);
const page = ref(1);

/* ---------------------------------------
   Summary & Masking
--------------------------------------- */

const isMasked = ref(true);

const toggleMask = () => {
  isMasked.value = !isMasked.value;
};

const summary = ref({
  currency: "USD",
  netFunding: 1252.012,
  totalDeposit: 1252.012,
  totalWithdrawal: 0.0,
});

const formattedNetFunding = computed(() => {
  if (isMasked.value) return "***";
  return money(summary.value.netFunding, 3, 3);
});

const formattedTotalDeposit = computed(() => {
  if (isMasked.value) return "***";
  return money(summary.value.totalDeposit, 3, 3);
});

const formattedTotalWithdrawal = computed(() => {
  if (isMasked.value) return "***";
  return money(summary.value.totalWithdrawal, 2, 2);
});

const ibReportsTabs = [
  { label: "Rebat Report", value: "rebat-report" },
  { label: "Funds Report", value: "funds-report" },
  { label: "Cashback Report", value: "cashback-report" },
  { label: "Sub IB Report", value: "sub-ib-report" },
];

const dateType = ref("Month to date");

const disclaimerData = [
  {
    heading: "Disclaimer",
    description:
      "The information presented on this page is intended exclusively for informational and regulatory transparency purposes. It should not be interpreted as an invitation, solicitation, or recommendation to participate in any financial service, investment, or transaction. Trading leveraged financial instruments such as Foreign Exchange (Forex) and Contracts for Difference (CFDs) carries substantial risk and can result in losses exceeding the initial capital invested. These products may not be appropriate for every investor, as leverage magnifies both profits and losses, and traders do not gain ownership of the underlying assets. Historical performance is not a reliable indicator of future outcomes..",
  },
  {
    heading: "Regional Restrictions",
    description:
      "The information presented on this page is intended exclusively for informational and regulatory transparency purposes. It should not be interpreted as an invitation, solicitation, or recommendation to participate in any financial service, investment, or transaction. Trading leveraged financial instruments such as Foreign Exchange (Forex) and Contracts for Difference (CFDs) carries substantial risk and can result in losses exceeding the initial capital invested. These products may not be appropriate for every investor, as leverage magnifies both profits and losses, and traders do not gain ownership of the underlying assets. Historical performance is not a reliable indicator of future outcomes..",
  },
];

const marketColumns = [
  { label: "Date", key: "date" },
  { label: "User ID", key: "user_id" },
  { label: "Name", key: "name" },
  { label: "Account", key: "account" },
  { label: "Deposit", key: "deposit" },
  { label: "Withdraw", key: "withdraw" },
  { label: "Net Funding", key: "net_funding" },
];

const marketRows = ref([]);

const search = ref("");

const reports = ref([]);

const filteredReports = computed(() => {
  if (!search.value) return reports.value;

  const keyword = search.value.toLowerCase();

  return reports.value.filter((item) => {
    return (
      item.userId.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      item.account.toLowerCase().includes(keyword)
    );
  });
});

/* ---------------------------------------
   Total Records
--------------------------------------- */

const totalRecords = computed(() => filteredReports.value.length);

/* ---------------------------------------
   Formatting
--------------------------------------- */

function money(value, minDecimals = 2, maxDecimals = 3) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

/* ---------------------------------------
   Events
--------------------------------------- */

function changeTab(tab) {
  activeTab.value = tab;
}

function updateReport() {
  console.log("Update Report");
}

function downloadReport() {
  console.log("Download");
}

function refreshReport() {
  console.log("Refresh");
}
</script>
