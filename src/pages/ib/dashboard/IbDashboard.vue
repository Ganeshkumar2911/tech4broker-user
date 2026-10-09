<template>
  <div class="space-y-6">
    <div class="flex-1 flex flex-col">
      <main class="flex-1 pb-10 space-y-8">
        <!-- Competitions Banner -->
        <div id="tour-ib-competitions-banner">
          <CompetitionsBanner
            :loading="bannersStore.loading"
            :items="bannersStore.banners"
          />
        </div>

        <div class="flex items-center gap-1.5">
          <h1 class="text-2xl font-bold text-primary-text">Dashboard</h1>
          <Tooltip text="IB overview with commissions, performance metrics, and referral links" position="top" wrap>
            <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
          </Tooltip>
        </div>

        <!-- Rebate + Link cards -->
        <div
          class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0 w-full"
        >
          <!-- Rebate card -->
          <BaseCard id="tour-ib-commission-card" class="w-full h-full cursor-pointer" wrapperClass="h-full" @click="goToWallet">
            <div
              v-if="store.loadingDashboard"
              class="flex-1 flex flex-col justify-between w-full h-full space-y-3.5 sm:space-y-4 animate-pulse"
            >
              <!-- <div class="h-4 w-28 sm:w-36 rounded bg-white/10"></div> -->

              <div class="flex justify-between items-center w-full">
                <div class="h-7 w-28 rounded-full bg-white/10"></div>
                <div class="h-7 w-7 rounded-full bg-white/10"></div>
              </div>

              <div
                class="rounded-xl sm:rounded-2xl bg-card-background/40 p-3 sm:px-4 sm:py-3 grid grid-cols-2 gap-4 items-center"
              >
                <div class="space-y-2 border-r border-white/10 pr-4">
                  <div class="h-3 w-20 sm:w-24 rounded bg-white/10"></div>
                  <div
                    class="h-6 sm:h-7 w-24 sm:w-32 rounded bg-white/10"
                  ></div>
                </div>
                <div class="space-y-2 pl-2 sm:pl-4">
                  <div class="h-3 w-20 sm:w-24 rounded bg-white/10"></div>
                  <div
                    class="h-6 sm:h-7 w-24 sm:w-28 rounded bg-white/10"
                  ></div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 sm:gap-3">
                <div class="h-9 sm:h-10 rounded-full bg-white/10"></div>
                <div class="h-9 sm:h-10 rounded-full bg-white/10"></div>
              </div>
            </div>

            <div
              v-else
              class="flex-1 flex flex-col gap-3.5 sm:gap-2 justify-between min-w-0"
            >
              <!-- <div class="flex items-center justify-between gap-1 min-w-0">
                <p class="text-xs sm:text-sm text-white/70 truncate">
                  <span class="font-extralight">Rebate Account: </span>
                  <span class="text-white font-semibold">{{
                    rebateAccountNumber
                  }}</span>
                </p>
              </div> -->

              <div
                class="flex justify-between items-center w-full gap-2 min-w-0"
              >
                <div
                  class="inline-flex items-center gap-1.5 sm:gap-2 rounded-full w-fit bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 text-2xs sm:text-xs font-medium"
                >
                  <img
                    :src="usFlg"
                    class="w-4 h-3.5 rounded-[1px] object-cover"
                    alt="US Flag"
                  />
                  US DOLLAR
                </div>
                <Tooltip :text="isMasked ? 'Show Balance' : 'Hide Balance'" position="top">
                  <button
                    type="button"
                    @click.stop="toggleMask"
                    class="cursor-pointer flex justify-center items-center w-fit bg-white/10 p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors shrink-0"
                    aria-label="Toggle details visibility"
                  >
                    <BaseIcon
                      :name="isMasked ? 'visibility_off' : 'remove_red_eye'"
                      :size="14"
                    />
                  </button>
                </Tooltip>
              </div>

              <div
                class="rounded-xl sm:rounded-2xl bg-[#1C2334] p-3 sm:px-4 sm:py-3 grid grid-cols-2 gap-2 sm:gap-4 items-center min-w-0"
              >
                <div class="min-w-0 pr-3 sm:pr-4 border-r border-white/10">
                  <div class="flex items-center gap-1.5 text-white/60 mb-1">
                    <Tooltip
                      text="Total commission earned across all referrals and tiers"
                      position="center"
                      wrap
                    >
                      <Info
                        :size="11"
                        class="text-white/40 hover:text-white/80 transition-colors cursor-pointer shrink-0"
                      />
                    </Tooltip>
                    <span class="text-[11px] sm:text-xs truncate"
                      >Total Commission</span
                    >
                  </div>
                  <p
                    class="text-sm sm:text-base md:text-lg font-bold truncate font-mono"
                  >
                    {{ formattedCommission }}
                    <span
                      class="text-[11px] sm:text-sm font-medium text-white/70 ml-0.5"
                      >USD</span
                    >
                  </p>
                </div>
                <div class="text-right min-w-0 pl-3 sm:pl-4">
                  <div
                    class="flex items-center justify-end gap-1.5 text-white/60 mb-1"
                  >
                    <Tooltip
                      text="Current balance available for internal transfer or crypto withdrawal"
                      position="end"
                      wrap
                    >
                      <Info
                        :size="11"
                        class="text-white/40 hover:text-white/80 transition-colors cursor-pointer shrink-0"
                      />
                    </Tooltip>
                    <span class="text-[11px] sm:text-xs truncate"
                      >Available Balance</span
                    >
                  </div>
                  <p
                    class="text-sm sm:text-base md:text-lg font-bold truncate font-mono"
                  >
                    {{ formattedAvailableBalance }}
                    <span
                      class="text-[11px] sm:text-sm font-medium text-white/70 ml-0.5"
                      >USD</span
                    >
                  </p>
                </div>
              </div>

              <div
                class="grid grid-cols-2 sm:flex sm:flex-nowrap lg:grid lg:grid-cols-2 xl:flex xl:flex-nowrap items-center gap-2 min-w-0"
              >
                <Tooltip text="Internal Transfer" position="top" class="sm:flex-1 lg:w-full xl:w-auto xl:flex-1">
                  <button
                    type="button"
                    @click.stop="onTransfer"
                    class="w-full inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 xl:px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap active:scale-[0.98] transition-all"
                  >
                    <ArrowLeftRight class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    Transfer
                  </button>
                </Tooltip>

                <Tooltip text="Withdraw Funds" position="top" class="sm:flex-1 lg:w-full xl:w-auto xl:flex-1">
                  <button
                    type="button"
                    @click.stop="onWithdraw"
                    class="w-full inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 xl:px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap active:scale-[0.98] transition-all"
                  >
                    <ArrowUpLeft class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    Withdraw
                  </button>
                </Tooltip>
              </div>
            </div>
          </BaseCard>

          <BaseCard
            id="tour-ib-referral-link"
            class="w-full h-full"
            wrapperClass="h-full bg-none bg-white dark:bg-card-background text-primary-text"
            :show-shine="false"
          >
            <div
              v-if="store.isLoadingFetchURL"
              class="flex-1 flex flex-col justify-between w-full h-full gap-3.5 sm:gap-4 animate-pulse"
            >
              <div class="space-y-2 w-full min-w-0">
                <div class="h-4 w-12 bg-primary-border rounded-md mb-2"></div>
                <div class="h-3 w-16 bg-primary-border rounded-md"></div>
                <div
                  class="h-10 sm:h-11 bg-primary-border rounded-xl w-full"
                ></div>
              </div>

              <div
                class="w-full border-b border-primary-border my-1 sm:my-2"
              ></div>

              <div class="w-full min-w-0 space-y-2">
                <div class="h-3 w-36 bg-primary-border rounded-md"></div>
                <div
                  class="h-10 sm:h-11 bg-primary-border rounded-xl w-full"
                ></div>
              </div>
            </div>

            <div v-else-if="store.campaigns.length === 0">
              <p class="text-xs text-secondary-text py-12 text-center">
                No referral links available
              </p>
            </div>

            <div
              v-else
              class="flex-1 flex flex-col gap-3.5 sm:gap-2 md:gap-0 justify-between items-start w-full min-w-0"
            >
              <div class="space-y-1.5 sm:space-y-2 w-full min-w-0">
                <div class="flex items-center gap-1.5 mb-1 sm:mb-2">
                  <h2 class="text-sm sm:text-base font-bold text-primary-text">
                    Link
                  </h2>
                  <Tooltip text="Generate and copy custom referral links for your IB campaigns" position="top" wrap>
                    <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                  </Tooltip>
                </div>
                <label
                  class="text-[11px] sm:text-xs font-bold uppercase text-primary-text block"
                  >IB Plan</label
                >
                <BaseSelect
                  v-model="store.selectedCode"
                  :options="selectOptions"
                  variant="surface"
                  placeholder="Select plan..."
                  :isLoading="store.isLoadingFetchURL"
                />
              </div>

              <div
                class="w-full border-b border-primary-border my-1 sm:my-2"
              ></div>

              <div class="w-full min-w-0">
                <label
                  class="text-[11px] sm:text-xs font-bold text-primary-text block capitalize"
                >
                  {{ invitationLinkLabel }}
                </label>

                <div
                  class="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 rounded-xl border border-primary-border bg-background px-3 sm:px-4 h-10 sm:h-11 w-full min-w-0"
                >
                  <Link2
                    class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary-text shrink-0"
                  />

                  <input
                    type="text"
                    readonly
                    :value="selectedUrl"
                    class="bg-transparent border-none text-[11px] sm:text-xs font-medium text-primary-text focus:outline-none flex-1 min-w-0 truncate select-all"
                  />

                  <Tooltip text="Copy Invitation Link" position="left">
                    <button
                      @click="copyToClipboard"
                      class="p-1 sm:p-1.5 rounded-md hover:bg-card-background border border-transparent hover:border-primary-border text-secondary-text hover:text-primary transition-all duration-150 shrink-0 cursor-pointer"
                      aria-label="Copy to clipboard"
                    >
                      <Copy :size="14" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Performance -->
        <div>
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <div class="flex items-center gap-1.5">
              <h2 class="text-xl sm:text-2xl font-bold text-primary-text">
                Performance
              </h2>
              <Tooltip text="Track volume, deposits, and withdrawal performance over time" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
              <BaseDateRangePicker
                class="w-fit"
                borderless
                v-model="dateRange"
                placement="right"
                @apply="fetchGraph"
              />

              <Tooltip text="Refresh Performance" position="left">
                <RefreshButton
                  :loading="store.loadingGraph || store.loadingDashboard"
                  :icon-size="16"
                  @click="onRefresh"
                />
              </Tooltip>
            </div>
          </div>

          <!-- Combined card: Stats row + Chart -->
          <div id="tour-ib-performance-chart" class="rounded-2xl bg-card-background p-2 sm:p-6">
            <!-- Stats row -->
            <div
              v-if="store.loadingGraph && !store.graphData"
              class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6"
            >
              <div
                v-for="i in 2"
                :key="i"
                class="animate-pulse rounded-[22px] sm:rounded-[26px] p-4 sm:p-5 bg-background space-y-4"
              >
                <div class="h-6 w-6 rounded bg-white/10"></div>
                <div class="space-y-2">
                  <div class="h-3.5 w-20 rounded bg-white/10"></div>
                  <div class="h-6 w-24 rounded bg-white/10"></div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6"
            >
              <Tooltip
                v-for="metric in metrics"
                :key="metric.id"
                :text="metric.id === 'withdraw_deposit' ? 'Net funding (Total Deposits minus Total Withdrawals of complete IB tree)' : 'Total referred trading accounts'"
                position="top"
                class="w-full"
              >
                <StatMetric
                  :id="metric.id"
                  :icon="metric.icon"
                  :label="metric.label"
                  :value="metric.value"
                  :unit="metric.unit"
                  :active="selectedMetric === metric.id"
                  @select="onSelectMetric"
                />
              </Tooltip>
            </div>

            <!-- Chart -->
            <div class="px-1 sm:px-2 pb-2">
              <PerformanceChart
                :graph="store.graphData?.graph || store.graphData || []"
                :type="selectedMetric"
                :loading="store.loadingGraph"
              />
            </div>
          </div>
        </div>

        <!-- Bottom tables -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            id="tour-ib-top-accounts"
            class="rounded-2xl bg-card-background p-4 sm:p-6 flex flex-col h-80 sm:h-90"
          >
            <div class="flex items-center gap-1.5 mb-3 sm:mb-4 shrink-0">
              <h3 class="text-base font-bold text-primary-text">
                Top Performing Accounts for this month
              </h3>
              <Tooltip text="Highest volume and deposit generating client accounts for current month" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <div class="flex-1 min-h-0 w-full">
              <DataTable
                :columns="topAccountsColumns"
                :rows="topAccounts"
                :loading="store.loadingDashboard"
                :skeleton-rows="4"
                rowKey="account_number"
                emptyText="No data available to show"
                stickyHeader
                dense
              >
                <template #cell-account_number="{ row }">
                  <div class="flex items-center gap-1.5">
                    <span>{{ row.account_number || "-" }}</span>
                    <BaseBadge
                      v-if="row.account_type && row.account_type !== '-'"
                      :value="row.account_type"
                      size="2xs"
                      text-case="uppercase"
                    />
                  </div>
                </template>
                <template #cell-client_name="{ row }">
                  {{ row.client_name || row.name || "-" }}
                </template>
                <template #cell-ib_name="{ row }">
                  {{ row.opened_under_ib?.ib_name || "-" }}
                </template>
                <template #cell-pnl="{ row }">
                  <span
                    v-if="row.pnl_account_units !== null && row.pnl_account_units !== undefined"
                    class="font-mono tabular-nums"
                    :class="
                      Number(row.pnl_account_units) > 0
                        ? 'text-emerald-500'
                        : Number(row.pnl_account_units) < 0
                          ? 'text-rose-500'
                          : 'text-primary-text'
                    "
                  >
                    {{ Number(row.pnl_account_units) > 0 ? '+' : '' }}{{ formatMoney(row.pnl_account_units, row.broker_currency || row.currency) }}
                  </span>
                  <span v-else class="text-secondary-text">-</span>
                </template>
              </DataTable>
            </div>
          </div>

          <div
            class="rounded-2xl bg-card-background p-4 sm:p-6 flex flex-col h-80 sm:h-90"
          >
            <div class="flex items-center gap-1.5 mb-3 sm:mb-4 shrink-0">
              <h3 class="text-base font-bold text-primary-text">
                Recently Opened Accounts
              </h3>
              <Tooltip text="Latest client trading accounts opened through your referral link" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <div class="flex-1 min-h-0 w-full">
              <DataTable
                :columns="recentAccountsColumns"
                :rows="recentAccounts"
                :loading="store.loadingDashboard"
                :skeleton-rows="4"
                rowKey="id"
                emptyText="No data available to show"
                stickyHeader
                dense
              >
                <template #cell-account_number="{ row }">
                  <div class="flex items-center gap-1.5">
                    <span>{{ row.account_number || "-" }}</span>
                    <BaseBadge
                      v-if="row.account_type && row.account_type !== '-'"
                      :value="row.account_type"
                      size="2xs"
                      text-case="uppercase"
                    />
                  </div>
                </template>
                <template #cell-client_name="{ row }">
                  <div class="font-medium">
                    {{ row.client_name || "-" }}
                  </div>
                  <div
                    v-if="row.client_email"
                    class="text-2xs text-secondary-text"
                  >
                    {{ row.client_email }}
                  </div>
                </template>
                <template #cell-balance="{ row }">
                  {{
                    row.balance !== null && row.balance !== undefined
                      ? formatMoney(row.balance, row.currency)
                      : "-"
                  }}
                </template>
                <template #cell-kyc_status="{ row }">
                  <BaseBadge v-if="row.kyc_status" :value="row.kyc_status" />
                  <span v-else class="text-secondary-text">-</span>
                </template>
              </DataTable>
            </div>
          </div>
        </div>

        <AccountsDisclaimer />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Eye,
  Info,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  Link2,
  Copy,
  RefreshCw,
  ArrowUpLeft,
} from "lucide-vue-next";

import p1Icon from "@/assets/ib/p1.svg";
import p2Icon from "@/assets/ib/p2.svg";
import p3Icon from "@/assets/ib/p3.svg";
import p4Icon from "@/assets/ib/p4.svg";
import p5Icon from "@/assets/ib/p5.svg";
import p6Icon from "@/assets/ib/p6.svg";
import p7Icon from "@/assets/ib/p7.svg";

import CompetitionsBanner from "@/components/common/CompetitionsBanner.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import StatMetric from "@/components/ib/dashboard/StatMetric.vue";
import PerformanceChart from "@/components/ib/dashboard/PerformanceChart.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useIBDashboard } from "@/stores/ib/dashboard.js";
import { useBannersStore } from "@/stores/shared/banners";
import { formatBrokerCurrency } from "@/utils/formatters";
import BaseCard from "../../../components/base/BaseCard.vue";
import BaseIcon from "../../../components/base/BaseIcon.vue";
import usFlg from "@/assets/us-flg.svg";

const bannersStore = useBannersStore();

const router = useRouter();

const money = (val) => {
  return Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatMoney = (val, currency = "USD") => {
  if (val === null || val === undefined || isNaN(val)) return "-";
  const sym = formatBrokerCurrency(currency);
  return `${sym}${money(val)}`;
};

const onTransfer = () => {
  router.push({
    name: "ib-funds",
    query: { tab: "transfer" },
  });
};

const onWithdraw = () => {
  router.push({
    name: "ib-funds",
    query: { tab: "withdraw" },
  });
};

const goToWallet = () => {
  router.push('/ib-wallet');
};

const isMasked = ref(false);

const toggleMask = () => {
  isMasked.value = !isMasked.value;
};

const rebateAccountNumber = computed(() => {
  return (
    store.dashboardData?.Account_details?.rebate_account ||
    store.dashboardData?.overview?.account_number ||
    store.dashboardData?.overview?.account ||
    "-"
  );
});

const formattedCommission = computed(() => {
  if (isMasked.value) return "*****";
  const val =
    store.dashboardData?.Account_details?.total_commission ??
    store.dashboardData?.overview?.total_commission ??
    store.dashboardData?.summary?.total_commission ??
    0;
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const formattedAvailableBalance = computed(() => {
  if (isMasked.value) return "*****";
  const val =
    store.dashboardData?.Account_details?.available_balance ??
    store.dashboardData?.overview?.available_balance ??
    0;
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const selectedMetric = ref("withdraw_deposit");

const selectedChart = computed(() => {
  const graph = store.dashboardData?.graph || [];

  return {
    labels: graph.map((item) =>
      new Date(item.date).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
      }),
    ),

    values: graph.map((item) => item.value),
  };
});

const snackbar = useSnackbarStore();
const store = useIBDashboard();

const end = new Date();
const start = new Date();
start.setDate(start.getDate() - 30);
const dateRange = ref([start, end]);

const selectedUrl = computed(() => {
  if (!store.selectedCode) return "";
  return `${window.location.origin}/register?ref=${store.selectedCode}`;
});

const selectOptions = computed(() => {
  return store.campaigns.map((c) => ({
    label: c.name || c.code,
    value: c.code,
  }));
});

const selectedCampaign = computed(() => {
  return store.campaigns.find((c) => c.code === store.selectedCode) || null;
});

const topAccountsColumns = [
  {
    key: "account_number",
    label: "Account No.",
    tooltip: "Unique trading account identifier",
    align: "left",
    cellClass: "font-mono text-primary-text",
  },
  {
    key: "client_name",
    label: "Name",
    tooltip: "Name of the referred client",
    align: "left",
    cellClass: "text-primary-text",
  },
  {
    key: "ib_name",
    label: "IB Name",
    tooltip: "Name of the IB",
    align: "left",
    cellClass: "text-primary-text",
  },
  {
    key: "pnl",
    label: "PnL",
    tooltip: "Profit and loss of the account",
    align: "right",
    cellClass: "font-mono text-right",
  },
];

const recentAccountsColumns = [
  {
    key: "account_number",
    label: "Account No.",
    tooltip: "Unique trading account identifier",
    align: "left",
    cellClass: "font-mono text-primary-text",
  },
  {
    key: "client_name",
    label: "Name",
    tooltip: "Referred client name and email",
    align: "left",
    cellClass: "text-primary-text",
  },
  {
    key: "balance",
    label: "Balance",
    tooltip: "Current account balance",
    align: "left",
    cellClass: "font-mono text-primary-text",
  },
  {
    key: "kyc_status",
    label: "KYC Status",
    tooltip: "Client verification and KYC status",
    align: "right",
    cellClass: "text-right",
  },
];

const topAccounts = computed(() => {
  return (
    store.dashboardData?.top_5_accounts ||
    store.dashboardData?.top_performing_accounts ||
    store.dashboardData?.top_accounts ||
    []
  );
});

const recentAccounts = computed(() => {
  if (store.dashboardData?.recent_joined_clients) {
    const list = [];
    store.dashboardData.recent_joined_clients.forEach((client) => {
      if (client.trading_accounts && client.trading_accounts.length > 0) {
        client.trading_accounts.forEach((acc) => {
          list.push({
            id: acc.trading_account_id || acc.account_number,
            account_number: acc.account_number,
            client_name: client.client_name,
            client_email: client.client_email,
            balance: acc.balance ?? 0,
            currency: acc.currency || acc.broker_currency || "USD",
            account_type: acc.account_type,
            kyc_status: client.kyc_status,
            joined_at: client.joined_at,
          });
        });
      } else {
        list.push({
          id: client.client_id,
          account_number: "-",
          client_name: client.client_name,
          client_email: client.client_email,
          balance: null,
          currency: client.currency || "USD",
          account_type: "-",
          kyc_status: client.kyc_status,
          joined_at: client.joined_at,
        });
      }
    });
    return list;
  }

  const rawList =
    store.dashboardData?.recently_opened_accounts ||
    store.dashboardData?.recent_accounts ||
    [];

  return rawList.map((item) => ({
    ...item,
    currency: item.currency || item.broker_currency || "USD",
  }));
});

const invitationLinkLabel = computed(() => {
  if (!selectedCampaign.value) return "live account invitation link";
  const groups = selectedCampaign.value.groups || [];
  if (groups.length > 0) {
    const type = groups[0].account_type || "live";
    return `${type.toLowerCase()} account invitation link`;
  }
  return "live account invitation link";
});

const copyToClipboard = async () => {
  if (!selectedUrl.value) return;
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(selectedUrl.value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = selectedUrl.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    snackbar.show("Link copied successfully.", "success");
  } catch (err) {
    snackbar.show("Failed to copy link.", "error");
  }
};

const formatDateParam = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchGraph = () => {
  const [start, end] = dateRange.value || [];
  const params = {
    type: selectedMetric.value,
  };
  if (start) {
    params.from_date = formatDateParam(start);
  }
  if (end) {
    params.to_date = formatDateParam(end);
  }
  store.fetchGraphData(params);
};

const onSelectMetric = (metricId) => {
  if (selectedMetric.value === metricId) return;
  selectedMetric.value = metricId;
  fetchGraph();
};

const onRefresh = () => {
  // store.fetchReferalUrl();
  // store.fetchDashboardData();
  fetchGraph();
  bannersStore.fetchBanners();
};

onMounted(() => {
  store.fetchReferalUrl();
  store.fetchDashboardData();
  fetchGraph();
  bannersStore.fetchBanners();
});

const metrics = computed(() => {
  const data = store.graphData || store.dashboardData;

  const copyDeposit = Number(data?.copy_trading?.total_deposit) || 0;
  const realDeposit = Number(data?.real?.total_deposit) || 0;
  const totalDeposit = copyDeposit + realDeposit;

  const copyWithdrawal = Number(data?.copy_trading?.total_withdrawal) || 0;
  const realWithdrawal = Number(data?.real?.total_withdrawal) || 0;
  const totalWithdrawal = copyWithdrawal + realWithdrawal;

  const netDeposit =
    data?.summary?.net_deposit ??
    data?.summary?.net_funding ??
    totalDeposit - totalWithdrawal;

  const copyAccounts = Number(data?.copy_trading?.accounts) || 0;
  const realAccounts = Number(data?.real?.accounts) || 0;
  const openedAccounts = Number(data?.summary?.opened_accounts) || 0;
  const newClients = Number(data?.summary?.new_clients) || 0;

  // Combination of copy_trading and real accounts
  const totalAccounts =
    data?.copy_trading !== undefined || data?.real !== undefined
      ? copyAccounts + realAccounts
      : (data?.summary?.accounts_count ??
         data?.summary?.total_accounts ??
         openedAccounts + newClients);

  return [
    {
      id: "withdraw_deposit",
      label: "Net Funding",
      value: netDeposit,
      unit: "USD",
      icon: p3Icon,
    },
    {
      id: "opened_accounts",
      label: "Accounts",
      value: totalAccounts,
      unit: "",
      icon: p5Icon,
    },
  ];
});
</script>
