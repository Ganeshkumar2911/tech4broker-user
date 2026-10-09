<template>
  <div class="min-h-screen">
    <!-- Container -->
    <div class="mx-auto">
      <BaseTabs
        v-model="activeTab"
        active-class="bg-button text-button-text font-bold"
        inactive-class="text-secondary-text hover:text-primary-text"
        :tabs="ibReportsTabs"
      />

      <div class="mt-6">
        <component :is="activeTabComponents[activeTab]" />
      </div>

      <!-- <Disclaimer :data="disclaimerData" /> -->
    </div>
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
import RebatReports from "@/components/ib/reports/RebatReports.vue";
import FundsReports from "@/components/ib/reports/FundsReports.vue";
import CashbackReports from "@/components/ib/reports/CashbackReports.vue";
import SubIBReports from "@/components/ib/reports/SubIBReports.vue";
import Disclaimer from "@/components/common/Disclaimer.vue";

/* ---------------------------------------
   Tabs
--------------------------------------- */
const activeTab = ref("rebat-report");

const activeTabComponents = {
  "rebat-report": RebatReports,
  "funds-report": FundsReports,
  "cashback-report": CashbackReports,
  "sub-ib-report": SubIBReports,
};

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

const ibReportsTabs = [
  { label: "Rebate Report", value: "rebat-report" },
  { label: "Funds Report", value: "funds-report" },
  { label: "Cashback Report", value: "cashback-report" },
  { label: "Sub IB Report", value: "sub-ib-report" },
];

/* ---------------------------------------
   Filters
--------------------------------------- */

const dateType = ref("Month to date");

const dateTypes = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Month to date",
  "This Month",
  "Last Month",
  "Custom",
];

const dateRange = ref({
  start: "09/07/2026",
  end: "10/07/2026",
});

/* ---------------------------------------
   Summary Card
--------------------------------------- */

const summary = ref({
  currency: "USD",
  flag: "🇺🇸",

  netFunding: 1252.012,

  totalDeposit: 1252.012,

  totalWithdraw: 0,
});

/* ---------------------------------------
   Search
--------------------------------------- */

const search = ref("");

/* ---------------------------------------
   Table
--------------------------------------- */

const reports = ref([
  /*
  {
      id:1,
      date:"09/07/2026",
      userId:"100345",
      name:"John Doe",
      account:"MT5-223344",
      deposit:300,
      withdraw:0,
      netFunding:300
  }
  */
]);

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

function money(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
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

/* ---------------------------------------
   Empty State
--------------------------------------- */

const emptyMessage = {
  title: "No Data",
  subtitle: "There is no data to show you right now",
};

/* ---------------------------------------
   Table Columns
--------------------------------------- */

const columns = [
  "DATE",
  "USER ID",
  "NAME",
  "ACCOUNT",
  "DEPOSIT",
  "WITHDRAW",
  "NET FUNDING",
];
</script>
